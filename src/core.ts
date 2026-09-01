import type { MatcherNode, Modifier, RoxInstance, RoxOptions } from "./types.ts";

const isDev = typeof process !== "undefined" && process.env.NODE_ENV !== "production";

function warn(message: string) {
  if (isDev) {
    console.warn(`[roxcss] ${message}`);
  }
}

/** 最小化 DOM 接口，避免依赖 DOM lib（Node 测试环境无 document） */
interface CSSStyleSheetLike {
  replaceSync(css: string): void;
}

interface DocumentLike {
  adoptedStyleSheets: CSSStyleSheetLike[];
}

function getDocument(): DocumentLike | undefined {
  return (globalThis as { document?: unknown }).document as DocumentLike | undefined;
}

const CSSStyleSheetCtor = (globalThis as { CSSStyleSheet?: new () => CSSStyleSheetLike })
  .CSSStyleSheet;

export function createRox(options: RoxOptions): RoxInstance {
  const { matchers, modifiers = {} } = options;
  const injected = new Set<string>();
  const failed = new Set<string>();

  // 内存记录全部规则：浏览器中同步写入 adoptedStyleSheets，无 DOM 时供 getCSS() 读取（测试/SSR）
  const rules: string[] = [];

  /**
   * 把一批规则写入一个新的构造样式表（constructable stylesheet）。
   * 一次 replaceSync = 一次解析 + 一次样式失效，避免逐条 insertRule
   * 在"插入与强制布局交替"场景下触发 O(N²) 的同步样式重算（P0，见 docs/性能分析.md）。
   */
  function flush(batch: string[]) {
    const doc = getDocument();
    if (!doc || !CSSStyleSheetCtor) return;
    const sheet = new CSSStyleSheetCtor();
    sheet.replaceSync(batch.join("\n"));
    doc.adoptedStyleSheets.push(sheet);
  }

  function injectRule(
    token: string,
    cssDecl: string,
    pseudos: string[],
    envModifier: Modifier | null,
    batch: string[],
  ): string {
    const selector = `[class~="${token}"]${pseudos.map((p) => `:${p}`).join("")}`;
    const rule = envModifier ? envModifier(token, selector, cssDecl) : `${selector} { ${cssDecl} }`;
    rules.push(rule);
    batch.push(rule);
    injected.add(token);
    return token;
  }

  function rox(strings: TemplateStringsArray, ...values: unknown[]): string {
    const raw = String.raw({ raw: strings }, ...values);
    const tokens = raw.split(/\s+/).filter(Boolean);
    // 本次调用产生的新规则，调用结束时一次性写入
    const batch: string[] = [];

    const result = tokens
      .map((token) => {
        if (injected.has(token) || failed.has(token)) return token;

        // 1. 按 ':' 分割
        const parts = token.split(":");
        const matchPart = parts[parts.length - 1];
        const prefixParts = parts.slice(0, -1);

        // 2. 分离环境修饰符和伪类
        let envModifier: Modifier | null = null;
        const pseudos: string[] = [];

        for (const part of prefixParts) {
          const mod = modifiers[part];
          if (mod) {
            if (envModifier) {
              failed.add(token);
              warn(`token "${token}" 包含多个环境修饰符`);
              return token;
            }
            envModifier = mod;
          } else {
            pseudos.push(part);
          }
        }

        // 3. 按 '-' 分割匹配部分
        const segments = matchPart.split("-");

        // 4. 在 matchers 中逐段查找
        let node: MatcherNode | undefined = matchers[segments[0]];
        let cursor = 1;

        while (node) {
          if (typeof node === "function") {
            // 函数节点：吞掉剩余所有段
            const cssDecl = node(...segments.slice(cursor));
            if (cssDecl == null) {
              failed.add(token);
              warn(`匹配器返回 null（来自 token "${token}"）`);
              return token;
            }
            return injectRule(token, cssDecl, pseudos, envModifier, batch);
          }

          if (cursor < segments.length) {
            const key = segments[cursor];
            if (Object.hasOwn(node, key)) {
              node = node[key];
              cursor++;
              continue;
            }
            // 无精确匹配，尝试 ''
            const fallback = node[""];
            if (typeof fallback === "function") {
              const cssDecl = fallback(...segments.slice(cursor));
              if (cssDecl == null) {
                failed.add(token);
                warn(`匹配器返回 null（来自 token "${token}"）`);
                return token;
              }
              return injectRule(token, cssDecl, pseudos, envModifier, batch);
            }
          } else {
            // 段列表耗尽，尝试 ''
            const fallback = node[""];
            if (typeof fallback === "function") {
              const cssDecl = fallback();
              if (cssDecl == null) {
                failed.add(token);
                warn(`匹配器返回 null（来自 token "${token}"）`);
                return token;
              }
              return injectRule(token, cssDecl, pseudos, envModifier, batch);
            }
          }

          // 匹配失败
          failed.add(token);
          warn(`token "${token}" 匹配失败`);
          return token;
        }

        // 未找到根节点
        failed.add(token);
        warn(`未找到匹配器 "${segments[0]}"（来自 token "${token}"）`);
        return token;
      })
      .join(" ");

    if (batch.length) {
      flush(batch);
    }
    return result;
  }

  return Object.assign(rox, {
    getCSS: () => rules.join("\n"),
  });
}
