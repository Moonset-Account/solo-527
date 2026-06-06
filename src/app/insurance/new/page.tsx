'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { FormField, Input, TextArea, Select } from '@/components/ui/FormField';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { logError } from '@/lib/utils';
import type { Exhibit, LoanApplication } from '@/types/database';

export default function NewInsurancePage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [exhibits, setExhibits] = useState<Exhibit[]>([]);
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [form, setForm] = useState({
    policy_number: '',
    insurance_company: '',
    application_id: '',
    exhibit_id: '',
    coverage_amount: '',
    currency: 'CNY',
    coverage_start_date: '',
    coverage_end_date: '',
    policy_type: '',
    coverage_details: '',
    premium_amount: '',
  });

  useEffect(() => {
    loadOptions();
  }, [supabase]);

  const loadOptions = async () => {
    const [exhibitsRes, appsRes] = await Promise.all([
      supabase.from('exhibits').select('*').order('title'),
      supabase.from('loan_applications').select('*').in('status', ['confirmed', 'in_progress']).order('created_at', { ascending: false }),
    ]);
    setExhibits(exhibitsRes.data || []);
    setApplications(appsRes.data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.from('insurance_policies').insert({
        ...form,
        coverage_amount: Number(form.coverage_amount),
        premium_amount: form.premium_amount ? Number(form.premium_amount) : null,
        created_by: userData.user?.id,
      });

      if (error) throw error;
      router.push('/insurance');
    } catch (err) {
      console.error('Failed to create policy:', err);
      logError(err as Error, '/insurance/new');
      alert('创建失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-6">
        <PageHeader title="新增保险单" description="登记展品保险信息" backHref="/insurance" />

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-3xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="保单编号" required>
              <Input
                value={form.policy_number}
                onChange={(e) => setForm({ ...form, policy_number: e.target.value })}
                placeholder="如：INS-2024-001"
                required
              />
            </FormField>

            <FormField label="保险公司" required>
              <Input
                value={form.insurance_company}
                onChange={(e) => setForm({ ...form, insurance_company: e.target.value })}
                placeholder="保险公司名称"
                required
              />
            </FormField>

            <FormField label="关联借展申请">
              <Select
                value={form.application_id}
                onChange={(e) => setForm({ ...form, application_id: e.target.value })}
              >
                <option value="">无（可选）</option>
                {applications.map((app) => (
                  <option key={app.id} value={app.id}>#{app.id.slice(0, 8)}</option>
                ))}
              </Select>
            </FormField>

            <FormField label="投保展品" required>
              <Select
                value={form.exhibit_id}
                onChange={(e) => setForm({ ...form, exhibit_id: e.target.value })}
                required
              >
                <option value="">请选择展品</option>
                {exhibits.map((ex) => (
                  <option key={ex.id} value={ex.id}>{ex.accession_number} - {ex.title}</option>
                ))}
              </Select>
            </FormField>

            <FormField label="保额" required>
              <Input
                type="number"
                value={form.coverage_amount}
                onChange={(e) => setForm({ ...form, coverage_amount: e.target.value })}
                placeholder="0.00"
                required
              />
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

            <FormField label="保险起期" required>
              <Input
                type="datetime-local"
                value={form.coverage_start_date}
                onChange={(e) => setForm({ ...form, coverage_start_date: e.target.value })}
                required
              />
            </FormField>

            <FormField label="保险到期" required>
              <Input
                type="datetime-local"
                value={form.coverage_end_date}
                onChange={(e) => setForm({ ...form, coverage_end_date: e.target.value })}
                required
              />
            </FormField>

            <FormField label="保费">
              <Input
                type="number"
                value={form.premium_amount}
                onChange={(e) => setForm({ ...form, premium_amount: e.target.value })}
                placeholder="0.00"
              />
            </FormField>

            <FormField label="险种">
              <Input
                value={form.policy_type}
                onChange={(e) => setForm({ ...form, policy_type: e.target.value })}
                placeholder="如：一切险、运输险"
              />
            </FormField>

            <div className="md:col-span-2">
              <FormField label="承保范围">
                <TextArea
                  rows={3}
                  value={form.coverage_details}
                  onChange={(e) => setForm({ ...form, coverage_details: e.target.value })}
                  placeholder="详细描述保险承保范围"
                />
              </FormField>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? '保存中...' : '保存保险单'}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
