import { createRox, defaultMatchers } from "roxcss";

/**
 * example 页面的 rox 实例。
 *
 * - 值一律原样使用，单位由调用者写全（如 `w-170px`）
 * - 引擎按 `-` 拆段查找 matcher，因此多词 matcher 必须用嵌套对象（如 `border-t` → border.t）
 * - 页面颜色/字号取自 style.css 中 :root 的 CSS 变量，
 *   暗色模式（prefers-color-scheme 切换变量值）依然生效
 */
export const rox = createRox({
  modifiers: {
    // 页面原有响应式断点：max-width 1024px
    lg: (_className, selector, cssDecl) =>
      `@media (max-width: 1024px) { ${selector} { ${cssDecl} } }`,
  },
  matchers: {
    ...defaultMatchers,

    // 定位
    relative: () => "position:relative",
    absolute: () => "position:absolute",
    z: (v) => `z-index:${v}`,
    top: (v) => `top:${v}`,
    inset: {
      x: (v) => `inset-inline:${v}`,
    },

    // 盒模型
    box: {
      border: () => "box-sizing:border-box",
    },

    // flex 布局扩展（保留默认 flex 全部分支，补充页面专用子项）
    flex: {
      "": () => "display:flex",
      col: () => "display:flex;flex-direction:column",
      row: () => "display:flex;flex-direction:row",
      wrap: () => "display:flex;flex-wrap:wrap",
      center: () => "display:flex;align-items:center;justify-content:center",
      "1": () => "flex:1 1 0",
      half: () => "flex:1 1 calc(50% - 8px)",
      space: {
        "": (v) => `justify-content:space-${v}`,
        between: () => "justify-content:space-between",
        around: () => "justify-content:space-around",
      },
    },
    grow: () => "flex-grow:1",
    items: {
      center: () => "align-items:center",
    },
    justify: {
      center: () => "justify-content:center",
    },
    place: {
      content: (v) => `place-content:${v}`,
      items: (v) => `place-items:${v}`,
    },

    // 边框（保留默认 border 简写，补充方向与颜色子项）
    border: {
      "": (type, width, color) => `border:${type} ${width} ${color}`,
      t: () => "border-top:1px solid var(--border)",
      b: () => "border-bottom:1px solid var(--border)",
      r: (v) => (v == null ? "border-right:1px solid var(--border)" : `border-right:${v}`),
      x: () => "border-inline:1px solid var(--border)",
      color: (...vs) => `border-color:var(--${vs.join("-")})`,
    },
    outline: () => "outline:2px solid var(--accent);outline-offset:2px",

    // 效果
    radius: (v) => `border-radius:${v}`,
    shadow: () => "box-shadow:var(--shadow)",
    transition: {
      border: () => "transition:border-color 0.3s",
      shadow: () => "transition:box-shadow 0.3s",
    },

    // 颜色/文本：剩余段拼为 CSS 变量名，如 bg-accent-bg → var(--accent-bg)
    bg: (...vs) => `background:var(--${vs.join("-")})`,
    text: {
      "": (...vs) => `color:var(--${vs.join("-")})`,
      center: () => "text-align:center",
      left: () => "text-align:left",
      right: () => "text-align:right",
    },
    mono: () => "font-family:var(--mono)",
    size: (v) => `font-size:${v}`,
    no: {
      underline: () => "text-decoration:none",
    },
    list: {
      none: () => "list-style:none",
    },

    // hero 的 3D 变换（复杂值硬编码为具名 matcher）
    transforms: {
      framework: () =>
        "transform:perspective(2000px) rotateZ(300deg) rotateX(44deg) rotateY(39deg) scale(1.4)",
      vite: () =>
        "transform:perspective(2000px) rotateZ(300deg) rotateX(40deg) rotateY(39deg) scale(0.8)",
    },
  },
});
