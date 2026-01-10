<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import { useTodoList } from '@/composables/useTodoList'

const { todos, addTodo, removeTodo, toggleTodo } = useTodoList()

const textarea = useTemplateRef<HTMLTextAreaElement>('textarea')

const modalOpen = ref(false)
const selectedNote = ref<Record<string, any> | null>(null)

function handleSave() {
  if (!textarea.value?.value.trim()) return

  addTodo(textarea.value.value.trim())
  textarea.value.value = ''
}

function closeModal() {
  modalOpen.value = false
}
</script>

<template>
  <header class="fixed top-0 left-0 w-full h-12 py-8 px-12 text-black z-10">
    <h1 class="text-3xl">todoi</h1>
  </header>

  <main class="relative w-screen h-screen bg-amber-50">
    <div ref="todoList" class="absolute top-24 left-1/2 -translate-x-1/2 space-y-2">
      <div v-for="todo in todos" :key="todo.id"
        class="group flex items-center gap-4 p-2 rounded-lg hover:bg-amber-100/50 transition-colors">
        <button class="relative w-7 h-7 border-[3px] border-amber-950 rounded-md shrink-0 cursor-pointer bg-white"
          @click="toggleTodo(todo.id)">
          <svg class="absolute inset-0 w-full h-full p-0.5 transition-all duration-300 ease-out"
            :class="todo.completed ? 'opacity-100 scale-100' : 'opacity-0 scale-50'" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 12.5L9 17.5L20 6.5" class="check-path" :class="{ 'animate-check': todo.completed }" />
          </svg>
        </button>

        <span class="text-4xl transition-all duration-300 cursor-pointer"
          :class="todo.completed ? 'line-through text-gray-400' : 'text-amber-950'"
          @click="toggleTodo(todo.id)">
          {{ todo.title }}
        </span>

        <button
          class="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-red-500 hover:text-red-700 cursor-pointer px-2 py-1"
          @click="removeTodo(todo.id)">
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 6l12 12M6 18L18 6" stroke-linecap="round" />
          </svg>
        </button>
      </div>

      <div class="p-2">
        <textarea @keydown.enter.exact.prevent="handleSave" ref="textarea" placeholder="Add a todo..."
          class="w-full ml-10 text-2xl outline-none resize-none overflow-hidden field-sizing-content bg-transparent"></textarea>
      </div>
    </div>
  </main>

  <!-- Note Modal with light-dismiss -->
  <Teleport to="body">
    <div v-if="modalOpen" class="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
      @click.self="closeModal">
      <div class="bg-white rounded-xl shadow-lg p-6 w-96 min-h-48 max-w-[90vw]">
        <p class="text-lg">{{ selectedNote?.text }}</p>
        <button @click="closeModal" class="mt-4 bg-amber-200 px-3 py-1 rounded cursor-pointer">Save</button>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.check-path {
  stroke-dasharray: 30;
  stroke-dashoffset: 30;
  transition: stroke-dashoffset 0.3s ease-out;
}

.animate-check {
  stroke-dashoffset: 0;
}
</style>