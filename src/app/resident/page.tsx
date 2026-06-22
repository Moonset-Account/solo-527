'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Vote,
  Clock,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Calendar,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';
import { Topic, Vote as VoteType } from '@/types';
import { formatDate, getDaysRemaining, isExpired } from '@/utils';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { StatsCard, Loading, EmptyState } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/Button';
import { ProgressRing } from '@/components/ui/Charts';

export default function ResidentDashboard() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [votes, setVotes] = useState<VoteType[]>([]);
  const [stats, setStats] = useState({
    totalTopics: 0,
    pendingVotes: 0,
    participated: 0,
    participationRate: 0,
  });

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      try {
        const [allTopics, myVotes] = await Promise.all([
          api.getTopics('ongoing'),
          api.getVotesByResident(user.id),
        ]);

        const votedTopicIds = new Set(myVotes.map((v) => v.topic_id));
        const pending = allTopics.filter(
          (t) => !votedTopicIds.has(t.id) && t.type === 'vote'
        );

        setTopics(allTopics.slice(0, 5));
        setVotes(myVotes);
        setStats({
          totalTopics: allTopics.length,
          pendingVotes: pending.length,
          participated: myVotes.length,
          participationRate:
            allTopics.length > 0
              ? Math.round((votedTopicIds.size / (allTopics.length + myVotes.length - votedTopicIds.size)) * 100)
              : 0,
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  if (loading) return <Loading />;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 font-serif">
          欢迎回来，{user?.name}
        </h1>
        <p className="mt-1 text-slate-500">
          查看待投票议题和您的参与记录
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="待投票议题"
          value={stats.pendingVotes}
          icon={<Vote className="w-6 h-6" />}
          className="animate-stagger-1"
        />
        <StatsCard
          title="已参与投票"
          value={stats.participated}
          icon={<CheckCircle2 className="w-6 h-6" />}
          className="animate-stagger-2"
        />
        <StatsCard
          title="进行中议题"
          value={stats.totalTopics}
          icon={<Calendar className="w-6 h-6" />}
          className="animate-stagger-3"
        />
        <Card className="p-6 animate-stagger-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">参与率</p>
              <div className="mt-4 flex items-end gap-2">
                <ProgressRing progress={stats.participationRate} size={80} />
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>待投票议题</CardTitle>
              <Link href="/resident/topics">
                <Button variant="ghost" size="sm">
                  查看全部
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {topics.length === 0 ? (
                <EmptyState
                  icon={<Vote className="w-12 h-12" />}
                  title="暂无待投票议题"
                  description="当前没有需要您参与投票的议题"
                />
              ) : (
                <div className="space-y-3">
                  {topics.map((topic, index) => {
                    const hasVoted = votes.some((v) => v.topic_id === topic.id);
                    const daysLeft = getDaysRemaining(topic.end_time);
                    const expired = isExpired(topic.end_time);

                    return (
                      <div
                        key={topic.id}
                        className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors animate-fade-in-up"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-slate-900 truncate">
                              {topic.title}
                            </h4>
                            <Badge status={topic.status} />
                          </div>
                          <div className="flex items-center gap-4 text-sm text-slate-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {formatDate(topic.start_time)} - {formatDate(topic.end_time)}
                            </span>
                            {!expired && topic.type === 'vote' && (
                              <span
                                className={
                                  daysLeft <= 3
                                    ? 'text-warning-600'
                                    : 'text-slate-500'
                                }
                              >
                                剩余 {daysLeft} 天
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="ml-4">
                          {hasVoted ? (
                            <span className="flex items-center gap-1 text-success-600 text-sm">
                              <CheckCircle2 className="w-4 h-4" />
                              已投票
                            </span>
                          ) : topic.type === 'vote' ? (
                            <Link href={`/resident/topics/${topic.id}`}>
                              <Button size="sm">去投票</Button>
                            </Link>
                          ) : (
                            <Link href={`/resident/topics/${topic.id}`}>
                              <Button variant="secondary" size="sm">
                                查看详情
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>最近参与记录</CardTitle>
            </CardHeader>
            <CardContent>
              {votes.length === 0 ? (
                <EmptyState
                  icon={<BarChart3 className="w-12 h-12" />}
                  title="暂无参与记录"
                  description="您还没有参与过任何投票"
                />
              ) : (
                <div className="space-y-3">
                  {votes.slice(0, 5).map((vote, index) => (
                    <div
                      key={vote.id}
                      className="p-3 bg-slate-50 rounded-lg animate-fade-in-up"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 text-sm truncate">
                            {vote.topic?.title}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            投给：{vote.option?.label}
                          </p>
                        </div>
                        <Badge status="completed" className="text-xs">
                          已完成
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400 mt-2">
                        {formatDate(vote.voted_at)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              {votes.length > 5 && (
                <Link href="/resident/history">
                  <Button variant="ghost" className="w-full mt-4">
                    查看全部历史记录
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>待办提醒</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.pendingVotes > 0 && (
                  <div className="flex items-start gap-3 p-3 bg-warning-50 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-warning-800 text-sm">
                        您有 {stats.pendingVotes} 个议题待投票
                      </p>
                      <p className="text-xs text-warning-600 mt-1">
                        请及时参与投票，行使您的权利
                      </p>
                    </div>
                  </div>
                )}
                {stats.pendingVotes === 0 && (
                  <div className="flex items-start gap-3 p-3 bg-success-50 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-success-800 text-sm">
                        所有待办已完成
                      </p>
                      <p className="text-xs text-success-600 mt-1">
                        感谢您的积极参与
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
