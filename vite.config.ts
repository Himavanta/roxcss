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
      platform: "neutral",
      minify: true,
      dts: false,
      exports: true,
      outputOptions: {
        entryFileNames: "index.min.js",
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
