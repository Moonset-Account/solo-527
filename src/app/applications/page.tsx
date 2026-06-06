'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import type { LoanApplication, Exhibit, LoanContract } from '@/types/database';
import { formatDate, createExecutionRecord, logError } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, PlayCircle } from 'lucide-react';

interface ApplicationWithRelations extends LoanApplication {
  exhibit?: Exhibit;
  contract?: LoanContract;
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    loadApplications();
  }, [supabase]);

  const loadApplications = async () => {
    try {
      const { data } = await supabase
        .from('loan_applications')
        .select(`
          *,
          exhibit:exhibits(*),
          contract:loan_contracts(*)
        `)
        .order('created_at', { ascending: false });
      setApplications(data || []);
    } catch (error) {
      console.error('Failed to load applications:', error);
      logError(error as Error, '/applications');
    } finally {
      setLoading(false);
    }
  };

  const runChecks = async (application: ApplicationWithRelations) => {
    try {
      setLoading(true);

      const { data: institutionData } = await supabase
        .from('loan_contracts')
        .select('borrowing_institution_id, borrowing_institutions!inner(is_qualified)')
        .eq('id', application.contract_id)
        .single();

      const institutionQualified = institutionData?.borrowing_institutions?.is_qualified || false;

      const { data: exhibitData } = await supabase
        .from('exhibits')
        .select('status')
        .eq('id', application.exhibit_id)
        .single();

      const inventoryOk = exhibitData?.status === 'in_collection';

      const { data: scheduleOk } = await supabase.rpc('check_exhibit_availability', {
        p_exhibit_id: application.exhibit_id,
        p_start_date: application.requested_start_date,
        p_end_date: application.requested_end_date,
        p_exclude_application_id: application.id,
      });

      const updates: Partial<LoanApplication> = {
        qualification_check_passed: institutionQualified,
        inventory_check_passed: inventoryOk,
        schedule_check_passed: scheduleOk as boolean,
        status: 'pending_review' as any,
      };

      if (institutionQualified && inventoryOk && scheduleOk) {
        updates.status = 'awaiting_confirmation';
      }

      await supabase
        .from('loan_applications')
        .update(updates)
        .eq('id', application.id);

      await createExecutionRecord(
        application.id,
        'run_checks',
        '执行资格、库存、时段校验',
        updates
      );

      loadApplications();
    } catch (error) {
      console.error('Failed to run checks:', error);
      logError(error as Error, '/applications/run-checks');
    } finally {
      setLoading(false);
    }
  };

  const manualConfirm = async (application: ApplicationWithRelations) => {
    try {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();

      await supabase
        .from('loan_applications')
        .update({
          manual_confirmed_by: userData.user?.id,
          manual_confirmed_at: new Date().toISOString(),
          status: 'confirmed',
        })
        .eq('id', application.id);

      await supabase
        .from('exhibits')
        .update({ status: 'on_loan' })
        .eq('id', application.exhibit_id);

      await createExecutionRecord(
        application.id,
        'manual_confirm',
        '人工确认通过，申请已确认'
      );

      loadApplications();
    } catch (error) {
      console.error('Failed to confirm:', error);
      logError(error as Error, '/applications/confirm');
    } finally {
      setLoading(false);
    }
  };

  const rejectApplication = async (application: ApplicationWithRelations) => {
    try {
      setLoading(true);
      await supabase
        .from('loan_applications')
        .update({ status: 'rejected' })
        .eq('id', application.id);

      await createExecutionRecord(
        application.id,
        'reject',
        '申请被拒绝'
      );

      loadApplications();
    } catch (error) {
      console.error('Failed to reject:', error);
      logError(error as Error, '/applications/reject');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      key: 'id',
      header: '申请编号',
      render: (row: ApplicationWithRelations) => (
        <span className="font-mono text-sm text-gray-600">#{row.id.slice(0, 8)}</span>
      ),
    },
    {
      key: 'exhibit',
      header: '展品',
      render: (row: ApplicationWithRelations) => (
        <div>
          <p className="font-medium text-gray-900">{row.exhibit?.title || '-'}</p>
          <p className="text-sm text-gray-500">{row.exhibit?.accession_number || '-'}</p>
        </div>
      ),
    },
    {
      key: 'requested_start_date',
      header: '申请时段',
      render: (row: ApplicationWithRelations) => (
        <span>
          {formatDate(row.requested_start_date)} - {formatDate(row.requested_end_date)}
        </span>
      ),
    },
    {
      key: 'checks',
      header: '校验状态',
      render: (row: ApplicationWithRelations) => (
        <div className="flex gap-2">
          <span className={`inline-flex items-center gap-1 text-xs ${
            row.qualification_check_passed ? 'text-green-600' :
            row.qualification_check_passed === false ? 'text-red-600' : 'text-gray-400'
          }`}>
            {row.qualification_check_passed === true && <CheckCircle className="h-3.5 w-3.5" />}
            {row.qualification_check_passed === false && <XCircle className="h-3.5 w-3.5" />}
            资格
          </span>
          <span className={`inline-flex items-center gap-1 text-xs ${
            row.inventory_check_passed ? 'text-green-600' :
            row.inventory_check_passed === false ? 'text-red-600' : 'text-gray-400'
          }`}>
            {row.inventory_check_passed === true && <CheckCircle className="h-3.5 w-3.5" />}
            {row.inventory_check_passed === false && <XCircle className="h-3.5 w-3.5" />}
            库存
          </span>
          <span className={`inline-flex items-center gap-1 text-xs ${
            row.schedule_check_passed ? 'text-green-600' :
            row.schedule_check_passed === false ? 'text-red-600' : 'text-gray-400'
          }`}>
            {row.schedule_check_passed === true && <CheckCircle className="h-3.5 w-3.5" />}
            {row.schedule_check_passed === false && <XCircle className="h-3.5 w-3.5" />}
            时段
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: '状态',
      render: (row: ApplicationWithRelations) => <Badge status={row.status} />,
    },
    {
      key: 'actions',
      header: '操作',
      render: (row: ApplicationWithRelations) => (
        <div className="flex gap-2">
          {row.status === 'draft' && (
            <Button size="sm" variant="outline" onClick={() => runChecks(row)}>
              <PlayCircle className="h-4 w-4 mr-1" />
              执行校验
            </Button>
          )}
          {row.status === 'awaiting_confirmation' && (
            <>
              <Button size="sm" onClick={() => manualConfirm(row)}>
                <CheckCircle className="h-4 w-4 mr-1" />
                确认
              </Button>
              <Button size="sm" variant="danger" onClick={() => rejectApplication(row)}>
                <XCircle className="h-4 w-4 mr-1" />
                拒绝
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <AppLayout>
      <div className="p-6">
        <PageHeader
          title="借展申请"
          description="管理展品借展申请流程，执行资格、库存、时段校验"
          action={{ label: '新建申请', href: '/applications/new' }}
        />
        <DataTable
          data={applications}
          columns={columns}
          loading={loading}
          searchable
          searchKeys={['id']}
          onRowClick={(row) => router.push(`/applications/${row.id}`)}
          emptyMessage="暂无借展申请"
        />
      </div>
    </AppLayout>
  );
}
