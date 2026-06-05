'use client';

import { useState, useEffect } from 'react';
import {
  ListOrdered,
  Clock,
  User,
  Ticket,
  Trash2,
  Loader2,
} from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';
import Link from 'next/link';

interface WaitlistEntry {
  id: string;
  position: number;
  status: string;
  createdAt: string;
  user: { name: string; email: string };
  tier: { name: string; price: string };
  show: {
    startTime: string;
    production: { title: string };
  };
}

export default function WaitlistPage() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'mine'>('mine');

  useEffect(() => {
    fetchWaitlist();
  }, [filter]);

  const fetchWaitlist = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/v1/waitlist${filter === 'mine' ? '?my=true' : ''}`
      );
      if (res.ok) {
        const data = await res.json();
        setEntries(data);
      }
    } catch (error) {
      console.error('Failed to fetch waitlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const cancelEntry = async (id: string) => {
    if (!confirm('确定要取消候补吗？')) return;

    try {
      const res = await fetch(`/api/v1/waitlist/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setEntries((prev) => prev.filter((e) => e.id !== id));
      }
    } catch (error) {
      console.error('Failed to cancel waitlist:', error);
    }
  };

  const statusConfig: Record<string, { label: string; className: string }> = {
    WAITING: { label: '等待中', className: 'bg-yellow-100 text-yellow-700' },
    OFFERED: { label: '已通知', className: 'bg-blue-100 text-blue-700' },
    CONVERTED: { label: '已购票', className: 'bg-green-100 text-green-700' },
    EXPIRED: { label: '已过期', className: 'bg-gray-100 text-gray-500' },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-gray-900">
          候补名单
        </h1>
        <p className="text-gray-500 mt-1">查看和管理候补排队信息</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('mine')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'mine'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            我的候补
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            全部候补
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : entries.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-16 text-center">
          <ListOrdered className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            暂无候补记录
          </h3>
          <p className="text-gray-500 mb-4">
            您还没有加入任何候补名单
          </p>
          <Link
            href="/tickets/shows"
            className="btn-primary inline-flex items-center space-x-2"
          >
            <Ticket className="h-5 w-5" />
            <span>浏览演出</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => {
            const status = statusConfig[entry.status];
            return (
              <div
                key={entry.id}
                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <ListOrdered className="h-6 w-6 text-primary" />
                      <span className="absolute text-lg font-bold text-primary">
                        {entry.position}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {entry.show.production.title}
                      </h3>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {formatDate(entry.show.startTime, 'yyyy-MM-dd HH:mm')}
                        </span>
                        <span className="flex items-center">
                          <Ticket className="h-4 w-4 mr-1" />
                          {entry.tier.name} - {formatCurrency(entry.tier.price)}
                        </span>
                      </div>
                      {filter === 'all' && (
                        <div className="flex items-center mt-2 text-sm text-gray-500">
                          <User className="h-4 w-4 mr-1" />
                          {entry.user.name} ({entry.user.email})
                        </div>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        加入时间：{formatDate(entry.createdAt, 'yyyy-MM-dd HH:mm')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${status.className}`}
                    >
                      {status.label}
                    </span>
                    {entry.status === 'WAITING' && (
                      <button
                        onClick={() => cancelEntry(entry.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="取消候补"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {entry.status === 'WAITING' && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-700">
                      当前排位：第 <span className="font-bold">{entry.position}</span> 位。
                      有票时我们会第一时间通知您，请留意消息通知。
                    </p>
                  </div>
                )}

                {entry.status === 'OFFERED' && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700">
                      恭喜！您的排位已轮到，请尽快完成购票。
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
