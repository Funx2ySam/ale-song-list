<template>
  <div
    class="upload-area"
    @click="triggerInput"
    @dragover.prevent="isDragging = true"
    @dragleave="isDragging = false"
    @drop.prevent="handleDrop"
    :class="{ dragover: isDragging }"
  >
    <input ref="fileInput" type="file" style="display: none" :accept="accept" @change="handleChange" />
    <n-icon size="40" style="color: #ccc; margin-bottom: 10px;">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <path fill="currentColor" d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z M12,12L16,16H13V19H11V16H8L12,12Z"/>
      </svg>
    </n-icon>
    <div>{{ label }}</div>
    <div v-if="hint" style="font-size: 12px; color: #999; margin-top: 5px;">{{ hint }}</div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  accept: { type: String, default: 'image/*' },
  label: { type: String, default: '点击或拖拽上传' },
  hint: { type: String, default: '' }
})
const emit = defineEmits(['file-selected'])

const fileInput = ref(null)
const isDragging = ref(false)

function triggerInput() {
  fileInput.value?.click()
}

function handleChange(event) {
  const file = event.target.files[0]
  if (file) {
    emit('file-selected', file)
    event.target.value = ''
  }
}

function handleDrop(event) {
  isDragging.value = false
  const file = event.dataTransfer.files[0]
  if (file) emit('file-selected', file)
}
</script>

<style scoped>
.upload-area {
  border: 2px dashed;
  border-radius: 10px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 16px;
}
html.dark .upload-area { border-color: #2a2a30; color: rgba(255,255,255,0.5); }
html:not(.dark) .upload-area { border-color: #d9d9d9; color: #666; }
html.dark .upload-area:hover { border-color: #7c5cfc; background: rgba(124,92,252,0.06); }
html:not(.dark) .upload-area:hover { border-color: #6c5ce7; background: rgba(108,92,231,0.04); }
html.dark .upload-area.dragover { border-color: #7c5cfc; background: rgba(124,92,252,0.12); }
html:not(.dark) .upload-area.dragover { border-color: #6c5ce7; background: rgba(108,92,231,0.08); }
</style>
