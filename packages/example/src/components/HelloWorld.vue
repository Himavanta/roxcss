<script setup lang="ts">
import { ref } from "vue";
import { rox } from "../rox";
import heroImg from "../assets/hero.png";
import viteLogo from "../assets/vite.svg";
import vueLogo from "../assets/vue.svg";

const count = ref(0);

// 类名由 roxcss 在运行时解析并注入样式，类名本身原样返回
const cls = {
  hero: rox`relative`,
  base: rox`relative z-0 w-170px inset-x-0 mx-auto`,
  framework: rox`absolute z-1 top-34px h-28px inset-x-0 mx-auto transforms-framework`,
  vite: rox`absolute z-0 top-107px h-26px w-auto inset-x-0 mx-auto transforms-vite`,
  center: rox`flex-col gap-25px place-content-center place-items-center grow lg:gap-18px lg:pt-32px lg:px-20px lg:pb-24px`,
  counter: rox`inline-flex mono size-16px pt-5px pb-5px pl-10px pr-10px radius-5px text-accent bg-accent-bg border-2px-solid-transparent transition-border mb-24px hover:border-color-accent-border focus-visible:outline`,
  nextSteps: rox`flex border-t text-left lg:flex-col lg:text-center`,
  docs: rox`flex-1 p-32px border-r lg:py-24px lg:px-20px lg:border-r-none lg:border-b`,
  social: rox`flex-1 p-32px lg:py-24px lg:px-20px`,
  icon: rox`w-22px h-22px mb-16px`,
  list: rox`list-none p-0 flex gap-8px mt-32px lg:mt-20px lg:flex-wrap lg:justify-center`,
  link: rox`flex items-center gap-8px px-12px py-6px radius-6px size-16px text-text-h bg-social-bg no-underline transition-shadow hover:shadow lg:w-100% lg:justify-center lg:box-border`,
  logo: rox`h-18px`,
  buttonIcon: rox`w-18px h-18px`,
  li: rox`lg:flex-half`,
  spacer: rox`h-88px border-t lg:h-48px`,
};
</script>

<template>
  <section id="center" :class="cls.center">
    <div :class="cls.hero">
      <img :src="heroImg" :class="cls.base" width="170" height="179" alt="" />
      <img :src="vueLogo" :class="cls.framework" alt="Vue logo" />
      <img :src="viteLogo" :class="cls.vite" alt="Vite logo" />
    </div>
    <div>
      <h1>Get started</h1>
      <p>Edit <code>src/App.vue</code> and save to test <code>HMR</code></p>
    </div>
    <button type="button" :class="cls.counter" @click="count++">Count is {{ count }}</button>
  </section>

  <div class="ticks"></div>

  <section id="next-steps" :class="cls.nextSteps">
    <div id="docs" :class="cls.docs">
      <svg :class="cls.icon" role="presentation" aria-hidden="true">
        <use href="/icons.svg#documentation-icon"></use>
      </svg>
      <h2>Documentation</h2>
      <p>Your questions, answered</p>
      <ul :class="cls.list">
        <li :class="cls.li">
          <a href="https://vite.dev/" target="_blank" :class="cls.link">
            <img :class="cls.logo" :src="viteLogo" alt="" />
            Explore Vite
          </a>
        </li>
        <li :class="cls.li">
          <a href="https://vuejs.org/" target="_blank" :class="cls.link">
            <img :class="cls.buttonIcon" :src="vueLogo" alt="" />
            Learn more
          </a>
        </li>
      </ul>
    </div>
    <div id="social" :class="cls.social">
      <svg :class="cls.icon" role="presentation" aria-hidden="true">
        <use href="/icons.svg#social-icon"></use>
      </svg>
      <h2>Connect with us</h2>
      <p>Join the Vite community</p>
      <ul :class="cls.list">
        <li :class="cls.li">
          <a href="https://github.com/vitejs/vite" target="_blank" :class="cls.link">
            <svg :class="cls.buttonIcon" role="presentation" aria-hidden="true">
              <use href="/icons.svg#github-icon"></use>
            </svg>
            GitHub
          </a>
        </li>
        <li :class="cls.li">
          <a href="https://chat.vite.dev/" target="_blank" :class="cls.link">
            <svg :class="cls.buttonIcon" role="presentation" aria-hidden="true">
              <use href="/icons.svg#discord-icon"></use>
            </svg>
            Discord
          </a>
        </li>
        <li :class="cls.li">
          <a href="https://x.com/vite_js" target="_blank" :class="cls.link">
            <svg :class="cls.buttonIcon" role="presentation" aria-hidden="true">
              <use href="/icons.svg#x-icon"></use>
            </svg>
            X.com
          </a>
        </li>
        <li :class="cls.li">
          <a href="https://bsky.app/profile/vite.dev" target="_blank" :class="cls.link">
            <svg :class="cls.buttonIcon" role="presentation" aria-hidden="true">
              <use href="/icons.svg#bluesky-icon"></use>
            </svg>
            Bluesky
          </a>
        </li>
      </ul>
    </div>
  </section>

  <div class="ticks"></div>
  <section id="spacer" :class="cls.spacer"></section>
</template>
