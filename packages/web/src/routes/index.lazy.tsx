import { createLazyFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import {
  Sun,
  Zap,
  DollarSign,
  AlertTriangle,
  Target,
  Network,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { endpoints } from '../lib/api';
import { StatCard, PageHeader, TagBadge, DataTable, ProgressBar } from '../components/ui';
import {
  formatNumber,
  alertLevelColors,
  alertLevelLabels,
  alertStatusColors,
  alertStatusLabels,
  meterStatusLabels,
  meterStatusColors,
  formatDateTime,
  timeAgo,
} from '../lib/utils';
import { Link } from '@tanstack/react-router';

export const Route = createLazyFileRoute('/')({
  component: Dashboard,
});

const ALERT_COLORS: Record<string, string> = {
  critical: '#dc2626',
  warning: '#f59e0b',
  info: '#16a34a',
};

function Dashboard() {
  const [summary, setSummary] = useState<any>(null);
  const [zoneStats, setZoneStats] = useState<any[]>([]);
  const [trend, setTrend] = useState<any[]>([]);
  const [alertSum, setAlertSum] = useState<any>(null);

  useEffect(() => {
    endpoints.summary().then(setSummary);
    endpoints.zoneStats().then(setZoneStats);
    endpoints.energyTrend({ days: 7 }).then(setTrend);
    endpoints.alertSummary().then(setAlertSum);
  }, []);

  const levelData = alertSum?.levels
    ? Object.entries(alertSum.levels).map(([k, v]) => ({
        name: alertLevelLabels[k] || k,
        value: v as number,
        key: k,
      }))
    : [];

  return (
    <div>
      <PageHeader
        title="光伏电站能耗看板"
        description="实时监控全站发电、能耗与告警状态"
        actions={
          <>
            <select className="select h-9 py-1.5 pr-8 text-sm">
              <option>今日</option>
              <option>本周</option>
              <option>本月</option>
              <option>本季度</option>
            </select>
            <Link to="/alerts" className="btn-secondary h-9">
              <AlertTriangle size={15} /> 查看告警
            </Link>
            <Link to="/export" className="btn-primary h-9 hidden" search={(prev) => prev}>
              导出报表
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <StatCard
          label="总装机容量"
          value={formatNumber(summary?.totalCapacity || 0, 0)}
          suffix="kWp"
          icon={Sun}
          color="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600"
        />
        <StatCard
          label="今日发电量"
          value={formatNumber(summary?.todayProduction || 0, 1)}
          suffix="kWh"
          icon={Zap}
          color="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600"
          trend={{ value: 12.3 }}
        />
        <StatCard
          label="今日用电量"
          value={formatNumber(summary?.todayConsumption || 0, 1)}
          suffix="kWh"
          icon={BarChart3}
          color="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600"
        />
        <StatCard
          label="累计补贴金额"
          value={formatNumber(summary?.monthlySubsidy || 0, 2)}
          suffix="元"
          icon={DollarSign}
          color="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"
          trend={{ value: 8.1 }}
        />
        <StatCard
          label="活动告警"
          value={summary?.activeAlerts || 0}
          suffix="条"
          icon={AlertTriangle}
          color="flex h-11 w-11 items-center justify-center rounded-xl bg-danger-50 text-danger-600"
        />
        <StatCard
          label="节能目标完成"
          value={summary?.targetProgress || 0}
          suffix="%"
          icon={Target}
          color="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="card p-5 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">发用电趋势（近7天）</h3>
              <p className="text-xs text-slate-500">发电量 vs 用电量 vs 上/下网电量</p>
            </div>
            <div className="flex gap-2 text-xs">
              <span className="badge bg-primary-100 text-primary-700">
                <span className="mr-1 inline-block h-2 w-2 rounded-full bg-primary-500" />
                发电
              </span>
              <span className="badge bg-blue-100 text-blue-700">
                <span className="mr-1 inline-block h-2 w-2 rounded-full bg-blue-500" />
                用电
              </span>
              <span className="badge bg-amber-100 text-amber-700">
                <span className="mr-1 inline-block h-2 w-2 rounded-full bg-amber-500" />
                上网
              </span>
              <span className="badge bg-rose-100 text-rose-700">
                <span className="mr-1 inline-block h-2 w-2 rounded-full bg-rose-500" />
                购电
              </span>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer>
              <LineChart data={trend} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} />
                <Line
                  type="monotone"
                  dataKey="production"
                  name="发电量"
                  stroke="#16a34a"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="consumption"
                  name="用电量"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="gridExport"
                  name="上网电量"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={false}
                  strokeDasharray="4 4"
                />
                <Line
                  type="monotone"
                  dataKey="gridImport"
                  name="购电量"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  dot={false}
                  strokeDasharray="4 4"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-slate-900">告警等级分布</h3>
            <p className="text-xs text-slate-500">当前告警按等级统计</p>
          </div>
          <div className="h-52">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={levelData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {levelData.map((entry) => (
                    <Cell key={entry.key} fill={ALERT_COLORS[entry.key]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
            {levelData.map((d) => (
              <div key={d.key} className="flex items-center justify-between">
                <span className="text-sm text-slate-600">{d.name}</span>
                <span className="flex items-center gap-2">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ background: ALERT_COLORS[d.key] }}
                  />
                  <span className="text-sm font-semibold text-slate-900">{d.value} 条</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">分区发电概览</h3>
              <p className="text-xs text-slate-500">各分区今日发电与告警情况</p>
            </div>
            <Link to="/config/zones" className="text-xs font-medium text-primary-700 hover:underline">
              管理分区 →
            </Link>
          </div>
          <div className="space-y-4">
            {zoneStats.map((z) => (
              <div key={z.zoneId} className="rounded-lg border border-slate-100 p-4 hover:bg-slate-50">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-slate-900">{z.zoneName}</h4>
                      {z.activeAlerts > 0 && (
                        <TagBadge className="bg-danger-100 text-danger-700">
                          <AlertTriangle size={11} />
                          {z.activeAlerts}
                        </TagBadge>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                      <span>
                        <Network size={11} className="mr-1 inline" />
                        表计 {z.meterCount} | 设备 {z.deviceCount}
                      </span>
                      <span>
                        <Zap size={11} className="mr-1 inline" />
                        容量 {formatNumber(z.capacity, 0)} kW
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary-700">
                      {formatNumber(z.productionToday, 1)}
                      <span className="ml-1 text-xs font-normal text-slate-500">kWh</span>
                    </div>
                    <div className="text-xs text-slate-500">
                      本月 {formatNumber(z.productionMonth, 0)} kWh
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                    <span>平均转换效率</span>
                    <span className="font-medium text-slate-700">{z.avgEfficiency}%</span>
                  </div>
                  <ProgressBar value={z.avgEfficiency} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900">最近告警</h3>
              <p className="text-xs text-slate-500">最新10条告警，按等级和时间排序</p>
            </div>
            <Link to="/alerts" className="text-xs font-medium text-primary-700 hover:underline">
              全部告警 →
            </Link>
          </div>
          <DataTable
            columns={[
              {
                key: 'level',
                label: '等级',
                width: '80px',
                render: (r) => (
                  <TagBadge className={alertLevelColors[r.level]}>
                    {alertLevelLabels[r.level]}
                  </TagBadge>
                ),
              },
              {
                key: 'title',
                label: '告警内容',
                render: (r) => (
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-slate-800">{r.title}</div>
                    <div className="truncate text-xs text-slate-500">
                      {r.zoneName} · {r.deviceName}
                    </div>
                  </div>
                ),
              },
              {
                key: 'status',
                label: '状态',
                width: '80px',
                render: (r) => (
                  <TagBadge className={alertStatusColors[r.status]}>
                    {alertStatusLabels[r.status]}
                  </TagBadge>
                ),
              },
              {
                key: 'createdAt',
                label: '时间',
                width: '100px',
                render: (r) => (
                  <div className="text-xs">
                    <div className="text-slate-700">{timeAgo(r.createdAt)}</div>
                  </div>
                ),
              },
            ]}
            data={alertSum?.recent?.slice(0, 10) || []}
            rowKey="id"
            onRowClick={(r) => {
              window.location.href = `/alerts?id=${r.id}`;
            }}
          />
        </div>
      </div>

      <div className="mt-6">
        <div className="card p-5">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-slate-900">分区间发电对比（本周）</h3>
            <p className="text-xs text-slate-500">各分区发电量柱状对比</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={zoneStats} margin={{ top: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="zoneName" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} />
                <Legend />
                <Bar dataKey="productionToday" name="今日发电 (kWh)" fill="#16a34a" radius={[4, 4, 0, 0]} />
                <Bar dataKey="avgEfficiency" name="效率 (%)" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
