'use client';

import React, { useState, useEffect } from 'react';
import { MessageSquare, ChevronDown, ChevronUp, Bell, Filter } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuthStore } from '@/stores/auth';
import type { IMessage, MessageType } from '@/types';

const typeLabels: Record<MessageType, { label: string; variant: 'default' | 'info' | 'success' | 'warning' | 'danger' }> = {
  system: { label: '系统', variant: 'default' },
  review: { label: '审核', variant: 'info' },
  schedule: { label: '赛程', variant: 'success' },
  score: { label: '比分', variant: 'warning' },
  appeal: { label: '申诉', variant: 'danger' },
};

export default function MessagesPage() {
  const { user, authHeaders } = useAuthStore();
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const fetchMessages = async () => {
    if (!user?._id) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.set('type', typeFilter);
      const res = await fetch(`/api/messages?${params}`, {
        headers: authHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.data || []);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [user, authHeaders]);

  const markAsRead = async (messageId: string) => {
    try {
      await fetch(`/api/messages/${messageId}/read`, {
        method: 'PUT',
        headers: authHeaders(),
      });
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, read: true } : m))
      );
    } catch {}
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        const msg = messages.find((m) => m._id === id);
        if (msg && !msg.read) {
          markAsRead(id);
        }
      }
      return next;
    });
  };

  const unreadCount = messages.filter((m) => !m.read).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            消息中心
            {unreadCount > 0 && (
              <Badge variant="danger" className="ml-2">{unreadCount} 未读</Badge>
            )}
          </h1>
          <div className="w-36">
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              options={[
                { value: '', label: '全部类型' },
                { value: 'system', label: '系统' },
                { value: 'review', label: '审核' },
                { value: 'schedule', label: '赛程' },
                { value: 'score', label: '比分' },
                { value: 'appeal', label: '申诉' },
              ]}
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-400">加载中...</div>
        ) : messages.length === 0 ? (
          <EmptyState title="暂无消息" description="您没有新的消息" />
        ) : (
          <div className="space-y-2">
            {messages.map((msg) => {
              const t = typeLabels[msg.type];
              const isExpanded = expanded.has(msg._id);
              return (
                <div
                  key={msg._id}
                  className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all ${
                    !msg.read ? 'border-l-4 border-l-[#1B5E20]' : ''
                  }`}
                >
                  <div
                    className="flex items-start gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleExpand(msg._id)}
                  >
                    <div className={`shrink-0 mt-0.5 ${!msg.read ? 'text-[#1B5E20]' : 'text-gray-400'}`}>
                      <MessageSquare size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${!msg.read ? 'text-gray-900' : 'text-gray-600'}`}>
                          {msg.title}
                        </span>
                        <Badge variant={t.variant}>{t.label}</Badge>
                        {!msg.read && (
                          <span className="w-2 h-2 rounded-full bg-[#1B5E20] shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(msg.createdAt).toLocaleString('zh-CN')}
                      </p>
                    </div>
                    {isExpanded ? <ChevronUp size={16} className="text-gray-400 shrink-0" /> : <ChevronDown size={16} className="text-gray-400 shrink-0" />}
                  </div>
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-0 ml-8">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
