'use client';

import React, { useState, useEffect } from 'react';
import { Check, X, ChevronDown, ChevronUp, Clock, User } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuthStore } from '@/stores/auth';
import type { ITeam, IPlayer } from '@/types';

export default function TeamReviewPage() {
  const { authHeaders } = useAuthStore();
  const [teams, setTeams] = useState<ITeam[]>([]);
  const [players, setPlayers] = useState<Record<string, IPlayer[]>>({});
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [reviewModal, setReviewModal] = useState<{ team: ITeam; action: 'approved' | 'rejected' } | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchPendingTeams = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/teams?status=pending', {
        headers: authHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setTeams(data.data || []);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamPlayers = async (teamId: string) => {
    try {
      const res = await fetch(`/api/teams/${teamId}/roster`, {
        headers: authHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setPlayers((prev) => ({ ...prev, [teamId]: data.data || [] }));
      }
    } catch {}
  };

  useEffect(() => {
    fetchPendingTeams();
  }, [authHeaders]);

  const toggleExpand = (teamId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(teamId)) {
        next.delete(teamId);
      } else {
        next.add(teamId);
        if (!players[teamId]) fetchTeamPlayers(teamId);
      }
      return next;
    });
  };

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
        fetchPendingTeams();
      }
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">报名审核</h1>

        {loading ? (
          <div className="text-center py-8 text-gray-400">加载中...</div>
        ) : teams.length === 0 ? (
          <EmptyState title="暂无待审核球队" description="所有球队已完成审核" />
        ) : (
          <div className="space-y-3">
            {teams.map((team) => (
              <div key={team._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleExpand(team._id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#1B5E20]/10 flex items-center justify-center">
                      <User size={20} className="text-[#1B5E20]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{team.name}</h3>
                      <div className="flex items-center gap-3 text-sm text-gray-500 mt-0.5">
                        <span>领队: {team.contact || '-'}</span>
                        <span>电话: {team.phone || '-'}</span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(team.createdAt).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="warning">待审核</Badge>
                    {expanded.has(team._id) ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </div>

                {expanded.has(team._id) && (
                  <div className="border-t px-4 py-4 bg-gray-50">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">球员名单</h4>
                    {players[team._id] ? (
                      players[team._id].length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {players[team._id].map((p) => (
                            <div key={p._id} className="bg-white px-3 py-2 rounded-lg text-sm border">
                              <span className="font-medium">{p.name}</span>
                              {p.jerseyNumber && <span className="text-gray-400 ml-2">#{p.jerseyNumber}</span>}
                              {p.position && <span className="text-gray-400 ml-2">{p.position}</span>}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">暂无球员信息</p>
                      )
                    ) : (
                      <p className="text-sm text-gray-400">加载中...</p>
                    )}

                    <div className="flex justify-end gap-3 mt-4">
                      <Button
                        variant="danger"
                        onClick={() => { setReviewModal({ team, action: 'rejected' }); setComment(''); }}
                      >
                        <X size={16} className="mr-1" /> 拒绝
                      </Button>
                      <Button
                        variant="primary"
                        onClick={() => { setReviewModal({ team, action: 'approved' }); setComment(''); }}
                      >
                        <Check size={16} className="mr-1" /> 通过
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
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
