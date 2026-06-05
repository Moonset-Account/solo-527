'use client';

import React, { useState, useEffect } from 'react';
import { Users, Plus, Trash2, Lock, AlertTriangle } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuthStore } from '@/stores/auth';
import type { ITeam, IPlayer } from '@/types';

export default class CaptainRosterPage extends React.Component {
  render() {
    return <CaptainRosterContent />;
  }
}

function CaptainRosterContent() {
  const { user, authHeaders } = useAuthStore();
  const [team, setTeam] = useState<ITeam | null>(null);
  const [players, setPlayers] = useState<IPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newNumber, setNewNumber] = useState('');
  const [newPosition, setNewPosition] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    if (!user?._id) return;
    setLoading(true);
    try {
      const headers: Record<string, string> = authHeaders();
      const teamsRes = await fetch('/api/teams?captainId=' + user._id, { headers });
      if (teamsRes.ok) {
        const data = await teamsRes.json();
        const myTeam = data.data?.[0] || null;
        setTeam(myTeam);
        if (myTeam) {
          const rosterRes = await fetch(`/api/teams/${myTeam._id}/roster`, { headers });
          if (rosterRes.ok) {
            const r = await rosterRes.json();
            setPlayers(r.data || []);
          }
        }
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, authHeaders]);

  const isLocked = !!team?.rosterLockedAt;

  const handleAddPlayer = async () => {
    if (!team || !newName.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/teams/${team._id}/roster`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify({
          name: newName,
          jerseyNumber: newNumber,
          position: newPosition || undefined,
        }),
      });
      if (res.ok) {
        setAddModal(false);
        setNewName('');
        setNewNumber('');
        setNewPosition('');
        fetchData();
      }
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemovePlayer = async (playerId: string) => {
    if (!team) return;
    try {
      const res = await fetch(`/api/teams/${team._id}/roster`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify({ playerId }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch {}
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-8 text-gray-400">加载中...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">球员管理</h1>
          {!isLocked && (
            <Button onClick={() => setAddModal(true)}>
              <Plus size={16} className="mr-1" /> 添加球员
            </Button>
          )}
        </div>

        {isLocked && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-[#D32F2F] px-4 py-3 rounded-lg text-sm">
            <AlertTriangle size={16} className="shrink-0" />
            名单已于 {new Date(team!.rosterLockedAt!).toLocaleDateString('zh-CN')} 锁定，无法增删球员
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b flex items-center gap-2">
            <Users size={18} className="text-gray-500" />
            <span className="font-semibold text-gray-900">球员名单</span>
            <Badge variant="default">{players.length} 人</Badge>
            {isLocked && <Badge variant="danger"><Lock size={10} className="mr-1" />已锁定</Badge>}
          </div>
          {players.length === 0 ? (
            <EmptyState title="暂无球员" description="点击上方按钮添加球员" />
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">姓名</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">号码</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">位置</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {players.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{p.jerseyNumber || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{p.position || '-'}</td>
                    <td className="px-4 py-3 text-right">
                      {!isLocked && (
                        <Button size="sm" variant="danger" onClick={() => handleRemovePlayer(p._id)}>
                          <Trash2 size={14} />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal open={addModal} onClose={() => setAddModal(false)} title="添加球员">
        <div className="space-y-4">
          <Input label="姓名" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="请输入球员姓名" required />
          <Input label="球衣号码" value={newNumber} onChange={(e) => setNewNumber(e.target.value)} placeholder="如 10" />
          <Select
            label="位置"
            value={newPosition}
            onChange={(e) => setNewPosition(e.target.value)}
            options={[
              { value: '', label: '选择位置' },
              { value: 'GK', label: '门将' },
              { value: 'DEF', label: '后卫' },
              { value: 'MID', label: '中场' },
              { value: 'FWD', label: '前锋' },
              { value: 'OTHER', label: '其他' },
            ]}
          />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setAddModal(false)}>取消</Button>
            <Button loading={submitting} onClick={handleAddPlayer} disabled={!newName.trim()}>添加</Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
