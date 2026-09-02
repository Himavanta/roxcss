<script setup lang="ts">
import { onMounted, ref } from "vue";
import { rox } from "../rox";

// 仅开发环境显示，构建时被替换为 false 常量，生产不渲染
const isDev = import.meta.env.DEV;

const running = ref(false);
const ruleCount = ref(0);
const coldMs = ref(0);
const hitMs = ref(0);
const recalcMs = ref(0);
const report = ref("");

// 每次测量生成一段新的 token 区间，保证冷插入始终是"未出现过"的规则
let offset = 0;

// 长任务（>50ms 的阻塞）采集
const longTasks: PerformanceEntryList = [];
let observer: PerformanceObserver | null = null;

onMounted(() => {
  observer = new PerformanceObserver((list) => {
    longTasks.push(...list.getEntries());
  });
  // longtask 不进入 performance buffer，只能通过 observer 实时获取
  observer.observe({ entryTypes: ["longtask"] });
});

function countRules() {
  return rox.getCSS().split("\n").filter(Boolean).length;
}

function measure() {
  running.value = true;

  // 1. 规则数：当前 rox 实例已注入的规则条数
  ruleCount.value = countRules();

  // 2. 冷插入：一次性注入 200 条新 token，测写入总耗时
  const tokens = Array.from({ length: 200 }, (_, i) => `p-${offset + i}px-${offset + i + 1}px`);
  offset += 200;

  let t0 = performance.now();
  for (const token of tokens) {
    void rox`${token}`;
  }
  coldMs.value = performance.now() - t0;

  // 3. 缓存命中：重复调用同一 token 1000 次（只拆串查表，不触碰 CSSOM）
  t0 = performance.now();
  for (const _ of Array.from({ length: 1000 })) {
    void rox`p-1px-2px`;
  }
  hitMs.value = performance.now() - t0;

  // 4. 强制样式重算：插入 200 条规则后同步触发一次 recalc
  t0 = performance.now();
  void document.body.offsetHeight;
  recalcMs.value = performance.now() - t0;

  running.value = false;
}

function collectHeader(lines: string[]) {
  lines.push("roxcss 性能报告");
  lines.push("===============");
  lines.push(`生成时间: ${new Date().toISOString()}`);
  lines.push(`浏览器: ${navigator.userAgent}`);
  lines.push(`视口: ${innerWidth}x${innerHeight}`);
  lines.push(`页面元素数: ${document.querySelectorAll("*").length}`);
}

/** 重算基线：当前规则数下的单次强制重算耗时 */
function collectBaseline(lines: string[]) {
  lines.push("");
  lines.push("[样式重算基线]");
  const baseRules = countRules();
  const t0 = performance.now();
  void document.body.offsetHeight;
  lines.push(`规则数 ${baseRules}: ${(performance.now() - t0).toFixed(3)} ms`);
}

/** 5 轮冷插入（每轮 200 条）+ 每轮重算采样 + 缓存命中 */
function collectInsertTrend(lines: string[]) {
  lines.push("");
  lines.push("[规则注入趋势]");
  lines.push("轮次 | 新增 | 插入耗时(ms) | 累计规则");

  let base = offset;
  const recalcSamples: string[] = [];
  for (const round of Array.from({ length: 5 }, (_, i) => i + 1)) {
    const tokens = Array.from({ length: 200 }, (_, i) => `p-${base + i}px-${base + i + 1}px`);
    base += 200;

    let t0 = performance.now();
    for (const token of tokens) {
      void rox`${token}`;
    }
    const ms = performance.now() - t0;
    const total = countRules();
    lines.push(`${round} | 200 | ${ms.toFixed(3)} | ${total}`);

    // 每轮后测一次强制重算，观察重算成本随规则数的增长
    t0 = performance.now();
    void document.body.offsetHeight;
    recalcSamples.push(`${total} 条: ${(performance.now() - t0).toFixed(3)} ms`);
  }
  offset = base;

  lines.push("");
  lines.push("[样式重算随规则数增长]");
  lines.push(...recalcSamples);

  // 缓存命中
  let t0 = performance.now();
  for (const _ of Array.from({ length: 1000 })) {
    void rox`p-1px-2px`;
  }
  lines.push("");
  lines.push(`[缓存命中 ×1000] ${(performance.now() - t0).toFixed(3)} ms`);
}

