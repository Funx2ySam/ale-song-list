<template>
  <div>
    <div class="form-section">
      <div class="section-title">头像设置</div>
      <div style="display: flex; gap: 20px; align-items: flex-start;">
        <div v-if="form.avatar" style="flex-shrink: 0;">
          <div class="label">当前头像</div>
          <div class="preview-box">
            <img :src="form.avatar" alt="当前头像" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover;" />
          </div>
        </div>
        <div style="flex: 1;">
          <div class="label">上传新头像</div>
          <FileUpload label="点击或拖拽上传头像" hint="支持 JPG、PNG 格式，建议尺寸 300x300" @file-selected="handleAvatarUpload" />
        </div>
      </div>
    </div>

    <div class="form-section">
      <div class="section-title">背景图设置</div>
      <div style="display: flex; gap: 20px; align-items: flex-start;">
        <div v-if="form.background" style="flex-shrink: 0;">
          <div class="label">当前背景</div>
          <div class="preview-box">
            <img :src="form.background" alt="当前背景图" style="width: 200px; height: 120px; border-radius: 6px; object-fit: cover;" />
          </div>
        </div>
        <div style="flex: 1;">
          <div class="label">上传新背景</div>
          <FileUpload label="点击或拖拽上传背景图" hint="支持 JPG、PNG 格式，建议尺寸 1920x1080" @file-selected="handleBackgroundUpload" />
        </div>
      </div>
    </div>

    <div class="form-section">
      <div class="section-title">基本信息</div>
      <n-form :model="form" label-placement="top">
        <n-form-item label="用户名称">
          <n-input v-model:value="form.name" placeholder="请输入用户名称" />
        </n-form-item>
        <n-form-item label="个人简介">
          <n-input v-model:value="form.description" type="textarea" placeholder="请输入个人简介" :rows="4" />
        </n-form-item>
        <n-form-item>
          <n-button type="primary" @click="saveProfile" :loading="saving">保存设置</n-button>
        </n-form-item>
      </n-form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useMessage } from 'naive-ui'
import { getProfile, updateProfile, uploadAvatar, uploadBackground } from '../../api'
import FileUpload from '../../components/FileUpload.vue'

const message = useMessage()
const form = ref({ name: '', description: '', avatar: '', background: '' })
const saving = ref(false)

async function load() {
  try {
    const data = await getProfile()
    if (data.success) {
      form.value = {
        name: data.data.name || '',
        description: data.data.description || '',
        avatar: data.data.avatar || '',
        background: data.data.background || ''
      }
    }
  } catch {}
}

async function handleAvatarUpload(file) {
  try {
    const data = await uploadAvatar(file)
    if (data.success) { form.value.avatar = data.avatar; message.success('头像上传成功') }
    else message.error(data.error || '头像上传失败')
  } catch (e) { if (e.message !== '登录已过期') message.error('头像上传失败') }
}

async function handleBackgroundUpload(file) {
  try {
    const data = await uploadBackground(file)
    if (data.success) { form.value.background = data.background_url; message.success('背景图上传成功') }
    else message.error(data.error || '背景图上传失败')
  } catch (e) { if (e.message !== '登录已过期') message.error('背景图上传失败') }
}

async function saveProfile() {
  if (!form.value.name.trim()) { message.warning('请输入用户名称'); return }
  saving.value = true
  try {
    const data = await updateProfile({ name: form.value.name, description: form.value.description })
    if (data.success) message.success('用户信息保存成功')
    else message.error(data.error || '保存失败')
  } catch (e) { if (e.message !== '登录已过期') message.error('保存失败') }
  finally { saving.value = false }
}

async function refresh() { await load() }
defineExpose({ refresh })
onMounted(load)
</script>

<style scoped>
.label { margin-bottom: 8px; font-weight: 500; }
html.dark .label { color: rgba(255,255,255,0.5); }
html:not(.dark) .label { color: #666; }
.preview-box { border-radius: 10px; padding: 10px; transition: background 0.3s, border-color 0.3s; }
html.dark .preview-box { background: #1e1e24; border: 1px solid #2a2a30; }
html:not(.dark) .preview-box { background: #f8f9fa; border: 1px solid #e5e5ea; }
</style>
