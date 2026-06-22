'use client';

import { useEffect, useState } from 'react';
import {
  BarChart3,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  RefreshCw,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { api } from '@/lib/api';
import { ReportRecord, ReportStatus, REPORT_TYPES } from '@/types';
import { formatDate, formatDateTime } from '@/utils';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Loading, EmptyState, PageHeader, StatsCard } from '@/components/ui/Feedback';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { DataTableFilter } from '@/components/ui/DataTable';
import { TrendLineChart, StatusBarChart, FacilityPieChart } from '@/components/ui/Charts';

const statusOptions = [
  { label: '全部', value: '' },
  { label: '待处理', value: 'pending' },
  { label: '处理中', value: 'processing' },
  { label: '已解决', value: 'resolved' },
];

const typeOptions = [
  { label: '全部', value: '' },
  ...REPORT_TYPES.map((t) => ({ label: t, value: t })),
];

export default function AdminReportsPage() {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [filteredReports, setFilteredReports] = useState<ReportRecord[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await api.getReportRecords();
        setReports(data);
        setFilteredReports(data);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleSearch = (query: string) => {
    if (!query) {
      setFilteredReports(reports);
      return;
    }
    const filtered = reports.filter(
      (r) =>
        r.title.toLowerCase().includes(query.toLowerCase()) ||
        r.location.toLowerCase().includes(query.toLowerCase()) ||
        r.reporter.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredReports(filtered);
  };

  const handleFilterChange = (filters: Record<string, string>) => {
    let filtered = [...reports];

    if (filters.status) {
      filtered = filtered.filter((r) => r.status === filters.status);
    }
    if (filters.type) {
      filtered = filtered.filter((r) => r.type === filters.type);
    }

    setFilteredReports(filtered);
  };

  const getStats = () => {
    const pending = reports.filter((r) => r.status === 'pending').length;
    const processing = reports.filter((r) => r.status === 'processing').length;
    const resolved = reports.filter((r) => r.status === 'resolved').length;
    const totalDuplicates = reports.reduce((sum, r) => sum + (r.duplicate_count - 1), 0);
    const avgResolutionDays = reports
      .filter((r) => r.resolved_at)
      .reduce((sum, r) => {
        const days =
          (new Date(r.resolved_at!).getTime() - new Date(r.first_report_at).getTime()) /
          (1000 * 60 * 60 * 24);
        return sum + days;
      }, 0) / (reports.filter((r) => r.resolved_at).length || 1);

    return {
      pending,
      processing,
      resolved,
      totalDuplicates,
      avgResolutionDays: Math.round(avgResolutionDays * 10) / 10,
    };
  };

  const stats = getStats();

  const statusData = [
    { name: '待处理', value: stats.pending, color: '#f59e0b' },
    { name: '处理中', value: stats.processing, color: '#2563eb' },
    { name: '已解决', value: stats.resolved, color: '#10b981' },
  ];

  const typeStats = REPORT_TYPES.map((type) => ({
    name: type,
    数量: reports.filter((r) => r.type === type).length,
  })).filter((t) => t.数量 > 0);

  const trendData = [
    { name: '1月', 上报数: 12, 解决数: 10 },
    { name: '2月', 上报数: 15, 解决数: 14 },
    { name: '3月', 上报数: 18, 解决数: 16 },
    { name: '4月', 上报数: 14, 解决数: 15 },
    { name: '5月', 上报数: 20, 解决数: 18 },
    { name: '6月', 上报数: reports.length, 解决数: stats.resolved },
  ];

  const duplicatePieData = [
    { name: '单次上报', value: reports.filter((r) => r.duplicate_count === 1).length },
    { name: '重复上报', value: reports.filter((r) => r.duplicate_count > 1).length },
  ];

  if (loading) return <Loading />;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        title="重复上报统计"
        description="自动统计上报数据，无需人工追问，实时查看待办、处理结果和设施完好情况"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard
          title="待办事项"
          value={stats.pending}
          icon={<Clock className="w-6 h-6" />}
          className="animate-stagger-1"
        />
        <StatsCard
          title="处理中"
          value={stats.processing}
          icon={<RefreshCw className="w-6 h-6" />}
          className="animate-stagger-2"
        />
        <StatsCard
          title="已解决"
          value={stats.resolved}
          icon={<CheckCircle2 className="w-6 h-6" />}
          className="animate-stagger-3"
        />
        <StatsCard
          title="重复上报"
          value={stats.totalDuplicates}
          icon={<AlertCircle className="w-6 h-6" />}
          className="animate-stagger-4"
        />
        <Card className="animate-stagger-5">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">平均解决时长</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {stats.avgResolutionDays} 天
                </p>
              </div>
              <div className="p-3 rounded-lg bg-primary-50 text-primary-600">
                <TrendingDown className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>上报趋势</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendLineChart
              data={trendData}
              yKeys={[
                { key: '上报数', name: '上报数', color: '#f59e0b' },
                { key: '解决数', name: '解决数', color: '#10b981' },
              ]}
              height={280}
            />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">处理状态分布</CardTitle>
            </CardHeader>
            <CardContent>
              <FacilityPieChart data={statusData} height={180} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">重复上报占比</CardTitle>
            </CardHeader>
            <CardContent>
              <FacilityPieChart data={duplicatePieData} height={180} />
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">设施完好统计</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-success-100 to-success-200 mb-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-success-700">85%</p>
                  <p className="text-xs text-success-600">完好率</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="p-2 bg-success-50 rounded">
                  <p className="font-bold text-success-600">32</p>
                  <p className="text-xs text-success-700">完好</p>
                </div>
                <div className="p-2 bg-danger-50 rounded">
                  <p className="font-bold text-danger-600">4</p>
                  <p className="text-xs text-danger-700">损坏</p>
                </div>
                <div className="p-2 bg-warning-50 rounded">
                  <p className="font-bold text-warning-600">2</p>
                  <p className="text-xs text-warning-700">丢失</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">按类型统计</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusBarChart
              data={typeStats}
              xKey="name"
              yKey="数量"
              height={200}
              color="#2563eb"
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>上报记录明细</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <DataTableFilter
            filters={[
              { key: 'status', label: '状态', type: 'select', options: statusOptions },
              { key: 'type', label: '类型', type: 'select', options: typeOptions },
            ]}
            onFilterChange={handleFilterChange}
            onSearch={handleSearch}
            searchPlaceholder="搜索标题、位置、上报人..."
          />

          <div className="mt-6 rounded-lg border border-slate-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>标题</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>位置</TableHead>
                  <TableHead>上报人</TableHead>
                  <TableHead>重复次数</TableHead>
                  <TableHead>首次上报</TableHead>
                  <TableHead>最近上报</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>处理人</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9}>
                      <EmptyState
                        icon={<FileText className="w-12 h-12" />}
                        title="暂无上报记录"
                        description="没有找到符合条件的上报记录"
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReports.map((report, index) => (
                    <TableRow
                      key={report.id}
                      className="animate-fade-in-up"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <TableCell>
                        <div className="font-medium text-slate-900">{report.title}</div>
                      </TableCell>
                      <TableCell>
                        <span className="text-slate-600">{report.type}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-slate-600">{report.location}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-slate-600">{report.reporter}</span>
                      </TableCell>
                      <TableCell>
                        {report.duplicate_count > 1 ? (
                          <span className="inline-flex items-center px-2 py-1 bg-danger-100 text-danger-700 text-sm rounded-full font-medium">
                            {report.duplicate_count} 次
                          </span>
                        ) : (
                          <span className="text-slate-500">1 次</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-slate-600">
                          {formatDate(report.first_report_at)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-slate-600">
                          {formatDate(report.last_report_at)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge status={report.status} />
                      </TableCell>
                      <TableCell>
                        <span className="text-slate-600">
                          {report.handler?.name || '-'}
                        </span>
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
  );
}
