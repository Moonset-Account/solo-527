import request from '@/utils/request'

export function getMyDepositAccount() {
  return request({
    url: '/deposits/accounts/my_account/',
    method: 'get'
  })
}

export function getMyTransactions() {
  return request({
    url: '/deposits/transactions/my_transactions/',
    method: 'get'
  })
}

export function appealTransaction(id, data) {
  return request({
    url: `/deposits/transactions/${id}/appeal/`,
    method: 'post',
    data
  })
}

export function getDepositAccounts(params) {
  return request({
    url: '/deposits/accounts/',
    method: 'get',
    params
  })
}

export function getTransactions(params) {
  return request({
    url: '/deposits/transactions/',
    method: 'get',
    params
  })
}

export function resolveAppeal(id, data) {
  return request({
    url: `/deposits/transactions/${id}/resolve_appeal/`,
    method: 'post',
    data
  })
}

export function confirmTransaction(id) {
  return request({
    url: `/deposits/transactions/${id}/confirm/`,
    method: 'post'
  })
}
