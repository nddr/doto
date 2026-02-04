import { ref, watch } from 'vue'

import type { CatppuccinTheme } from '@/composables/useTheme'

export interface Tag {
  id: string
  name: string
  color: keyof CatppuccinTheme
}

export const TAG_COLORS: (keyof CatppuccinTheme)[] = [
  'rosewater',
  'flamingo',
  'pink',
  'mauve',
  'red',
  'maroon',
  'peach',
  'yellow',
  'green',
  'teal',
  'sky',
  'sapphire',
  'blue',
  'lavender',
]

const STORAGE_KEY = 'doto-tags'

function loadFromStorage(): Tag[] {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return []
    }
  }
  return []
}

function saveToStorage(data: Tag[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

const tags = ref<Tag[]>(loadFromStorage())

watch(tags, (newTags) => saveToStorage(newTags), { deep: true })

function generateId(): string {
  return Math.random().toString(36).substring(2, 10)
}

export function useTagStore() {
  function addTag(name: string, color: keyof CatppuccinTheme): Tag {
    const tag: Tag = { id: generateId(), name, color }
    tags.value.push(tag)
    return tag
  }

  function removeTag(tagId: string) {
    const index = tags.value.findIndex((t) => t.id === tagId)
    if (index !== -1) {
      tags.value.splice(index, 1)
    }
  }

  function getTag(tagId: string): Tag | undefined {
    return tags.value.find((t) => t.id === tagId)
  }

  return {
    tags,
    addTag,
    removeTag,
    getTag,
  }
}
