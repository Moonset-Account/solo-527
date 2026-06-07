'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { trpc } from '@/hooks/use-trpc';
import { cn } from '@/lib/utils';
import { Loader2, Trophy, Medal, Award } from 'lucide-react';

type SortBy = 'waitlist' | 'conversionRate' | 'waitDays';

type RankingItem = {
  courseId: string;
  courseName: string;
  campusName: string;
  waitlistCount: number;
  convertedCount: number;
  conversionRate: number;
  avgWaitDays: number;
  classCapacity: number;
  suggestion: 'urgent' | 'recommended' | 'normal';
  lowSample: boolean;
};

const SORT_OPTIONS: { key: SortBy; label: string }[] = [
  { key: 'waitlist', label: '候补量' },
  { key: 'conversionRate', label: '转正率' },
  { key: 'waitDays', label: '等待天数' },
];

const SUGGESTION_BADGE: Record<string, { label: string; className: string }> = {
  urgent: { label: '急需加开', className: 'bg-red-100 text-red-700' },
  recommended: { label: '建议加开', className: 'bg-orange-100 text-orange-700' },
  normal: { label: '正常', className: 'bg-gray-100 text-gray-500' },
};

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
  if (rank === 3) return <Award className="h-5 w-5 text-amber-700" />;
  return null;
}

export default function RankingPage() {
  const [sortBy, setSortBy] = useState<SortBy>('waitlist');

  const { data: rankings, isLoading } = useQuery({
    queryKey: ['ranking.list', sortBy],
    queryFn: () => trpc.ranking.list.query({ sortBy }),
  });

  const validRankings = ((rankings as RankingItem[] | undefined) ?? []);

  const maxWaitlist = Math.max(...validRankings.map((r) => r.waitlistCount), 1);

  return (
    <div className="min-h-screen bg-[#F5F7FA] p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#1E3A5F]">课程排名</h1>
          <p className="mt-1 text-sm text-gray-500">按候补量、转正率、等待天数排名，辅助加开班次决策</p>
        </div>

        <div className="mb-6 flex items-center gap-2">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSortBy(opt.key)}
              className={cn(
                'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                sortBy === opt.key
                  ? 'bg-[#1E3A5F] text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-sm text-gray-500">加载中...</span>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">排名</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">课程名称</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">所属校区</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">候补人数</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">班级容量</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">转正率</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">平均等待</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">加开建议</th>
                </tr>
              </thead>
              <tbody>
                {validRankings.map((item, idx) => {
                  const rank = idx + 1;
                  const badge = SUGGESTION_BADGE[item.suggestion] ?? SUGGESTION_BADGE.normal;
                  return (
                    <tr
                      key={item.courseId}
                      className={cn(
                        'border-b border-gray-50 hover:bg-gray-50/50',
                        idx % 2 === 1 && 'bg-gray-50/30'
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {rank <= 3 && <RankIcon rank={rank} />}
                          <span className={cn('text-sm font-bold', rank <= 3 ? 'text-[#1E3A5F]' : 'text-gray-600')}>
                            {rank}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.courseName}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.campusName}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-700">{item.waitlistCount}</span>
                          <div className="h-2 w-20 rounded-full bg-gray-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[#E8A838]"
                              style={{ width: `${(item.waitlistCount / maxWaitlist) * 100}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.classCapacity}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-700">
                        {(item.conversionRate * 100).toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.avgWaitDays} 天</td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', badge.className)}>
                          {badge.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
