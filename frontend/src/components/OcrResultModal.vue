<template>
  <n-modal :show="show" @update:show="$emit('update:show', $event)" style="width: 800px;">
    <n-card title="图片识别结果" :bordered="false" size="huge">
      <template #header-extra>
        <n-button quaternary circle @click="$emit('update:show', false)">
          <template #icon>
            <n-icon><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/></svg></n-icon>
          </template>
        </n-button>
      </template>

      <n-alert type="info" style="margin-bottom: 20px;">
        <div>
          <div>识别到文字行数：{{ data.totalTextLines }}，提取歌曲数：{{ data.songCount }}</div>
          <div v-if="data.confidence">识别置信度：{{ (data.confidence * 100).toFixed(1) }}%</div>
        </div>
      </n-alert>

      <n-space style="margin-bottom: 20px;">
        <n-button @click="toggleSelectAll" size="small">
          {{ selectedSongs.length === data.extractedSongs.length ? '全不选' : '全选' }}
        </n-button>
        <n-text depth="3">已选择 {{ selectedSongs.length }} / {{ data.extractedSongs.length }} 首歌曲</n-text>
      </n-space>

      <div style="max-height: 400px; overflow-y: auto;">
        <div
          v-for="(song, index) in data.extractedSongs"
          :key="index"
          class="ocr-song-item"
          :class="{ selected: selectedSongs.includes(index) }"
          @click="toggleSelection(index)"
        >
          <div style="display: flex; align-items: center; gap: 12px;">
            <n-checkbox
              :checked="selectedSongs.includes(index)"
              @click.stop
              @update:checked="() => toggleSelection(index)"
            />
            <div style="flex: 1;">
              <div style="font-weight: 500;">{{ song.title }}</div>
              <div v-if="song.artist" style="font-size: 14px; color: #666;">{{ song.artist }}</div>
              <div v-else style="font-size: 14px; color: #999;">未识别到歌手</div>
            </div>
            <n-tag v-if="song.confidence" size="small" :type="song.confidence > 0.7 ? 'success' : song.confidence > 0.5 ? 'warning' : 'error'">
              置信度 {{ (song.confidence * 100).toFixed(0) }}%
            </n-tag>
          </div>
        </div>
      </div>

      <template #action>
        <n-space justify="end">
          <n-button @click="$emit('update:show', false)">取消</n-button>
          <n-button
            type="primary"
            @click="handleConfirm"
            :loading="loading"
            :disabled="selectedSongs.length === 0"
          >导入选中歌曲 ({{ selectedSongs.length }})</n-button>
        </n-space>
      </template>
    </n-card>
  </n-modal>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  data: { type: Object, default: () => ({ extractedSongs: [], confidence: 0, totalTextLines: 0, songCount: 0 }) },
  loading: { type: Boolean, default: false }
})
const emit = defineEmits(['update:show', 'confirm'])

const selectedSongs = ref([])

watch(() => props.data.extractedSongs, (songs) => {
  if (songs) selectedSongs.value = songs.map((_, i) => i)
}, { immediate: true })

function toggleSelection(index) {
  const i = selectedSongs.value.indexOf(index)
  if (i > -1) selectedSongs.value.splice(i, 1)
  else selectedSongs.value.push(index)
}

function toggleSelectAll() {
  if (selectedSongs.value.length === props.data.extractedSongs.length) {
    selectedSongs.value = []
  } else {
    selectedSongs.value = props.data.extractedSongs.map((_, i) => i)
  }
}

function handleConfirm() {
  emit('confirm', {
    songs: props.data.extractedSongs,
    selectedIndexes: [...selectedSongs.value]
  })
}
</script>

<style scoped>
.ocr-song-item {
  padding: 12px;
  border-radius: 10px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}
html.dark .ocr-song-item { border: 1px solid #2a2a30; }
html:not(.dark) .ocr-song-item { border: 1px solid #e8e8e8; }
html.dark .ocr-song-item:hover { border-color: #3a3a42; background: rgba(255,255,255,0.03); }
html:not(.dark) .ocr-song-item:hover { border-color: #d4d4d4; background: #fafafa; }
html.dark .ocr-song-item.selected { border-color: #7c5cfc; background: rgba(124,92,252,0.1); }
html:not(.dark) .ocr-song-item.selected { border-color: #6c5ce7; background: rgba(108,92,231,0.06); }
</style>
