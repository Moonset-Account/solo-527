import request from '@/utils/request'
import axios from 'axios'

export function getApiLogPage(params) {
  return request({
    url: '/api-log/page',
    method: 'get',
    params
  })
}

export function getApiLogDetail(id) {
  return request({
    url: `/api-log/${id}`,
    method: 'get'
  })
}

export function getRetryList() {
  return request({
    url: '/api-log/retry/list',
    method: 'get'
  })
}

export function markForRetry(id) {
  return request({
    url: `/api-log/retry/mark/${id}`,
    method: 'post'
  })
}

export function retryApiLog(id) {
  return request({
    url: `/api-log/retry/${id}`,
    method: 'post'
  })
}

export function updateRetryResult(id, resultDTO) {
  return request({
    url: `/api-log/retry/${id}/result`,
    method: 'post',
    data: resultDTO
  })
}

export function exportApiLog(params) {
  return request({
    url: '/api-log/export',
    method: 'get',
    params,
    responseType: 'blob'
  })
}

export function executeRetryRequest(apiPath, apiMethod, requestParams) {
  let body = null
  if (requestParams && ['POST', 'PUT'].includes(apiMethod?.toUpperCase())) {
    try {
      const parsed = JSON.parse(requestParams)
      if (Array.isArray(parsed) && parsed.length > 0) {
        const first = parsed[0]
        if (first !== null && typeof first === 'object') {
          body = first
        }
      }
    } catch (e) {
      // ignore
    }
  }

  const method = (apiMethod || 'GET').toLowerCase()
  const url = '/api' + apiPath

  const config = {
    method,
    url,
    timeout: 30000
  }

  const token = localStorage.getItem('token')
  if (token) {
    config.headers = { Authorization: token }
  }

  if (body) {
    config.data = body
  }

  return axios.request(config)
}
