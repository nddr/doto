<script setup lang="ts">
import { ref, watch } from 'vue'
import { useDialog, type DialogAction } from '@/composables/useDialog'
import { useTheme } from '@/composables/useTheme'

const { isOpen, currentOptions, close } = useDialog()
const { theme } = useTheme()

const dialogRef = ref<HTMLDialogElement | null>(null)

watch(isOpen, (open) => {
  if (open) {
    dialogRef.value?.showModal()
  } else {
    dialogRef.value?.close()
  }
})

function handleAction(action: DialogAction) {
  action.handler()
}

function getActionColor(style: DialogAction['style']) {
  switch (style) {
    case 'primary':
      return '#ffffff'
    case 'danger':
      return theme.value.red
    default:
      return theme.value.text
  }
}

function getActionBgColor(style: DialogAction['style']) {
  switch (style) {
    case 'primary':
      return theme.value.blue
    default:
      return theme.value.surface1
  }
}

function handleCancel() {
  close()
}
</script>

<template>
  <dialog
    ref="dialogRef"
    class="p-0 m-auto border backdrop:bg-black/50 focus:outline-none"
    :style="{
      backgroundColor: theme.surface0,
      borderColor: theme.surface2,
      color: theme.text,
    }"
    @cancel="handleCancel"
  >
    <div v-if="currentOptions" class="min-w-96 max-w-lg">
      <!-- Title -->
      <div
        class="px-6 py-4 border-b"
        :style="{ borderColor: theme.surface2 }"
      >
        <h2 class="text-lg font-semibold">{{ currentOptions.title }}</h2>
      </div>

      <!-- Message -->
      <div class="px-6 py-4">
        <p class="text-sm" :style="{ color: theme.subtext0 }">
          {{ currentOptions.message }}
        </p>
      </div>

      <!-- Actions -->
      <div
        class="flex gap-3 px-6 py-4 border-t"
        :style="{ borderColor: theme.surface2 }"
      >
        <button
          v-for="(action, index) in currentOptions.actions"
          :key="index"
          class="flex-1 px-4 py-2 text-sm cursor-pointer transition-colors border"
          :style="{
            color: getActionColor(action.style),
            borderColor: theme.surface2,
            backgroundColor: getActionBgColor(action.style),
          }"
          @click="handleAction(action)"
        >
          {{ action.label }}
        </button>
      </div>
    </div>
  </dialog>
</template>

<style scoped>
dialog::backdrop {
  background: rgba(0, 0, 0, 0.5);
}
</style>
