'use client';

import { useEffect } from 'react';
import { Trophy, Medal, ArrowUp, ArrowDown, Minus, RefreshCw } from 'lucide-react';
import { useStandingStore } from '@/store/standings';

export default function StandingsPage() {
  const { standings, loading, fetchStandings, recalculateStandings } = useStandingStore();

  useEffect(() => {
    fetchStandings();
  }, [fetchStandings]);

  const handleRecalculate = () => {
    if (standings.length > 0) {
      const seasonId = (standings[0] as any).seasonId;
      if (seasonId) {
        recalculateStandings(seasonId);
      }
    }
  };

  const getRankStyle = (rank: number) => {
    if (rank === 1) return 'bg-accent text-secondary-dark';
    if (rank === 2) return 'bg-text-muted text-white';
    if (rank === 3) return 'bg-primary/80 text-white';
    return 'bg-border text-text-secondary';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold font-display text-text-primary flex items-center gap-3">
            <Trophy className="w-8 h-8 text-accent" />
            积分榜
          </h1>
          <p className="text-text-secondary mt-1">2024赛季实时排名</p>
        </div>
        <button
          onClick={handleRecalculate}
          disabled={loading}
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          重新计算
        </button>
      </div>

      <div className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-secondary/5 border-b border-border">
                <th className="px-4 py-4 text-left text-xs font-bold text-text-secondary uppercase tracking-wider w-16">
                  排名
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">
                  球队
                </th>
                <th className="px-4 py-4 text-center text-xs font-bold text-text-secondary uppercase tracking-wider w-16">
                  场次
                </th>
                <th className="px-4 py-4 text-center text-xs font-bold text-text-secondary uppercase tracking-wider w-16">
                  胜
                </th>
                <th className="px-4 py-4 text-center text-xs font-bold text-text-secondary uppercase tracking-wider w-16">
                  平
                </th>
                <th className="px-4 py-4 text-center text-xs font-bold text-text-secondary uppercase tracking-wider w-16">
                  负
                </th>
                <th className="px-4 py-4 text-center text-xs font-bold text-text-secondary uppercase tracking-wider w-20">
                  得分
                </th>
                <th className="px-4 py-4 text-center text-xs font-bold text-text-secondary uppercase tracking-wider w-20">
                  失分
                </th>
                <th className="px-4 py-4 text-center text-xs font-bold text-text-secondary uppercase tracking-wider w-20">
                  净胜分
                </th>
                <th className="px-4 py-4 text-center text-xs font-bold text-text-secondary uppercase tracking-wider w-16">
                  积分
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(8).fill(0).map((_, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td colSpan={10} className="px-4 py-4">
                      <div className="skeleton h-8 rounded" />
                    </td>
                  </tr>
                ))
              ) : standings.length > 0 ? (
                standings.map((standing, index) => {
                  const team = (standing.teamId as any) || {};
                  return (
                    <tr
                      key={standing._id}
                      className={`border-b border-border last:border-0 hover:bg-surface-hover transition-colors ${
                        index < 3 ? 'bg-accent/5' : ''
                      }`}
                    >
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${getRankStyle(standing.rank)}`}>
                          {standing.rank}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-sm">
                            {team.name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <div className="font-semibold text-text-primary">{team.name || '-'}</div>
                            <div className="text-xs text-text-secondary">{team.city || ''}</div>
                          </div>
                          {index < 3 && (
                            <Medal className={`w-5 h-5 ${
                              index === 0 ? 'text-accent' :
                              index === 1 ? 'text-text-muted' :
                              'text-primary'
                            }`} />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center text-text-primary font-medium">
                        {standing.played}
                      </td>
                      <td className="px-4 py-4 text-center text-success font-medium">
                        {standing.won}
                      </td>
                      <td className="px-4 py-4 text-center text-warning font-medium">
                        {standing.drawn}
                      </td>
                      <td className="px-4 py-4 text-center text-danger font-medium">
                        {standing.lost}
                      </td>
                      <td className="px-4 py-4 text-center text-text-primary">
                        {standing.pointsFor}
                      </td>
                      <td className="px-4 py-4 text-center text-text-primary">
                        {standing.pointsAgainst}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`font-medium ${
                          standing.pointDifference > 0 ? 'text-success' :
                          standing.pointDifference < 0 ? 'text-danger' :
                          'text-text-secondary'
                        }`}>
                          {standing.pointDifference > 0 ? '+' : ''}{standing.pointDifference}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-xl font-bold font-display text-primary">
                          {standing.points}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="px-4 py-16 text-center">
                    <Trophy className="w-16 h-16 text-text-muted mx-auto mb-4 opacity-30" />
                    <p className="text-text-secondary">暂无积分数据</p>
                    <p className="text-sm text-text-muted mt-1">比赛开始后将自动计算积分</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8 grid md:grid-cols-3 gap-6">
        <div className="bg-surface p-6 rounded-xl border border-border">
          <h3 className="font-bold text-text-primary mb-3 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-accent" />
            晋级区
          </h3>
          <p className="text-sm text-text-secondary">
            积分榜前4名晋级季后赛
          </p>
        </div>
        <div className="bg-surface p-6 rounded-xl border border-border">
          <h3 className="font-bold text-text-primary mb-3 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-danger" />
            降级区
          </h3>
          <p className="text-sm text-text-secondary">
            积分榜最后2名降级
          </p>
        </div>
        <div className="bg-surface p-6 rounded-xl border border-border">
          <h3 className="font-bold text-text-primary mb-3">积分规则</h3>
          <ul className="text-sm text-text-secondary space-y-1">
            <li>• 胜场积 2 分</li>
            <li>• 平场积 1 分</li>
            <li>• 负场积 0 分</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
