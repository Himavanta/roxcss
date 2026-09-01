import type { Preset } from "../types.ts";

/** 将多个段以空格连接为简写值（如 p-5px-10px → "5px 10px"） */
const space = (...vs: string[]) => vs.join(" ");

/**
 * 最小预设：值原样使用（单位由调用者写全），零抽象。
 */
export const minimal: Preset = {
  matchers: {
    // display
    block: () => "display:block",
    inline: {
      "": () => "display:inline",
      flex: () => "display:inline-flex",
      block: () => "display:inline-block",
    },
    hidden: () => "display:none",

    // flex
    flex: {
      "": () => "display:flex",
      col: () => "display:flex;flex-direction:column",
      row: () => "display:flex;flex-direction:row",
      wrap: () => "display:flex;flex-wrap:wrap",
      center: () => "display:flex;align-items:center;justify-content:center",
      "1": () => "flex:1 1 0",
      space: {
        "": (v) => `justify-content:space-${v}`,
        between: () => "justify-content:space-between",
        around: () => "justify-content:space-around",
      },
    },

    // 间距（多段值按顺序拼为简写，如 p-5px-10px → padding:5px 10px）
    p: (...vs) => `padding:${space(...vs)}`,
    px: (...vs) => `padding-inline:${space(...vs)}`,
    py: (...vs) => `padding-block:${space(...vs)}`,
    pt: (v) => `padding-top:${v}`,
    pr: (v) => `padding-right:${v}`,
    pb: (v) => `padding-bottom:${v}`,
    pl: (v) => `padding-left:${v}`,
    m: (...vs) => `margin:${space(...vs)}`,
    mx: (...vs) => `margin-inline:${space(...vs)}`,
    my: (...vs) => `margin-block:${space(...vs)}`,
    mt: (v) => `margin-top:${v}`,
    mr: (v) => `margin-right:${v}`,
    mb: (v) => `margin-bottom:${v}`,
    ml: (v) => `margin-left:${v}`,
    gap: (v) => `gap:${v}`,

    // 尺寸
    w: (v) => `width:${v}`,
    h: (v) => `height:${v}`,
    max: {
      w: (v) => `max-width:${v}`,
      h: (v) => `max-height:${v}`,
    },
    min: {
      w: (v) => `min-width:${v}`,
      h: (v) => `min-height:${v}`,
    },

    // 颜色
    bg: (v) => `background:${v}`,
    text: (v) => `color:${v}`,

    // 边框
    border: (type, width, color) => `border:${type} ${width} ${color}`,

    // 文本
    center: () => "text-align:center",
    left: () => "text-align:left",
    right: () => "text-align:right",
    bold: () => "font-weight:700",
    italic: () => "font-style:italic",
    uppercase: () => "text-transform:uppercase",
    lowercase: () => "text-transform:lowercase",
    capitalize: () => "text-transform:capitalize",
  },
};
