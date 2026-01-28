<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { useTodoList } from '@/composables/useTodoList'
import { useTheme } from '@/composables/useTheme'
import AppHeader from '@/components/AppHeader.vue'

const { notes, addTodoNote, addTextNote, renameNote, removeNote, moveNote, updateTextContent, updateNoteDate, addTodo, removeTodo, toggleTodo } = useTodoList()
const { theme } = useTheme()

const editingNoteId = ref<number | null>(null)
const editingName = ref('')
const draggedIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)
const dragOverDay = ref<string | null>(null)
const selectedDate = ref<string | null>(new Date().toISOString().split('T')[0] ?? null)

const weekDates = computed(() => {
  const today = new Date()
  const dayOfWeek = today.getDay() // 0 = Sunday
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7))

  const days = [
    { full: 'Monday', short: 'Mon', letter: 'M' },
    { full: 'Tuesday', short: 'Tue', letter: 'T' },
    { full: 'Wednesday', short: 'Wed', letter: 'W' },
    { full: 'Thursday', short: 'Thu', letter: 'T' },
    { full: 'Friday', short: 'Fri', letter: 'F' },
    { full: 'Saturday', short: 'Sat', letter: 'S' },
    { full: 'Sunday', short: 'Sun', letter: 'S' },
  ]

  return days.map((day, i) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + i)
    return {
      ...day,
      date: date.toISOString().split('T')[0] ?? '',
      dayOfMonth: date.getDate(),
    }
  })
})

const todayDate = computed(() => new Date().toISOString().split('T')[0] ?? '')

const currentMonth = computed(() => {
  return new Date().toLocaleDateString('en-US', { month: 'long' })
})

const filteredNotes = computed(() => {
  if (!selectedDate.value) return notes.value
  return notes.value.filter((note) => note.currentDate === selectedDate.value)
})

function selectDay(date: string) {
  selectedDate.value = date
}

function selectAll() {
  selectedDate.value = null
}

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
  addTodoNote('New Tasks', selectedDate.value ?? undefined)
  nextTick(() => {
    const newNote = notes.value[notes.value.length - 1]
    if (newNote) {
      startEditingNote(newNote.id, newNote.name)
    }
  })
}

