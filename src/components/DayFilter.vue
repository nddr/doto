<script setup lang="ts">
import { computed } from 'vue'
import { themeColor } from '@/composables/useTheme'
import { useWeekLength } from '@/composables/useWeekLength'

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

const { weekLength } = useWeekLength()
const isSingleDay = computed(() => weekLength.value === '1')

function handleDragOver(event: DragEvent) {
  event.preventDefault()
}
</script>

<template>
  <div
    class="flex items-center"
    :class="isSingleDay ? 'text-2xl mb-2 -mt-4' : 'gap-2 mb-4'"
  >
    <button
      class="text-center cursor-pointer transition-colors text-overlay0 hover:text-lavender"
      :class="isSingleDay ? 'order-2 ml-3' : 'py-2 px-2 border border-surface1 bg-surface0'"
      @click="emit('previous-week')"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 4 7 12 15 20" /></svg>
    </button>
    <button
      v-for="day in weekDates"
      :key="day.date"
      class="cursor-pointer transition-colors"
      :class="isSingleDay ? 'order-1 text-left' : 'flex-1 text-center py-2 px-1 border'"
      :style="{
        backgroundColor: isSingleDay ? 'transparent' : (modelValue === day.date ? themeColor('surface1') : themeColor('surface0')),
        borderColor: isSingleDay ? 'transparent' : (dragOverDay === day.date ? themeColor('lavender') : (modelValue === day.date ? themeColor('lavender') : themeColor('surface1'))),
        color: modelValue === day.date ? themeColor('lavender') : (day.date === todayDate ? themeColor('text') : themeColor('overlay0')),
      }"
      @click="emit('update:modelValue', day.date)"
      @dragover="handleDragOver"
      @dragenter="emit('day-drag-enter', day.date)"
      @dragleave="emit('day-drag-leave')"
      @drop="emit('day-drop', day.date)"
    >
      <template v-if="isSingleDay">
        <span class="opacity-50">{{ day.dayOfMonth }}</span> {{ day.full }}
      </template>
      <template v-else>
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
      </template>
    </button>
    <button
      class="text-center cursor-pointer transition-colors text-overlay0 hover:text-lavender"
      :class="isSingleDay ? 'order-3 ml-2' : 'py-2 px-2 border border-surface1 bg-surface0'"
      @click="emit('next-week')"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 4 17 12 9 20" /></svg>
    </button>
  </div>
</template>
