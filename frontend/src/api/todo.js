import request from '@/utils/request'

export function getTodoPage(params) {
  return request({
    url: '/todo-task/page',
    method: 'get',
    params
  })
}

export function getMyTodoList(params) {
  return request({
    url: '/todo-task/my',
    method: 'get',
    params
  })
}

export function getTodoGroupByAssignee() {
  return request({
    url: '/todo-task/group-by-assignee',
    method: 'get'
  })
}

export function getTodoById(id) {
  return request({
    url: `/todo-task/${id}`,
    method: 'get'
  })
}

export function createTodo(data) {
  return request({
    url: '/todo-task',
    method: 'post',
    data
  })
}

export function completeTodo(id, remark) {
  return request({
    url: `/todo-task/${id}/complete`,
    method: 'put',
    params: { remark }
  })
}

export function cancelTodo(id, remark) {
  return request({
    url: `/todo-task/${id}/cancel`,
    method: 'put',
    params: { remark }
  })
}
