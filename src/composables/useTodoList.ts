import { ref } from 'vue'

export interface Todo {
  id: number
  title: string
  completed: boolean
}

const todos = ref<Todo[]>([
  { id: 1, title: 'Welcome to todoi', completed: false },
  { id: 2, title: 'Click anywhere to add a note', completed: false },
])

let nextId = 3

export function useTodoList() {
  function addTodo(title: string) {
    todos.value.push({
      id: nextId++,
      title,
      completed: false,
    })
  }

  function removeTodo(id: number) {
    const index = todos.value.findIndex((todo) => todo.id === id)
    if (index !== -1) {
      todos.value.splice(index, 1)
    }
  }

  function toggleTodo(id: number) {
    const todo = todos.value.find((todo) => todo.id === id)
    if (todo) {
      todo.completed = !todo.completed
    }
  }

  return {
    todos,
    addTodo,
    removeTodo,
    toggleTodo,
  }
}
