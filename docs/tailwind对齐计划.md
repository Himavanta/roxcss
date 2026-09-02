# roxcss × Tailwind v4 对齐计划

> 状态：P1/P2/P4 已实施完成（2026-09-02）；对齐主体收敛，剩余为低频族与值解析（P3）。本文档记录对齐目标、覆盖矩阵、决策点（D 编号）与分批实施计划。
> 决策点逐个讨论确认，确认后更新状态并落代码；不一口气做完。
>
> 数据源：Tailwind CSS v4 官方源码 `tailwindlabs/tailwindcss`（`packages/tailwindcss/src/utilities.ts`，main 分支，2026-09-02 拉取），对照 `src/config.ts` 现有 matcher 树与 `packages/example` 实际用法。
> 在线浏览：<https://github.com/tailwindlabs/tailwindcss/blob/main/packages/tailwindcss/src/utilities.ts>
> raw 下载：<https://raw.githubusercontent.com/tailwindlabs/tailwindcss/main/packages/tailwindcss/src/utilities.ts>

## 一、目标与原则

**目标：类名与语义尽量与 Tailwind v4 对齐，少发明概念和语法。**

1. **对齐的是"类名 → CSS 语义"的映射约定**，不是整套值体系。值 scale（`p-4` = 1rem、色板、字号表）属值解析增强，另行设计，不在本计划内展开。
2. **三类对齐度**：
   - **A 一致**：类名与 CSS 输出和 Tailwind 完全相同（如 `items-center`、`mx-auto`）。
   - **B 等效异形**：类名结构一致但值形态不同（roxcss 值写全：`border-2px-solid` ↔ Tailwind `border-2` + `border-solid`；`opacity-50%` ↔ `opacity-50`）。语义对齐、写法不逐字对齐。
   - **C 不可实现**：roxcss 引擎模型表达不了，明确不做。
3. **引擎模型约束**（所有决策的边界，不可绕过）：
   - 单 token → 一条 `[class~="..."]` 规则：**无子组合器、无父/兄弟选择器能力**（→ C 类）；
   - **值原样透传**：同一根下"按值猜语义"（Tailwind 的 `text-sm` 是字号、`text-red-500` 是颜色）无法实现，每个根必须选定主语义（→ D01）；
   - 类名按空格 → `:` → `-` 三级分割，值段不允许 `-`（段名允许：`red-500` 的 `-` 是分隔符）；
   - 无任意值 `[...]` 语法（已决定放弃）。
4. **迁移原则**：改动已有键（改名/改语义）一律进决策点、逐个确认；example 存量用法随迁移同步，不保留无谓别名（库未发布，无历史包袱）。

---

## 二、现状快照

### 2.1 P0 时的 matcher 树快照（P1/P2 后已有较大变化，最新以 `src/config.ts` 为准）

- **单键**：`block` `hidden` `relative` `absolute` `fixed` `sticky` `z` `top` `right` `bottom` `left` `w` `h` `bg` `outline` `radius` `shadow` `opacity` `transition` `transform` `cursor` `mono` `bold` `italic` `uppercase` `lowercase` `capitalize` `size` `gap`（后接值）
- **子树**：
  - `inline` { `""`, `block`, `flex` }
  - `flex` { `""`, `col`, `row`, `wrap`, `center`, `"1"`, `half`, `grow`, `space` { `""`, `between`, `around` } }
  - `grid` { `""`, `cols` }、`items` { `center` `start` `end` `stretch` }、`justify` { `center` `between` `around` `start` `end` }、`place` { `content` `items` }
  - `p/px/py/pt/pr/pb/pl`、`m/mx/my/mt/mr/mb/ml`（多段值空格连接）
  - `max` { `w` `h` }、`min` { `w` `h` }
  - `text` { `""`(color), `center` `left` `right` }
  - `border` { `""`, `t` `b` `r` `l` `x` `y`, `color` }（多段值）
  - `inset` { `x` `y` }、`box` { `border` }、`overflow` { `hidden` `scroll` `auto` `x` `y` }
  - `no` { `underline` }、`list` { `none` }
- **modifiers**：`sm` `md` `lg` `xl`（min-width 640/768/1024/1280）

