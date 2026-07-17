import axios from 'axios'

const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE })

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('me')
      window.dispatchEvent(new Event('auth:logout'))
    }
    return Promise.reject(err)
  }
)

export default api
