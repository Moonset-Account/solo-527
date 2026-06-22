'use client';

import { useEffect, useState } from 'react';
import { Users, User, Eye, Building2, TrendingUp, TrendingDown } from 'lucide-react';
import { api } from '@/lib/api';
import { ResidentParticipation, STATUS_COLORS, STATUS_LABELS } from '@/types';
import { formatDate, formatDateTime } from '@/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Loading, EmptyState, PageHeader } from '@/components/ui/Feedback';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { DataTableFilter, Pagination } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';

const areaOptions = [
  { label: '全部', value: '' },
  { label: '阳光社区', value: '阳光社区' },
];

const buildingOptions = [
  { label: '全部', value: '' },
  { label: '1号楼', value: '1号楼' },
  { label: '2号楼', value: '2号楼' },
  { label: '3号楼', value: '3号楼' },
  { label: '4号楼', value: '4号楼' },
  { label: '5号楼', value: '5号楼' },
];

const statusOptions = [
  { label: '全部', value: '' },
  { label: '积极参与', value: 'active' },
  { label: '参与较少', value: 'inactive' },
  { label: '新用户', value: 'new' },
];

export default function AdminResidentsPage() {
  const [loading, setLoading] = useState(true);
  const [residents, setResidents] = useState<ResidentParticipation[]>([]);
  const [filteredResidents, setFilteredResidents] = useState<ResidentParticipation[]>([]);
  const [selectedResident, setSelectedResident] = useState<ResidentParticipation | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await api.getResidentParticipation();
        setResidents(data);
        setFilteredResidents(data);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleSearch = (query: string) => {
    if (!query) {
      setFilteredResidents(residents);
      return;
    }
    const filtered = residents.filter(
      (r) =>
        r.name.toLowerCase().includes(query.toLowerCase()) ||
        (r.building && r.building.includes(query))
    );
    setFilteredResidents(filtered);
    setCurrentPage(1);
  };

  const handleFilterChange = (filters: Record<string, string>) => {
    let filtered = [...residents];

    if (filters.area) {
      filtered = filtered.filter((r) => r.area === filters.area);
    }
    if (filters.building) {
      filtered = filtered.filter((r) => r.building === filters.building);
    }
    if (filters.status) {
      filtered = filtered.filter((r) => r.status === filters.status);
    }

    setFilteredResidents(filtered);
    setCurrentPage(1);
  };

  const getParticipationStats = () => {
    const active = filteredResidents.filter((r) => r.status === 'active').length;
    const inactive = filteredResidents.filter((r) => r.status === 'inactive').length;
    const newUsers = filteredResidents.filter((r) => r.status === 'new').length;
    const avgParticipation =
      filteredResidents.length > 0
        ? Math.round(
            filteredResidents.reduce((sum, r) => sum + r.participation_rate, 0) /
              filteredResidents.length
          )
        : 0;

    return { active, inactive, newUsers, avgParticipation };
  };

  const stats = getParticipationStats();
  const totalPages = Math.ceil(filteredResidents.length / pageSize);
  const paginatedResidents = filteredResidents.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  if (loading) return <Loading />;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        title="居民台账"
        description="管理居民信息，查看参与状态和统计数据"
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">居民总数</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {filteredResidents.length}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-primary-50 text-primary-600">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">积极参与</p>
                <p className="text-3xl font-bold text-success-600 mt-1">{stats.active}</p>
              </div>
              <div className="p-3 rounded-lg bg-success-50 text-success-600">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">参与较少</p>
                <p className="text-3xl font-bold text-warning-600 mt-1">{stats.inactive}</p>
              </div>
              <div className="p-3 rounded-lg bg-warning-50 text-warning-600">
                <TrendingDown className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">平均参与率</p>
                <p className="text-3xl font-bold text-primary-600 mt-1">
                  {stats.avgParticipation}%
                </p>
              </div>
              <div className="p-3 rounded-lg bg-primary-50 text-primary-600">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>居民列表</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <DataTableFilter
            filters={[
              { key: 'area', label: '片区', type: 'select', options: areaOptions },
              { key: 'building', label: '楼栋', type: 'select', options: buildingOptions },
              { key: 'status', label: '参与状态', type: 'select', options: statusOptions },
            ]}
            onFilterChange={handleFilterChange}
            onSearch={handleSearch}
            searchPlaceholder="搜索居民姓名、楼栋..."
          />

          <div className="mt-6 rounded-lg border border-slate-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>居民姓名</TableHead>
                  <TableHead>片区/楼栋</TableHead>
                  <TableHead>参与次数</TableHead>
                  <TableHead>参与率</TableHead>
                  <TableHead>最近参与时间</TableHead>
                  <TableHead>参与状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedResidents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <EmptyState title="暂无数据" description="没有找到符合条件的居民" />
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedResidents.map((resident, index) => (
                    <TableRow
                      key={resident.resident_id}
                      className="animate-fade-in-up"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-medium">
                            {resident.name.slice(0, 1)}
                          </div>
                          <span className="font-medium text-slate-900">{resident.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-slate-600">
                          <Building2 className="w-4 h-4" />
                          {resident.area} {resident.building}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-slate-900">
                          {resident.total_votes} 次
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                resident.participation_rate >= 80
                                  ? 'bg-success-500'
                                  : resident.participation_rate >= 60
                                  ? 'bg-primary-500'
                                  : resident.participation_rate >= 40
                                  ? 'bg-warning-500'
                                  : 'bg-danger-500'
                              }`}
                              style={{ width: `${resident.participation_rate}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-slate-700">
                            {resident.participation_rate}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {resident.last_participation_at
                          ? formatDate(resident.last_participation_at)
                          : '未参与'}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[resident.status]}`}
                        >
                          {STATUS_LABELS[resident.status]}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedResident(resident);
                            setShowDetailModal(true);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          查看详情
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {filteredResidents.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={filteredResidents.length}
              onPageChange={setCurrentPage}
              className="mt-4 rounded-lg border border-slate-200"
            />
          )}
        </CardContent>
      </Card>

      <Modal
        open={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="居民参与详情"
        className="max-w-2xl"
      >
        {selectedResident && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
              <div className="w-16 h-16 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-2xl font-bold">
                {selectedResident.name.slice(0, 1)}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  {selectedResident.name}
                </h3>
                <p className="text-sm text-slate-500">
                  {selectedResident.area} {selectedResident.building}
                </p>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium mt-1 ${STATUS_COLORS[selectedResident.status]}`}
                >
                  {STATUS_LABELS[selectedResident.status]}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <p className="text-2xl font-bold text-slate-900">
                  {selectedResident.total_votes}
                </p>
                <p className="text-sm text-slate-500">参与次数</p>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <p className="text-2xl font-bold text-slate-900">
                  {selectedResident.participation_rate}%
                </p>
                <p className="text-sm text-slate-500">参与率</p>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <p className="text-sm font-medium text-slate-900">
                  {selectedResident.last_participation_at
                    ? formatDateTime(selectedResident.last_participation_at)
                    : '未参与'}
                </p>
                <p className="text-sm text-slate-500">最近参与</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
