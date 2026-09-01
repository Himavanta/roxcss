import { defineConfig } from "vite-plus";

export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  pack: [
    {
      entry: ["src/index.ts", "src/presets/*.ts"],
      platform: "neutral",
      dts: true,
      exports: true,
    },
    {
      outputOptions: {
        entryFileNames: "index.min.js",
      },
      platform: "neutral",
      minify: true,
      dts: false,
      exports: true,
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
