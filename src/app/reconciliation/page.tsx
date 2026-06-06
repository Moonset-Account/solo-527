'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import type { MonthlyReconciliation } from '@/types/database';
import { formatCurrency, logError } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { Receipt, FileText, Download, RefreshCw } from 'lucide-react';

export default function ReconciliationPage() {
  const [reconciliations, setReconciliations] = useState<MonthlyReconciliation[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    loadReconciliations();
  }, [supabase]);

  const loadReconciliations = async () => {
    try {
      const { data } = await supabase
        .from('monthly_reconciliations')
        .select('*')
        .order('reconciliation_month', { ascending: false });
      setReconciliations(data || []);
    } catch (error) {
      console.error('Failed to load reconciliations:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateCurrentMonth = async () => {
    try {
      setGenerating(true);
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      const { data: applications } = await supabase
        .from('loan_applications')
        .select(`
          *,
          contract:loan_contracts(fee_amount, currency)
        `)
        .gte('created_at', `${currentMonth}-01`)
        .lt('created_at', `${currentMonth}-31`);

      const { data: insurance } = await supabase
        .from('insurance_policies')
        .select('premium_amount')
        .gte('created_at', `${currentMonth}-01`)
        .lt('created_at', `${currentMonth}-31`)
        .eq('status', 'verified');

      const totalFees = applications?.reduce((sum, app) => {
        return sum + (Number(app.contract?.fee_amount) || 0);
      }, 0) || 0;

      const totalPremiums = insurance?.reduce((sum, ins) => {
        return sum + (Number(ins.premium_amount) || 0);
      }, 0) || 0;

      const { data: userData } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('monthly_reconciliations')
        .upsert({
          reconciliation_month: currentMonth,
          total_contracts: applications?.length || 0,
          total_fees: totalFees,
          total_insurance_premiums: totalPremiums,
          total_transport_costs: 0,
          status: 'draft',
          prepared_by: userData.user?.id,
          prepared_at: new Date().toISOString(),
        }, {
          onConflict: 'reconciliation_month',
        });

      if (error) throw error;

      loadReconciliations();
    } catch (error) {
      console.error('Failed to generate:', error);
      logError(error as Error, '/reconciliation/generate');
    } finally {
      setGenerating(false);
    }
  };

  const columns = [
    {
      key: 'reconciliation_month',
      header: '对账月份',
      render: (row: MonthlyReconciliation) => (
        <span className="font-medium text-gray-900">{row.reconciliation_month}</span>
      ),
    },
    {
      key: 'total_contracts',
      header: '合同数量',
      render: (row: MonthlyReconciliation) => (
        <span className="flex items-center gap-1">
          <FileText className="h-4 w-4 text-gray-400" />
          {row.total_contracts} 份
        </span>
      ),
    },
    {
      key: 'total_fees',
      header: '借展费用',
      render: (row: MonthlyReconciliation) => (
        <span className="text-amber-600 font-medium">
          {formatCurrency(row.total_fees)}
        </span>
      ),
    },
    {
      key: 'total_insurance_premiums',
      header: '保险费用',
      render: (row: MonthlyReconciliation) => (
        <span>{formatCurrency(row.total_insurance_premiums)}</span>
      ),
    },
    {
      key: 'total',
      header: '总计',
      render: (row: MonthlyReconciliation) => (
        <span className="font-bold text-gray-900">
          {formatCurrency(row.total_fees + row.total_insurance_premiums + row.total_transport_costs)}
        </span>
      ),
    },
    {
      key: 'status',
      header: '状态',
      render: (row: MonthlyReconciliation) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          row.status === 'verified'
            ? 'bg-green-100 text-green-800'
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          {row.status === 'verified' ? '已确认' : '草稿'}
        </span>
      ),
    },
  ];

  return (
    <AppLayout>
      <div className="p-6">
        <PageHeader
          title="月度对账"
          description="每月借展费用、保险费用核对"
          action={{
            label: '生成本月对账',
            onClick: generateCurrentMonth,
          }}
        >
          {generating && (
            <Button variant="outline" disabled>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              生成中...
            </Button>
          )}
        </PageHeader>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Receipt className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">累计对账月份</p>
                <p className="text-xl font-bold text-gray-900">{reconciliations.length}</p>
              </div>
            </div>
          </div>
        </div>

        <DataTable
          data={reconciliations}
          columns={columns}
          loading={loading}
          onRowClick={(row) => router.push(`/reconciliation/${row.id}`)}
          emptyMessage="暂无对账记录"
        />
      </div>
    </AppLayout>
  );
}