function handleAddTextNote() {
  addTextNote('New Note', selectedDate.value ?? undefined)
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
  dragOverDay.value = null
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

function handleDayDragEnter(date: string) {
  if (draggedIndex.value !== null) {
    dragOverDay.value = date
  }
}

function handleDayDragLeave() {
  dragOverDay.value = null
}

function handleDayDrop(date: string) {
  if (draggedIndex.value !== null) {
    const note = filteredNotes.value[draggedIndex.value]
    if (note) {
      updateNoteDate(note.id, date)
    }
  }
  draggedIndex.value = null
  dragOverIndex.value = null
  dragOverDay.value = null
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

    <AppHeader />

    <!-- Month Header -->
    <div class="text-2xl mt-4 mb-2" :style="{ color: theme.text }">
      {{ currentMonth }}
    </div>

    <!-- Day Filter -->
    <div class="flex gap-2 mb-4">
      <button
        class="py-2 px-2 border text-center cursor-pointer transition-colors"
        :style="{
          backgroundColor: selectedDate === null ? theme.surface1 : theme.surface0,
          borderColor: selectedDate === null ? theme.lavender : theme.surface1,
          color: selectedDate === null ? theme.lavender : theme.overlay0,
        }"
        @click="selectAll"
      >
        <span class="md:hidden">*</span>
        <span class="hidden md:inline">All</span>
      </button>
      <button v-for="day in weekDates" :key="day.date"
        class="flex-1 py-2 px-1 border text-center cursor-pointer transition-colors" :style="{
          backgroundColor: selectedDate === day.date ? theme.surface1 : theme.surface0,
          borderColor: dragOverDay === day.date ? theme.lavender : (selectedDate === day.date ? theme.lavender : theme.surface1),
          color: selectedDate === day.date ? theme.lavender : (day.date === todayDate ? theme.text : theme.overlay0),
        }"
        @click="selectDay(day.date)"
        @dragover="handleDragOver"
        @dragenter="handleDayDragEnter(day.date)"
        @dragleave="handleDayDragLeave"
        @drop="handleDayDrop(day.date)">
        <span class="md:hidden"><span class="opacity-50">{{ day.dayOfMonth }}</span></span>
        <span class="hidden md:inline xl:hidden"><span class="opacity-50">{{ day.dayOfMonth }}</span> {{ day.short }}</span>
        <span class="hidden xl:inline"><span class="opacity-50">{{ day.dayOfMonth }}</span> {{ day.full }}</span>
      </button>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
      <!-- Note Cards -->
      <div v-for="(note, index) in filteredNotes" :key="note.id"
        class="relative flex-1 min-w-[calc(25%-12px)] max-w-full border pt-8 px-6 pb-6 transition-colors flex flex-col"
        :style="{
          borderColor: draggedIndex === index ? 'white' : (dragOverIndex === index ? theme.lavender : theme.surface1),
          backgroundColor: theme.surface0,
          opacity: draggedIndex === index ? 0.5 : 1,
        }" @dragover="handleDragOver" @dragenter="handleDragEnter(index)" @dragleave="handleDragLeave"
        @drop="handleDrop(index)">
        <!-- Drag Handle -->
        <div class="absolute top-2 left-[calc(50%-12px)] flex justify-center py-1 px-4 cursor-grab" draggable="true"
          @dragstart="handleDragStart(index)" @dragend="handleDragEnd">
          <div class="flex flex-col gap-1">
            <div class="w-6 h-0.5 rounded" :style="{ backgroundColor: theme.overlay0 }"></div>
            <div class="w-6 h-0.5 rounded" :style="{ backgroundColor: theme.overlay0 }"></div>
          </div>
        </div>

        <!-- Note Name -->
        <div class="mb-2 flex items-center justify-between">
          <input v-if="editingNoteId === note.id" v-model="editingName" :data-note-input="note.id"
            class="w-full bg-transparent outline-none border-b"
            :style="{ color: theme.lavender, borderColor: theme.lavender }" :aria-label="`Edit name for ${note.name}`"
            @blur="saveNoteName(note.id)" @keydown.enter="saveNoteName(note.id)"
            @keydown.escape="editingNoteId = null" />
          <span v-else class="cursor-text" :style="{ color: theme.lavender }" tabindex="0" role="button"
            :aria-label="`Edit ${note.name}`" @click="startEditingNote(note.id, note.name)"
            @keydown.enter="startEditingNote(note.id, note.name)"
            @keydown.space.prevent="startEditingNote(note.id, note.name)">
            > {{ note.name }}
          </span>
          <button v-if="editingNoteId !== note.id" class="cursor-pointer ml-2" :style="{ color: theme.overlay0 }"
            :aria-label="`Delete ${note.name}`" @click="removeNote(note.id)"
            @mouseenter="($event.target as HTMLElement).style.color = theme.red"
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
              class="group flex items-start gap-2 px-1 -mx-1 transition-colors"
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
        <div v-else class="flex-1 min-h-25 grid">
          <textarea :value="note.content"
            @input="updateTextContent(note.id, ($event.target as HTMLTextAreaElement).value)"
            placeholder="Write your note..."
            class="w-full bg-transparent outline-none resize-none scrollbar-none [grid-area:1/1/2/2] field-sizing-content"
            :style="{
              color: theme.text,
              backgroundImage: 'repeating-linear-gradient(transparent, transparent 1.4em, rgba(255, 255, 255, 0.05) 1.4em, rgba(255, 255, 255, 0.05) calc(1.4em + 1px))',
              lineHeight: '1.4em',
            }"></textarea>
        </div>
      </div>

      <!-- Add Note Buttons -->
      <div
        class="flex-1 min-w-[calc(25%-12px)] max-w-full border border-dashed p-4 flex flex-col items-center justify-center gap-2 transition-colors"
        :style="{ borderColor: theme.surface1 }">
        <button class="cursor-pointer transition-colors" :style="{ color: theme.overlay0 }" @click="handleAddTodoNote"
          @mouseenter="($event.target as HTMLElement).style.color = theme.lavender"
          @mouseleave="($event.target as HTMLElement).style.color = theme.overlay0">
          + New Tasks
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
