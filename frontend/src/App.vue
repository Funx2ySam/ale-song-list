<template>
  <n-config-provider :theme="naiveTheme" :theme-overrides="themeOverrides">
    <n-message-provider>
      <n-dialog-provider>
        <router-view />
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup>
import { watch } from 'vue'
import { themeOverrides, naiveTheme, isDark, useSystemThemeListener } from './theme'

useSystemThemeListener()

watch(isDark, (dark) => {
  document.documentElement.classList.toggle('dark', dark)
}, { immediate: true })
</script>
