import { expect, test } from "vite-plus/test";
import { createRox } from "../src/index.ts";
import { unocss } from "../src/presets/unocss.ts";

const rox = createRox(unocss);

test("unocss 间距体系：数字 → ×0.25rem", () => {
  expect(rox`p-4`).toBe("p-4");
  expect(rox.getCSS()).toContain(`[class~="p-4"] { padding:1rem }`);

  expect(rox`m-8`).toBe("m-8");
  expect(rox.getCSS()).toContain(`[class~="m-8"] { margin:2rem }`);

  expect(rox`p-px`).toBe("p-px");
  expect(rox.getCSS()).toContain(`[class~="p-px"] { padding:1px }`);

  expect(rox`pt-4px-8px`).toBe("pt-4px-8px");
  expect(rox.getCSS()).toContain(`[class~="pt-4px-8px"] { padding-top:4px 8px }`);
});

test("unocss 尺寸：full / 分数 / 数字", () => {
  expect(rox`w-full`).toBe("w-full");
  expect(rox.getCSS()).toContain(`[class~="w-full"] { width:100% }`);

  expect(rox`w-1/2`).toBe("w-1/2");
  expect(rox.getCSS()).toContain(`[class~="w-1/2"] { width:50% }`);

  expect(rox`w-4`).toBe("w-4");
  expect(rox.getCSS()).toContain(`[class~="w-4"] { width:1rem }`);

  expect(rox`h-screen`).toBe("h-screen");
  expect(rox.getCSS()).toContain(`[class~="h-screen"] { height:100vh }`);
});

test("unocss 颜色色板", () => {
  expect(rox`bg-red-500`).toBe("bg-red-500");
  expect(rox.getCSS()).toContain(`[class~="bg-red-500"] { background-color:#ef4444 }`);

  expect(rox`text-blue-600`).toBe("text-blue-600");
  expect(rox.getCSS()).toContain(`[class~="text-blue-600"] { color:#2563eb }`);
});

test("unocss 字号与对齐", () => {
  expect(rox`text-sm`).toBe("text-sm");
  expect(rox.getCSS()).toContain(`[class~="text-sm"] { font-size:0.875rem }`);

  expect(rox`text-2xl`).toBe("text-2xl");
  expect(rox.getCSS()).toContain(`[class~="text-2xl"] { font-size:1.5rem }`);

  expect(rox`text-center`).toBe("text-center");
  expect(rox.getCSS()).toContain(`[class~="text-center"] { text-align:center }`);
});

test("unocss 字重与字体", () => {
  expect(rox`font-bold`).toBe("font-bold");
  expect(rox.getCSS()).toContain(`[class~="font-bold"] { font-weight:700 }`);

  expect(rox`font-mono`).toBe("font-mono");
  expect(rox.getCSS()).toContain(`[class~="font-mono"] { font-family:monospace }`);
});

test("unocss flex / grid / items / justify", () => {
  expect(rox`flex-col`).toBe("flex-col");
  expect(rox.getCSS()).toContain(`[class~="flex-col"] { display:flex;flex-direction:column }`);

  expect(rox`items-center`).toBe("items-center");
  expect(rox.getCSS()).toContain(`[class~="items-center"] { align-items:center }`);

  expect(rox`justify-between`).toBe("justify-between");
  expect(rox.getCSS()).toContain(`[class~="justify-between"] { justify-content:space-between }`);

  expect(rox`grid-cols-3`).toBe("grid-cols-3");
  expect(rox.getCSS()).toContain(
    `[class~="grid-cols-3"] { grid-template-columns:repeat(3,minmax(0,1fr)) }`,
  );
});

test("unocss 边框与圆角", () => {
  expect(rox`border`).toBe("border");
  expect(rox.getCSS()).toContain(`[class~="border"] { border-width:1px }`);

  expect(rox`border-2`).toBe("border-2");
  expect(rox.getCSS()).toContain(`[class~="border-2"] { border-width:2px }`);

  expect(rox`border-solid`).toBe("border-solid");
  expect(rox.getCSS()).toContain(`[class~="border-solid"] { border-style:solid }`);

  expect(rox`border-red-500`).toBe("border-red-500");
  expect(rox.getCSS()).toContain(`[class~="border-red-500"] { border-color:#ef4444 }`);

  expect(rox`rounded-full`).toBe("rounded-full");
  expect(rox.getCSS()).toContain(`[class~="rounded-full"] { border-radius:9999px }`);

  expect(rox`rounded-2`).toBe("rounded-2");
  expect(rox.getCSS()).toContain(`[class~="rounded-2"] { border-radius:0.5rem }`);
});

test("unocss 断点修饰符", () => {
  expect(rox`md:p-4`).toBe("md:p-4");
  expect(rox.getCSS()).toContain(
    `@media (min-width: 768px) { [class~="md:p-4"] { padding:1rem } }`,
  );

  expect(rox`lg:text-center`).toBe("lg:text-center");
  expect(rox.getCSS()).toContain(
    `@media (min-width: 1024px) { [class~="lg:text-center"] { text-align:center } }`,
  );
});

test("unocss 无法解析的值匹配失败", () => {
  const before = rox.getCSS().length;
  expect(rox`bg-nope`).toBe("bg-nope");
  expect(rox.getCSS().length).toBe(before);

  expect(rox`text-unknown`).toBe("text-unknown");
  expect(rox.getCSS().length).toBe(before);
});
