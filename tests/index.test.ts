import { expect, test } from "vite-plus/test";
import { createRox, createConfig, rox } from "../src/index.ts";

const custom = createRox({
  modifiers: {
    md: (selector, cssDecl) => `@media (min-width: 768px) { ${selector} { ${cssDecl} } }`,
    dark: (selector, cssDecl) => `.dark ${selector} { ${cssDecl} }`,
  },
  matchers: {
    flex: {
      "": () => "display:flex",
      space: {
        "": (v: string) => `justify-content:space-${v}`,
        between: () => "justify-content:space-between",
        around: () => "justify-content:space-around",
      },
    },
    p: (v: string) => `padding:${v}px`,
    m: (v: string) => `margin:${v}px`,
    bg: (v: string) => `background:${v}`,
    border: (width: string, style: string, color: string) => `border:${width} ${style} ${color}`,
    broken: () => null,
  },
});

test("基本匹配：token 原样返回并注入规则", () => {
  expect(custom`p-4`).toBe("p-4");
  expect(custom.getCSS()).toContain(`[class~="p-4"] { padding:4px }`);
});

test("嵌套 matcher：逐段精确匹配", () => {
  expect(custom`flex-space-between`).toBe("flex-space-between");
  expect(custom.getCSS()).toContain(
    `[class~="flex-space-between"] { justify-content:space-between }`,
  );
});

test("函数吞掉剩余所有段", () => {
  expect(custom`p-9`).toBe("p-9");
  expect(custom.getCSS()).toContain(`[class~="p-9"] { padding:9px }`);
});

test("对象节点的 '' 兜底捕获剩余段", () => {
  expect(custom`flex-space-center`).toBe("flex-space-center");
  expect(custom.getCSS()).toContain(
    `[class~="flex-space-center"] { justify-content:space-center }`,
  );
});

test("伪类拼接到选择器上", () => {
  expect(custom`hover:bg-blue`).toBe("hover:bg-blue");
  expect(custom.getCSS()).toContain(`[class~="hover:bg-blue"]:hover { background:blue }`);
});

test("伪类链按顺序拼接", () => {
  expect(custom`hover:focus:p-4`).toBe("hover:focus:p-4");
  expect(custom.getCSS()).toContain(`[class~="hover:focus:p-4"]:hover:focus { padding:4px }`);
});

test("伪类名可含连字符（focus-within）", () => {
  // 前缀段不做 - 分割，带 - 的伪类原样拼到选择器
  expect(custom`hover:focus-within:bg-blue`).toBe("hover:focus-within:bg-blue");
  expect(custom.getCSS()).toContain(
    `[class~="hover:focus-within:bg-blue"]:hover:focus-within { background:blue }`,
  );
});

test("环境修饰符包裹整个规则", () => {
  expect(custom`md:flex-space-between`).toBe("md:flex-space-between");
  expect(custom.getCSS()).toContain(
    `@media (min-width: 768px) { [class~="md:flex-space-between"] { justify-content:space-between } }`,
  );
});

test("环境修饰符 + 伪类", () => {
  expect(custom`md:hover:p-4`).toBe("md:hover:p-4");
  expect(custom.getCSS()).toContain(
    `@media (min-width: 768px) { [class~="md:hover:p-4"]:hover { padding:4px } }`,
  );
});

test("多段值展开为多个参数传入 matcher", () => {
  expect(custom`border-1px-solid-red`).toBe("border-1px-solid-red");
  expect(custom.getCSS()).toContain(`[class~="border-1px-solid-red"] { border:1px solid red }`);
});

test("匹配失败：返回原 token 且不注入", () => {
  const before = custom.getCSS().length;
  expect(custom`nope-1`).toBe("nope-1");
  expect(custom.getCSS().length).toBe(before);
});

test("多个环境修饰符导致匹配失败", () => {
  const before = custom.getCSS().length;
  expect(custom`md:dark:p-4`).toBe("md:dark:p-4");
  expect(custom.getCSS().length).toBe(before);
});

test("matcher 返回 null 导致匹配失败", () => {
  const before = custom.getCSS().length;
  expect(custom`broken-x`).toBe("broken-x");
  expect(custom.getCSS().length).toBe(before);
});

test("缓存：重复 token 不重复注入", () => {
  const a = createRox({ matchers: { p: (v: string) => `padding:${v}px` } });
  expect(a`p-1`).toBe("p-1");
  const before = a.getCSS();
  expect(a`p-1`).toBe("p-1");
  expect(a.getCSS()).toBe(before);
});

test("模板插值", () => {
  const a = createRox({ matchers: { p: (v: string) => `padding:${v}px` } });
  const n = 4;
  expect(a`p-${n}`).toBe("p-4");
});

test("空白与换行拆分", () => {
  const a = createRox({ matchers: { p: (v: string) => `padding:${v}px` } });
  expect(a`\n  p-1   p-2\tp-3  `).toBe("p-1 p-2 p-3");
});

