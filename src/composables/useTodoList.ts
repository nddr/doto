import { ref, watch } from 'vue'

export interface Todo {
  id: number
  title: string
  completed: boolean
}

export interface TodoNote {
  type: 'todo'
  id: number
  name: string
  todos: Todo[]
}

export interface TextNote {
  type: 'text'
  id: number
  name: string
  content: string
}

export type Note = TodoNote | TextNote

const STORAGE_KEY = 'oe-notes'

function loadFromStorage(): Note[] {
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

function saveToStorage(data: Note[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function getNextId(notes: Note[]): { noteId: number; todoId: number } {
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

const notes = ref<Note[]>(loadFromStorage())

const initialIds = getNextId(notes.value)
let nextNoteId = initialIds.noteId
let nextTodoId = initialIds.todoId

watch(notes, (newNotes) => saveToStorage(newNotes), { deep: true })

export function useTodoList() {
  function addTodoNote(name: string) {
    notes.value.push({
      type: 'todo',
      id: nextNoteId++,
      name,
      todos: [],
    })
  }

  function addTextNote(name: string) {
    notes.value.push({
      type: 'text',
      id: nextNoteId++,
      name,
      content: '',
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
      }
    }
  }

  return {
    notes,
    addTodoNote,
    addTextNote,
    renameNote,
    removeNote,
    moveNote,
    updateTextContent,
    addTodo,
    removeTodo,
    toggleTodo,
  }
}
