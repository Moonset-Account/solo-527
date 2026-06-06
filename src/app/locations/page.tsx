'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import type { ExhibitionLocation } from '@/types/database';
import { useRouter } from 'next/navigation';
import { MapPin, Users } from 'lucide-react';

const locationTypeLabels: Record<string, string> = {
  gallery: '展厅',
  storage: '库房',
  conservation_lab: '修复实验室',
  loading_dock: '装卸区',
  off_site: '场外',
};

export default function LocationsPage() {
  const [locations, setLocations] = useState<ExhibitionLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    loadLocations();
  }, [supabase]);

  const loadLocations = async () => {
    try {
      const { data } = await supabase
        .from('exhibition_locations')
        .select('*')
        .order('code', { ascending: true });
      setLocations(data || []);
    } catch (error) {
      console.error('Failed to load locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      key: 'code',
      header: '位置编码',
      render: (row: ExhibitionLocation) => (
        <span className="font-mono text-sm text-gray-600">{row.code}</span>
      ),
    },
    {
      key: 'name',
      header: '位置名称',
      render: (row: ExhibitionLocation) => (
        <div>
          <p className="font-medium text-gray-900">{row.name}</p>
          <p className="text-sm text-gray-500">{row.floor ? `${row.floor}层` : ''} {row.area || ''}</p>
        </div>
      ),
    },
    {
      key: 'type',
      header: '类型',
      render: (row: ExhibitionLocation) => (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <MapPin className="h-3 w-3" />
          {locationTypeLabels[row.type] || row.type}
        </span>
      ),
    },
    {
      key: 'max_exhibits',
      header: '容量',
      render: (row: ExhibitionLocation) => (
        <span className="inline-flex items-center gap-1 text-sm text-gray-600">
          <Users className="h-4 w-4" />
          最多 {row.max_exhibits} 件展品
        </span>
      ),
    },
    {
      key: 'is_active',
      header: '状态',
      render: (row: ExhibitionLocation) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          row.is_active
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-500'
        }`}>
          {row.is_active ? '启用' : '停用'}
        </span>
      ),
    },
  ];

  return (
    <AppLayout>
      <div className="p-6">
        <PageHeader
          title="布展位置"
          description="管理展厅、库房等布展位置"
          action={{ label: '新增位置', href: '/locations/new' }}
        />
        <DataTable
          data={locations}
          columns={columns}
          loading={loading}
          searchable
          searchKeys={['code', 'name', 'floor', 'area']}
          onRowClick={(row) => router.push(`/locations/${row.id}`)}
          emptyMessage="暂无位置记录"
        />
      </div>
    </AppLayout>
  );
}
