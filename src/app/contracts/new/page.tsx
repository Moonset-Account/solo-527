'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { FormField, Input, TextArea, Select } from '@/components/ui/FormField';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { logError } from '@/lib/utils';
import type { BorrowingInstitution } from '@/types/database';

export default function NewContractPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [institutions, setInstitutions] = useState<BorrowingInstitution[]>([]);
  const [form, setForm] = useState({
    contract_number: '',
    title: '',
    borrowing_institution_id: '',
    start_date: '',
    end_date: '',
    purpose: '',
    terms_and_conditions: '',
    fee_amount: '',
    currency: 'CNY',
    payment_terms: '',
  });

  useEffect(() => {
    loadInstitutions();
  }, [supabase]);

  const loadInstitutions = async () => {
    const { data } = await supabase
      .from('borrowing_institutions')
      .select('*')
      .eq('is_qualified', true)
      .order('name');
    setInstitutions(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.from('loan_contracts').insert({
        ...form,
        fee_amount: form.fee_amount ? Number(form.fee_amount) : null,
        created_by: userData.user?.id,
      });

      if (error) throw error;
      router.push('/contracts');
    } catch (err) {
      console.error('Failed to create contract:', err);
      logError(err as Error, '/contracts/new');
      alert('创建失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-6">
        <PageHeader title="新增借展合同" description="创建新的借展合同" backHref="/contracts" />

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-3xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="合同编号" required>
              <Input
                value={form.contract_number}
                onChange={(e) => setForm({ ...form, contract_number: e.target.value })}
                placeholder="如：LOAN-2024-001"
                required
              />
            </FormField>

            <FormField label="合同标题" required>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="合同标题"
                required
              />
            </FormField>

            <FormField label="借展机构" required>
              <Select
                value={form.borrowing_institution_id}
                onChange={(e) => setForm({ ...form, borrowing_institution_id: e.target.value })}
                required
              >
                <option value="">请选择借展机构</option>
                {institutions.map((inst) => (
                  <option key={inst.id} value={inst.id}>{inst.name}</option>
                ))}
              </Select>
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="开始日期" required>
                <Input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  required
                />
              </FormField>

              <FormField label="结束日期" required>
                <Input
                  type="date"
                  value={form.end_date}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                  required
                />
              </FormField>
            </div>

            <FormField label="借展费用">
              <Input
                type="number"
                value={form.fee_amount}
                onChange={(e) => setForm({ ...form, fee_amount: e.target.value })}
                placeholder="0.00"
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

            <div className="md:col-span-2">
              <FormField label="借展目的">
                <TextArea
                  rows={2}
                  value={form.purpose}
                  onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                  placeholder="本次借展的目的和用途"
                />
              </FormField>
            </div>

            <div className="md:col-span-2">
              <FormField label="条款与条件">
                <TextArea
                  rows={4}
                  value={form.terms_and_conditions}
                  onChange={(e) => setForm({ ...form, terms_and_conditions: e.target.value })}
                  placeholder="借展相关的条款和条件"
                />
              </FormField>
            </div>

            <div className="md:col-span-2">
              <FormField label="付款条件">
                <TextArea
                  rows={2}
                  value={form.payment_terms}
                  onChange={(e) => setForm({ ...form, payment_terms: e.target.value })}
                  placeholder="付款方式、时间等条件"
                />
              </FormField>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? '保存中...' : '保存合同'}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
