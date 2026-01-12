<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { useTodoList } from '@/composables/useTodoList'
import { useTheme, type ThemeName } from '@/composables/useTheme'

const { groups, addGroup, renameGroup, moveGroup, addTodo, removeTodo, toggleTodo } = useTodoList()
const { theme, themeName, themeNames, themes, setTheme } = useTheme()

const themeMenuOpen = ref(false)

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
  <main class="w-screen min-h-screen p-6 font-mono transition-colors duration-200"
    :style="{ backgroundColor: theme.base }">
    <!-- Theme Switcher -->
    <div class="fixed top-4 right-4 z-10">
      <div class="relative">
        <button class="px-3 py-1 border cursor-pointer transition-colors" :style="{
          borderColor: theme.surface1,
          backgroundColor: theme.surface0,
          color: theme.text,
        }" @click="themeMenuOpen = !themeMenuOpen">
          [ {{ theme.name }} ]
        </button>
        <div v-if="themeMenuOpen" class="absolute right-0 mt-1 border" :style="{
          borderColor: theme.surface1,
          backgroundColor: theme.surface0,
        }">
          <button v-for="name in themeNames" :key="name"
            class="block w-full px-3 py-1 text-left cursor-pointer transition-colors" :style="{
              color: themeName === name ? theme.lavender : theme.text,
              backgroundColor: themeName === name ? theme.surface1 : 'transparent',
            }" @click="setTheme(name as ThemeName); themeMenuOpen = false"
            @mouseenter="($event.target as HTMLElement).style.backgroundColor = theme.surface1"
            @mouseleave="($event.target as HTMLElement).style.backgroundColor = themeName === name ? theme.surface1 : 'transparent'">
            {{ themeName === name ? '> ' : ' ' }}{{ themes[name].name }}
          </button>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
      <!-- Group Cards -->
      <div v-for="(group, index) in groups" :key="group.id"
        class="flex-1 min-w-[calc(25%-12px)] max-w-full border p-4 transition-colors" :style="{
          borderColor: dragOverIndex === index ? theme.lavender : theme.surface1,
          backgroundColor: theme.surface0,
          opacity: draggedIndex === index ? 0.5 : 1,
        }" draggable="true" @dragstart="handleDragStart(index)" @dragend="handleDragEnd" @dragover="handleDragOver"
        @dragenter="handleDragEnter(index)" @dragleave="handleDragLeave" @drop="handleDrop(index)">
        <!-- Group Name -->
        <div class="mb-2">
          <input v-if="editingGroupId === group.id" v-model="editingName" :data-group-input="group.id"
            class="w-full bg-transparent outline-none border-b"
            :style="{ color: theme.lavender, borderColor: theme.lavender }" @blur="saveGroupName(group.id)"
            @keydown.enter="saveGroupName(group.id)" @keydown.escape="editingGroupId = null" />
          <span v-else class="cursor-pointer" :style="{ color: theme.lavender }"
            @click="startEditingGroup(group.id, group.name)">
            > {{ group.name }}_
          </span>
        </div>

        <!-- Separator -->
        <div class="border-b mb-3" :style="{ borderColor: theme.surface1 }"></div>

        <!-- Todos -->
        <div class="space-y-1">
          <div v-for="todo in group.todos" :key="todo.id"
            class="group flex items-center gap-2 px-1 -mx-1 transition-colors" :style="{ '--hover-bg': theme.surface1 }"
            @mouseenter="($event.currentTarget as HTMLElement).style.backgroundColor = theme.surface1"
            @mouseleave="($event.currentTarget as HTMLElement).style.backgroundColor = 'transparent'">
            <span class="cursor-pointer select-none" :style="{ color: todo.completed ? theme.surface2 : theme.green }"
              @click="toggleTodo(group.id, todo.id)">
              [{{ todo.completed ? 'x' : ' ' }}]
            </span>
            <span class="flex-1 cursor-pointer" :class="{ 'line-through': todo.completed }"
              :style="{ color: todo.completed ? theme.surface2 : theme.text }" @click="toggleTodo(group.id, todo.id)">
              {{ todo.title }}
            </span>
            <button class="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              :style="{ color: theme.overlay0 }" @click="removeTodo(group.id, todo.id)"
              @mouseenter="($event.target as HTMLElement).style.color = theme.red"
              @mouseleave="($event.target as HTMLElement).style.color = theme.overlay0">
              [x]
            </button>
          </div>
        </div>

        <!-- Add Todo Input -->
        <div class="mt-3">
          <input type="text" placeholder="> Add todo..." class="w-full bg-transparent outline-none text-sm"
            :style="{ color: theme.overlay0 }" @keydown.enter="handleAddTodo(group.id, $event)"
            @focus="($event.target as HTMLElement).style.color = theme.text"
            @blur="($event.target as HTMLElement).style.color = theme.overlay0" />
        </div>
      </div>

      <!-- Add Group Card -->
      <div
        class="flex-1 min-w-[calc(25%-12px)] max-w-full border border-dashed p-4 flex items-center justify-center cursor-pointer transition-colors"
        :style="{ borderColor: theme.surface1, color: theme.overlay0 }" @click="handleAddGroup"
        @mouseenter="($event.currentTarget as HTMLElement).style.borderColor = theme.lavender; ($event.currentTarget as HTMLElement).style.color = theme.lavender"
        @mouseleave="($event.currentTarget as HTMLElement).style.borderColor = theme.surface1; ($event.currentTarget as HTMLElement).style.color = theme.overlay0">
        + New Group
      </div>
    </div>
  </main>
</template>
