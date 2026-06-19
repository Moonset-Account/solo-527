import request from '@/utils/request'

export function getMyTodoList() {
  return request({
    url: '/todos/my',
    method: 'get'
  })
}

export function createTodo(data) {
  return request({
    url: '/todos',
    method: 'post',
    data
  })
}

export function completeTodo(id) {
  return request({
    url: `/todos/${id}/complete`,
    method: 'put'
  })
}

export function updateTodoStatus(id, status) {
  return request({
    url: `/todos/${id}/status`,
    method: 'put',
    params: { status }
  })
}
