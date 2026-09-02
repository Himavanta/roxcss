import { expect, test } from "vite-plus/test";
import { createRox, createConfig, createModifiers, defaultBreakpoints } from "../src/index.ts";

const rox = createRox(createConfig());

test("默认配置：值原样使用，单位写全", () => {
  expect(rox`p-4px`).toBe("p-4px");
  expect(rox.getCSS()).toContain(`[class~="p-4px"] { padding:4px }`);

  expect(rox`w-170px`).toBe("w-170px");
  expect(rox.getCSS()).toContain(`[class~="w-170px"] { width:170px }`);
});

test("默认配置：多段值空格连接", () => {
  expect(rox`pt-4px-8px`).toBe("pt-4px-8px");
  expect(rox.getCSS()).toContain(`[class~="pt-4px-8px"] { padding-top:4px 8px }`);
});

test("默认配置：颜色与文本", () => {
  expect(rox`bg-#ef4444`).toBe("bg-#ef4444");
  expect(rox.getCSS()).toContain(`[class~="bg-#ef4444"] { background:#ef4444 }`);

  expect(rox`text-white`).toBe("text-white");
  expect(rox.getCSS()).toContain(`[class~="text-white"] { color:white }`);

  expect(rox`text-center`).toBe("text-center");
  expect(rox.getCSS()).toContain(`[class~="text-center"] { text-align:center }`);
});

test("默认配置：边框方向子项", () => {
  expect(rox`border-t-1px`).toBe("border-t-1px");
  expect(rox.getCSS()).toContain(`[class~="border-t-1px"] { border-top:1px }`);

  expect(rox`border-x-2px-4px`).toBe("border-x-2px-4px");
  expect(rox.getCSS()).toContain(`[class~="border-x-2px-4px"] { border-inline:2px 4px }`);
});

test("默认配置：flex / grid / 位置", () => {
  expect(rox`flex-col`).toBe("flex-col");
  expect(rox.getCSS()).toContain(`[class~="flex-col"] { display:flex;flex-direction:column }`);

  expect(rox`flex-half`).toBe("flex-half");
  expect(rox.getCSS()).toContain(`[class~="flex-half"] { flex:1 1 calc(50% - 8px) }`);

  expect(rox`grid-cols-3`).toBe("grid-cols-3");
  expect(rox.getCSS()).toContain(
    `[class~="grid-cols-3"] { grid-template-columns:repeat(3,minmax(0,1fr)) }`,
  );

  expect(rox`absolute`).toBe("absolute");
  expect(rox.getCSS()).toContain(`[class~="absolute"] { position:absolute }`);
});

test("默认配置：断点 modifiers（min-width）", () => {
  expect(rox`md:p-4px`).toBe("md:p-4px");
  expect(rox.getCSS()).toContain(
    `@media (min-width: 768px) { [class~="md:p-4px"] { padding:4px } }`,
  );

  expect(rox`xl:flex`).toBe("xl:flex");
  expect(rox.getCSS()).toContain(
    `@media (min-width: 1280px) { [class~="xl:flex"] { display:flex } }`,
  );
});

test("createModifiers 自定义断点完全决定输出", () => {
  const a = createRox({
    matchers: createConfig().matchers,
    modifiers: createModifiers({ phone: 480, desktop: 1200 }),
  });
  expect(a`phone:p-4px`).toBe("phone:p-4px");
  expect(a.getCSS()).toContain(
    `@media (min-width: 480px) { [class~="phone:p-4px"] { padding:4px } }`,
  );

  expect(a`desktop:flex`).toBe("desktop:flex");
  expect(a.getCSS()).toContain(
    `@media (min-width: 1200px) { [class~="desktop:flex"] { display:flex } }`,
  );

  // 默认断点不被隐式带入：sm: 前缀不会生成 media 查询（按伪类处理）
  expect(a`sm:flex`).toBe("sm:flex");
  expect(a.getCSS()).not.toContain("@media (min-width: 640px)");
});

