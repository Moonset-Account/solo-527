import request from './request'

export function getPortfolio(params) {
  return request.get('/portfolio', { params })
}

export function getPortfolioItem(id) {
  return request.get(`/portfolio/${id}`)
}

export function createPortfolio(data) {
  return request.post('/portfolio', data)
}

export function updatePortfolio(id, data) {
  return request.put(`/portfolio/${id}`, data)
}

export function deletePortfolio(id) {
  return request.delete(`/portfolio/${id}`)
}

export function uploadPortfolioImage(file) {
  const formData = new FormData()
  formData.append('image', file)
  return request.post('/portfolio/upload-image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}
