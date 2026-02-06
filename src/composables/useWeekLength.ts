import { ref, computed } from 'vue'

export type WeekLength = '1' | '5' | '7'

const STORAGE_KEY = 'doto-week-length'

const weekLength = ref<WeekLength>((localStorage.getItem(STORAGE_KEY) as WeekLength) || '7')

export function useWeekLength() {
  function setWeekLength(length: WeekLength) {
    weekLength.value = length
    localStorage.setItem(STORAGE_KEY, length)
  }

  const weekLengthLabel = computed(() => {
    if (weekLength.value === '1') return '1 day'
    return weekLength.value === '5' ? '5 days' : '7 days'
  })

  return {
    weekLength,
    setWeekLength,
    weekLengthLabel,
  }
}
