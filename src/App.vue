<script setup lang="ts">
import { ref, nextTick, onMounted, onUnmounted } from 'vue'
import { useTodoList } from '@/composables/useTodoList'
import { useTheme, type ThemeName } from '@/composables/useTheme'

const { notes, addTodoNote, addTextNote, renameNote, removeNote, moveNote, updateTextContent, addTodo, removeTodo, toggleTodo } = useTodoList()
const { theme, themeName, themeNames, themes, setTheme } = useTheme()



const editingNoteId = ref<number | null>(null)
const editingName = ref('')
const draggedIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)

function startEditingNote(noteId: number, currentName: string) {
  editingNoteId.value = noteId
  editingName.value = currentName
  nextTick(() => {
    const input = document.querySelector(`[data-note-input="${noteId}"]`) as HTMLInputElement
    input?.focus()
    input?.select()
  })
}

function saveNoteName(noteId: number) {
  if (editingName.value.trim()) {
    renameNote(noteId, editingName.value.trim())
  }
  editingNoteId.value = null
  editingName.value = ''
}

function handleAddTodo(noteId: number, event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.value.trim()) return
  addTodo(noteId, input.value.trim())
  input.value = ''
}

function handleAddTodoNote() {
  addTodoNote('New List')
  nextTick(() => {
    const newNote = notes.value[notes.value.length - 1]
    if (newNote) {
      startEditingNote(newNote.id, newNote.name)
    }
  })
}

function handleAddTextNote() {
  addTextNote('New Note')
  nextTick(() => {
    const newNote = notes.value[notes.value.length - 1]
    if (newNote) {
      startEditingNote(newNote.id, newNote.name)
    }
  })
}

function handleDragStart(index: number) {
  draggedIndex.value = index
}

function handleDragEnd() {
  draggedIndex.value = null
  dragOverIndex.value = null
}

function handleDragOver(event: DragEvent) {
  event.preventDefault()
}

function handleDragEnter(index: number) {
  if (draggedIndex.value !== null && draggedIndex.value !== index) {
    dragOverIndex.value = index
  }
}

function handleDragLeave() {
  dragOverIndex.value = null
}

function handleDrop(toIndex: number) {
  if (draggedIndex.value !== null && draggedIndex.value !== toIndex) {
    moveNote(draggedIndex.value, toIndex)
  }
  draggedIndex.value = null
  dragOverIndex.value = null
}

function handleKeyboardShortcuts(event: KeyboardEvent) {
  const target = event.target as HTMLElement
  const isInputFocused = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

  if (isInputFocused) return

  if (event.key === 't' || event.key === 'T') {
    event.preventDefault()
    handleAddTodoNote()
  } else if (event.key === 'n' || event.key === 'N') {
    event.preventDefault()
    handleAddTextNote()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyboardShortcuts)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyboardShortcuts)
})
</script>

