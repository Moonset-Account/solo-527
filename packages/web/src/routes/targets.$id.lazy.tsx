import { createLazyFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Target,
  TrendingUp,
  Calendar,
  Download,
  Filter,
  MapPin,
  Search,
  BarChart3,
} from 'lucide-react';
import {
  PageHeader,
  ProgressBar,
  TagBadge,
  DataTable,
  Pagination,
  StatCard,
  EmptyState,
} from '../components/ui';
import {
  formatNumber,
  formatDate,
  formatDateTime,
  dayjs,
  buildQuery,
} from '../lib/utils';
import { endpoints } from '../lib/api';
import { toast } from '../store/app';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
} from 'recharts';

export const Route = createLazyFileRoute('/targets/$id')({
  component: TargetDetailPage,
});

function TargetDetailPage() {
  const navigate = useNavigate();
  const { id } = Route.useParams();
  const search: any = Route.useSearch();
  const [target, setTarget] = useState<any>(null);
  const [trend, setTrend] = useState<any>({ daily: [], cumulative: [] });
  const [details, setDetails] = useState<any>(null);
  const [from, setFrom] = useState(search.from || '');
  const [to, setTo] = useState(search.to || '');
  const [page, setPage] = useState(Number(search.page || 1));
  const [pageSize, setPageSize] = useState(Number(search.pageSize || 30));

  useEffect(() => {
    endpoints.targets.get(id).then(setTarget).catch((e: any) => toast('error', e.message));
    endpoints.targets.trend(id).then(setTrend).catch(() => {});
  }, [id]);

  const loadDetails = () => {
    const params: any = { page, pageSize };
    if (from) params.from = from;
    if (to) params.to = to;
    endpoints.targets
      .details(id, params)
      .then(setDetails)
      .catch((e: any) => toast('error', e.message));
    navigate({
      to: '/targets/$id',
      params: { id },
      search: { ...params },
      replace: true,
    });
  };

  useEffect(() => {
    loadDetails();
  }, [id, page, pageSize]);

  const chartData = useMemo(() => {
    return (trend.daily || []).map((d: any, i: number) => ({
      ...d,
      cumulativeSaved: trend.cumulative?.[i]?.cumulativeSaved || 0,
    }));
  }, [trend]);

  if (!target) {
    return (
      <div className="card p-16 text-center text-slate-500">
        <div className="animate-pulse">加载目标信息中...</div>
      </div>
    );
  }

  const totalTarget = Number(target.targetKwh || 0);
  const totalSaved = Number(target.savedKwh || 0);
  const remaining = Math.max(0, totalTarget - totalSaved);
  const start = dayjs(target.startDate);
  const end = dayjs(target.endDate);
  const daysTotal = end.diff(start, 'day') + 1;
  const daysPassed = Math.min(daysTotal, Math.max(0, dayjs().diff(start, 'day') + 1));
  const daysRemaining = Math.max(0, daysTotal - daysPassed);
  const dailyTarget = totalTarget / daysTotal;
  const savedPerDay = daysPassed > 0 ? totalSaved / daysPassed : 0;
  const needPerDay = daysRemaining > 0 ? remaining / daysRemaining : 0;

  const handleExport = () => {
    const params: any = {};
    if (from) params.from = from;
    if (to) params.to = to;
    const header = [
      ['节能目标', target.name],
      ['适用范围', target.zoneName || '全站'],
      ['统计周期', `${formatDate(target.startDate)} ~ ${formatDate(target.endDate)}`],
      ['目标节电量', formatNumber(totalTarget) + ' kWh'],
      ['筛选日期范围', from || '全部', '至', to || '全部'],
      ['总记录数', details?.total || 0],
      [],
      ['日期', '实际用电(kWh)', '基准用电(kWh)', '节电量(kWh)'],
    ];
    const rows = (details?.data || []).map((d: any) => [
      formatDate(d.date),
      formatNumber(d.actualKwh),
      formatNumber(d.baselineKwh),
      formatNumber(d.savedKwh),
    ]);
    const csv = '\ufeff' + [...header, ...rows].map((r: any[]) => r.map((c: any) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `target_${id}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast('success', '导出成功');
  };

  return (
    <div>
      <PageHeader
        title={target.name}
        description={`${target.zoneName || '全站'} | ${formatDate(target.startDate)} ~ ${formatDate(target.endDate)}`}
        actions={
          <>
            <button className="btn-secondary" onClick={() => navigate({ to: '/targets' })}>
              <ArrowLeft size={15} /> 返回列表
            </button>
            <button className="btn-primary" onClick={handleExport}>
              <Download size={15} /> 导出明细
            </button>
          </>
        }
      >
        <div className="card p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="label">开始日期</label>
              <input
                type="date"
                className="input w-48"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>
            <div>
              <label className="label">结束日期</label>
              <input
                type="date"
                className="input w-48"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button
                className="btn-primary"
                onClick={() => {
                  setPage(1);
                  setTimeout(loadDetails, 0);
                }}
              >
                <Search size={14} /> 查询
              </button>
              <button
                className="btn-secondary"
                onClick={() => {
                  setFrom('');
                  setTo('');
                  setPage(1);
                  setTimeout(loadDetails, 0);
                }}
              >
                重置
              </button>
            </div>
          </div>
        </div>
      </PageHeader>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="目标节电量"
          value={formatNumber(totalTarget, 0)}
          suffix="kWh"
          icon={Target}
          color="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600"
        />
        <StatCard
          label="实际已节能"
          value={formatNumber(totalSaved, 0)}
          suffix="kWh"
          icon={TrendingUp}
          color="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"
          trend={{
            value: Number((((savedPerDay - dailyTarget) / dailyTarget) * 100).toFixed(1)),
            label: '对比日均目标',
          }}
        />
        <StatCard
          label="剩余节能目标"
          value={formatNumber(remaining, 0)}
          suffix="kWh"
          icon={BarChart3}
          color="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600"
        />
        <StatCard
          label="当前日均节能"
          value={formatNumber(savedPerDay, 0)}
          suffix="kWh/天"
          icon={Target}
          color="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600"
        />
        <StatCard
          label="剩余日均需完成"
          value={formatNumber(needPerDay, 0)}
          suffix="kWh/天"
          icon={Calendar}
          color={
            needPerDay > savedPerDay * 1.3
              ? 'flex h-11 w-11 items-center justify-center rounded-xl bg-danger-50 text-danger-600'
              : 'flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600'
          }
        />
      </div>

      <div className="mb-5 rounded-2xl border border-slate-200 bg-gradient-to-r from-primary-50 via-white to-amber-50 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm">
              <Target size={28} className="text-primary-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">节能目标完成度</h3>
                <TagBadge className="bg-primary-100 text-primary-700 text-sm px-2.5 py-0.5">
                  {formatNumber(target.progress, 1)}%
                </TagBadge>
              </div>
              <p className="mt-1 text-sm text-slate-600">
                已执行 {daysPassed}/{daysTotal} 天 · 剩余 {daysRemaining} 天 ·
                {' '}
                {needPerDay > savedPerDay
                  ? `需每日增加 ${formatNumber(needPerDay - savedPerDay, 0)} kWh 节能才能达标`
                  : '进度良好，保持当前节奏即可完成目标'}
              </p>
            </div>
          </div>
          <div className="w-64 text-right">
            <div className="text-xs text-slate-500 mb-1">目标进度</div>
            <ProgressBar value={Number(target.progress || 0)} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="card p-5">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-slate-900">每日节能 vs 基准用电</h3>
            <p className="text-xs text-slate-500">实际用电、基准用电、节电量趋势</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="baselineKwh"
                  name="基准用电 (kWh)"
                  stackId="1"
                  stroke="#cbd5e1"
                  fill="#e2e8f0"
                />
                <Area
                  type="monotone"
                  dataKey="actualKwh"
                  name="实际用电 (kWh)"
                  stackId="2"
                  stroke="#3b82f6"
                  fill="#93c5fd"
                />
                <Line
                  type="monotone"
                  dataKey="savedKwh"
                  name="节电量 (kWh)"
                  stroke="#16a34a"
                  strokeWidth={2}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-slate-900">累计节能进度</h3>
            <p className="text-xs text-slate-500">节电量累计达成情况与目标线对比</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer>
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} />
                <Legend />
                <Bar
                  dataKey="cumulativeSaved"
                  name="累计节能 (kWh)"
                  fill="#16a34a"
                  radius={[4, 4, 0, 0]}
                  opacity={0.8}
                />
                <Line
                  type="monotone"
                  dataKey={() => totalTarget}
                  name={`目标线 (${formatNumber(totalTarget, 0)}kWh)`}
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {details?.summary && (
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-5">
          <StatCard label="筛选范围累计节能" value={formatNumber(details.summary.totalSaved, 0)} suffix="kWh" />
          <StatCard label="累计基准用电" value={formatNumber(details.summary.totalBaseline, 0)} suffix="kWh" />
          <StatCard label="累计实际用电" value={formatNumber(details.summary.totalActual, 0)} suffix="kWh" />
          <StatCard label="日均节能" value={formatNumber(details.summary.avgSavedPerDay, 0)} suffix="kWh" />
          <StatCard
            label="综合节能率"
            value={formatNumber(details.summary.savingRate, 2)}
            suffix="%"
            color="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600"
            icon={TrendingUp}
          />
        </div>
      )}

      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">节能明细（下钻数据）</h3>
          <span className="text-sm text-slate-500">共 {details?.total || 0} 条记录</span>
        </div>
        <DataTable
          columns={[
            {
              key: 'date',
              label: '日期',
              width: '120px',
              render: (r: any) => (
                <span className="font-medium text-slate-800">{formatDate(r.date)}</span>
              ),
            },
            {
              key: 'zoneName',
              label: '分区',
              width: '120px',
              render: (r: any) =>
                r.zoneName ? (
                  <TagBadge className="bg-slate-100 text-slate-700">
                    <MapPin size={11} /> {r.zoneName}
                  </TagBadge>
                ) : (
                  <span className="text-slate-400">全站</span>
                ),
            },
            {
              key: 'baselineKwh',
              label: '基准用电',
              width: '130px',
              render: (r: any) => (
                <span className="text-slate-700">
                  {formatNumber(r.baselineKwh, 2)}
                  <span className="ml-0.5 text-xs text-slate-400">kWh</span>
                </span>
              ),
            },
            {
              key: 'actualKwh',
              label: '实际用电',
              width: '130px',
              render: (r: any) => (
                <span className="text-slate-700">
                  {formatNumber(r.actualKwh, 2)}
                  <span className="ml-0.5 text-xs text-slate-400">kWh</span>
                </span>
              ),
            },
            {
              key: 'savedKwh',
              label: '节电量',
              width: '140px',
              render: (r: any) => (
                <span
                  className={
                    Number(r.savedKwh) >= 0
                      ? 'font-semibold text-primary-700'
                      : 'font-semibold text-danger-700'
                  }
                >
                  {Number(r.savedKwh) >= 0 ? '+' : ''}
                  {formatNumber(r.savedKwh, 2)}
                  <span className="ml-0.5 text-xs font-normal opacity-70">kWh</span>
                </span>
              ),
            },
            {
              key: 'rate',
              label: '当日节能率',
              width: '160px',
              render: (r: any) => {
                const rate =
                  Number(r.baselineKwh) > 0
                    ? (Number(r.savedKwh) / Number(r.baselineKwh)) * 100
                    : 0;
                return (
                  <div className="flex items-center gap-2">
                    <div className="w-20">
                      <ProgressBar value={Math.max(0, rate)} />
                    </div>
                    <span
                      className={
                        rate >= 0 ? 'text-xs font-semibold text-primary-700' : 'text-xs font-semibold text-danger-700'
                      }
                    >
                      {formatNumber(rate, 1)}%
                    </span>
                  </div>
                );
              },
            },
          ]}
          data={details?.data || []}
          rowKey="id"
          emptyText="当前范围内暂无节能明细记录"
          footer={
            <Pagination
              page={page}
              pageSize={pageSize}
              total={details?.total || 0}
              onChange={(p, ps) => {
                setPage(p);
                setPageSize(ps);
              }}
            />
          }
        />
      </div>
    </div>
  );
}
