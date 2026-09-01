import { createApp } from "vue";
import { rox } from "./rox";
import "./style.css";
import App from "./App.vue";

// #app 的布局样式由 roxcss 运行时生成并注入
const appRoot = document.querySelector<HTMLDivElement>("#app")!;
appRoot.className = rox`
  w-1126px
  max-w-100%
  m-auto
  text-center
  border-x
  min-h-100svh
  flex-col
  box-border
`;

createApp(App).mount("#app");
