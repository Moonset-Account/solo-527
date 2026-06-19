import { useState, useEffect } from 'react';
import { Bell, FileText, AlertTriangle, Shield, Settings, Check } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Loading from '@/components/ui/Loading';
import { useToast } from '@/components/ui/Toast';
import { notificationApi } from '@/api';
import { Notification, NotificationType } from '@/types';
import { cn, formatDateTime, getStatusText } from '@/utils';

type TabType = 'all' | 'unread' | 'read';

export default function NotificationList() {
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [unreadCount, setUnreadCount] = useState(0);
  const [markingAll, setMarkingAll] = useState(false);
  const { showToast } = useToast();

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const params: { status?: string } = {};
      if (activeTab === 'unread') params.status = 'UNREAD';
      if (activeTab === 'read') params.status = 'READ';

      const result = await notificationApi.getList({ ...params, size: 50 });
      setNotifications(result.content);
      setUnreadCount(result.unreadCount);
    } catch (error) {
      showToast({ type: 'error', message: '加载通知列表失败' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [activeTab]);

  const handleMarkRead = async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: 'READ' as const } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      showToast({ type: 'error', message: '标记已读失败' });
    }
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    setMarkingAll(true);
    try {
      const unreadNotifs = notifications.filter((n) => n.status === 'UNREAD');
      for (const notif of unreadNotifs) {
        await notificationApi.markAsRead(notif.id);
      }
      setNotifications((prev) =>
        prev.map((n) =>
          n.status === 'UNREAD' ? { ...n, status: 'READ' as const } : n
        )
      );
      setUnreadCount(0);
      showToast({ type: 'success', message: '全部标记为已读' });
    } catch (error) {
      showToast({ type: 'error', message: '标记失败' });
    } finally {
      setMarkingAll(false);
    }
  };

  const getTypeIcon = (type: NotificationType) => {
    const iconMap: Record<NotificationType, React.ReactNode> = {
      APPLICATION: <FileText className="w-5 h-5 text-primary-500" />,
      SCHEDULE: <Bell className="w-5 h-5 text-warning-500" />,
      CONFLICT: <AlertTriangle className="w-5 h-5 text-danger-500" />,
      COMPLIANCE: <Shield className="w-5 h-5 text-success-500" />,
      SYSTEM: <Settings className="w-5 h-5 text-neutral-500" />,
    };
    return iconMap[type] || <Bell className="w-5 h-5" />;
  };

  const getTypeBadge = (type: NotificationType) => {
    const variantMap: Record<NotificationType, 'primary' | 'success' | 'warning' | 'danger' | 'neutral'> = {
      APPLICATION: 'primary',
      SCHEDULE: 'warning',
      CONFLICT: 'danger',
      COMPLIANCE: 'success',
      SYSTEM: 'neutral',
    };
    return (
      <Badge variant={variantMap[type]}>
        {getStatusText(type)}
      </Badge>
    );
  };

  const tabs: { key: TabType; label: string; count?: number }[] = [
    { key: 'all', label: '全部' },
    { key: 'unread', label: '未读', count: unreadCount },
    { key: 'read', label: '已读' },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-primary-500" />
            通知中心
          </h1>
          <p className="text-neutral-500 mt-1">查看系统通知和消息</p>
        </div>
        <Button
          variant="secondary"
          onClick={handleMarkAllRead}
          loading={markingAll}
          disabled={unreadCount === 0}
        >
          <Check className="w-4 h-4" />
          全部标记已读
        </Button>
      </div>

      <Card>
        <div className="flex border-b border-neutral-200">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'px-6 py-4 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.key
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              )}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-primary-100 text-primary-600 rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="divide-y divide-neutral-100">
          {loading ? (
            <div className="py-12">
              <Loading />
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-12 text-center text-neutral-500">
              <Bell className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
              <p>暂无通知</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => notification.status === 'UNREAD' && handleMarkRead(notification.id)}
                className={cn(
                  'p-4 flex items-start gap-4 hover:bg-neutral-50 transition-colors cursor-pointer',
                  notification.status === 'UNREAD' && 'bg-primary-50/30'
                )}
              >
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center">
                    {getTypeIcon(notification.type)}
                  </div>
                  {notification.status === 'UNREAD' && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary-500 rounded-full border-2 border-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {getTypeBadge(notification.type)}
                    <span className="text-xs text-neutral-400">
                      {formatDateTime(notification.createdAt)}
                    </span>
                  </div>
                  <h3
                    className={cn(
                      'text-sm',
                      notification.status === 'UNREAD'
                        ? 'font-semibold text-neutral-900'
                        : 'font-medium text-neutral-700'
                    )}
                  >
                    {notification.title}
                  </h3>
                  <p className="text-sm text-neutral-500 mt-1 line-clamp-2">
                    {notification.content}
                  </p>
                </div>
                {notification.status === 'UNREAD' && (
                  <span className="flex-shrink-0 w-2 h-2 bg-primary-500 rounded-full mt-4" />
                )}
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
