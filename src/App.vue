<script setup lang="ts">
import { ref, useTemplateRef, nextTick } from 'vue'

const textOpen = ref(false)
const position = ref({ x: 0, y: 0 })
const textarea = useTemplateRef<HTMLTextAreaElement>('textarea')

function handleCanvasClick(event: MouseEvent) {
  if (event.target !== event.currentTarget) return

  position.value = { x: event.clientX, y: event.clientY }
  textOpen.value = true

  nextTick(() => {
    textarea.value?.focus()
  })
}
</script>

<template>
  <main ref="canvas" class="relative w-screen h-screen bg-amber-50" @click="handleCanvasClick">
    <div v-show="textOpen" class="absolute w-64 p-4 bg-white rounded-xl shadow"
      :style="{ left: `${position.x}px`, top: `${position.y}px` }">
      <textarea ref="textarea"
        class="w-full text-xl outline-none resize-none overflow-hidden field-sizing-content"></textarea>
      <button type="submit">add</button>
    </div>
  </main>
</template>