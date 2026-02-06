<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useTodoList } from '@/composables/useTodoList'
import { useTheme } from '@/composables/useTheme'
import { useWeekLength } from '@/composables/useWeekLength'
import { useShowCreatedAt } from '@/composables/useShowCreatedAt'
import { useDialog } from '@/composables/useDialog'
import { toLocalDateString } from '@/utils/date'
import AppHeader from '@/components/AppHeader.vue'
import ToastContainer from '@/components/ToastContainer.vue'
import Dialog from '@/components/Dialog.vue'
import TagFilter from '@/components/TagFilter.vue'
import DayFilter from '@/components/DayFilter.vue'
import NoteCard from '@/components/NoteCard.vue'

const { notes, addTaskNote, addTextNote, renameNote, removeNote, moveNoteById, updateTextContent, updateNoteDate, updateNoteTag, addTodo, removeTodo, toggleTodo, renameTodo, moveTodo, moveTodoBetweenNotes, duplicateTaskNote, moveTodoToDate } = useTodoList()
const { theme } = useTheme()
const { weekLength } = useWeekLength()
const { showCreatedAt } = useShowCreatedAt()
const { open: openDialog, close: closeDialog } = useDialog()

// Template refs for NoteCard instances
const noteCardRefs = ref<Record<number, InstanceType<typeof NoteCard>>>({})

const draggedNoteId = ref<number | null>(null)
const dragOverCardId = ref<number | null>(null)
const dragOverDay = ref<string | null>(null)
const draggedTodo = ref<{ noteId: number; todoIndex: number } | null>(null)
const dragOverTodoIndex = ref<number | null>(null)
const dragOverNoteId = ref<number | null>(null)
const selectedDate = ref<string | null>(toLocalDateString())
const tagFilter = ref<string>('all')
const weekOffset = ref(0)

const allDays = [
  { full: 'Monday', short: 'Mon', letter: 'M' },
  { full: 'Tuesday', short: 'Tue', letter: 'T' },
  { full: 'Wednesday', short: 'Wed', letter: 'W' },
  { full: 'Thursday', short: 'Thu', letter: 'T' },
  { full: 'Friday', short: 'Fri', letter: 'F' },
  { full: 'Saturday', short: 'Sat', letter: 'S' },
  { full: 'Sunday', short: 'Sun', letter: 'S' },
]

const weekDates = computed(() => {
  const today = new Date()

  if (weekLength.value === '1') {
    const targetDate = new Date(today)
    targetDate.setDate(today.getDate() + weekOffset.value)
    const dayIndex = (targetDate.getDay() + 6) % 7 // 0=Mon
    const dayInfo = allDays[dayIndex]!
    return [{
      full: dayInfo.full,
      short: dayInfo.short,
      letter: dayInfo.letter,
      date: toLocalDateString(targetDate),
      dayOfMonth: targetDate.getDate(),
    }]
  }

  const dayOfWeek = today.getDay() // 0 = Sunday
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7) + (weekOffset.value * 7))

  const days = weekLength.value === '5' ? allDays.slice(0, 5) : allDays

  return days.map((day, i) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + i)
    return {
      ...day,
      date: toLocalDateString(date),
      dayOfMonth: date.getDate(),
    }
  })
})

const todayDate = computed(() => toLocalDateString())

const currentMonth = computed(() => {
  const today = new Date()
  if (weekLength.value === '1') {
    const targetDate = new Date(today)
    targetDate.setDate(today.getDate() + weekOffset.value)
    return targetDate.toLocaleDateString('en-US', { month: 'long' })
  }
  const dayOfWeek = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7) + (weekOffset.value * 7))
  return monday.toLocaleDateString('en-US', { month: 'long' })
})

const currentYear = computed(() => {
  const today = new Date()
  if (weekLength.value === '1') {
    const targetDate = new Date(today)
    targetDate.setDate(today.getDate() + weekOffset.value)
    return targetDate.getFullYear()
  }
  const dayOfWeek = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7) + (weekOffset.value * 7))
  return monday.getFullYear()
})

const filteredNotes = computed(() => {
  let result = notes.value
  if (selectedDate.value) {
    result = result.filter((note) => note.currentDate === selectedDate.value)
  }
  if (tagFilter.value !== 'all') {
    result = result.filter((note) => note.tags?.includes(tagFilter.value))
  }
  return result
})

watch(weekLength, () => {
  weekOffset.value = 0
})

watch(weekDates, (dates) => {
  if (weekLength.value === '1' && dates.length === 1) {
    selectedDate.value = dates[0]!.date
  }
})

