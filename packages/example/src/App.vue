<script setup lang="ts">
import { defineAsyncComponent, type Component } from "vue";
import HelloWorld from "./components/HelloWorld.vue";

// 生产构建（import.meta.env.DEV 替换为 false）时动态 import 处于死分支，被 tree-shake 掉
const PerfPanel = defineAsyncComponent<Component>(() => {
  if (!import.meta.env.DEV) {
    return Promise.resolve({
      default: { name: "PerfPanel", render: () => null } satisfies Component,
    });
  }
  return import("./components/PerfPanel.vue");
});
</script>

<template>
  <HelloWorld />
  <PerfPanel />
</template>
