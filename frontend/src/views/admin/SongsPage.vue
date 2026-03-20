<template>
  <div>
    <div class="form-section">
      <div class="section-title">批量导入歌曲</div>
      <n-space size="large">
        <n-button @click="handleDownloadTemplate">下载模板</n-button>
        <n-button type="info" @click="$refs.excelInput.click()" :loading="excelImporting">Excel导入</n-button>
        <n-button type="success" @click="$refs.imageInput.click()" :loading="imageImporting">图片识别导入</n-button>
        <input ref="excelInput" type="file" style="display: none" accept=".xlsx,.xls" @change="handleExcelImport" />
        <input ref="imageInput" type="file" style="display: none" accept="image/*" @change="handleImageImport" />
      </n-space>
    </div>

    <div class="form-section">
      <div class="section-title">添加新歌曲</div>
      <n-form :model="songForm" label-placement="top">
        <n-grid :cols="2" :x-gap="20">
          <n-grid-item>
            <n-form-item label="歌曲名称"><n-input v-model:value="songForm.title" placeholder="请输入歌曲名称" /></n-form-item>
          </n-grid-item>
          <n-grid-item>
            <n-form-item label="歌手"><n-input v-model:value="songForm.artist" placeholder="请输入歌手名称" /></n-form-item>
          </n-grid-item>
        </n-grid>
        <n-form-item label="标签">
          <n-select v-model:value="songForm.tags" multiple :options="tagOptions" placeholder="选择标签" clearable />
        </n-form-item>
        <n-form-item>
          <n-button type="primary" @click="handleAddSong" :loading="songAdding">添加歌曲</n-button>
        </n-form-item>
      </n-form>
    </div>

    <div class="form-section">
      <div class="section-title">歌曲列表</div>
      <n-input v-model:value="searchQuery" placeholder="搜索歌曲..." style="margin-bottom: 20px;" />
      <div v-for="song in filteredSongs" :key="song.id" class="song-item">
        <div class="song-info">
          <n-text strong>{{ song.title }}</n-text>
          <div>{{ song.artist }}</div>
          <n-space size="small" style="margin-top: 5px;">
            <n-tag v-for="tag in song.tags" :key="tag" size="small">{{ tag }}</n-tag>
          </n-space>
        </div>
        <div class="song-actions">
          <n-button size="small" @click="openEditSong(song)">编辑</n-button>
          <n-button size="small" type="error" @click="handleDeleteSong(song.id)">删除</n-button>
        </div>
      </div>
      <n-empty v-if="filteredSongs.length === 0" description="暂无歌曲" />
    </div>

    <n-modal v-model:show="editModal.show" preset="dialog" title="编辑歌曲" style="width: 500px;">
      <n-form :model="editModal.data" label-placement="top">
        <n-form-item label="歌曲名称"><n-input v-model:value="editModal.data.title" /></n-form-item>
        <n-form-item label="歌手"><n-input v-model:value="editModal.data.artist" /></n-form-item>
        <n-form-item label="标签"><n-select v-model:value="editModal.data.tags" multiple :options="tagOptions" clearable /></n-form-item>
      </n-form>
      <template #action>
        <n-space>
          <n-button @click="editModal.show = false">取消</n-button>
          <n-button type="primary" @click="handleUpdateSong">确认</n-button>
        </n-space>
      </template>
    </n-modal>

    <OcrResultModal v-model:show="ocrModal.show" :data="ocrModal.data" :loading="ocrModal.loading" @confirm="handleOcrConfirm" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useMessage } from 'naive-ui'
import { getSongs, getTags, createSong, updateSong, deleteSong, importExcel, importImage, confirmOcrImport, downloadTemplate } from '../../api'
import OcrResultModal from '../../components/OcrResultModal.vue'

const message = useMessage()
const songs = ref([])
const tags = ref([])
const searchQuery = ref('')
const songAdding = ref(false)
const excelImporting = ref(false)
const imageImporting = ref(false)
const songForm = reactive({ title: '', artist: '', tags: [] })
const editModal = reactive({ show: false, data: { id: null, title: '', artist: '', tags: [] } })
const ocrModal = reactive({ show: false, loading: false, data: { extractedSongs: [], confidence: 0, totalTextLines: 0, songCount: 0 } })
const excelInput = ref(null)
const imageInput = ref(null)

