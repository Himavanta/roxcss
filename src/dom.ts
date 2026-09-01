/**
 * 统一的 DOM 操作封装。
 * 库不依赖 DOM lib 类型（Node 测试环境无 document），
 * 所有浏览器 API 的接触点集中在此模块。
 */

/** 最小化构造样式表接口 */
export interface CSSStyleSheetLike {
  replaceSync(css: string): void;
}

/** 最小化文档接口 */
export interface DocumentLike {
  adoptedStyleSheets: CSSStyleSheetLike[];
}

const getDocument = (): DocumentLike | undefined =>
  (globalThis as { document?: unknown }).document as DocumentLike | undefined;

const CSSStyleSheetCtor = (globalThis as { CSSStyleSheet?: new () => CSSStyleSheetLike })
  .CSSStyleSheet;

/**
 * 把一段 CSS 文本写入新的构造样式表并 adopt 到文档。
 * 一次 replaceSync = 一次解析 + 一次样式失效，避免逐条 insertRule
 * 在"插入与强制布局交替"场景下触发 O(N²) 的同步样式重算（P0，见 docs/性能分析.md）。
 * 无 DOM（SSR/测试）或环境不支持时跳过，规则由调用方内存记录。
 */
export function adoptStyles(css: string) {
  const doc = getDocument();
  if (!doc || !CSSStyleSheetCtor) return;

  const sheet = new CSSStyleSheetCtor();
  sheet.replaceSync(css);
  doc.adoptedStyleSheets.push(sheet);
}
