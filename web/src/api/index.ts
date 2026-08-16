import axios, {
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import { clearAccessToken, getAccessToken } from '@/auth/session'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
})

client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  config.headers['X-Client'] = 'web/v1.4.3'
  return config
})

// Response interceptor
client.interceptors.response.use(
  (res: AxiosResponse) => {
    const data = res.data
    if (data.code === 0) {
      return data.data
    }
    console.error('API error:', data.message || 'unknown')
    return Promise.reject(data)
  },
  (err: any) => {
    if (err.response?.status === 401) {
      clearAccessToken()
      if (window.location.pathname !== '/login') {
        const redirect = `${window.location.pathname}${window.location.search}`
        window.location.replace(`/login?redirect=${encodeURIComponent(redirect)}`)
      }
    }
    console.error('Network error:', err.message)
    return Promise.reject(err)
  }
)

interface ApiClient {
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>
  post<T = any>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>
  put<T = any>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>
  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>
}

// 响应拦截器在运行时直接返回 data.data，这个类型描述保持调用端与实际行为一致。
export default client as unknown as ApiClient