### 2.2 example 实际用到的类名（迁移影响面）

`flex` `flex-1` `flex-half` `flex-col` `flex-wrap` `grow` `items-center` `justify-center` `place-content-center` `place-items-center` `inline-flex` `gap-8px` `relative` `absolute` `z-0` `top-34px` `w-*` `h-*` `inset-x-0` `mx-auto` `p-0` `size-16px` `radius-5px` `radius-6px` `text-*`（CSS 变量色）`bg-*` `border-t/b/x` `border-2px-solid-transparent` `outline` `shadow` `transition-border/shadow` `mono` `no-underline` `list-none` `hover:` `focus-visible:` `lg:` `transforms-*`（私有）

> 注意：`size-16px` 在 example 中表 **font-size**（迁移后 → `text-16px`，`size` 改宽高同设）；`text-*` 颜色语义（迁移后 → `color-*`，含 rox.ts override 的 CSS 变量拼装）；`radius-*` 出现 6+ 处（→ `rounded-*`）；`flex-half` 出现在 `lg:flex-half`（→ example 私有 override）；`mono`（→ `font-mono`，rox.ts override 接 `var(--mono)`）。

---

## 三、覆盖矩阵

### 3.1 已与 Tailwind 一致（A，无需动作）

> P1/P2 后默认树已有 70 个顶层 matcher 根（contents/static/visible/invisible/whitespace 家族/truncate/underline 族/text-wrap 家族/align/pointer-events/select/appearance/resize/scroll/sr-only/isolate/list 位置/animate/font 根/grow/flex-nowrap 等均已并入 A/B 面）。下表为核心面；完整清单以 `src/config.ts` 为准。

| 类目           | 类名                                                                                                                                                                                    |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| display        | `block` `hidden` `inline` `inline-block` `inline-flex`                                                                                                                                  |
| flex/grid 布局 | `flex` `flex-col` `flex-row` `flex-wrap` `items-center/start/end/stretch` `justify-center/between/around/start/end` `place-content-*` `place-items-*` `grid` `grid-cols-*` `gap-*`      |
| 间距           | `p/m` 及全方向（值写全）、`p-0` `mx-auto`                                                                                                                                               |
| 定位           | `relative` `absolute` `fixed` `sticky` `top/right/bottom/left` `inset-x-*` `inset-y-*`（值写全）`z-*`                                                                                   |
| 尺寸           | `w-*` `h-*` `max-w-*` `min-w-*`（值写全）                                                                                                                                               |
| 文本           | `text-*`（字号值透传，P2 后）`text-center/left/right` `uppercase` `lowercase` `capitalize` `italic` `no-underline`                                                                      |
| 颜色           | `color-*` = **roxcss 扩展根**（Tailwind 无独立 color，颜色随属性走；见 D01）                                                                                                            |
| 列表           | `list-none`                                                                                                                                                                             |
| 盒模型         | `box-border`                                                                                                                                                                            |
| 交互           | `cursor-*`（值写全）                                                                                                                                                                    |
| 变体           | `sm:` `md:` `lg:` `xl:`（min-width 与 Tailwind 断点值一致）；伪类自由前缀 `hover:` `focus:` `focus-visible:` `active:` `disabled:` 等与 Tailwind 同名全覆盖（无白名单，是超集而非子集） |

### 3.2 缺失可补（已全部落地，剩余候选见"七"）

- ✅ **P1 纯新增零冲突**（19 组）：`contents` `static` `visible` `invisible` `overflow-visible` `overflow-clip` `whitespace-*` `truncate` `underline` `overline` `line-through` `text-nowrap/ellipsis/clip/balance/pretty` `align-*`（vertical-align）`pointer-events-*` `select-*` `appearance-none` `resize-*` `scroll-smooth` `scroll-auto` `sr-only` `not-sr-only` `isolate` `list-inside/outside` `animate-*`（值透传）
- ✅ **P2 决策落地批**：D01–D05/D07/D08（color 根新增、text/size 迁移、rounded、flex 重构、font 根、2xl、overflow 同构）
- **P3 值形态与键表**（依赖值解析增强，另行启动）：色板（`color-red-500` 等，落 color 扩展根；bg/border 键表另议）、字号表（落 `text` 根：`text-sm/base/lg`）、间距 scale、`opacity` 数字换算、语义阴影/圆角键表等

