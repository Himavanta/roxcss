import { createRox } from "./core.ts";
import { defaultMatchers } from "../matchers/default.ts";

export { createRox } from "./core.ts";
export type { MatcherFunction, MatcherNode, Modifier, RoxInstance, RoxOptions } from "./types.ts";
export { defaultMatchers } from "../matchers/default.ts";

/** 开箱即用的默认实例 */
export const rox = createRox({ matchers: defaultMatchers });
