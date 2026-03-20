<template>
  <div>
    <div class="form-section">
      <div class="section-title">修改管理密钥</div>
      <n-form label-placement="top">
        <n-form-item label="当前密钥">
          <n-input v-model:value="form.currentKey" type="password" placeholder="请输入当前管理密钥" show-password-on="click" />
        </n-form-item>
        <n-form-item label="新密钥">
          <n-input v-model:value="form.newKey" type="password" placeholder="请输入新管理密钥（至少6位）" show-password-on="click" />
        </n-form-item>
        <n-form-item label="确认新密钥">
          <n-input v-model:value="form.confirmKey" type="password" placeholder="请再次输入新管理密钥" show-password-on="click" />
        </n-form-item>
        <n-form-item>
          <n-button type="primary" @click="handleChange" :loading="changing">修改密钥</n-button>
          <n-button @click="resetForm" style="margin-left: 12px;">重置</n-button>
        </n-form-item>
      </n-form>
      <div class="security-tips">
        <div class="tips-title">安全提示</div>
        <ul style="margin: 0; padding-left: 20px;">
          <li>新密钥长度至少6位，建议使用字母、数字组合</li>
          <li>修改密钥后需要重新登录</li>
          <li>请妥善保管新密钥，遗失后需要服务器管理员重置</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { changeAdminKey } from '../../api'
import { useAuth } from '../../composables/useAuth'

const router = useRouter()
const message = useMessage()
const { logout } = useAuth()

const form = reactive({ currentKey: '', newKey: '', confirmKey: '' })
const changing = ref(false)

function resetForm() {
  form.currentKey = ''
  form.newKey = ''
  form.confirmKey = ''
}

async function handleChange() {
  if (!form.currentKey.trim()) { message.warning('请输入当前管理密钥'); return }
  if (!form.newKey.trim() || form.newKey.length < 6) { message.warning('新密钥长度至少6位'); return }
  if (form.newKey.trim() !== form.confirmKey.trim()) { message.warning('两次输入的新密钥不一致'); return }
  changing.value = true
  try {
    const data = await changeAdminKey(form.currentKey, form.newKey)
    if (data.success) {
      message.success('管理密钥修改成功！请重新登录。')
      setTimeout(() => { logout() }, 1500)
    } else message.error(data.error || '修改失败')
  } catch (e) { message.error('修改失败: ' + e.message) }
  finally { changing.value = false }
}
</script>

<style scoped>
.security-tips { margin-top: 20px; padding: 15px; border-radius: 10px; font-size: 14px; transition: background 0.3s; }
html.dark .security-tips { background: #1e1e24; color: rgba(255,255,255,0.5); }
html:not(.dark) .security-tips { background: #f9f9f9; color: #666; }
.tips-title { font-weight: 500; margin-bottom: 8px; }
html.dark .tips-title { color: rgba(255,255,255,0.72); }
html:not(.dark) .tips-title { color: #333; }
</style>
