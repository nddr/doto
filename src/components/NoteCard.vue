<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { useTheme } from '@/composables/useTheme'
import { useToast } from '@/composables/useToast'
import type { NoteType } from '@/composables/useTodoList'
import { exportNoteAsFile, copyNoteToClipboard } from '@/utils/export'

const props = defineProps<{
  note: NoteType
  index: number
  isDragging: boolean
  isDragOver: boolean
  isOld: boolean
  showCreatedAt: boolean
  draggedTodo: { noteId: number; todoIndex: number } | null
  dragOverTodoIndex: number | null
  dragOverNoteId: number | null
}>()

const emit = defineEmits<{
  'rename-note': [noteId: number, name: string]
  'rename-todo': [noteId: number, todoId: number, title: string]
  'cycle-tag': [noteId: number, tags: string[] | undefined]
  'remove-note': [noteId: number]
  'toggle-todo': [noteId: number, todoId: number]
  'add-todo': [noteId: number, title: string]
  'remove-todo': [noteId: number, todoId: number]
  'update-text-content': [noteId: number, content: string]
  'drag-start': [index: number]
  'drag-end': []
  'drag-enter': [index: number]
  'drag-leave': []
  'drop': [index: number]
  'todo-drag-start': [noteId: number, todoIndex: number, event: DragEvent]
  'todo-drag-end': []
  'todo-drag-enter': [noteId: number, todoIndex: number]
  'todo-drag-leave': []
  'todo-drop': [noteId: number, toIndex: number, event: DragEvent]
}>()

const { theme } = useTheme()
const toast = useToast()

// Local editing state
const isEditingName = ref(false)
const editingName = ref('')
const editingTodoId = ref<number | null>(null)
const editingTodoTitle = ref('')

function getNoteTagBadge(note: NoteType): string {
  if (note.tags?.includes('work')) return 'W'
  if (note.tags?.includes('personal')) return 'P'
  return '*'
}

function handleDragOver(event: DragEvent) {
  event.preventDefault()
}

function handleAddTodo(noteId: number, event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.value.trim()) return
  emit('add-todo', noteId, input.value.trim())
  input.value = ''
}

// Note name editing
function startEditingNote() {
  isEditingName.value = true
  editingName.value = props.note.name
  nextTick(() => {
    const input = document.querySelector(`[data-note-input="${props.note.id}"]`) as HTMLInputElement
    input?.focus()
    input?.select()
  })
}

function saveNoteName() {
  if (editingName.value.trim()) {
    emit('rename-note', props.note.id, editingName.value.trim())
  }
  isEditingName.value = false
  editingName.value = ''
}

function cancelEditingNote() {
  isEditingName.value = false
  editingName.value = ''
}

// Todo title editing
function startEditingTodo(todoId: number, currentTitle: string) {
  editingTodoId.value = todoId
  editingTodoTitle.value = currentTitle
  nextTick(() => {
    const input = document.querySelector(`[data-todo-input="${props.note.id}-${todoId}"]`) as HTMLInputElement
    input?.focus()
    input?.select()
  })
}

function saveTodoTitle(todoId: number) {
  if (editingTodoTitle.value.trim()) {
    emit('rename-todo', props.note.id, todoId, editingTodoTitle.value.trim())
  }
  editingTodoId.value = null
  editingTodoTitle.value = ''
}

function cancelEditingTodo() {
  editingTodoId.value = null
  editingTodoTitle.value = ''
}

// Export functions
function handleCopyAsMarkdown() {
  copyNoteToClipboard(props.note).then((success) => {
    if (success) {
      toast.success('Copied to clipboard')
    } else {
      toast.error('Failed to copy')
    }
  })
  document.getElementById(`note-menu-${props.note.id}`)?.hidePopover()
}

function handleExportAsMarkdown() {
  exportNoteAsFile(props.note)
  document.getElementById(`note-menu-${props.note.id}`)?.hidePopover()
}

// Expose startEditingNote so parent can trigger it for new notes
defineExpose({
  startEditingNote,
})
</script>

