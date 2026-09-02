/**
 * 引擎与配置共享的内部工具。
 * core.ts 与 config.ts 分别作为独立打包入口（index / core），
 * 共享逻辑必须放在本模块，避免被入口间的相互引用带入。
 */

/** 普通对象判断（容器）：仅 constructor === Object 才是可遍历/可递归的子树；函数/数组/类实例一律不算 */
export const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  !!v && (v as object).constructor === Object;
