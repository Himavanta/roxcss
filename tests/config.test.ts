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

  expect(rox`color-white`).toBe("color-white");
  expect(rox.getCSS()).toContain(`[class~="color-white"] { color:white }`);

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

  // 颜色语义在独立的 color 根（P2 迁移后）
  expect(rox`color-white`).toBe("color-white");
  expect(rox.getCSS()).toContain(`[class~="color-white"] { color:white }`);
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

// ---- P2：Tailwind 对齐迁移批（D01–D05/D07/D08）----

test("P2 text=字号 / size=宽高 / color 独立根（D01/D02 A2 案）", () => {
  expect(rox`text-16px`).toBe("text-16px");
  expect(rox.getCSS()).toContain(`[class~="text-16px"] { font-size:16px }`);

  expect(rox`size-16px`).toBe("size-16px");
  expect(rox.getCSS()).toContain(`[class~="size-16px"] { width:16px;height:16px }`);

  expect(rox`color-accent`).toBe("color-accent");
  expect(rox.getCSS()).toContain(`[class~="color-accent"] { color:accent }`);
});

test("P2 radius 更名 rounded（D03）", () => {
  expect(rox`rounded-5px`).toBe("rounded-5px");
  expect(rox.getCSS()).toContain(`[class~="rounded-5px"] { border-radius:5px }`);
});

test("P2 flex 对齐 Tailwind（D04）", () => {
  expect(rox`flex-1`).toBe("flex-1");
  expect(rox.getCSS()).toContain(`[class~="flex-1"] { flex:1 }`);

  expect(rox`flex-nowrap`).toBe("flex-nowrap");
  expect(rox.getCSS()).toContain(`[class~="flex-nowrap"] { display:flex;flex-wrap:nowrap }`);

  expect(rox`grow`).toBe("grow");
  expect(rox.getCSS()).toContain(`[class~="grow"] { flex-grow:1 }`);

  // 移除的发明键失去专属语义，落入 flex 的 display 兜底
  for (const token of ["flex-center", "flex-half", "flex-space-between", "flex-grow"]) {
    expect(rox`${token}`).toBe(token);
    expect(rox.getCSS()).toContain(`[class~="${token}"] { display:flex }`);
  }
});

test("P2 font 根取代裸 bold/mono（D05）", () => {
  expect(rox`font-bold`).toBe("font-bold");
  expect(rox.getCSS()).toContain(`[class~="font-bold"] { font-weight:700 }`);

  expect(rox`font-medium`).toBe("font-medium");
  expect(rox.getCSS()).toContain(`[class~="font-medium"] { font-weight:500 }`);

  expect(rox`font-mono`).toBe("font-mono");
  expect(rox.getCSS()).toContain(
    `[class~="font-mono"] { font-family:ui-monospace,SFMono-Regular,Menlo,monospace }`,
  );

  // italic 裸键与 Tailwind 一致，保留
  expect(rox`italic`).toBe("italic");
  expect(rox.getCSS()).toContain(`[class~="italic"] { font-style:italic }`);
});

test("P2 默认断点补 2xl（D07）", () => {
  expect(rox`2xl:p-4px`).toBe("2xl:p-4px");
  expect(rox.getCSS()).toContain(
    `@media (min-width: 1536px) { [class~="2xl:p-4px"] { padding:4px } }`,
  );
});

test("P2 overflow 轴同构（D08）", () => {
  expect(rox`overflow-x-auto`).toBe("overflow-x-auto");
  expect(rox.getCSS()).toContain(`[class~="overflow-x-auto"] { overflow-x:auto }`);

  expect(rox`overflow-y-hidden`).toBe("overflow-y-hidden");
  expect(rox.getCSS()).toContain(`[class~="overflow-y-hidden"] { overflow-y:hidden }`);
});

// ---- createConfig 递归覆盖合并 ----

test("递归覆盖：子树补键不丢默认", () => {
  const a = createRox(
    createConfig({
      matchers: { flex: { half: () => "flex:1 1 calc(50% - 8px)" } },
    }),
  );
  // 默认 flex 键保留
  expect(a`flex-col`).toBe("flex-col");
  expect(a.getCSS()).toContain(`[class~="flex-col"] { display:flex;flex-direction:column }`);
  // 新增键生效
  expect(a`flex-half`).toBe("flex-half");
  expect(a.getCSS()).toContain(`[class~="flex-half"] { flex:1 1 calc(50% - 8px) }`);
});

test("null 删除键：语义消失，兄弟键保留", () => {
  const a = createRox(createConfig({ matchers: { flex: { col: null } } }));
  // flex-col 被删除 → 落入 flex 的 display 兜底
  expect(a`flex-col`).toBe("flex-col");
  expect(a.getCSS()).toContain(`[class~="flex-col"] { display:flex }`);
  // 兄弟键不受影响
  expect(a`flex-wrap`).toBe("flex-wrap");
  expect(a.getCSS()).toContain(`[class~="flex-wrap"] { display:flex;flex-wrap:wrap }`);

  // 顶层 matcher 删除：匹配失败不注入
  const b = createRox(createConfig({ matchers: { hidden: null } }));
  const before = b.getCSS().length;
  expect(b`hidden`).toBe("hidden");
  expect(b.getCSS().length).toBe(before);
});

