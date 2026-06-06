'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import type { LoanContract, BorrowingInstitution } from '@/types/database';
import { formatDate, formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function ContractsPage() {
  const [contracts, setContracts] = useState<(LoanContract & { institution?: BorrowingInstitution })[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    loadContracts();
  }, [supabase]);

  const loadContracts = async () => {
    try {
      const { data } = await supabase
        .from('loan_contracts')
        .select(`
          *,
          institution:borrowing_institutions(*)
        `)
        .order('created_at', { ascending: false });
      setContracts(data || []);
    } catch (error) {
      console.error('Failed to load contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      key: 'contract_number',
      header: '合同编号',
      render: (row: LoanContract & { institution?: BorrowingInstitution }) => (
        <span className="font-mono text-sm text-gray-600">{row.contract_number}</span>
      ),
    },
    {
      key: 'title',
      header: '合同标题',
      render: (row: LoanContract & { institution?: BorrowingInstitution }) => (
        <div>
          <p className="font-medium text-gray-900">{row.title}</p>
          <p className="text-sm text-gray-500">{row.institution?.name || '-'}</p>
        </div>
      ),
    },
    {
      key: 'start_date',
      header: '借展期限',
      render: (row: LoanContract & { institution?: BorrowingInstitution }) => (
        <span>
          {formatDate(row.start_date)} - {formatDate(row.end_date)}
        </span>
      ),
    },
    {
      key: 'fee_amount',
      header: '费用',
      render: (row: LoanContract & { institution?: BorrowingInstitution }) => (
        <span>{formatCurrency(row.fee_amount, row.currency)}</span>
      ),
    },
    {
      key: 'status',
      header: '状态',
      render: (row: LoanContract & { institution?: BorrowingInstitution }) => (
        <Badge status={row.status} />
      ),
    },
  ];

  return (
    <AppLayout>
      <div className="p-6">
        <PageHeader
          title="借展合同"
          description="管理所有借展合同"
          action={{ label: '新建合同', href: '/contracts/new' }}
        />
        <DataTable
          data={contracts}
          columns={columns}
          loading={loading}
          searchable
          searchKeys={['contract_number', 'title']}
          onRowClick={(row) => router.push(`/contracts/${row.id}`)}
          emptyMessage="暂无合同记录"
        />
      </div>
    </AppLayout>
  );
}
