<script setup lang="ts">
import { ref } from 'vue'
import { themeColor, type ThemeColorName } from '@/composables/useTheme'
import { useTagStore, TAG_COLORS, type Tag } from '@/composables/useTagStore'
import { useTodoList } from '@/composables/useTodoList'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const { tags, addTag, updateTag, removeTag } = useTagStore()
const { removeTagFromAllNotes } = useTodoList()

const showDropdown = ref(false)
const showCreateForm = ref(false)
const newTagName = ref('')
const newTagColor = ref<ThemeColorName>('green')

const editingTag = ref<Tag | null>(null)
const editTagName = ref('')
const editTagColor = ref<ThemeColorName>('green')

function toggleDropdown() {
  showDropdown.value = !showDropdown.value
  showCreateForm.value = false
  editingTag.value = null
}

function closeAll() {
  showDropdown.value = false
  showCreateForm.value = false
  editingTag.value = null
}

function selectTag(tagId: string) {
  emit('update:modelValue', tagId)
  showDropdown.value = false
}

function openCreateForm() {
  showCreateForm.value = true
  showDropdown.value = false
  editingTag.value = null
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

function openEditForm(tag: Tag, event: Event) {
  event.stopPropagation()
  editingTag.value = tag
  editTagName.value = tag.name
  editTagColor.value = tag.color
  showDropdown.value = false
  showCreateForm.value = false
}

function handleUpdateTag() {
  const name = editTagName.value.trim()
  if (!name || !editingTag.value) return
  updateTag(editingTag.value.id, { name, color: editTagColor.value })
  editingTag.value = null
}

function handleDeleteTag() {
  if (!editingTag.value) return
  const tagId = editingTag.value.id
  // If deleted tag is currently selected, reset filter to 'all'
  if (props.modelValue === tagId) {
    emit('update:modelValue', 'all')
  }
  removeTagFromAllNotes(tagId)
  removeTag(tagId)
  editingTag.value = null
}

function cancelEdit() {
  editingTag.value = null
}

function getSelectedLabel(modelValue: string): string {
  if (modelValue === 'all') return 'All'
  const tag = tags.value.find((t) => t.id === modelValue)
  return tag ? tag.name : 'All'
}

function getSelectedColor(modelValue: string): string | null {
  if (modelValue === 'all') return null
  const tag = tags.value.find((t) => t.id === modelValue)
  return tag ? themeColor(tag.color) : null
}
</script>

<template>
  <!-- Backdrop -->
  <div
    v-if="showDropdown || showCreateForm || editingTag"
    class="fixed inset-0 z-10"
    @click="closeAll"
  />

  <div class="flex items-center gap-2 relative z-20">
    <!-- + Tag button -->
    <button
      class="px-3 py-1 border cursor-pointer transition-colors border-surface1 bg-surface0 text-overlay0 hover:text-lavender"
      @click="openCreateForm"
    >
      +
    </button>

    <!-- Dropdown trigger -->
    <button
      class="flex items-center gap-2 px-2 py-1 border cursor-pointer transition-colors border-surface1 bg-surface0 text-text"
      @click="toggleDropdown"
    >
      <span
        v-if="getSelectedColor(modelValue)"
        class="w-3 h-3 inline-block"
        :style="{ backgroundColor: getSelectedColor(modelValue)! }"
      ></span>
      Tag: {{ getSelectedLabel(modelValue) }}
    </button>

    <!-- Dropdown panel -->
    <div
      v-if="showDropdown"
      class="absolute top-full right-0 mt-1 border min-w-40 border-surface1 bg-surface0"
    >
      <!-- All option -->
      <button
        class="block w-full px-3 py-1 text-left cursor-pointer transition-colors whitespace-nowrap hover:bg-surface1"
        :class="modelValue === 'all' ? 'text-lavender bg-surface1' : 'text-text'"
        @click="selectTag('all')"
      >
        All
      </button>

      <!-- Tag options -->
      <div
        v-for="tag in tags"
        :key="tag.id"
        class="flex items-center gap-2 w-full px-3 py-1 text-left cursor-pointer transition-colors whitespace-nowrap group hover:bg-surface1"
        :class="modelValue === tag.id ? 'text-lavender bg-surface1' : 'text-text'"
        @click="selectTag(tag.id)"
      >
        <span
          class="w-3 h-3 shrink-0"
          :style="{ backgroundColor: themeColor(tag.color) }"
        ></span>
        <span class="flex-1">{{ tag.name }}</span>
        <button
          class="opacity-0 group-hover:opacity-100 transition-opacity ml-2 px-1 text-2xl hover:cursor-pointer text-text hover:text-lavender"
          @click="openEditForm(tag, $event)"
        >
          ✏️
        </button>
      </div>
    </div>

    <!-- Create tag form -->
    <div
      v-if="showCreateForm"
      class="absolute top-full right-0 mt-1 border p-3 min-w-64 border-surface1 bg-surface0"
    >
      <input
        v-model="newTagName"
        type="text"
        placeholder="Tag name"
        class="w-full px-2 py-1 mb-4 bg-transparent border outline-none border-surface2 text-text"
        @keydown.enter="handleCreateTag"
        @keydown.escape="cancelCreate"
      />

      <!-- Color palette -->
      <div class="grid grid-cols-7 gap-1 mb-4">
        <button
          v-for="color in TAG_COLORS"
          :key="color"
          class="w-6 h-6 cursor-pointer transition-transform"
          :style="{
            backgroundColor: themeColor(color),
            transform: newTagColor === color ? 'scale(1.25)' : 'scale(1)',
            outline: newTagColor === color ? `2px solid ${themeColor('text')}` : 'none',
            outlineOffset: '1px',
          }"
          @click="newTagColor = color"
        ></button>
      </div>

      <div class="flex gap-2 justify-end">
        <button
          class="px-2 py-1 border cursor-pointer transition-colors border-surface2 text-text"
          @click="handleCreateTag"
        >
          Create
        </button>
      </div>
    </div>

    <!-- Edit tag form -->
    <div
      v-if="editingTag"
      class="absolute top-full right-0 mt-1 border p-3 min-w-64 border-surface1 bg-surface0"
    >
      <input
        v-model="editTagName"
        type="text"
        placeholder="Tag name"
        class="w-full px-2 py-1 mb-4 bg-transparent border outline-none border-surface2 text-text"
        @keydown.enter="handleUpdateTag"
        @keydown.escape="cancelEdit"
      />

      <!-- Color palette -->
      <div class="grid grid-cols-7 gap-1 mb-4">
        <button
          v-for="color in TAG_COLORS"
          :key="color"
          class="w-6 h-6 cursor-pointer transition-transform"
          :style="{
            backgroundColor: themeColor(color),
            transform: editTagColor === color ? 'scale(1.25)' : 'scale(1)',
            outline: editTagColor === color ? `2px solid ${themeColor('text')}` : 'none',
            outlineOffset: '1px',
          }"
          @click="editTagColor = color"
        ></button>
      </div>

      <div class="flex gap-2 justify-between">
        <button
          class="px-2 py-1 border cursor-pointer transition-colors border-red text-red hover:bg-red hover:text-base"
          @click="handleDeleteTag"
        >
          Delete
        </button>
        <button
          class="px-2 py-1 border cursor-pointer transition-colors border-surface2 text-text"
          @click="handleUpdateTag"
        >
          Save
        </button>
      </div>
    </div>
  </div>
</template>
