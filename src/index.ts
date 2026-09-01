import { createRox } from "./core.ts";
import { minimal } from "./presets/minimal.ts";

export { createRox } from "./core.ts";
export type {
  MatcherFunction,
  MatcherNode,
  Modifier,
  Preset,
  RoxInstance,
  RoxOptions,
} from "./types.ts";
export { minimal } from "./presets/minimal.ts";

/** 开箱即用的默认实例（基于 minimal 预设） */
export const rox = createRox(minimal);
