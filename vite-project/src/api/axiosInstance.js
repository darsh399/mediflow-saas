import axios from 'axios'
import { notifyApiLoading } from '../components/GlobalLoader'

// In development, connect directly to the local API. This avoids an outdated
// Vite proxy process forwarding requests to a different backend instance.
const baseURL = import.meta.env.DEV
  ? 'http://127.0.0.1:3000'
  : (import.meta.env.VITE_API_URL || 'http://localhost:3000')

const axiosInstance = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Accept': 'application/json'
  }
})

let refreshPromise = null

function clearClientSession() {
  localStorage.removeItem('auth')
  delete axiosInstance.defaults.headers.common.Authorization
  window.dispatchEvent(new CustomEvent('mediflow:auth-failed'))
  const loginPath = window.location.pathname.startsWith('/superadmin') ? '/superadmin/login' : '/login'
  if (window.location.pathname !== loginPath) window.location.assign(loginPath)
}

function storeRefreshedToken(token, user) {
  setAuthToken(token)
  try {
    const current = JSON.parse(localStorage.getItem('auth') || '{}')
    localStorage.setItem('auth', JSON.stringify({ ...current, token, user: user || current.user, isAuthenticated: true, sessionValidated: true }))
  } catch (storageError) { void storageError }
  window.dispatchEvent(new CustomEvent('mediflow:token-refreshed', { detail: { token, user } }))
}

function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = axiosInstance.post('/api/auth/refresh-token', {}, { _skipAuthRefresh: true, headers: { Authorization: undefined } })
      .then(response => {
        const { token, user } = response.data || {}
        if (!token) throw new Error('Refresh response did not include an access token')
        storeRefreshedToken(token, user)
        return token
      })
      .finally(() => { refreshPromise = null })
  }
  return refreshPromise
}

axiosInstance.interceptors.request.use(
  config => {
    notifyApiLoading(true)
    // Defensive fallback: normally the Authorization header comes from
    // axiosInstance.defaults.headers.common (set once at bootstrap/login),
    // but a dev-server hot-reload of this module can reset that default
    // without re-running the bootstrap code. Re-attach from localStorage
    // whenever the header is missing, unless a caller explicitly cleared it
    // (the refresh-token call passes `Authorization: undefined` on purpose).
    const hasExplicitAuthHeader = config.headers && Object.prototype.hasOwnProperty.call(config.headers, 'Authorization')
    if (!hasExplicitAuthHeader && !axiosInstance.defaults.headers.common.Authorization && !config._skipAuthRefresh) {
      try {
        const stored = JSON.parse(localStorage.getItem('auth') || '{}')
        if (stored?.token) {
          config.headers = config.headers || {}
          config.headers.Authorization = `Bearer ${stored.token}`
        }
      } catch (storageError) { void storageError }
    }
    return config
  },
  error => {
    notifyApiLoading(false)
    return Promise.reject(error)
  }
)

axiosInstance.interceptors.response.use(
  response => {
    notifyApiLoading(false)
    return response
  },
  error => {
    notifyApiLoading(false)
    const status = error.response?.status
    const message = error.response?.data?.message || ''
    const config = error.config || {}
    const isAuthEndpoint = /\/api\/(auth\/refresh-token|login|logout)/.test(config.url || '')
    if (status === 401 && !config._retry && !config._skipAuthRefresh && !isAuthEndpoint) {
      config._retry = true
      return refreshAccessToken()
        .then(token => {
          config.headers = config.headers || {}
          config.headers.Authorization = `Bearer ${token}`
          return axiosInstance(config)
        })
        .catch(refreshError => {
          clearClientSession()
          return Promise.reject(refreshError)
        })
    }
    // Only force a full logout for the specific messages authMiddleware/
    // companyMiddleware send when the *account or company itself* is
    // blocked/suspended — not any 403 that happens to mention "disabled",
    // which also matches moduleMiddleware's unrelated "this module is
    // disabled for your company" (a feature-flag response, not an auth
    // failure) and was wrongly logging users out of features their plan
    // simply doesn't include.
    const isAccountBlockedMessage = /^account is disabled or blocked$/i.test(message) || /^company account is/i.test(message)
    if ((status === 401 && !isAuthEndpoint) || (status === 403 && isAccountBlockedMessage)) {
      clearClientSession()
    }
    return Promise.reject(error)
  }
)

// attach token if provided via store (to be wired in app)
export function setAuthToken(token) {
  if (token) axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`
  else delete axiosInstance.defaults.headers.common['Authorization']
}

export default axiosInstance
