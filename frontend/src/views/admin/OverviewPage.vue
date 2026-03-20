<template>
  <div>
    <div class="stats-grid">
      <n-card title="总歌曲数" hoverable><n-statistic :value="songs.length" /></n-card>
      <n-card title="标签数量" hoverable><n-statistic :value="tags.length" /></n-card>
      <n-card title="系统状态" hoverable><n-statistic value="正常" /></n-card>
    </div>
    <n-card title="最近添加的歌曲" hoverable>
      <n-list>
        <n-list-item v-for="song in songs.slice(-5)" :key="song.id">
          <n-thing :title="song.title" :description="song.artist">
            <template #footer>
              <n-space>
                <n-tag v-for="tag in song.tags" :key="tag" size="small" type="info">{{ tag }}</n-tag>
              </n-space>
            </template>
          </n-thing>
        </n-list-item>
      </n-list>
      <n-empty v-if="songs.length === 0" description="暂无歌曲" />
    </n-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getSongs, getTags } from '../../api'

const songs = ref([])
const tags = ref([])

async function loadAll() {
  try {
    const [songsRes, tagsRes] = await Promise.all([
      getSongs({ page: 1, limit: 500 }),
      getTags()
    ])
    if (songsRes.success) songs.value = songsRes.data.songs || []
    if (tagsRes.success) tags.value = tagsRes.data || []
  } catch {}
}

async function refresh() { await loadAll() }
defineExpose({ refresh })

onMounted(loadAll)
</script>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}
</style>
