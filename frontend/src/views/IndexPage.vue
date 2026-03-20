<template>
  <div class="page-bg">
    <div class="main-container">
      <!-- 加载骨架屏 -->
      <div v-if="initialLoading" class="loading-state">
        <n-spin size="large" />
        <n-text depth="3" style="margin-top: 16px;">加载中...</n-text>
      </div>

      <template v-else>
        <!-- Header -->
        <div class="header-card animate-in">
          <div class="header-content">
            <n-avatar :size="88" :src="streamerInfo.avatar" :fallback-src="fallbackAvatar" round :alt="streamerInfo.name" />
            <div class="streamer-info">
              <h1 class="streamer-title">{{ streamerInfo.name }}</h1>
              <div class="streamer-desc">{{ streamerInfo.description }}</div>
              <div class="stats-row">
                <div class="stat-item"><span class="stat-val">{{ totalSongsCount }}</span><span class="stat-label">歌曲</span></div>
                <div class="stat-item"><span class="stat-val">{{ allTags.length }}</span><span class="stat-label">标签</span></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Controls -->
        <div class="controls-card animate-in" style="animation-delay: 0.08s;">
          <div class="controls-header">
            <span class="controls-title">搜索 &amp; 筛选</span>
            <n-button :loading="isRefreshing" @click="refreshData" quaternary round size="small">
              {{ isRefreshing ? '刷新中...' : '刷新' }}
            </n-button>
          </div>
          <n-input v-model:value="searchQuery" :placeholder="isSearching ? '搜索中...' : '搜索歌曲名称或歌手...'" clearable round size="large" :loading="isSearching" @input="debounceSearch" @clear="clearSearch" @keydown.enter="handleSearchEnter" aria-label="搜索歌曲" />
          <TagFilter :tags="allTags" :selected-tag="selectedTag" @select="selectTag" />
        </div>

        <!-- Song grid -->
        <div v-if="songs.length > 0">
          <div class="song-grid">
            <SongCard v-for="(song, i) in songs" :key="song.id" :song="song" @click="selectSong" :style="{ animationDelay: `${0.12 + i * 0.03}s` }" />
          </div>
          <div v-if="totalPages > 1" class="pagination-bar animate-in">
            <n-text depth="3" style="font-size: 0.88rem;">共 {{ totalSongsCount }} 首 · 第 {{ currentPage }}/{{ totalPages }} 页</n-text>
            <n-pagination v-model:page="currentPage" :page-count="totalPages" :page-size="pageSize" :show-size-picker="true" :page-sizes="[12, 24, 48, 96]" @update:page="handlePageChange" @update:page-size="handlePageSizeChange" />
          </div>
        </div>

        <div v-else class="empty-state animate-in">
          <n-empty :description="apiError ? '数据加载失败，请点击刷新重试' : '没有找到匹配的歌曲'" />
        </div>
      </template>

      <!-- Floating actions -->
      <div class="floating-actions">
        <n-button circle size="large" @click="handleCycleTheme" quaternary>
          <template #icon><n-icon size="20"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" v-if="themeIcon === 'auto'" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18V4c4.41 0 8 3.59 8 8s-3.59 8-8 8z"/><path fill="currentColor" v-else-if="themeIcon === 'dark'" d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"/><path fill="currentColor" v-else d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58a.996.996 0 0 0-1.41 0 .996.996 0 0 0 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37a.996.996 0 0 0-1.41 0 .996.996 0 0 0 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0a.996.996 0 0 0 0-1.41l-1.06-1.06zm1.06-10.96a.996.996 0 0 0 0-1.41.996.996 0 0 0-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36a.996.996 0 0 0 0-1.41.996.996 0 0 0-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/></svg></n-icon></template>
        </n-button>
        <n-button circle size="large" type="primary" @click="showAdminModal">
          <template #icon><n-icon size="18"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.82,11.69,4.82,12s0.02,0.64,0.07,0.94l-2.03,1.58c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/></svg></n-icon></template>
        </n-button>
      </div>

      <LoginModal v-model:show="showModal" @login-success="goToAdmin" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { useAuth } from '../composables/useAuth'
import { useSiteSettings } from '../composables/useSiteSettings'
import { cycleTheme, themeMode, isDark } from '../theme'
import SongCard from '../components/SongCard.vue'
import TagFilter from '../components/TagFilter.vue'
import LoginModal from '../components/LoginModal.vue'

const router = useRouter()
const message = useMessage()
const { isAuthenticated } = useAuth()
const { loadSettings } = useSiteSettings()

