<script setup lang="ts">
import { ref } from 'vue'
import { useTheme, type ThemeName } from '@/composables/useTheme'
import { useWeekLength } from '@/composables/useWeekLength'
import { useShowCreatedAt } from '@/composables/useShowCreatedAt'
import { useTodoList } from '@/composables/useTodoList'
import { useDialog } from '@/composables/useDialog'
import { useToast } from '@/composables/useToast'
import { exportAllNotesAsFile, exportAllNotesAsJson, readJsonFile } from '@/utils/export'

const { themeName, themeNames, themeDisplayNames, setTheme } = useTheme()
const { weekLength, setWeekLength } = useWeekLength()
const { showCreatedAt, setShowCreatedAt } = useShowCreatedAt()
const { notes, replaceAllNotes } = useTodoList()
const { confirm } = useDialog()
const toast = useToast()

const fileInputRef = ref<HTMLInputElement | null>(null)

const menuOpen = ref(false)
const activeSubmenu = ref<'theme' | 'week' | 'export' | 'import' | null>(null)

function toggleMenu() {
  menuOpen.value = !menuOpen.value
  if (!menuOpen.value) {
    activeSubmenu.value = null
  }
}

function closeMenu() {
  menuOpen.value = false
  activeSubmenu.value = null
}

function handleExportMarkdown() {
  exportAllNotesAsFile(notes.value)
  closeMenu()
}

function handleExportJson() {
  exportAllNotesAsJson(notes.value)
  closeMenu()
}

function handleImportClick() {
  fileInputRef.value?.click()
}

async function handleFileSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  input.value = '' // Reset for re-selection

  const result = await readJsonFile(file)
  if (!result.success || !result.notes) {
    toast.error(result.error || 'Failed to import backup')
    return
  }

  const noteCount = result.notes.length
  confirm(
    `This will replace all ${notes.value.length} current notes with ${noteCount} notes from the backup. This action cannot be undone.`,
    () => {
      replaceAllNotes(result.notes!)
      toast.success(`Successfully imported ${noteCount} notes`)
    },
  )
  closeMenu()
}

function selectTheme(name: ThemeName) {
  setTheme(name)
  closeMenu()
}

function selectWeekLength(length: '1' | '5' | '7') {
  setWeekLength(length)
  closeMenu()
}
</script>