<template>
  <div
    class="relative flex-1 min-w-[calc(25%-12px)] max-w-full border pt-8 transition-colors flex"
    :style="{
      borderColor: isDragging ? 'white' : (isDragOver ? theme.lavender : theme.surface1),
      backgroundColor: theme.surface0,
      opacity: isDragging ? 0.5 : (isOld ? 0.5 : 1),
    }"
    @dragover="handleDragOver"
    @dragenter="emit('drag-enter', index)"
    @dragleave="emit('drag-leave')"
    @drop="emit('drop', index)"
  >
    <!-- Drag Handle -->
    <div
      class="absolute top-2 left-[calc(50%-12px)] flex justify-center py-1 px-4 cursor-grab"
      draggable="true"
      @dragstart="emit('drag-start', index)"
      @dragend="emit('drag-end')"
    >
      <div class="flex flex-col gap-1">
        <div
          class="w-10 h-0.5 rounded"
          :style="{ backgroundColor: theme.overlay0 }"
        ></div>
        <div
          class="w-10 h-0.5 rounded"
          :style="{ backgroundColor: theme.overlay0 }"
        ></div>
      </div>
    </div>

    <!-- Menu Button -->
    <button
      class="absolute top-3 right-4 flex items-center justify-center w-6 h-6 text-2xl cursor-pointer transition-colors"
      :style="{ color: theme.overlay0 }"
      :popovertarget="`note-menu-${note.id}`"
      :aria-label="`Menu for ${note.name}`"
      @click="($event.target as HTMLElement).style.setProperty('anchor-name', '--note-menu')"
      @mouseenter="($event.target as HTMLElement).style.color = theme.lavender"
      @mouseleave="($event.target as HTMLElement).style.color = theme.overlay0"
    >
      ⋮
    </button>

    <!-- Dropdown Menu -->
    <div
      :id="`note-menu-${note.id}`"
      popover
      class="note-menu-popover min-w-48 border shadow-lg"
      :style="{
        backgroundColor: theme.surface1,
        borderColor: theme.surface2,
      }"
    >
      <!-- Copy as Markdown -->
      <div
        class="flex items-center px-4 py-2 cursor-pointer transition-colors"
        @mouseenter="($event.currentTarget as HTMLElement).style.backgroundColor = theme.surface2"
        @mouseleave="($event.currentTarget as HTMLElement).style.backgroundColor = 'transparent'"
        @click="handleCopyAsMarkdown"
      >
        <span :style="{ color: theme.text }">Copy as Markdown</span>
      </div>
      <!-- Export as Markdown -->
      <div
        class="flex items-center px-4 py-2 cursor-pointer transition-colors"
        @mouseenter="($event.currentTarget as HTMLElement).style.backgroundColor = theme.surface2"
        @mouseleave="($event.currentTarget as HTMLElement).style.backgroundColor = 'transparent'"
        @click="handleExportAsMarkdown"
      >
        <span :style="{ color: theme.text }">Export to Markdown</span>
      </div>
      <!-- Separator -->
      <div
        class="border-b mx-2 my-1"
        :style="{ borderColor: theme.surface2 }"
      ></div>
      <!-- Delete -->
      <div
        class="flex items-center px-4 py-2 cursor-pointer transition-colors"
        @mouseenter="($event.currentTarget as HTMLElement).style.backgroundColor = theme.surface2"
        @mouseleave="($event.currentTarget as HTMLElement).style.backgroundColor = 'transparent'"
        @click="emit('remove-note', note.id)"
      >
        <span :style="{ color: theme.red }">Delete</span>
      </div>
    </div>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col px-6 pb-6">
      <!-- Note Name -->
      <div class="flex items-center mb-3">
        <input
          v-if="isEditingName"
          v-model="editingName"
          :data-note-input="note.id"
          class="w-full bg-transparent outline-none border-b"
          :style="{ color: theme.lavender, borderColor: theme.lavender }"
          :aria-label="`Edit name for ${note.name}`"
          @blur="saveNoteName"
          @keydown.enter="saveNoteName"
          @keydown.escape="cancelEditingNote"
        />
        <span
          v-else
          class="flex items-center cursor-text"
          :style="{ color: theme.lavender }"
          tabindex="0"
          role="button"
          :aria-label="`Edit ${note.name}`"
          @click="startEditingNote"
          @keydown.enter="startEditingNote"
          @keydown.space.prevent="startEditingNote"
        >
          <button
            class="w-8 h-8 mr-4 text-md flex items-center justify-center cursor-pointer border transition-colors"
            :style="{
              backgroundColor: theme.surface1,
              borderColor: note.tags?.includes('work') ? theme.green : (note.tags?.includes('personal') ? theme.peach : theme.surface2),
              color: note.tags?.includes('work') ? theme.green : (note.tags?.includes('personal') ? theme.peach : theme.overlay0),
            }"
            :title="`Tag: ${note.tags?.[0] || 'none'} (click to change)`"
            @click.stop="emit('cycle-tag', note.id, note.tags)"
          >
            {{ getNoteTagBadge(note) }}
          </button>

          {{ note.name }}
        </span>
      </div>

      <!-- Separator -->
      <div
        class="border-b mb-3"
        :style="{ borderColor: theme.surface1 }"
      ></div>

      <!-- Todo List Content -->
      <template v-if="note.type === 'task'">
        <div class="space-y-1">
          <div
            v-for="(todo, todoIndex) in note.todos"
            :key="todo.id"
            class="group flex items-start gap-2 px-1 -mx-1 transition-colors"
            :style="{
              '--hover-bg': theme.surface1,
              opacity: draggedTodo?.noteId === note.id && draggedTodo?.todoIndex === todoIndex ? 0.5 : 1,
              borderTop: dragOverTodoIndex === todoIndex && dragOverNoteId === note.id ? `2px solid ${theme.lavender}` : '2px solid transparent',
            }"
            @mouseenter="($event.currentTarget as HTMLElement).style.backgroundColor = theme.surface1"
            @mouseleave="($event.currentTarget as HTMLElement).style.backgroundColor = 'transparent'"
            @dragover="handleDragOver"
            @dragenter="emit('todo-drag-enter', note.id, todoIndex)"
            @dragleave="emit('todo-drag-leave')"
            @drop="emit('todo-drop', note.id, todoIndex, $event)"
          >
            <span
              class="cursor-grab select-none"
              :style="{ color: theme.overlay0 }"
              draggable="true"
              @dragstart="emit('todo-drag-start', note.id, todoIndex, $event)"
              @dragend="emit('todo-drag-end')"
            >
              ::
            </span>
            <span
              class="cursor-pointer select-none"
              :style="{ color: todo.completed ? theme.surface2 : theme.green }"
              @click="emit('toggle-todo', note.id, todo.id)"
            >
              [{{ todo.completed ? 'x' : ' ' }}]
            </span>
            <input
              v-if="editingTodoId === todo.id"
              v-model="editingTodoTitle"
              :data-todo-input="`${note.id}-${todo.id}`"
              class="flex-1 min-w-0 bg-transparent outline-none border-b"
              :style="{ color: theme.text, borderColor: theme.lavender }"
              :aria-label="`Edit todo: ${todo.title}`"
              @blur="saveTodoTitle(todo.id)"
              @keydown.enter="saveTodoTitle(todo.id)"
              @keydown.escape="cancelEditingTodo"
            />
            <span
              v-else
              class="flex-1 min-w-0 break-all cursor-text"
              :class="{ 'line-through': todo.completed }"
              :style="{ color: todo.completed ? theme.surface2 : theme.text }"
              @click="startEditingTodo(todo.id, todo.title)"
            >
              {{ todo.title }}
            </span>
            <button
              class="cursor-pointer md:hidden md:group-hover:block"
              :style="{ color: theme.overlay0 }"
              @click="emit('remove-todo', note.id, todo.id)"
              @mouseenter="($event.target as HTMLElement).style.color = theme.red"
              @mouseleave="($event.target as HTMLElement).style.color = theme.overlay0"
            >
              [x]
            </button>
          </div>

          <!-- Drop zone for end of list -->
          <div
            v-if="draggedTodo && draggedTodo.noteId !== note.id"
            class="h-8 transition-colors"
            :style="{
              borderTop: dragOverNoteId === note.id && dragOverTodoIndex === note.todos.length ? `2px solid ${theme.lavender}` : '2px solid transparent',
            }"
            @dragover="handleDragOver"
            @dragenter="emit('todo-drag-enter', note.id, note.todos.length)"
            @dragleave="emit('todo-drag-leave')"
            @drop="emit('todo-drop', note.id, note.todos.length, $event)"
          ></div>
        </div>

        <!-- Add Todo Input -->
        <div class="mt-3">
          <input
            type="text"
            placeholder="> Add todo..."
            class="w-full bg-transparent outline-none"
            :style="{ color: theme.overlay0 }"
            @keydown.enter="handleAddTodo(note.id, $event)"
            @focus="($event.target as HTMLElement).style.color = theme.text"
            @blur="handleAddTodo(note.id, $event); ($event.target as HTMLElement).style.color = theme.overlay0"
          />
        </div>
      </template>

      <!-- Text Note Content -->
      <div
        v-else
        class="flex-1 min-h-25 grid"
      >
        <textarea
          :value="note.content"
          @input="emit('update-text-content', note.id, ($event.target as HTMLTextAreaElement).value)"
          placeholder="Write your note..."
          class="w-full bg-transparent outline-none resize-none scrollbar-none [grid-area:1/1/2/2] field-sizing-content"
          :style="{
            color: theme.text,
            backgroundImage: 'repeating-linear-gradient(transparent, transparent 1.4em, rgba(255, 255, 255, 0.05) 1.4em, rgba(255, 255, 255, 0.05) calc(1.4em + 1px))',
            lineHeight: '1.4em',
          }"
        ></textarea>
      </div>

      <!-- Created Date -->
      <span
        v-if="showCreatedAt && note.createdAt"
        class="absolute bottom-2 right-4 text-xs"
        :style="{ color: theme.overlay0 }"
      >
        {{ note.createdAt.split('T')[0] }}
      </span>
    </div>
  </div>
</template>
