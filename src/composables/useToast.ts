import { ref } from 'vue'

export interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  duration: number
}

export interface ToastOptions {
  type?: Toast['type']
  duration?: number
}

const toasts = ref<Toast[]>([])
let nextId = 1

const DEFAULT_DURATIONS: Record<Toast['type'], number> = {
  success: 3000,
  error: 5000,
  info: 4000,
  warning: 4000,
}

export function useToast() {
  function show(message: string, options: ToastOptions = {}) {
    const type = options.type ?? 'info'
    const duration = options.duration ?? DEFAULT_DURATIONS[type]

    const toast: Toast = {
      id: nextId++,
      message,
      type,
      duration,
    }

    toasts.value.push(toast)

    if (duration > 0) {
      setTimeout(() => {
        dismiss(toast.id)
      }, duration)
    }

    return toast.id
  }

  function success(message: string, duration?: number) {
    return show(message, { type: 'success', duration })
  }

  function error(message: string, duration?: number) {
    return show(message, { type: 'error', duration })
  }

  function info(message: string, duration?: number) {
    return show(message, { type: 'info', duration })
  }

  function warning(message: string, duration?: number) {
    return show(message, { type: 'warning', duration })
  }

  function dismiss(id: number) {
    const index = toasts.value.findIndex((t) => t.id === id)
    if (index !== -1) {
      toasts.value.splice(index, 1)
    }
  }

  function dismissAll() {
    toasts.value.splice(0, toasts.value.length)
  }

  return {
    toasts,
    show,
    success,
    error,
    info,
    warning,
    dismiss,
    dismissAll,
  }
}
