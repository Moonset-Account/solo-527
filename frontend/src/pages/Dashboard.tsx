import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { eventsAPI, notificationsAPI } from '../api';
import type { SafetyEvent } from '../types';
import EventCard from '../components/EventCard';
import { useAuth } from '../auth';
import { levelConfig, statusConfig, notificationConfig } from '../utils';

const Dashboard = () => {
  const [unconfirmedEvents, setUnconfirmedEvents] = useState<SafetyEvent[]>([]);
  const [closedEvents, setClosedEvents] = useState<SafetyEvent[]>([]);
  const [processingEvents, setProcessingEvents] = useState<SafetyEvent[]>([]);
  const [pendingNotifications, setPendingNotifications] = useState<SafetyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { isProjectManager } = useAuth();

  const loadData = async () => {
    setLoading(true);
    try {
      const [unconfirmed, processing, closed, pending] = await Promise.all([
        eventsAPI.getList({ status: 'unconfirmed', page_size: 50 }),
        eventsAPI.getList({ status: 'processing', page_size: 50 }),
        eventsAPI.getList({ status: 'closed', page_size: 50 }),
        isProjectManager ? eventsAPI.getPendingNotifications() : Promise.resolve([]),
      ]);
      setUnconfirmedEvents(unconfirmed.items);
      setProcessingEvents(processing.items);
      setClosedEvents(closed.items);
      setPendingNotifications(pending);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleResendNotification = async (eventId: string) => {
    try {
      await notificationsAPI.resend(eventId);
      loadData();
    } catch (error) {
      console.error('Failed to resend notification:', error);
    }
  };

  const handleConfirmEvent = async (eventId: string) => {
    try {
      await eventsAPI.confirm(eventId);
      loadData();
    } catch (error) {
      console.error('Failed to confirm event:', error);
    }
  };

  const EventSection = ({ title, events, borderColor, icon, action }: {
    title: string;
    events: SafetyEvent[];
    borderColor: string;
    icon: string;
    action?: (event: SafetyEvent) => React.ReactNode;
  }) => (
    <section className={`mb-8 bg-white rounded-xl shadow-sm border-l-4 ${borderColor} overflow-hidden`}>
      <div className="px-6 py-4 bg-gray-50 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">{icon}</span>
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-sm rounded-full">
            {events.length}
          </span>
        </div>
      </div>
      
      <div className="p-6">
        {events.length === 0 ? (
          <div className="text-center py-8 text-gray-400">暂无事件</div>
        ) : (
          <div className="relative">
            <div className="timeline-line" />
            <div className="space-y-6 pl-12">
              {events.map((event, index) => (
                <div key={event.id} className="relative">
                  <div className={`absolute -left-12 w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                    event.level === 'critical' ? 'bg-red-500' :
                    event.level === 'high' ? 'bg-orange-500' :
                    event.level === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                  } ${event.status === 'unconfirmed' ? 'pulse-marker' : ''}`}>
                    {index + 1}
                  </div>
                  <div className="text-sm text-gray-400 mb-2">
                    {dayjs(event.actual_occurred_at).format('YYYY-MM-DD HH:mm')}
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <EventCard event={event} />
                    </div>
                    {action && action(event)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">事件复盘看板</h1>
        <p className="text-gray-500">以时间线形式追踪和管理安全事件</p>
      </div>

      {isProjectManager && pendingNotifications.length > 0 && (
        <section className="mb-8 bg-red-50 rounded-xl border border-red-200 overflow-hidden">
          <div className="px-6 py-4 bg-red-100 border-b border-red-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">⚠️</span>
              <h2 className="text-lg font-semibold text-red-800">待补发通知 ({pendingNotifications.length})</h2>
            </div>
          </div>
          <div className="p-4">
            <div className="grid gap-3">
              {pendingNotifications.map(event => (
                <div key={event.id} className="flex items-center justify-between bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${levelConfig[event.level].bgColor} ${levelConfig[event.level].color}`}>
                      {levelConfig[event.level].label}
                    </span>
                    <div>
                      <div className="font-medium text-gray-800">{event.title}</div>
                      <div className="text-sm text-gray-500">
                        {event.checkpoint_name} · {dayjs(event.actual_occurred_at).format('MM-DD HH:mm')}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleResendNotification(event.id);
                    }}
                    className="px-4 py-2 bg-warning text-white rounded-lg hover:bg-amber-600 transition-colors text-sm font-medium"
                  >
                    补发通知
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <EventSection
        title="未确认事件"
        events={unconfirmedEvents}
        borderColor="border-warning"
        icon="🔶"
        action={isProjectManager ? (event) => (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleConfirmEvent(event.id);
            }}
            className="self-start px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 transition-colors text-sm font-medium whitespace-nowrap"
          >
            确认处理
          </button>
        ) : undefined}
      />

      <EventSection
        title="处理中事件"
        events={processingEvents}
        borderColor="border-blue-500"
        icon="🔄"
      />

      <EventSection
        title="已关闭事件"
        events={closedEvents}
        borderColor="border-gray-300"
        icon="✅"
      />
    </div>
  );
};

export default Dashboard;
