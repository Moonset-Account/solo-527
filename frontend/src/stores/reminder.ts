import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import * as remindersApi from '../api/reminders';
import type { Reminder, ReminderType } from '../types';

export const useReminderStore = defineStore('reminder', () => {
  const reminders = ref<Reminder[]>([]);
  const blockingReminders = ref<Reminder[]>([]);
  const loading = ref(false);

  const unreadCount = computed(() =>
    reminders.value.filter((r) => !r.isRead).length
  );

  const infoReminders = computed(() =>
    reminders.value.filter((r) => r.type === 'info')
  );

  const warningReminders = computed(() =>
    reminders.value.filter((r) => r.type === 'warning')
  );

  const blockingCount = computed(() =>
    blockingReminders.value.filter((r) => !r.isRead).length
  );

  async function fetchReminders(type?: ReminderType) {
    loading.value = true;
    try {
      const params: any = { page: 1, pageSize: 50, sortBy: 'createdAt', sortOrder: 'desc' };
      if (type) params.type = type;
      const result = await remindersApi.getMyReminders(params);
      reminders.value = result.data;
    } finally {
      loading.value = false;
    }
  }

  async function fetchBlockingReminders() {
    loading.value = true;
    try {
      const result = await remindersApi.getBlockingReminders();
      blockingReminders.value = result;
    } finally {
      loading.value = false;
    }
  }

  async function markAsRead(id: string) {
    try {
      await remindersApi.markAsRead(id);
      const reminder = reminders.value.find((r) => r._id === id);
      if (reminder) reminder.isRead = true;
      const blocking = blockingReminders.value.find((r) => r._id === id);
      if (blocking) blocking.isRead = true;
    } catch (e) {
      console.error('Failed to mark reminder as read:', e);
    }
  }

  async function markAllAsRead() {
    try {
      await remindersApi.markAllAsRead();
      reminders.value.forEach((r) => (r.isRead = true));
      blockingReminders.value.forEach((r) => (r.isRead = true));
    } catch (e) {
      console.error('Failed to mark all as read:', e);
    }
  }

  return {
    reminders,
    blockingReminders,
    loading,
    unreadCount,
    infoReminders,
    warningReminders,
    blockingCount,
    fetchReminders,
    fetchBlockingReminders,
    markAsRead,
    markAllAsRead,
  };
});
