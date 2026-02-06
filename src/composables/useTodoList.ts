import { ref, watch } from 'vue'

import { toLocalDateString, toLocalISOString } from '@/utils/date'
import { useTagStore } from '@/composables/useTagStore'

export interface Note {
  id: number
  name: string
  createdAt?: string
  currentDate?: string
  tags?: string[]
  autoAdvance?: boolean
  archived?: boolean
}

export interface TaskNote extends Note {
  type: 'task'
  todos: Todo[]
}

export interface TextNote extends Note {
  type: 'text'
  content: string
}

export type TodoStatus = 'incomplete' | 'in-progress' | 'completed'

export interface Todo {
  id: number
  title: string
  status: TodoStatus
  completedAt?: string
  createdAt?: string
}

export type NoteType = TaskNote | TextNote

const STORAGE_KEY = 'doto-notes'

function migrateTodoStatus(notes: NoteType[]): NoteType[] {
  for (const note of notes) {
    if (note.type === 'task') {
      for (const todo of note.todos) {
        // Migrate legacy 'completed' boolean to 'status' string
        const legacyTodo = todo as unknown as { completed?: boolean; status?: TodoStatus }
        if (typeof legacyTodo.completed === 'boolean' && legacyTodo.status === undefined) {
          todo.status = legacyTodo.completed ? 'completed' : 'incomplete'
          delete legacyTodo.completed
        }
      }
    }
  }
  return notes
}

function loadFromStorage(): NoteType[] {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      return migrateTodoStatus(parsed)
    } catch {
      return []
    }
  }
  return [
    {
      id: 1,
      type: 'task',
      name: 'My First Tasks',
      todos: [{ id: 1, title: 'Make my bed', status: 'incomplete' as TodoStatus }],
      autoAdvance: true,
      createdAt: toLocalISOString(),
      currentDate: toLocalDateString(),
    },
  ]
}

