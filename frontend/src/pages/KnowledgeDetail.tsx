import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Eye,
  ThumbsUp,
  Clock,
  BookOpen,
  Bell,
  Share2,
  AlertCircle,
} from 'lucide-react';
import { knowledgeApi } from '@/api/knowledgeApi';
import type { KnowledgeItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { formatTime, formatRelativeTime } from '@/utils/formatTime';

export default function KnowledgeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<KnowledgeItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderDate, setReminderDate] = useState('');

  useEffect(() => {
    if (id) {
      fetchKnowledge();
    }
  }, [id]);

  const fetchKnowledge = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await knowledgeApi.getKnowledgeItem(id);
      if (response.success) {
        setItem(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch knowledge:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = () => {
    setLiked(!liked);
  };

  const handleSetReminder = async () => {
    if (!id || !reminderDate) return;
    try {
      await knowledgeApi.setReminder(id, reminderDate);
      setShowReminderModal(false);
      setReminderDate('');
    } catch (error) {
      console.error('Failed to set reminder:', error);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <button
            className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900"
            onClick={() => navigate('/knowledge')}
          >
            <ArrowLeft className="h-5 w-5" />
            返回列表
          </button>
        </div>
        <div className="card p-8">
          <div className="h-8 w-3/4 skeleton rounded mb-4" />
          <div className="flex items-center gap-4 mb-6">
            <div className="h-4 w-16 skeleton rounded" />
            <div className="h-4 w-24 skeleton rounded" />
            <div className="h-4 w-20 skeleton rounded" />
          </div>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-4 skeleton rounded mb-2" style={{ width: `${80 + Math.random() * 20}%` }} />
          ))}
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <AlertCircle className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
        <p className="text-zinc-500">知识不存在或已被删除</p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate('/knowledge')}>
          返回列表
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900 transition-colors"
            onClick={() => navigate('/knowledge')}
          >
            <ArrowLeft className="h-5 w-5" />
            返回列表
          </button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Bell className="h-4 w-4" />}
            onClick={() => setShowReminderModal(true)}
          >
            设置提醒
          </Button>
          <Button variant="secondary" size="sm" leftIcon={<Share2 className="h-4 w-4" />}>
            分享
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-8">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Badge variant="primary">{item.category}</Badge>
              {item.tags?.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
            <h1 className="text-3xl font-bold text-zinc-900 mb-4">{item.title}</h1>
            <div className="flex flex-wrap items-center gap-6 text-sm text-zinc-500">
              <span className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                {item.author?.name || '系统'}
              </span>
              <span className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                {item.views} 次阅读
              </span>
              <span className="flex items-center gap-2">
                <ThumbsUp className="h-4 w-4" />
                {item.likes + (liked ? 1 : 0)} 次点赞
              </span>
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                更新于 {formatRelativeTime(item.updatedAt)}
              </span>
            </div>
          </div>

          <div className="prose prose-zinc max-w-none">
            <div className="whitespace-pre-wrap text-zinc-700 leading-relaxed">
              {item.content}
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-zinc-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-zinc-500">
                创建时间：{formatTime(item.createdAt)}
                {item.updatedAt !== item.createdAt && (
                  <span className="ml-4">最后更新：{formatTime(item.updatedAt)}</span>
                )}
              </div>
              <Button
                variant={liked ? 'primary' : 'secondary'}
                size="sm"
                leftIcon={<ThumbsUp className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />}
                onClick={handleLike}
              >
                {liked ? '已点赞' : '点赞'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Modal
        isOpen={showReminderModal}
        onClose={() => setShowReminderModal(false)}
        title="设置提醒"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowReminderModal(false)}>
              取消
            </Button>
            <Button onClick={handleSetReminder} disabled={!reminderDate}>
              确认设置
            </Button>
          </>
        }
      >
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">
            提醒时间
          </label>
          <input
            type="datetime-local"
            className="input w-full"
            value={reminderDate}
            onChange={(e) => setReminderDate(e.target.value)}
          />
          <p className="text-sm text-zinc-500 mt-2">
            设置后，系统将在指定时间提醒您回顾此知识点。
          </p>
        </div>
      </Modal>
    </div>
  );
}
