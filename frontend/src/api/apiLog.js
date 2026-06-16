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

export function executeRetryRequest(apiPath, apiMethod, requestParams, queryParams) {
  const method = (apiMethod || 'GET').toUpperCase()

  let finalUrl = apiPath
  let body = null
  const params = {}

  if (queryParams && (method === 'GET' || method === 'DELETE')) {
    try {
      const parsed = typeof queryParams === 'string' ? JSON.parse(queryParams) : queryParams
      Object.assign(params, parsed)
    } catch (e) {
      // ignore
    }
  }

  if (requestParams && (method === 'POST' || method === 'PUT')) {
    try {
      const parsed = typeof requestParams === 'string' ? JSON.parse(requestParams) : requestParams
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

  const config = {
    method: method.toLowerCase(),
    url: finalUrl,
    timeout: 30000
  }

  const token = localStorage.getItem('token')
  if (token) {
    config.headers = { Authorization: token }
  }

  if (Object.keys(params).length > 0) {
    config.params = params
  }

  if (body) {
    config.data = body
  }

  return axios.request(config)
}
