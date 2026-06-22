'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart3, Vote, Calendar, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';
import { Vote as VoteType } from '@/types';
import { formatDate } from '@/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Loading, EmptyState, PageHeader, StatsCard } from '@/components/ui/Feedback';
import { TrendLineChart } from '@/components/ui/Charts';

export default function ResidentHistoryPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [votes, setVotes] = useState<VoteType[]>([]);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      try {
        const myVotes = await api.getVotesByResident(user.id);
        setVotes(
          myVotes.sort(
            (a, b) => new Date(b.voted_at).getTime() - new Date(a.voted_at).getTime()
          )
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const monthStats = votes.reduce((acc, vote) => {
    const month = new Date(vote.voted_at).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
    });
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(monthStats)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ name: month, 投票数: count }));

  const totalParticipated = votes.length;
  const totalTopics = new Set(votes.map((v) => v.topic_id)).size;

  if (loading) return <Loading />;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        title="参与历史"
        description="查看您参与过的所有议题和投票记录"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          title="总参与次数"
          value={totalParticipated}
          icon={<Vote className="w-6 h-6" />}
          className="animate-stagger-1"
        />
        <StatsCard
          title="参与议题数"
          value={totalTopics}
          icon={<BarChart3 className="w-6 h-6" />}
          className="animate-stagger-2"
        />
        <StatsCard
          title="最近参与"
          value={votes.length > 0 ? formatDate(votes[0].voted_at) : '-'}
          icon={<Calendar className="w-6 h-6" />}
          className="animate-stagger-3"
        />
      </div>

      {chartData.length >= 2 && (
        <Card>
          <CardHeader>
            <CardTitle>参与趋势</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendLineChart
              data={chartData}
              xKey="name"
              yKeys={[{ key: '投票数', name: '参与次数', color: '#2563eb' }]}
              height={250}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>详细记录</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {votes.length === 0 ? (
            <EmptyState
              icon={<BarChart3 className="w-12 h-12" />}
              title="暂无参与记录"
              description="您还没有参与过任何投票，去议题列表看看吧"
              action={
                <Link href="/resident/topics">
                  <Button>查看议题列表</Button>
                </Link>
              }
            />
          ) : (
            <div className="space-y-3">
              {votes.map((vote, index) => (
                <div
                  key={vote.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors animate-fade-in-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-slate-900 truncate">
                        {vote.topic?.title}
                      </h4>
                      <Badge status="completed">已投票</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span>投给：{vote.option?.label}</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(vote.voted_at)}
                      </span>
                    </div>
                  </div>
                  <Link href={`/resident/topics/${vote.topic_id}`}>
                    <Button variant="ghost" size="sm">
                      查看详情
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
