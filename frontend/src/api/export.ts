import request from './request'

export const exportProjectData = (projectId: number): Promise<Blob> => {
  return request.get(`/export/project/${projectId}`, {
    responseType: 'blob'
  })
}
