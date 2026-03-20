<template>
  <div>
    <div class="form-section">
      <div class="section-title">站点标题设置</div>
      <n-form label-placement="top">
        <n-form-item label="站点标题">
          <n-input v-model:value="form.site_title" placeholder="请输入站点标题" clearable />
        </n-form-item>
        <n-form-item>
          <n-space>
            <n-button type="primary" @click="handleUpdateTitle" :loading="form.titleLoading">更新标题</n-button>
            <n-button @click="handleReset" :loading="form.resetLoading">重置为默认值</n-button>
          </n-space>
        </n-form-item>
      </n-form>
      <n-alert v-if="siteDefaults" type="info" title="环境变量配置" style="margin-top: 16px;">
        <p>通过环境变量可以配置默认的站点设置：</p>
        <ul style="margin: 8px 0; padding-left: 20px;">
          <li><code>SITE_TITLE</code>: 默认站点标题 (当前: {{ siteDefaults.title }})</li>
          <li><code>SITE_FAVICON</code>: 默认站点图标</li>
          <li><code>ADMIN_TITLE_SUFFIX</code>: 管理后台标题后缀 (当前: {{ siteDefaults.adminSuffix }})</li>
        </ul>
      </n-alert>
    </div>

    <div class="form-section">
      <div class="section-title">站点图标设置</div>
      <div v-if="siteFavicon" style="margin-bottom: 16px;">
        <div class="label">当前图标</div>
        <div class="favicon-preview-box">
          <img :src="siteFavicon" alt="当前图标" style="width: 32px; height: 32px;" />
          <n-button type="error" size="small" @click="handleDeleteFavicon" :loading="form.deleteLoading" style="margin-left: 10px;">删除图标</n-button>
        </div>
      </div>
      <div>
        <div class="label">上传新图标</div>
        <input ref="faviconInput" type="file" accept="image/*" @change="handleFaviconUpload" style="display: none;" />
        <n-button type="primary" @click="$refs.faviconInput.click()" :loading="form.uploadLoading">选择图标文件</n-button>
        <div class="upload-hint">支持 PNG、JPG、ICO、SVG 格式，建议尺寸 32x32px</div>
      </div>
    </div>

    <div class="form-section">
      <div class="section-title">预览效果</div>
      <div class="browser-preview">
        <div class="browser-tab">
          <img v-if="siteFavicon" :src="siteFavicon" style="width: 16px; height: 16px; margin-right: 8px;" />
          <span v-else style="font-size: 16px; margin-right: 8px;">🌐</span>
          <span class="tab-title">{{ form.site_title || '歌单系统' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useMessage, useDialog } from 'naive-ui'
import { useSiteSettings } from '../../composables/useSiteSettings'
import * as api from '../../api'

const message = useMessage()
const dialog = useDialog()
const { siteTitle, siteFavicon, siteDefaults, loadSettings, updateTitle, updateFavicon } = useSiteSettings()

const form = reactive({ site_title: '', titleLoading: false, uploadLoading: false, deleteLoading: false, resetLoading: false })
const faviconInput = ref(null)

async function load() {
  await loadSettings(' - 管理后台')
  form.site_title = siteTitle.value
}

async function handleUpdateTitle() {
  if (!form.site_title.trim()) { message.error('站点标题不能为空'); return }
  form.titleLoading = true
  try {
    const data = await api.updateSiteSettings({ site_title: form.site_title })
    if (data.success) { updateTitle(form.site_title, ' - 管理后台'); message.success('站点标题更新成功') }
    else message.error(data.message || '更新失败')
  } catch (e) { if (e.message !== '登录已过期') message.error('更新失败') }
  finally { form.titleLoading = false }
}

async function handleFaviconUpload(event) {
  const file = event.target.files[0]
  if (!file) return
  form.uploadLoading = true
  try {
    const data = await api.uploadFavicon(file)
    if (data.success) { updateFavicon(data.data.favicon_url); message.success('站点图标上传成功') }
    else message.error(data.message || '上传失败')
  } catch (e) { if (e.message !== '登录已过期') message.error('上传失败') }
  finally { form.uploadLoading = false; event.target.value = '' }
}

async function handleDeleteFavicon() {
  form.deleteLoading = true
  try {
    const data = await api.deleteFavicon()
    if (data.success) { updateFavicon(null); message.success('站点图标删除成功') }
    else message.error(data.message || '删除失败')
  } catch (e) { if (e.message !== '登录已过期') message.error('删除失败') }
  finally { form.deleteLoading = false }
}

async function handleReset() {
  const confirmed = await new Promise(resolve => {
    dialog.warning({
      title: '确认重置',
      content: '是否重置站点设置为环境变量默认值？',
      positiveText: '确认重置',
      negativeText: '取消',
      onPositiveClick: () => resolve(true),
      onNegativeClick: () => resolve(false)
    })
  })
  if (!confirmed) return
  form.resetLoading = true
  try {
    const data = await api.resetSiteSettings()
    if (data.success) {
      form.site_title = data.data.site_title
      updateTitle(data.data.site_title, ' - 管理后台')
      updateFavicon(data.data.site_favicon)
      message.success('站点设置已重置为默认值')
    } else message.error(data.message || '重置失败')
  } catch { message.error('重置失败') }
  finally { form.resetLoading = false }
}

async function refresh() { await load() }
defineExpose({ refresh })
onMounted(load)
</script>

<style scoped>
.label { margin-bottom: 8px; font-weight: 500; }
html.dark .label { color: rgba(255,255,255,0.5); }
html:not(.dark) .label { color: #333; }
.upload-hint { margin-top: 8px; font-size: 0.85rem; }
html.dark .upload-hint { color: rgba(255,255,255,0.38); }
html:not(.dark) .upload-hint { color: #666; }
.favicon-preview-box { display: flex; align-items: center; padding: 12px; border-radius: 10px; transition: background 0.3s; }
html.dark .favicon-preview-box { background: #1e1e24; }
html:not(.dark) .favicon-preview-box { background: #f8f9fa; }
.browser-preview { border-radius: 10px; padding: 8px; transition: background 0.3s, border-color 0.3s; }
html.dark .browser-preview { background: #1e1e24; border: 1px solid #2a2a30; }
html:not(.dark) .browser-preview { background: #f8f9fa; border: 1px solid #e5e5ea; }
.browser-tab { display: flex; align-items: center; border-radius: 6px; padding: 8px 12px; max-width: 200px; transition: background 0.3s, border-color 0.3s; }
html.dark .browser-tab { background: #28282e; border: 1px solid #3a3a42; }
html:not(.dark) .browser-tab { background: #fff; border: 1px solid #d0d0d0; }
.tab-title { font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
</style>