### 3.3 不可实现（C，明确不做，防重复讨论）

| 原因              | 示例                                                                          |
| ----------------- | ----------------------------------------------------------------------------- |
| 需要子组合器      | `space-*`（`> :not([hidden]) ~ :not([hidden])`）、`divide-*`、`*` 变体        |
| 需要父/兄弟选择器 | `group-*`、`peer-*`、`has-*`                                                  |
| 需要伪元素        | `before:` `after:`（content 需任意值）、`selection:` `marker:` `placeholder:` |
| 需要任意值        | `[...]` 一切（已决定放弃）                                                    |
| 值含空格/内部 `-` | 多词 font-family、`var(--x)`、`calc()`、负值前缀 `-mt-2`                      |

> 补充说明：Tailwind 需要 `@theme`/`@utility` 才能扩展的能力，roxcss 用 `createConfig` overrides 等价覆盖，不属于 C 类。

---

## 四、决策点清单

> 状态图例：🕐 待讨论 ｜ ✅ 已确认。每轮讨论后更新。

| 编号 | 主题                                                                                          | 状态                                                               |
| ---- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| D01  | `text` 根主语义（color vs 字号多义）                                                          | ✅ 方案 A2：color 拆为独立扩展根，text = 字号 + 对齐（2026-09-02） |
| D02  | `size` 根语义（roxcss=字号 vs Tailwind=宽高同设）                                             | ✅ 迁移为 Tailwind 语义（宽高同设），字号迁至 text（2026-09-02）   |
| D03  | `radius` 更名 `rounded`                                                                       | ✅ 更名 rounded，example 同步（2026-09-02）                        |
| D04  | `flex` 子树对齐（`flex-1` 语义、`flex-half` 去留、`grow` 单根化、`flex-center/space-*` 处置） | ✅ 全面对齐 Tailwind（2026-09-02）                                 |
| D05  | 裸 `bold`/`mono` 与 `font-*` 根                                                               | ✅ 引入 font 根，裸键移除（2026-09-02）                            |
| D06  | "等效异形"确认（`border` 简写多段、`bg/text` 值透传维持现状，不做拆分）                       | ✅ 确认维持（2026-09-02）                                          |
| D07  | 默认断点补 `2xl`(1536px)                                                                      | ✅ 补 2xl: 1536（2026-09-02）                                      |
| D08  | `overflow` 的 `x/y` 键形态（现 `overflow-x`=auto，与 Tailwind `overflow-x-auto` 不同构）      | ✅ 重构为 Tailwind 同构（2026-09-02）                              |
| D09  | P1 新增批次逐项过目                                                                           | ✅ 整体接受（2026-09-02）                                          |
| D10  | P2/P3 边界确认（值解析另案启动）                                                              | ✅ P3 独立规划，P1/P2 不含值 scale（2026-09-02）                   |

### D01 `text` 根主语义 — ✅ 方案 A2：color 拆为独立扩展根，text = 字号 + 对齐（2026-09-02）

- **现状（改前）**：`text` 根 = 颜色（值透传）+ `center/left/right` 对齐子键。example 用 `text-accent-bg` → `color:var(--accent-bg)`。
- **Tailwind**：`text-*` 是多义根——`text-red-500`（color）、`text-sm`（font-size）、`text-center`（align）、`text-nowrap`（white-space）按值猜语义。
- **约束**：值透传模型下函数型根无法按值分派 → 只能选定主语义。
- **定案（A2，推翻早先 A）**：
  - 颜色语义**拆出为独立 `color` 根**（`color-accent` → `color:var(--accent)`），对齐键 `text-center/left/right` 与 P1 的 `text-nowrap/ellipsis/clip/balance/pretty` 保留在 `text` 下；
  - `text` 根主语义变为**字号**（值透传：`text-16px` → `font-size:16px`），P3 字号表（`text-sm/base/lg`）未来可直接落 `text` 根，与 Tailwind 逐字一致——这是 A2 相对 A 的长期收益；
  - **`color` 根是 Tailwind 没有的 roxcss 扩展**（Tailwind 颜色随属性走），语义零歧义，文档须声明；
  - 值语义反转的静默错误窗口（如 `text-white` → 无效 `font-size:white`）：**确认不加值校验**，保持引擎简单轻量，靠文档说明。
