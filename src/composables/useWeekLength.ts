import { ref, computed } from 'vue'

export type WeekLength = '5' | '7'

const STORAGE_KEY = 'oe-week-length'

const weekLength = ref<WeekLength>((localStorage.getItem(STORAGE_KEY) as WeekLength) || '7')

export function useWeekLength() {
  function setWeekLength(length: WeekLength) {
    weekLength.value = length
    localStorage.setItem(STORAGE_KEY, length)
  }

  const weekLengthLabel = computed(() => (weekLength.value === '5' ? '5 days' : '7 days'))

  return {
    weekLength,
    setWeekLength,
    weekLengthLabel,
  }
}
