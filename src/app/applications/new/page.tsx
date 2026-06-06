'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { FormField, Input, TextArea, Select } from '@/components/ui/FormField';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { logError } from '@/lib/utils';
import type { Exhibit, LoanContract } from '@/types/database';
import { AlertCircle } from 'lucide-react';

export default function NewApplicationPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<{ available: boolean; message: string } | null>(null);
  const [exhibits, setExhibits] = useState<Exhibit[]>([]);
  const [contracts, setContracts] = useState<LoanContract[]>([]);
  const [form, setForm] = useState({
    contract_id: '',
    exhibit_id: '',
    requested_start_date: '',
    requested_end_date: '',
    display_location: '',
    notes: '',
  });

  useEffect(() => {
    loadOptions();
  }, [supabase]);

  const loadOptions = async () => {
    const [exhibitsRes, contractsRes] = await Promise.all([
      supabase.from('exhibits').select('*').eq('status', 'in_collection').order('title'),
      supabase.from('loan_contracts').select('*').not('status', 'in', ['completed', 'cancelled', 'rejected']).order('contract_number'),
    ]);
    setExhibits(exhibitsRes.data || []);
    setContracts(contractsRes.data || []);
  };

  const checkAvailability = async () => {
    if (!form.exhibit_id || !form.requested_start_date || !form.requested_end_date) {
      alert('请先选择展品和申请时段');
      return;
    }

    setChecking(true);
    try {
      const { data: available } = await supabase.rpc('check_exhibit_availability', {
        p_exhibit_id: form.exhibit_id,
        p_start_date: form.requested_start_date,
        p_end_date: form.requested_end_date,
      });

      if (available) {
        setCheckResult({ available: true, message: '该时段展品可用，可以申请' });
      } else {
        setCheckResult({ available: false, message: '该时段展品已被预约，请选择其他时间段' });
      }
    } catch (err) {
      console.error('Check failed:', err);
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.from('loan_applications').insert({
        ...form,
        created_by: userData.user?.id,
      });

      if (error) throw error;
      router.push('/applications');
    } catch (err) {
      console.error('Failed to create application:', err);
      logError(err as Error, '/applications/new');
      alert('创建失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-6">
        <PageHeader title="新增借展申请" description="创建新的展品借展申请" backHref="/applications" />

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-3xl">
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <strong>流程说明：</strong>创建申请后需执行三重校验（机构资格、库存状态、时段冲突），校验通过后等待人工确认。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="关联合同" required>
              <Select
                value={form.contract_id}
                onChange={(e) => setForm({ ...form, contract_id: e.target.value })}
                required
              >
                <option value="">请选择关联合同</option>
                {contracts.map((c) => (
                  <option key={c.id} value={c.id}>{c.contract_number} - {c.title}</option>
                ))}
              </Select>
            </FormField>

            <FormField label="申请展品" required>
              <Select
                value={form.exhibit_id}
                onChange={(e) => setForm({ ...form, exhibit_id: e.target.value })}
                required
              >
                <option value="">请选择展品（仅显示馆藏中）</option>
                {exhibits.map((ex) => (
                  <option key={ex.id} value={ex.id}>{ex.accession_number} - {ex.title}</option>
                ))}
              </Select>
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="申请开始日期" required>
                <Input
                  type="date"
                  value={form.requested_start_date}
                  onChange={(e) => { setForm({ ...form, requested_start_date: e.target.value }); setCheckResult(null); }}
                  required
                />
              </FormField>

              <FormField label="申请结束日期" required>
                <Input
                  type="date"
                  value={form.requested_end_date}
                  onChange={(e) => { setForm({ ...form, requested_end_date: e.target.value }); setCheckResult(null); }}
                  required
                />
              </FormField>
            </div>

            <div className="md:col-span-2">
              <Button type="button" variant="outline" onClick={checkAvailability} disabled={checking}>
                {checking ? '检查中...' : '检查时段可用性'}
              </Button>
              {checkResult && (
                <p className={`mt-2 text-sm ${checkResult.available ? 'text-green-600' : 'text-red-600'}`}>
                  {checkResult.message}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <FormField label="展出位置">
                <Input
                  value={form.display_location}
                  onChange={(e) => setForm({ ...form, display_location: e.target.value })}
                  placeholder="对方机构的具体展出位置"
                />
              </FormField>
            </div>

            <div className="md:col-span-2">
              <FormField label="备注">
                <TextArea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="其他需要说明的事项"
                />
              </FormField>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? '保存中...' : '创建申请'}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
