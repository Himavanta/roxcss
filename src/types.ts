/**
 * 匹配器函数：接收从当前段开始的所有剩余段（每段一个参数，可能为空），
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
 * 不处理选择器层面的伪类。selector 已含 token 与伪类（如 [class~="md:p-4px"]:hover）。
 */
export type Modifier = (selector: string, cssDecl: string) => string;

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
 * 配置覆盖节点：与 MatcherNode 同构，额外允许 null。
 * 合并时对象递归覆盖、其余值（函数/null）整体替换；
 * null 表示"删除"——引擎会把该键当作不存在。
 */
export type MatcherPatch = MatcherFunction | null | { [key: string]: MatcherPatch };

/** createConfig 的覆盖参数：顶层 matchers/modifiers 可缺省，键值可递归覆盖或置 null 删除 */
export interface PresetOverrides {
  matchers?: Record<string, MatcherPatch>;
  modifiers?: Record<string, Modifier | null>;
}

/**
 * createRox 返回的实例：模板字符串标签函数，
 * 挂载 getCSS() 用于读取已注入的全部 CSS（调试与 SSR 收集）。
 */
export interface RoxInstance {
  (strings: TemplateStringsArray, ...values: unknown[]): string;
  getCSS(): string;
}
