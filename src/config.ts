import type { MatcherNode, Modifier, Preset } from "./types.ts";

/** 将段数组以空格连接为简写值（如 ["5px","10px"] → "5px 10px"） */
const space = (vs: string[]) => vs.join(" ");

/** 默认断点：sm/md/lg/xl（min-width 媒体查询） */
export const defaultBreakpoints = { sm: 640, md: 768, lg: 1024, xl: 1280 } as const;

/**
 * 生成断点 modifiers。传入的断点表完全决定输出（不隐式合并默认）；
 * 需要"默认 + 自定义"时自行 spread 合并：createModifiers({ ...defaultBreakpoints, xxl: 1536 })
 */
export function createModifiers(
  breakpoints: Record<string, number> = defaultBreakpoints,
): Record<string, Modifier> {
  const result: Record<string, Modifier> = {};
  for (const [name, px] of Object.entries(breakpoints)) {
    result[name] = (_className, selector, cssDecl) =>
      `@media (min-width: ${px}px) { ${selector} { ${cssDecl} } }`;
  }
  return result;
}

/**
 * 每次调用返回全新的 matchers 树（嵌套子对象也是新引用），
 * 保证多实例之间零共享，避免配置被意外篡改时互相污染。
 *
 * 值一律原样使用，单位由调用者写全（如 `p-4px`、`w-170px`）。
 * 纯数字（`p-4`）会生成无效 CSS，属调用方错误。
 */
