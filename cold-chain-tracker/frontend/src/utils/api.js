import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use(config => {
  return config
}, error => Promise.reject(error))

api.interceptors.response.use(response => {
  const data = response.data
  if (data.code && data.code !== 200) {
    return Promise.reject(new Error(data.message || '请求失败'))
  }
  return data
}, error => {
  console.error('API错误:', error.message)
  return Promise.reject(error)
})

export function buildQuery(params) {
  const query = {}
  for (const [key, val] of Object.entries(params || {})) {
    if (val !== null && val !== undefined && val !== '' && !(Array.isArray(val) && val.length === 0)) {
      query[key] = Array.isArray(val) ? val.join(',') : val
    }
  }
  return query
}

export default api
