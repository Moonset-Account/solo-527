'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import type { Notification } from '@/types/database';
import { formatRelativeTime } from '@/lib/utils';
import { Bell, Check, CheckCheck, AlertCircle, FileText, Truck, Shield, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

const notificationIcons: Record<string, React.ElementType> = {
  system: Bell,
  loan_status: FileText,
  condition_report: AlertCircle,
  transport: Truck,
  insurance: Shield,
  reconciliation: DollarSign,
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadNotifications();
  }, [supabase]);

  const loadNotifications = async () => {
    try {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });
      setNotifications(data || []);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);
      loadNotifications();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userData.user?.id)
        .eq('is_read', false);
      loadNotifications();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <AppLayout>
      <div className="p-6">
        <PageHeader
          title="通知中心"
          description={`您有 ${unreadCount} 条未读通知`}
        >
          <Button variant="outline" onClick={markAllAsRead}>
            <CheckCheck className="h-4 w-4 mr-2" />
            全部已读
          </Button>
        </PageHeader>

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-white rounded-xl animate-pulse" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">暂无通知</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => {
              const Icon = notificationIcons[notification.type] || Bell;
              return (
                <div
                  key={notification.id}
                  className={cn(
                    'bg-white rounded-xl p-4 shadow-sm border transition-all',
                    notification.is_read
                      ? 'border-gray-100 opacity-75'
                      : 'border-amber-200 bg-amber-50/30'
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      'h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0',
                      notification.is_read ? 'bg-gray-100' : 'bg-amber-100'
                    )}>
                      <Icon className={cn(
                        'h-5 w-5',
                        notification.is_read ? 'text-gray-500' : 'text-amber-600'
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <h4 className={cn(
                          'font-medium',
                          notification.is_read ? 'text-gray-600' : 'text-gray-900'
                        )}>
                          {notification.title}
                        </h4>
                        <span className="text-xs text-gray-400 flex-shrink-0 ml-4">
                          {formatRelativeTime(notification.created_at)}
                        </span>
                      </div>
                      {notification.content && (
                        <p className="text-sm text-gray-500 mt-1">{notification.content}</p>
                      )}
                    </div>
                    {!notification.is_read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="flex-shrink-0 p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