- bg/border 等简写中的颜色表达不受影响（见 D06）。

### D02 `size` 根语义 — ✅ 方案 B：迁移为 Tailwind 语义（宽高同设），字号迁至 text（2026-09-02）

- **现状（改前）**：`size-*` = font-size（值透传），example 大量使用。
- **Tailwind v4**：`size-*` = `width` 与 `height` 同设（`size-16px` → 宽高 16px），Tailwind 字号全部走 `text-*`。
- **冲突**：roxcss 与 Tailwind 的 `size` 语义完全相反，是命名冲突最严重的一处。
- **定案（B，配套 D01-A2）**：`size` 迁移为 Tailwind 语义——`size-<值>` → `width:<值>;height:<值>`；原字号语义迁移到 `text`（`size-16px` → `text-16px`）；example 同步。文字颜色走 `color` 根，`text` 不再有颜色歧义，字号落点不再被占用。
- 迁移后三个根与 Tailwind 的关系：`size` ✅ 完全一致、`text` ✅ 字号/对齐面一致、`color` = roxcss 扩展（文档声明）。

### D03 `radius` → `rounded` — ✅ 方案 A：更名 rounded，example 同步迁移（2026-09-02）

- **现状**：roxcss 用 `radius-*`（example 6+ 处），Tailwind 用 `rounded-*`。`radius` 是 roxcss 发明的命名。
- 候选：**A. 更名 `rounded`**（定案）：`rounded-5px` → `border-radius:5px`，example 同步迁移。库未发布，无兼容包袱，改名最干净。B. `rounded` 为主 + 保留 `radius` 别名（过度期）；C. 维持 `radius`。

### D04 `flex` 子树对齐 — ✅ 方案 A：全面对齐 Tailwind（2026-09-02）

- **现状**：`flex` { `""` `col` `row` `wrap` `center` `"1"` `half` `grow` `space`{...} }。
- **Tailwind v4**：`flex`（display）+ `flex-col/row/wrap/nowrap`；`flex-1` = `flex:1`；`flex-auto/none/initial`；`grow`/`shrink`/`basis-*` 是**独立根**；无 `flex-center`（用 `items-center justify-center`）；`space-*` 是兄弟间距（roxcss 不可实现，见 3.3）。
- 逐项对照：
  | roxcss 现键    | 类名                   | Tailwind                                                    | 处置                                                    |
  | -------------- | ---------------------- | ----------------------------------------------------------- | ------------------------------------------------------- |
  | `""`           | `flex`                 | `flex`（display:flex）✅                                    | 保留                                                    |
  | `col/row/wrap` | `flex-col/...`         | 同 ✅                                                       | 保留；补 `flex-nowrap`                                  |
  | `center`       | `flex-center`          | 不存在（发明）                                              | 移除或保留？（example 未用）                            |
  | `"1"`          | `flex-1`               | `flex-1` = `flex:1`                                         | 语义修正为 `flex:1`（与现 `flex:1 1 0` 等效，输出统一） |
  | `half`         | `flex-half`            | 不存在（发明，example `lg:flex-half` 在用）                 | 移出默认 → example override 私有化                      |
  | `grow`         | `flex-grow`            | v4 用 `grow`（独立根）                                      | 改为独立根 `grow`                                       |
  | `space`        | `space-between/around` | 不存在（Tailwind 用 `justify-between/around`，roxcss 已有） | 移除，消除与 Tailwind `space-*` 的命名撞车              |

### D05 裸 `bold` / `mono` 与 `font-*` 根 — ✅ 方案 A：引入 font 根，移除裸键（2026-09-02）

