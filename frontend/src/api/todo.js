import request from './index'

export function createTodo(data) {
  return request.post('/todos', data)
}

export function updateTodo(id, data) {
  return request.put(`/todos/${id}`, data)
}

export function completeTodo(id) {
  return request.put(`/todos/${id}/complete`)
}

export function getTodosByUser(params) {
  return request.get('/todos/user', { params })
}

export function getTodosByRequirement(requirementId) {
  return request.get(`/todos/requirement/${requirementId}`)
}

export function getTodos(params) {
  return request.get('/todos', { params })
}