function setNoteCardRef(noteId: number, el: InstanceType<typeof NoteCard> | null) {
  if (el) {
    noteCardRefs.value[noteId] = el
  } else {
    delete noteCardRefs.value[noteId]
  }
}

function handleUpdateTag(noteId: number, tagId: string | null) {
  updateNoteTag(noteId, tagId)
}

function isOldNote(note: typeof notes.value[0]): boolean {
  return !!note.currentDate && note.currentDate < todayDate.value
}

function goToPreviousWeek() {
  weekOffset.value--
}

function goToNextWeek() {
  weekOffset.value++
}

function handleAddTaskNote() {
  const defaultName = selectedDate.value ?? toLocalDateString()
  addTaskNote(defaultName, selectedDate.value ?? undefined)
  nextTick(() => {
    const newNote = notes.value[notes.value.length - 1]
    if (newNote) {
      if (tagFilter.value !== 'all') {
        updateNoteTag(newNote.id, tagFilter.value)
      }
      nextTick(() => {
        noteCardRefs.value[newNote.id]?.startEditingNote()
      })
    }
  })
}

function handleAddTextNote() {
  const defaultName = selectedDate.value ?? toLocalDateString()
  addTextNote(defaultName, selectedDate.value ?? undefined)
  nextTick(() => {
    const newNote = notes.value[notes.value.length - 1]
    if (newNote) {
      if (tagFilter.value !== 'all') {
        updateNoteTag(newNote.id, tagFilter.value)
      }
      nextTick(() => {
        noteCardRefs.value[newNote.id]?.startEditingNote()
      })
    }
  })
}

function handleDragStart(noteId: number) {
  draggedNoteId.value = noteId
}

function handleDragEnd() {
  draggedNoteId.value = null
  dragOverCardId.value = null
  dragOverDay.value = null
}

function handleDragEnter(noteId: number) {
  if (draggedNoteId.value !== null && draggedNoteId.value !== noteId) {
    dragOverCardId.value = noteId
  }
}

function handleDragLeave() {
  dragOverCardId.value = null
}

function handleDrop(toNoteId: number) {
  if (draggedNoteId.value !== null && draggedNoteId.value !== toNoteId) {
    moveNoteById(draggedNoteId.value, toNoteId)
  }
  draggedNoteId.value = null
  dragOverCardId.value = null
}

function handleDayDragEnter(date: string) {
  if (draggedNoteId.value !== null || draggedTodo.value !== null) {
    dragOverDay.value = date
  }
}

function handleDayDragLeave() {
  dragOverDay.value = null
}

function handleDayDrop(date: string) {
  // Handle todo drop
  if (draggedTodo.value !== null) {
    const { noteId, todoIndex } = draggedTodo.value
    moveTodoToDate(noteId, todoIndex, date)

    // Clear drag state
    draggedTodo.value = null
    dragOverTodoIndex.value = null
    dragOverNoteId.value = null
    dragOverDay.value = null
    return
  }

  // Handle note drop
  if (draggedNoteId.value === null) return

  const note = notes.value.find((n) => n.id === draggedNoteId.value)

  // Reset drag state immediately
  draggedNoteId.value = null
  dragOverCardId.value = null
  dragOverDay.value = null

  if (!note) return

  // Only show dialog for TaskNotes
  if (note.type === 'task') {
    const targetDate = new Date(date + 'T00:00:00')
    const formattedDate = targetDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    })
    openDialog({
      title: 'Keep a copy?',
      message: `Moving "${note.name}" to ${formattedDate}. Would you like to keep a copy here as well?`,
      actions: [
        {
          label: 'No',
          style: 'default',
          handler: () => {
            updateNoteDate(note.id, date)
            closeDialog()
          },
        },
        {
          label: 'Yes',
          style: 'default',
          handler: () => {
            duplicateTaskNote(note.id, date)
            closeDialog()
          },
        },
      ],
    })
  } else {
    // TextNotes move without dialog
    updateNoteDate(note.id, date)
  }
}

function handleTodoDragStart(noteId: number, todoIndex: number, event: DragEvent) {
  event.stopPropagation()
  draggedTodo.value = { noteId, todoIndex }
}

function handleTodoDragEnd() {
  draggedTodo.value = null
  dragOverTodoIndex.value = null
  dragOverNoteId.value = null
  dragOverDay.value = null
}

function handleTodoDragEnter(noteId: number, todoIndex: number) {
  if (draggedTodo.value !== null) {
    dragOverNoteId.value = noteId
    dragOverTodoIndex.value = todoIndex
  }
}

