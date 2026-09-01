import type { Modifier, Preset } from "../types.ts";

/**
 * UnoCSS 兼容预设（第一期）。
 * 覆盖：断点、间距体系（n × 0.25rem）、尺寸、颜色色板、字号/字重、
 * flex/grid、边框、圆角、文本对齐。
 * 任意值语法（w-[100px]）与完整色板留待后续。
 */

/** 间距体系：纯数字 → n × 0.25rem，px → 1px，其余原样 */
const spacing = (v: string): string => {
  if (/^-?\d+(?:\.\d+)?$/.test(v)) return `${Number(v) * 0.25}rem`;
  if (v === "px") return "1px";
  return v;
};

/** 尺寸：数字走间距体系，full → 100%，分数 → 百分比，其余原样 */
const size = (v: string): string => {
  if (/^-?\d+(?:\.\d+)?$/.test(v)) return spacing(v);
  if (v === "full") return "100%";
  if (/^\d+\/\d+$/.test(v)) {
    const [a, b] = v.split("/");
    return `${(Number(a) / Number(b)) * 100}%`;
  }
  return v;
};

/** 色板：8 色 × 5 档（Tailwind 标准色值） */
const palette: Record<string, Record<string, string>> = {
  red: { "100": "#fee2e2", "400": "#f87171", "500": "#ef4444", "600": "#dc2626", "700": "#b91c1c" },
  orange: {
    "100": "#ffedd5",
    "400": "#fb923c",
    "500": "#f97316",
    "600": "#ea580c",
    "700": "#c2410c",
  },
  amber: {
    "100": "#fef3c7",
    "400": "#fbbf24",
    "500": "#f59e0b",
    "600": "#d97706",
    "700": "#b45309",
  },
  green: {
    "100": "#dcfce7",
    "400": "#4ade80",
    "500": "#22c55e",
    "600": "#16a34a",
    "700": "#15803d",
  },
  blue: {
    "100": "#dbeafe",
    "400": "#60a5fa",
    "500": "#3b82f6",
    "600": "#2563eb",
    "700": "#1d4ed8",
  },
  indigo: {
    "100": "#e0e7ff",
    "400": "#818cf8",
    "500": "#6366f1",
    "600": "#4f46e5",
    "700": "#4338ca",
  },
  purple: {
    "100": "#f3e8ff",
    "400": "#c084fc",
    "500": "#a855f7",
    "600": "#9333ea",
    "700": "#7e22ce",
  },
  gray: {
    "100": "#f3f4f6",
    "400": "#9ca3af",
    "500": "#6b7280",
    "600": "#4b5563",
    "700": "#374151",
  },
};

const colorOf = (...vs: string[]): string | null => {
  const [c, shade] = vs;
  const value = c && shade && palette[c]?.[shade];
  return value ?? null;
};

/** 字号表 */
const fontSizes: Record<string, string> = {
  xs: "0.75rem",
  sm: "0.875rem",
  base: "1rem",
  lg: "1.125rem",
  xl: "1.25rem",
  "2xl": "1.5rem",
  "3xl": "1.875rem",
  "4xl": "2.25rem",
};

/** 字重表 */
const weights: Record<string, string> = {
  light: "300",
  normal: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
};

const families: Record<string, string> = { sans: "sans-serif", serif: "serif", mono: "monospace" };

const aligns: Record<string, string> = {
  center: "text-align:center",
  left: "text-align:left",
  right: "text-align:right",
  justify: "text-align:justify",
};

const borderStyles: Record<string, string> = {
  solid: "border-style:solid",
  dashed: "border-style:dashed",
  dotted: "border-style:dotted",
  none: "border-style:none",
};

/** 间距类工厂：p-4 → padding:1rem，p-4px-8px → padding:4px 8px */
const pad =
  (prop: string) =>
  (...vs: string[]) =>
    `${prop}:${vs.map(spacing).join(" ")}`;

/** 断点修饰符（UnoCSS 默认断点） */
const breakpoints: Record<string, number> = { sm: 640, md: 768, lg: 1024, xl: 1280 };

const modifiers: Record<string, Modifier> = {};
for (const [name, px] of Object.entries(breakpoints)) {
  modifiers[name] = (_className, selector, cssDecl) =>
    `@media (min-width: ${px}px) { ${selector} { ${cssDecl} } }`;
}

export const unocss: Preset = {
  modifiers,
  matchers: {
    // display
    block: () => "display:block",
    hidden: () => "display:none",
    inline: {
      "": () => "display:inline",
      block: () => "display:inline-block",
    },

    // flex / grid
    flex: {
      "": () => "display:flex",
      col: () => "display:flex;flex-direction:column",
      row: () => "display:flex;flex-direction:row",
      wrap: () => "display:flex;flex-wrap:wrap",
      center: () => "display:flex;align-items:center;justify-content:center",
      "1": () => "flex:1 1 0",
      auto: () => "flex:1 1 auto",
      grow: () => "flex-grow:1",
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
    grid: {
      "": () => "display:grid",
      cols: (v) => `grid-template-columns:repeat(${v},minmax(0,1fr))`,
    },

    // 间距
    p: pad("padding"),
    px: pad("padding-inline"),
    py: pad("padding-block"),
    pt: pad("padding-top"),
    pr: pad("padding-right"),
    pb: pad("padding-bottom"),
    pl: pad("padding-left"),
    m: pad("margin"),
    mx: pad("margin-inline"),
    my: pad("margin-block"),
    mt: pad("margin-top"),
    mr: pad("margin-right"),
    mb: pad("margin-bottom"),
    ml: pad("margin-left"),
    gap: pad("gap"),

    // 尺寸
    w: (v) => `width:${v === "screen" ? "100vw" : size(v)}`,
    h: (v) => `height:${v === "screen" ? "100vh" : size(v)}`,
    max: {
      w: (v) => `max-width:${size(v)}`,
      h: (v) => `max-height:${size(v)}`,
    },

    // 颜色与文本
    bg: (...vs) => {
      const color = colorOf(...vs);
      return color ? `background-color:${color}` : null;
    },
    text: (...vs) => {
      const name = vs.join("-");
      if (name in aligns) return aligns[name];
      if (name in fontSizes) return `font-size:${fontSizes[name]}`;
      const color = colorOf(...vs);
      return color ? `color:${color}` : null;
    },

    // 边框
    border: (...vs) => {
      if (!vs.length) return "border-width:1px";
      const name = vs.join("-");
      if (/^\d+$/.test(name)) return `border-width:${name}px`;
      if (/^\d+px$/.test(name)) return `border-width:${name}`;
      if (name in borderStyles) return borderStyles[name];
      const color = colorOf(...vs);
      return color ? `border-color:${color}` : null;
    },

    // 圆角
    rounded: (v) => {
      if (v === "full") return "border-radius:9999px";
      if (v === "sm") return "border-radius:0.125rem";
      if (v === "md") return "border-radius:0.25rem";
      if (v === "lg") return "border-radius:0.5rem";
      if (/^\d+$/.test(v)) return `border-radius:${spacing(v)}`;
      return null;
    },

    // 字体
    font: (...vs) => {
      const name = vs.join("-");
      if (name in weights) return `font-weight:${weights[name]}`;
      if (name in families) return `font-family:${families[name]}`;
      return null;
    },
  },
};
