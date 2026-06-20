import request from '@/utils/request';
import { Reminder, ReminderConfig, SearchParams, PaginatedResult } from '@/types';

export const getMyReminders = (params?: SearchParams): Promise<PaginatedResult<Reminder>> => {
  return request.get('/reminders/my', { params });
};

export const getUnreadCount = (): Promise<{ count: number }> => {
  return request.get('/reminders/unread-count');
};

export const getBlockingReminders = (): Promise<Reminder[]> => {
  return request.get('/reminders/blocking');
};

export const markAsRead = (id: string): Promise<Reminder> => {
  return request.patch(`/reminders/${id}/read`);
};

export const markAllAsRead = (): Promise<{ modifiedCount: number }> => {
  return request.post('/reminders/read-all');
};

export const getReminderConfigs = (): Promise<ReminderConfig[]> => {
  return request.get('/reminders/configs');
};

export const updateReminderConfig = (id: string, data: any): Promise<ReminderConfig> => {
  return request.patch(`/reminders/configs/${id}`, data);
};

export const getReminders = getMyReminders;
export const getConfigs = getReminderConfigs;
export const updateConfig = updateReminderConfig;
