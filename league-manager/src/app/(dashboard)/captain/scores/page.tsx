'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, Check, X } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuthStore } from '@/stores/auth';
import type { IScore } from '@/types';

export default function CaptainScoresPage() {
  const { user, authHeaders } = useAuthStore();
  const [scores, setScores] = useState<IScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState<string | null>(null);

  const fetchPending = async () => {
    if (!user?._id) return;
    setLoading(true);
    try {
      const headers: Record<string, string> = authHeaders();
      const res = await fetch('/api/scores/pending', { headers });
      if (res.ok) {
        const data = await res.json();
        setScores(data.data || []);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, [user, authHeaders]);

  const handleConfirm = async (scoreId: string) => {
    setConfirming(scoreId);
    try {
      const res = await fetch(`/api/scores/${scoreId}/confirm`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify({ confirmed: true }),
      });
      if (res.ok) {
        fetchPending();
      }
    } catch {
    } finally {
      setConfirming(null);
    }
  };

  const handleReject = async (scoreId: string) => {
    setConfirming(scoreId);
    try {
      const res = await fetch(`/api/scores/${scoreId}/confirm`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify({ confirmed: false }),
      });
      if (res.ok) {
        fetchPending();
      }
    } catch {
    } finally {
      setConfirming(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">比分确认</h1>

        {loading ? (
          <div className="text-center py-8 text-gray-400">加载中...</div>
        ) : scores.length === 0 ? (
          <EmptyState title="暂无待确认比分" description="所有比分已确认" />
        ) : (
          <div className="space-y-4">
            {scores.map((score) => (
              <div key={score._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Trophy size={18} className="text-[#F9A825]" />
                      <span className="font-medium text-gray-900">比赛 {score.matchId}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-xs text-gray-500">主队</p>
                        <p className="text-3xl font-bold text-[#1B5E20]">{score.homeScore}</p>
                      </div>
                      <span className="text-xl text-gray-300">:</span>
                      <div className="text-center">
                        <p className="text-xs text-gray-500">客队</p>
                        <p className="text-3xl font-bold text-[#1B5E20]">{score.awayScore}</p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant={score.homeConfirmed ? 'success' : 'default'}>
                        主队{score.homeConfirmed ? '已确认' : '待确认'}
                      </Badge>
                      <Badge variant={score.awayConfirmed ? 'success' : 'default'}>
                        客队{score.awayConfirmed ? '已确认' : '待确认'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant="primary"
                      loading={confirming === score._id}
                      onClick={() => handleConfirm(score._id)}
                    >
                      <Check size={14} className="mr-1" /> 确认
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleReject(score._id)}
                    >
                      <X size={14} className="mr-1" /> 异议
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
