'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, Plus, Trash2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuthStore } from '@/stores/auth';
import type { IMatch } from '@/types';

interface MatchEvent {
  eventType: 'goal' | 'yellow_card' | 'red_card' | 'substitution' | 'other';
  playerId: string;
  minute: number;
  description: string;
}

export default function RefereeScoresPage() {
  const { user, authHeaders } = useAuthStore();
  const [matches, setMatches] = useState<IMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState('');
  const [homeScore, setHomeScore] = useState('0');
  const [awayScore, setAwayScore] = useState('0');
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMatches = async () => {
      if (!user?._id) return;
      try {
        const headers: Record<string, string> = authHeaders();
        const res = await fetch(`/api/schedules?refereeId=${user._id}`, { headers });
        if (res.ok) {
          const data = await res.json();
          setMatches((data.data || []).filter((m: IMatch) => m.status === 'in_progress' || m.status === 'completed'));
        }
      } catch {
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, [user, authHeaders]);

  const addEvent = () => {
    setEvents([...events, { eventType: 'goal', playerId: '', minute: 0, description: '' }]);
  };

  const removeEvent = (index: number) => {
    setEvents(events.filter((_, i) => i !== index));
  };

  const updateEvent = (index: number, field: keyof MatchEvent, value: string | number) => {
    const updated = [...events];
    updated[index] = { ...updated[index], [field]: value };
    setEvents(updated);
  };

  const handleSubmit = async () => {
    if (!selectedMatch) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/scores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify({
          matchId: selectedMatch,
          homeScore: Number(homeScore),
          awayScore: Number(awayScore),
          events: events.filter((e) => e.playerId || e.description),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '录入失败');
      }
      setSelectedMatch('');
      setHomeScore('0');
      setAwayScore('0');
      setEvents([]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '录入失败');
    } finally {
      setSubmitting(false);
    }
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
        <h1 className="text-2xl font-bold text-gray-900">录入比分</h1>

        {matches.length === 0 ? (
          <EmptyState title="暂无可录入的比赛" description="没有需要录入比分的比赛" />
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="space-y-6">
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

              {selectedMatch && (
                <>
                  <div className="flex items-center justify-center gap-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-500 mb-2">主队得分</p>
                      <input
                        type="number"
                        min={0}
                        value={homeScore}
                        onChange={(e) => setHomeScore(e.target.value)}
                        className="w-24 text-center text-3xl font-bold border border-gray-300 rounded-lg py-2 focus:outline-none focus:ring-2 focus:ring-[#1B5E20] text-[#1B5E20]"
                      />
                    </div>
                    <span className="text-2xl text-gray-300 mt-6">:</span>
                    <div className="text-center">
                      <p className="text-sm text-gray-500 mb-2">客队得分</p>
                      <input
                        type="number"
                        min={0}
                        value={awayScore}
                        onChange={(e) => setAwayScore(e.target.value)}
                        className="w-24 text-center text-3xl font-bold border border-gray-300 rounded-lg py-2 focus:outline-none focus:ring-2 focus:ring-[#1B5E20] text-[#1B5E20]"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Trophy size={16} /> 比赛事件
                      </h3>
                      <Button size="sm" variant="ghost" onClick={addEvent}>
                        <Plus size={14} className="mr-1" /> 添加事件
                      </Button>
                    </div>
                    {events.length > 0 && (
                      <div className="space-y-2">
                        {events.map((event, i) => (
                          <div key={i} className="flex items-end gap-2 p-3 bg-gray-50 rounded-lg">
                            <div className="w-28">
                              <Select
                                label="类型"
                                value={event.eventType}
                                onChange={(e) => updateEvent(i, 'eventType', e.target.value)}
                                options={[
                                  { value: 'goal', label: '进球' },
                                  { value: 'yellow_card', label: '黄牌' },
                                  { value: 'red_card', label: '红牌' },
                                  { value: 'substitution', label: '换人' },
                                  { value: 'other', label: '其他' },
                                ]}
                              />
                            </div>
                            <div className="w-24">
                              <Input label="球员ID" value={event.playerId} onChange={(e) => updateEvent(i, 'playerId', e.target.value)} placeholder="球员" />
                            </div>
                            <div className="w-20">
                              <Input label="分钟" type="number" value={String(event.minute)} onChange={(e) => updateEvent(i, 'minute', Number(e.target.value))} min={0} max={120} />
                            </div>
                            <div className="flex-1">
                              <Input label="描述" value={event.description} onChange={(e) => updateEvent(i, 'description', e.target.value)} placeholder="事件描述" />
                            </div>
                            <Button size="sm" variant="danger" onClick={() => removeEvent(i)} className="mb-0.5">
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {error && <p className="text-sm text-[#D32F2F]">{error}</p>}

                  <div className="flex justify-end">
                    <Button onClick={handleSubmit} loading={submitting}>
                      提交比分
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
