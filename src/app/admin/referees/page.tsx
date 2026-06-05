'use client';

import { useState, useEffect } from 'react';
import { 
  UserCheck, 
  Calendar, 
  MapPin, 
  Clock, 
  Save,
  Users,
  Check,
  Search
} from 'lucide-react';
import type { Match } from '@/lib/types';

interface Referee {
  _id: string;
  name: string;
  level: string;
}

const mockReferees: Referee[] = [
  { _id: 'r1', name: '张明', level: '国家级' },
  { _id: 'r2', name: '李强', level: '国家级' },
  { _id: 'r3', name: '王芳', level: '一级' },
  { _id: 'r4', name: '刘伟', level: '一级' },
  { _id: 'r5', name: '陈静', level: '二级' },
  { _id: 'r6', name: '赵军', level: '二级' },
];

const mockMatches: (Match & { homeTeamName?: string; awayTeamName?: string; venueName?: string })[] = [
  {
    _id: 'm1',
    seasonId: 's1',
    round: 1,
    homeTeamId: 't1',
    awayTeamId: 't2',
    venueId: 'v1',
    refereeIds: [],
    startTime: new Date('2024-01-20T19:00:00'),
    status: 'SCHEDULED',
    rosterLocked: false,
    lockTime: new Date(),
    homeTeamName: '猛虎队',
    awayTeamName: '飞鹰队',
    venueName: '首都体育馆',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: 'm2',
    seasonId: 's1',
    round: 1,
    homeTeamId: 't3',
    awayTeamId: 't4',
    venueId: 'v2',
    refereeIds: [],
    startTime: new Date('2024-01-20T19:30:00'),
    status: 'SCHEDULED',
    rosterLocked: false,
    lockTime: new Date(),
    homeTeamName: '烈焰队',
    awayTeamName: '风暴队',
    venueName: '东方体育中心',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: 'm3',
    seasonId: 's1',
    round: 2,
    homeTeamId: 't1',
    awayTeamId: 't3',
    venueId: 'v1',
    refereeIds: ['r1', 'r2'],
    startTime: new Date('2024-01-25T19:00:00'),
    status: 'SCHEDULED',
    rosterLocked: false,
    lockTime: new Date(),
    homeTeamName: '猛虎队',
    awayTeamName: '烈焰队',
    venueName: '首都体育馆',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export default function AdminRefereesPage() {
  const [matches, setMatches] = useState(mockMatches);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReferees, setSelectedReferees] = useState<Record<string, string[]>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const fetchMatches = async () => {
    try {
      const res = await fetch('/api/matches');
      const data = await res.json();
      if (data.success && data.data) {
        setMatches(data.data);
        const initial: Record<string, string[]> = {};
        data.data.forEach((m: Match) => {
          initial[m._id] = m.refereeIds || [];
        });
        setSelectedReferees(initial);
      }
    } catch (error) {
      console.error('获取比赛列表失败:', error);
      const initial: Record<string, string[]> = {};
      mockMatches.forEach((m) => {
        initial[m._id] = m.refereeIds || [];
      });
      setSelectedReferees(initial);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  const filteredMatches = matches.filter((match) => {
    const search = searchTerm.toLowerCase();
    return (
      (match.homeTeamName || '').toLowerCase().includes(search) ||
      (match.awayTeamName || '').toLowerCase().includes(search) ||
      (match.venueName || '').toLowerCase().includes(search)
    );
  });

  const toggleReferee = (matchId: string, refereeId: string) => {
    setSelectedReferees((prev) => {
      const current = prev[matchId] || [];
      if (current.includes(refereeId)) {
        return { ...prev, [matchId]: current.filter((id) => id !== refereeId) };
      } else if (current.length < 3) {
        return { ...prev, [matchId]: [...current, refereeId] };
      }
      return prev;
    });
  };

  const handleSave = async (matchId: string) => {
    setSavingId(matchId);
    try {
      await fetch(`/api/matches/${matchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refereeIds: selectedReferees[matchId] || [] }),
      });
      setMatches((prev) =>
        prev.map((m) =>
          m._id === matchId
            ? { ...m, refereeIds: selectedReferees[matchId] || [] }
            : m
        )
      );
    } catch (error) {
      console.error('保存失败:', error);
    } finally {
      setSavingId(null);
    }
  };

  const unassignedMatches = filteredMatches.filter((m) => !m.refereeIds || m.refereeIds.length === 0);
  const assignedMatches = filteredMatches.filter((m) => m.refereeIds && m.refereeIds.length > 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-display text-text-primary flex items-center gap-3">
          <UserCheck className="w-8 h-8 text-secondary" />
          裁判安排
        </h1>
        <p className="text-text-secondary mt-1">
          为比赛分配裁判（每场1-3名）
        </p>
      </div>

      <div className="relative mb-6">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          placeholder="搜索球队或场馆..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-surface border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
        />
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="bg-surface rounded-xl border border-border p-5">
              <div className="skeleton h-6 w-1/3 mb-3 rounded" />
              <div className="space-y-2">
                <div className="skeleton h-4 w-1/2 rounded" />
                <div className="skeleton h-4 w-1/3 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {unassignedMatches.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-warning" />
                待安排裁判 ({unassignedMatches.length})
              </h2>
              <div className="space-y-4">
                {unassignedMatches.map((match) => (
                  <div
                    key={match._id}
                    className="bg-surface rounded-xl border border-border p-5"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-bold text-text-primary">
                            {match.homeTeamName}
                          </span>
                          <span className="text-text-muted">vs</span>
                          <span className="font-bold text-text-primary">
                            {match.awayTeamName}
                          </span>
                          <span className="px-2 py-0.5 bg-secondary/10 text-secondary text-xs font-medium rounded-full">
                            第{match.round}轮
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(match.startTime).toLocaleDateString('zh-CN')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {new Date(match.startTime).toLocaleTimeString('zh-CN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {match.venueName}
                          </span>
                        </div>
                      </div>

                      <div className="lg:w-80">
                        <p className="text-xs text-text-muted mb-2">选择裁判（最多3名）</p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {mockReferees.map((referee) => {
                            const isSelected = (selectedReferees[match._id] || []).includes(referee._id);
                            return (
                              <button
                                key={referee._id}
                                onClick={() => toggleReferee(match._id, referee._id)}
                                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                  isSelected
                                    ? 'bg-primary text-white'
                                    : 'bg-surface-hover text-text-primary hover:bg-primary/10'
                                }`}
                              >
                                {isSelected && <Check className="w-3 h-3" />}
                                {referee.name}
                                <span className="text-[10px] opacity-70">{referee.level}</span>
                              </button>
                            );
                          })}
                        </div>
                        <button
                          onClick={() => handleSave(match._id)}
                          disabled={
                            !(selectedReferees[match._id] || []).length ||
                            savingId === match._id
                          }
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Save className="w-4 h-4" />
                          {savingId === match._id ? '保存中...' : '保存'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {assignedMatches.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-success" />
                已安排裁判 ({assignedMatches.length})
              </h2>
              <div className="space-y-4">
                {assignedMatches.map((match) => (
                  <div
                    key={match._id}
                    className="bg-surface rounded-xl border border-border p-5"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-bold text-text-primary">
                            {match.homeTeamName}
                          </span>
                          <span className="text-text-muted">vs</span>
                          <span className="font-bold text-text-primary">
                            {match.awayTeamName}
                          </span>
                          <span className="px-2 py-0.5 bg-secondary/10 text-secondary text-xs font-medium rounded-full">
                            第{match.round}轮
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(match.startTime).toLocaleDateString('zh-CN')}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {match.venueName}
                          </span>
                        </div>
                      </div>

                      <div className="lg:w-80">
                        <p className="text-xs text-text-muted mb-2">已选裁判</p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {(selectedReferees[match._id] || match.refereeIds).map((rid) => {
                            const referee = mockReferees.find((r) => r._id === rid);
                            return (
                              <span
                                key={rid}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-success/10 text-success rounded-full text-xs font-medium"
                              >
                                <Check className="w-3 h-3" />
                                {referee?.name || rid}
                              </span>
                            );
                          })}
                        </div>
                        <button
                          onClick={() => handleSave(match._id)}
                          disabled={savingId === match._id}
                          className="inline-flex items-center gap-1.5 px-4 py-2 border border-border rounded-lg text-sm font-medium text-text-primary hover:bg-surface-hover transition-colors"
                        >
                          <UserCheck className="w-4 h-4" />
                          重新安排
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {filteredMatches.length === 0 && (
            <div className="bg-surface rounded-xl border border-border p-12 text-center">
              <UserCheck className="w-16 h-16 text-text-muted mx-auto mb-4 opacity-30" />
              <h3 className="font-bold text-text-primary text-lg mb-2">暂无比赛</h3>
              <p className="text-text-secondary">
                {searchTerm ? '没有找到匹配的比赛' : '暂无需安排裁判的比赛'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
