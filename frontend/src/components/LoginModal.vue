<template>
  <n-modal :show="show" preset="dialog" title="管理员登录" @update:show="$emit('update:show', $event)">
    <template #default>
      <n-input
        v-model:value="adminKey"
        type="password"
        placeholder="请输入管理密钥"
        show-password-on="click"
        @keyup.enter="handleLogin"
      />
    </template>
    <template #action>
      <n-space>
        <n-button @click="$emit('update:show', false)">取消</n-button>
        <n-button type="primary" @click="handleLogin" :loading="loading">确认</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup>
import { ref } from 'vue'
import { useMessage } from 'naive-ui'
import { useAuth } from '../composables/useAuth'

const props = defineProps({
  show: { type: Boolean, default: false }
})
const emit = defineEmits(['update:show', 'login-success'])

const message = useMessage()
const { login } = useAuth()
const adminKey = ref('')
const loading = ref(false)

async function handleLogin() {
  if (!adminKey.value.trim()) {
    message.error('请输入管理密钥')
    return
  }
  loading.value = true
  try {
    const data = await login(adminKey.value)
    if (data.success) {
      emit('update:show', false)
      message.success('登录成功！即将跳转到管理后台...')
      adminKey.value = ''
      emit('login-success')
    } else {
      message.error(data.error || '登录失败')
      adminKey.value = ''
    }
  } catch (error) {
    message.error('登录失败，请检查网络连接')
    adminKey.value = ''
  } finally {
    loading.value = false
  }
}
</script>
