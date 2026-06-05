'use client';

import React, { useState, useEffect } from 'react';
import { UserCheck, Calendar, Plus } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuthStore } from '@/stores/auth';

interface RefereeInfo {
  _id: string;
  name: string;
  email: string;
  assignedMatches: number;
}

export default function AdminRefereesPage() {
  const { authHeaders } = useAuthStore();
  const [referees, setReferees] = useState<RefereeInfo[]>([]);
  const [matches, setMatches] = useState<{ _id: string; homeTeamId: string; awayTeamId: string; matchDate: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignModal, setAssignModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState('');
  const [selectedReferee, setSelectedReferee] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers: Record<string, string> = authHeaders();
      const [refRes, matchesRes] = await Promise.all([
        fetch('/api/referees', { headers }),
        fetch('/api/schedules?status=confirmed', { headers }),
      ]);
      if (refRes.ok) {
        const data = await refRes.json();
        setReferees(data.data || []);
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
  }, [authHeaders]);

  const handleAssign = async () => {
    if (!selectedMatch || !selectedReferee) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/schedules/${selectedMatch}/referee`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify({ refereeId: selectedReferee }),
      });
      if (res.ok) {
        setAssignModal(false);
        setSelectedMatch('');
        setSelectedReferee('');
        fetchData();
      }
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">裁判管理</h1>
          <Button onClick={() => setAssignModal(true)}>
            <Plus size={16} className="mr-1" /> 指派裁判
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-400">加载中...</div>
        ) : referees.length === 0 ? (
          <EmptyState title="暂无裁判" description="系统中还没有裁判用户" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {referees.map((ref) => (
              <div key={ref._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1B5E20]/10 flex items-center justify-center">
                    <UserCheck size={20} className="text-[#1B5E20]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{ref.name}</h3>
                    <p className="text-xs text-gray-500">{ref.email}</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t flex items-center gap-2">
                  <Calendar size={14} className="text-gray-400" />
                  <span className="text-sm text-gray-600">已指派: {ref.assignedMatches} 场</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={assignModal} onClose={() => setAssignModal(false)} title="指派裁判">
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
          <Select
            label="选择裁判"
            value={selectedReferee}
            onChange={(e) => setSelectedReferee(e.target.value)}
            options={[
              { value: '', label: '请选择裁判' },
              ...referees.map((r) => ({ value: r._id, label: r.name })),
            ]}
          />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setAssignModal(false)}>取消</Button>
            <Button loading={submitting} onClick={handleAssign} disabled={!selectedMatch || !selectedReferee}>
              确认指派
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
