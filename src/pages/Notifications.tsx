import { useEffect, useState } from 'react';
import { Bell, CheckCircle, Calendar, Users, AlertTriangle, Settings, CheckCheck } from 'lucide-react';
import { useNotificationStore } from '@/stores/notificationStore';
import EmptyState from '@/components/EmptyState';

const typeConfig: Record<string, { label: string; icon: React.ReactNode; color: string; borderColor: string; bgColor: string }> = {
  booking: { label: '报名状态', icon: <Calendar size={16} />, color: 'bg-blue-100 text-blue-700', borderColor: 'border-l-blue-500', bgColor: 'bg-blue-500' },
  scheduling: { label: '排班通知', icon: <Users size={16} />, color: 'bg-green-100 text-green-700', borderColor: 'border-l-green-500', bgColor: 'bg-green-500' },
  reminder: { label: '提醒', icon: <AlertTriangle size={16} />, color: 'bg-yellow-100 text-yellow-700', borderColor: 'border-l-yellow-500', bgColor: 'bg-yellow-500' },
  system: { label: '系统', icon: <Settings size={16} />, color: 'bg-gray-100 text-gray-700', borderColor: 'border-l-gray-400', bgColor: 'bg-gray-400' },
};

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function Notifications() {
  const { notifications, fetchNotifications, markRead } = useNotificationStore();
  const [tab, setTab] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const filtered = tab === 'unread'
    ? notifications.filter((n) => !n.read)
    : notifications;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkRead = async (id: number) => {
    await markRead(id);
  };

  const handleMarkAllRead = async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    for (const id of unreadIds) {
      await markRead(id);
    }
  };

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center justify-between">
        <h1 className="page-title">通知中心</h1>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead} className="btn-ghost flex items-center gap-1.5">
            <CheckCheck size={16} />
            全部标为已读
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        {[
          { key: 'all', label: '全部' },
          { key: 'unread', label: '未读' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={tab === t.key ? 'btn-primary' : 'btn-secondary'}
          >
            {t.label}
            {t.key === 'unread' && unreadCount > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-[10px] rounded-full w-5 h-5 inline-flex items-center justify-center font-medium">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Bell size={28} className="text-slate-400" />}
          message={tab === 'unread' ? '暂无未读通知' : '暂无通知'}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((n, idx) => {
            const config = typeConfig[n.type] || typeConfig.system;
            return (
              <div
                key={n.id}
                className={`bg-white rounded-xl border border-gray-100 ${config.borderColor} border-l-[3px] p-4 flex items-start gap-3.5 transition-all duration-200 hover:shadow-sm slide-up stagger-${Math.min(idx + 1, 6)} ${
                  n.read ? 'opacity-60' : ''
                }`}
              >
                <div className={`w-9 h-9 rounded-full ${config.color} flex items-center justify-center shrink-0 mt-0.5`}>
                  {config.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`status-badge ${config.color}`}>{config.label}</span>
                    {!n.read && (
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-gold" />
                      </span>
                    )}
                  </div>
                  <p className={`text-sm leading-relaxed ${n.read ? 'text-slate-500' : 'text-slate-800 font-medium'}`}>
                    {n.title}
                  </p>
                  <p className="text-sm text-slate-400 mt-1 leading-relaxed">{n.content}</p>
                  <p className="text-xs text-slate-400 mt-2">{formatTime(n.created_at)}</p>
                </div>
                {!n.read && (
                  <button
                    onClick={() => handleMarkRead(n.id)}
                    className="btn-ghost flex items-center gap-1 shrink-0 text-gold hover:text-gold-dark"
                  >
                    <CheckCircle size={14} />
                    已读
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
