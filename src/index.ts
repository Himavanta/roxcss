import { createRox } from "./core.ts";
import { createConfig } from "./config.ts";

export { createConfig } from "./config.ts";
export { createRox } from "./core.ts";
export type {
  MatcherFunction,
  MatcherNode,
  Modifier,
  Preset,
  RoxInstance,
  RoxOptions,
} from "./types.ts";

/** 开箱即用的默认实例（基于默认配置） */
export const rox = createRox(createConfig());
