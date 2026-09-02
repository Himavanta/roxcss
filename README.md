# roxcss

roxcss is a runtime atomic CSS engine. It is a template-string tag function that parses class names on the fly and injects the matching CSS rules into the document. No build step, no configuration file, no purge phase — whatever class name you write, the rule is generated when it is first used.

roxcss 是一个运行时原子 CSS 引擎。它是一个模板字符串标签函数，在调用时动态解析类名并注入对应的 CSS 规则。没有构建步骤、没有配置文件、没有清除阶段——你写出什么类名，规则就在首次使用时生成。

## Features / 特性

- **Zero build, zero config** — rules are generated and injected at runtime, the first time a class name is used. Nothing to precompile.
- **Framework-agnostic** — works anywhere a template-string tag works: plain HTML, Vue, React, and more.
- **No hidden class names** — the class you write is the class in the DOM and the selector in DevTools. What you see is what you typed.
- **Values, not magic** — `w-170px` means exactly `width: 170px`. No numeric scale sits between your token and the CSS.
- **Tailwind-style preset** — a built-in preset reuses Tailwind v4 utility names, ready to extend or replace (see [Default Preset / 默认预设](#default-preset--默认预设)).
- **Synchronous** — the rules are live the moment the call returns.

- **零构建、零配置**：类名首次使用时，规则在运行时生成并注入，无需任何预编译。
- **框架无关**：任何模板字符串标签可用的地方都能用——原生 HTML、Vue、React 等。
- **类名即真相**：你写下的类名就是 DOM 中的类、DevTools 中的选择器。所见即所写。
- **无魔法值**：`w-170px` 就是 `width: 170px`。token 与 CSS 之间没有数值刻度。
- **Tailwind 风格预设**：内置预设复用 Tailwind v4 工具类命名，可自由扩展或替换（见 [Default Preset / 默认预设](#default-preset--默认预设)）。
- **天生同步**：调用返回的瞬间，规则已经生效。

## Quick Start / 快速开始

Install the package, then import the default instance and use it as a template tag. The tokens you write are returned unchanged, and the matching rules are injected into `<head>`:

安装依赖后导入默认实例 `rox`，并把它作为模板标签使用。你写下的 token 会原样返回，匹配的规则注入 `<head>`：

```bash
npm install roxcss
```

```ts
import { rox } from "roxcss";

// tokens are returned unchanged / token 原样返回
const className = rox`flex flex-col gap-16px p-24px rounded-8px hover:bg-blue`;

document.body.className = className;
// <body class="flex flex-col gap-16px p-24px rounded-8px hover:bg-blue">
```

The call injects these rules into a `<style data-roxcss>` element in `<head>`:

这次调用向 `<head>` 中的 `<style data-roxcss>` 元素注入以下规则：

```css
[class~="flex"] {
  display: flex;
}
[class~="flex-col"] {
  display: flex;
  flex-direction: column;
}
[class~="hover:bg-blue"]:hover {
  background: blue;
}
```

The tag function is sync: when the call returns, the rules are live. Repeated calls with the same tokens hit the cache and never touch the style layer again — steady-state rendering costs nothing beyond the returned string.

标签函数是同步的：调用返回时规则已生效。相同 token 的重复调用命中缓存，之后不再触碰样式层——稳定态渲染除了返回字符串外零开销。

`rox` is the out-of-the-box instance built on the default preset. When you need a preset-free setup — a design system with its own vocabulary, a framework-specific shim, or an experiment — build your own matcher tree with `createRox`. The minimal instance below registers two spacing utilities and one layout utility, plus an `md` breakpoint modifier:

`rox` 是基于默认预设的开箱即用实例。当需要脱离预设——自有词汇的设计系统、框架专用垫片或临时实验——用 `createRox` 自建 matcher 树。下面的最小实例注册了两个间距工具、一个布局工具，以及 `md` 断点修饰符：

```ts
import { createRox } from "roxcss";

const myRox = createRox({
  matchers: {
    p: (v) => `padding:${v}`,
    m: (v) => `margin:${v}`,
    flex: {
      "": () => "display:flex",
      col: () => "display:flex;flex-direction:column",
    },
  },
  modifiers: {
    md: (selector, cssDecl) => `@media (min-width: 768px) { ${selector} { ${cssDecl} } }`,
  },
});

myRox`md:flex-col p-16px`;
// the media-wrapped rule is injected / 媒体查询包裹的规则被注入
```

## How It Works / 工作方式

A token is split by `-` into segments, and the segments walk a nested **matcher tree** with two kinds of nodes — functions and objects:

token 按 `-` 拆成段，段在嵌套的 **matcher 树**中逐段查找。节点只有两种——函数与对象：

**Function node / 函数节点：**

A function swallows the remaining segments and is called with one argument per segment. It returns the declaration text — or `null` to mark failure.

函数吞掉剩余所有段，剩余段每段一个参数调用，返回声明文本——返回 `null` 表示失败。

```ts
// matcher definition (a function node) / matcher 定义（函数节点）
p: (v) => `padding:${v}`;

// token flow / token 解析流程
//   p-24px
//     → segments ["p", "24px"]
//     → "p" is a function, swallows the rest → p("24px")
//     → padding:24px
```

**Object node / 对象节点：**

An object is a container that remaining segments descend through as keys. The `""` key is the fallback — used when the segments run out or no key matches.

对象是容器，剩余段作为键逐层下行。`""` 键是兜底——段耗尽或无键匹配时使用。

```ts
// matcher definition (an object node) / matcher 定义（对象节点）
flex: {
  "": () => "display:flex",
  col: () => "display:flex;flex-direction:column",
}

// token flow / token 解析流程
//   flex-col
//     → segments ["flex", "col"]
//     → "flex" is an object, descend by key "col" → flex.col()
//     → display:flex;flex-direction:column
//   flex
//     → segments ["flex"], segments run out, object has "" → flex[""]()
//     → display:flex
```

Match resolution, in order: exact key → `""` fallback → failure. On failure the token is returned unchanged and no rule is injected. A function returning `null` also means failure.

匹配解析顺序：精确键 → `""` 兜底 → 失败。失败时 token 原样返回且不注入规则。函数返回 `null` 同样视为失败。

### Prefixes: pseudo-classes and environment modifiers / 前缀：伪类与环境修饰符

Tokens split by `:` — the first parts are prefixes, the last part is the matcher key. Each prefix part is checked against the `modifiers` registry: registered ones are **environment modifiers** (at most one — they wrap the whole rule in `@media`, `.dark`, etc.), the rest are treated as **pseudo-classes** and appended to the selector freely in any order and amount.

token 按 `:` 拆分——前面的部分是前缀，最后一段是 matcher 键。每个前缀段先查 `modifiers` 注册表：命中的是**环境修饰符**（最多一个——它把整条规则包裹进 `@media`、`.dark` 等环境），其余一律视为**伪类**，任意数量、任意顺序拼接到选择器上。

```ts
// → [class~="hover:p-8px"]:hover { padding:8px }
myRox`hover:p-8px`;

// → @media (min-width:768px) { [class~="md:flex-col"] { display:flex;flex-direction:column } }
myRox`md:flex-col`;

// → @media (min-width:768px) { [class~="md:hover:focus:p-8px"]:hover:focus { padding:8px } }
myRox`md:hover:focus:p-8px`;
```

### Cache / 缓存

Each token is resolved exactly once per instance. Injected and failed tokens are remembered in two `Set`s — a repeated render costs a single cache lookup and nothing else.

每个 token 在每个实例中只解析一次。已注入与已失败的 token 分别记入两个 `Set`——重复渲染只付出一次缓存查询，再无其他。

## API / API 参考

### `createRox(options)`

`createRox` creates a fully independent instance with its own matcher tree, injection caches (`injected` / `failed`), and rule memory. Multiple instances can coexist without sharing any state. Pair it with `createConfig` for a preset-based instance, or pass a hand-written tree for a preset-free one:

`createRox` 创建完全独立的实例——各自的 matcher 树、注入缓存（`injected` / `failed`）与规则内存。多个实例可并存，互不共享状态。配合 `createConfig` 得到基于预设的实例；传入手写 matcher 树则脱离预设：

- **`matchers`** `Record<string, MatcherNode>`
  - the matcher tree. Keys are segment roots, values are functions or nested objects (see [How It Works / 工作方式](#how-it-works--工作方式)).
  - matcher 树。键是段根，值是函数或嵌套对象（见 [How It Works / 工作方式](#how-it-works--工作方式)）。

- **`modifiers`** `Record<string, Modifier>` (optional / 可选)
  - environment modifier registry, keyed by prefix name. Defaults to an empty registry, in which case every prefix is treated as a pseudo-class.
  - 环境修饰符注册表，以前缀名为键。默认空注册表，此时所有前缀都按伪类处理。

### `RoxInstance`

The object returned by `createRox` — a callable template tag carrying a `getCSS` method.

`createRox` 的返回值——可调用的模板标签函数，挂载 `getCSS` 方法。

```ts
interface RoxInstance {
  (strings: TemplateStringsArray, ...values: unknown[]): string;
  getCSS(): string;
}
```

- **`(strings, ...values)`**
  - tag invocation: splits the interpolated string on whitespace, resolves each token, and joins the results with a space — the class-name string you can put on an element. Rules are flushed synchronously when the call returns.
  - 标签调用：按空白拆分插值后的字符串，逐个解析 token，用空格连接结果——即可直接放到元素上的类名字符串。调用返回时规则同步写入。

- **`getCSS()`**
  - returns every rule the instance has injected so far, joined with newlines. Useful for SSR style collection and debugging; works even without a DOM.
  - 返回实例迄今注入的全部规则，换行连接。适用于 SSR 样式收集与调试，无 DOM 时同样可用。

### `rox`

The default instance: `createRox(createConfig())` — the out-of-the-box matcher tree plus `sm`–`2xl` breakpoint modifiers. Use it directly when the default preset fits; build a custom instance with the factories below when it does not.

默认实例：`createRox(createConfig())`——开箱即用的 matcher 树加 `sm`–`2xl` 断点修饰符。默认预设适用时直接使用；不适用时用下面的工厂函数构建自定义实例。

### `createConfig(overrides?)`

Creates the default preset — a fresh matcher tree (90+ top-level roots) plus fresh breakpoint modifiers. Every call rebuilds the whole tree, so instances sharing a config never share references.

创建默认预设——全新的 matcher 树（90+ 顶层根）与全新的断点 modifiers。每次调用整树重建，共享同一 config 的实例之间零引用共享。

- **`overrides`** `PresetOverrides` (optional / 可选)
  - recursive overrides merged on top of the defaults (see [Customization / 自定义](#customization--自定义)).
  - 递归覆盖参数，合并到默认配置之上（见 [Customization / 自定义](#customization--自定义)）。

### `createModifiers(breakpoints?)`

Creates breakpoint environment modifiers from a name → pixel table. The passed table completely determines the output — no implicit merging with the default.

根据"名称 → 像素"表创建断点环境修饰符。传入的表完全决定输出——不会隐式合并默认断点。

```ts
createModifiers({ ...defaultBreakpoints, xxl: 1700 });
// each breakpoint name produces a min-width media query / 每个断点名生成一条 min-width 媒体查询
```

### `defaultBreakpoints`

| Breakpoint / 断点 | Min-width / 最小宽度 |
| ----------------- | -------------------- |
| `sm`              | 640px                |
| `md`              | 768px                |
| `lg`              | 1024px               |
| `xl`              | 1280px               |
| `2xl`             | 1536px               |

### Types / 类型

Every type is exported from `roxcss` alongside the functions. The structural types are spelled out in the entries above; the core shapes are:

全部类型与函数一同从 `roxcss` 导出。结构性类型的完整定义见上方 API 条目，核心形状如下：

- **`MatcherFunction`** `(...args: string[]) => string | null`
  - leaf of the matcher tree; one argument per remaining segment. Returning `null` marks failure.
  - matcher 树叶子；剩余段每段一个参数。返回 `null` 表示匹配失败。

- **`MatcherNode`** `MatcherFunction | { [key: string]: MatcherNode }`
  - a leaf function, or a nested container whose keys are segment names and whose `""` key is the fallback.
  - 叶子函数，或嵌套容器——键是段名，`""` 键为兜底。

- **`Modifier`** `(selector: string, cssDecl: string) => string`
  - wraps a complete rule in an environment (`@media`, `.dark`, …) given the final selector and declaration.
  - 根据最终选择器与声明，把完整规则包裹进环境（`@media`、`.dark` 等）。

- **`MatcherPatch`** `MatcherFunction | null | { [key: string]: MatcherPatch }`
  - the override shape for `createConfig`: same as `MatcherNode`, plus `null` to delete a key.
  - `createConfig` 的覆盖形状：与 `MatcherNode` 相同，多出的 `null` 表示删除键。

- **`RoxOptions`** `{ matchers: Record<string, MatcherNode>; modifiers?: Record<string, Modifier> }`
  - the input of `createRox`.
  - `createRox` 的入参。

- **`Preset`** `{ matchers: Record<string, MatcherNode>; modifiers?: Record<string, Modifier> }`
  - the output of `createConfig`.
  - `createConfig` 的返回。

- **`PresetOverrides`** `{ matchers?: Record<string, MatcherPatch>; modifiers?: Record<string, Modifier | null> }`
  - the input of `createConfig`.
  - `createConfig` 的覆盖入参。

- **`RoxInstance`** — see the `RoxInstance` entry above: a callable template tag with `getCSS`.
  - 见上方 `RoxInstance` 条目：可调用模板标签 + `getCSS`。

## Customization / 自定义

### Writing matchers / 编写 matcher

A matcher receives one argument per remaining segment. Read values directly; spread when the value spans multiple segments:

matcher 的每个剩余段对应一个参数。单段值直接读取，多段值用 rest 展开：

```ts
createRox({
  matchers: {
    // one segment / 单段：text-14px → font-size:14px
    text: (v) => `font-size:${v}`,
    // multiple segments joined with spaces / 多段空格连接：rounded-4px-8px → border-radius:4px 8px
    rounded: (...vs) => `border-radius:${vs.join(" ")}`,
  },
});
```

A function returning `null` marks the token as failed (warning in dev, nothing injected).

函数返回 `null` 表示匹配失败（开发环境警告，不注入）。

### Writing modifiers / 编写 modifier

A modifier receives the final selector and the CSS declaration, and returns a full rule:

modifier 接收最终选择器与 CSS 声明，返回完整规则：

```ts
const modifiers = {
  dark: (selector, cssDecl) => `.dark ${selector} { ${cssDecl} }`,
  maxLg: (selector, cssDecl) => `@media (max-width: 1024px) { ${selector} { ${cssDecl} } }`,
};
```

### Extending the default preset / 扩展默认预设

`createConfig` accepts recursive overrides: objects merge key by key (defaults survive), functions and other values replace wholesale, `null` deletes a key. The engine treats any non-function non-object value as "key absent", so deletion needs no special case.

`createConfig` 支持递归覆盖：对象逐键合并（默认键保留），函数与其他值整体替换，`null` 删除键。引擎把非函数非普通对象的值一律视为"键不存在"，删除因此无需特判。

```ts
import { createRox, createConfig } from "roxcss";

const rox = createRox(
  createConfig({
    modifiers: {
      lg: (selector, cssDecl) =>
        // override / 覆盖默认的 min-width 语义
        `@media (max-width: 1024px) { ${selector} { ${cssDecl} } }`,
    },
    matchers: {
      // merge into the default flex subtree / 合并进默认 flex 子树
      flex: { half: () => "flex:1 1 calc(50% - 8px)" },
      // replace a whole subtree / 整体替换某子树
      shadow: () => "box-shadow:var(--shadow)",
      // delete a root / 删除某个根
      animate: null,
    },
  }),
);
```

### Working with CSS variables / 配合 CSS 变量

roxcss does not interpret values, so CSS variables compose naturally. A common pattern is a private helper that turns segments into a `var()` reference:

roxcss 不解析值，CSS 变量因此天然可组合。常见做法是私有 helper 把段拼成 `var()` 引用：

```ts
// segments → var(--accent-bg) / 段 → var(--accent-bg)
const cssVar = (vs: string[]) => `var(--${vs.join("-")})`;

createRox(
  createConfig({
    matchers: {
      color: (...vs) => `color:${cssVar(vs)}`,
      bg: (...vs) => `background:${cssVar(vs)}`,
      border: {
        color: (...vs) => `border-color:${cssVar(vs)}`,
        t: () => "border-top:1px solid var(--border)",
      },
    },
  }),
);
```

## Default Preset / 默认预设

The default preset aligns its naming with **Tailwind v4** — same utility names, same nesting logic — so knowledge transfers directly. Two deliberate differences:

默认预设的命名对齐 **Tailwind v4**——相同的工具类名、相同的嵌套逻辑，知识可直接迁移。两处刻意的差异：

**Values are passed through as-is / 值原样透传：**

Tailwind translates `p-4` into `1rem` via its numeric scale; roxcss does not interpret numbers. Write the full value: `p-4px`, `w-170px`, `gap-16px`, `aspect-16/9`. Pure numbers produce invalid CSS — a caller error.

Tailwind 通过数值刻度把 `p-4` 翻译成 `1rem`；roxcss 不解释数字。单位写全：`p-4px`、`w-170px`、`gap-16px`、`aspect-16/9`。纯数字会生成无效 CSS，属调用方错误。

**`text` is font-size, `color` is a separate root / `text` 管字号，`color` 是独立根：**

Tailwind overloads `text-*` for color; roxcss keeps them apart: `text-16px` → font-size, `color-accent` → color.

Tailwind 用 `text-*` 兼任颜色；roxcss 分开处理：`text-16px` → 字号，`color-accent` → 颜色。

The preset covers layout, spacing, typography, borders, colors, and effects, grouped by category below — each class maps one-to-one to a declaration, and the value in the class name appears verbatim in the CSS. This is a selection; the full listing lives in `docs/预设设计.md`.

默认预设覆盖布局、间距、排版、边框、颜色与效果。下面按类别示例——每个类名一对一映射到声明，类名中的值原样出现在 CSS 中。此为节选，完整清单见 `docs/预设设计.md`。

**Layout / 布局：**

```text
flex              → display:flex
flex-col          → display:flex;flex-direction:column
grid-cols-3       → display:grid;grid-template-columns:repeat(3,minmax(0,1fr))
items-center      → align-items:center
justify-between   → justify-content:space-between
gap-16px          → gap:16px
p-24px            → padding:24px
w-170px           → width:170px
```

**Typography / 排版：**

```text
text-16px         → font-size:16px
text-center       → text-align:center
font-bold         → font-weight:700
leading-16px      → line-height:16px
underline         → text-decoration-line:underline
truncate          → overflow:hidden;text-overflow:ellipsis;white-space:nowrap
```

**Borders, colors & effects / 边框、颜色与效果：**

```text
rounded-5px       → border-radius:5px
border-2px-solid-red → border:2px solid red
bg-blue           → background:blue
color-red         → color:red
duration-150ms    → transition-duration:150ms
delay-75ms        → transition-delay:75ms
```

**Position, overflow & more / 定位、溢出与其他：**

```text
relative          → position:relative
inset-x-0         → inset-inline:0
z-10              → z-index:10
overflow-x-auto   → overflow-x:auto
hidden            → display:none
list-none         → list-style:none
aspect-16/9       → aspect-ratio:16/9
```

Families share a pattern: every side and axis variant exists — `m` mirrors `p`, `overflow-y` mirrors `overflow-x`, and so on.

工具类家族遵循同一模式：每个方向与轴向的变体都存在——`m` 与 `p` 对应，`overflow-y` 与 `overflow-x` 对应，依此类推。

Breakpoints come from `createModifiers()` with `defaultBreakpoints`, all `min-width` media queries. Prefix a class name with a breakpoint and it applies from that width up:

断点由 `createModifiers()` 基于 `defaultBreakpoints` 生成，全部为 `min-width` 媒体查询。在类名前加断点前缀，规则从该宽度起生效：

```html
<div class="flex-col lg:flex-row">…</div>
```

## Framework Usage / 框架用法

Because class names are returned as plain strings, any class binding works. The string can be produced anywhere — a computed property, an inline handler, or a plain function — and handed to a framework's binding. A Vue example:

类名以普通字符串返回，因此任何 class 绑定方式都适用。字符串可以在任何位置生成——computed、事件处理器或普通函数——再交给框架的绑定。Vue 示例：

```vue
<script setup lang="ts">
import { rox } from "./rox"; // your configured instance / 你配置好的实例
</script>

<template>
  <button
    type="button"
    :class="
      rox`inline-flex font-mono text-16px px-10px rounded-5px
           hover:bg-blue focus-visible:bg-blue`
    "
  >
    Click me
  </button>
</template>
```

## Performance & Injection / 性能与注入

- **Batch flush per call.** All new rules from one call are appended to the active `<style>` bucket in a single `textContent` write — one parse, one style invalidation. No per-rule `insertRule` (measured O(N²) under interleaved forced layout; see the docs).
- **Rolling style buckets.** The active `<style data-roxcss>` element is reused until it holds 1000 rules, then frozen and a new one is created. Bucket count stays at `ceil(rules / 1000)` — no DevTools panel clutter.
- **SSR safe.** With no DOM, rules are kept in memory and readable via `getCSS()`.

- **每次调用批量写入**：一次调用产生的新规则，以一次 `textContent` 赋值追加到活动 `<style>` 桶——一次解析、一次样式失效。不使用逐条 `insertRule`（实测在交替强制布局场景退化为 O(N²)）。
- **滚动 style 桶**：活动 `<style data-roxcss>` 元素复用到 1000 条规则后冻结，新建下一个。桶数保持在 ceil(规则数 / 1000)——DevTools 面板不堆积。
- **SSR 安全**：无 DOM 时规则保存在内存，经 `getCSS()` 读取。

## Docs / 设计文档

The design docs are written in Chinese and archived under `docs/`:

设计文档以中文撰写，归档在 `docs/`：

| Doc / 文档                                        | Content / 内容                                      |
| ------------------------------------------------- | --------------------------------------------------- |
| [设计方案.md](./docs/设计方案.md)                 | Engine architecture, token parsing, matcher lookup. |
|                                                   | 引擎架构、token 解析、matcher 查找。                |
| [预设设计.md](./docs/预设设计.md)                 | Default preset design and full utility listing.     |
|                                                   | 默认预设设计与完整工具类清单。                      |
| [样式表管理策略.md](./docs/样式表管理策略.md)     | Rolling `<style>` bucket injection design.          |
|                                                   | style 滚动桶注入设计。                              |
| [性能分析.md](./docs/性能分析.md)                 | Performance model and measurements.                 |
|                                                   | 性能模型与实测。                                    |
| [tailwind对齐计划.md](./docs/tailwind对齐计划.md) | Tailwind v4 alignment decisions and gaps.           |
|                                                   | Tailwind v4 对齐决策与差距。                        |
