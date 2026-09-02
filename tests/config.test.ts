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