const themeIcon = computed(() => themeMode.value)
function handleCycleTheme() { cycleTheme() }

const fallbackAvatar = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iNTAiIGZpbGw9IiMyODI4MmUiLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjM1IiByPSIxNSIgZmlsbD0iIzU1NSIvPjxwYXRoIGQ9Ik0yNSA3NWMxMC0xNSAyNS0xNSA1MCAwaC01MHoiIGZpbGw9IiM1NTUiLz48L3N2Zz4='

const streamerInfo = ref({ name: '歌单系统', avatar: '', description: '', background: '' })
const songs = ref([])
const allTags = ref([])
const searchQuery = ref('')
const selectedTag = ref('')
const showModal = ref(false)
const isRefreshing = ref(false)
const initialLoading = ref(true)
const apiError = ref(false)
const isSearching = ref(false)
const currentPage = ref(1)
const pageSize = ref(24)
const totalSongsCount = ref(0)
const totalPages = ref(0)

let searchTimer = null
let currentRequest = null
const cache = new Map()
const CACHE_TTL = 5 * 60 * 1000

function applyBackground() {
  const bg = streamerInfo.value.background
  if (bg) {
    const overlay = isDark.value ? 'rgba(14,14,16,0.75)' : 'rgba(245,245,247,0.82)'
    document.body.style.background = `linear-gradient(${overlay},${overlay}),url('${bg}') center center/cover no-repeat fixed`
  } else {
    document.body.style.background = ''
  }
}

watch(isDark, () => applyBackground())

function getCacheKey() { return `s_${currentPage.value}_${pageSize.value}_${searchQuery.value.trim()}_${selectedTag.value}` }
function getCachedData(key) { if (cache.has(key)) { const c = cache.get(key); if (Date.now() - c.ts < CACHE_TTL) return c.data; cache.delete(key) } return null }
function setCachedData(key, data) { cache.set(key, { data, ts: Date.now() }); if (cache.size > 50) cache.delete(cache.keys().next().value) }

async function loadSongs() {
  if (currentRequest) currentRequest.abort()
  isSearching.value = true
  const ck = getCacheKey()
  const cached = getCachedData(ck)
  if (cached) { songs.value = cached.songs || []; totalSongsCount.value = cached.total || 0; totalPages.value = cached.totalPages || 0; isSearching.value = false; return }
  try {
    currentRequest = new AbortController()
    const p = new URLSearchParams({ page: currentPage.value, limit: pageSize.value })
    if (searchQuery.value.trim()) p.set('search', searchQuery.value.trim())
    if (selectedTag.value) p.set('tag', selectedTag.value)
    const res = await fetch(`/api/songs?${p}`, { signal: currentRequest.signal })
    if (res.status === 429) { message.warning('请求过于频繁，请稍后再试'); return }
    const data = await res.json()
    if (data.success && data.data) {
      const r = { songs: data.data.songs || [], total: data.data.pagination?.total || 0, totalPages: data.data.pagination?.totalPages || 0 }
      songs.value = r.songs; totalSongsCount.value = r.total; totalPages.value = r.totalPages
      setCachedData(ck, r)
    }
  } catch (e) { if (e.name !== 'AbortError') { songs.value = []; totalSongsCount.value = 0; totalPages.value = 0 } }
  finally { isSearching.value = false; currentRequest = null }
}

async function initializeData() {
  initialLoading.value = true; apiError.value = false
  try {
    const [sRes, tRes] = await Promise.all([
      fetch('/api/streamer/profile').catch(() => null),
      fetch('/api/tags').catch(() => null)
    ])
    if (sRes?.ok) { const d = await sRes.json(); if (d.success) { streamerInfo.value = { name: d.data.name || '歌单系统', avatar: d.data.avatar || '', description: d.data.description || '', background: d.data.background || '' }; applyBackground() } }
    if (tRes?.ok) { const d = await tRes.json(); if (d.success) allTags.value = d.data || [] }
    await loadSongs()
  } catch { apiError.value = true; message.warning('无法连接到服务器') }
  finally { initialLoading.value = false }
}

