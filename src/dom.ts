/**
 * 统一的 DOM 操作封装。
 * 库不依赖 DOM lib 类型（Node 测试环境无 document），
 * 所有浏览器 API 的接触点集中在此模块。
 */

/**
 * 单个 <style> 滚动桶的规则数上限：满则冻结当前桶并新建。
 * 1000 已浏览器实测定案（2026-09-02，权衡见 docs/样式表管理策略.md）。
 */
export const MAX_BUCKET_RULES = 1000;

/** 最小化 style 元素接口 */
export interface StyleElementLike {
  setAttribute(name: string, value: string): void;
  textContent: string;
}

/** 最小化 head 接口 */
export interface HeadLike {
  appendChild(node: StyleElementLike): void;
}

/** 最小化文档接口 */
export interface DocumentLike {
  createElement(tag: string): StyleElementLike;
  head: HeadLike | null;
}

/** 活动滚动桶：el 为 head 中的 <style>，rules 为其文本镜像 */
interface Bucket {
  el: StyleElementLike;
  rules: string[];
}

const getDocument = (): DocumentLike | undefined =>
  (globalThis as { document?: unknown }).document as DocumentLike | undefined;

let bucket: Bucket | null = null;

/** 在 head 挂一个新的 <style> 作为活动桶 */
function openBucket(doc: DocumentLike, head: HeadLike): Bucket {
  const el = doc.createElement("style");
  el.setAttribute("data-roxcss", "");
  head.appendChild(el);
  return { el, rules: [] };
}

/** 整体重写活动桶文本（一次解析 + 一次样式失效） */
function rewrite(b: Bucket) {
  b.el.textContent = b.rules.join("\n");
}

/**
 * 把规则文本追加进滚动 <style> 桶。
 * 活动桶满则冻结新建；容器数量收敛为 ceil(总规则数 / MAX_BUCKET_RULES)，
 * 避免每次 flush 一个容器导致 DevTools 面板堆积（方案沿革见 docs/样式表管理策略.md）。
 * 一次 textContent 赋值 = 一次解析 + 一次样式失效，避免逐条 insertRule
 * 在"插入与强制布局交替"场景下退化为 O(N²)（P0，见 docs/性能分析.md）。
 * 无 DOM（SSR/测试）时跳过，规则由调用方内存记录。
 */
export function flushStyles(rules: string[]): void {
  if (rules.length === 0) return;
  const doc = getDocument();
  if (!doc) return;
  const head = doc.head;
  if (!head) return;

  // 首次调用或活动桶已满：冻结当前桶，开新桶
  if (!bucket || bucket.rules.length === MAX_BUCKET_RULES) {
    bucket = openBucket(doc, head);
  }

  // 主路径（绝大多数调用）：本批全部放得下——追加后整体重写
  const room = MAX_BUCKET_RULES - bucket.rules.length;
  if (rules.length <= room) {
    bucket.rules.push(...rules);
    rewrite(bucket);
    return;
  }

  // 罕见路径：单批跨桶——填满当前桶，剩余部分交给新桶继续
  bucket.rules.push(...rules.slice(0, room));
  rewrite(bucket);
  flushStyles(rules.slice(room));
}