function collectLongTasks(lines: string[]) {
  lines.push("");
  lines.push("[长任务（>50ms）]");
  lines.push(`共 ${longTasks.length} 条`);
  for (const task of longTasks.slice(-5)) {
    lines.push(`  ${task.duration.toFixed(1)} ms @ 页面加载后 ${Math.round(task.startTime)} ms`);
  }
}

/** 首屏指标（面板挂载前已发生的 paint 事件） */
function collectPaints(lines: string[]) {
  const paints = performance.getEntriesByType("paint");
  for (const p of paints) {
    lines.push(`[paint] ${p.name}: 页面加载后 ${Math.round(p.startTime)} ms`);
  }
}

function generateReport() {
  running.value = true;

  const lines: string[] = [];
  collectHeader(lines);
  collectBaseline(lines);
  collectInsertTrend(lines);
  collectLongTasks(lines);
  collectPaints(lines);

  report.value = lines.join("\n");
  running.value = false;
}

async function copyReport() {
  await navigator.clipboard.writeText(report.value);
}
</script>

<template>
  <div v-if="isDev" class="perf-panel">
    <button type="button" :disabled="running" @click="measure">
      {{ running ? "测量中…" : "测量" }}
    </button>
    <button type="button" :disabled="running" @click="generateReport">
      {{ running ? "生成中…" : "生成报告" }}
    </button>
    <template v-if="report">
      <textarea
        :value="report"
        readonly
        rows="10"
        @click="($event.target as HTMLTextAreaElement).select()"
      ></textarea>
      <button type="button" class="copy" :disabled="running" @click="copyReport">复制报告</button>
    </template>
    <dl>
      <div>
        <dt>规则数</dt>
        <dd>{{ ruleCount }}</dd>
      </div>
      <div>
        <dt>冷插入 200 条</dt>
        <dd>{{ coldMs.toFixed(2) }} ms</dd>
      </div>
      <div>
        <dt>缓存命中 ×1000</dt>
        <dd>{{ hitMs.toFixed(3) }} ms</dd>
      </div>
      <div>
        <dt>强制重算</dt>
        <dd>{{ recalcMs.toFixed(2) }} ms</dd>
      </div>
    </dl>
    <p class="hint">点「生成报告」后复制全文，交给 roxcss 作者分析</p>
  </div>
</template>

<style scoped>
/* 面板使用静态样式而非 rox，避免污染测量统计 */
.perf-panel {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 1000;
  width: 320px;
  padding: 12px;
  border-radius: 8px;
  background: rgba(24, 24, 28, 0.92);
  color: #e5e4e7;
  font:
    12px/1.5 ui-monospace,
    Consolas,
    monospace;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.4);
}

.perf-panel button {
  width: 100%;
  margin-bottom: 8px;
  padding: 4px 0;
  border: 1px solid rgba(192, 132, 252, 0.5);
  border-radius: 4px;
  background: rgba(192, 132, 252, 0.15);
  color: #c084fc;
  font: inherit;
  cursor: pointer;
}

.perf-panel button:disabled {
  opacity: 0.6;
  cursor: default;
}

.perf-panel textarea {
  width: 100%;
  box-sizing: border-box;
  margin-bottom: 8px;
  padding: 8px;
  border: 1px solid #2e303a;
  border-radius: 4px;
  background: #16171d;
  color: #e5e4e7;
  font: inherit;
  resize: vertical;
}

.perf-panel dl {
  margin: 0;
}

.perf-panel dl > div {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  padding: 2px 0;
}

.perf-panel dt {
  color: #9ca3af;
}

.perf-panel dd {
  margin: 0;
  color: #f3f4f6;
}

.perf-panel .hint {
  margin: 8px 0 0;
  color: #6b7280;
}
</style>
