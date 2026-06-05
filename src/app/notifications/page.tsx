'use client';

import { useState, useEffect } from 'react';
import {
  Bell,
  Calendar,
  Ticket,
  Wallet,
  User,
  Check,
  CheckCheck,
  Clock,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface Notification {
  id: string;
  type: string;
  title: string;
  content: string;
  relatedId: string | null;
  isRead: boolean;
  createdAt: string;
}

const typeIcons: Record<string, any> = {
  SYSTEM: Bell,
  REHEARSAL: Calendar,
  TICKET: Ticket,
  LEAVE: Clock,
  FINANCE: Wallet,
};

const typeColors: Record<string, string> = {
  SYSTEM: 'bg-blue-100 text-blue-600',
  REHEARSAL: 'bg-green-100 text-green-600',
  TICKET: 'bg-purple-100 text-purple-600',
  LEAVE: 'bg-yellow-100 text-yellow-600',
  FINANCE: 'bg-orange-100 text-orange-600',
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/v1/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/v1/notifications/${id}/read`, { method: 'POST' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/v1/notifications/read-all', { method: 'POST' });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const filteredNotifications =
    filter === 'ALL'
      ? notifications
      : notifications.filter((n) => n.type === filter);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filters = [
    { key: 'ALL', label: '全部' },
    { key: 'SYSTEM', label: '系统' },
    { key: 'REHEARSAL', label: '排练' },
    { key: 'TICKET', label: '票务' },
    { key: 'LEAVE', label: '请假' },
    { key: 'FINANCE', label: '财务' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900">
            消息中心
          </h1>
          <p className="text-gray-500 mt-1">
            您有 {unreadCount} 条未读消息
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center space-x-2 text-sm text-primary hover:text-primary-light"
          >
            <CheckCheck className="h-4 w-4" />
            <span>全部标记已读</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f.key
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无消息</h3>
            <p className="text-gray-500">您还没有收到任何通知</p>
          </div>
        ) : (
          filteredNotifications.map((notification) => {
            const Icon = typeIcons[notification.type] || Bell;
            return (
              <div
                key={notification.id}
                className={`bg-white rounded-xl shadow-sm p-4 border-l-4 ${
                  notification.isRead
                    ? 'border-gray-200 opacity-70'
                    : 'border-primary'
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div
                    className={`p-3 rounded-xl ${typeColors[notification.type] || 'bg-gray-100 text-gray-600'}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">
                        {notification.title}
                      </h3>
                      <span className="text-xs text-gray-400 whitespace-nowrap ml-4">
                        {formatDate(notification.createdAt, 'MM-dd HH:mm')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {notification.content}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        {notification.type === 'REHEARSAL' && '排练通知'}
                        {notification.type === 'TICKET' && '票务通知'}
                        {notification.type === 'LEAVE' && '请假通知'}
                        {notification.type === 'FINANCE' && '财务通知'}
                        {notification.type === 'SYSTEM' && '系统通知'}
                      </span>
                      {!notification.isRead && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="flex items-center space-x-1 text-xs text-primary hover:text-primary-light"
                        >
                          <Check className="h-3 w-3" />
                          <span>标记已读</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
