<script setup lang="ts">
import { useTheme } from '@/composables/useTheme'

defineProps<{
  modelValue: 'all' | 'work' | 'personal'
}>()

const emit = defineEmits<{
  'update:modelValue': [value: 'all' | 'work' | 'personal']
}>()

const { theme } = useTheme()
</script>

<template>
  <div class="flex gap-4 text-sm">
    <label class="flex items-center gap-2 cursor-pointer">
      <span
        class="w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors"
        :style="{
          borderColor: modelValue === 'all' ? theme.lavender : theme.overlay0,
          backgroundColor: modelValue === 'all' ? theme.lavender : 'transparent',
        }"
      >
        <span
          v-if="modelValue === 'all'"
          class="w-1.5 h-1.5 rounded-full"
          :style="{ backgroundColor: theme.base }"
        ></span>
      </span>
      <span :style="{ color: modelValue === 'all' ? theme.lavender : theme.overlay0 }">All</span>
      <input
        type="radio"
        name="tagFilter"
        value="all"
        :checked="modelValue === 'all'"
        class="sr-only"
        @change="emit('update:modelValue', 'all')"
      />
    </label>
    <label class="flex items-center gap-2 cursor-pointer">
      <span
        class="w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors"
        :style="{
          borderColor: modelValue === 'work' ? theme.green : theme.overlay0,
          backgroundColor: modelValue === 'work' ? theme.green : 'transparent',
        }"
      >
        <span
          v-if="modelValue === 'work'"
          class="w-1.5 h-1.5 rounded-full"
          :style="{ backgroundColor: theme.base }"
        ></span>
      </span>
      <span :style="{ color: modelValue === 'work' ? theme.green : theme.overlay0 }">Work</span>
      <input
        type="radio"
        name="tagFilter"
        value="work"
        :checked="modelValue === 'work'"
        class="sr-only"
        @change="emit('update:modelValue', 'work')"
      />
    </label>
    <label class="flex items-center gap-2 cursor-pointer">
      <span
        class="w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors"
        :style="{
          borderColor: modelValue === 'personal' ? theme.peach : theme.overlay0,
          backgroundColor: modelValue === 'personal' ? theme.peach : 'transparent',
        }"
      >
        <span
          v-if="modelValue === 'personal'"
          class="w-1.5 h-1.5 rounded-full"
          :style="{ backgroundColor: theme.base }"
        ></span>
      </span>
      <span :style="{ color: modelValue === 'personal' ? theme.peach : theme.overlay0 }"
        >Personal</span
      >
      <input
        type="radio"
        name="tagFilter"
        value="personal"
        :checked="modelValue === 'personal'"
        class="sr-only"
        @change="emit('update:modelValue', 'personal')"
      />
    </label>
  </div>
</template>
