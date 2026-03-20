import { ref, onMounted } from 'vue'
import { getSiteSettings as fetchSiteSettings } from '../api'

const DEFAULT_FAVICON = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iNCIgZmlsbD0iIzY2N2VlYSIvPgo8cGF0aCBkPSJNOCAxMGg2djJIOHYtMnptMCA0aDZ2Mkg4di0yem0wIDRoNHYySDB2LTJ6bTEwLThIMjZ2MkgxOFY2em0wIDRoOHYySDE4di0yem0wIDRoNnYySDE4di0yeiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+'

const siteTitle = ref('歌单系统')
const siteFavicon = ref('')
const siteDefaults = ref(null)

function applyFavicon(url) {
  const existing = document.querySelector('link[rel="icon"]')
  if (existing) existing.remove()
  const link = document.createElement('link')
  link.rel = 'icon'
  link.type = 'image/x-icon'
  link.href = url || DEFAULT_FAVICON
  document.head.appendChild(link)
}

function applyTitle(title, suffix = '') {
  document.title = title + suffix
}

export function useSiteSettings() {
  async function loadSettings(titleSuffix = '') {
    try {
      const data = await fetchSiteSettings()
      if (data.success) {
        siteTitle.value = data.data.site_title
        siteFavicon.value = data.data.site_favicon
        siteDefaults.value = data.data._defaults
        applyTitle(siteTitle.value, titleSuffix)
        applyFavicon(siteFavicon.value)
      }
    } catch {
      applyTitle('歌单系统', titleSuffix)
      applyFavicon(DEFAULT_FAVICON)
    }
  }

  function updateTitle(title, suffix = '') {
    siteTitle.value = title
    applyTitle(title, suffix)
  }

  function updateFavicon(url) {
    siteFavicon.value = url
    applyFavicon(url)
  }

  return {
    siteTitle,
    siteFavicon,
    siteDefaults,
    loadSettings,
    updateTitle,
    updateFavicon
  }
}