const tagOptions = computed(() => tags.value.map(t => ({ label: t, value: t })))
const filteredSongs = computed(() => {
  if (!searchQuery.value.trim()) return songs.value
  const q = searchQuery.value.toLowerCase()
  return songs.value.filter(s => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q))
})

async function loadAll() {
  try {
    let allSongs = [], page = 1, hasMore = true
    while (hasMore) {
      const data = await getSongs({ page, limit: 500 })
      if (data.success && data.data.songs) {
        allSongs = allSongs.concat(data.data.songs)
        hasMore = page < data.data.pagination.totalPages && page < 100
        page++
      } else hasMore = false
    }
    songs.value = allSongs
    const tagsData = await getTags()
    if (tagsData.success) tags.value = tagsData.data || []
  } catch {}
}

async function handleAddSong() {
  if (!songForm.title.trim() || !songForm.artist.trim()) { message.warning('请填写歌曲名称和歌手'); return }
  songAdding.value = true
  try {
    const data = await createSong({ title: songForm.title, artist: songForm.artist, tags: songForm.tags })
    if (data.success) { Object.assign(songForm, { title: '', artist: '', tags: [] }); message.success('歌曲添加成功'); await loadAll() }
    else message.error(data.error || '添加失败')
  } catch (e) { if (e.message !== '登录已过期') message.error('添加失败') }
  finally { songAdding.value = false }
}

function openEditSong(song) {
  editModal.show = true
  editModal.data = { id: song.id, title: song.title, artist: song.artist, tags: [...(song.tags || [])] }
}

async function handleUpdateSong() {
  const d = editModal.data
  if (!d.title.trim() || !d.artist.trim()) { message.warning('请填写歌曲名称和歌手'); return }
  try {
    const data = await updateSong(d.id, { title: d.title, artist: d.artist, tags: d.tags })
    if (data.success) { editModal.show = false; message.success('歌曲更新成功'); await loadAll() }
    else message.error(data.error || '更新失败')
  } catch (e) { if (e.message !== '登录已过期') message.error('更新失败') }
}

async function handleDeleteSong(id) {
  try {
    const data = await deleteSong(id)
    if (data.success) { message.success('歌曲删除成功'); await loadAll() }
    else message.error(data.error || '删除失败')
  } catch (e) { if (e.message !== '登录已过期') message.error('删除失败') }
}

async function handleDownloadTemplate() {
  try { await downloadTemplate(); message.success('模板下载成功') }
  catch { message.error('模板下载失败') }
}

async function handleExcelImport(event) {
  const file = event.target.files[0]
  if (!file) return
  excelImporting.value = true
  try {
    const data = await importExcel(file)
    if (data.success) { message.success(data.message); await loadAll() }
    else message.error(data.error || '导入失败')
  } catch (e) { if (e.message !== '登录已过期') message.error('导入失败') }
  finally { excelImporting.value = false; event.target.value = '' }
}

async function handleImageImport(event) {
  const file = event.target.files[0]
  if (!file) return
  imageImporting.value = true
  try {
    const data = await importImage(file)
    if (data.success) {
      ocrModal.data = { extractedSongs: data.data.extractedSongs || [], confidence: data.data.confidence || 0, totalTextLines: data.data.totalTextLines || 0, songCount: data.data.songCount || 0 }
      ocrModal.show = true
      message.success(data.message)
    } else message.error(data.error || '图片识别失败')
  } catch (e) { if (e.message !== '登录已过期') message.error('图片识别失败') }
  finally { imageImporting.value = false; event.target.value = '' }
}

async function handleOcrConfirm({ songs: ocrSongs, selectedIndexes }) {
  ocrModal.loading = true
  try {
    const data = await confirmOcrImport(ocrSongs, selectedIndexes)
    if (data.success) { message.success(data.message); ocrModal.show = false; await loadAll() }
    else message.error(data.error || '导入失败')
  } catch (e) { if (e.message !== '登录已过期') message.error('导入失败') }
  finally { ocrModal.loading = false }
}

async function refresh() { await loadAll() }
defineExpose({ refresh })
onMounted(loadAll)
</script>

<style scoped>
.song-item { padding: 15px; border-radius: 10px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; transition: background 0.2s, border-color 0.2s; }
html.dark .song-item { background: #1e1e24; border: 1px solid #2a2a30; }
html:not(.dark) .song-item { background: #fff; border: 1px solid #e5e5ea; }
.song-info { flex: 1; }
.song-actions { display: flex; gap: 8px; }
</style>
