import { createRox, createConfig } from "roxcss";

/**
 * example 页面的 rox 实例。
 *
 * - 基于默认配置（createConfig），页面特有部分通过 overrides 覆盖：
 *   颜色/边框/阴影等使用 style.css 中 :root 的 CSS 变量，
 *   暗色模式（prefers-color-scheme 切换变量值）依然生效
 * - 值一律原样使用，单位由调用者写全（如 `w-170px`）
 */
export const rox = createRox(
  createConfig({
    modifiers: {
      // 页面原有响应式断点：max-width 1024px（覆盖默认的 min-width 语义）
      lg: (_className, selector, cssDecl) =>
        `@media (max-width: 1024px) { ${selector} { ${cssDecl} } }`,
    },
    matchers: {
      // 页面 CSS 变量体系：剩余段拼为变量名，如 bg-accent-bg → var(--accent-bg)
      bg: (vs) => `background:var(--${vs.join("-")})`,
      text: {
        "": (vs) => `color:var(--${vs.join("-")})`,
        center: () => "text-align:center",
        left: () => "text-align:left",
        right: () => "text-align:right",
      },
      border: {
        t: () => "border-top:1px solid var(--border)",
        b: () => "border-bottom:1px solid var(--border)",
        r: ([v]) => (v == null ? "border-right:1px solid var(--border)" : `border-right:${v}`),
        x: () => "border-inline:1px solid var(--border)",
        color: (vs) => `border-color:var(--${vs.join("-")})`,
      },
      outline: () => "outline:2px solid var(--accent);outline-offset:2px",
      shadow: () => "box-shadow:var(--shadow)",
      transition: {
        border: () => "transition:border-color 0.3s",
        shadow: () => "transition:box-shadow 0.3s",
      },
      mono: () => "font-family:var(--mono)",

      // hero 的 3D 变换（复杂值硬编码为具名 matcher）
      transforms: {
        framework: () =>
          "transform:perspective(2000px) rotateZ(300deg) rotateX(44deg) rotateY(39deg) scale(1.4)",
        vite: () =>
          "transform:perspective(2000px) rotateZ(300deg) rotateX(40deg) rotateY(39deg) scale(0.8)",
      },
    },
  }),
);