test("函数覆盖整棵子树", () => {
  const a = createRox(
    createConfig({
      matchers: {
        // 把默认的树形 text 整体替换成自定义函数
        text: (vs) => `text-transform:${vs.join(" ")}`,
      },
    }),
  );
  expect(a`text-uppercase`).toBe("text-uppercase");
  expect(a.getCSS()).toContain(`[class~="text-uppercase"] { text-transform:uppercase }`);
});

test("严格容器语义：非普通对象（Object.create(null)）不作为子树", () => {
  // merge 与引擎统一"仅普通对象 = 容器"，不依赖 constructor 的对象视为不存在
  const custom = Object.create(null) as Record<string, unknown>;
  custom.foo = () => "display:grid";
  const a = createRox(
    createConfig({
      matchers: { custom: custom as never },
    }),
  );
  const before = a.getCSS().length;
  expect(a`custom-foo`).toBe("custom-foo");
  expect(a.getCSS().length).toBe(before);
});

test("严格容器语义：类实例/数组不作为子树", () => {
  class Sub {
    foo = () => "display:grid";
  }
  const a = createRox(
    createConfig({
      matchers: {
        inst: new Sub() as never,
        arr: [] as never,
      },
    }),
  );
  const before = a.getCSS().length;
  expect(a`inst-foo`).toBe("inst-foo");
  expect(a`arr-0`).toBe("arr-0");
  expect(a.getCSS().length).toBe(before);
});

test("嵌套 null 删除：深层键删除后落入兜底，兄弟键保留", () => {
  const a = createRox(createConfig({ matchers: { text: { center: null } } }));
  // center 被删除 → text-center 落入 text 的 "" 兜底，不再产生 text-align
  expect(a`text-center`).toBe("text-center");
  expect(a.getCSS()).toContain(`[class~="text-center"] { font-size:center }`);
  expect(a.getCSS()).not.toContain(`text-align:center`);
  // 兄弟键不受影响
  expect(a`text-left`).toBe("text-left");
  expect(a.getCSS()).toContain(`[class~="text-left"] { text-align:left }`);
});

test("modifiers null 删除：前缀按伪类处理，不再生成媒体查询", () => {
  const a = createRox(createConfig({ modifiers: { md: null } }));
  expect(a`md:p-4px`).toBe("md:p-4px");
  // md 不在 modifiers 表 → 按伪类拼到选择器，无 @media
  expect(a.getCSS()).toContain(`[class~="md:p-4px"]:md { padding:4px }`);
  expect(a.getCSS()).not.toContain("@media");
});

test("多实例嵌套隔离：子树互不共享", () => {
  const a = createConfig();
  const b = createConfig();
  expect(a.matchers.flex).not.toBe(b.matchers.flex);
  // 修改 a 的嵌套键不影响 b
  (a.matchers.flex as Record<string, unknown>).custom = () => "display:grid";
  expect("custom" in (b.matchers.flex as Record<string, unknown>)).toBe(false);
});

test("极端：同一 cfg 复用两个实例，注入缓存互不干扰", () => {
  const cfg = createConfig();
  const a = createRox(cfg);
  const b = createRox(cfg);
  expect(a`p-4px`).toBe("p-4px");
  // b 未注入过该 token
  expect(b.getCSS()).not.toContain(`[class~="p-4px"]`);
  expect(b`p-4px`).toBe("p-4px");
  expect(b.getCSS()).toContain(`[class~="p-4px"] { padding:4px }`);
});

test("极端：空对象子树无任何键 → 匹配失败不注入", () => {
  const a = createRox(createConfig({ matchers: { ghost: {} } }));
  const before = a.getCSS().length;
  expect(a`ghost`).toBe("ghost");
  expect(a`ghost-anything`).toBe("ghost-anything");
  expect(a.getCSS().length).toBe(before);
});

test("极端：三层嵌套覆盖子树可用且默认保留", () => {
  const a = createRox(
    createConfig({
      matchers: { layer: { two: { three: () => "display:grid" } } },
    }),
  );
  expect(a`layer-two-three`).toBe("layer-two-three");
  expect(a.getCSS()).toContain(`[class~="layer-two-three"] { display:grid }`);
  // 默认 matcher 保留
  expect(a`hidden`).toBe("hidden");
});

test("极端：modifiers 自定义覆盖断点，其他断点保留", () => {
  const a = createRox(
    createConfig({
      modifiers: {
        md: (s, d) => `@media (max-width: 767px) { ${s} { ${d} } }`,
      },
    }),
  );
  expect(a`md:p-4px`).toBe("md:p-4px");
  expect(a.getCSS()).toContain(`@media (max-width: 767px) { [class~="md:p-4px"] { padding:4px } }`);
  // 未覆盖的默认断点保留
  expect(a`sm:flex`).toBe("sm:flex");
  expect(a.getCSS()).toContain(`@media (min-width: 640px) { [class~="sm:flex"] { display:flex } }`);
});
