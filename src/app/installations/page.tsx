'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import type { InstallationRecord, Exhibit, ExhibitionLocation } from '@/types/database';
import { formatDateTime, createExecutionRecord, logError } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { CheckCircle, MapPin } from 'lucide-react';

interface InstallationWithRelations extends InstallationRecord {
  exhibit?: Exhibit;
  location?: ExhibitionLocation;
}

export default function InstallationsPage() {
  const [records, setRecords] = useState<InstallationWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    loadRecords();
  }, [supabase]);

  const loadRecords = async () => {
    try {
      const { data } = await supabase
        .from('installation_records')
        .select(`
          *,
          location:exhibition_locations(*)
        `)
        .order('created_at', { ascending: false });
      setRecords(data || []);
    } catch (error) {
      console.error('Failed to load records:', error);
    } finally {
      setLoading(false);
    }
  };

  const confirmInstallation = async (record: InstallationWithRelations) => {
    try {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();

      await supabase
        .from('installation_records')
        .update({
          verified_by: userData.user?.id,
          verified_at: new Date().toISOString(),
          is_completed: true,
          actual_install_date: new Date().toISOString(),
        })
        .eq('id', record.id);

      await supabase
        .from('loan_applications')
        .update({ status: 'in_progress' })
        .eq('id', record.application_id);

      await createExecutionRecord(
        record.application_id,
        'installation_completed',
        '布展完成并确认'
      );

      loadRecords();
    } catch (error) {
      console.error('Failed to confirm:', error);
      logError(error as Error, '/installations/confirm');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      key: 'record_number',
      header: '记录编号',
      render: (row: InstallationWithRelations) => (
        <span className="font-mono text-sm text-gray-600">{row.record_number}</span>
      ),
    },
    {
      key: 'location',
      header: '布展位置',
      render: (row: InstallationWithRelations) => (
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-gray-400" />
          <span>{row.location?.name || '-'}</span>
        </div>
      ),
    },
    {
      key: 'planned_install_date',
      header: '计划布展时间',
      render: (row: InstallationWithRelations) => (
        <span>{formatDateTime(row.planned_install_date)}</span>
      ),
    },
    {
      key: 'actual_install_date',
      header: '实际布展时间',
      render: (row: InstallationWithRelations) => (
        <span>{formatDateTime(row.actual_install_date)}</span>
      ),
    },
    {
      key: 'is_completed',
      header: '状态',
      render: (row: InstallationWithRelations) => (
        <Badge status={row.is_completed ? 'completed' : 'pending_review'} />
      ),
    },
    {
      key: 'actions',
      header: '操作',
      render: (row: InstallationWithRelations) => (
        <div className="flex gap-2">
          {!row.is_completed && (
            <Button size="sm" onClick={() => confirmInstallation(row)}>
              <CheckCircle className="h-4 w-4 mr-1" />
              确认布展
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
          title="布展确认"
          description="管理展品布展记录和确认"
          action={{ label: '新建布展', href: '/installations/new' }}
        />
        <DataTable
          data={records}
          columns={columns}
          loading={loading}
          searchable
          searchKeys={['record_number']}
          onRowClick={(row) => router.push(`/installations/${row.id}`)}
          emptyMessage="暂无布展记录"
        />
      </div>
    </AppLayout>
  );
}
