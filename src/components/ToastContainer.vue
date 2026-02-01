<script setup lang="ts">
import { computed } from 'vue'
import { useToast, type Toast, type ToastAction } from '@/composables/useToast'
import { useTheme } from '@/composables/useTheme'

const { toasts, dismiss } = useToast()
const { theme } = useTheme()

const typeColors = computed(() => ({
  success: theme.value.green,
  error: theme.value.red,
  info: theme.value.blue,
  warning: theme.value.yellow,
}))

const typeIcons: Record<Toast['type'], string> = {
  success: '✓',
  error: '✕',
  info: 'i',
  warning: '!',
}

function handleAction(toast: Toast, action: ToastAction) {
  action.handler()
  dismiss(toast.id)
}

function getActionColor(style: ToastAction['style']) {
  switch (style) {
    case 'primary':
      return theme.value.blue
    case 'danger':
      return theme.value.red
    default:
      return theme.value.text
  }
}
</script>

<template>
  <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="relative flex flex-col border shadow-lg overflow-hidden"
        :style="{
          backgroundColor: theme.surface1,
          borderColor: theme.surface2,
        }"
      >
        <div class="flex items-start gap-3 px-4 py-3">
          <!-- Icon -->
          <span
            class="flex items-center justify-center w-5 h-5 text-sm font-bold rounded-full shrink-0"
            :style="{
              backgroundColor: typeColors[toast.type],
              color: theme.crust,
            }"
          >
            {{ typeIcons[toast.type] }}
          </span>

          <!-- Message -->
          <span
            class="flex-1 text-sm"
            :style="{ color: theme.text }"
          >
            {{ toast.message }}
          </span>

          <!-- Dismiss button -->
          <button
            class="shrink-0 cursor-pointer transition-colors"
            :style="{ color: theme.overlay0 }"
            @click="dismiss(toast.id)"
            @mouseenter="($event.target as HTMLElement).style.color = theme.text"
            @mouseleave="($event.target as HTMLElement).style.color = theme.overlay0"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>

        <!-- Action buttons -->
        <div
          v-if="toast.actions?.length"
          class="flex justify-end gap-2 px-4 pb-3"
        >
          <button
            v-for="(action, index) in toast.actions"
            :key="index"
            class="px-3 py-1 text-sm cursor-pointer transition-colors border"
            :style="{
              color: getActionColor(action.style),
              borderColor: theme.surface2,
              backgroundColor: theme.surface0,
            }"
            @click="handleAction(toast, action)"
            @mouseenter="($event.target as HTMLElement).style.backgroundColor = theme.surface2"
            @mouseleave="($event.target as HTMLElement).style.backgroundColor = theme.surface0"
          >
            {{ action.label }}
          </button>
        </div>

        <!-- Progress bar -->
        <div
          v-if="toast.duration > 0"
          class="toast-progress h-0.5"
          :style="{
            backgroundColor: typeColors[toast.type],
            animationDuration: `${toast.duration}ms`,
          }"
        ></div>
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

@keyframes toast-progress {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}

.toast-progress {
  animation: toast-progress linear forwards;
}
</style>
