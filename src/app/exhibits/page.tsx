'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import type { Exhibit } from '@/types/database';
import { formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function ExhibitsPage() {
  const [exhibits, setExhibits] = useState<Exhibit[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    loadExhibits();
  }, [supabase]);

  const loadExhibits = async () => {
    try {
      const { data } = await supabase
        .from('exhibits')
        .select('*')
        .order('created_at', { ascending: false });
      setExhibits(data || []);
    } catch (error) {
      console.error('Failed to load exhibits:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      key: 'accession_number',
      header: '入藏编号',
      render: (row: Exhibit) => (
        <span className="font-mono text-sm text-gray-600">{row.accession_number}</span>
      ),
    },
    {
      key: 'title',
      header: '展品名称',
      render: (row: Exhibit) => (
        <div>
          <p className="font-medium text-gray-900">{row.title}</p>
          <p className="text-sm text-gray-500">{row.artist || '未知艺术家'}</p>
        </div>
      ),
    },
    {
      key: 'medium',
      header: '材质',
      render: (row: Exhibit) => <span>{row.medium || '-'}</span>,
    },
    {
      key: 'estimated_value',
      header: '估价',
      render: (row: Exhibit) => (
        <span>{formatCurrency(row.estimated_value, row.currency)}</span>
      ),
    },
    {
      key: 'status',
      header: '状态',
      render: (row: Exhibit) => <Badge status={row.status} />,
    },
  ];

  return (
    <AppLayout>
      <div className="p-6">
        <PageHeader
          title="展品台账"
          description="管理艺术馆所有展品信息"
          action={{ label: '新增展品', href: '/exhibits/new' }}
        />
        <DataTable
          data={exhibits}
          columns={columns}
          loading={loading}
          searchable
          searchKeys={['accession_number', 'title', 'artist', 'medium']}
          onRowClick={(row) => router.push(`/exhibits/${row.id}`)}
          emptyMessage="暂无展品记录"
        />
      </div>
    </AppLayout>
  );
}