function handleTodoDragLeave() {
  dragOverTodoIndex.value = null
}

function handleTodoDrop(noteId: number, toIndex: number, event: DragEvent) {
  event.stopPropagation()
  if (draggedTodo.value === null) return

  const { noteId: fromNoteId, todoIndex: fromIndex } = draggedTodo.value

  if (fromNoteId === noteId) {
    // Same note: use existing moveTodo
    if (fromIndex !== toIndex) {
      moveTodo(noteId, fromIndex, toIndex)
    }
  } else {
    // Different note: use new moveTodoBetweenNotes
    moveTodoBetweenNotes(fromNoteId, noteId, fromIndex, toIndex)
  }

  draggedTodo.value = null
  dragOverTodoIndex.value = null
  dragOverNoteId.value = null
}

function handleKeyboardShortcuts(event: KeyboardEvent) {
  const target = event.target as HTMLElement
  const isInputFocused = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

  if (isInputFocused) return

  if (event.key === 't' || event.key === 'T') {
    event.preventDefault()
    handleAddTaskNote()
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
  <main
    class="w-screen min-h-screen p-6 pt-16 text-lg font-mono transition-colors duration-200"
    :style="{ backgroundColor: theme.base }"
  >
    <AppHeader />

    <!-- Month Header + Tag Filter -->
    <div class="flex items-center justify-between mt-4 mb-2">
      <div
        class="text-2xl"
        :style="{ color: theme.text }"
      >
        {{ currentMonth }}
        <span
          class="text-xl"
          :style="{ color: theme.overlay0 }"
          >{{ currentYear }}</span
        >
      </div>

      <!-- Tag Filter -->
      <TagFilter v-model="tagFilter" />
    </div>

    <!-- Day Filter -->
    <DayFilter
      v-model="selectedDate"
      :week-dates="weekDates"
      :today-date="todayDate"
      :drag-over-day="dragOverDay"
      @previous-week="goToPreviousWeek"
      @next-week="goToNextWeek"
      @day-drag-enter="handleDayDragEnter"
      @day-drag-leave="handleDayDragLeave"
      @day-drop="handleDayDrop"
    />

    <div class="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 4xl:grid-cols-4 gap-4">
      <!-- Note Cards -->
      <NoteCard
        v-for="note in filteredNotes"
        :key="note.id"
        :ref="(el) => setNoteCardRef(note.id, el as InstanceType<typeof NoteCard>)"
        :note="note"
        :is-dragging="draggedNoteId === note.id"
        :is-drag-over="dragOverCardId === note.id"
        :is-old="isOldNote(note)"
        :show-created-at="showCreatedAt"
        :dragged-todo="draggedTodo"
        :drag-over-todo-index="dragOverTodoIndex"
        :drag-over-note-id="dragOverNoteId"
        @rename-note="renameNote"
        @rename-todo="renameTodo"
        @update-tag="handleUpdateTag"
        @remove-note="removeNote"
        @toggle-todo="toggleTodo"
        @add-todo="addTodo"
        @remove-todo="removeTodo"
        @update-text-content="updateTextContent"
        @drag-start="handleDragStart"
        @drag-end="handleDragEnd"
        @drag-enter="handleDragEnter"
        @drag-leave="handleDragLeave"
        @drop="handleDrop"
        @todo-drag-start="handleTodoDragStart"
        @todo-drag-end="handleTodoDragEnd"
        @todo-drag-enter="handleTodoDragEnter"
        @todo-drag-leave="handleTodoDragLeave"
        @todo-drop="handleTodoDrop"
      />

      <!-- Add Note Buttons -->
      <div
        class="flex-1 min-w-[calc(25%-12px)] max-w-full border border-dashed p-4 flex flex-col items-center justify-center gap-2 transition-colors"
        :style="{ borderColor: theme.surface1 }"
      >
        <button
          class="cursor-pointer transition-colors"
          :style="{ color: theme.overlay0 }"
          @click="handleAddTaskNote"
          @mouseenter="($event.target as HTMLElement).style.color = theme.lavender"
          @mouseleave="($event.target as HTMLElement).style.color = theme.overlay0"
        >
          + New Todo
        </button>
        <button
          class="cursor-pointer transition-colors"
          :style="{ color: theme.overlay0 }"
          @click="handleAddTextNote"
          @mouseenter="($event.target as HTMLElement).style.color = theme.lavender"
          @mouseleave="($event.target as HTMLElement).style.color = theme.overlay0"
        >
          + New Note
        </button>
      </div>
    </div>

    <ToastContainer />
    <Dialog />
  </main>
</template>
