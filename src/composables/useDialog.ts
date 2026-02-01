import { ref } from 'vue'

export interface DialogAction {
  label: string
  handler: () => void
  style?: 'primary' | 'danger' | 'default'
}

export interface DialogOptions {
  title: string
  message: string
  actions: DialogAction[]
}

const isOpen = ref(false)
const currentOptions = ref<DialogOptions | null>(null)

export function useDialog() {
  function open(options: DialogOptions) {
    currentOptions.value = options
    isOpen.value = true
  }

  function close() {
    isOpen.value = false
    currentOptions.value = null
  }

  function confirm(message: string, onConfirm: () => void, onCancel?: () => void) {
    open({
      title: 'Confirm',
      message,
      actions: [
        {
          label: 'Cancel',
          style: 'default',
          handler: () => {
            close()
            onCancel?.()
          },
        },
        {
          label: 'Confirm',
          style: 'primary',
          handler: () => {
            close()
            onConfirm()
          },
        },
      ],
    })
  }

  return {
    isOpen,
    currentOptions,
    open,
    close,
    confirm,
  }
}
