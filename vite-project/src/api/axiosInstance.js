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

axiosInstance.interceptors.request.use(
  config => {
    notifyApiLoading(true)
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
    if (status === 401 || (status === 403 && /disabled|blocked|company account|inactive/i.test(message))) {
      localStorage.removeItem('auth')
      delete axiosInstance.defaults.headers.common.Authorization
      if (window.location.pathname !== '/login') window.location.assign('/login')
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
