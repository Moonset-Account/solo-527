'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Vote, Clock, Users, ChevronRight, Filter } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';
import { Topic, Vote as VoteType, TopicStatus } from '@/types';
import { formatDate, getDaysRemaining, isExpired } from '@/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Loading, EmptyState, PageHeader } from '@/components/ui/Feedback';
import { DataTableFilter } from '@/components/ui/DataTable';

const statusOptions = [
  { label: '全部', value: '' },
  { label: '进行中', value: 'ongoing' },
  { label: '已结束', value: 'ended' },
  { label: '草稿', value: 'draft' },
];

const typeOptions = [
  { label: '全部', value: '' },
  { label: '投票', value: 'vote' },
  { label: '问卷调查', value: 'survey' },
  { label: '公告通知', value: 'announcement' },
];

export default function ResidentTopicsPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [filteredTopics, setFilteredTopics] = useState<Topic[]>([]);
  const [votes, setVotes] = useState<VoteType[]>([]);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      try {
        const [allTopics, myVotes] = await Promise.all([
          api.getTopics(),
          api.getVotesByResident(user.id),
        ]);

        const filtered = allTopics.filter((t) => t.status !== 'draft');
        setTopics(filtered);
        setFilteredTopics(filtered);
        setVotes(myVotes);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const handleSearch = (query: string) => {
    if (!query) {
      setFilteredTopics(topics);
      return;
    }
    const filtered = topics.filter(
      (t) =>
        t.title.toLowerCase().includes(query.toLowerCase()) ||
        t.description.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredTopics(filtered);
  };

  const handleFilterChange = (filters: Record<string, string>) => {
    let filtered = [...topics];

    if (filters.status) {
      filtered = filtered.filter((t) => t.status === filters.status);
    }
    if (filters.type) {
      filtered = filtered.filter((t) => t.type === filters.type);
    }

    setFilteredTopics(filtered);
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        title="议题列表"
        description="查看所有可参与的议题和公告"
      />

      <DataTableFilter
        filters={[
          { key: 'status', label: '状态', type: 'select', options: statusOptions },
          { key: 'type', label: '类型', type: 'select', options: typeOptions },
        ]}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        searchPlaceholder="搜索议题标题..."
      />

      {filteredTopics.length === 0 ? (
        <EmptyState
          icon={<Vote className="w-12 h-12" />}
          title="暂无议题"
          description="没有找到符合条件的议题"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTopics.map((topic, index) => {
            const hasVoted = votes.some((v) => v.topic_id === topic.id);
            const daysLeft = getDaysRemaining(topic.end_time);
            const expired = isExpired(topic.end_time);

            return (
              <Card
                key={topic.id}
                hoverable
                className="animate-fade-in-up overflow-hidden"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="h-1 bg-gradient-to-r from-primary-500 to-primary-700" />
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge status={topic.status} />
                        <Badge variant="info">
                          {topic.type === 'vote' ? '投票' : topic.type === 'survey' ? '问卷' : '公告'}
                        </Badge>
                      </div>
                      <CardTitle className="text-base line-clamp-2">
                        {topic.title}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-slate-500 line-clamp-2 mb-4">
                    {topic.description}
                  </p>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        投票时间
                      </span>
                      <span className="text-slate-700">
                        {formatDate(topic.start_time)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        参与人数
                      </span>
                      <span className="text-slate-700">{topic.vote_count || 0} 人</span>
                    </div>
                    {!expired && topic.type === 'vote' && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">剩余时间</span>
                        <span
                          className={daysLeft <= 3 ? 'text-warning-600 font-medium' : 'text-slate-700'}
                        >
                          {daysLeft} 天
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <Link href={`/resident/topics/${topic.id}`} className="block">
                      <Button className="w-full" variant={hasVoted ? 'secondary' : 'primary'}>
                        {hasVoted ? '查看投票结果' : topic.type === 'vote' ? '参与投票' : '查看详情'}
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
