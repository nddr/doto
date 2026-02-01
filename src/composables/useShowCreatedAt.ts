import { ref } from 'vue'

const STORAGE_KEY = 'doto-show-created-at'

const showCreatedAt = ref<boolean>(localStorage.getItem(STORAGE_KEY) === 'true')

export function useShowCreatedAt() {
  function setShowCreatedAt(value: boolean) {
    showCreatedAt.value = value
    localStorage.setItem(STORAGE_KEY, String(value))
  }

  return {
    showCreatedAt,
    setShowCreatedAt,
  }
}
