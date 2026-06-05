import { useEffect, useState } from 'react';
import { Star, MessageSquare, BookOpen } from 'lucide-react';
import { feedbackApi } from '@/lib/api';
import EmptyState from '@/components/EmptyState';

interface CourseStat {
  course_id: number;
  course_name: string;
  avg_rating: number;
  total_feedback: number;
}

function SatisfactionGauge({ value }: { value: number }) {
  const percentage = (value / 5) * 100;
  let color = '#ef4444';
  if (percentage >= 80) color = '#22c55e';
  else if (percentage >= 60) color = '#D4A84B';
  else if (percentage >= 40) color = '#f59e0b';

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-40 h-20 overflow-hidden">
        <svg viewBox="0 0 120 60" className="w-full h-full">
          <path
            d="M 10 55 A 50 50 0 0 1 110 55"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <path
            d="M 10 55 A 50 50 0 0 1 110 55"
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${(percentage / 100) * 157} 157`}
            className="progress-bar-animated"
          />
        </svg>
        <div className="absolute inset-0 flex items-end justify-center pb-1">
          <span className="text-2xl font-bold text-museum">{value.toFixed(1)}</span>
        </div>
      </div>
      <div className="flex justify-center mt-2">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star key={s} size={16} className={s <= Math.round(value) ? 'text-gold fill-gold' : 'text-gray-300'} />
        ))}
      </div>
      <p className="text-xs text-slate-400 mt-1">总体满意度</p>
    </div>
  );
}

export default function FeedbackStats() {
  const [stats, setStats] = useState<CourseStat[]>([]);
  const [ratingDist, setRatingDist] = useState<Record<number, number>>({1: 0, 2: 0, 3: 0, 4: 0, 5: 0});
  const [, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await feedbackApi.getStats();
      if (data.courseStats) setStats(data.courseStats);
      if (data.ratingDistribution) setRatingDist(data.ratingDistribution);
    } catch {} finally {
      setLoading(false);
    }
  };

  const maxCount = Math.max(...Object.values(ratingDist), 1);
  const totalFeedback = Object.values(ratingDist).reduce((a, b) => a + b, 0);
  const avgRating = totalFeedback > 0
    ? Object.entries(ratingDist).reduce((sum, [r, c]) => sum + Number(r) * c, 0) / totalFeedback
    : 0;

  const barGradients = [
    'linear-gradient(90deg, #D4A84B, #f0c75e)',
    'linear-gradient(90deg, #1B3A5C, #3b6fa0)',
    'linear-gradient(90deg, #22c55e, #6ee7a0)',
    'linear-gradient(90deg, #8b5cf6, #c4b5fd)',
    'linear-gradient(90deg, #f59e0b, #fcd34d)',
    'linear-gradient(90deg, #ef4444, #fca5a5)',
  ];

  return (
    <div className="space-y-6 page-enter">
      <h1 className="page-title">反馈统计</h1>

      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center shrink-0">
            <Star size={24} className="text-gold" />
          </div>
          <div>
            <p className="text-2xl font-bold text-museum">{avgRating.toFixed(1)}</p>
            <p className="text-sm text-slate-500">平均评分</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <MessageSquare size={24} className="text-blue-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-museum">{totalFeedback}</p>
            <p className="text-sm text-slate-500">总反馈数</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
            <BookOpen size={24} className="text-green-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-museum">{stats.length}</p>
            <p className="text-sm text-slate-500">已评价课程</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="section-title mb-5">各课程评分</h2>
          {stats.length === 0 ? (
            <EmptyState message="暂无数据" />
          ) : (
            <div className="space-y-4">
              {stats.map((s, idx) => (
                <div key={s.course_id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-slate-700 font-medium truncate max-w-[180px]">{s.course_name}</span>
                    <div className="flex items-center gap-1.5">
                      <Star size={12} className="text-gold fill-gold" />
                      <span className="text-sm font-bold text-museum">{s.avg_rating.toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="h-2.5 rounded-full progress-bar-animated"
                      style={{
                        width: `${(s.avg_rating / 5) * 100}%`,
                        background: barGradients[idx % barGradients.length],
                      }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{s.total_feedback} 条反馈</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="section-title mb-5">评分分布</h2>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((r) => {
              const count = ratingDist[r];
              const pct = totalFeedback > 0 ? Math.round((count / totalFeedback) * 100) : 0;
              const barPct = maxCount > 0 ? (count / maxCount) * 100 : 0;
              return (
                <div key={r} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-12 shrink-0">
                    <span className="text-sm font-bold text-slate-700">{r}</span>
                    <Star size={11} className="text-gold fill-gold" />
                  </div>
                  <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                    <div
                      className="h-5 rounded-full progress-bar-animated flex items-center justify-end pr-2"
                      style={{
                        width: `${barPct}%`,
                        minWidth: count > 0 ? '2.5rem' : '0',
                        background: barGradients[5 - r] || barGradients[0],
                      }}
                    >
                      {count > 0 && <span className="text-[10px] text-white font-medium">{count}</span>}
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 w-10 text-right shrink-0">{pct}%</span>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-5 border-t border-gray-100">
            <SatisfactionGauge value={avgRating} />
          </div>
        </div>
      </div>
    </div>
  );
}