<template>
  <main class="w-screen min-h-screen p-6 pt-16 text-lg font-mono transition-colors duration-200"
    :style="{ backgroundColor: theme.base }">
    <!-- Theme Switcher -->
    <button popovertarget="theme-menu" class="fixed top-4 right-6 z-10 px-3 py-1 border cursor-pointer transition-colors" style="anchor-name: --theme-btn" :style="{
      borderColor: theme.surface1,
      backgroundColor: theme.surface0,
      color: theme.text,
    }">
      [ {{ theme.name }} ]
    </button>
    <div id="theme-menu" popover class="m-0 p-0 border" style="position-anchor: --theme-btn; inset: unset; top: anchor(bottom); right: anchor(right)" :style="{
      borderColor: theme.surface1,
      backgroundColor: theme.surface0,
    }">
      <button v-for="name in themeNames" :key="name" popovertarget="theme-menu"
        class="block w-full px-3 py-1 text-left cursor-pointer transition-colors" :style="{
          color: themeName === name ? theme.lavender : theme.text,
          backgroundColor: themeName === name ? theme.surface1 : 'transparent',
        }" @click="setTheme(name as ThemeName)"
        @mouseenter="($event.target as HTMLElement).style.backgroundColor = theme.surface1"
        @mouseleave="($event.target as HTMLElement).style.backgroundColor = themeName === name ? theme.surface1 : 'transparent'">
        {{ themeName === name ? '> ' : ' ' }}{{ themes[name].name }}
      </button>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
      <!-- Note Cards -->
      <div v-for="(note, index) in notes" :key="note.id"
        class="flex-1 min-w-[calc(25%-12px)] max-w-full border p-6 transition-colors" :style="{
          borderColor: draggedIndex === index ? 'white' : (dragOverIndex === index ? theme.lavender : theme.surface1),
          backgroundColor: theme.surface0,
          opacity: draggedIndex === index ? 0.5 : 1,
        }" draggable="true" @dragstart="handleDragStart(index)" @dragend="handleDragEnd" @dragover="handleDragOver"
        @dragenter="handleDragEnter(index)" @dragleave="handleDragLeave" @drop="handleDrop(index)">
        <!-- Note Name -->
        <div class="mb-2 flex items-center justify-between group/header">
          <input v-if="editingNoteId === note.id" v-model="editingName" :data-note-input="note.id"
            class="w-full bg-transparent outline-none border-b"
            :style="{ color: theme.lavender, borderColor: theme.lavender }"
            :aria-label="`Edit name for ${note.name}`"
            @blur="saveNoteName(note.id)"
            @keydown.enter="saveNoteName(note.id)" @keydown.escape="editingNoteId = null" />
          <span v-else class="cursor-pointer" :style="{ color: theme.lavender }"
            tabindex="0"
            role="button"
            :aria-label="`Edit ${note.name}`"
            @click="startEditingNote(note.id, note.name)"
            @keydown.enter="startEditingNote(note.id, note.name)"
            @keydown.space.prevent="startEditingNote(note.id, note.name)">
            > {{ note.name }}_
          </span>
          <button v-if="editingNoteId !== note.id" class="cursor-pointer ml-2" :style="{ color: theme.overlay0 }"
            :aria-label="`Delete ${note.name}`"
            @click="removeNote(note.id)" @mouseenter="($event.target as HTMLElement).style.color = theme.red"
            @mouseleave="($event.target as HTMLElement).style.color = theme.overlay0">
            [x]
          </button>
        </div>

        <!-- Separator -->
        <div class="border-b mb-3" :style="{ borderColor: theme.surface1 }"></div>

        <!-- Todo List Content -->
        <template v-if="note.type === 'todo'">
          <div class="space-y-1">
            <div v-for="todo in note.todos" :key="todo.id"
              class="group flex items-center gap-2 px-1 -mx-1 transition-colors"
              :style="{ '--hover-bg': theme.surface1 }"
              @mouseenter="($event.currentTarget as HTMLElement).style.backgroundColor = theme.surface1"
              @mouseleave="($event.currentTarget as HTMLElement).style.backgroundColor = 'transparent'">
              <span class="cursor-pointer select-none" :style="{ color: todo.completed ? theme.surface2 : theme.green }"
                @click="toggleTodo(note.id, todo.id)">
                [{{ todo.completed ? 'x' : ' ' }}]
              </span>
              <span class="flex-1 cursor-pointer" :class="{ 'line-through': todo.completed }"
                :style="{ color: todo.completed ? theme.surface2 : theme.text }" @click="toggleTodo(note.id, todo.id)">
                {{ todo.title }}
              </span>
              <button class="cursor-pointer" :style="{ color: theme.overlay0 }" @click="removeTodo(note.id, todo.id)"
                @mouseenter="($event.target as HTMLElement).style.color = theme.red"
                @mouseleave="($event.target as HTMLElement).style.color = theme.overlay0">
                [x]
              </button>
            </div>
          </div>

          <!-- Add Todo Input -->
          <div class="mt-3">
            <input type="text" placeholder="> Add todo..." class="w-full bg-transparent outline-none"
              :style="{ color: theme.overlay0 }" @keydown.enter="handleAddTodo(note.id, $event)"
              @focus="($event.target as HTMLElement).style.color = theme.text"
              @blur="handleAddTodo(note.id, $event); ($event.target as HTMLElement).style.color = theme.overlay0" />
          </div>
        </template>

        <!-- Text Note Content -->
        <template v-else>
          <textarea :value="note.content"
            @input="updateTextContent(note.id, ($event.target as HTMLTextAreaElement).value)"
            placeholder="Write your note..."
            class="w-full bg-transparent outline-none resize-none min-h-25 scrollbar-none" :style="{
              color: theme.text,
              backgroundImage: 'repeating-linear-gradient(transparent, transparent 1.4em, rgba(255, 255, 255, 0.05) 1.4em, rgba(255, 255, 255, 0.05) calc(1.4em + 1px))',
              lineHeight: '1.4em',
            }"></textarea>
        </template>
      </div>

      <!-- Add Note Buttons -->
      <div
        class="flex-1 min-w-[calc(25%-12px)] max-w-full border border-dashed p-4 flex flex-col items-center justify-center gap-2 transition-colors"
        :style="{ borderColor: theme.surface1 }">
        <button class="cursor-pointer transition-colors" :style="{ color: theme.overlay0 }" @click="handleAddTodoNote"
          @mouseenter="($event.target as HTMLElement).style.color = theme.lavender"
          @mouseleave="($event.target as HTMLElement).style.color = theme.overlay0">
          + New List
        </button>
        <button class="cursor-pointer transition-colors" :style="{ color: theme.overlay0 }" @click="handleAddTextNote"
          @mouseenter="($event.target as HTMLElement).style.color = theme.lavender"
          @mouseleave="($event.target as HTMLElement).style.color = theme.overlay0">
          + New Note
        </button>
      </div>
    </div>
  </main>
</template>
