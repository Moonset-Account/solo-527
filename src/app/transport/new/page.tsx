'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { FormField, Input, TextArea, Select } from '@/components/ui/FormField';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { logError } from '@/lib/utils';
import type { LoanApplication, ShippingCrate, ConditionReport } from '@/types/database';
import { AlertTriangle } from 'lucide-react';

export default function NewTransportPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [crates, setCrates] = useState<ShippingCrate[]>([]);
  const [conditionReports, setConditionReports] = useState<ConditionReport[]>([]);
  const [form, setForm] = useState({
    handover_number: '',
    application_id: '',
    crate_id: '',
    transport_type: '',
    carrier_name: '',
    tracking_number: '',
    departure_location: '',
    destination_location: '',
    planned_departure: '',
    planned_arrival: '',
    condition_report_id: '',
    notes: '',
  });

  useEffect(() => {
    loadOptions();
  }, [supabase]);

  const loadOptions = async () => {
    const [appsRes, cratesRes, reportsRes] = await Promise.all([
      supabase.from('loan_applications').select('*, exhibit:exhibits(title)').in('status', ['confirmed', 'in_progress']).order('created_at', { ascending: false }),
      supabase.from('shipping_crates').select('*').eq('current_status', 'available').order('crate_number'),
      supabase.from('condition_reports').select('*').eq('status', 'confirmed').order('created_at', { ascending: false }),
    ]);
    setApplications(appsRes.data || []);
    setCrates(cratesRes.data || []);
    setConditionReports(reportsRes.data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.from('transport_handovers').insert({
        ...form,
        created_by: userData.user?.id,
      });

      if (error) throw error;
      router.push('/transport');
    } catch (err) {
      console.error('Failed to create transport:', err);
      logError(err as Error, '/transport/new');
      alert('创建失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-6">
        <PageHeader title="新增运输交接" description="创建展品运输交接单" backHref="/transport" />

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-3xl">
          <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-sm text-red-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <strong>重要：</strong>状况报告未确认前，接收方不能进行签收。请先确保对应的状况报告已确认。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="交接编号" required>
              <Input
                value={form.handover_number}
                onChange={(e) => setForm({ ...form, handover_number: e.target.value })}
                placeholder="如：TRANS-2024-001"
                required
              />
            </FormField>

            <FormField label="关联借展申请" required>
              <Select
                value={form.application_id}
                onChange={(e) => setForm({ ...form, application_id: e.target.value })}
                required
              >
                <option value="">请选择</option>
                {applications.map((app: any) => (
                  <option key={app.id} value={app.id}>
                    #{app.id.slice(0, 8)} - {app.exhibit?.title || '展品'}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="运输方式">
              <Select
                value={form.transport_type}
                onChange={(e) => setForm({ ...form, transport_type: e.target.value })}
              >
                <option value="">请选择</option>
                <option value="truck">公路运输</option>
                <option value="air">航空运输</option>
                <option value="rail">铁路运输</option>
                <option value="sea">海运</option>
              </Select>
            </FormField>

            <FormField label="承运公司">
              <Input
                value={form.carrier_name}
                onChange={(e) => setForm({ ...form, carrier_name: e.target.value })}
                placeholder="承运公司名称"
              />
            </FormField>

            <FormField label="运单号">
              <Input
                value={form.tracking_number}
                onChange={(e) => setForm({ ...form, tracking_number: e.target.value })}
                placeholder="物流跟踪单号"
              />
            </FormField>

            <FormField label="运输箱">
              <Select
                value={form.crate_id}
                onChange={(e) => setForm({ ...form, crate_id: e.target.value })}
              >
                <option value="">请选择</option>
                {crates.map((c) => (
                  <option key={c.id} value={c.id}>{c.crate_number}</option>
                ))}
              </Select>
            </FormField>

            <FormField label="出发地点">
              <Input
                value={form.departure_location}
                onChange={(e) => setForm({ ...form, departure_location: e.target.value })}
                placeholder="出发地点"
              />
            </FormField>

            <FormField label="目的地">
              <Input
                value={form.destination_location}
                onChange={(e) => setForm({ ...form, destination_location: e.target.value })}
                placeholder="目的地"
              />
            </FormField>

            <FormField label="计划出发时间">
              <Input
                type="datetime-local"
                value={form.planned_departure}
                onChange={(e) => setForm({ ...form, planned_departure: e.target.value })}
              />
            </FormField>

            <FormField label="计划到达时间">
              <Input
                type="datetime-local"
                value={form.planned_arrival}
                onChange={(e) => setForm({ ...form, planned_arrival: e.target.value })}
              />
            </FormField>

            <FormField label="关联状况报告">
              <Select
                value={form.condition_report_id}
                onChange={(e) => setForm({ ...form, condition_report_id: e.target.value })}
              >
                <option value="">请选择（仅显示已确认的报告）</option>
                {conditionReports.map((r) => (
                  <option key={r.id} value={r.id}>{r.report_number}</option>
                ))}
              </Select>
            </FormField>

            <div className="md:col-span-2">
              <FormField label="备注">
                <TextArea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="运输备注和特殊要求"
                />
              </FormField>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? '保存中...' : '创建运输交接'}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
