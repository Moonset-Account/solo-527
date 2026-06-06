'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import type { ShippingCrate } from '@/types/database';
import { useRouter } from 'next/navigation';
import { Thermometer, Gauge } from 'lucide-react';

export default function CratesPage() {
  const [crates, setCrates] = useState<ShippingCrate[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    loadCrates();
  }, [supabase]);

  const loadCrates = async () => {
    try {
      const { data } = await supabase
        .from('shipping_crates')
        .select('*')
        .order('created_at', { ascending: false });
      setCrates(data || []);
    } catch (error) {
      console.error('Failed to load crates:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      key: 'crate_number',
      header: '箱子编号',
      render: (row: ShippingCrate) => (
        <span className="font-mono text-sm text-gray-600">{row.crate_number}</span>
      ),
    },
    {
      key: 'name',
      header: '名称/规格',
      render: (row: ShippingCrate) => (
        <div>
          <p className="font-medium text-gray-900">{row.name || '-'}</p>
          <p className="text-sm text-gray-500">{row.dimensions || '-'}</p>
        </div>
      ),
    },
    {
      key: 'material',
      header: '材质',
      render: (row: ShippingCrate) => <span>{row.material || '-'}</span>,
    },
    {
      key: 'features',
      header: '特性',
      render: (row: ShippingCrate) => (
        <div className="flex gap-2">
          {row.climate_control && (
            <span className="inline-flex items-center gap-1 text-xs text-blue-600">
              <Thermometer className="h-3.5 w-3.5" />
              恒温
            </span>
          )}
          {row.shock_sensors && (
            <span className="inline-flex items-center gap-1 text-xs text-green-600">
              <Gauge className="h-3.5 w-3.5" />
              震动传感
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'max_weight_kg',
      header: '最大承重',
      render: (row: ShippingCrate) => (
        <span>{row.max_weight_kg ? `${row.max_weight_kg} kg` : '-'}</span>
      ),
    },
    {
      key: 'current_status',
      header: '状态',
      render: (row: ShippingCrate) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          row.current_status === 'available'
            ? 'bg-green-100 text-green-800'
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          {row.current_status === 'available' ? '可用' : '使用中'}
        </span>
      ),
    },
  ];

  return (
    <AppLayout>
      <div className="p-6">
        <PageHeader
          title="运输箱管理"
          description="管理展品运输专用箱"
          action={{ label: '新增运输箱', href: '/crates/new' }}
        />
        <DataTable
          data={crates}
          columns={columns}
          loading={loading}
          searchable
          searchKeys={['crate_number', 'name', 'material']}
          onRowClick={(row) => router.push(`/crates/${row.id}`)}
          emptyMessage="暂无运输箱记录"
        />
      </div>
    </AppLayout>
  );
}
