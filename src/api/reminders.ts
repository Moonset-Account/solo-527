import api from './client';
import type { Reminder, ReminderConfig, PaginatedResponse } from '@/types';

export function getReminders(params?: Record<string, unknown>) {
  return api.get<PaginatedResponse<Reminder>>('/api/reminders/', { params });
}

export function getReminder(id: number) {
  return api.get<Reminder>(`/api/reminders/${id}/`);
}

export function handleReminder(id: number) {
  return api.post<Reminder>(`/api/reminders/${id}/handle/`);
}

export function getEscalations() {
  return api.get<Reminder[]>('/api/reminders/escalations/');
}

export function getReminderConfig() {
  return api.get<ReminderConfig>('/api/reminder-config/1/');
}

export function updateReminderConfig(data: Partial<ReminderConfig>) {
  return api.put<ReminderConfig>('/api/reminder-config/1/', data);
}
