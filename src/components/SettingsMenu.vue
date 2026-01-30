<script setup lang="ts">
import { useTheme, type ThemeName } from '@/composables/useTheme'
import { useWeekLength, type WeekLength } from '@/composables/useWeekLength'

const { theme, themeName, themeNames, themes, setTheme } = useTheme()
const { weekLength, setWeekLength } = useWeekLength()
</script>

<template>
  <!-- Settings Button -->
  <button
    popovertarget="settings-menu"
    class="fixed top-4 right-6 z-10 px-3 py-1 border cursor-pointer transition-colors"
    style="anchor-name: --settings-btn"
    :style="{
      borderColor: theme.surface1,
      backgroundColor: theme.surface0,
      color: theme.text,
    }"
  >
    [ Settings ]
  </button>

  <!-- Main Settings Menu -->
  <div
    id="settings-menu"
    popover
    class="m-0 p-0 border"
    style="position-anchor: --settings-btn; anchor-name: --settings-menu; inset: unset; top: anchor(bottom); right: anchor(right)"
    :style="{
      borderColor: theme.surface1,
      backgroundColor: theme.surface0,
    }"
  >
    <!-- Theme Sub-menu Trigger -->
    <button
      popovertarget="theme-submenu"
      class="block w-full px-3 py-1 text-left cursor-pointer transition-colors"
      :style="{
        color: theme.text,
      }"
      @mouseenter="($event.target as HTMLElement).style.backgroundColor = theme.surface1"
      @mouseleave="($event.target as HTMLElement).style.backgroundColor = 'transparent'"
      style="anchor-name: --theme-trigger"
    >
      Theme >
    </button>

    <!-- Week Length Sub-menu Trigger -->
    <button
      popovertarget="week-submenu"
      class="block w-full px-3 py-1 text-left cursor-pointer transition-colors"
      :style="{
        color: theme.text,
      }"
      @mouseenter="($event.target as HTMLElement).style.backgroundColor = theme.surface1"
      @mouseleave="($event.target as HTMLElement).style.backgroundColor = 'transparent'"
      style="anchor-name: --week-trigger"
    >
      Week >
    </button>
  </div>

  <!-- Theme Sub-menu -->
  <div
    id="theme-submenu"
    popover
    class="m-0 p-0 border"
    style="position-anchor: --settings-menu; inset: unset; top: anchor(top); right: anchor(left)"
    :style="{
      borderColor: theme.surface1,
      backgroundColor: theme.surface0,
    }"
  >
    <button
      v-for="name in themeNames"
      :key="name"
      popovertarget="settings-menu"
      class="block w-full px-3 py-1 text-left cursor-pointer transition-colors"
      :style="{
        color: themeName === name ? theme.lavender : theme.text,
        backgroundColor: themeName === name ? theme.surface1 : 'transparent',
      }"
      @click="setTheme(name as ThemeName)"
      @mouseenter="($event.target as HTMLElement).style.backgroundColor = theme.surface1"
      @mouseleave="($event.target as HTMLElement).style.backgroundColor = themeName === name ? theme.surface1 : 'transparent'"
    >
      {{ themeName === name ? '> ' : ' ' }}{{ themes[name].name }}
    </button>
  </div>

  <!-- Week Length Sub-menu -->
  <div
    id="week-submenu"
    popover
    class="m-0 p-0 border"
    style="position-anchor: --settings-menu; inset: unset; top: anchor(bottom); right: anchor(left)"
    :style="{
      borderColor: theme.surface1,
      backgroundColor: theme.surface0,
    }"
  >
    <button
      popovertarget="settings-menu"
      class="block w-full px-3 py-1 text-left cursor-pointer transition-colors whitespace-nowrap"
      :style="{
        color: weekLength === '5' ? theme.lavender : theme.text,
        backgroundColor: weekLength === '5' ? theme.surface1 : 'transparent',
      }"
      @click="setWeekLength('5')"
      @mouseenter="($event.target as HTMLElement).style.backgroundColor = theme.surface1"
      @mouseleave="($event.target as HTMLElement).style.backgroundColor = weekLength === '5' ? theme.surface1 : 'transparent'"
    >
      {{ weekLength === '5' ? '> ' : ' ' }}5 days
    </button>
    <button
      popovertarget="settings-menu"
      class="block w-full px-3 py-1 text-left cursor-pointer transition-colors whitespace-nowrap"
      :style="{
        color: weekLength === '7' ? theme.lavender : theme.text,
        backgroundColor: weekLength === '7' ? theme.surface1 : 'transparent',
      }"
      @click="setWeekLength('7')"
      @mouseenter="($event.target as HTMLElement).style.backgroundColor = theme.surface1"
      @mouseleave="($event.target as HTMLElement).style.backgroundColor = weekLength === '7' ? theme.surface1 : 'transparent'"
    >
      {{ weekLength === '7' ? '> ' : ' ' }}7 days
    </button>
  </div>
</template>
