'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Save, Calendar, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { Topic, TopicType, TopicOption } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input, Label, Textarea, Select } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Feedback';
import { generateId } from '@/utils';

export default function AdminTopicEditPage() {
  const params = useParams();
  const router = useRouter();
  const isNew = params.id === 'new';
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'vote' as TopicType,
    status: 'draft' as Extract<TopicType, 'draft' | 'ongoing' | 'ended'> | 'draft' | 'ongoing' | 'ended',
    start_time: '',
    end_time: '',
    target_area: '',
    options: [{ id: generateId(), label: '', description: '', sort_order: 0 }],
  });

  useEffect(() => {
    if (isNew) return;

    const loadData = async () => {
      try {
        const topic = await api.getTopic(params.id as string);
        if (topic) {
          setFormData({
            title: topic.title,
            description: topic.description,
            type: topic.type,
            status: topic.status as any,
            start_time: topic.start_time.slice(0, 16),
            end_time: topic.end_time.slice(0, 16),
            target_area: topic.target_area || '',
            options: topic.options?.length
              ? topic.options.map((o, i) => ({
                  id: o.id,
                  label: o.label,
                  description: o.description || '',
                  sort_order: i,
                }))
              : [{ id: generateId(), label: '', description: '', sort_order: 0 }],
          });
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isNew, params.id]);

  const handleAddOption = () => {
    setFormData({
      ...formData,
      options: [
        ...formData.options,
        { id: generateId(), label: '', description: '', sort_order: formData.options.length },
      ],
    });
  };

  const handleRemoveOption = (id: string) => {
    if (formData.options.length <= 1) return;
    setFormData({
      ...formData,
      options: formData.options.filter((o) => o.id !== id),
    });
  };

  const handleOptionChange = (id: string, field: string, value: string) => {
    setFormData({
      ...formData,
      options: formData.options.map((o) =>
        o.id === id ? { ...o, [field]: value } : o
      ),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('请输入议题标题');
      return;
    }
    if (
      formData.type !== 'announcement' &&
      formData.options.filter((o) => o.label.trim()).length < 2
    ) {
      alert('请至少添加两个选项');
      return;
    }

    setSaving(true);
    try {
      const topicData = {
        ...formData,
        options: formData.options.filter((o) => o.label.trim()),
        start_time: new Date(formData.start_time).toISOString(),
        end_time: new Date(formData.end_time).toISOString(),
      };

      if (isNew) {
        await api.createTopic(topicData);
      } else {
        await api.updateTopic(params.id as string, topicData);
      }

      router.push('/admin/topics');
    } catch (error) {
      alert('保存失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center gap-4">
        <Link href="/admin/topics">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回列表
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{isNew ? '新建议题' : '编辑议题'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">议题标题 *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="请输入议题标题"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">议题说明</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="请详细描述议题内容"
                    rows={6}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">议题类型</Label>
                    <Select
                      id="type"
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({ ...formData, type: e.target.value as TopicType })
                      }
                    >
                      <option value="vote">投票</option>
                      <option value="survey">问卷调查</option>
                      <option value="announcement">公告通知</option>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="status">状态</Label>
                    <Select
                      id="status"
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: e.target.value as any,
                        })
                      }
                    >
                      <option value="draft">草稿</option>
                      <option value="ongoing">进行中</option>
                      <option value="ended">已结束</option>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_time">开始时间 *</Label>
                    <Input
                      id="start_time"
                      type="datetime-local"
                      value={formData.start_time}
                      onChange={(e) =>
                        setFormData({ ...formData, start_time: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="end_time">结束时间 *</Label>
                    <Input
                      id="end_time"
                      type="datetime-local"
                      value={formData.end_time}
                      onChange={(e) =>
                        setFormData({ ...formData, end_time: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="target_area">参与范围</Label>
                  <Select
                    id="target_area"
                    value={formData.target_area}
                    onChange={(e) =>
                      setFormData({ ...formData, target_area: e.target.value })
                    }
                  >
                    <option value="">全体居民</option>
                    <option value="阳光社区">阳光社区</option>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {formData.type !== 'announcement' && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>投票选项</CardTitle>
                  <Button type="button" variant="secondary" size="sm" onClick={handleAddOption}>
                    <Plus className="w-4 h-4 mr-2" />
                    添加选项
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {formData.options.map((option, index) => (
                    <div
                      key={option.id}
                      className="p-4 bg-slate-50 rounded-lg relative animate-fade-in-up"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {formData.options.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(option.id)}
                          className="absolute top-3 right-3 p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-danger-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <div className="pr-10">
                        <Label>选项 {index + 1} *</Label>
                        <Input
                          value={option.label}
                          onChange={(e) =>
                            handleOptionChange(option.id, 'label', e.target.value)
                          }
                          placeholder="请输入选项内容"
                          className="mt-1"
                        />
                        <div className="mt-3">
                          <Label className="text-slate-500">选项说明（可选）</Label>
                          <Textarea
                            value={option.description}
                            onChange={(e) =>
                              handleOptionChange(option.id, 'description', e.target.value)
                            }
                            placeholder="补充说明该选项的详细信息"
                            rows={2}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>操作</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button type="submit" className="w-full" disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? '保存中...' : '保存议题'}
                </Button>
                <Link href="/admin/topics" className="block">
                  <Button variant="outline" className="w-full">
                    取消
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">议题预览</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <p className="text-slate-500">标题</p>
                  <p className="font-medium text-slate-900 mt-1">
                    {formData.title || '未设置'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">类型</p>
                  <p className="font-medium text-slate-900 mt-1">
                    {formData.type === 'vote'
                      ? '投票'
                      : formData.type === 'survey'
                      ? '问卷调查'
                      : '公告通知'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">
                    {formData.start_time || '未设置'} - {formData.end_time || '未设置'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">
                    {formData.target_area || '全体居民'}
                  </span>
                </div>
                {formData.type !== 'announcement' && (
                  <div>
                    <p className="text-slate-500 mb-2">选项预览</p>
                    <div className="space-y-2">
                      {formData.options
                        .filter((o) => o.label)
                        .map((o, i) => (
                          <div
                            key={o.id}
                            className="p-2 bg-slate-50 rounded text-sm text-slate-700"
                          >
                            {i + 1}. {o.label}
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