<template>
  <input
    ref="fileInputRef"
    type="file"
    accept=".json"
    class="hidden"
    @change="handleFileSelected"
  />
  <!-- Backdrop to close menu on click outside -->
  <div
    v-if="menuOpen"
    class="fixed inset-0 z-10"
    @click="closeMenu"
  />
  <div class="fixed top-4 right-6 z-30">
    <!-- Settings Button -->
    <button
      class="px-3 py-1 border cursor-pointer transition-colors border-surface1 bg-surface0 text-text"
      @click="toggleMenu"
    >
      Settings
    </button>

    <!-- Main Settings Menu -->
    <div
      v-if="menuOpen"
      class="absolute top-full right-0 pt-1"
    >
      <div class="border border-surface1 bg-surface0">
        <!-- Theme Sub-menu Trigger -->
        <div
          class="relative"
          @mouseenter="activeSubmenu = 'theme'"
        >
          <button
            class="block w-full px-3 py-1 text-left cursor-pointer transition-colors whitespace-nowrap text-text"
            :class="activeSubmenu === 'theme' ? 'bg-surface1' : ''"
          >
            Theme
          </button>

          <!-- Theme Sub-menu -->
          <div
            v-if="activeSubmenu === 'theme'"
            class="absolute top-0 right-full border border-surface1 bg-surface0"
          >
            <button
              v-for="name in themeNames"
              :key="name"
              class="block w-full px-3 py-1 text-left cursor-pointer transition-colors whitespace-nowrap hover:bg-surface1"
              :class="themeName === name ? 'text-lavender bg-surface1' : 'text-text'"
              @click="selectTheme(name as ThemeName)"
            >
              {{ themeName === name ? '> ' : '  ' }}{{ themeDisplayNames[name as ThemeName] }}
            </button>
          </div>
        </div>

        <!-- Week Length Sub-menu Trigger -->
        <div
          class="relative"
          @mouseenter="activeSubmenu = 'week'"
        >
          <button
            class="block w-full px-3 py-1 text-left cursor-pointer transition-colors whitespace-nowrap text-text"
            :class="activeSubmenu === 'week' ? 'bg-surface1' : ''"
          >
            Week Length
          </button>

          <!-- Week Length Sub-menu -->
          <div
            v-if="activeSubmenu === 'week'"
            class="absolute top-0 right-full border border-surface1 bg-surface0"
          >
            <button
              class="block w-full px-3 py-1 text-left cursor-pointer transition-colors whitespace-nowrap hover:bg-surface1"
              :class="weekLength === '1' ? 'text-lavender bg-surface1' : 'text-text'"
              @click="selectWeekLength('1')"
            >
              {{ weekLength === '1' ? '> ' : '  ' }}1 day
            </button>
            <button
              class="block w-full px-3 py-1 text-left cursor-pointer transition-colors whitespace-nowrap hover:bg-surface1"
              :class="weekLength === '5' ? 'text-lavender bg-surface1' : 'text-text'"
              @click="selectWeekLength('5')"
            >
              {{ weekLength === '5' ? '> ' : '  ' }}5 days
            </button>
            <button
              class="block w-full px-3 py-1 text-left cursor-pointer transition-colors whitespace-nowrap hover:bg-surface1"
              :class="weekLength === '7' ? 'text-lavender bg-surface1' : 'text-text'"
              @click="selectWeekLength('7')"
            >
              {{ weekLength === '7' ? '> ' : '  ' }}7 days
            </button>
          </div>
        </div>

        <!-- Divider -->
        <div class="my-1 mx-2 border-t border-surface1" />

        <!-- Export Sub-menu Trigger -->
        <div
          class="relative"
          @mouseenter="activeSubmenu = 'export'"
        >
          <button
            class="block w-full px-3 py-1 text-left cursor-pointer transition-colors whitespace-nowrap text-text"
            :class="activeSubmenu === 'export' ? 'bg-surface1' : ''"
          >
            Export
          </button>

          <!-- Export Sub-menu -->
          <div
            v-if="activeSubmenu === 'export'"
            class="absolute top-0 right-full border border-surface1 bg-surface0"
          >
            <button
              class="block w-full px-3 py-1 text-left cursor-pointer transition-colors whitespace-nowrap text-text hover:bg-surface1"
              @click="handleExportMarkdown"
            >
              Export Readable (MD)
            </button>
            <button
              class="block w-full px-3 py-1 text-left cursor-pointer transition-colors whitespace-nowrap text-text hover:bg-surface1"
              @click="handleExportJson"
            >
              Export Backup (JSON)
            </button>
          </div>
        </div>

        <!-- Import Sub-menu Trigger -->
        <div
          class="relative"
          @mouseenter="activeSubmenu = 'import'"
        >
          <button
            class="block w-full px-3 py-1 text-left cursor-pointer transition-colors whitespace-nowrap text-text"
            :class="activeSubmenu === 'import' ? 'bg-surface1' : ''"
          >
            Import
          </button>

          <!-- Import Sub-menu -->
          <div
            v-if="activeSubmenu === 'import'"
            class="absolute top-0 right-full border border-surface1 bg-surface0"
          >
            <button
              class="block w-full px-3 py-1 text-left cursor-pointer transition-colors whitespace-nowrap text-text hover:bg-surface1"
              @click="handleImportClick"
            >
              Import Backup (JSON)
            </button>
          </div>
        </div>

        <!-- Divider -->
        <div class="my-1 mx-2 border-t border-surface1" />

        <!-- Show Dates Toggle -->
        <button
          class="block w-full px-3 py-1 text-left cursor-pointer transition-colors whitespace-nowrap text-text hover:bg-surface1"
          @mouseenter="activeSubmenu = null"
          @click="setShowCreatedAt(!showCreatedAt)"
        >
          Show Dates on Notes
          <span :class="showCreatedAt ? 'text-green' : 'text-text'">{{
          showCreatedAt ? '[─●]' : '[●─]'
          }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
