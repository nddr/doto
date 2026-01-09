<script setup lang="ts">
import { ref, useTemplateRef, nextTick } from 'vue'

const textOpen = ref(false)
const position = ref({ x: 0, y: 0 })
const textarea = useTemplateRef<HTMLTextAreaElement>('textarea')
const notes = ref<Record<string, any>[]>([
  { text: 'First note' },
  { text: 'Second note' },
  { text: 'Third note' },
  { text: 'Fourth note' },
  { text: 'Fifth note' },
  { text: 'Sixth note' },
  { text: 'Seventh note' },
])

const modalOpen = ref(false)
const selectedNote = ref<Record<string, any> | null>(null)

function handleCanvasClick(event: MouseEvent) {
  if (event.target !== event.currentTarget) return

  position.value = { x: event.clientX, y: event.clientY }
  textOpen.value = true

  nextTick(() => {
    textarea.value?.focus()
  })
}

function handleSave() {
  console.log('Saved:', textarea.value?.value)
}

function handleNoteClick(note: Record<string, any>) {
  selectedNote.value = note
  modalOpen.value = true
}

function closeModal() {
  modalOpen.value = false
  selectedNote.value = null
}
</script>

<template>
  <header class="fixed top-0 left-0 w-full h-16 p-8 text-black z-10">
    <h1 class="text-2xl">Todoi</h1>
  </header>

  <main ref="canvas" class="relative w-screen h-screen bg-amber-50" @click="handleCanvasClick">
    <div class="flex items-start gap-4 ml-8 p-4 pt-24 overflow-x-auto snap-x snap-mandatory">
      <div v-for="note in notes"
        class="w-[calc((100vw-96px)/5)] shrink-0 h-32 p-4 bg-white/50 rounded-xl shadow transition hover:bg-white snap-start"
        @click="handleNoteClick(note)">
        {{ note.text }}
      </div>
    </div>

    <div v-show="textOpen" class="absolute w-72 min-h-64 p-4 bg-white rounded-xl shadow"
      :style="{ left: `${position.x}px`, top: `${position.y}px` }">
      <form @submit.prevent="handleSave" class="relative h-full">
        <textarea ref="textarea"
          class="w-full text-xl outline-none resize-none overflow-hidden field-sizing-content"></textarea>

        <button type="submit" class="bg-amber-200 px-3 py-1 rounded mt-auto cursor-pointer">save</button>
      </form>
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