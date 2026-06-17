import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import router from '@/router'

const request = axios.create({
  baseURL: '/api',
  timeout: 30000
})

request.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

request.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res.success === false) {
      handleErrorResponse(res)
      return Promise.reject(res)
    }
    return res
  },
  (error) => {
    const status = error.response?.status
    if (status === 401) {
      ElMessage.error('登录已过期，请重新登录')
    } else if (status >= 500) {
      ElMessageBox.confirm(
        '服务器繁忙，请选择操作方式',
        '请求失败',
        {
          confirmButtonText: '重试',
          cancelButtonText: '跳过',
          distinguishCancelAndClose: true,
          type: 'warning'
        }
      ).then(() => {
        window.location.reload()
      }).catch(() => {})
    } else {
      ElMessage.error(error.message || '网络错误')
    }
    return Promise.reject(error)
  }
)

function handleErrorResponse(res) {
  const action = res.action
  if (action) {
    const actionMap = {
      RETRY: () => {
        ElMessageBox.confirm(
          `${res.message}，是否重试？`,
          '操作提示',
          {
            confirmButtonText: '重试',
            cancelButtonText: '取消',
            type: 'warning'
          }
        ).then(() => {
          window.location.reload()
        }).catch(() => {})
      },
      SKIP: () => {
        ElMessage({
          message: res.message,
          type: 'warning',
          duration: 3000
        })
      },
      CONTACT_ADMIN: () => {
        ElMessageBox.alert(
          res.message,
          '请联系管理员',
          {
            confirmButtonText: '确定',
            type: 'error'
          }
        )
      }
    }
    if (actionMap[action.type]) {
      actionMap[action.type]()
    } else {
      ElMessage.error(res.message)
    }
  } else {
    ElMessage.error(res.message || '请求失败')
  }
}

export function createRetryableRequest(fn, maxRetries = 3) {
  return async function (...args) {
    let lastError
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn(...args)
      } catch (error) {
        lastError = error
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
        }
      }
    }
    throw lastError
  }
}

export default request
