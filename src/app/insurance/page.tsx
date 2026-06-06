'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import type { InsurancePolicy, Exhibit } from '@/types/database';
import { formatDateTime, formatCurrency, createExecutionRecord, logError } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { ShieldCheck, FileCheck } from 'lucide-react';

interface InsuranceWithExhibit extends InsurancePolicy {
  exhibit?: Exhibit;
}

export default function InsurancePage() {
  const [policies, setPolicies] = useState<InsuranceWithExhibit[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    loadPolicies();
  }, [supabase]);

  const loadPolicies = async () => {
    try {
      const { data } = await supabase
        .from('insurance_policies')
        .select(`*, exhibit:exhibits(*)`)
        .order('created_at', { ascending: false });
      setPolicies(data || []);
    } catch (error) {
      console.error('Failed to load policies:', error);
    } finally {
      setLoading(false);
    }
  };

  const verifyPolicy = async (policy: InsuranceWithExhibit) => {
    try {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();

      await supabase
        .from('insurance_policies')
        .update({
          verified_by: userData.user?.id,
          verified_at: new Date().toISOString(),
          status: 'verified',
        })
        .eq('id', policy.id);

      if (policy.application_id) {
        await createExecutionRecord(
          policy.application_id,
          'insurance_verified',
          `保险单 ${policy.policy_number} 已核验通过`
        );
      }

      loadPolicies();
    } catch (error) {
      console.error('Failed to verify:', error);
      logError(error as Error, '/insurance/verify');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      key: 'policy_number',
      header: '保单编号',
      render: (row: InsuranceWithExhibit) => (
        <span className="font-mono text-sm text-gray-600">{row.policy_number}</span>
      ),
    },
    {
      key: 'exhibit',
      header: '投保展品',
      render: (row: InsuranceWithExhibit) => (
        <div>
          <p className="font-medium text-gray-900">{row.exhibit?.title || '-'}</p>
          <p className="text-sm text-gray-500">{row.insurance_company}</p>
        </div>
      ),
    },
    {
      key: 'coverage_amount',
      header: '保额',
      render: (row: InsuranceWithExhibit) => (
        <span>{formatCurrency(row.coverage_amount, row.currency)}</span>
      ),
    },
    {
      key: 'coverage_period',
      header: '保险期间',
      render: (row: InsuranceWithExhibit) => (
        <div>
          <p className="text-sm">{formatDateTime(row.coverage_start_date)}</p>
          <p className="text-sm text-gray-500">至 {formatDateTime(row.coverage_end_date)}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: '状态',
      render: (row: InsuranceWithExhibit) => <Badge status={row.status} />,
    },
    {
      key: 'actions',
      header: '操作',
      render: (row: InsuranceWithExhibit) => (
        <div className="flex gap-2">
          {row.status === 'submitted' && (
            <Button size="sm" onClick={() => verifyPolicy(row)}>
              <ShieldCheck className="h-4 w-4 mr-1" />
              核验通过
            </Button>
          )}
          {row.policy_file_url && (
            <Button size="sm" variant="outline">
              <FileCheck className="h-4 w-4 mr-1" />
              查看保单
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
          title="保险单管理"
          description="管理展品保险单，核验保险有效性"
          action={{ label: '新增保险单', href: '/insurance/new' }}
        />
        <DataTable
          data={policies}
          columns={columns}
          loading={loading}
          searchable
          searchKeys={['policy_number', 'insurance_company']}
          onRowClick={(row) => router.push(`/insurance/${row.id}`)}
          emptyMessage="暂无保险单记录"
        />
      </div>
    </AppLayout>
  );
}
