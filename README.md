# RoxCSS / 运行时原子 CSS 引擎

RoxCSS is a runtime atomic CSS engine. It is a template-string tag function that parses class names on the fly and injects the matching CSS rules into the document. No build step, no configuration file, no purge phase — whatever class name you write, the rule is generated when it is first used.

RoxCSS 是一个运行时原子 CSS 引擎。它是一个模板字符串标签函数，在调用时动态解析类名并注入对应的 CSS 规则。没有构建步骤、没有配置文件、没有清除阶段——你写出什么类名，规则就在首次使用时生成。

## Features / 特性

- **Zero build, zero config.** Rules are generated and injected at runtime. Nothing to precompile.
- **Framework-agnostic.** Works anywhere a template tag works: plain HTML, Vue, React, Svelte, or a raw `document.querySelector`.
- **Class names pass through.** The token you write is the class name in the DOM — what you see in DevTools is exactly what you typed. No generated hash names.
- **Value passthrough.** Values are inserted as-is. `w-170px` means `width: 170px`. There is no magic between the token and the declaration.
- **Tailwind-aligned default preset.** The built-in preset follows Tailwind v4 naming (`flex-col`, `rounded`, `grid-cols-3`, `hover:bg-...`), while the value system stays roxcss-native (see [Default Preset / 默认预设](#default-preset--默认预设)).
- **Sync by design.** When the `rox` call returns, the rules are already in effect.

- **零构建、零配置**：规则在运行时生成并注入，无需任何预编译。
- **框架无关**：任何模板标签可用的地方都能用——原生 HTML、Vue、React、Svelte，甚至裸 `document.querySelector`。
- **类名透传**：你写下的 token 就是 DOM 中的类名，DevTools 里看到的就是你输入的原文，没有哈希类名。
- **值透传**：值原样插入声明。`w-170px` 就是 `width: 170px`。token 与声明之间没有魔法。
- **对齐 Tailwind 的默认预设**：内置预设沿用 Tailwind v4 命名（`flex-col`、`rounded`、`grid-cols-3`、`hover:bg-...`），数值体系保持 roxcss 原生（见 [Default Preset / 默认预设](#default-preset--默认预设)）。
- **天生同步**：`rox` 调用返回时，规则已经生效。

## Quick Start / 快速开始

Install the package:

安装依赖：

```bash
npm install roxcss
```

Create an instance from the default preset and use it as a template tag:

基于默认预设创建实例，并作为模板标签使用：

```ts
import { rox } from "roxcss";

// returns tokens unchanged and injects the rules / 原样返回 token 并注入规则
const className = rox`flex flex-col gap-16px p-24px rounded-8px hover:bg-blue`;

document.body.className = className;
// <body class="flex flex-col gap-16px p-24px rounded-8px hover:bg-blue">
// a <style data-roxcss> in <head> now holds these rules / head 中的 <style data-roxcss> 现在持有这些规则：
//   [class~="flex"] { display:flex }
//   [class~="flex-col"] { display:flex;flex-direction:column }
//   [class~="hover:bg-blue"]:hover { background:blue }
```

The tag function is sync: when the call returns, the rules are live. Repeated calls with the same tokens are cached and never touch the DOM again.

标签函数是同步的：调用返回时规则已生效。相同 token 的重复调用命中缓存，不再触碰 DOM。

`rox` is the out-of-the-box instance built on the default preset. To start from an empty matcher tree, use `createRox`:

`rox` 是基于默认预设的开箱即用实例。如果想从空的 matcher 树开始，用 `createRox`：

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

myRox`md:flex-col p-16px`; // rule injected under a min-width: 768px media query / 规则注入到 min-width:768px 媒体查询中
```

## How It Works / 工作方式

A token is split by `-` into segments, and the segments walk a nested **matcher tree**. Two kinds of nodes exist:

token 按 `-` 拆成段，段在嵌套的 **matcher 树**中逐段查找。节点只有两种：

| Node / 节点     | Example / 示例                                     | Behavior / 行为                                                                                              |
| --------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Function / 函数 | `p: (v) => \`padding:${v}\``                       | Swallows all remaining segments, called with one argument per segment. / 吞掉所有剩余段，每段一个参数调用    |
| Object / 对象   | `{ flex: { "": () => "display:flex", col: ... } }` | Container. Segments are used as keys to descend; `""` is the fallback. / 容器。段作为键向下查找，`""` 为兜底 |

Match resolution, in order: exact key → `""` fallback → failure. On failure the token is returned unchanged and no rule is injected. A function returning `null` also means failure.

匹配解析顺序：精确键 → `""` 兜底 → 失败。失败时 token 原样返回且不注入规则。函数返回 `null` 同样视为失败。

```ts
// matcher tree / matcher 树
{
  flex: {
    "": () => "display:flex",            // flex / flex-xxx
    col: () => "display:flex;flex-direction:column", // flex-col
    space: {
      "": (v) => `justify-content:space-${v}`, // flex-space-between / flex-space-around
      between: () => "justify-content:space-between",
    },
  },
  rounded: (v) => `border-radius:${v}`,  // rounded-8px
}

// token resolution / token 解析
// flex            → flex[""]()                    → display:flex
// flex-col        → flex.col()                    → flex-direction:column
// flex-space-between → flex.space.between()       → justify-content:space-between
// rounded-8px     → rounded("8px")                → border-radius:8px
```

### Prefixes: pseudo-classes and environment modifiers / 前缀：伪类与环境修饰符

Tokens split by `:` — the first parts are prefixes, the last part is the matcher key. Each prefix part is checked against the `modifiers` registry: registered ones are **environment modifiers** (at most one — they wrap the whole rule in `@media`, `.dark`, etc.), the rest are treated as **pseudo-classes** and appended to the selector freely in any order and amount.

token 按 `:` 拆分——前面的部分是前缀，最后一段是 matcher 键。每个前缀段先查 `modifiers` 注册表：命中的是**环境修饰符**（最多一个——它把整条规则包裹进 `@media`、`.dark` 等环境），其余一律视为**伪类**，任意数量、任意顺序拼接到选择器上。

```ts
myRox`hover:p-8px`; // [class~="hover:p-8px"]:hover { padding:8px }
myRox`md:flex-col`; // @media (min-width:768px) { [class~="md:flex-col"] { display:flex;flex-direction:column } }
myRox`md:hover:focus:p-8px`; // @media (min-width:768px) { [class~="..."]:hover:focus { padding:8px } }
```

### Cache / 缓存

Each token is resolved exactly once per instance. Injected and failed tokens are remembered in two `Set`s — a repeated render costs a single cache lookup and nothing else.

每个 token 在每个实例中只解析一次。已注入与已失败的 token 分别记入两个 `Set`——重复渲染只付出一次缓存查询，再无其他。

## API / API 参考

### `createRox(options)`

Creates a new instance with a fresh internal state (matcher tree reference, injection caches, rule memory). Every instance is fully independent.

创建全新实例（独立持有 matcher 树引用、注入缓存与规则内存）。每个实例完全独立。

- **`options`**

  The configuration object / 配置对象。

- **`options.matchers`**

  `Record<string, MatcherNode>` — the matcher tree. Keys are segment roots, values are functions or nested objects (see [How It Works / 工作方式](#how-it-works--工作方式)).

  matcher 树。键是段根，值是函数或嵌套对象（见 [How It Works / 工作方式](#how-it-works--工作方式)）。

- **`options.modifiers`** (optional / 可选)

  `Record<string, Modifier>` — environment modifier registry, keyed by prefix name. Defaults to an empty registry, in which case every prefix is treated as a pseudo-class.

  环境修饰符注册表，以前缀名为键。默认空注册表，此时所有前缀都按伪类处理。

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

  Tag invocation. Splits the interpolated string on whitespace, resolves each token, and joins the results with a space — the class name string you can put on an element. Rules are flushed synchronously when the call returns.

  标签调用。按空白拆分插值后的字符串，逐个解析 token，用空格连接结果——即可以直接放到元素上的类名字符串。调用返回时规则同步写入。

- **`getCSS()`**

  Returns every rule the instance has injected so far, joined with newlines. Useful for SSR style collection and debugging. Works even without a DOM.

  返回实例迄今注入的全部规则，换行连接。适用于 SSR 样式收集与调试。无 DOM 时同样可用。

### `createConfig(overrides?)`

Creates the default preset — a fresh matcher tree (90+ top-level roots) plus fresh breakpoint modifiers. Every call rebuilds the whole tree, so instances sharing a config never share references.

创建默认预设——全新的 matcher 树（90+ 顶层根）与全新的断点 modifiers。每次调用整树重建，共享同一 config 的实例之间零引用共享。

- **`overrides`** (optional / 可选)

  `PresetOverrides` — recursive overrides merged on top of the defaults (see [Customization / 自定义](#customization--自定义)).

  递归覆盖参数，合并到默认配置之上（见 [Customization / 自定义](#customization--自定义)）。

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

### `rox`

The default instance: `createRox(createConfig())`. Import it and go.

默认实例：`createRox(createConfig())`。导入即用。

### Types / 类型

| Type / 类型       | Definition / 定义                                                                                  |
| ----------------- | -------------------------------------------------------------------------------------------------- |
| `MatcherFunction` | `(...args: string[]) => string \| null` — one argument per remaining segment. / 剩余段每段一个参数 |
| `MatcherNode`     | `MatcherFunction \| { [key: string]: MatcherNode }`                                                |
| `Modifier`        | `(selector: string, cssDecl: string) => string`                                                    |
| `MatcherPatch`    | `MatcherFunction \| null \| { [key: string]: MatcherPatch }` — override shape. / 覆盖形状          |
| `PresetOverrides` | `{ matchers?: Record<string, MatcherPatch>; modifiers?: Record<string, Modifier \| null> }`        |
| `RoxOptions`      | `{ matchers: Record<string, MatcherNode>; modifiers?: Record<string, Modifier> }`                  |
| `Preset`          | `{ matchers: Record<string, MatcherNode>; modifiers?: Record<string, Modifier> }`                  |
| `RoxInstance`     | Callable template tag with `getCSS`. / 可调用模板标签 + `getCSS`                                   |

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

RoxCSS does not interpret values, so CSS variables compose naturally. A common pattern is a private helper that turns segments into a `var()` reference:

RoxCSS 不解析值，CSS 变量因此天然可组合。常见做法是私有 helper 把段拼成 `var()` 引用：

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

1. **Values are passed through as-is.** Tailwind translates `p-4` into `1rem` via its numeric scale; roxcss does not interpret numbers. Write the full value: `p-4px`, `w-170px`, `gap-16px`, `aspect-16/9`. Pure numbers produce invalid CSS — a caller error.

   **值原样透传**。Tailwind 通过数值刻度把 `p-4` 翻译成 `1rem`；roxcss 不解释数字。单位写全：`p-4px`、`w-170px`、`gap-16px`、`aspect-16/9`。纯数字会生成无效 CSS，属调用方错误。

2. **`text` is font-size, `color` is a separate root.** Tailwind overloads `text-*` for color; roxcss keeps them apart: `text-16px` → font-size, `color-accent` → color.

   **`text` 管字号、`color` 是独立根**。Tailwind 用 `text-*` 兼任颜色；roxcss 分开处理：`text-16px` → 字号，`color-accent` → 颜色。

Selected utilities (a complete listing lives in `docs/预设设计.md`):

常用工具类节选（完整清单见 `docs/预设设计.md`）：

| Class / 类名                              | Declaration / 声明                                                                    |
| ----------------------------------------- | ------------------------------------------------------------------------------------- |
| `flex` / `flex-col` / `flex-row`          | `display:flex` / column / row / 块级弹性盒，纵/横向排列                               |
| `flex-1` / `grow`                         | `flex:1` / `flex-grow:1` / 填满剩余空间 / 单项伸长                                    |
| `items-center` / `justify-between`        | `align-items:center` / `justify-content:space-between` / 交叉轴居中 / 主轴两端        |
| `self-*` / `content-*`                    | align-self / align-content / 自身对齐 / 多行分布                                      |
| `gap-16px` / `gap-x-8px` / `gap-y-8px`    | gap / column-gap / row-gap / 间距 / 列间距 / 行间距                                   |
| `grid` / `grid-cols-3` / `grid-rows-2`    | display:grid / repeat(3,minmax(0,1fr)) / 网格容器 / 3 列 / 2 行                       |
| `col-span-2` / `row-span-2`               | `grid-column:span 2 / span 2` / 跨 2 列 / 跨 2 行                                     |
| `p-24px` / `px-16px` / `pt-8px`           | padding / padding-inline / padding-top / 四周 / 水平 / 顶部（margin 同理，`m-` 前缀） |
| `w-170px` / `h-28px` / `size-10px`        | width / height / 两者同设 / 宽 / 高 / 宽高同设                                        |
| `max-w-*` / `min-w-*`                     | max-width / min-width / 最大 / 最小宽度                                               |
| `inset-x-0` / `top-0` / `right-0`         | inset / top / right / bottom / left / 定位偏移                                        |
| `z-10` / `relative` / `absolute`          | z-index / position / 层级与定位                                                       |
| `text-16px` / `text-center`               | font-size / text-align / 字号 / 对齐（`text` 根 = 字号）                              |
| `font-bold` / `font-sans` / `font-mono`   | font-weight:700 / font-family / 字重与字体族                                          |
| `leading-*` / `tracking-*`                | line-height / letter-spacing / 行高 / 字距                                            |
| `rounded-8px` / `border-2px-solid-red`    | border-radius / border / 圆角 / 边框简写（`border-t`/`x`/`color`…）                   |
| `bg-blue` / `color-red`                   | background / color / 背景与文字颜色（值透传）                                         |
| `shadow` / `opacity-0.8`                  | box-shadow / opacity / 阴影 / 透明度（数值原样，写 `0.8` 或 `80%`）                   |
| `transition-*` / `duration-*` / `delay-*` | transition / duration / delay / 过渡、时长与延迟（值透传）                            |
| `overflow-hidden` / `overflow-x-auto`     | overflow / overflow-x / 溢出隐藏 / 横向滚动                                           |
| `underline` / `line-through` / `truncate` | text-decoration / 下划线 / 删除线 / 单行截断省略                                      |
| `whitespace-nowrap` / `break-all`         | white-space / word-break / 空白处理 / 强制断行                                        |
| `hidden` / `block` / `inline-flex`        | display / 显示模式家族                                                                |
| `list-none` / `list-disc`                 | list-style / 列表样式                                                                 |
| `sr-only` / `isolate` / `aspect-16/9`     | 屏幕阅读器专用 / 隔离上下文 / 宽高比                                                  |

Breakpoints come from `createModifiers()` with `defaultBreakpoints`, all `min-width` media queries. Prefix a token with a breakpoint and it applies from that width up:

断点由 `createModifiers()` 基于 `defaultBreakpoints` 生成，全部为 `min-width` 媒体查询。在 token 前加断点前缀，规则从该宽度起生效：

```html
<div class="flex-col lg:flex-row">…</div>
```

## Framework Usage / 框架用法

Because class names are returned as plain strings, any binding works. A Vue example:

类名以普通字符串返回，任何绑定方式都适用。Vue 示例：

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

The same class-name string can be produced anywhere — inside a computed property, an inline handler, or a plain function — and handed to a framework's class binding.

同样的类名字符串可以在任何位置生成——computed、事件处理器或普通函数——然后交给框架的 class 绑定。

## Performance & Injection / 性能与注入

- **Per-token resolution happens once.** Two `Set`s (`injected` / `failed`) deduplicate tokens for the life of an instance. Repeated renders never touch the style layer.
- **Batch flush per call.** All new rules from one call are appended to the active `<style>` bucket in a single `textContent` write — one parse, one style invalidation. No per-rule `insertRule` (measured O(N²) under interleaved forced layout; see the docs).
- **Rolling style buckets.** The active `<style data-roxcss>` element is reused until it holds 1000 rules, then frozen and a new one is created. Bucket count stays at `ceil(rules / 1000)` — no DevTools panel clutter.
- **SSR safe.** With no DOM, rules are kept in memory and readable via `getCSS()`.

- **每个 token 只解析一次**：两个 `Set`（`injected` / `failed`）在实例生命周期内去重，重复渲染不触碰样式层。
- **每次调用批量写入**：一次调用产生的新规则，以一次 `textContent` 赋值追加到活动 `<style>` 桶——一次解析、一次样式失效。不使用逐条 `insertRule`（实测在交替强制布局场景退化为 O(N²)，详见文档）。
- **滚动 style 桶**：活动 `<style data-roxcss>` 元素复用到 1000 条规则后冻结，新建下一个。桶数保持在 ceil(规则数 / 1000)——DevTools 面板不堆积。
- **SSR 安全**：无 DOM 时规则保存在内存，经 `getCSS()` 读取。

Measurements and the full write-up live in the design docs (in Chinese).

实测数据与完整分析见设计文档（中文）。

## Docs / 设计文档

The design docs are written in Chinese and archived under `docs/`:

设计文档以中文撰写，归档在 `docs/`：

| Doc / 文档                                        | Content / 内容                                                                          |
| ------------------------------------------------- | --------------------------------------------------------------------------------------- |
| [设计方案.md](./docs/设计方案.md)                 | Engine architecture, token parsing, matcher lookup / 引擎架构、token 解析、matcher 查找 |
| [预设设计.md](./docs/预设设计.md)                 | Default preset design and full utility listing / 默认预设设计与完整工具类清单           |
| [样式表管理策略.md](./docs/样式表管理策略.md)     | Rolling `<style>` bucket injection design / style 滚动桶注入设计                        |
| [性能分析.md](./docs/性能分析.md)                 | Performance model and measurements / 性能模型与实测                                     |
| [tailwind对齐计划.md](./docs/tailwind对齐计划.md) | Tailwind v4 alignment decisions and gaps / Tailwind v4 对齐决策与差距                   |
