import request from '@/utils/request'

export function createExpense(workOrderId, expenseType, amount, description, payerId) {
  return request({
    url: '/expenses',
    method: 'post',
    params: { workOrderId, expenseType, amount, description, payerId }
  })
}

export function payExpense(id, payMethod) {
  return request({
    url: `/expenses/${id}/pay`,
    method: 'post',
    params: { payMethod }
  })
}

export function getExpensePage(params) {
  return request({
    url: '/expenses',
    method: 'get',
    params
  })
}
