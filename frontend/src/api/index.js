import request from './request'

export const authApi = {
  login: data => request.post('/auth/login', data),
  getMe: () => request.get('/auth/me')
}

export const externalApi = {
  submitArtwork: data => request.post('/external/artworks', data),
  getClays: () => request.get('/external/clays'),
  getGlazes: () => request.get('/external/glazes'),
  getArtwork: id => request.get(`/external/artworks/${id}`)
}

export const artworkApi = {
  create: data => request.post('/artworks', data),
  review: (id, data) => request.post(`/artworks/${id}/review`, data),
  assign: (id, kilnRunId) => request.post(`/artworks/${id}/assign?kilnRunId=${kilnRunId}`),
  withdraw: id => request.post(`/artworks/${id}/withdraw`),
  list: params => request.get('/artworks', { params }),
  get: id => request.get(`/artworks/${id}`),
  getByKilnRun: kilnRunId => request.get(`/artworks/kiln-run/${kilnRunId}`)
}

export const kilnRunApi = {
  create: data => request.post('/kiln-runs', data),
  approve: id => request.post(`/kiln-runs/${id}/approve`),
  withdraw: id => request.post(`/kiln-runs/${id}/withdraw`),
  start: id => request.post(`/kiln-runs/${id}/start`),
  complete: id => request.post(`/kiln-runs/${id}/complete`),
  list: params => request.get('/kiln-runs', { params }),
  get: id => request.get(`/kiln-runs/${id}`),
  export: id => {
    window.open(`/api/kiln-runs/${id}/export`, '_blank')
  }
}

export const kilnOutRecordApi = {
  create: data => request.post('/kiln-out-records', data),
  uploadPhoto: (formData) => request.post('/kiln-out-records/photos', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  list: params => request.get('/kiln-out-records', { params }),
  get: id => request.get(`/kiln-out-records/${id}`),
  getArtworkPhotos: artworkId => request.get(`/kiln-out-records/artwork/${artworkId}/photos`)
}

export const damageClaimApi = {
  create: data => request.post('/damage-claims', data),
  process: (id, approved, notes) => 
    request.post(`/damage-claims/${id}/process?approved=${approved}&notes=${notes || ''}`),
  list: params => request.get('/damage-claims', { params }),
  get: id => request.get(`/damage-claims/${id}`)
}

export const masterDataApi = {
  getClays: () => request.get('/master-data/clays'),
  getGlazes: () => request.get('/master-data/glazes'),
  getFiringCurves: params => request.get('/master-data/firing-curves', { params }),
  getKilns: params => request.get('/master-data/kilns', { params }),
  getStudents: () => request.get('/master-data/students')
}

export const savedFilterApi = {
  list: pageName => request.get(`/saved-filters?pageName=${pageName}`),
  getDefault: pageName => request.get(`/saved-filters/default?pageName=${pageName}`),
  save: (pageName, filterName, criteria, isDefault) => 
    request.post(`/saved-filters?pageName=${pageName}&filterName=${filterName}&isDefault=${isDefault || false}`, criteria),
  delete: id => request.delete(`/saved-filters/${id}`)
}
