<script setup lang="ts">
import { ref } from 'vue'
import { useTheme, type CatppuccinTheme } from '@/composables/useTheme'
import { useTagStore, TAG_COLORS } from '@/composables/useTagStore'

defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const { theme } = useTheme()
const { tags, addTag } = useTagStore()

const showDropdown = ref(false)
const showCreateForm = ref(false)
const newTagName = ref('')
const newTagColor = ref<keyof CatppuccinTheme>('green')

function toggleDropdown() {
  showDropdown.value = !showDropdown.value
  showCreateForm.value = false
}

function closeAll() {
  showDropdown.value = false
  showCreateForm.value = false
}

function selectTag(tagId: string) {
  emit('update:modelValue', tagId)
  showDropdown.value = false
}

function openCreateForm() {
  showCreateForm.value = true
  showDropdown.value = false
  newTagName.value = ''
  newTagColor.value = 'green'
}

function handleCreateTag() {
  const name = newTagName.value.trim()
  if (!name) return
  addTag(name, newTagColor.value)
  showCreateForm.value = false
  newTagName.value = ''
}

function cancelCreate() {
  showCreateForm.value = false
  newTagName.value = ''
}

function getSelectedLabel(modelValue: string): string {
  if (modelValue === 'all') return 'All'
  const tag = tags.value.find((t) => t.id === modelValue)
  return tag ? tag.name : 'All'
}

function getSelectedColor(modelValue: string): string | null {
  if (modelValue === 'all') return null
  const tag = tags.value.find((t) => t.id === modelValue)
  return tag ? theme.value[tag.color as keyof CatppuccinTheme] : null
}
</script>

<template>
  <!-- Backdrop -->
  <div
    v-if="showDropdown || showCreateForm"
    class="fixed inset-0 z-10"
    @click="closeAll"
  />

  <div class="flex items-center gap-2 relative z-20">
    <!-- + Tag button -->
    <button
      class="px-2 py-1 text-sm border cursor-pointer transition-colors"
      :style="{
        borderColor: theme.surface1,
        backgroundColor: theme.surface0,
        color: theme.overlay0,
      }"
      @click="openCreateForm"
      @mouseenter="($event.target as HTMLElement).style.color = theme.lavender"
      @mouseleave="($event.target as HTMLElement).style.color = theme.overlay0"
    >
      +
    </button>

    <!-- Dropdown trigger -->
    <button
      class="flex items-center gap-2 px-2 py-1 text-sm border cursor-pointer transition-colors"
      :style="{
        borderColor: theme.surface1,
        backgroundColor: theme.surface0,
        color: theme.text,
      }"
      @click="toggleDropdown"
    >
      <span
        v-if="getSelectedColor(modelValue)"
        class="w-3 h-3 rounded-full inline-block"
        :style="{ backgroundColor: getSelectedColor(modelValue)! }"
      ></span>
      Tag: {{ getSelectedLabel(modelValue) }}
    </button>

    <!-- Dropdown panel -->
    <div
      v-if="showDropdown"
      class="absolute top-full right-0 mt-1 border min-w-40"
      :style="{
        borderColor: theme.surface1,
        backgroundColor: theme.surface0,
      }"
    >
      <!-- All option -->
      <button
        class="block w-full px-3 py-1 text-left text-sm cursor-pointer transition-colors whitespace-nowrap"
        :style="{
          color: modelValue === 'all' ? theme.lavender : theme.text,
          backgroundColor: modelValue === 'all' ? theme.surface1 : 'transparent',
        }"
        @click="selectTag('all')"
        @mouseenter="($event.target as HTMLElement).style.backgroundColor = theme.surface1"
        @mouseleave="($event.target as HTMLElement).style.backgroundColor = modelValue === 'all' ? theme.surface1 : 'transparent'"
      >
        All
      </button>

      <!-- Tag options -->
      <button
        v-for="tag in tags"
        :key="tag.id"
        class="flex items-center gap-2 w-full px-3 py-1 text-left text-sm cursor-pointer transition-colors whitespace-nowrap"
        :style="{
          color: modelValue === tag.id ? theme.lavender : theme.text,
          backgroundColor: modelValue === tag.id ? theme.surface1 : 'transparent',
        }"
        @click="selectTag(tag.id)"
        @mouseenter="($event.target as HTMLElement).style.backgroundColor = theme.surface1"
        @mouseleave="($event.target as HTMLElement).style.backgroundColor = modelValue === tag.id ? theme.surface1 : 'transparent'"
      >
        <span
          class="w-3 h-3 rounded-full shrink-0"
          :style="{ backgroundColor: theme[tag.color as keyof CatppuccinTheme] }"
        ></span>
        {{ tag.name }}
      </button>
    </div>

    <!-- Create tag form -->
    <div
      v-if="showCreateForm"
      class="absolute top-full right-0 mt-1 border p-3 min-w-56"
      :style="{
        borderColor: theme.surface1,
        backgroundColor: theme.surface0,
      }"
    >
      <input
        v-model="newTagName"
        type="text"
        placeholder="Tag name"
        class="w-full px-2 py-1 mb-2 text-sm bg-transparent border outline-none"
        :style="{
          borderColor: theme.surface2,
          color: theme.text,
        }"
        @keydown.enter="handleCreateTag"
        @keydown.escape="cancelCreate"
      />

      <!-- Color palette -->
      <div class="grid grid-cols-7 gap-1 mb-2">
        <button
          v-for="color in TAG_COLORS"
          :key="color"
          class="w-6 h-6 rounded-full cursor-pointer transition-transform"
          :style="{
            backgroundColor: theme[color as keyof CatppuccinTheme],
            transform: newTagColor === color ? 'scale(1.25)' : 'scale(1)',
            outline: newTagColor === color ? `2px solid ${theme.text}` : 'none',
            outlineOffset: '1px',
          }"
          @click="newTagColor = color"
        ></button>
      </div>

      <div class="flex gap-2 justify-end">
        <button
          class="px-2 py-1 text-sm cursor-pointer transition-colors"
          :style="{ color: theme.overlay0 }"
          @click="cancelCreate"
        >
          Cancel
        </button>
        <button
          class="px-2 py-1 text-sm border cursor-pointer transition-colors"
          :style="{
            borderColor: theme.surface2,
            color: theme.text,
          }"
          @click="handleCreateTag"
        >
          Create
        </button>
      </div>
    </div>
  </div>
</template>
