'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import type { ConditionReport, Exhibit } from '@/types/database';
import { formatDateTime, createExecutionRecord, logError } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, FileCheck, AlertTriangle } from 'lucide-react';

interface ReportWithExhibit extends ConditionReport {
  exhibit?: Exhibit;
}

export default function ConditionReportsPage() {
  const [reports, setReports] = useState<ReportWithExhibit[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    loadReports();
  }, [supabase]);

  const loadReports = async () => {
    try {
      const { data } = await supabase
        .from('condition_reports')
        .select(`*, exhibit:exhibits(*)`)
        .order('created_at', { ascending: false });
      setReports(data || []);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const confirmReport = async (report: ReportWithExhibit) => {
    try {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();

      await supabase
        .from('condition_reports')
        .update({
          confirmed_by: userData.user?.id,
          confirmed_at: new Date().toISOString(),
          status: 'confirmed',
        })
        .eq('id', report.id);

      if (report.application_id) {
        await createExecutionRecord(
          report.application_id,
          'condition_report_confirmed',
          `状况报告 ${report.report_number} 已确认`
        );
      }

      loadReports();
    } catch (error) {
      console.error('Failed to confirm:', error);
      logError(error as Error, '/condition-reports/confirm');
    } finally {
      setLoading(false);
    }
  };

  const disputeReport = async (report: ReportWithExhibit) => {
    try {
      setLoading(true);
      await supabase
        .from('condition_reports')
        .update({ status: 'disputed' })
        .eq('id', report.id);

      loadReports();
    } catch (error) {
      console.error('Failed to dispute:', error);
      logError(error as Error, '/condition-reports/dispute');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      key: 'report_number',
      header: '报告编号',
      render: (row: ReportWithExhibit) => (
        <span className="font-mono text-sm text-gray-600">{row.report_number}</span>
      ),
    },
    {
      key: 'exhibit',
      header: '展品',
      render: (row: ReportWithExhibit) => (
        <div>
          <p className="font-medium text-gray-900">{row.exhibit?.title || '-'}</p>
          <p className="text-sm text-gray-500">{row.report_type}</p>
        </div>
      ),
    },
    {
      key: 'overall_condition',
      header: '整体状况',
      render: (row: ReportWithExhibit) => <span>{row.overall_condition}</span>,
    },
    {
      key: 'report_date',
      header: '报告日期',
      render: (row: ReportWithExhibit) => (
        <span>{formatDateTime(row.report_date)}</span>
      ),
    },
    {
      key: 'signatures',
      header: '签名确认',
      render: (row: ReportWithExhibit) => (
        <div className="flex gap-2">
          <span className={`text-xs ${row.signed_by_sender_at ? 'text-green-600' : 'text-gray-400'}`}>
            {row.signed_by_sender_at ? '✓ 送方签名' : '送方待签'}
          </span>
          <span className={`text-xs ${row.signed_by_receiver_at ? 'text-green-600' : 'text-gray-400'}`}>
            {row.signed_by_receiver_at ? '✓ 收方签名' : '收方待签'}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: '状态',
      render: (row: ReportWithExhibit) => <Badge status={row.status} />,
    },
    {
      key: 'actions',
      header: '操作',
      render: (row: ReportWithExhibit) => (
        <div className="flex gap-2">
          {row.status === 'pending_confirmation' && (
            <>
              <Button size="sm" onClick={() => confirmReport(row)}>
                <CheckCircle className="h-4 w-4 mr-1" />
                确认
              </Button>
              <Button size="sm" variant="danger" onClick={() => disputeReport(row)}>
                <XCircle className="h-4 w-4 mr-1" />
                提出异议
              </Button>
            </>
          )}
          <Button size="sm" variant="outline">
            <FileCheck className="h-4 w-4 mr-1" />
            查看
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AppLayout>
      <div className="p-6">
        <PageHeader
          title="状况报告"
          description="管理展品状况报告，运输前必须确认"
          action={{ label: '新增报告', href: '/condition-reports/new' }}
        />

        <div className="mb-4 p-4 bg-red-50 rounded-lg border border-red-200">
          <p className="text-sm text-red-800">
            <AlertTriangle className="h-4 w-4 inline mr-1" />
            <strong>重要业务规则：</strong>状况报告未确认前，运输交接的接收方不能进行签收。这是为了确保展品在运输前后的状况得到双方确认。
          </p>
        </div>

        <DataTable
          data={reports}
          columns={columns}
          loading={loading}
          searchable
          searchKeys={['report_number', 'overall_condition']}
          onRowClick={(row) => router.push(`/condition-reports/${row.id}`)}
          emptyMessage="暂无状况报告"
        />
      </div>
    </AppLayout>
  );
}
