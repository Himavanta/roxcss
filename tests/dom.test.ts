import { afterEach, beforeEach, expect, test, vi } from "vite-plus/test";
import { MAX_BUCKET_RULES } from "../src/dom.ts";

/**
 * dom.ts 的滚动桶测试。
 * 通过 mock globalThis.document 驱动真实模块逻辑；
 * 模块级桶状态用 vi.resetModules + 动态 import 逐用例隔离。
 */

interface FakeStyle {
  tag: string;
  attrs: Record<string, string>;
  textContent: string;
  setAttribute(name: string, value: string): void;
}

/** 每用例重建：fake document + 收集被 append 的 style 元素 */
let styles: FakeStyle[] = [];

const loadFlush = async () => {
  vi.resetModules();
  const mod = await import("../src/dom.ts");
  return mod.flushStyles;
};

const rules = (n: number) => Array.from({ length: n }, (_, i) => `r${i}`);

const ruleCount = (el: FakeStyle) =>
  el.textContent === "" ? 0 : el.textContent.split("\n").length;

beforeEach(() => {
  styles = [];
  const doc = {
    createElement: (tag: string): FakeStyle => {
      const el: FakeStyle = {
        tag,
        attrs: {},
        textContent: "",
        setAttribute(name: string, value: string) {
          this.attrs[name] = value;
        },
      };
      return el;
    },
    head: {
      appendChild: (node: FakeStyle) => {
        styles.push(node);
      },
    },
  };
  (globalThis as { document?: unknown }).document = doc;
});

afterEach(() => {
  (globalThis as { document?: unknown }).document = undefined;
});

test("首 flush 创建一个带标记的 style 桶并写入全部规则", async () => {
  const flush = await loadFlush();
  flush(["a { color:red }", "b { color:blue }"]);

  expect(styles.length).toBe(1);
  expect(styles[0].tag).toBe("style");
  expect(styles[0].attrs["data-roxcss"]).toBe("");
  expect(styles[0].textContent).toBe("a { color:red }\nb { color:blue }");
});

test("桶未满时追加规则到同一元素，整体重写", async () => {
  const flush = await loadFlush();
  flush(rules(600));
  flush(rules(300));

  expect(styles.length).toBe(1);
  expect(ruleCount(styles[0])).toBe(900);
});

test("桶满后冻结，下一次 flush 新建桶", async () => {
  const flush = await loadFlush();
  flush(rules(MAX_BUCKET_RULES));
  const frozen = styles[0].textContent;
  flush(["x"]);

  expect(styles.length).toBe(2);
  expect(styles[0].textContent).toBe(frozen); // 旧桶不再重写
  expect(ruleCount(styles[1])).toBe(1);
});

test("追加导致超限时自动跨桶拆分", async () => {
  const flush = await loadFlush();
  flush(rules(600));
  flush(rules(600));

  expect(styles.length).toBe(2);
  expect(ruleCount(styles[0])).toBe(MAX_BUCKET_RULES);
  expect(ruleCount(styles[1])).toBe(200);
});

test("单批规则超过上限时拆入多个桶", async () => {
  const flush = await loadFlush();
  flush(rules(MAX_BUCKET_RULES * 2 + 1));

  expect(styles.length).toBe(3);
  expect(ruleCount(styles[0])).toBe(MAX_BUCKET_RULES);
  expect(ruleCount(styles[1])).toBe(MAX_BUCKET_RULES);
  expect(ruleCount(styles[2])).toBe(1);
});

test("规则按注入顺序在各桶间连续", async () => {
  const flush = await loadFlush();
  flush(rules(MAX_BUCKET_RULES));
  flush(Array.from({ length: 5 }, (_, i) => `r${MAX_BUCKET_RULES + i}`));

  const full = styles.map((s) => s.textContent).join("\n");
  expect(full.split("\n")).toEqual(rules(MAX_BUCKET_RULES + 5));
});

test("空批次不创建桶", async () => {
  const flush = await loadFlush();
  flush([]);
  expect(styles.length).toBe(0);
});

test("无 document 时跳过且不抛错", async () => {
  (globalThis as { document?: unknown }).document = undefined;
  const flush = await loadFlush();
  expect(() => flush(["a"])).not.toThrow();
  expect(styles.length).toBe(0);
});

test("document 无 head 时跳过", async () => {
  (globalThis as { document?: unknown }).document = {
    createElement: (tag: string) => ({ tag, attrs: {}, textContent: "" }),
    head: null,
  };
  const flush = await loadFlush();
  flush(["a"]);
  expect(styles.length).toBe(0);
});
