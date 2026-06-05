'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  CalendarDays,
  List,
  LayoutGrid
} from 'lucide-react';
import { useScheduleStore } from '@/store/schedule';

export default function SchedulePage() {
  const { matches, loading, fetchMatches } = useScheduleStore();
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedRound, setSelectedRound] = useState<number | ''>('');

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const rounds = [...new Set(matches.map(m => m.round))].sort((a, b) => a - b);

  const filteredMatches = matches.filter(m => 
    selectedRound === '' || m.round === selectedRound
  );

  const groupedByRound = filteredMatches.reduce((acc, match) => {
    const round = match.round;
    if (!acc[round]) acc[round] = [];
    acc[round].push(match);
    return acc;
  }, {} as Record<number, typeof matches>);

  const getStatusBadge = (status: string) => {
    const styles = {
      SCHEDULED: 'bg-primary/10 text-primary',
      LIVE: 'bg-success/10 text-success animate-pulse-soft',
      FINISHED: 'bg-secondary/10 text-text-secondary',
      CANCELLED: 'bg-danger/10 text-danger',
      POSTPONED: 'bg-warning/10 text-warning',
    };
    const labels = {
      SCHEDULED: '未开始',
      LIVE: '进行中',
      FINISHED: '已结束',
      CANCELLED: '已取消',
      POSTPONED: '已延期',
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-600'}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold font-display text-text-primary flex items-center gap-3">
            <Calendar className="w-8 h-8 text-primary" />
            赛程
          </h1>
          <p className="text-text-secondary mt-1">查看所有比赛安排和结果</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-surface rounded-lg p-1 border border-border">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list' ? 'bg-primary text-white' : 'text-text-secondary hover:bg-surface-hover'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'calendar' ? 'bg-primary text-white' : 'text-text-secondary hover:bg-surface-hover'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
            </button>
          </div>
          <div className="relative">
            <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <select
              value={selectedRound}
              onChange={(e) => setSelectedRound(e.target.value ? Number(e.target.value) : '')}
              className="pl-9 pr-8 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
            >
              <option value="">全部轮次</option>
              {rounds.map(r => (
                <option key={r} value={r}>第 {r} 轮</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="bg-surface p-6 rounded-xl border border-border">
              <div className="skeleton h-6 w-24 mb-4 rounded" />
              <div className="skeleton h-20 rounded" />
            </div>
          ))}
        </div>
      ) : Object.keys(groupedByRound).length > 0 ? (
        <div className="space-y-8">
          {Object.entries(groupedByRound).sort(([a], [b]) => Number(a) - Number(b)).map(([round, roundMatches]) => (
            <div key={round}>
              <h2 className="text-xl font-bold font-display text-text-primary mb-4 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary text-sm font-bold">
                  {round}
                </span>
                第 {round} 轮
              </h2>
              <div className="space-y-3">
                {roundMatches.map((match) => {
                  const homeTeam = (match.homeTeamId as any) || {};
                  const awayTeam = (match.awayTeamId as any) || {};
                  const venue = (match.venueId as any) || {};
                  
                  return (
                    <div
                      key={match._id}
                      className="bg-surface p-5 rounded-xl border border-border card-hover"
                    >
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex items-center gap-4 md:w-64">
                          <div className="text-center">
                            <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold">
                              {homeTeam.name?.charAt(0) || '?'}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-text-primary truncate">{homeTeam.name || '主队'}</div>
                            <div className="text-xs text-text-secondary">{homeTeam.city || ''}</div>
                          </div>
                        </div>

                        <div className="flex items-center justify-center gap-4 md:w-40">
                          {match.status === 'FINISHED' || match.status === 'LIVE' ? (
                            <div className="text-center">
                              <div className="flex items-center gap-3">
                                <span className="text-2xl font-bold font-display text-primary">
                                  {match.homeScore ?? 0}
                                </span>
                                <span className="text-text-muted text-lg">:</span>
                                <span className="text-2xl font-bold font-display text-secondary">
                                  {match.awayScore ?? 0}
                                </span>
                              </div>
                              {getStatusBadge(match.status)}
                            </div>
                          ) : (
                            <div className="text-center">
                              <div className="text-xl font-bold font-display text-text-muted">VS</div>
                              {getStatusBadge(match.status)}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-4 md:w-64 md:flex-row-reverse">
                          <div className="text-center md:order-last">
                            <div className="w-12 h-12 rounded-full bg-gradient-secondary flex items-center justify-center text-white font-bold">
                              {awayTeam.name?.charAt(0) || '?'}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0 md:text-right">
                            <div className="font-semibold text-text-primary truncate">{awayTeam.name || '客队'}</div>
                            <div className="text-xs text-text-secondary">{awayTeam.city || ''}</div>
                          </div>
                        </div>

                        <div className="flex-1 flex flex-col md:flex-row md:items-center md:justify-end gap-2 md:gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-border md:border-none">
                          <div className="flex items-center gap-1.5 text-sm text-text-secondary">
                            <Clock className="w-4 h-4" />
                            {new Date(match.startTime).toLocaleString('zh-CN', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                          <div className="flex items-center gap-1.5 text-sm text-text-secondary">
                            <MapPin className="w-4 h-4" />
                            <span className="truncate">{venue.name || '待定'}</span>
                          </div>
                        </div>
                      </div>

                      {match.rosterLocked && (
                        <div className="mt-3 pt-3 border-t border-border flex items-center gap-2 text-xs text-warning">
                          <Lock className="w-3.5 h-3.5" />
                          阵容已锁定
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-surface p-16 rounded-xl border border-border text-center">
          <Calendar className="w-16 h-16 text-text-muted mx-auto mb-4 opacity-30" />
          <h3 className="font-bold text-text-primary text-lg mb-2">暂无赛程</h3>
          <p className="text-text-secondary">新赛季赛程即将发布，敬请期待</p>
        </div>
      )}
    </div>
  );
}

function Lock({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
