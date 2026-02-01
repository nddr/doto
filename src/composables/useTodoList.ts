import { ref, watch } from 'vue'

import { toLocalDateString, toLocalISOString } from '@/utils/date'

export interface Note {
  id: number
  name: string
  createdAt?: string
  currentDate?: string
  tags?: string[]
  autoAdvance?: boolean
}

export interface TaskNote extends Note {
  type: 'todo'
  todos: Todo[]
}

export interface TextNote extends Note {
  type: 'text'
  content: string
}

export interface Todo {
  id: number
  title: string
  completed: boolean
  completedAt?: string
  createdAt?: string
}

export type NoteType = TaskNote | TextNote

const STORAGE_KEY = 'oe-notes'

function loadFromStorage(): NoteType[] {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return []
    }
  }
  return [
    {
      type: 'todo',
      id: 1,
      name: 'My Tasks',
      todos: [{ id: 1, title: 'Make your bed', completed: false }],
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
    if (note.type === 'todo') {
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
      if (note.type === 'todo') {
        // Only advance if there are incomplete todos
        const hasIncompleteTodos = note.todos.some((todo) => !todo.completed)
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

watch(notes, (newNotes) => saveToStorage(newNotes), { deep: true })

export function useTodoList() {
  function addTaskNote(name: string, date?: string) {
    notes.value.push({
      type: 'todo',
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

  function updateTextContent(noteId: number, content: string) {
    const note = notes.value.find((n) => n.id === noteId)
    if (note && note.type === 'text') {
      note.content = content
    }
  }

  function addTodo(noteId: number, title: string) {
    const note = notes.value.find((n) => n.id === noteId)
    if (note && note.type === 'todo') {
      note.todos.push({
        id: nextTodoId++,
        title,
        completed: false,
        createdAt: toLocalISOString(),
      })
    }
  }

  function removeTodo(noteId: number, todoId: number) {
    const note = notes.value.find((n) => n.id === noteId)
    if (note && note.type === 'todo') {
      const index = note.todos.findIndex((todo) => todo.id === todoId)
      if (index !== -1) {
        note.todos.splice(index, 1)
      }
    }
  }

  function toggleTodo(noteId: number, todoId: number) {
    const note = notes.value.find((n) => n.id === noteId)
    if (note && note.type === 'todo') {
      const todo = note.todos.find((t) => t.id === todoId)
      if (todo) {
        todo.completed = !todo.completed
        todo.completedAt = todo.completed ? toLocalISOString() : undefined
      }
    }
  }

  function renameTodo(noteId: number, todoId: number, title: string) {
    const note = notes.value.find((n) => n.id === noteId)
    if (note && note.type === 'todo') {
      const todo = note.todos.find((t) => t.id === todoId)
      if (todo) {
        todo.title = title
      }
    }
  }

  function moveTodo(noteId: number, fromIndex: number, toIndex: number) {
    const note = notes.value.find((n) => n.id === noteId)
    if (note && note.type === 'todo') {
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
    if (fromNote?.type !== 'todo' || toNote?.type !== 'todo') return
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

  function updateNoteTag(noteId: number, tag: 'work' | 'personal' | null) {
    const note = notes.value.find((n) => n.id === noteId)
    if (note) {
      if (tag === null) {
        note.tags = []
      } else {
        note.tags = [tag]
      }
    }
  }

  function toggleAutoAdvance(noteId: number) {
    const note = notes.value.find((n) => n.id === noteId)
    if (note) {
      note.autoAdvance = !note.autoAdvance
    }
  }

  return {
    notes,
    addTaskNote,
    addTextNote,
    renameNote,
    removeNote,
    moveNote,
    updateTextContent,
    updateNoteDate,
    updateNoteTag,
    toggleAutoAdvance,
    addTodo,
    removeTodo,
    toggleTodo,
    renameTodo,
    moveTodo,
    moveTodoBetweenNotes,
  }
}
