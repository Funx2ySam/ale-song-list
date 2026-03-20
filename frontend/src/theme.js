import { ref, computed, watch, onMounted } from 'vue'
import { darkTheme } from 'naive-ui'

const THEME_KEY = 'theme-mode'

export const themeMode = ref(loadSavedTheme())

function loadSavedTheme() {
  const saved = localStorage.getItem(THEME_KEY)
  if (saved === 'light' || saved === 'dark') return saved
  return 'auto'
}

function getSystemDark() {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true
}

export const isDark = computed(() => {
  if (themeMode.value === 'dark') return true
  if (themeMode.value === 'light') return false
  return getSystemDark()
})

export const naiveTheme = computed(() => isDark.value ? darkTheme : null)

export function setThemeMode(mode) {
  themeMode.value = mode
  localStorage.setItem(THEME_KEY, mode)
}

export function cycleTheme() {
  const order = ['auto', 'dark', 'light']
  const i = order.indexOf(themeMode.value)
  setThemeMode(order[(i + 1) % order.length])
}

export function useSystemThemeListener() {
  onMounted(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => { if (themeMode.value === 'auto') themeMode.value = 'auto' }
    mq.addEventListener?.('change', handler)
  })
}

const accent = '#7c5cfc'
const accentHover = '#6a4de6'
const accentPressed = '#5a3dd0'

export const darkOverrides = {
  common: {
    primaryColor: accent,
    primaryColorHover: accentHover,
    primaryColorPressed: accentPressed,
    bodyColor: '#0e0e10',
    cardColor: '#18181c',
    modalColor: '#1e1e24',
    popoverColor: '#1e1e24',
    tableColor: '#18181c',
    inputColor: '#1e1e24',
    actionColor: '#1e1e24',
    borderColor: '#2a2a30',
    dividerColor: '#2a2a30',
    hoverColor: 'rgba(124,92,252,0.08)',
    textColor1: 'rgba(255,255,255,0.92)',
    textColor2: 'rgba(255,255,255,0.72)',
    textColor3: 'rgba(255,255,255,0.42)',
    placeholderColor: 'rgba(255,255,255,0.30)',
    borderRadius: '10px',
    borderRadiusSmall: '8px',
    infoColor: '#5b9eff',
    infoColorHover: '#4b8ef0',
    successColor: '#4ade80',
    successColorHover: '#22c55e',
    warningColor: '#fbbf24',
    warningColorHover: '#f59e0b',
    errorColor: '#f87171',
    errorColorHover: '#ef4444'
  },
  Card: {
    color: '#18181c',
    colorEmbedded: '#18181c',
    borderColor: '#2a2a30',
    borderRadius: '14px'
  },
  Button: {
    colorPrimary: accent,
    colorPrimaryHover: accentHover,
    colorPrimaryPressed: accentPressed,
    borderRadiusMedium: '10px',
    borderRadiusSmall: '8px'
  },
  Input: {
    color: '#1e1e24',
    colorFocus: '#1e1e24',
    border: '1px solid #2a2a30',
    borderHover: `1px solid ${accent}`,
    borderFocus: `1px solid ${accent}`,
    boxShadowFocus: `0 0 0 2px rgba(124,92,252,0.25)`,
    borderRadius: '10px'
  },
  Tag: {
    colorPrimary: accent,
    textColorPrimary: '#fff',
    borderRadiusMedium: '20px',
    borderRadiusSmall: '16px'
  },
  Modal: {
    color: '#1e1e24',
    borderRadius: '16px'
  },
  Pagination: {
    itemBorderRadius: '8px'
  }
}

export const lightOverrides = {
  common: {
    primaryColor: '#6c5ce7',
    primaryColorHover: '#5a4bd6',
    primaryColorPressed: '#4a3bc0',
    bodyColor: '#f5f5f7',
    cardColor: '#ffffff',
    borderColor: '#e5e5ea',
    dividerColor: '#e5e5ea',
    borderRadius: '10px',
    borderRadiusSmall: '8px',
    infoColor: '#3b82f6',
    successColor: '#22c55e',
    warningColor: '#f59e0b',
    errorColor: '#ef4444'
  },
  Card: {
    color: '#ffffff',
    borderColor: '#e5e5ea',
    borderRadius: '14px'
  },
  Button: {
    borderRadiusMedium: '10px',
    borderRadiusSmall: '8px'
  },
  Input: {
    borderRadius: '10px'
  },
  Tag: {
    borderRadiusMedium: '20px',
    borderRadiusSmall: '16px'
  },
  Modal: {
    borderRadius: '16px'
  },
  Pagination: {
    itemBorderRadius: '8px'
  }
}

export const themeOverrides = computed(() => isDark.value ? darkOverrides : lightOverrides)
