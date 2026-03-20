import router from '../router'

export async function apiCall(url, options = {}) {
  const token = sessionStorage.getItem('admin_token')
  const isFormData = options.body instanceof FormData

  const defaultHeaders = {
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(!isFormData && { 'Content-Type': 'application/json' })
  }

  const finalOptions = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers
    }
  }

  const response = await fetch(url, finalOptions)

  if (response.status === 401) {
    sessionStorage.removeItem('admin_token')
    sessionStorage.removeItem('admin_auth_time')
    router.push('/')
    throw new Error('登录已过期')
  }

  return response
}

export async function login(key) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key })
  })
  return response.json()
}

export async function getSongs(params = {}) {
  const query = new URLSearchParams(params).toString()
  const response = await apiCall(`/api/songs?${query}`)
  return response.json()
}

export async function getSong(id) {
  const response = await apiCall(`/api/songs/${id}`)
  return response.json()
}

export async function createSong(data) {
  const response = await apiCall('/api/songs', {
    method: 'POST',
    body: JSON.stringify(data)
  })
  return response.json()
}

export async function updateSong(id, data) {
  const response = await apiCall(`/api/songs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
  return response.json()
}

export async function deleteSong(id) {
  const response = await apiCall(`/api/songs/${id}`, {
    method: 'DELETE'
  })
  return response.json()
}

export async function getTags() {
  const response = await apiCall('/api/tags')
  return response.json()
}

export async function getTagDetails() {
  const response = await apiCall('/api/tags/details')
  return response.json()
}

export async function createTag(name) {
  const response = await apiCall('/api/tags', {
    method: 'POST',
    body: JSON.stringify({ name })
  })
  return response.json()
}

export async function updateTag(id, name) {
  const response = await apiCall(`/api/tags/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name })
  })
  return response.json()
}

export async function deleteTag(name) {
  const response = await apiCall(`/api/tags/${encodeURIComponent(name)}`, {
    method: 'DELETE'
  })
  return response.json()
}

export async function getProfile() {
  const response = await apiCall('/api/streamer/profile')
  return response.json()
}

export async function updateProfile(data) {
  const response = await apiCall('/api/streamer/profile', {
    method: 'PUT',
    body: JSON.stringify(data)
  })
  return response.json()
}

export async function uploadAvatar(file) {
  const formData = new FormData()
  formData.append('avatar', file)
  const response = await apiCall('/api/streamer/avatar', {
    method: 'POST',
    body: formData
  })
  return response.json()
}

export async function uploadBackground(file) {
  const formData = new FormData()
  formData.append('background', file)
  const response = await apiCall('/api/streamer/background', {
    method: 'POST',
    body: formData
  })
  return response.json()
}

export async function getSiteSettings() {
  const response = await apiCall('/api/site/settings')
  return response.json()
}

export async function updateSiteSettings(data) {
  const response = await apiCall('/api/site/settings', {
    method: 'PUT',
    body: JSON.stringify(data)
  })
  return response.json()
}

export async function uploadFavicon(file) {
  const formData = new FormData()
  formData.append('favicon', file)
  const response = await apiCall('/api/site/favicon', {
    method: 'POST',
    body: formData
  })
  return response.json()
}

export async function deleteFavicon() {
  const response = await apiCall('/api/site/favicon', {
    method: 'DELETE'
  })
  return response.json()
}

export async function resetSiteSettings() {
  const response = await apiCall('/api/site/reset', {
    method: 'POST'
  })
  return response.json()
}

export async function changeAdminKey(currentKey, newKey) {
  const response = await apiCall('/api/auth/change-key', {
    method: 'PUT',
    body: JSON.stringify({ currentKey, newKey })
  })
  return response.json()
}

export async function importExcel(file) {
  const formData = new FormData()
  formData.append('file', file)
  const response = await apiCall('/api/songs/import/excel', {
    method: 'POST',
    body: formData
  })
  return response.json()
}

export async function importImage(file) {
  const formData = new FormData()
  formData.append('file', file)
  const response = await apiCall('/api/songs/import/image', {
    method: 'POST',
    body: formData
  })
  return response.json()
}

export async function confirmOcrImport(songs, selectedIndexes) {
  const response = await apiCall('/api/songs/import/image/confirm', {
    method: 'POST',
    body: JSON.stringify({ songs, selectedIndexes })
  })
  return response.json()
}

export async function downloadTemplate() {
  const response = await fetch('/api/songs/template')
  if (!response.ok) throw new Error('模板下载失败')
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'songlist-template.xlsx'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
