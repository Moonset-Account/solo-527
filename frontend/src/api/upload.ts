import request from './request'

export function uploadImage(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  
  return request.post<{ url: string }>('/upload/image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export function uploadImages(files: File[]) {
  const formData = new FormData()
  files.forEach(file => {
    formData.append('files', file)
  })
  
  return request.post<{ urls: string[] }>('/upload/images', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}
