'use client';

import React, { useState, useEffect } from 'react';
import { Flag, Plus, Clock, AlertCircle } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuthStore } from '@/stores/auth';
import type { IAppeal, AppealStatus, IMatch } from '@/types';

const statusMap: Record<AppealStatus, { label: string; variant: 'warning' | 'success' | 'danger' | 'default' }> = {
  pending: { label: '待处理', variant: 'warning' },
  upheld: { label: '申诉成功', variant: 'success' },
  rejected: { label: '申诉驳回', variant: 'danger' },
  expired: { label: '已过期', variant: 'default' },
};

export default function CaptainAppealsPage() {
  const { user, authHeaders } = useAuthStore();
  const [appeals, setAppeals] = useState<IAppeal[]>([]);
  const [matches, setMatches] = useState<IMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    if (!user?._id) return;
    setLoading(true);
    try {
      const headers: Record<string, string> = authHeaders();
      const [appealsRes, matchesRes] = await Promise.all([
        fetch(`/api/appeals?submittedBy=${user._id}`, { headers }),
        fetch('/api/schedules?status=completed', { headers }),
      ]);
      if (appealsRes.ok) {
        const data = await appealsRes.json();
        setAppeals(data.data || []);
      }
      if (matchesRes.ok) {
        const data = await matchesRes.json();
        setMatches(data.data || []);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, authHeaders]);

  const handleSubmit = async () => {
    if (!selectedMatch || !reason.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/appeals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify({
          matchId: selectedMatch,
          reason,
          evidence: [],
        }),
      });
      if (res.ok) {
        setShowModal(false);
        setSelectedMatch('');
        setReason('');
        fetchData();
      }
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  const timeRemaining = (deadline: string) => {
    const diff = new Date(deadline).getTime() - Date.now();
    if (diff <= 0) return '已过期';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}小时${mins}分钟`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">我的申诉</h1>
          <Button onClick={() => setShowModal(true)}>
            <Plus size={16} className="mr-1" /> 提交申诉
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-400">加载中...</div>
        ) : appeals.length === 0 ? (
          <EmptyState title="暂无申诉" description="您可以提交新的申诉" />
        ) : (
          <div className="space-y-3">
            {appeals.map((appeal) => {
              const s = statusMap[appeal.status];
              const remaining = appeal.status === 'pending' ? timeRemaining(appeal.deadline) : null;
              return (
                <div key={appeal._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Flag size={18} className="text-[#D32F2F] mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900">比赛 {appeal.matchId}</p>
                        <p className="text-sm text-gray-600 mt-1">{appeal.reason}</p>
                        <p className="text-xs text-gray-400 mt-2">
                          提交于 {new Date(appeal.createdAt).toLocaleString('zh-CN')}
                        </p>
                        {appeal.resolution && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-600">
                            处理结果: {appeal.resolution}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge variant={s.variant}>{s.label}</Badge>
                      {remaining && (
                        <div className="flex items-center gap-1 mt-2 text-xs">
                          <Clock size={10} className="text-[#F9A825]" />
                          <span className={remaining === '已过期' ? 'text-[#D32F2F]' : 'text-[#F9A825]'}>
                            {remaining}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="提交申诉">
        <div className="space-y-4">
          <Select
            label="选择比赛"
            value={selectedMatch}
            onChange={(e) => setSelectedMatch(e.target.value)}
            options={[
              { value: '', label: '请选择比赛' },
              ...matches.map((m) => ({
                value: m._id,
                label: `${m.homeTeamId} vs ${m.awayTeamId} - ${new Date(m.matchDate).toLocaleDateString('zh-CN')}`,
              })),
            ]}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">申诉原因</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E20]"
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="请详细描述申诉原因"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-[#F9A825]">
            <AlertCircle size={14} />
            申诉需在比赛结束后的规定时间内提交
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowModal(false)}>取消</Button>
            <Button loading={submitting} onClick={handleSubmit} disabled={!selectedMatch || !reason.trim()}>
              提交申诉
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
