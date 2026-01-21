<script setup lang="ts">
import { useTheme, type ThemeName } from '@/composables/useTheme'

const { theme, themeName, themeNames, themes, setTheme } = useTheme()
</script>

<template>
  <!-- Theme Switcher -->
  <button popovertarget="theme-menu" class="fixed top-4 right-6 z-10 px-3 py-1 border cursor-pointer transition-colors"
    style="anchor-name: --theme-btn" :style="{
      borderColor: theme.surface1,
      backgroundColor: theme.surface0,
      color: theme.text,
    }">
    [ {{ theme.name }} ]
  </button>

  <div id="theme-menu" popover class="m-0 p-0 border"
    style="position-anchor: --theme-btn; inset: unset; top: anchor(bottom); right: anchor(right)" :style="{
      borderColor: theme.surface1,
      backgroundColor: theme.surface0,
    }">
    <button v-for="name in themeNames" :key="name" popovertarget="theme-menu"
      class="block w-full px-3 py-1 text-left cursor-pointer transition-colors" :style="{
        color: themeName === name ? theme.lavender : theme.text,
        backgroundColor: themeName === name ? theme.surface1 : 'transparent',
      }" @click="setTheme(name as ThemeName)"
      @mouseenter="($event.target as HTMLElement).style.backgroundColor = theme.surface1"
      @mouseleave="($event.target as HTMLElement).style.backgroundColor = themeName === name ? theme.surface1 : 'transparent'">
      {{ themeName === name ? '> ' : ' ' }}{{ themes[name].name }}
    </button>
  </div>
</template>
