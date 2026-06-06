'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { FormField, Input, TextArea, Select } from '@/components/ui/FormField';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { logError } from '@/lib/utils';

export default function NewCratePage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    crate_number: '',
    name: '',
    dimensions: '',
    max_weight_kg: '',
    material: '',
    climate_control: false,
    shock_sensors: false,
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.from('shipping_crates').insert({
        ...form,
        max_weight_kg: form.max_weight_kg ? Number(form.max_weight_kg) : null,
        created_by: userData.user?.id,
      });

      if (error) throw error;
      router.push('/crates');
    } catch (err) {
      console.error('Failed to create crate:', err);
      logError(err as Error, '/crates/new');
      alert('创建失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-6">
        <PageHeader title="新增运输箱" description="登记新的运输箱" backHref="/crates" />

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-3xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="箱子编号" required>
              <Input
                value={form.crate_number}
                onChange={(e) => setForm({ ...form, crate_number: e.target.value })}
                placeholder="如：CRATE-001"
                required
              />
            </FormField>

            <FormField label="名称/规格">
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="运输箱名称或规格说明"
              />
            </FormField>

            <FormField label="尺寸">
              <Input
                value={form.dimensions}
                onChange={(e) => setForm({ ...form, dimensions: e.target.value })}
                placeholder="如：120×80×60cm"
              />
            </FormField>

            <FormField label="最大承重 (kg)">
              <Input
                type="number"
                step="0.01"
                value={form.max_weight_kg}
                onChange={(e) => setForm({ ...form, max_weight_kg: e.target.value })}
                placeholder="0.00"
              />
            </FormField>

            <FormField label="材质">
              <Select
                value={form.material}
                onChange={(e) => setForm({ ...form, material: e.target.value })}
              >
                <option value="">请选择</option>
                <option value="wood">实木</option>
                <option value="plywood">胶合板</option>
                <option value="aluminum">铝合金</option>
                <option value="plastic">塑料</option>
                <option value="custom">定制</option>
              </Select>
            </FormField>

            <div className="md:col-span-2">
              <div className="flex gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.climate_control}
                    onChange={(e) => setForm({ ...form, climate_control: e.target.checked })}
                    className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-sm text-gray-700">恒温恒湿控制</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.shock_sensors}
                    onChange={(e) => setForm({ ...form, shock_sensors: e.target.checked })}
                    className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-sm text-gray-700">震动传感器</span>
                </label>
              </div>
            </div>

            <div className="md:col-span-2">
              <FormField label="备注">
                <TextArea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="其他说明"
                />
              </FormField>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? '保存中...' : '保存运输箱'}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