const createBaseMatchers = (): Record<string, MatcherNode> => ({
  // display
  block: () => "display:block",
  contents: () => "display:contents",
  hidden: () => "display:none",
  inline: {
    "": () => "display:inline",
    block: () => "display:inline-block",
    flex: () => "display:inline-flex",
  },

  // visibility
  visible: () => "visibility:visible",
  invisible: () => "visibility:hidden",

  // flex / grid
  flex: {
    "": () => "display:flex",
    col: () => "display:flex;flex-direction:column",
    row: () => "display:flex;flex-direction:row",
    wrap: () => "display:flex;flex-wrap:wrap",
    center: () => "display:flex;align-items:center;justify-content:center",
    "1": () => "flex:1 1 0",
    half: () => "flex:1 1 calc(50% - 8px)",
    grow: () => "flex-grow:1",
    space: {
      "": ([v]) => `justify-content:space-${v}`,
      between: () => "justify-content:space-between",
      around: () => "justify-content:space-around",
    },
  },
  items: {
    center: () => "align-items:center",
    start: () => "align-items:flex-start",
    end: () => "align-items:flex-end",
    stretch: () => "align-items:stretch",
  },
  justify: {
    center: () => "justify-content:center",
    between: () => "justify-content:space-between",
    around: () => "justify-content:space-around",
    start: () => "justify-content:flex-start",
    end: () => "justify-content:flex-end",
  },
  place: {
    content: ([v]) => `place-content:${v}`,
    items: ([v]) => `place-items:${v}`,
  },
  grid: {
    "": () => "display:grid",
    cols: ([v]) => `grid-template-columns:repeat(${v},minmax(0,1fr))`,
  },

  // 间距（多段值按顺序拼为简写）
  p: (vs) => `padding:${space(vs)}`,
  px: (vs) => `padding-inline:${space(vs)}`,
  py: (vs) => `padding-block:${space(vs)}`,
  pt: (vs) => `padding-top:${space(vs)}`,
  pr: (vs) => `padding-right:${space(vs)}`,
  pb: (vs) => `padding-bottom:${space(vs)}`,
  pl: (vs) => `padding-left:${space(vs)}`,
  m: (vs) => `margin:${space(vs)}`,
  mx: (vs) => `margin-inline:${space(vs)}`,
  my: (vs) => `margin-block:${space(vs)}`,
  mt: (vs) => `margin-top:${space(vs)}`,
  mr: (vs) => `margin-right:${space(vs)}`,
  mb: (vs) => `margin-bottom:${space(vs)}`,
  ml: (vs) => `margin-left:${space(vs)}`,
  gap: ([v]) => `gap:${v}`,

  // 尺寸
  w: ([v]) => `width:${v}`,
  h: ([v]) => `height:${v}`,
  max: {
    w: ([v]) => `max-width:${v}`,
    h: ([v]) => `max-height:${v}`,
  },
  min: {
    w: ([v]) => `min-width:${v}`,
    h: ([v]) => `min-height:${v}`,
  },

  // 颜色与文本
  bg: ([v]) => `background:${v}`,
  text: {
    "": ([v]) => `color:${v}`,
    center: () => "text-align:center",
    left: () => "text-align:left",
    right: () => "text-align:right",
    // text-wrap / text-overflow 家族
    nowrap: () => "text-wrap:nowrap",
    balance: () => "text-wrap:balance",
    pretty: () => "text-wrap:pretty",
    ellipsis: () => "text-overflow:ellipsis",
    clip: () => "text-overflow:clip",
  },

  // 边框（简写与方向子项统一支持多段值）
  border: {
    "": (vs) => `border:${space(vs)}`,
    t: (vs) => `border-top:${space(vs)}`,
    b: (vs) => `border-bottom:${space(vs)}`,
    r: (vs) => `border-right:${space(vs)}`,
    l: (vs) => `border-left:${space(vs)}`,
    x: (vs) => `border-inline:${space(vs)}`,
    y: (vs) => `border-block:${space(vs)}`,
    color: (vs) => `border-color:${space(vs)}`,
  },
  outline: ([v]) => `outline:${v}`,
  radius: ([v]) => `border-radius:${v}`,

  // 位置与层级
  static: () => "position:static",
  relative: () => "position:relative",
  absolute: () => "position:absolute",
  fixed: () => "position:fixed",
  sticky: () => "position:sticky",
  z: ([v]) => `z-index:${v}`,
  top: ([v]) => `top:${v}`,
  right: ([v]) => `right:${v}`,
  bottom: ([v]) => `bottom:${v}`,
  left: ([v]) => `left:${v}`,
  inset: {
    x: ([v]) => `inset-inline:${v}`,
    y: ([v]) => `inset-block:${v}`,
  },

  // 盒模型与效果
  box: {
    border: () => "box-sizing:border-box",
  },
  shadow: ([v]) => `box-shadow:${v}`,
  opacity: ([v]) => `opacity:${v}`,
  overflow: {
    hidden: () => "overflow:hidden",
    scroll: () => "overflow:scroll",
    auto: () => "overflow:auto",
    visible: () => "overflow:visible",
    clip: () => "overflow:clip",
    x: () => "overflow-x:auto",
    y: () => "overflow-y:auto",
  },
  transition: ([v]) => `transition:${v}`,
  transform: ([v]) => `transform:${v}`,
  animate: ([v]) => `animation:${v}`,
  cursor: ([v]) => `cursor:${v}`,

  // 交互与表单
  pointer: {
    events: {
      none: () => "pointer-events:none",
      auto: () => "pointer-events:auto",
    },
  },
  select: {
    none: () => "-webkit-user-select:none;user-select:none",
    text: () => "-webkit-user-select:text;user-select:text",
    all: () => "-webkit-user-select:all;user-select:all",
    auto: () => "-webkit-user-select:auto;user-select:auto",
  },
  appearance: ([v]) => `appearance:${v}`,
  resize: {
    "": () => "resize:both",
    none: () => "resize:none",
    x: () => "resize:horizontal",
    y: () => "resize:vertical",
  },

  // 滚动
  scroll: {
    auto: () => "scroll-behavior:auto",
    smooth: () => "scroll-behavior:smooth",
  },

  // 文本排版
  whitespace: {
    "": ([v]) => `white-space:${v}`,
    pre: {
      "": () => "white-space:pre",
      wrap: () => "white-space:pre-wrap",
      line: () => "white-space:pre-line",
    },
    break: { spaces: () => "white-space:break-spaces" },
  },
  truncate: () => "overflow:hidden;text-overflow:ellipsis;white-space:nowrap",
  align: {
    "": ([v]) => `vertical-align:${v}`,
    text: {
      top: () => "vertical-align:text-top",
      bottom: () => "vertical-align:text-bottom",
    },
  },

  // 文本装饰
  underline: () => "text-decoration-line:underline",
  overline: () => "text-decoration-line:overline",
  line: { through: () => "text-decoration-line:line-through" },
  bold: () => "font-weight:700",
  italic: () => "font-style:italic",
  uppercase: () => "text-transform:uppercase",
  lowercase: () => "text-transform:lowercase",
  capitalize: () => "text-transform:capitalize",
  mono: () => "font-family:monospace",
  size: ([v]) => `font-size:${v}`,
  no: {
    underline: () => "text-decoration:none",
  },
  list: {
    none: () => "list-style:none",
    inside: () => "list-style-position:inside",
    outside: () => "list-style-position:outside",
  },

  // 无障碍与隔离
  sr: {
    only: () =>
      "position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border-width:0",
  },
  not: {
    sr: {
      only: () =>
        "position:static;width:auto;height:auto;padding:0;margin:0;overflow:visible;clip-path:none;white-space:normal",
    },
  },
  isolate: () => "isolation:isolate",
});

/**
 * 生成默认配置：每次调用返回全新对象（matchers/modifiers 整树重建），
 * 多实例之间零共享引用。overrides 浅合并，自定义覆盖同名的 matcher/modifier。
 */
export function createConfig(overrides?: Partial<Preset>): Preset {
  return {
    matchers: { ...createBaseMatchers(), ...overrides?.matchers },
    modifiers: { ...createModifiers(), ...overrides?.modifiers },
  };
}
