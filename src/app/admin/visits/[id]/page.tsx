'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, MapPin, FileText, Save } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { createVisit, updateVisit, getAllVisits } from '@/lib/services/data';
import type { Visit } from '@/lib/types';

export default function VisitFormPage() {
  const router = useRouter();
  const params = useParams();
  const visitId = params?.id as string | undefined;
  const isEditing = !!visitId;

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    visit_date: new Date().toISOString().split('T')[0],
    location: '',
    content: '',
    status: 'draft' as Visit['status'],
  });

  useEffect(() => {
    if (!isEditing) return;

    const loadVisit = async () => {
      setIsLoading(true);
      const visits = await getAllVisits();
      const visit = visits.find((v) => v.id === visitId);
      if (visit) {
        setFormData({
          visit_date: visit.visit_date?.split('T')[0] || visit.visit_date,
          location: visit.location || '',
          content: visit.content || '',
          status: visit.status,
        });
      }
      setIsLoading(false);
    };

    loadVisit();
  }, [isEditing, visitId]);

  const handleSubmit = async () => {
    if (!formData.location.trim()) {
      alert('请填写探访地点');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        visit_date: formData.visit_date,
        location: formData.location.trim(),
        content: formData.content.trim() || null,
        status: formData.status,
      };

      if (isEditing) {
        await updateVisit(visitId!, payload);
      } else {
        await createVisit({
          ...payload,
          created_by: '00000000-0000-0000-0000-000000000001',
        });
      }

      router.push('/admin/visits');
      router.refresh();
    } catch (e) {
      console.error(e);
      alert('保存失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/admin/visits">
          <Button variant="ghost" icon={ArrowLeft}>
            返回列表
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 font-serif">
            {isEditing ? '编辑探访记录' : '新建探访记录'}
          </h1>
          <p className="text-gray-500">
            {isEditing ? '修改探访记录信息' : '填写探访基本信息，后续可在照片审核页关联图片'}
          </p>
        </div>
      </div>

      <Card>
        <CardBody className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="探访日期"
              type="date"
              value={formData.visit_date}
              onChange={(e) => setFormData({ ...formData, visit_date: e.target.value })}
              icon={Calendar}
              required
            />
            <Input
              label="探访地点"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="例如：云南省楚雄州武定县插甸镇希望小学"
              icon={MapPin}
              required
            />
          </div>

          <Textarea
            label="探访内容"
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            placeholder="请描述本次探访的主要活动、看到的情况、学生的反馈等..."
            icon={FileText}
            rows={8}
          />

          <Select
            label="记录状态"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as Visit['status'] })}
            options={[
              { value: 'draft', label: '草稿（仅自己可见）' },
              { value: 'submitted', label: '已提交（待审核）' },
              { value: 'published', label: '已发布（公开页展示）' },
            ]}
          />

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-sm text-blue-800">
              <strong>提示：</strong>选择「已发布」后，此探访记录将在公开页展示；
              关联照片需要单独在「照片审核」页面上传和审核，审核通过的图片会自动展示在时间线上。
            </p>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <Link href="/admin/visits" className="flex-1">
              <Button variant="ghost" className="w-full">
                取消
              </Button>
            </Link>
            <Button
              className="flex-1"
              icon={Save}
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? '保存中...' : isEditing ? '保存修改' : '创建记录'}
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
