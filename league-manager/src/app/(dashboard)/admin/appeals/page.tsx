'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuthStore } from '@/stores/auth';
import type { IAppeal, AppealStatus } from '@/types';

const statusMap: Record<AppealStatus, { label: string; variant: 'warning' | 'success' | 'danger' | 'default' }> = {
  pending: { label: '待处理', variant: 'warning' },
  upheld: { label: '申诉成功', variant: 'success' },
  rejected: { label: '申诉驳回', variant: 'danger' },
  expired: { label: '已过期', variant: 'default' },
};

export default function AdminAppealsPage() {
  const { authHeaders } = useAuthStore();
  const [appeals, setAppeals] = useState<IAppeal[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [resolveModal, setResolveModal] = useState<IAppeal | null>(null);
  const [resolution, setResolution] = useState<'upheld' | 'rejected'>('rejected');
  const [comment, setComment] = useState('');
  const [scoreChange, setScoreChange] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchAppeals = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/appeals?${params}`, {
        headers: authHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setAppeals(data.data || []);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppeals();
  }, [authHeaders, statusFilter]);

  const handleResolve = async () => {
    if (!resolveModal) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/appeals/${resolveModal._id}/resolve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify({
          status: resolution,
          resolution: comment,
          scoreChange,
        }),
      });
      if (res.ok) {
        setResolveModal(null);
        setComment('');
        setScoreChange(false);
        fetchAppeals();
      }
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  const isExpired = (deadline: string) => new Date(deadline) < new Date();

  const columns = [
    {
      key: 'matchId',
      header: '比赛',
      render: (row: IAppeal) => <span className="font-medium">{row.matchId}</span>,
    },
    { key: 'submittedBy', header: '申诉方' },
    {
      key: 'reason',
      header: '原因',
      render: (row: IAppeal) => (
        <span className="truncate max-w-[200px] block">{row.reason}</span>
      ),
    },
    {
      key: 'deadline',
      header: '截止时间',
      render: (row: IAppeal) =>
        isExpired(row.deadline) ? (
          <Badge variant="danger">已过期</Badge>
        ) : (
          <span className="text-sm">{new Date(row.deadline).toLocaleDateString('zh-CN')}</span>
        ),
    },
    {
      key: 'status',
      header: '状态',
      render: (row: IAppeal) => {
        const s = statusMap[row.status];
        return <Badge variant={s.variant}>{s.label}</Badge>;
      },
    },
    {
      key: 'actions',
      header: '操作',
      render: (row: IAppeal) =>
        row.status === 'pending' ? (
          <Button size="sm" variant="primary" onClick={() => { setResolveModal(row); setComment(''); setResolution('rejected'); }}>
            处理
          </Button>
        ) : (
          <span className="text-sm text-gray-400">-</span>
        ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">申诉管理</h1>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="w-48">
            <Select
              label="状态筛选"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: '', label: '全部' },
                { value: 'pending', label: '待处理' },
                { value: 'upheld', label: '申诉成功' },
                { value: 'rejected', label: '申诉驳回' },
                { value: 'expired', label: '已过期' },
              ]}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          {loading ? (
            <div className="text-center py-8 text-gray-400">加载中...</div>
          ) : appeals.length === 0 ? (
            <EmptyState title="暂无申诉" />
          ) : (
            <Table columns={columns} data={appeals} />
          )}
        </div>
      </div>

      <Modal open={!!resolveModal} onClose={() => setResolveModal(null)} title="处理申诉">
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
            <p>比赛: {resolveModal?.matchId}</p>
            <p>申诉方: {resolveModal?.submittedBy}</p>
            <p>原因: {resolveModal?.reason}</p>
          </div>

          <Select
            label="处理结果"
            value={resolution}
            onChange={(e) => setResolution(e.target.value as 'upheld' | 'rejected')}
            options={[
              { value: 'rejected', label: '驳回申诉' },
              { value: 'upheld', label: '支持申诉' },
            ]}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">处理意见</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E20]"
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="请输入处理意见"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={scoreChange}
              onChange={(e) => setScoreChange(e.target.checked)}
              className="rounded border-gray-300 text-[#1B5E20] focus:ring-[#1B5E20]"
            />
            <span className="text-sm text-gray-700">修改比分</span>
          </label>

          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setResolveModal(null)}>取消</Button>
            <Button
              variant={resolution === 'upheld' ? 'primary' : 'danger'}
              loading={submitting}
              onClick={handleResolve}
            >
              确认处理
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
