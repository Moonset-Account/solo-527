'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Vote, Clock, Users, Edit, Trash2, Eye, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import { Topic, TopicStatus } from '@/types';
import { formatDate, getDaysRemaining, isExpired } from '@/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Loading, EmptyState, PageHeader } from '@/components/ui/Feedback';
import { DataTableFilter, Pagination } from '@/components/ui/DataTable';
import { ModalConfirm } from '@/components/ui/Modal';
import { ProgressRing } from '@/components/ui/Charts';

const statusOptions = [
  { label: '全部', value: '' },
  { label: '草稿', value: 'draft' },
  { label: '进行中', value: 'ongoing' },
  { label: '已结束', value: 'ended' },
];

const typeOptions = [
  { label: '全部', value: '' },
  { label: '投票', value: 'vote' },
  { label: '问卷', value: 'survey' },
  { label: '公告', value: 'announcement' },
];

export default function AdminTopicsPage() {
  const [loading, setLoading] = useState(true);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [filteredTopics, setFilteredTopics] = useState<Topic[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const pageSize = 8;

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await api.getTopics();
        setTopics(data);
        setFilteredTopics(data);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

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
    setCurrentPage(1);
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
    setCurrentPage(1);
  };

  const handleDelete = async (id: string) => {
    setTopics(topics.filter((t) => t.id !== id));
    setFilteredTopics(filteredTopics.filter((t) => t.id !== id));
    setDeleteConfirm(null);
  };

  const stats = {
    draft: topics.filter((t) => t.status === 'draft').length,
    ongoing: topics.filter((t) => t.status === 'ongoing').length,
    ended: topics.filter((t) => t.status === 'ended').length,
  };

  const totalPages = Math.ceil(filteredTopics.length / pageSize);
  const paginatedTopics = filteredTopics.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  if (loading) return <Loading />;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        title="议题管理"
        description="创建和管理居民投票议题、问卷调查和公告通知"
        action={
          <Link href="/admin/topics/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              新建议题
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">草稿</p>
                <p className="text-3xl font-bold text-slate-500 mt-1">{stats.draft}</p>
              </div>
              <ProgressRing progress={Math.round((stats.draft / topics.length) * 100)} size={60} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">进行中</p>
                <p className="text-3xl font-bold text-primary-600 mt-1">{stats.ongoing}</p>
              </div>
              <ProgressRing
                progress={Math.round((stats.ongoing / topics.length) * 100)}
                size={60}
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">已结束</p>
                <p className="text-3xl font-bold text-success-600 mt-1">{stats.ended}</p>
              </div>
              <ProgressRing
                progress={Math.round((stats.ended / topics.length) * 100)}
                size={60}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>议题列表</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
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
              description="点击右上角按钮创建第一个议题"
              action={
                <Link href="/admin/topics/new">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    新建议题
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {paginatedTopics.map((topic, index) => {
                const expired = isExpired(topic.end_time);
                const daysLeft = getDaysRemaining(topic.end_time);
                const voteProgress = topic.vote_count
                  ? Math.round((topic.vote_count / 9) * 100)
                  : 0;

                return (
                  <Card
                    key={topic.id}
                    hoverable
                    className="animate-fade-in-up overflow-hidden"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="h-1 bg-gradient-to-r from-primary-500 to-primary-700" />
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge status={topic.status} />
                          <Badge variant="info">
                            {topic.type === 'vote'
                              ? '投票'
                              : topic.type === 'survey'
                              ? '问卷'
                              : '公告'}
                          </Badge>
                        </div>
                      </div>

                      <h3 className="font-semibold text-slate-900 line-clamp-2 mb-2 min-h-[48px]">
                        {topic.title}
                      </h3>

                      <div className="space-y-2 text-sm text-slate-500 mb-4">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">
                            {formatDate(topic.start_time)} - {formatDate(topic.end_time)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 flex-shrink-0" />
                          <span>{topic.vote_count || 0} 人参与</span>
                        </div>
                        {topic.type === 'vote' && !expired && topic.status === 'ongoing' && (
                          <div className="flex items-center gap-2">
                            <span>投票进度</span>
                            <span className="font-medium text-primary-600">
                              {voteProgress}%
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-1">
                          <Link href={`/admin/topics/${topic.id}/edit`}>
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Link href={`/resident/topics/${topic.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteConfirm(topic.id)}
                          >
                            <Trash2 className="w-4 h-4 text-danger-500" />
                          </Button>
                        </div>
                        <Link href={`/admin/topics/${topic.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {filteredTopics.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={filteredTopics.length}
              onPageChange={setCurrentPage}
              className="mt-6 rounded-lg border border-slate-200"
            />
          )}
        </CardContent>
      </Card>

      <ModalConfirm
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title="删除议题"
        description="确定要删除这个议题吗？此操作不可撤销。"
        confirmText="确认删除"
        variant="danger"
      />
    </div>
  );
}