test("createModifiers 基于默认断点扩展", () => {
  const a = createRox({
    matchers: createConfig().matchers,
    modifiers: createModifiers({ ...defaultBreakpoints, xxl: 1536 }),
  });
  expect(a`xxl:p-4px`).toBe("xxl:p-4px");
  expect(a.getCSS()).toContain(
    `@media (min-width: 1536px) { [class~="xxl:p-4px"] { padding:4px } }`,
  );

  expect(a`md:flex`).toBe("md:flex");
  expect(a.getCSS()).toContain(`@media (min-width: 768px) { [class~="md:flex"] { display:flex } }`);
});

// ---- P1：Tailwind v4 对齐新增批 ----

test("P1 display/visibility/position 补充", () => {
  expect(rox`contents`).toBe("contents");
  expect(rox.getCSS()).toContain(`[class~="contents"] { display:contents }`);

  expect(rox`static`).toBe("static");
  expect(rox.getCSS()).toContain(`[class~="static"] { position:static }`);

  expect(rox`visible`).toBe("visible");
  expect(rox.getCSS()).toContain(`[class~="visible"] { visibility:visible }`);

  expect(rox`invisible`).toBe("invisible");
  expect(rox.getCSS()).toContain(`[class~="invisible"] { visibility:hidden }`);
});

test("P1 overflow visible/clip", () => {
  expect(rox`overflow-visible`).toBe("overflow-visible");
  expect(rox.getCSS()).toContain(`[class~="overflow-visible"] { overflow:visible }`);

  expect(rox`overflow-clip`).toBe("overflow-clip");
  expect(rox.getCSS()).toContain(`[class~="overflow-clip"] { overflow:clip }`);
});

test("P1 whitespace 家族与 truncate", () => {
  expect(rox`whitespace-nowrap`).toBe("whitespace-nowrap");
  expect(rox.getCSS()).toContain(`[class~="whitespace-nowrap"] { white-space:nowrap }`);

  expect(rox`whitespace-pre`).toBe("whitespace-pre");
  expect(rox.getCSS()).toContain(`[class~="whitespace-pre"] { white-space:pre }`);

  expect(rox`whitespace-pre-line`).toBe("whitespace-pre-line");
  expect(rox.getCSS()).toContain(`[class~="whitespace-pre-line"] { white-space:pre-line }`);

  expect(rox`whitespace-pre-wrap`).toBe("whitespace-pre-wrap");
  expect(rox.getCSS()).toContain(`[class~="whitespace-pre-wrap"] { white-space:pre-wrap }`);

  expect(rox`whitespace-break-spaces`).toBe("whitespace-break-spaces");
  expect(rox.getCSS()).toContain(`[class~="whitespace-break-spaces"] { white-space:break-spaces }`);

  expect(rox`truncate`).toBe("truncate");
  expect(rox.getCSS()).toContain(
    `[class~="truncate"] { overflow:hidden;text-overflow:ellipsis;white-space:nowrap }`,
  );
});

test("P1 文本装饰 underline/overline/line-through", () => {
  expect(rox`underline`).toBe("underline");
  expect(rox.getCSS()).toContain(`[class~="underline"] { text-decoration-line:underline }`);

  expect(rox`overline`).toBe("overline");
  expect(rox.getCSS()).toContain(`[class~="overline"] { text-decoration-line:overline }`);

  expect(rox`line-through`).toBe("line-through");
  expect(rox.getCSS()).toContain(`[class~="line-through"] { text-decoration-line:line-through }`);
});

test("P1 text-wrap / text-overflow 家族（text 子树）", () => {
  expect(rox`text-nowrap`).toBe("text-nowrap");
  expect(rox.getCSS()).toContain(`[class~="text-nowrap"] { text-wrap:nowrap }`);

  expect(rox`text-balance`).toBe("text-balance");
  expect(rox.getCSS()).toContain(`[class~="text-balance"] { text-wrap:balance }`);

  expect(rox`text-pretty`).toBe("text-pretty");
  expect(rox.getCSS()).toContain(`[class~="text-pretty"] { text-wrap:pretty }`);

  expect(rox`text-ellipsis`).toBe("text-ellipsis");
  expect(rox.getCSS()).toContain(`[class~="text-ellipsis"] { text-overflow:ellipsis }`);

  expect(rox`text-clip`).toBe("text-clip");
  expect(rox.getCSS()).toContain(`[class~="text-clip"] { text-overflow:clip }`);

  // color 兜底语义不受影响
  expect(rox`text-white`).toBe("text-white");
  expect(rox.getCSS()).toContain(`[class~="text-white"] { color:white }`);
});

