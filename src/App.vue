<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { useTodoList } from '@/composables/useTodoList'

const { groups, addGroup, renameGroup, moveGroup, addTodo, removeTodo, toggleTodo } = useTodoList()

const editingGroupId = ref<number | null>(null)
const editingName = ref('')
const draggedIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)

function startEditingGroup(groupId: number, currentName: string) {
  editingGroupId.value = groupId
  editingName.value = currentName
  nextTick(() => {
    const input = document.querySelector(`[data-group-input="${groupId}"]`) as HTMLInputElement
    input?.focus()
    input?.select()
  })
}

function saveGroupName(groupId: number) {
  if (editingName.value.trim()) {
    renameGroup(groupId, editingName.value.trim())
  }
  editingGroupId.value = null
  editingName.value = ''
}

function handleAddTodo(groupId: number, event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.value.trim()) return
  addTodo(groupId, input.value.trim())
  input.value = ''
}

function handleAddGroup() {
  addGroup('New Group')
  nextTick(() => {
    const newGroup = groups.value[groups.value.length - 1]
    if (newGroup) {
      startEditingGroup(newGroup.id, newGroup.name)
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
    moveGroup(draggedIndex.value, toIndex)
  }
  draggedIndex.value = null
  dragOverIndex.value = null
}
</script>

<template>
  <main class="w-screen min-h-screen bg-gray-950 p-6">
    <div class="flex flex-wrap gap-4">
      <!-- Group Cards -->
      <div v-for="(group, index) in groups" :key="group.id"
        class="flex-1 min-w-[calc(25%-12px)] max-w-full border border-gray-700 p-4 bg-gray-900 transition-colors"
        :class="{
          'opacity-50': draggedIndex === index,
          'border-green-400': dragOverIndex === index,
        }" draggable="true" @dragstart="handleDragStart(index)" @dragend="handleDragEnd" @dragover="handleDragOver"
        @dragenter="handleDragEnter(index)" @dragleave="handleDragLeave" @drop="handleDrop(index)">
        <!-- Group Name -->
        <div class="mb-2">
          <input v-if="editingGroupId === group.id" v-model="editingName" :data-group-input="group.id"
            class="w-full bg-transparent text-green-400 outline-none border-b border-green-400"
            @blur="saveGroupName(group.id)" @keydown.enter="saveGroupName(group.id)"
            @keydown.escape="editingGroupId = null" />
          <span v-else class="text-green-400 cursor-pointer hover:text-green-300"
            @click="startEditingGroup(group.id, group.name)">
            > {{ group.name }}_
          </span>
        </div>

        <!-- Separator -->
        <div class="border-b border-gray-700 mb-3"></div>

        <!-- Todos -->
        <div class="space-y-1">
          <div v-for="todo in group.todos" :key="todo.id"
            class="group flex items-center gap-2 hover:bg-gray-800 px-1 -mx-1">
            <span class="cursor-pointer select-none" :class="todo.completed ? 'text-gray-600' : 'text-green-400'"
              @click="toggleTodo(group.id, todo.id)">
              [{{ todo.completed ? 'x' : ' ' }}]
            </span>
            <span class="flex-1 cursor-pointer" :class="todo.completed ? 'text-gray-600 line-through' : 'text-gray-300'"
              @click="toggleTodo(group.id, todo.id)">
              {{ todo.title }}
            </span>
            <button
              class="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              @click="removeTodo(group.id, todo.id)">
              [x]
            </button>
          </div>
        </div>

        <!-- Add Todo Input -->
        <div class="mt-3">
          <input type="text" placeholder="> Add todo..."
            class="w-full bg-transparent text-gray-500 placeholder-gray-600 outline-none text-sm focus:text-green-400 focus:placeholder-gray-700"
            @keydown.enter="handleAddTodo(group.id, $event)" />
        </div>
      </div>

      <!-- Add Group Card -->
      <div
        class="flex-1 min-w-[calc(25%-12px)] max-w-full border border-dashed border-gray-700 p-4 flex items-center justify-center cursor-pointer hover:border-green-400 hover:text-green-400 text-gray-600 transition-colors"
        @click="handleAddGroup">
        + New Group
      </div>
    </div>
  </main>
</template>