- **现状**：`bold`（font-weight:700）、`mono`（font-family:monospace）裸键；example 用 `mono`。
- **Tailwind**：`font-bold`（weight）、`font-mono`（family）、`font-italic`？→ italic 是裸键 `italic` ✅ 一致；字重在 `font-*` 下。
- 候选：
  - A. 引入 `font` 根（`font-bold`/`font-medium`/... + `font-sans/serif/mono`），裸 `bold` 移除、裸 `mono` 移除（example 同步 `font-mono`）——彻底对齐；
  - B. 引入 `font` 根但保留裸键作别名；
  - C. 维持现状（`bold`/`mono` 是发明键）。
- 注意：roxcss 值透传下 `font-*` 也可直接承接自定义字体族（`font-<family>`），不冲突。

### D06 等效异形（B 类）确认 — ✅ 方案 A：确认维持（2026-09-02）

候选：**确认维持**——`border`（简写多段 `border-2px-solid` ↔ `border-2 border-solid`）、`bg`/`text` 值、`outline`、`shadow`、`transition`、`transform`、`opacity-*%` 等值写全形式，不拆分为 Tailwind 的独立属性/键表体系（拆分收益依赖值解析，P3 再议）。

### D07 默认断点补 `2xl` — ✅ 方案 A：补 2xl: 1536（2026-09-02）

Tailwind 默认断点 `sm 640 md 768 lg 1024 xl 1280 2xl 1536`；roxcss 缺 `2xl`。候选：A. 补 `2xl: 1536`；B. 维持 4 断点（用户自定义扩展，`createModifiers({...defaultBreakpoints, "2xl": 1536})`）。

### D08 `overflow` 的 `x/y` 键形态 — ✅ 方案 A：重构为 Tailwind 同构（2026-09-02）

- **现状**：`overflow-x` → `overflow-x:auto`（把 auto 编进键里），Tailwind 是 `overflow-x-auto`（轴 + 值两段）。
- 候选：A. 重构为 Tailwind 同构（`overflow` { `""`(值) `x` `y` } 接值：`overflow-x-auto`、`overflow-y-hidden`...）；B. 维持现状并文档声明差异。

---

## 五、分批实施计划

| 批次   | 内容                                                                                                                                                  | 前置                  |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| **P0** | 决策点全部确认（D01–D10）                                                                                                                             | ✅ 完成（2026-09-02） |
| **P1** | 纯新增零冲突批（3.2 的 P1 清单，D09 已过目）+ 测试                                                                                                    | ✅ 完成（2026-09-02） |
| **P2** | 决策落地的迁移批：D01–D05/D07/D08（**color 根新增**、text 字号化、size 宽高化、rounded、flex 重构、font 根、2xl、overflow 同构）+ example 同步 + 测试 | ✅ 完成（2026-09-02） |
| **P3** | 值解析增强（值形态与键表，另行设计启动，见 3.2 P3 与 D10）                                                                                            | 独立规划              |
| **P4** | 剩余差距候选（见"七"，逐项确认后分批执行）                                                                                                            | 待讨论                |

每批验收：`vp check` + `vp test` 全绿；example 页面视觉回归；涉及改名批检查 example 全部调用点。

---

## 六、待办记录

- [x] D01–D04 首轮讨论（维持 text color / size 字号 / radius→rounded / flex 全面对齐）
- [x] D05–D08 次轮讨论（font 根 / 等效异形维持 / 补 2xl / overflow 同构）
- [x] D09：P1 新增清单过目（整体接受）
- [x] D10：P3 独立规划
- [x] 补充决策（2026-09-02）：D01/D02 修订为 A2 案（color 独立扩展根、text=字号、size=宽高），确认不加值校验（保持简单轻量）
- [x] P1 完成（2026-09-02）：19 项新增 matcher + 10 组测试，39 测试全绿，提交 2da2454
- [x] P2 完成（2026-09-02）：config 迁移 + example 同步 + P2 测试组，45 测试全绿
- [x] 对齐主体收官（2026-09-02）：递归覆盖合并 / null 删除 / 容器严格语义 / Modifier 双参 / 警告英文 / 63 测试全绿
- [x] P4 完成（2026-09-02）：7.1+7.2 全部落地（gap-x/y、self、justify-self、content、text-justify、leading/tracking、duration/delay、break/wrap、list 类型、box-content、grid-rows、col-span/row-span、ease、aspect、object、isolation-auto），68 测试全绿；合法字符集补 `/`

