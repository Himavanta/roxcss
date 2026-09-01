import { defineConfig } from "vite-plus";

export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  pack: [
    {
      platform: "neutral",
      dts: true,
      exports: true,
    },
    {
      outputOptions: {
        entryFileNames: "index.min.js",
      },
      platform: "neutral",
      dts: false,
      minify: true,
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
