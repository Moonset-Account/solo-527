'use client';

import { useEffect, useState } from 'react';
import { Plus, ShieldCheck, MapPin, User, Calendar, Eye, CheckCircle2, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';
import { PatrolTask, PatrolStatus, FacilityStatus, PATROL_FACILITY_TYPES } from '@/types';
import { formatDate, formatDateTime } from '@/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Label, Select } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Loading, EmptyState, PageHeader, StatsCard } from '@/components/ui/Feedback';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { DataTableFilter } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { FacilityPieChart } from '@/components/ui/Charts';

const statusOptions = [
  { label: '全部', value: '' },
  { label: '待执行', value: 'pending' },
  { label: '执行中', value: 'in_progress' },
  { label: '已完成', value: 'completed' },
];

export default function AdminPatrolsPage() {
  const [loading, setLoading] = useState(true);
  const [patrols, setPatrols] = useState<PatrolTask[]>([]);
  const [filteredPatrols, setFilteredPatrols] = useState<PatrolTask[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPatrol, setSelectedPatrol] = useState<PatrolTask | null>(null);

  const [newPatrol, setNewPatrol] = useState({
    title: '',
    area: '',
    scheduled_at: '',
    executor_id: '',
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await api.getPatrolTasks();
        setPatrols(data);
        setFilteredPatrols(data);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleSearch = (query: string) => {
    if (!query) {
      setFilteredPatrols(patrols);
      return;
    }
    const filtered = patrols.filter(
      (p) =>
        p.title.toLowerCase().includes(query.toLowerCase()) ||
        p.area.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredPatrols(filtered);
  };

  const handleFilterChange = (filters: Record<string, string>) => {
    let filtered = [...patrols];

    if (filters.status) {
      filtered = filtered.filter((p) => p.status === filters.status);
    }

    setFilteredPatrols(filtered);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatrol.title || !newPatrol.area || !newPatrol.executor_id || !newPatrol.scheduled_at) {
      alert('请填写完整信息');
      return;
    }

    try {
      const created = await api.createPatrolTask({
        ...newPatrol,
        scheduled_at: new Date(newPatrol.scheduled_at).toISOString(),
      });
      setPatrols([created, ...patrols]);
      setFilteredPatrols([created, ...filteredPatrols]);
      setShowCreateModal(false);
      setNewPatrol({
        title: '',
        area: '',
        scheduled_at: '',
        executor_id: '',
      });
    } catch (error) {
      alert('创建失败，请稍后重试');
    }
  };

  const getFacilityStats = () => {
    const allCheckItems = patrols.flatMap((p) => p.check_items || []);
    const stats = {
      good: allCheckItems.filter((i) => i.status === 'good').length,
      damaged: allCheckItems.filter((i) => i.status === 'damaged').length,
      missing: allCheckItems.filter((i) => i.status === 'missing').length,
    };
    const total = allCheckItems.length || 1;
    return {
      ...stats,
      goodRate: Math.round((stats.good / total) * 100),
      pieData: [
        { name: '完好', value: stats.good },
        { name: '损坏', value: stats.damaged },
        { name: '丢失', value: stats.missing },
      ],
    };
  };

  const facilityStats = getFacilityStats();

  const stats = {
    pending: patrols.filter((p) => p.status === 'pending').length,
    in_progress: patrols.filter((p) => p.status === 'in_progress').length,
    completed: patrols.filter((p) => p.status === 'completed').length,
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        title="巡逻任务"
        description="分配和管理巡逻任务，跟踪设施检查情况"
        action={
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            新建任务
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="待执行任务"
          value={stats.pending}
          icon={<Calendar className="w-6 h-6" />}
          className="animate-stagger-1"
        />
        <StatsCard
          title="执行中"
          value={stats.in_progress}
          icon={<ShieldCheck className="w-6 h-6" />}
          className="animate-stagger-2"
        />
        <StatsCard
          title="已完成"
          value={stats.completed}
          icon={<CheckCircle2 className="w-6 h-6" />}
          className="animate-stagger-3"
        />
        <Card className="animate-stagger-4">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">设施完好率</p>
                <p className="text-3xl font-bold text-success-600 mt-1">
                  {facilityStats.goodRate}%
                </p>
              </div>
              <div className="p-3 rounded-lg bg-success-50 text-success-600">
                <ShieldCheck className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>巡逻任务列表</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <DataTableFilter
                filters={[
                  { key: 'status', label: '状态', type: 'select', options: statusOptions },
                ]}
                onFilterChange={handleFilterChange}
                onSearch={handleSearch}
                searchPlaceholder="搜索任务标题、区域..."
              />

              <div className="mt-6 rounded-lg border border-slate-200 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>任务名称</TableHead>
                      <TableHead>巡逻区域</TableHead>
                      <TableHead>执行人</TableHead>
                      <TableHead>计划时间</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPatrols.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6}>
                          <EmptyState
                            icon={<ShieldCheck className="w-12 h-12" />}
                            title="暂无巡逻任务"
                            description="点击右上角按钮创建新的巡逻任务"
                          />
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPatrols.map((patrol, index) => (
                        <TableRow
                          key={patrol.id}
                          className="animate-fade-in-up"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <TableCell>
                            <div className="font-medium text-slate-900">{patrol.title}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-slate-600">
                              <MapPin className="w-4 h-4" />
                              <span>{patrol.area}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs">
                                {patrol.executor?.name?.slice(0, 1)}
                              </div>
                              <span className="text-slate-700">{patrol.executor?.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-slate-600">
                              <Calendar className="w-4 h-4" />
                              {formatDate(patrol.scheduled_at)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge status={patrol.status} />
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedPatrol(patrol);
                                setShowDetailModal(true);
                              }}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              详情
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">设施状态统计</CardTitle>
            </CardHeader>
            <CardContent>
              <FacilityPieChart data={facilityStats.pieData} height={220} />
              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="text-center p-2 bg-success-50 rounded-lg">
                  <p className="text-lg font-bold text-success-600">{facilityStats.good}</p>
                  <p className="text-xs text-success-700">完好</p>
                </div>
                <div className="text-center p-2 bg-danger-50 rounded-lg">
                  <p className="text-lg font-bold text-danger-600">{facilityStats.damaged}</p>
                  <p className="text-xs text-danger-700">损坏</p>
                </div>
                <div className="text-center p-2 bg-warning-50 rounded-lg">
                  <p className="text-lg font-bold text-warning-600">{facilityStats.missing}</p>
                  <p className="text-xs text-warning-700">丢失</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">设施类型统计</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {PATROL_FACILITY_TYPES.map((type) => {
                  const items = patrols
                    .flatMap((p) => p.check_items || [])
                    .filter((i) => i.facility_type === type);
                  const good = items.filter((i) => i.status === 'good').length;
                  const total = items.length;
                  const rate = total > 0 ? Math.round((good / total) * 100) : 0;

                  return (
                    <div key={type} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-700">{type}</span>
                        <span className="text-slate-500">{good}/{total}</span>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-success-500 rounded-full transition-all"
                          style={{ width: `${rate}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="新建巡逻任务"
        className="max-w-lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <Label htmlFor="title">任务名称 *</Label>
            <Input
              id="title"
              value={newPatrol.title}
              onChange={(e) => setNewPatrol({ ...newPatrol, title: e.target.value })}
              placeholder="请输入任务名称"
              required
            />
          </div>

          <div>
            <Label htmlFor="area">巡逻区域 *</Label>
            <Input
              id="area"
              value={newPatrol.area}
              onChange={(e) => setNewPatrol({ ...newPatrol, area: e.target.value })}
              placeholder="请输入巡逻区域"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="scheduled_at">计划时间 *</Label>
              <Input
                id="scheduled_at"
                type="datetime-local"
                value={newPatrol.scheduled_at}
                onChange={(e) => setNewPatrol({ ...newPatrol, scheduled_at: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="executor">执行人 *</Label>
              <Select
                id="executor"
                value={newPatrol.executor_id}
                onChange={(e) => setNewPatrol({ ...newPatrol, executor_id: e.target.value })}
                required
              >
                <option value="">请选择执行人</option>
                {[
                  { id: 'resident-001', name: '李居民' },
                  { id: 'resident-002', name: '王代表' },
                  { id: 'resident-003', name: '赵大妈' },
                ].map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCreateModal(false)}
            >
              取消
            </Button>
            <Button type="submit">创建任务</Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="巡逻任务详情"
        className="max-w-2xl"
      >
        {selectedPatrol && (
          <div className="space-y-6">
            <div className="p-4 bg-slate-50 rounded-lg">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {selectedPatrol.title}
              </h3>
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {selectedPatrol.area}
                </span>
                <span className="inline-flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {selectedPatrol.executor?.name}
                </span>
                <Badge status={selectedPatrol.status} />
              </div>
            </div>

            <div>
              <h4 className="font-medium text-slate-900 mb-3">检查项详情</h4>
              {selectedPatrol.check_items?.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">暂无检查项</p>
              ) : (
                <div className="space-y-3">
                  {selectedPatrol.check_items?.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between p-4 bg-slate-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900">{item.name}</span>
                          <span className="text-xs text-slate-500 bg-slate-200 px-2 py-0.5 rounded">
                            {item.facility_type}
                          </span>
                        </div>
                        {item.remark && (
                          <p className="text-sm text-slate-600 mt-2">{item.remark}</p>
                        )}
                      </div>
                      <Badge status={item.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h4 className="font-medium text-slate-900 mb-3">时间信息</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-slate-500">创建时间</p>
                  <p className="font-medium text-slate-700 mt-1">
                    {formatDateTime(selectedPatrol.created_at)}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-slate-500">计划执行</p>
                  <p className="font-medium text-slate-700 mt-1">
                    {formatDateTime(selectedPatrol.scheduled_at)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