---

## 七、剩余差距与后续候选（P4，逐项待确认）

> P1/P2 落地后与 Tailwind 的剩余差距分三类：频率中高的零成本键、需子树改造的族、依赖值解析（P3）的语义键表。输出值以 utilities.ts（main 分支）核实为准。**7.1/7.2 已全部实施（2026-09-02），仅剩 7.3。**

### 7.1 建议优先（高频、形态明确）

| 候选                         | Tailwind（输出参考）                                                             | roxcss 做法                                                            | 形态成本 |
| ---------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | -------- |
| `gap-x` / `gap-y`            | `gap-x-4` → `column-gap`；`gap-y-4` → `row-gap`                                  | gap 由函数改子树 `{ "": 值, x, y }`（现有 `gap-8px` 经 `""` 兜底兼容） | 子树改造 |
| `self-*`（align-self）       | `self-start` → `align-self:flex-start`（auto/start/end/center/stretch/baseline） | 新根 `self`，键表映射（start → flex-start 等）                         | 纯新增   |
| `justify-self-*`             | `justify-self-auto/start/...`                                                    | `justify` 子树加 `self` 子树（justify 现有键仍表 justify-content）     | 纯新增   |
| `content-*`（align-content） | `content-between` → `align-content:space-between`                                | 新根 `content`（键值映射同 justify）                                   | 纯新增   |
| `text-justify`               | `text-justify` → `text-align:justify`                                            | text 子树加键                                                          | 纯新增   |
| `leading` / `tracking`       | `leading-*` line-height、`tracking-*` letter-spacing（roxcss 值写全）            | 新根值透传：`leading-1.5` → `line-height:1.5`                          | 值透传   |
| `duration` / `delay`         | `duration-300`（ms scale）；roxcss 值写全                                        | 新根值透传：`duration-300ms` → `transition-duration:300ms`             | 值透传   |

### 7.2 中低频 / 低成本补全

| 候选                    | Tailwind                                                                             | roxcss 做法                                                 |
| ----------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| `break-*` / `wrap-*`    | `break-all` → `word-break:break-all`；`wrap-break-word` → `overflow-wrap:break-word` | 新根 `break`（根级，与 whitespace 子树内键不冲突）、`wrap`  |
| list 类型               | `list-disc`/`list-decimal` → `list-style-type:*`                                     | list 子树加键                                               |
| `box-content`           | `box-content` → `box-sizing:content-box`                                             | box 子树加键                                                |
| `grid-rows`             | `grid-rows-2` → `repeat(2,minmax(0,1fr))`                                            | grid 子树加键                                               |
| `col-span` / `row-span` | `col-span-2` → `grid-column:span 2 / span 2`                                         | 新根 `col`/`row`（flex 的 col/row 在 flex 子树，不受影响）  |
| `ease`                  | `ease-in-out` 等                                                                     | 子树 `ease` { `""`, `in` { `""`, `out` } }（in-out 拆两段） |
| `aspect`                | `aspect-video` 等语义键                                                              | 值透传 `aspect-16/9`（值含 `/`，需确认合法字符集）或键表    |
| `object-*`              | `object-contain/cover/...` → `object-fit`                                            | 新根 `object` 键表                                          |
| `isolation-auto`        | `isolation:auto`                                                                     | 与 `isolate` 成对补键                                       |

### 7.3 明确不做 / 待 P3

- **值解析族**（P3 统一启动）：色板 `color-red-500`、字号表 `text-sm`、间距 scale `p-4`、`opacity-50` 数字换算、语义阴影/圆角键表
- **低频/需重构**：`ring`（box-shadow 组合）、`columns`、`line-clamp`（多声明 + -webkit-box）、`scroll-m/p`、`snap-*`、`overscroll`、`mask`、`accent/caret`、`hyphens`、`tab`、`outline-offset`（与 outline 简写根冲突，需重构）、`box-decoration-*`、独立 transform 属性拆分（rotate/scale/translate）
- **C 类不可实现**：见 3.3
