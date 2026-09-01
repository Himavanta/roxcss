/**
 * 匹配器函数：接收从当前段开始的所有剩余段（展开传入），
 * 返回 CSS 声明字符串；返回 null 表示匹配失败。
 */
export type MatcherFunction = (...args: string[]) => string | null;

/**
 * 匹配器节点：函数（等价于 `{ "": fn }`）或嵌套对象。
 * 嵌套对象的键是匹配段，`""` 作为兜底捕获剩余段。
 */
export type MatcherNode =
  | MatcherFunction
  | {
      [key: string]: MatcherNode;
    };

/**
 * 环境修饰器：只处理规则层面的包裹（媒体查询、容器查询、主题选择器等），
 * 不处理选择器层面的伪类。
 */
export type Modifier = (className: string, selector: string, cssDecl: string) => string;

export interface RoxOptions {
  matchers: Record<string, MatcherNode>;
  modifiers?: Record<string, Modifier>;
}

/**
 * 预设：一组可直接传给 createRox 的 matchers 与 modifiers 集合。
 * 可整体使用（createRox(preset)）或 spread 组合。
 */
export interface Preset {
  matchers: Record<string, MatcherNode>;
  modifiers?: Record<string, Modifier>;
}

/**
 * createRox 返回的实例：模板字符串标签函数，
 * 挂载 getCSS() 用于读取已注入的全部 CSS（调试与 SSR 收集）。
 */
export interface RoxInstance {
  (strings: TemplateStringsArray, ...values: unknown[]): string;
  getCSS(): string;
}
