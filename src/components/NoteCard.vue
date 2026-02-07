<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useTheme, type CatppuccinTheme } from '@/composables/useTheme'
import { useToast } from '@/composables/useToast'
import { useTagStore } from '@/composables/useTagStore'
import type { NoteType } from '@/composables/useTodoList'
import { exportNoteAsFile, copyNoteToClipboard } from '@/utils/export'

const props = defineProps<{
  note: NoteType
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
  'update-tag': [noteId: number, tagId: string | null]
  'remove-note': [noteId: number]
  'toggle-todo': [noteId: number, todoId: number]
  'add-todo': [noteId: number, title: string]
  'remove-todo': [noteId: number, todoId: number]
  'update-text-content': [noteId: number, content: string]
  'drag-start': [noteId: number]
  'drag-end': []
  'drag-enter': [noteId: number]
  'drag-leave': []
  'drop': [noteId: number]
  'todo-drag-start': [noteId: number, todoIndex: number, event: DragEvent]
  'todo-drag-end': []
  'todo-drag-enter': [noteId: number, todoIndex: number]
  'todo-drag-leave': []
  'todo-drop': [noteId: number, toIndex: number, event: DragEvent]
}>()

const { theme } = useTheme()
const toast = useToast()
const { tags: allTags, getTag } = useTagStore()

// Local editing state
const isEditingName = ref(false)
const editingName = ref('')
const editingTodoId = ref<number | null>(null)
const editingTodoTitle = ref('')
const showTagDropdown = ref(false)

const noteTag = computed(() => {
  const tagId = props.note.tags?.[0]
  if (!tagId) return null
  return getTag(tagId) ?? null
})

// Track enter/leave balance to handle event bubbling
let dragEnterCount = 0

function handleDragOver(event: DragEvent) {
  event.preventDefault()
}

function handleDragEnter(event: DragEvent) {
  event.preventDefault()
  dragEnterCount++
  if (dragEnterCount === 1) {
    emit('drag-enter', props.note.id)
  }
}

function handleDragLeave() {
  dragEnterCount--
  if (dragEnterCount === 0) {
    emit('drag-leave')
  }
}

function handleDrop(event: DragEvent) {
  dragEnterCount = 0
  emit('drop', props.note.id)
}

