import request from './request';

export const getBills = (params?: any) => request.get('/bills', { params });

export const getBill = (id: string) => request.get(`/bills/${id}`);

export const createBill = (data: any) => request.post('/bills', data);

export const createBatchBills = (data: any[]) => request.post('/bills/batch', data);

export const updateBill = (id: string, data: any) => request.put(`/bills/${id}`, data);

export const payBill = (id: string, data: any) => request.post(`/bills/${id}/pay`, data);

export const getBillStatistics = () => request.get('/bills/statistics');
