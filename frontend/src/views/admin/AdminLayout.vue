<template>
  <div class="admin-container">
    <div class="sidebar" :class="{ open: sidebarOpen }">
      <div class="sidebar-header">
        <n-button size="small" round @click="$router.push('/')" style="width: 100%;" quaternary>← 返回歌单</n-button>
      </div>
      <div class="sidebar-menu">
        <div v-for="item in menuItems" :key="item.path" class="menu-item" :class="{ active: isActive(item.path) }" @click="navigateTo(item.path)">
          <span class="menu-icon">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </div>
      </div>
      <div class="sidebar-footer">
        <n-button size="small" round @click="handleCycleTheme" quaternary style="width: 100%;">
          {{ themeMode === 'auto' ? '跟随系统' : themeMode === 'dark' ? '深色模式' : '浅色模式' }}
        </n-button>
      </div>
    </div>

    <div class="main-content">
      <n-button class="mobile-menu-toggle" @click="sidebarOpen = !sidebarOpen" circle size="large" quaternary>
        <template #icon><n-icon><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg></n-icon></template>
      </n-button>

      <div class="admin-header animate-in">
        <div>
          <div class="header-title">{{ pageTitle }}</div>
          <div class="header-subtitle">{{ pageSubtitle }}</div>
        </div>
        <div class="admin-actions">
          <n-button @click="handleRefresh" :loading="refreshing" quaternary round size="small">刷新</n-button>
          <n-button @click="handleLogout" quaternary round size="small" type="error">退出</n-button>
        </div>
      </div>

      <router-view ref="childPage" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMessage } from 'naive-ui'
import { useAuth } from '../../composables/useAuth'
import { useSiteSettings } from '../../composables/useSiteSettings'
import { cycleTheme, themeMode } from '../../theme'

const router = useRouter()
const route = useRoute()
const message = useMessage()
const { logout } = useAuth()
const { loadSettings } = useSiteSettings()

const sidebarOpen = ref(false)
const refreshing = ref(false)
const childPage = ref(null)

function handleCycleTheme() { cycleTheme() }

const menuItems = [
  { path: '/admin', label: '数据概览', icon: '📊' },
  { path: '/admin/profile', label: '用户设置', icon: '👤' },
  { path: '/admin/tags', label: '标签管理', icon: '🏷️' },
  { path: '/admin/songs', label: '歌曲管理', icon: '🎵' },
  { path: '/admin/site-settings', label: '站点设置', icon: '🌐' },
  { path: '/admin/security', label: '安全设置', icon: '🔒' }
]

const titleMap = {
  '/admin': ['数据概览', '查看歌单系统的整体数据统计'],
  '/admin/profile': ['用户设置', '管理用户头像、背景和个人信息'],
  '/admin/tags': ['标签管理', '添加、编辑和删除歌曲标签'],
  '/admin/songs': ['歌曲管理', '添加和管理歌单中的歌曲'],
  '/admin/site-settings': ['站点设置', '自定义站点标题和图标'],
  '/admin/security': ['安全设置', '修改管理员登录密钥']
}

const pageTitle = computed(() => (titleMap[route.path] || ['管理后台'])[0])
const pageSubtitle = computed(() => (titleMap[route.path] || ['', ''])[1])
function isActive(path) { return route.path === path }
function navigateTo(path) { router.push(path); sidebarOpen.value = false }
function handleLogout() { logout(); message.success('已退出') }
async function handleRefresh() { refreshing.value = true; if (childPage.value?.refresh) await childPage.value.refresh(); message.success('已刷新'); refreshing.value = false }

onMounted(() => { loadSettings(' - 管理后台') })
</script>

<style scoped>
.admin-container { display: flex; min-height: 100vh; }

.sidebar {
  width: 260px;
  position: fixed;
  height: 100vh;
  overflow-y: auto;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  transition: background 0.3s;
}
html.dark .sidebar { background: #141416; border-right: 1px solid #2a2a30; }
html:not(.dark) .sidebar { background: #fff; border-right: 1px solid #e5e5ea; }

.sidebar-header { padding: 20px 16px; }
.sidebar-menu { flex: 1; padding: 8px 0; }
.sidebar-footer { padding: 16px; }

.menu-item {
  padding: 12px 20px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.22,1,0.36,1);
  border-left: 3px solid transparent;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.95rem;
  margin: 2px 8px;
  border-radius: 10px;
}
html.dark .menu-item { color: rgba(255,255,255,0.55); }
html:not(.dark) .menu-item { color: #666; }

html.dark .menu-item:hover { background: rgba(124,92,252,0.08); color: rgba(255,255,255,0.85); }
html:not(.dark) .menu-item:hover { background: rgba(108,92,231,0.06); color: #333; }

html.dark .menu-item.active { background: rgba(124,92,252,0.14); color: #a78bfa; border-left-color: #7c5cfc; font-weight: 600; }
html:not(.dark) .menu-item.active { background: rgba(108,92,231,0.08); color: #6c5ce7; border-left-color: #6c5ce7; font-weight: 600; }

.menu-icon { font-size: 1.1rem; width: 22px; text-align: center; }

.main-content { flex: 1; margin-left: 260px; padding: 28px; min-height: 100vh; }
html.dark .main-content { background: #0e0e10; }
html:not(.dark) .main-content { background: #f5f5f7; }

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
  padding: 20px 24px;
  border-radius: 14px;
  transition: background 0.3s, border 0.3s;
}
html.dark .admin-header { background: #18181c; border: 1px solid #2a2a30; }
html:not(.dark) .admin-header { background: #fff; border: 1px solid #e5e5ea; }

.header-title { font-size: 1.6rem; font-weight: 700; }
.header-subtitle { font-size: 0.88rem; margin-top: 4px; }
html.dark .header-subtitle { color: rgba(255,255,255,0.38); }
html:not(.dark) .header-subtitle { color: #999; }

.admin-actions { display: flex; gap: 8px; }
.mobile-menu-toggle { display: none; margin-bottom: 16px; }

.animate-in { animation: fadeInUp 0.4s cubic-bezier(0.22,1,0.36,1) both; }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

@media (max-width: 1200px) {
  .sidebar { transform: translateX(-100%); transition: transform 0.3s ease, background 0.3s; }
  .sidebar.open { transform: translateX(0); }
  .main-content { margin-left: 0; padding: 20px; }
  .mobile-menu-toggle { display: block !important; }
}
</style>
