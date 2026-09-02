import { defineConfig } from "vite-plus";

export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  pack: [
    {
      entry: ["src/index.ts"],
      platform: "neutral",
      dts: true,
      exports: true,
    },
    {
      entry: ["src/index.ts"],
      platform: "neutral",
      minify: true,
      dts: false,
      exports: true,
      outputOptions: {
        entryFileNames: "index.min.js",
      },
    },
    {
      // 精简入口：仅引擎 createRox（含 DOM 注入），不含默认预设。
      // 独立任务打包保证单文件自包含（无共享 chunk），供 CDN 直接引用。
      entry: ["src/core.ts"],
      platform: "neutral",
      minify: true,
      dts: false,
      exports: true,
      outputOptions: {
        entryFileNames: "core.min.js",
      },
    },
  ],
  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {},
});
