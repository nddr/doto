<script setup lang="ts">
import { useTheme } from '@/composables/useTheme'

export interface WeekDay {
  full: string
  short: string
  letter: string
  date: string
  dayOfMonth: number
}

defineProps<{
  modelValue: string | null
  weekDates: WeekDay[]
  todayDate: string
  dragOverDay: string | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'previous-week': []
  'next-week': []
  'day-drag-enter': [date: string]
  'day-drag-leave': []
  'day-drop': [date: string]
}>()

const { theme } = useTheme()

function handleDragOver(event: DragEvent) {
  event.preventDefault()
}
</script>

<template>
  <div class="flex gap-2 mb-4">
    <button
      class="py-2 px-2 border text-center cursor-pointer transition-colors"
      :style="{
        backgroundColor: theme.surface0,
        borderColor: theme.surface1,
        color: theme.overlay0,
      }"
      @mouseenter="($event.target as HTMLElement).style.color = theme.lavender"
      @mouseleave="($event.target as HTMLElement).style.color = theme.overlay0"
      @click="emit('previous-week')"
    >
      &lt;
    </button>
    <button
      v-for="day in weekDates"
      :key="day.date"
      class="flex-1 py-2 px-1 border text-center cursor-pointer transition-colors"
      :style="{
        backgroundColor: modelValue === day.date ? theme.surface1 : theme.surface0,
        borderColor: dragOverDay === day.date ? theme.lavender : (modelValue === day.date ? theme.lavender : theme.surface1),
        color: modelValue === day.date ? theme.lavender : (day.date === todayDate ? theme.text : theme.overlay0),
      }"
      @click="emit('update:modelValue', day.date)"
      @dragover="handleDragOver"
      @dragenter="emit('day-drag-enter', day.date)"
      @dragleave="emit('day-drag-leave')"
      @drop="emit('day-drop', day.date)"
    >
      <span class="md:hidden flex flex-col items-center">
        <span>{{ day.letter }}</span>
        <span class="opacity-50 text-sm">{{ day.dayOfMonth }}</span>
      </span>
      <span class="hidden md:inline xl:hidden">
        <span class="opacity-50">{{ day.dayOfMonth }}</span>
        {{ day.short }}
      </span>
      <span class="hidden xl:inline">
        <span class="opacity-50">{{ day.dayOfMonth }}</span> {{ day.full }}
      </span>
    </button>
    <button
      class="py-2 px-2 border text-center cursor-pointer transition-colors"
      :style="{
        backgroundColor: theme.surface0,
        borderColor: theme.surface1,
        color: theme.overlay0,
      }"
      @mouseenter="($event.target as HTMLElement).style.color = theme.lavender"
      @mouseleave="($event.target as HTMLElement).style.color = theme.overlay0"
      @click="emit('next-week')"
    >
      &gt;
    </button>
  </div>
</template>
