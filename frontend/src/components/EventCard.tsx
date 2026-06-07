import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import type { SafetyEvent } from '../types';
import { levelConfig, statusConfig, notificationConfig, formatDuration } from '../utils';

interface EventCardProps {
  event: SafetyEvent;
}

const EventCard = ({ event }: EventCardProps) => {
  const level = levelConfig[event.level];
  const status = statusConfig[event.status];
  const notification = notificationConfig[event.notification_status];

  return (
    <Link
      to={`/event/${event.id}`}
      className="block bg-white rounded-xl shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 border border-gray-100 overflow-hidden"
    >
      <div className={`h-1 ${
        event.level === 'critical' ? 'bg-red-500' :
        event.level === 'high' ? 'bg-orange-500' :
        event.level === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
      }`} />
      
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="font-semibold text-gray-800 flex-1">{event.title}</h3>
          <div className="flex gap-2 flex-shrink-0">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${level.bgColor} ${level.color}`}>
              {level.label}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${status.bgColor} ${status.color}`}>
              {status.label}
            </span>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{event.description}</p>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-gray-500">
            <span>📍</span>
            <span className="truncate">{event.checkpoint_name || '-'}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <span>👤</span>
            <span className="truncate">{event.teacher_name || '-'}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <span>⏱️</span>
            <span>{formatDuration(event.handle_duration_minutes)}</span>
          </div>
          <div className={`flex items-center gap-2 ${notification.color}`}>
            <span>{notification.icon}</span>
            <span>{notification.label}</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
          <span>发生: {dayjs(event.actual_occurred_at).format('MM-DD HH:mm')}</span>
          {event.reviewer_name && (
            <span>复盘: {event.reviewer_name}</span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default EventCard;
