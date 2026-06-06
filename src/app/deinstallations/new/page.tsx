'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { FormField, Input, TextArea, Select } from '@/components/ui/FormField';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { logError } from '@/lib/utils';
import type { LoanApplication } from '@/types/database';

export default function NewDeinstallationPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [form, setForm] = useState({
    record_number: '',
    application_id: '',
    planned_deinstall_date: '',
    condition_after_deinstall: '',
    deinstallation_notes: '',
  });

  useEffect(() => {
    loadOptions();
  }, [supabase]);

  const loadOptions = async () => {
    const { data } = await supabase
      .from('loan_applications')
      .select('*, exhibit:exhibits(title)')
      .in('status', ['in_progress'])
      .order('created_at', { ascending: false });
    setApplications(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.from('deinstallation_records').insert({
        ...form,
        deinstalled_by: userData.user?.id,
        created_by: userData.user?.id,
      });

      if (error) throw error;
      router.push('/deinstallations');
    } catch (err) {
      console.error('Failed to create deinstallation:', err);
      logError(err as Error, '/deinstallations/new');
      alert('创建失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-6">
        <PageHeader title="新增撤展记录" description="记录展品撤展信息" backHref="/deinstallations" />

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-3xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="记录编号" required>
              <Input
                value={form.record_number}
                onChange={(e) => setForm({ ...form, record_number: e.target.value })}
                placeholder="如：DEINST-2024-001"
                required
              />
            </FormField>

            <FormField label="关联借展申请" required>
              <Select
                value={form.application_id}
                onChange={(e) => setForm({ ...form, application_id: e.target.value })}
                required
              >
                <option value="">请选择（仅显示进行中的）</option>
                {applications.map((app: any) => (
                  <option key={app.id} value={app.id}>
                    #{app.id.slice(0, 8)} - {app.exhibit?.title || '展品'}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="计划撤展时间">
              <Input
                type="datetime-local"
                value={form.planned_deinstall_date}
                onChange={(e) => setForm({ ...form, planned_deinstall_date: e.target.value })}
              />
            </FormField>

            <div />

            <div className="md:col-span-2">
              <FormField label="撤展后状况">
                <TextArea
                  rows={2}
                  value={form.condition_after_deinstall}
                  onChange={(e) => setForm({ ...form, condition_after_deinstall: e.target.value })}
                  placeholder="记录撤展后展品的状况"
                />
              </FormField>
            </div>

            <div className="md:col-span-2">
              <FormField label="撤展备注">
                <TextArea
                  rows={3}
                  value={form.deinstallation_notes}
                  onChange={(e) => setForm({ ...form, deinstallation_notes: e.target.value })}
                  placeholder="撤展过程中的注意事项和说明"
                />
              </FormField>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? '保存中...' : '保存撤展记录'}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
