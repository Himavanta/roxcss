import type { MatcherNode } from "../src/types.ts";

/** 纯数字自动补 px 单位，带单位的原样保留 */
const px = (v: string) => (/^-?\d+(?:\.\d+)?$/.test(v) ? `${v}px` : v);

export const defaultMatchers: Record<string, MatcherNode> = {
  // display
  block: () => "display:block",
  "inline-block": () => "display:inline-block",
  inline: () => "display:inline",
  hidden: () => "display:none",

  // flex
  flex: {
    "": () => "display:flex",
    col: () => "display:flex;flex-direction:column",
    row: () => "display:flex;flex-direction:row",
    wrap: () => "display:flex;flex-wrap:wrap",
    center: () => "display:flex;align-items:center;justify-content:center",
    space: {
      "": (v) => `justify-content:space-${v}`,
      between: () => "justify-content:space-between",
      around: () => "justify-content:space-around",
    },
  },

  // 间距
  p: (v) => `padding:${px(v)}`,
  px: (v) => `padding-inline:${px(v)}`,
  py: (v) => `padding-block:${px(v)}`,
  pt: (v) => `padding-top:${px(v)}`,
  pr: (v) => `padding-right:${px(v)}`,
  pb: (v) => `padding-bottom:${px(v)}`,
  pl: (v) => `padding-left:${px(v)}`,
  m: (v) => `margin:${px(v)}`,
  mx: (v) => `margin-inline:${px(v)}`,
  my: (v) => `margin-block:${px(v)}`,
  mt: (v) => `margin-top:${px(v)}`,
  mr: (v) => `margin-right:${px(v)}`,
  mb: (v) => `margin-bottom:${px(v)}`,
  ml: (v) => `margin-left:${px(v)}`,
  gap: (v) => `gap:${px(v)}`,

  // 尺寸
  w: (v) => `width:${px(v)}`,
  h: (v) => `height:${px(v)}`,
  "max-w": (v) => `max-width:${px(v)}`,
  "max-h": (v) => `max-height:${px(v)}`,
  "min-w": (v) => `min-width:${px(v)}`,
  "min-h": (v) => `min-height:${px(v)}`,

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
};
