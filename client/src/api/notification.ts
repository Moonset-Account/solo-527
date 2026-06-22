import request from './request';

export function getNotificationList(params?: Record<string, any>) {
  return request.get('/notifications', { params });
}

export function getNotificationDetail(id: number) {
  return request.get(`/notifications/${id}`);
}

export function sendRenewalReminder(licenseId: number, data: { handleResult: string }) {
  return request.post(`/notifications/${licenseId}/remind`, data);
}

export function getNotificationsByLicense(licenseId: number) {
  return request.get('/notifications', { params: { licenseId } });
}
