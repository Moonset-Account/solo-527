'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { FormField, Input, TextArea, Select } from '@/components/ui/FormField';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { logError } from '@/lib/utils';

const statusOptions = [
  { value: 'in_collection', label: '馆藏中' },
  { value: 'on_loan', label: '外借中' },
  { value: 'under_conservation', label: '修复中' },
  { value: 'retired', label: '已退役' },
];

export default function NewExhibitPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    accession_number: '',
    title: '',
    artist: '',
    creation_date: '',
    medium: '',
    dimensions: '',
    weight_kg: '',
    description: '',
    provenance: '',
    status: 'in_collection',
    estimated_value: '',
    currency: 'CNY',
    condition_notes: '',
    special_handling: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.from('exhibits').insert({
        ...form,
        weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
        estimated_value: form.estimated_value ? Number(form.estimated_value) : null,
        created_by: userData.user?.id,
      });

      if (error) throw error;
      router.push('/exhibits');
    } catch (err) {
      console.error('Failed to create exhibit:', err);
      logError(err as Error, '/exhibits/new');
      alert('创建失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-6">
        <PageHeader title="新增展品" description="登记新的展品信息" backHref="/exhibits" />

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-3xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="入藏编号" required>
              <Input
                value={form.accession_number}
                onChange={(e) => setForm({ ...form, accession_number: e.target.value })}
                placeholder="如：ACC-2024-001"
                required
              />
            </FormField>

            <FormField label="展品名称" required>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="展品名称"
                required
              />
            </FormField>

            <FormField label="艺术家/作者">
              <Input
                value={form.artist}
                onChange={(e) => setForm({ ...form, artist: e.target.value })}
                placeholder="艺术家姓名"
              />
            </FormField>

            <FormField label="创作年代">
              <Input
                value={form.creation_date}
                onChange={(e) => setForm({ ...form, creation_date: e.target.value })}
                placeholder="如：2020年"
              />
            </FormField>

            <FormField label="材质/媒介">
              <Input
                value={form.medium}
                onChange={(e) => setForm({ ...form, medium: e.target.value })}
                placeholder="如：布面油画"
              />
            </FormField>

            <FormField label="尺寸">
              <Input
                value={form.dimensions}
                onChange={(e) => setForm({ ...form, dimensions: e.target.value })}
                placeholder="如：100×80cm"
              />
            </FormField>

            <FormField label="重量 (kg)">
              <Input
                type="number"
                step="0.01"
                value={form.weight_kg}
                onChange={(e) => setForm({ ...form, weight_kg: e.target.value })}
                placeholder="0.00"
              />
            </FormField>

            <FormField label="估价">
              <Input
                type="number"
                value={form.estimated_value}
                onChange={(e) => setForm({ ...form, estimated_value: e.target.value })}
                placeholder="0.00"
              />
            </FormField>

            <FormField label="状态">
              <Select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
            </FormField>

            <FormField label="货币单位">
              <Select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
              >
                <option value="CNY">人民币 (CNY)</option>
                <option value="USD">美元 (USD)</option>
                <option value="EUR">欧元 (EUR)</option>
              </Select>
            </FormField>

            <div className="md:col-span-2">
              <FormField label="描述">
                <TextArea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="展品详细描述"
                />
              </FormField>
            </div>

            <div className="md:col-span-2">
              <FormField label="来源/出处">
                <TextArea
                  rows={2}
                  value={form.provenance}
                  onChange={(e) => setForm({ ...form, provenance: e.target.value })}
                  placeholder="展品的收藏历史和来源"
                />
              </FormField>
            </div>

            <div className="md:col-span-2">
              <FormField label="状况说明">
                <TextArea
                  rows={2}
                  value={form.condition_notes}
                  onChange={(e) => setForm({ ...form, condition_notes: e.target.value })}
                  placeholder="展品当前状况记录"
                />
              </FormField>
            </div>

            <div className="md:col-span-2">
              <FormField label="特殊处理要求">
                <TextArea
                  rows={2}
                  value={form.special_handling}
                  onChange={(e) => setForm({ ...form, special_handling: e.target.value })}
                  placeholder="运输、展示等方面的特殊要求"
                />
              </FormField>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? '保存中...' : '保存展品'}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