test("P1 vertical-align", () => {
  expect(rox`align-top`).toBe("align-top");
  expect(rox.getCSS()).toContain(`[class~="align-top"] { vertical-align:top }`);

  expect(rox`align-middle`).toBe("align-middle");
  expect(rox.getCSS()).toContain(`[class~="align-middle"] { vertical-align:middle }`);

  expect(rox`align-text-top`).toBe("align-text-top");
  expect(rox.getCSS()).toContain(`[class~="align-text-top"] { vertical-align:text-top }`);

  expect(rox`align-text-bottom`).toBe("align-text-bottom");
  expect(rox.getCSS()).toContain(`[class~="align-text-bottom"] { vertical-align:text-bottom }`);
});

test("P1 交互：pointer-events / select / appearance / resize", () => {
  expect(rox`pointer-events-none`).toBe("pointer-events-none");
  expect(rox.getCSS()).toContain(`[class~="pointer-events-none"] { pointer-events:none }`);

  expect(rox`pointer-events-auto`).toBe("pointer-events-auto");
  expect(rox.getCSS()).toContain(`[class~="pointer-events-auto"] { pointer-events:auto }`);

  expect(rox`select-none`).toBe("select-none");
  expect(rox.getCSS()).toContain(
    `[class~="select-none"] { -webkit-user-select:none;user-select:none }`,
  );

  expect(rox`appearance-none`).toBe("appearance-none");
  expect(rox.getCSS()).toContain(`[class~="appearance-none"] { appearance:none }`);

  expect(rox`resize`).toBe("resize");
  expect(rox.getCSS()).toContain(`[class~="resize"] { resize:both }`);

  expect(rox`resize-x`).toBe("resize-x");
  expect(rox.getCSS()).toContain(`[class~="resize-x"] { resize:horizontal }`);

  expect(rox`resize-none`).toBe("resize-none");
  expect(rox.getCSS()).toContain(`[class~="resize-none"] { resize:none }`);
});

test("P1 滚动与无障碍", () => {
  expect(rox`scroll-smooth`).toBe("scroll-smooth");
  expect(rox.getCSS()).toContain(`[class~="scroll-smooth"] { scroll-behavior:smooth }`);

  expect(rox`scroll-auto`).toBe("scroll-auto");
  expect(rox.getCSS()).toContain(`[class~="scroll-auto"] { scroll-behavior:auto }`);

  expect(rox`sr-only`).toBe("sr-only");
  expect(rox.getCSS()).toContain(
    `[class~="sr-only"] { position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border-width:0 }`,
  );

  expect(rox`not-sr-only`).toBe("not-sr-only");
  expect(rox.getCSS()).toContain(
    `[class~="not-sr-only"] { position:static;width:auto;height:auto;padding:0;margin:0;overflow:visible;clip-path:none;white-space:normal }`,
  );
});

test("P1 isolate / list 位置 / animate", () => {
  expect(rox`isolate`).toBe("isolate");
  expect(rox.getCSS()).toContain(`[class~="isolate"] { isolation:isolate }`);

  expect(rox`list-inside`).toBe("list-inside");
  expect(rox.getCSS()).toContain(`[class~="list-inside"] { list-style-position:inside }`);

  expect(rox`list-outside`).toBe("list-outside");
  expect(rox.getCSS()).toContain(`[class~="list-outside"] { list-style-position:outside }`);

  expect(rox`animate-bounce`).toBe("animate-bounce");
  expect(rox.getCSS()).toContain(`[class~="animate-bounce"] { animation:bounce }`);
});
