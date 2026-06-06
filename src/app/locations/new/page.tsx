'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { FormField, Input, TextArea, Select } from '@/components/ui/FormField';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { logError } from '@/lib/utils';

const locationTypes = [
  { value: 'gallery', label: '展厅' },
  { value: 'storage', label: '库房' },
  { value: 'conservation_lab', label: '修复实验室' },
  { value: 'loading_dock', label: '装卸区' },
  { value: 'off_site', label: '场外' },
];

export default function NewLocationPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    code: '',
    name: '',
    type: 'gallery',
    floor: '',
    area: '',
    description: '',
    max_exhibits: '10',
    is_active: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.from('exhibition_locations').insert({
        ...form,
        max_exhibits: Number(form.max_exhibits),
        created_by: userData.user?.id,
      });

      if (error) throw error;
      router.push('/locations');
    } catch (err) {
      console.error('Failed to create location:', err);
      logError(err as Error, '/locations/new');
      alert('创建失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-6">
        <PageHeader title="新增布展位置" description="添加新的展览位置" backHref="/locations" />

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-3xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="位置编码" required>
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="如：GALLERY-01"
                required
              />
            </FormField>

            <FormField label="位置名称" required>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="如：一号展厅"
                required
              />
            </FormField>

            <FormField label="位置类型">
              <Select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                {locationTypes.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </Select>
            </FormField>

            <FormField label="最大展品数">
              <Input
                type="number"
                value={form.max_exhibits}
                onChange={(e) => setForm({ ...form, max_exhibits: e.target.value })}
                placeholder="10"
              />
            </FormField>

            <FormField label="楼层">
              <Input
                value={form.floor}
                onChange={(e) => setForm({ ...form, floor: e.target.value })}
                placeholder="如：1F"
              />
            </FormField>

            <FormField label="区域">
              <Input
                value={form.area}
                onChange={(e) => setForm({ ...form, area: e.target.value })}
                placeholder="如：A区"
              />
            </FormField>

            <div className="md:col-span-2">
              <FormField label="描述">
                <TextArea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="位置详细描述"
                />
              </FormField>
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                />
                <span className="text-sm text-gray-700">启用此位置</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? '保存中...' : '保存位置'}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