function handleNoteDragStart() {
  dragEnterCount = 0
  emit('drag-start', props.note.id)
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

  // Focus the add task input for task notes
  if (props.note.type === 'task') {
    nextTick(() => {
      const input = document.querySelector(`[data-add-todo-input="${props.note.id}"]`) as HTMLInputElement
      input?.focus()
    })
  }
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
      borderColor: isDragging ? 'white' : (isDragOver ? theme.lavender : (noteTag ? theme[noteTag.color as keyof CatppuccinTheme] : theme.surface1)),
      backgroundColor: theme.surface0,
      opacity: isDragging ? 0.5 : (isOld ? 0.35 : 1),
      filter: isOld ? 'grayscale(0.6)' : 'none',
    }"
    @dragover="handleDragOver"
    @dragenter="handleDragEnter"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <!-- Drag Handle -->
    <div
      class="absolute top-2 left-[calc(50%-12px)] flex justify-center py-1 px-4 cursor-grab"
      draggable="true"
      @dragstart="handleNoteDragStart"
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
          <!-- Tag badge button -->
          <div class="relative mr-4">
            <!-- Backdrop for tag dropdown -->
            <div
              v-if="showTagDropdown"
              class="fixed inset-0 z-10"
              @click.stop="showTagDropdown = false"
            />
            <button
              class="h-8 px-2 text-sm flex items-center gap-1 border transition-colors cursor-pointer relative z-20"
              :style="{
                backgroundColor: theme.surface1,
                borderColor: noteTag ? theme[noteTag.color as keyof CatppuccinTheme] : theme.surface2,
                color: noteTag ? theme[noteTag.color as keyof CatppuccinTheme] : theme.overlay0,
              }"
              :title="`Tag: ${noteTag?.name || 'none'} (click to change)`"
              @click.stop="showTagDropdown = !showTagDropdown"
            >
              {{ noteTag ? noteTag.name : '+' }}
            </button>

            <!-- Tag dropdown -->
            <div
              v-if="showTagDropdown"
              class="absolute top-full left-0 mt-1 border min-w-36 z-20"
              :style="{
                borderColor: theme.surface1,
                backgroundColor: theme.surface0,
              }"
            >
              <!-- None option -->
              <button
                class="block w-full px-3 py-1 text-left text-sm cursor-pointer transition-colors whitespace-nowrap"
                :style="{
                  color: !noteTag ? theme.lavender : theme.text,
                  backgroundColor: !noteTag ? theme.surface1 : 'transparent',
                }"
                @click.stop="emit('update-tag', note.id, null); showTagDropdown = false"
                @mouseenter="($event.target as HTMLElement).style.backgroundColor = theme.surface1"
                @mouseleave="($event.target as HTMLElement).style.backgroundColor = !noteTag ? theme.surface1 : 'transparent'"
              >
                None
              </button>

              <!-- Tag options -->
              <button
                v-for="tag in allTags"
                :key="tag.id"
                class="flex items-center gap-2 w-full px-3 py-1 text-left text-sm cursor-pointer transition-colors whitespace-nowrap"
                :style="{
                  color: noteTag?.id === tag.id ? theme.lavender : theme.text,
                  backgroundColor: noteTag?.id === tag.id ? theme.surface1 : 'transparent',
                }"
                @click.stop="emit('update-tag', note.id, tag.id); showTagDropdown = false"
                @mouseenter="($event.target as HTMLElement).style.backgroundColor = theme.surface1"
                @mouseleave="($event.target as HTMLElement).style.backgroundColor = noteTag?.id === tag.id ? theme.surface1 : 'transparent'"
              >
                <span
                  class="w-3 h-3 rounded-full shrink-0"
                  :style="{ backgroundColor: theme[tag.color as keyof CatppuccinTheme] }"
                ></span>
                {{ tag.name }}
              </button>
            </div>
          </div>

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
            class="relative group flex items-center gap-2 px-1 -mx-1 transition-colors"
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
            <svg
              class="select-none cursor-pointer shrink-0"
              width="18"
              height="18"
              viewBox="0 0 18 18"
              @click="emit('toggle-todo', note.id, todo.id)"
            >
              <!-- Incomplete: empty circle -->
              <circle
                v-if="todo.status === 'incomplete'"
                cx="9" cy="9" r="7"
                fill="none"
                :stroke="theme.text"
                stroke-width="2"
              />
              <!-- In Progress: half-filled circle -->
              <template v-else-if="todo.status === 'in-progress'">
                <defs>
                  <clipPath :id="`half-clip-${todo.id}`">
                    <rect x="0" y="0" width="9" height="18" />
                  </clipPath>
                </defs>
                <circle cx="9" cy="9" r="7" fill="none" :stroke="theme.blue" stroke-width="2" />
                <circle cx="9" cy="9" r="7" :fill="theme.blue" :clip-path="`url(#half-clip-${todo.id})`" />
              </template>
              <!-- Completed: filled circle -->
              <circle
                v-else
                cx="9" cy="9" r="8"
                :fill="theme.green"
              />
            </svg>
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
              :class="{ 'line-through': todo.status === 'completed' }"
              :style="{ color: todo.status === 'completed' ? theme.surface2 : theme.text }"
              @click="startEditingTodo(todo.id, todo.title)"
            >
              {{ todo.title }}
            </span>
            <button
              class="absolute top-0 right-0 h-8 w-8 bg-red-300 text-gray-600 cursor-pointer md:hidden md:group-hover:flex items-center justify-center"
              @click="emit('remove-todo', note.id, todo.id)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
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
        <div class="mt-4">
          <input
            type="text"
            placeholder="Add task..."
            :data-add-todo-input="note.id"
            class="w-full pl-8 bg-transparent outline-none add-todo-input"
            :style="{ color: theme.overlay0, '--placeholder-color': theme.subtext0 }"
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
          class="w-full bg-transparent outline-none resize-none scrollbar-none [grid-area:1/1/2/2] field-sizing-content text-note-textarea"
          :style="{
            color: theme.text,
            backgroundImage: 'repeating-linear-gradient(transparent, transparent 1.4em, rgba(255, 255, 255, 0.05) 1.4em, rgba(255, 255, 255, 0.05) calc(1.4em + 1px))',
            lineHeight: '1.4em',
            '--placeholder-color': theme.subtext0,
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

<style scoped>
.add-todo-input::placeholder,
.text-note-textarea::placeholder {
  color: var(--placeholder-color);
  opacity: 1;
}
</style>
