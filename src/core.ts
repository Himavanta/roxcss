import type { MatcherNode, Modifier, RoxInstance, RoxOptions } from "./types.ts";

const isDev = typeof process !== "undefined" && process.env.NODE_ENV !== "production";

function warn(message: string) {
  if (isDev) {
    console.warn(`[roxcss] ${message}`);
  }
}

/** 最小化 DOM 接口，避免依赖 DOM lib（Node 测试环境无 document） */
interface StyleElementLike {
  dataset: Record<string, string>;
  sheet: { insertRule(rule: string): number } | null;
}

function createStyleElement(): StyleElementLike | null {
  const doc = (globalThis as { document?: unknown }).document as
    | {
        createElement(tag: string): StyleElementLike;
        head: { appendChild(el: StyleElementLike): void };
      }
    | undefined;
  if (!doc) return null;
  const style = doc.createElement("style");
  style.dataset.roxcss = "";
  doc.head.appendChild(style);
  return style;
}

export function createRox(options: RoxOptions): RoxInstance {
  const { matchers, modifiers = {} } = options;
  const injected = new Set<string>();
  const failed = new Set<string>();
  const style = createStyleElement();

  // 内存记录全部规则：浏览器中同步注入 <style>，无 DOM 时供 getCSS() 读取（测试/SSR）
  const rules: string[] = [];

  function injectRule(
    token: string,
    cssDecl: string,
    pseudos: string[],
    envModifier: Modifier | null,
  ): string {
    const selector = `[class~="${token}"]${pseudos.map((p) => `:${p}`).join("")}`;
    const rule = envModifier ? envModifier(token, selector, cssDecl) : `${selector} { ${cssDecl} }`;
    rules.push(rule);
    if (style?.sheet) {
      try {
        style.sheet.insertRule(rule);
      } catch {
        // 规则非法时忽略实际注入，内存记录保持一致
      }
    }
    injected.add(token);
    return token;
  }

  function rox(strings: TemplateStringsArray, ...values: unknown[]): string {
    const raw = String.raw({ raw: strings }, ...values);
    const tokens = raw.split(/\s+/).filter(Boolean);

    return tokens
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
            return injectRule(token, cssDecl, pseudos, envModifier);
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
              return injectRule(token, cssDecl, pseudos, envModifier);
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
              return injectRule(token, cssDecl, pseudos, envModifier);
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
  }

  return Object.assign(rox, {
    getCSS: () => rules.join("\n"),
  });
}
