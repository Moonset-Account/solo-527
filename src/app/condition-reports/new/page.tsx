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
import { AlertTriangle } from 'lucide-react';

const reportTypes = [
  { value: 'outgoing', label: '出库前检查' },
  { value: 'arrival', label: '到达检查' },
  { value: 'installation', label: '布展后检查' },
  { value: 'deinstallation', label: '撤展后检查' },
  { value: 'returned', label: '归还入库检查' },
  { value: 'routine', label: '例行检查' },
];

const conditionOptions = [
  { value: 'excellent', label: '优秀' },
  { value: 'good', label: '良好' },
  { value: 'fair', label: '一般' },
  { value: 'poor', label: '较差' },
  { value: 'damaged', label: '损坏' },
];

export default function NewConditionReportPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [exhibits, setExhibits] = useState<Exhibit[]>([]);
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [form, setForm] = useState({
    report_number: '',
    exhibit_id: '',
    application_id: '',
    report_type: 'routine',
    report_date: new Date().toISOString().slice(0, 16),
    overall_condition: 'good',
    condition_details: '',
    previous_damage: '',
    new_damage: '',
    treatment_recommendations: '',
    status: 'draft' as const,
  });

  useEffect(() => {
    loadOptions();
  }, [supabase]);

  const loadOptions = async () => {
    const [exhibitsRes, appsRes] = await Promise.all([
      supabase.from('exhibits').select('*').order('title'),
      supabase.from('loan_applications').select('*').not('status', 'in', ['completed', 'cancelled']).order('created_at', { ascending: false }),
    ]);
    setExhibits(exhibitsRes.data || []);
    setApplications(appsRes.data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.from('condition_reports').insert({
        ...form,
        prepared_by: userData.user?.id,
      });

      if (error) throw error;
      router.push('/condition-reports');
    } catch (err) {
      console.error('Failed to create report:', err);
      logError(err as Error, '/condition-reports/new');
      alert('创建失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-6">
        <PageHeader title="新增状况报告" description="记录展品状况检查" backHref="/condition-reports" />

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-3xl">
          <div className="mb-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-sm text-amber-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <strong>提示：</strong>状况报告必须确认后，运输交接的接收方才能签收。请确保报告内容准确。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="报告编号" required>
              <Input
                value={form.report_number}
                onChange={(e) => setForm({ ...form, report_number: e.target.value })}
                placeholder="如：COND-2024-001"
                required
              />
            </FormField>

            <FormField label="报告类型">
              <Select
                value={form.report_type}
                onChange={(e) => setForm({ ...form, report_type: e.target.value })}
              >
                {reportTypes.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </Select>
            </FormField>

            <FormField label="展品" required>
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

            <FormField label="检查时间">
              <Input
                type="datetime-local"
                value={form.report_date}
                onChange={(e) => setForm({ ...form, report_date: e.target.value })}
              />
            </FormField>

            <FormField label="整体状况">
              <Select
                value={form.overall_condition}
                onChange={(e) => setForm({ ...form, overall_condition: e.target.value })}
              >
                {conditionOptions.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </Select>
            </FormField>

            <div className="md:col-span-2">
              <FormField label="状况详情">
                <TextArea
                  rows={3}
                  value={form.condition_details}
                  onChange={(e) => setForm({ ...form, condition_details: e.target.value })}
                  placeholder="详细描述展品当前状况"
                />
              </FormField>
            </div>

            <div className="md:col-span-2">
              <FormField label="原有损伤">
                <TextArea
                  rows={2}
                  value={form.previous_damage}
                  onChange={(e) => setForm({ ...form, previous_damage: e.target.value })}
                  placeholder="记录展品已有的损伤"
                />
              </FormField>
            </div>

            <div className="md:col-span-2">
              <FormField label="新增损伤">
                <TextArea
                  rows={2}
                  value={form.new_damage}
                  onChange={(e) => setForm({ ...form, new_damage: e.target.value })}
                  placeholder="记录检查中发现的新增损伤"
                />
              </FormField>
            </div>

            <div className="md:col-span-2">
              <FormField label="修复建议">
                <TextArea
                  rows={2}
                  value={form.treatment_recommendations}
                  onChange={(e) => setForm({ ...form, treatment_recommendations: e.target.value })}
                  placeholder="建议的修复或处理措施"
                />
              </FormField>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              取消
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                setForm({ ...form, status: 'pending_confirmation' });
              }}
            >
              提交待确认
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? '保存中...' : '保存为草稿'}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
