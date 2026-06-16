
import axios from 'axios'

const request = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

request.interceptors.response.use(
  response =&gt; {
    return response.data
  },
  error =&gt; {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

export default request
