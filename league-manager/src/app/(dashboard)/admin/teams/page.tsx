'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Eye, Check, X } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useAuthStore } from '@/stores/auth';
import type { ITeam, TeamStatus } from '@/types';

const statusMap: Record<TeamStatus, { label: string; variant: 'success' | 'warning' | 'danger' | 'default' }> = {
  pending: { label: '待审核', variant: 'warning' },
  approved: { label: '已通过', variant: 'success' },
  rejected: { label: '已拒绝', variant: 'danger' },
  withdrawn: { label: '已退出', variant: 'default' },
};

export default function AdminTeamsPage() {
  const { authHeaders } = useAuthStore();
  const [teams, setTeams] = useState<ITeam[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [reviewModal, setReviewModal] = useState<{ team: ITeam; action: 'approved' | 'rejected' } | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const pageSize = 10;

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
      });
      if (statusFilter) params.set('status', statusFilter);
      if (search) params.set('search', search);

      const res = await fetch(`/api/teams?${params}`, {
        headers: authHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setTeams(data.data || []);
        setTotal(data.total || 0);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, [page, statusFilter, authHeaders]);

  const handleReview = async () => {
    if (!reviewModal) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/teams/${reviewModal.team._id}/review`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify({
          status: reviewModal.action,
          reviewComment: comment,
        }),
      });
      if (res.ok) {
        setReviewModal(null);
        setComment('');
        fetchTeams();
      }
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  const columns = [
    { key: 'name', header: '球队名' },
    { key: 'contact', header: '领队', render: (row: ITeam) => row.contact || '-' },
    { key: 'phone', header: '联系方式', render: (row: ITeam) => row.phone || '-' },
    {
      key: 'status',
      header: '状态',
      render: (row: ITeam) => {
        const s = statusMap[row.status];
        return <Badge variant={s.variant}>{s.label}</Badge>;
      },
    },
    {
      key: 'createdAt',
      header: '报名时间',
      render: (row: ITeam) => new Date(row.createdAt).toLocaleDateString('zh-CN'),
    },
    {
      key: 'actions',
      header: '操作',
      render: (row: ITeam) => (
        <div className="flex items-center gap-2">
          <Link href={`/admin/teams/review`}>
            <Button size="sm" variant="ghost"><Eye size={14} /></Button>
          </Link>
          {row.status === 'pending' && (
            <>
              <Button
                size="sm"
                variant="primary"
                onClick={() => { setReviewModal({ team: row, action: 'approved' }); setComment(''); }}
              >
                <Check size={14} />
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => { setReviewModal({ team: row, action: 'rejected' }); setComment(''); }}
              >
                <X size={14} />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">球队管理</h1>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="w-40">
              <Select
                label="状态筛选"
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                options={[
                  { value: '', label: '全部' },
                  { value: 'pending', label: '待审核' },
                  { value: 'approved', label: '已通过' },
                  { value: 'rejected', label: '已拒绝' },
                ]}
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <Input
                label="搜索"
                placeholder="搜索球队名..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button onClick={() => { setPage(1); fetchTeams(); }} size="md">
              <Search size={16} className="mr-1" /> 搜索
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <Table columns={columns} data={teams} emptyText="暂无球队数据" />
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-gray-500">共 {total} 条</p>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>上一页</Button>
                <Button size="sm" variant="ghost" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>下一页</Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal
        open={!!reviewModal}
        onClose={() => setReviewModal(null)}
        title={reviewModal?.action === 'approved' ? '通过审核' : '拒绝审核'}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            球队: <span className="font-medium">{reviewModal?.team.name}</span>
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">审核意见</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E20]"
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="请输入审核意见（可选）"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setReviewModal(null)}>取消</Button>
            <Button
              variant={reviewModal?.action === 'approved' ? 'primary' : 'danger'}
              loading={submitting}
              onClick={handleReview}
            >
              确认{reviewModal?.action === 'approved' ? '通过' : '拒绝'}
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
