<script setup lang="ts">
import { ref } from 'vue'
import { useTheme, type ThemeName } from '@/composables/useTheme'
import { useWeekLength } from '@/composables/useWeekLength'
import { useShowCreatedAt } from '@/composables/useShowCreatedAt'
import { useTodoList } from '@/composables/useTodoList'
import { useDialog } from '@/composables/useDialog'
import { useToast } from '@/composables/useToast'
import { exportAllNotesAsFile, exportAllNotesAsJson, readJsonFile } from '@/utils/export'

const { theme, themeName, themeNames, themes, setTheme } = useTheme()
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

function selectWeekLength(length: '5' | '7') {
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
      class="px-3 py-1 border cursor-pointer transition-colors"
      :style="{
        borderColor: theme.surface1,
        backgroundColor: theme.surface0,
        color: theme.text,
      }"
      @click="toggleMenu"
    >
      Settings
    </button>

    <!-- Main Settings Menu -->
    <div
      v-if="menuOpen"
      class="absolute top-full right-0 pt-1"
    >
      <div
        class="border"
        :style="{
          borderColor: theme.surface1,
          backgroundColor: theme.surface0,
        }"
      >
        <!-- Theme Sub-menu Trigger -->
        <div
          class="relative"
          @mouseenter="activeSubmenu = 'theme'"
        >
          <button
            class="block w-full px-3 py-1 text-left cursor-pointer transition-colors whitespace-nowrap"
            :style="{
            color: theme.text,
            backgroundColor: activeSubmenu === 'theme' ? theme.surface1 : 'transparent',
          }"
          >
            Theme
          </button>

          <!-- Theme Sub-menu -->
          <div
            v-if="activeSubmenu === 'theme'"
            class="absolute top-0 right-full border"
            :style="{
            borderColor: theme.surface1,
            backgroundColor: theme.surface0,
          }"
          >
            <button
              v-for="name in themeNames"
              :key="name"
              class="block w-full px-3 py-1 text-left cursor-pointer transition-colors whitespace-nowrap"
              :style="{
              color: themeName === name ? theme.lavender : theme.text,
              backgroundColor: themeName === name ? theme.surface1 : 'transparent',
            }"
              @click="selectTheme(name as ThemeName)"
              @mouseenter="($event.target as HTMLElement).style.backgroundColor = theme.surface1"
              @mouseleave="($event.target as HTMLElement).style.backgroundColor = themeName === name ? theme.surface1 : 'transparent'"
            >
              {{ themeName === name ? '> ' : '  ' }}{{ themes[name].name }}
            </button>
          </div>
        </div>

        <!-- Week Length Sub-menu Trigger -->
        <div
          class="relative"
          @mouseenter="activeSubmenu = 'week'"
        >
          <button
            class="block w-full px-3 py-1 text-left cursor-pointer transition-colors whitespace-nowrap"
            :style="{
            color: theme.text,
            backgroundColor: activeSubmenu === 'week' ? theme.surface1 : 'transparent',
          }"
          >
            Week Length
          </button>

          <!-- Week Length Sub-menu -->
          <div
            v-if="activeSubmenu === 'week'"
            class="absolute top-0 right-full border"
            :style="{
            borderColor: theme.surface1,
            backgroundColor: theme.surface0,
          }"
          >
            <button
              class="block w-full px-3 py-1 text-left cursor-pointer transition-colors whitespace-nowrap"
              :style="{
              color: weekLength === '5' ? theme.lavender : theme.text,
              backgroundColor: weekLength === '5' ? theme.surface1 : 'transparent',
            }"
              @click="selectWeekLength('5')"
              @mouseenter="($event.target as HTMLElement).style.backgroundColor = theme.surface1"
              @mouseleave="($event.target as HTMLElement).style.backgroundColor = weekLength === '5' ? theme.surface1 : 'transparent'"
            >
              {{ weekLength === '5' ? '> ' : '  ' }}5 days
            </button>
            <button
              class="block w-full px-3 py-1 text-left cursor-pointer transition-colors whitespace-nowrap"
              :style="{
              color: weekLength === '7' ? theme.lavender : theme.text,
              backgroundColor: weekLength === '7' ? theme.surface1 : 'transparent',
            }"
              @click="selectWeekLength('7')"
              @mouseenter="($event.target as HTMLElement).style.backgroundColor = theme.surface1"
              @mouseleave="($event.target as HTMLElement).style.backgroundColor = weekLength === '7' ? theme.surface1 : 'transparent'"
            >
              {{ weekLength === '7' ? '> ' : '  ' }}7 days
            </button>
          </div>
        </div>

        <!-- Divider -->
        <div
          class="my-1 mx-2 border-t"
          :style="{ borderColor: theme.surface1 }"
        />

        <!-- Export Sub-menu Trigger -->
        <div
          class="relative"
          @mouseenter="activeSubmenu = 'export'"
        >
          <button
            class="block w-full px-3 py-1 text-left cursor-pointer transition-colors whitespace-nowrap"
            :style="{
            color: theme.text,
            backgroundColor: activeSubmenu === 'export' ? theme.surface1 : 'transparent',
          }"
          >
            Export
          </button>

          <!-- Export Sub-menu -->
          <div
            v-if="activeSubmenu === 'export'"
            class="absolute top-0 right-full border"
            :style="{
            borderColor: theme.surface1,
            backgroundColor: theme.surface0,
          }"
          >
            <button
              class="block w-full px-3 py-1 text-left cursor-pointer transition-colors whitespace-nowrap"
              :style="{
              color: theme.text,
            }"
              @click="handleExportMarkdown"
              @mouseenter="($event.target as HTMLElement).style.backgroundColor = theme.surface1"
              @mouseleave="($event.target as HTMLElement).style.backgroundColor = 'transparent'"
            >
              Export Readable (MD)
            </button>
            <button
              class="block w-full px-3 py-1 text-left cursor-pointer transition-colors whitespace-nowrap"
              :style="{
              color: theme.text,
            }"
              @click="handleExportJson"
              @mouseenter="($event.target as HTMLElement).style.backgroundColor = theme.surface1"
              @mouseleave="($event.target as HTMLElement).style.backgroundColor = 'transparent'"
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
            class="block w-full px-3 py-1 text-left cursor-pointer transition-colors whitespace-nowrap"
            :style="{
            color: theme.text,
            backgroundColor: activeSubmenu === 'import' ? theme.surface1 : 'transparent',
          }"
          >
            Import
          </button>

          <!-- Import Sub-menu -->
          <div
            v-if="activeSubmenu === 'import'"
            class="absolute top-0 right-full border"
            :style="{
            borderColor: theme.surface1,
            backgroundColor: theme.surface0,
          }"
          >
            <button
              class="block w-full px-3 py-1 text-left cursor-pointer transition-colors whitespace-nowrap"
              :style="{
              color: theme.text,
            }"
              @click="handleImportClick"
              @mouseenter="($event.target as HTMLElement).style.backgroundColor = theme.surface1"
              @mouseleave="($event.target as HTMLElement).style.backgroundColor = 'transparent'"
            >
              Import Backup (JSON)
            </button>
          </div>
        </div>

        <!-- Divider -->
        <div
          class="my-1 mx-2 border-t"
          :style="{ borderColor: theme.surface1 }"
        />

        <!-- Show Dates Toggle -->
        <button
          class="block w-full px-3 py-1 text-left cursor-pointer transition-colors whitespace-nowrap"
          :style="{
          color: theme.text,
        }"
          @mouseenter="($event.target as HTMLElement).style.backgroundColor = theme.surface1; activeSubmenu = null"
          @mouseleave="($event.target as HTMLElement).style.backgroundColor = 'transparent'"
          @click="setShowCreatedAt(!showCreatedAt)"
        >
          Show Dates on Notes
          <span :style="{ color: showCreatedAt ? theme.green : theme.text }">{{
          showCreatedAt ? '[─●]' : '[●─]'
          }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
