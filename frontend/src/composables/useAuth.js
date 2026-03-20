import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { login as apiLogin } from '../api'

const TOKEN_KEY = 'admin_token'
const AUTH_TIME_KEY = 'admin_auth_time'
const TOKEN_TTL = 24 * 60 * 60 * 1000

export function useAuth() {
  const router = useRouter()

  function getToken() {
    return sessionStorage.getItem(TOKEN_KEY)
  }

  function isAuthenticated() {
    const token = getToken()
    const authTime = sessionStorage.getItem(AUTH_TIME_KEY)
    if (!token || !authTime) return false
    return Date.now() - parseInt(authTime) < TOKEN_TTL
  }

  async function login(key) {
    const data = await apiLogin(key)
    if (data.success) {
      sessionStorage.setItem(TOKEN_KEY, data.token)
      sessionStorage.setItem(AUTH_TIME_KEY, Date.now().toString())
    }
    return data
  }

  function logout() {
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(AUTH_TIME_KEY)
    router.push('/')
  }

  return { getToken, isAuthenticated, login, logout }
}
