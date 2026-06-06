'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import type { DeinstallationRecord } from '@/types/database';
import { formatDateTime, createExecutionRecord, logError } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { CheckCircle, Package } from 'lucide-react';

export default function DeinstallationsPage() {
  const [records, setRecords] = useState<DeinstallationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    loadRecords();
  }, [supabase]);

  const loadRecords = async () => {
    try {
      const { data } = await supabase
        .from('deinstallation_records')
        .select('*')
        .order('created_at', { ascending: false });
      setRecords(data || []);
    } catch (error) {
      console.error('Failed to load records:', error);
    } finally {
      setLoading(false);
    }
  };

  const confirmDeinstallation = async (record: DeinstallationRecord) => {
    try {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();

      await supabase
        .from('deinstallation_records')
        .update({
          verified_by: userData.user?.id,
          verified_at: new Date().toISOString(),
          is_completed: true,
          returned_to_storage: true,
          actual_deinstall_date: new Date().toISOString(),
        })
        .eq('id', record.id);

      const { data: application } = await supabase
        .from('loan_applications')
        .select('exhibit_id')
        .eq('id', record.application_id)
        .single();

      if (application) {
        await supabase
          .from('loan_applications')
          .update({ status: 'completed' })
          .eq('id', record.application_id);

        await supabase
          .from('exhibits')
          .update({ status: 'in_collection' })
          .eq('id', application.exhibit_id);
      }

      await createExecutionRecord(
        record.application_id,
        'deinstallation_completed',
        '撤展完成，展品已归还库房'
      );

      loadRecords();
    } catch (error) {
      console.error('Failed to confirm:', error);
      logError(error as Error, '/deinstallations/confirm');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      key: 'record_number',
      header: '记录编号',
      render: (row: DeinstallationRecord) => (
        <span className="font-mono text-sm text-gray-600">{row.record_number}</span>
      ),
    },
    {
      key: 'planned_deinstall_date',
      header: '计划撤展时间',
      render: (row: DeinstallationRecord) => (
        <span>{formatDateTime(row.planned_deinstall_date)}</span>
      ),
    },
    {
      key: 'actual_deinstall_date',
      header: '实际撤展时间',
      render: (row: DeinstallationRecord) => (
        <span>{formatDateTime(row.actual_deinstall_date)}</span>
      ),
    },
    {
      key: 'returned_to_storage',
      header: '归还状态',
      render: (row: DeinstallationRecord) => (
        <div className="flex items-center gap-2">
          <Package className={`h-4 w-4 ${row.returned_to_storage ? 'text-green-600' : 'text-gray-400'}`} />
          <span>{row.returned_to_storage ? '已归还库房' : '未归还'}</span>
        </div>
      ),
    },
    {
      key: 'is_completed',
      header: '状态',
      render: (row: DeinstallationRecord) => (
        <Badge status={row.is_completed ? 'completed' : 'pending_review'} />
      ),
    },
    {
      key: 'actions',
      header: '操作',
      render: (row: DeinstallationRecord) => (
        <div className="flex gap-2">
          {!row.is_completed && (
            <Button size="sm" onClick={() => confirmDeinstallation(row)}>
              <CheckCircle className="h-4 w-4 mr-1" />
              确认撤展
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <AppLayout>
      <div className="p-6">
        <PageHeader
          title="撤展归还"
          description="管理展品撤展和归还流程"
          action={{ label: '新建撤展', href: '/deinstallations/new' }}
        />
        <DataTable
          data={records}
          columns={columns}
          loading={loading}
          searchable
          searchKeys={['record_number']}
          onRowClick={(row) => router.push(`/deinstallations/${row.id}`)}
          emptyMessage="暂无撤展记录"
        />
      </div>
    </AppLayout>
  );
}
