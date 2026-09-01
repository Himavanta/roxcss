import {
  type MatcherFunction,
  type MatcherNode,
  type Modifier,
  type RoxInstance,
  type RoxOptions,
} from "./types.ts";
import { adoptStyles } from "./dom.ts";

function warn(message: string) {
  if (globalThis.process?.env?.NODE_ENV === "development") {
    console.warn(`[roxcss] ${message}`);
  }
}

/** 类型守卫：是否为函数节点 */
const isFn = (v: unknown): v is MatcherFunction => typeof v === "function";

/** 一次 createRox 实例的运行时状态 */
interface EngineContext {
  matchers: Record<string, MatcherNode>;
  modifiers: Record<string, Modifier>;
  injected: Set<string>;
  failed: Set<string>;
  rules: string[];
}

function fail(ctx: EngineContext, token: string, message: string) {
  ctx.failed.add(token);
  warn(message);
}

/** 分离前缀中的环境修饰符与伪类；多个环境修饰符时返回 null */
function parsePrefix(
  ctx: EngineContext,
  prefixParts: string[],
  token: string,
): { envModifier: Modifier | null; pseudos: string[] } | null {
  let envModifier: Modifier | null = null;
  const pseudos: string[] = [];

  for (const part of prefixParts) {
    const mod = ctx.modifiers[part];
    if (mod) {
      if (envModifier) {
        fail(ctx, token, `token "${token}" 包含多个环境修饰符`);
        return null;
      }
      envModifier = mod;
    } else {
      pseudos.push(part);
    }
  }
  return { envModifier, pseudos };
}

/** 在 matcher 树中逐段查找，返回 CSS 声明；失败返回 null */
function lookup(ctx: EngineContext, segments: string[], token: string): string | null {
  const [root] = segments;
  let node: MatcherNode | undefined = ctx.matchers[root];
  // cursor 是逐段查找的指针，必须按下标前进（改用 slice 复制会退化为 O(n²)）
  let cursor = 1;

  while (node) {
    if (isFn(node)) {
      const cssDecl = node(...segments.slice(cursor));
      if (cssDecl == null) {
        fail(ctx, token, `匹配器返回 null（来自 token "${token}"）`);
        return null;
      }
      return cssDecl;
    }
    const key = cursor < segments.length ? segments[cursor] : null;
    const fallback = node[""];
    if (key !== null && Object.hasOwn(node, key)) {
      node = node[key];
      cursor++;
      continue;
    }
    if (isFn(fallback)) {
      const args = key === null ? [] : segments.slice(cursor);
      const cssDecl = fallback(...args);
      if (cssDecl == null) {
        fail(ctx, token, `匹配器返回 null（来自 token "${token}"）`);
        return null;
      }
      return cssDecl;
    }
    fail(ctx, token, `token "${token}" 匹配失败`);
    return null;
  }

  fail(ctx, token, `未找到匹配器 "${root}"（来自 token "${token}"）`);
  return null;
}

function injectRule(
  ctx: EngineContext,
  {
    token,
    cssDecl,
    pseudos,
    envModifier,
    batch,
  }: {
    token: string;
    cssDecl: string;
    pseudos: string[];
    envModifier: Modifier | null;
    batch: string[];
  },
): string {
  const selector = `[class~="${token}"]${pseudos.map((p) => `:${p}`).join("")}`;
  const rule = envModifier ? envModifier(token, selector, cssDecl) : `${selector} { ${cssDecl} }`;
  ctx.rules.push(rule);
  batch.push(rule);
  ctx.injected.add(token);
  return token;
}

/** 解析单个 token：注入规则或标记失败，原样返回 token */
function resolveToken(ctx: EngineContext, token: string, batch: string[]): string {
  if (ctx.injected.has(token) || ctx.failed.has(token)) return token;

  const parts = token.split(":");
  const prefixParts = parts.slice(0, -1);
  const [matchPart] = parts.slice(-1);
  const parsed = parsePrefix(ctx, prefixParts, token);
  if (!parsed) return token;

  const cssDecl = lookup(ctx, matchPart.split("-"), token);
  if (cssDecl == null) return token;

  injectRule(ctx, {
    token,
    cssDecl,
    pseudos: parsed.pseudos,
    envModifier: parsed.envModifier,
    batch,
  });
  return token;
}

export function createRox(options: RoxOptions): RoxInstance {
  const ctx: EngineContext = {
    matchers: options.matchers,
    modifiers: options.modifiers ?? {},
    injected: new Set<string>(),
    failed: new Set<string>(),
    // 内存记录全部规则：浏览器中同步写入 adoptedStyleSheets，无 DOM 时供 getCSS() 读取（测试/SSR）
    rules: [],
  };

  function rox(strings: TemplateStringsArray, ...values: unknown[]): string {
    const raw = String.raw({ raw: strings }, ...values);
    const tokens = raw.split(/\s+/).filter(Boolean);
    // 本次调用产生的新规则，调用结束时一次性写入
    const batch: string[] = [];

    const result = tokens.map((token) => resolveToken(ctx, token, batch)).join(" ");

    if (batch.length) {
      adoptStyles(batch.join("\n"));
    }
    return result;
  }

  return Object.assign(rox, {
    getCSS: () => ctx.rules.join("\n"),
  });
}