async function filterSongs() { currentPage.value = 1; await loadSongs() }
function debounceSearch() { if (searchTimer) clearTimeout(searchTimer); if (!searchQuery.value.trim()) { filterSongs(); return }; const q = searchQuery.value.trim(); let d = q.length <= 1 ? 400 : q.length <= 2 ? 250 : 150; if (/[\u4e00-\u9fa5]/.test(q)) d = Math.max(100, d - 100); searchTimer = setTimeout(() => filterSongs(), d) }
function clearSearch() { searchQuery.value = ''; filterSongs() }
function handleSearchEnter() { if (searchTimer) { clearTimeout(searchTimer); searchTimer = null }; filterSongs() }
function selectTag(tag) { selectedTag.value = tag; filterSongs() }
async function handlePageChange(p) { currentPage.value = p; await loadSongs(); window.scrollTo({ top: 0, behavior: 'smooth' }) }
async function handlePageSizeChange(s) { pageSize.value = s; currentPage.value = 1; await loadSongs(); window.scrollTo({ top: 0, behavior: 'smooth' }) }

function selectSong(song) {
  const t = `${song.title} - ${song.artist}`
  navigator.clipboard?.writeText(t).then(() => message.success(`已复制：${t}`)).catch(() => { const ta = document.createElement('textarea'); ta.value = t; ta.style.cssText = 'position:fixed;left:-9999px'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); message.success(`已复制：${t}`) } catch { message.error('复制失败') }; document.body.removeChild(ta) })
}

async function refreshData() { if (isRefreshing.value) return; isRefreshing.value = true; currentPage.value = 1; cache.clear(); await loadSongs(); if (!apiError.value) message.success('已刷新'); isRefreshing.value = false }
function showAdminModal() { if (isAuthenticated()) { router.push('/admin'); return }; showModal.value = true }
function goToAdmin() { setTimeout(() => router.push('/admin'), 800) }

onMounted(() => { loadSettings(); initializeData() })
onBeforeUnmount(() => { document.body.style.background = '' })
</script>

<style scoped>
.page-bg { min-height: 100vh; }
.main-container { max-width: 1100px; margin: 0 auto; padding: 36px 20px 80px; }

.loading-state { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; }

.header-card { border-radius: 16px; padding: 28px; margin-bottom: 20px; transition: background 0.3s, border 0.3s; }
html.dark .header-card { background: #18181c; border: 1px solid #2a2a30; }
html:not(.dark) .header-card { background: #fff; border: 1px solid #e5e5ea; }

.header-content { display: flex; align-items: center; gap: 24px; }
.streamer-info { flex: 1; }
.streamer-title { font-size: 2rem; font-weight: 700; margin: 0 0 6px; line-height: 1.2; background: linear-gradient(135deg, #7c5cfc, #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.streamer-desc { font-size: 0.95rem; margin-bottom: 14px; }
html.dark .streamer-desc { color: rgba(255,255,255,0.45); }
html:not(.dark) .streamer-desc { color: #888; }

.stats-row { display: flex; gap: 28px; }
.stat-item { display: flex; flex-direction: column; }
.stat-val { font-size: 1.5rem; font-weight: 700; line-height: 1; }
html.dark .stat-val { color: #7c5cfc; }
html:not(.dark) .stat-val { color: #6c5ce7; }
.stat-label { font-size: 0.78rem; margin-top: 4px; }
html.dark .stat-label { color: rgba(255,255,255,0.35); }
html:not(.dark) .stat-label { color: #999; }

.controls-card { border-radius: 16px; padding: 22px; margin-bottom: 24px; transition: background 0.3s, border 0.3s; }
html.dark .controls-card { background: #18181c; border: 1px solid #2a2a30; }
html:not(.dark) .controls-card { background: #fff; border: 1px solid #e5e5ea; }
.controls-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.controls-title { font-size: 1.05rem; font-weight: 600; }

.song-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }

.pagination-bar { display: flex; justify-content: center; align-items: center; gap: 16px; flex-wrap: wrap; margin-top: 24px; padding: 16px; border-radius: 14px; }
html.dark .pagination-bar { background: #18181c; border: 1px solid #2a2a30; }
html:not(.dark) .pagination-bar { background: #fff; border: 1px solid #e5e5ea; }

.empty-state { text-align: center; padding: 60px 20px; }

.floating-actions { position: fixed; bottom: 24px; right: 24px; display: flex; flex-direction: column; gap: 10px; z-index: 1000; }

@media (max-width: 768px) {
  .main-container { padding: 20px 14px 80px; }
  .header-content { flex-direction: column; text-align: center; }
  .stats-row { justify-content: center; }
  .song-grid { grid-template-columns: 1fr; }
  .controls-header { flex-direction: column; gap: 12px; }
  .floating-actions { bottom: 16px; right: 16px; }
}

.animate-in { animation: fadeInUp 0.45s cubic-bezier(0.22,1,0.36,1) both; }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
</style>