test("极端：空模板与纯空白模板返回空串", () => {
  const a = createRox({ matchers: { p: (v: string) => `padding:${v}px` } });
  expect(a``).toBe("");
  expect(a`   \n\t  `).toBe("");
  expect(a.getCSS()).toBe("");
});

test("极端：根无法匹配的 token（中文/Unicode）不注入", () => {
  const a = createRox({ matchers: { p: (v: string) => `padding:${v}px` } });
  const before = a.getCSS().length;
  expect(a`你好`).toBe("你好");
  expect(a.getCSS().length).toBe(before);
});

test("极端：token 首连字符拆出空根段 → 匹配失败", () => {
  const a = createRox({ matchers: { p: (v: string) => `padding:${v}px` } });
  const before = a.getCSS().length;
  expect(a`-p-1`).toBe("-p-1");
  expect(a.getCSS().length).toBe(before);
});

test("极端：token 尾连字符落到兜底（flex- 等价 flex）", () => {
  const a = createRox({
    matchers: {
      flex: { "": () => "display:flex", col: () => "display:flex;flex-direction:column" },
    },
  });
  expect(a`flex-`).toBe("flex-");
  expect(a.getCSS()).toContain(`[class~="flex-"] { display:flex }`);
});

test("极端：环境修饰符 + 多伪类（含连字符）完整链", () => {
  const a = createRox({
    modifiers: { md: (s, d) => `@media (min-width: 768px) { ${s} { ${d} } }` },
    matchers: { bg: (v: string) => `background:${v}` },
  });
  expect(a`md:hover:focus-within:bg-blue`).toBe("md:hover:focus-within:bg-blue");
  expect(a.getCSS()).toContain(
    `@media (min-width: 768px) { [class~="md:hover:focus-within:bg-blue"]:hover:focus-within { background:blue } }`,
  );
});

test("默认匹配器：值原样使用，不自动补单位", () => {
  expect(rox`p-4`).toBe("p-4");
  expect(rox.getCSS()).toContain(`[class~="p-4"] { padding:4 }`);

  expect(rox`p-4px`).toBe("p-4px");
  expect(rox.getCSS()).toContain(`[class~="p-4px"] { padding:4px }`);
});

test("默认匹配器：多段值拼为简写", () => {
  expect(rox`p-5px-10px`).toBe("p-5px-10px");
  expect(rox.getCSS()).toContain(`[class~="p-5px-10px"] { padding:5px 10px }`);

  expect(rox`m-0-auto`).toBe("m-0-auto");
  expect(rox.getCSS()).toContain(`[class~="m-0-auto"] { margin:0 auto }`);
});

test("默认匹配器：嵌套结构", () => {
  expect(rox`inline`).toBe("inline");
  expect(rox.getCSS()).toContain(`[class~="inline"] { display:inline }`);

  expect(rox`inline-flex`).toBe("inline-flex");
  expect(rox.getCSS()).toContain(`[class~="inline-flex"] { display:inline-flex }`);

  expect(rox`inline-block`).toBe("inline-block");
  expect(rox.getCSS()).toContain(`[class~="inline-block"] { display:inline-block }`);

  expect(rox`max-w-100%`).toBe("max-w-100%");
  expect(rox.getCSS()).toContain(`[class~="max-w-100%"] { max-width:100% }`);

  expect(rox`min-h-100svh`).toBe("min-h-100svh");
  expect(rox.getCSS()).toContain(`[class~="min-h-100svh"] { min-height:100svh }`);

  expect(rox`flex-1`).toBe("flex-1");
  expect(rox.getCSS()).toContain(`[class~="flex-1"] { flex:1 }`);
});

test("默认匹配器：flex 家族", () => {
  expect(rox`flex`).toBe("flex");
  expect(rox.getCSS()).toContain(`[class~="flex"] { display:flex }`);

  expect(rox`flex-col`).toBe("flex-col");
  expect(rox.getCSS()).toContain(`[class~="flex-col"] { display:flex;flex-direction:column }`);
});

test("默认配置可被 createRox 复用", () => {
  const a = createRox(createConfig());
  expect(a`hidden`).toBe("hidden");
  expect(a.getCSS()).toContain(`[class~="hidden"] { display:none }`);
});

test("createConfig overrides 递归覆盖合并", () => {
  const a = createRox(
    createConfig({
      matchers: { custom: () => "display:grid" },
    }),
  );
  // 默认 matcher 保留
  expect(a`hidden`).toBe("hidden");
  // 自定义 matcher 生效
  expect(a`custom`).toBe("custom");
  expect(a.getCSS()).toContain(`[class~="custom"] { display:grid }`);
});

test("createConfig 每次返回独立对象", () => {
  const a = createConfig();
  const b = createConfig();
  expect(a).not.toBe(b);
  expect(a.matchers).not.toBe(b.matchers);
});
