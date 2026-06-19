'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Bell,
  Check,
  Clock,
  AlertTriangle,
  FileWarning,
  Filter,
  CheckCheck,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react';
import { db } from '@/lib/mock-db';
import { reminderTypeLabels, formatDate, cn } from '@/lib/utils';
import { ReminderType } from '@prisma/client';

const userId = 'user-1';

export default function RemindersPage() {
  const [filter, setFilter] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  let reminders = db.reminders.findMany({ where: { userId } });

  if (filter === 'unread') {
    reminders = reminders.filter(r => !r.isRead);
  } else if (filter === 'read') {
    reminders = reminders.filter(r => r.isRead);
  }

  if (selectedType !== 'all') {
    reminders = reminders.filter(r => r.type === selectedType);
  }

  const unreadCount = db.reminders.count({ where: { userId, isRead: false } });

  function getTypeIcon(type: string) {
    switch (type) {
      case ReminderType.RISK_ALERT:
        return <AlertTriangle className="h-5 w-5" />;
      case ReminderType.MATERIAL_INCOMPLETE:
        return <FileWarning className="h-5 w-5" />;
      case ReminderType.REVIEW_DEADLINE:
      case ReminderType.STAMP_DEADLINE:
        return <Clock className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  }

  function getTypeColor(type: string) {
    switch (type) {
      case ReminderType.RISK_ALERT:
        return 'bg-danger-100 text-danger-600';
      case ReminderType.MATERIAL_INCOMPLETE:
        return 'bg-warning-100 text-warning-600';
      case ReminderType.REVIEW_DEADLINE:
        return 'bg-primary-100 text-primary-600';
      case ReminderType.STAMP_DEADLINE:
        return 'bg-purple-100 text-purple-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  }

  function markAllRead() {
    reminders.forEach((r: any) => {
      if (!r.isRead) {
        db.reminders.update({ where: { id: r.id }, data: { isRead: true } });
      }
    });
  }

  const typeStats = [
    { type: ReminderType.REVIEW_DEADLINE, label: '截止提醒' },
    { type: ReminderType.MATERIAL_INCOMPLETE, label: '材料提醒' },
    { type: ReminderType.RISK_ALERT, label: '风险预警' },
    { type: ReminderType.STAMP_DEADLINE, label: '盖章提醒' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">待办提醒</h1>
          <p className="mt-1 text-sm text-gray-500">
            您有 <span className="font-medium text-danger-600">{unreadCount}</span> 条未读提醒
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={markAllRead}
            className="btn-secondary"
          >
            <CheckCheck className="mr-2 h-4 w-4" />
            全部标为已读
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {typeStats.map((stat) => {
          const count = reminders.filter(r => r.type === stat.type).length;
          const unread = reminders.filter(r => r.type === stat.type && !r.isRead).length;
          return (
            <div
              key={stat.type}
              onClick={() => setSelectedType(selectedType === stat.type ? 'all' : stat.type)}
              className={cn(
                'card p-4 cursor-pointer transition-all hover:shadow-md',
                selectedType === stat.type ? 'ring-2 ring-primary-500' : ''
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', getTypeColor(stat.type))}>
                  {getTypeIcon(stat.type)}
                </div>
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-lg font-bold text-gray-900">
                    {count}
                    {unread > 0 && (
                      <span className="ml-2 text-xs font-normal text-danger-600">
                        {unread} 未读
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card">
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                filter === 'all'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              全部
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                filter === 'unread'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              未读
            </button>
            <button
              onClick={() => setFilter('read')}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                filter === 'read'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              已读
            </button>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Filter className="h-4 w-4" />
            共 {reminders.length} 条
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {reminders.length === 0 ? (
            <div className="p-12 text-center">
              <Bell className="mx-auto h-12 w-12 text-gray-300 mb-3" />
              <p className="text-gray-500">暂无提醒</p>
            </div>
          ) : (
            reminders.map((reminder: any) => {
              const contract = reminder.contractId
                ? db.contracts.findUnique({ where: { id: reminder.contractId } })
                : null;
              return (
                <div
                  key={reminder.id}
                  className={cn(
                    'flex items-start gap-4 p-4 hover:bg-gray-50 cursor-pointer transition-colors',
                    !reminder.isRead ? 'bg-primary-50/50' : ''
                  )}
                >
                  <div className={cn(
                    'mt-0.5 flex h-10 w-10 items-center justify-center rounded-full flex-shrink-0',
                    getTypeColor(reminder.type)
                  )}>
                    {getTypeIcon(reminder.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className={cn(
                        'text-sm font-medium',
                        !reminder.isRead ? 'text-gray-900' : 'text-gray-600'
                      )}>
                        {reminder.title}
                      </h4>
                      {!reminder.isRead && (
                        <span className="h-2 w-2 rounded-full bg-primary-500"></span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-500">{reminder.message}</p>
                    <div className="mt-2 flex items-center gap-3">
                      <span className="text-xs text-gray-400">
                        {reminderTypeLabels[reminder.type]}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDate(reminder.createdAt)}
                      </span>
                      {contract && (
                        <Link
                          href={`/contracts/${contract.id}`}
                          className="text-xs text-primary-600 hover:text-primary-700 flex items-center"
                        >
                          查看合同 <ChevronRight className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                  <button className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600">
                    <Check className="h-4 w-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
