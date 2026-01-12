import { ref } from 'vue'

export interface Todo {
  id: number
  title: string
  completed: boolean
}

export interface TodoGroup {
  id: number
  name: string
  todos: Todo[]
}

const groups = ref<TodoGroup[]>([
  {
    id: 1,
    name: 'My Tasks',
    todos: [{ id: 1, title: 'Welcome to Todoi', completed: false }],
  },
])

let nextGroupId = 2
let nextTodoId = 2

export function useTodoList() {
  function addGroup(name: string) {
    groups.value.push({
      id: nextGroupId++,
      name,
      todos: [],
    })
  }

  function renameGroup(groupId: number, name: string) {
    const group = groups.value.find((g) => g.id === groupId)
    if (group) {
      group.name = name
    }
  }

  function moveGroup(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return
    if (fromIndex < 0 || fromIndex >= groups.value.length) return
    if (toIndex < 0 || toIndex >= groups.value.length) return
    const removed = groups.value[fromIndex]!
    groups.value.splice(fromIndex, 1)
    groups.value.splice(toIndex, 0, removed)
  }

  function addTodo(groupId: number, title: string) {
    const group = groups.value.find((g) => g.id === groupId)
    if (group) {
      group.todos.push({
        id: nextTodoId++,
        title,
        completed: false,
      })
    }
  }

  function removeTodo(groupId: number, todoId: number) {
    const group = groups.value.find((g) => g.id === groupId)
    if (group) {
      const index = group.todos.findIndex((todo) => todo.id === todoId)
      if (index !== -1) {
        group.todos.splice(index, 1)
      }
    }
  }

  function toggleTodo(groupId: number, todoId: number) {
    const group = groups.value.find((g) => g.id === groupId)
    if (group) {
      const todo = group.todos.find((t) => t.id === todoId)
      if (todo) {
        todo.completed = !todo.completed
      }
    }
  }

  return {
    groups,
    addGroup,
    renameGroup,
    moveGroup,
    addTodo,
    removeTodo,
    toggleTodo,
  }
}