function saveToStorage(data: NoteType[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function getNextId(notes: NoteType[]): { noteId: number; todoId: number } {
  let maxNoteId = 0
  let maxTodoId = 0
  for (const note of notes) {
    if (note.id > maxNoteId) maxNoteId = note.id
    if (note.type === 'task') {
      for (const todo of note.todos) {
        if (todo.id > maxTodoId) maxTodoId = todo.id
      }
    }
  }
  return { noteId: maxNoteId + 1, todoId: maxTodoId + 1 }
}

const notes = ref<NoteType[]>(loadFromStorage())

const initialIds = getNextId(notes.value)
let nextNoteId = initialIds.noteId
let nextTodoId = initialIds.todoId

// Auto-advance notes on load
function advanceNotes() {
  const today = toLocalDateString()

  for (const note of notes.value) {
    if (note.autoAdvance && note.currentDate && note.currentDate < today) {
      if (note.type === 'task') {
        // Only advance if there are incomplete todos
        const hasIncompleteTodos = note.todos.some((todo) => todo.status !== 'completed')
        if (hasIncompleteTodos) {
          note.currentDate = today
        }
      } else if (note.type === 'text') {
        // Only advance if content is not empty
        if (note.content.trim()) {
          note.currentDate = today
        }
      }
    }
  }
}

advanceNotes()

// One-time migration from hardcoded 'work'/'personal' tags to tag store IDs
if (!localStorage.getItem('doto-tags-migrated')) {
  const hasOldTags = notes.value.some(
    (n) => n.tags?.includes('work') || n.tags?.includes('personal'),
  )
  if (hasOldTags) {
    const { addTag, tags: existingTags } = useTagStore()
    // Create default tags if they don't already exist
    let workTag = existingTags.value.find((t) => t.name === 'Work')
    if (!workTag) workTag = addTag('Work', 'green')
    let personalTag = existingTags.value.find((t) => t.name === 'Personal')
    if (!personalTag) personalTag = addTag('Personal', 'peach')

    for (const note of notes.value) {
      if (note.tags?.includes('work')) {
        note.tags = [workTag.id]
      } else if (note.tags?.includes('personal')) {
        note.tags = [personalTag.id]
      }
    }
    saveToStorage(notes.value)
  }
  localStorage.setItem('doto-tags-migrated', '1')
}

watch(notes, (newNotes) => saveToStorage(newNotes), { deep: true })

export function useTodoList() {
  function addTaskNote(name: string, date?: string) {
    notes.value.push({
      type: 'task',
      id: nextNoteId++,
      name,
      todos: [],
      createdAt: toLocalISOString(),
      currentDate: date ?? toLocalDateString(),
      autoAdvance: true,
    })
  }

  function addTextNote(name: string, date?: string) {
    notes.value.push({
      type: 'text',
      id: nextNoteId++,
      name,
      content: '',
      createdAt: toLocalISOString(),
      currentDate: date ?? toLocalDateString(),
      autoAdvance: true,
    })
  }

  function renameNote(noteId: number, name: string) {
    const note = notes.value.find((n) => n.id === noteId)
    if (note) {
      note.name = name
    }
  }

  function removeNote(noteId: number) {
    // toast.confirm('Delete this item?', [
    //   { label: 'Cancel', handler: () => {}, style: 'default' },
    //   { label: 'Delete', handler: () => [], style: 'danger' },
    // ])

    const index = notes.value.findIndex((n) => n.id === noteId)
    if (index !== -1) {
      notes.value.splice(index, 1)
    }
  }

  function moveNote(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return
    if (fromIndex < 0 || fromIndex >= notes.value.length) return
    if (toIndex < 0 || toIndex >= notes.value.length) return
    const removed = notes.value[fromIndex]!
    notes.value.splice(fromIndex, 1)
    notes.value.splice(toIndex, 0, removed)
  }

  function moveNoteById(fromNoteId: number, toNoteId: number) {
    if (fromNoteId === toNoteId) return

    const fromIndex = notes.value.findIndex((n) => n.id === fromNoteId)
    const toIndex = notes.value.findIndex((n) => n.id === toNoteId)

    if (fromIndex === -1 || toIndex === -1) return

    const removed = notes.value[fromIndex]!
    notes.value.splice(fromIndex, 1)
    notes.value.splice(toIndex, 0, removed)
  }

  function updateTextContent(noteId: number, content: string) {
    const note = notes.value.find((n) => n.id === noteId)
    if (note && note.type === 'text') {
      note.content = content
    }
  }

  function addTodo(noteId: number, title: string) {
    const note = notes.value.find((n) => n.id === noteId)
    if (note && note.type === 'task') {
      note.todos.push({
        id: nextTodoId++,
        title,
        status: 'incomplete',
        createdAt: toLocalISOString(),
      })
    }
  }

  function removeTodo(noteId: number, todoId: number) {
    const note = notes.value.find((n) => n.id === noteId)
    if (note && note.type === 'task') {
      const index = note.todos.findIndex((todo) => todo.id === todoId)
      if (index !== -1) {
        note.todos.splice(index, 1)
      }
    }
  }

  function toggleTodo(noteId: number, todoId: number) {
    const note = notes.value.find((n) => n.id === noteId)
    if (note && note.type === 'task') {
      const todo = note.todos.find((t) => t.id === todoId)
      if (todo) {
        // Cycle through states: incomplete → in-progress → completed → incomplete
        const nextStatus: Record<TodoStatus, TodoStatus> = {
          'incomplete': 'in-progress',
          'in-progress': 'completed',
          'completed': 'incomplete',
        }
        todo.status = nextStatus[todo.status]
        todo.completedAt = todo.status === 'completed' ? toLocalISOString() : undefined
      }
    }
  }

  function renameTodo(noteId: number, todoId: number, title: string) {
    const note = notes.value.find((n) => n.id === noteId)
    if (note && note.type === 'task') {
      const todo = note.todos.find((t) => t.id === todoId)
      if (todo) {
        todo.title = title
      }
    }
  }

  function moveTodo(noteId: number, fromIndex: number, toIndex: number) {
    const note = notes.value.find((n) => n.id === noteId)
    if (note && note.type === 'task') {
      if (fromIndex === toIndex) return
      if (fromIndex < 0 || fromIndex >= note.todos.length) return
      if (toIndex < 0 || toIndex >= note.todos.length) return
      const removed = note.todos[fromIndex]!
      note.todos.splice(fromIndex, 1)
      note.todos.splice(toIndex, 0, removed)
    }
  }

  function moveTodoBetweenNotes(
    fromNoteId: number,
    toNoteId: number,
    fromTodoIndex: number,
    toTodoIndex: number,
  ) {
    const fromNote = notes.value.find((n) => n.id === fromNoteId)
    const toNote = notes.value.find((n) => n.id === toNoteId)
    if (fromNote?.type !== 'task' || toNote?.type !== 'task') return
    if (fromTodoIndex < 0 || fromTodoIndex >= fromNote.todos.length) return

    const todoToMove = fromNote.todos[fromTodoIndex]
    if (!todoToMove) return

    // Remove from source note
    fromNote.todos.splice(fromTodoIndex, 1)

    // Insert into target note
    const insertIndex = Math.min(toTodoIndex, toNote.todos.length)
    toNote.todos.splice(insertIndex, 0, todoToMove)
  }

  function updateNoteDate(noteId: number, date: string) {
    const note = notes.value.find((n) => n.id === noteId)
    if (note) {
      note.currentDate = date
    }
  }

  function updateNoteTag(noteId: number, tagId: string | null) {
    const note = notes.value.find((n) => n.id === noteId)
    if (note) {
      if (tagId === null) {
        note.tags = []
      } else {
        note.tags = [tagId]
      }
    }
  }

  function removeTagFromAllNotes(tagId: string) {
    for (const note of notes.value) {
      if (note.tags?.includes(tagId)) {
        note.tags = note.tags.filter((t) => t !== tagId)
      }
    }
  }

  function toggleAutoAdvance(noteId: number) {
    const note = notes.value.find((n) => n.id === noteId)
    if (note) {
      note.autoAdvance = !note.autoAdvance
    }
  }

  function duplicateTaskNote(noteId: number, targetDate: string) {
    const sourceNote = notes.value.find((n) => n.id === noteId)
    if (!sourceNote || sourceNote.type !== 'task') return

    // Archive the original note
    sourceNote.archived = true
    sourceNote.autoAdvance = false

    const incompleteTodos = sourceNote.todos
      .filter((t) => t.status !== 'completed')
      .map((t) => ({
        id: nextTodoId++,
        title: t.title,
        status: t.status,
        createdAt: toLocalISOString(),
      }))

    notes.value.push({
      type: 'task',
      id: nextNoteId++,
      name: sourceNote.name,
      currentDate: targetDate,
      createdAt: toLocalISOString(),
      tags: sourceNote.tags ? [...sourceNote.tags] : undefined,
      autoAdvance: true,
      todos: incompleteTodos,
    })
  }

  function moveTodoToDate(fromNoteId: number, todoIndex: number, targetDate: string): void {
    const fromNote = notes.value.find((n) => n.id === fromNoteId)
    if (fromNote?.type !== 'task') return
    if (todoIndex < 0 || todoIndex >= fromNote.todos.length) return

    const todoToMove = fromNote.todos[todoIndex]
    if (!todoToMove) return

    // Find first TaskNote on target date
    let targetNote = notes.value.find((n) => n.type === 'task' && n.currentDate === targetDate)

    // If no TaskNote exists, create one with default name (the date)
    if (!targetNote) {
      const newNote: TaskNote = {
        type: 'task',
        id: nextNoteId++,
        name: targetDate,
        todos: [],
        createdAt: toLocalISOString(),
        currentDate: targetDate,
        autoAdvance: true,
      }
      notes.value.push(newNote)
      targetNote = newNote
    }

    // Remove from source
    fromNote.todos.splice(todoIndex, 1)

    // Add to target (at the end)
    if (targetNote.type === 'task') {
      targetNote.todos.push(todoToMove)
    }
  }

  function replaceAllNotes(newNotes: NoteType[]) {
    notes.value.splice(0, notes.value.length)
    notes.value.push(...newNotes)

    // Recalculate next IDs from imported data
    const ids = getNextId(newNotes)
    nextNoteId = ids.noteId
    nextTodoId = ids.todoId
  }

  return {
    notes,
    addTaskNote,
    addTextNote,
    renameNote,
    removeNote,
    moveNote,
    moveNoteById,
    updateTextContent,
    updateNoteDate,
    updateNoteTag,
    removeTagFromAllNotes,
    toggleAutoAdvance,
    addTodo,
    removeTodo,
    toggleTodo,
    renameTodo,
    moveTodo,
    moveTodoBetweenNotes,
    duplicateTaskNote,
    moveTodoToDate,
    replaceAllNotes,
  }
}
