import apiClient from './client';

export const uploadApi = {
  uploadFile: (file: File, type: string = 'general') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    return apiClient.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadOffline: (data: any) => apiClient.post('/upload/offline', data),
  deleteAttachment: (id: number) => apiClient.delete(`/attachments/${id}`),
};
