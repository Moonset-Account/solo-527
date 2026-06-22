'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Clock,
  Users,
  Calendar,
  User,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';
import { Topic, Vote } from '@/types';
import { formatDate, formatDateTime, isExpired } from '@/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Loading, EmptyState } from '@/components/ui/Feedback';
import { ModalConfirm } from '@/components/ui/Modal';
import { StatusBarChart, FacilityPieChart } from '@/components/ui/Charts';

export default function TopicDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [myVote, setMyVote] = useState<Vote | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!user || !params.id) return;

      try {
        const [topicData, allVotes] = await Promise.all([
          api.getTopic(params.id as string),
          api.getVotesByTopic(params.id as string),
        ]);

        setTopic(topicData || null);
        setVotes(allVotes);

        const userVote = allVotes.find((v) => v.resident_id === user.id);
        setMyVote(userVote || null);
        if (userVote || (topicData && (topicData.status === 'ended' || isExpired(topicData.end_time)))) {
          setShowResults(true);
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, params.id]);

  const handleVote = async () => {
    if (!selectedOption || !topic || !user) return;

    setSubmitting(true);
    try {
      await api.submitVote(topic.id, user.id, selectedOption);
      const updatedVotes = await api.getVotesByTopic(topic.id);
      setVotes(updatedVotes);
      const userVote = updatedVotes.find((v) => v.resident_id === user.id);
      setMyVote(userVote || null);
      setShowResults(true);
      setShowConfirm(false);
    } catch (error: any) {
      alert(error.message || '投票失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loading />;
  if (!topic) return <EmptyState title="议题不存在" description="该议题可能已被删除" />;

  const expired = isExpired(topic.end_time);
  const canVote = topic.type === 'vote' && topic.status === 'ongoing' && !expired && !myVote;

  const voteStats = topic.options?.map((opt) => ({
    name: opt.label,
    value: votes.filter((v) => v.option_id === opt.id).length,
  })) || [];

  const pieData = topic.options?.map((opt) => ({
    name: opt.label,
    value: votes.filter((v) => v.option_id === opt.id).length,
  })) || [];

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center gap-4">
        <Link href="/resident/topics">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回列表
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge status={topic.status} />
                    <Badge variant="info">
                      {topic.type === 'vote' ? '投票' : topic.type === 'survey' ? '问卷' : '公告'}
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl">{topic.title}</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-primary-600 mx-auto mb-1" />
                  <p className="text-xs text-slate-500">开始时间</p>
                  <p className="text-sm font-medium text-slate-700">{formatDate(topic.start_time)}</p>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <Clock className="w-5 h-5 text-warning-600 mx-auto mb-1" />
                  <p className="text-xs text-slate-500">结束时间</p>
                  <p className="text-sm font-medium text-slate-700">{formatDate(topic.end_time)}</p>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <Users className="w-5 h-5 text-success-600 mx-auto mb-1" />
                  <p className="text-xs text-slate-500">参与人数</p>
                  <p className="text-sm font-medium text-slate-700">{votes.length} 人</p>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <User className="w-5 h-5 text-primary-600 mx-auto mb-1" />
                  <p className="text-xs text-slate-500">发起人</p>
                  <p className="text-sm font-medium text-slate-700">管理员</p>
                </div>
              </div>

              <div className="prose prose-slate max-w-none">
                <h4 className="text-lg font-semibold mb-3 font-serif">议题说明</h4>
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {topic.description}
                </p>
              </div>
            </CardContent>
          </Card>

          {topic.type === 'vote' && topic.options && topic.options.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {showResults ? '投票结果' : '投票选项'}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {canVote && !showResults ? (
                  <div className="space-y-3">
                    {topic.options.map((option) => (
                      <div
                        key={option.id}
                        onClick={() => setSelectedOption(option.id)}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedOption === option.id
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-slate-200 hover:border-primary-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              selectedOption === option.id
                                ? 'border-primary-500 bg-primary-500'
                                : 'border-slate-300'
                            }`}
                          >
                            {selectedOption === option.id && (
                              <div className="w-2 h-2 bg-white rounded-full" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{option.label}</p>
                            {option.description && (
                              <p className="text-sm text-slate-500 mt-1">
                                {option.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
                      {selectedOption && (
                        <p className="text-sm text-slate-500">
                          您选择：
                          <span className="font-medium text-primary-700">
                            {' '}
                            {topic.options.find((o) => o.id === selectedOption)?.label}
                          </span>
                        </p>
                      )}
                      <Button
                        disabled={!selectedOption || submitting}
                        onClick={() => setShowConfirm(true)}
                      >
                        {submitting ? '提交中...' : '确认投票'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {voteStats.map((stat, index) => {
                      const percentage =
                        votes.length > 0 ? Math.round((stat.value / votes.length) * 100) : 0;
                      const isMyVote = myVote?.option_id === topic.options?.[index]?.id;

                      return (
                        <div key={stat.name} className="relative">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-slate-700 flex items-center gap-2">
                              {stat.name}
                              {isMyVote && (
                                <Badge status="completed" className="text-xs">
                                  我的选择
                                </Badge>
                              )}
                            </span>
                            <span className="text-sm text-slate-500">
                              {stat.value} 票 ({percentage}%)
                            </span>
                          </div>
                          <div className="h-8 bg-slate-100 rounded-lg overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg transition-all duration-500 flex items-center justify-end pr-3"
                              style={{ width: `${Math.max(percentage, 5)}%` }}
                            >
                              {percentage >= 15 && (
                                <span className="text-white text-sm font-medium">
                                  {percentage}%
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {myVote && (
                      <div className="mt-6 p-4 bg-success-50 rounded-lg flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-success-600" />
                        <div>
                          <p className="font-medium text-success-800">您已完成投票</p>
                          <p className="text-sm text-success-600">
                            投票时间：{formatDateTime(myVote.voted_at)}
                          </p>
                        </div>
                      </div>
                    )}

                    {expired && !myVote && (
                      <div className="mt-6 p-4 bg-warning-50 rounded-lg flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-warning-600" />
                        <div>
                          <p className="font-medium text-warning-800">投票已结束</p>
                          <p className="text-sm text-warning-600">您未参与此次投票</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {showResults && pieData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">投票分布</CardTitle>
              </CardHeader>
              <CardContent>
                <FacilityPieChart data={pieData} height={250} />
              </CardContent>
            </Card>
          )}

          {showResults && voteStats.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">投票统计</CardTitle>
              </CardHeader>
              <CardContent>
                <StatusBarChart
                  data={voteStats}
                  xKey="name"
                  yKey="value"
                  height={200}
                  color="#2563eb"
                />
              </CardContent>
            </Card>
          )}

          {myVote && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">投票参与情况</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-center py-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success-100 text-success-600 mb-3">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <p className="text-lg font-semibold text-slate-900">
                    感谢您的参与！
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    您的投票已成功记录
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <ModalConfirm
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleVote}
        title="确认投票"
        description={`您确定要投给「${topic.options?.find((o) => o.id === selectedOption)?.label}」吗？投票后不可修改。`}
        confirmText="确认提交"
        variant="primary"
      />
    </div>
  );
}
