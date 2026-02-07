<script setup lang="ts">
import { useToast, type Toast } from '@/composables/useToast'
import { themeColor } from '@/composables/useTheme'

const { toasts, dismiss } = useToast()

const typeColors: Record<Toast['type'], string> = {
  success: themeColor('green'),
  error: themeColor('red'),
  info: themeColor('blue'),
  warning: themeColor('yellow'),
}

const typeIcons: Record<Toast['type'], string> = {
  success: '✓',
  error: '✕',
  info: 'i',
  warning: '!',
}
</script>

<template>
  <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="relative flex flex-col border shadow-lg overflow-hidden bg-surface1 border-surface2"
      >
        <div class="flex items-start gap-3 px-4 py-3">
          <!-- Icon -->
          <span
            class="flex items-center justify-center w-5 h-5 text-sm font-bold rounded-full shrink-0 text-crust"
            :style="{ backgroundColor: typeColors[toast.type] }"
          >
            {{ typeIcons[toast.type] }}
          </span>

          <!-- Message -->
          <span class="flex-1 text-sm text-text">
            {{ toast.message }}
          </span>

          <!-- Dismiss button -->
          <button
            class="shrink-0 cursor-pointer transition-colors text-overlay0 hover:text-text"
            @click="dismiss(toast.id)"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-move {
  transition: transform 0.3s ease;
}
</style>
