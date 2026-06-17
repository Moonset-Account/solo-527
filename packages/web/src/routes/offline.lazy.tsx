import { createLazyFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Network,
  WifiOff,
  Wifi,
  Search,
  Filter,
  Download,
  Plus,
  User,
  Clock,
  Clock3,
  CheckCircle2,
  AlertCircle,
  Wrench,
  Database,
  Eye,
} from 'lucide-react';
import {
  PageHeader,
  TagBadge,
  DataTable,
  Pagination,
  StatCard,
  Modal,
  EmptyState,
} from '../components/ui';
import {
  formatNumber,
  formatDateTime,
  offlineReasonColors,
  offlineReasonLabels,
  meterStatusLabels,
  meterStatusColors,
  timeAgo,
  cn,
  dayjs,
} from '../lib/utils';
import { endpoints } from '../lib/api';
import { toast } from '../store/app';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

export const Route = createLazyFileRoute('/offline')({
  component: OfflinePage,
});

const CAT_COLORS: Record<string, string> = {
  network: '#a855f7',
  power: '#f59e0b',
  hardware: '#dc2626',
  software: '#3b82f6',
  maintenance: '#f59e0b',
  unknown: '#94a3b8',
};

function OfflinePage() {
  const navigate = useNavigate();
  const search: any = Route.useSearch();
  const [keyword, setKeyword] = useState(search.keyword || '');
  const [zoneId, setZoneId] = useState(search.zoneId || '');
  const [reasonCategory, setReasonCategory] = useState(search.reasonCategory || '');
  const [status, setStatus] = useState(search.status || '');
  const [assignee, setAssignee] = useState(search.assignee || '');
  const [from, setFrom] = useState(search.from || '');
  const [to, setTo] = useState(search.to || '');
  const [page, setPage] = useState(Number(search.page || 1));
  const [pageSize, setPageSize] = useState(Number(search.pageSize || 20));
  const [data, setData] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [zones, setZones] = useState<any[]>([]);
  const [showFilter, setShowFilter] = useState(false);
  const [detail, setDetail] = useState<any>(null);
  const [createModal, setCreateModal] = useState(false);
  const [actionModal, setActionModal] = useState<{ type: string; data: any } | null>(null);
  const [form, setForm] = useState<any>({});
  const [actionForm, setActionForm] = useState<any>({});

  const load = () => {
    const params: any = { page, pageSize };
    if (keyword) params.keyword = keyword;
    if (zoneId) params.zoneId = zoneId;
    if (reasonCategory) params.reasonCategory = reasonCategory;
    if (status) params.status = status;
    if (assignee) params.assignee = assignee;
    if (from) params.from = from;
    if (to) params.to = to;
    navigate({ to: '/offline', search: params, replace: true });
    endpoints.offline
      .list(params)
      .then((r) => setData(r))
      .catch((e) => toast('error', e.message));
  };

  useEffect(() => {
    endpoints.zones.listAll().then(setZones);
    endpoints.offline.summary().then(setSummary);
  }, []);

  useEffect(() => {
    load();
  }, [page, pageSize]);

  const categoryChart = useMemo(() => {
    if (!summary?.categories) return [];
    return Object.entries(summary.categories).map(([k, v]) => ({
      name: offlineReasonLabels[k] || k,
      value: v as number,
      key: k,
    }));
  }, [summary]);

  const assigneeChart = useMemo(() => {
    if (!summary?.assignees) return [];
    return Object.entries(summary.assignees).map(([k, v]) => ({
      name: k,
      处理次数: v as number,
    }));
  }, [summary]);

  const openDetail = (id: string) => {
    endpoints.offline
      .get(id)
      .then((d) => setDetail(d))
      .catch((e) => toast('error', e.message));
  };

  const handleCreate = () => {
    if (!form.meterId || !form.reason || !form.reasonCategory) {
      return toast('error', '请填写必要字段');
    }
    endpoints.offline
      .create({ ...form, zoneId: zones.find((z) => z.id === form.zoneId)?.id })
      .then(() => {
        toast('success', '离线记录已创建');
        setCreateModal(false);
        setForm({});
        load();
        endpoints.offline.summary().then(setSummary);
      })
      .catch((e) => toast('error', e.message));
  };

  const handleAction = (type: string) => {
    if (!actionModal) return;
    const fn = (endpoints.offline as any)[type];
    fn(actionModal.data.id, actionForm)
      .then(() => {
        toast('success', type === 'acknowledge' ? '已确认' : '已恢复');
        setActionModal(null);
        setActionForm({});
        load();
        endpoints.offline.summary().then(setSummary);
        openDetail(actionModal.data.id);
      })
      .catch((e) => toast('error', e.message));
  };

  const handleExport = () => {
    const params: any = {};
    Object.entries({ zoneId, reasonCategory, status }).forEach(([k, v]) => {
      if (v) params[k] = v;
    });
    window.location.href = endpoints.exportUrl.offline(params);
  };

  const openMeters = () => navigate({ to: '/config/meters' });

  return (
    <div>
      <PageHeader
        title="表计离线管理"
        description="记录表计离线原因、分析响应时长、追踪责任人"
        actions={
          <>
            <button className="btn-secondary" onClick={() => setShowFilter((s) => !s)}>
              <Filter size={15} /> 筛选
            </button>
            <button className="btn-secondary" onClick={openMeters}>
              <Network size={15} /> 表计管理
            </button>
            <button className="btn-secondary" onClick={handleExport}>
              <Download size={15} /> 导出
            </button>
            <button className="btn-primary" onClick={() => setCreateModal(true)}>
              <Plus size={15} /> 登记离线
            </button>
          </>
        }
      >
        {showFilter && (
          <div className="card p-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="label">搜索原因/说明</label>
                <input
                  className="input"
                  placeholder="关键字..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
              </div>
              <div>
                <label className="label">分区</label>
                <select
                  className="select"
                  value={zoneId}
                  onChange={(e) => setZoneId(e.target.value)}
                >
                  <option value="">全部</option>
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">原因分类</label>
                <select
                  className="select"
                  value={reasonCategory}
                  onChange={(e) => setReasonCategory(e.target.value)}
                >
                  <option value="">全部</option>
                  {Object.entries(offlineReasonLabels).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">记录状态</label>
                <select
                  className="select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="">全部</option>
                  <option value="open">离线中</option>
                  <option value="resolved">已恢复</option>
                </select>
              </div>
              <div>
                <label className="label">责任人</label>
                <input
                  className="input"
                  placeholder="责任人姓名"
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                />
              </div>
              <div>
                <label className="label">开始日期</label>
                <input
                  type="date"
                  className="input"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </div>
              <div>
                <label className="label">结束日期</label>
                <input
                  type="date"
                  className="input"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                />
              </div>
              <div className="flex items-end gap-2">
                <button
                  className="btn-primary flex-1"
                  onClick={() => {
                    setPage(1);
                    load();
                  }}
                >
                  <Search size={14} /> 查询
                </button>
                <button
                  className="btn-secondary flex-1"
                  onClick={() => {
                    setKeyword('');
                    setZoneId('');
                    setReasonCategory('');
                    setStatus('');
                    setAssignee('');
                    setFrom('');
                    setTo('');
                    setPage(1);
                    setTimeout(load, 0);
                  }}
                >
                  重置
                </button>
              </div>
            </div>
          </div>
        )}
      </PageHeader>

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-6">
        <StatCard
          label="离线记录总数"
          value={summary?.total || 0}
          suffix="次"
          icon={WifiOff}
          color="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600"
        />
        <StatCard
          label="离线中表计"
          value={summary?.open || 0}
          suffix="台"
          icon={AlertCircle}
          color="flex h-11 w-11 items-center justify-center rounded-xl bg-danger-50 text-danger-600"
        />
        <StatCard
          label="已恢复"
          value={summary?.resolved || 0}
          suffix="次"
          icon={CheckCircle2}
          color="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600"
        />
        <StatCard
          label="累计离线时长"
          value={formatNumber(summary?.totalDurationHours || 0, 1)}
          suffix="小时"
          icon={Clock}
          color="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600"
        />
        <StatCard
          label="平均持续时间"
          value={summary?.avgDurationMinutes || 0}
          suffix="分钟"
          icon={Clock3}
          color="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600"
        />
        <StatCard
          label="平均响应时长"
          value={summary?.avgResponseMinutes || 0}
          suffix="分钟"
          icon={Wrench}
          color="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600"
        />
      </div>

      <div className="mb-5 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="card p-5 xl:col-span-2">
          <h3 className="mb-4 text-base font-semibold text-slate-900">责任人处理统计</h3>
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={assigneeChart} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={80} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} />
                <Bar
                  dataKey="处理次数"
                  fill="#3b82f6"
                  radius={[0, 4, 4, 0]}
                  label={{ position: 'right', fill: '#64748b', fontSize: 11 }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card p-5">
          <h3 className="mb-4 text-base font-semibold text-slate-900">离线原因分布</h3>
          <div className="h-48">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={categoryChart}
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {categoryChart.map((c) => (
                    <Cell key={c.key} fill={CAT_COLORS[c.key]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {summary?.openRecords?.length > 0 && (
        <div className="mb-5 overflow-hidden rounded-xl border border-danger-200 bg-danger-50">
          <div className="flex items-center gap-2 border-b border-danger-200 bg-danger-100/50 px-4 py-3">
            <WifiOff size={17} className="text-danger-700" />
            <h3 className="text-sm font-semibold text-danger-800">
              当前离线中的表计（{summary.openRecords.length}）
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2 lg:grid-cols-3">
            {summary.openRecords.map((r: any) => (
              <div
                key={r.id}
                onClick={() => openDetail(r.id)}
                className="cursor-pointer rounded-lg border border-danger-200 bg-white p-3 transition-all hover:shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <WifiOff size={15} className="text-danger-600" />
                    <span className="font-semibold text-slate-800">{r.meterName}</span>
                  </div>
                  <TagBadge className="bg-danger-100 text-danger-700">离线中</TagBadge>
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  {r.zoneName} · 离线 {timeAgo(r.offlineAt)}
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-slate-600">
                    <User size={11} /> {r.assignee || '未指派'}
                  </span>
                  <span className="flex items-center gap-1 text-slate-600">
                    <Clock size={11} /> 响应 {r.responseMinutes || '-'} 分钟
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <DataTable
        columns={[
          {
            key: 'status',
            label: '状态',
            width: '80px',
            render: (r) =>
              r.onlineAt ? (
                <TagBadge className="bg-primary-100 text-primary-700">
                  <Wifi size={11} /> 已恢复
                </TagBadge>
              ) : (
                <TagBadge className="bg-danger-100 text-danger-700">
                  <WifiOff size={11} /> 离线
                </TagBadge>
              ),
          },
          {
            key: 'meterName',
            label: '表计 / 分区',
            width: '200px',
            render: (r) => (
              <div>
                <div className="font-medium text-slate-800">{r.meterName}</div>
                <div className="text-xs text-slate-500">
                  {r.zoneName} · SN:{r.serialNumber}
                </div>
              </div>
            ),
          },
          {
            key: 'reasonCategory',
            label: '原因分类',
            width: '100px',
            render: (r) => (
              <TagBadge className={offlineReasonColors[r.reasonCategory]}>
                {offlineReasonLabels[r.reasonCategory]}
              </TagBadge>
            ),
          },
          {
            key: 'reason',
            label: '具体原因',
            render: (r) => (
              <div className="text-sm text-slate-700 line-clamp-2">{r.reason}</div>
            ),
          },
          {
            key: 'times',
            label: '离线 / 恢复',
            width: '180px',
            render: (r) => (
              <div className="text-xs">
                <div className="text-slate-700">
                  <span className="text-slate-400">离:</span> {formatDateTime(r.offlineAt)}
                </div>
                <div className="text-slate-700">
                  <span className="text-slate-400">恢:</span>{' '}
                  {r.onlineAt ? formatDateTime(r.onlineAt) : '-'}
                </div>
              </div>
            ),
          },
          {
            key: 'duration',
            label: '持续/响应',
            width: '120px',
            render: (r) => (
              <div className="text-xs">
                <div className="flex items-center gap-1 text-slate-700">
                  <Clock size={11} />
                  {r.durationMinutes != null
                    ? r.durationMinutes >= 60
                      ? `${(r.durationMinutes / 60).toFixed(1)}h`
                      : `${r.durationMinutes}min`
                    : dayjs().diff(dayjs(r.offlineAt), 'minute') + 'min(进行中)'}
                </div>
                <div className="flex items-center gap-1 text-slate-500 mt-0.5">
                  <Clock3 size={11} />
                  响应: {r.responseMinutes != null ? `${r.responseMinutes}min` : '-'}
                </div>
              </div>
            ),
          },
          {
            key: 'assignee',
            label: '责任人',
            width: '90px',
            render: (r) => (
              <span className="flex items-center gap-1 text-sm text-slate-700">
                <User size={12} />
                {r.assignee || '-'}
              </span>
            ),
          },
          {
            key: 'action',
            label: '操作',
            width: '70px',
            render: (r) => (
              <button
                className="btn-ghost h-7 px-2 py-1 text-primary-700"
                onClick={(e) => {
                  e.stopPropagation();
                  openDetail(r.id);
                }}
              >
                <Eye size={14} /> 详情
              </button>
            ),
          },
        ]}
        data={data?.data || []}
        rowKey="id"
        onRowClick={(r) => openDetail(r.id)}
        footer={
          <Pagination
            page={page}
            pageSize={pageSize}
            total={data?.total || 0}
            onChange={(p, ps) => {
              setPage(p);
              setPageSize(ps);
            }}
          />
        }
      />

      <Modal
        open={!!detail}
        title="离线记录详情"
        onClose={() => setDetail(null)}
        width="max-w-2xl"
        footer={
          detail && (
            <div className="flex justify-end gap-2">
              {!detail.acknowledgedAt && (
                <button
                  className="btn-secondary"
                  onClick={() => setActionModal({ type: 'acknowledge', data: detail })}
                >
                  <CheckCircle2 size={14} /> 确认并指派
                </button>
              )}
              {!detail.onlineAt && (
                <button
                  className="btn-primary"
                  onClick={() => setActionModal({ type: 'resolve', data: detail })}
                >
                  <Wifi size={14} /> 标记恢复在线
                </button>
              )}
            </div>
          )
        }
      >
        {detail && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              {detail.onlineAt ? (
                <TagBadge className="bg-primary-100 text-primary-700 px-3 py-1">
                  <Wifi size={12} /> 已恢复在线
                </TagBadge>
              ) : (
                <TagBadge className="bg-danger-100 text-danger-700 px-3 py-1">
                  <WifiOff size={12} /> 离线中
                </TagBadge>
              )}
              <TagBadge className={cn('px-3 py-1', offlineReasonColors[detail.reasonCategory])}>
                {offlineReasonLabels[detail.reasonCategory]}
              </TagBadge>
              <h2 className="flex-1 text-lg font-semibold text-slate-900">{detail.meterName}</h2>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="rounded-lg bg-slate-50 p-3">
                <div className="text-xs text-slate-500">所属分区</div>
                <div className="mt-1 font-medium text-slate-800">{detail.zoneName}</div>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <div className="text-xs text-slate-500">表计型号</div>
                <div className="mt-1 font-medium text-slate-800">{detail.meterModel || '-'}</div>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <div className="text-xs text-slate-500">责任人</div>
                <div className="mt-1 font-medium text-slate-800">
                  {detail.assignee || '未指派'}
                </div>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <div className="text-xs text-slate-500">响应时长</div>
                <div className="mt-1 font-medium text-slate-800">
                  {detail.responseMinutes != null ? `${detail.responseMinutes} 分钟` : '-'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <div className="mb-1.5 text-sm font-semibold text-slate-800">离线原因</div>
                <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                  {detail.reason}
                </div>
              </div>
              <div>
                <div className="mb-1.5 text-sm font-semibold text-slate-800">处理/恢复说明</div>
                <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                  {detail.resolutionNote || '暂无'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 text-sm">
              <div>
                <div className="text-xs text-slate-500">离线时间</div>
                <div className="mt-1 text-slate-800">{formatDateTime(detail.offlineAt)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">确认时间</div>
                <div className="mt-1 text-slate-800">
                  {detail.acknowledgedAt ? formatDateTime(detail.acknowledgedAt) : '-'}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">恢复时间</div>
                <div className="mt-1 text-slate-800">
                  {detail.onlineAt ? formatDateTime(detail.onlineAt) : '-'}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">持续时间</div>
                <div className="mt-1 text-slate-800">
                  {detail.durationMinutes != null
                    ? detail.durationMinutes >= 60
                      ? `${(detail.durationMinutes / 60).toFixed(1)} 小时`
                      : `${detail.durationMinutes} 分钟`
                    : '进行中 ' + dayjs().diff(dayjs(detail.offlineAt), 'hour') + '小时'}
                </div>
              </div>
            </div>

            <div className="relative border-l-2 border-slate-200 pl-5 space-y-5">
              <div className="text-sm font-semibold text-slate-800">处理时间线</div>
              <div className="relative">
                <span className="absolute -left-[25px] top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-danger-500 shadow" />
                <div className="text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">系统</span> 检测到表计离线
                  <span className="ml-2">{formatDateTime(detail.offlineAt)}</span>
                </div>
                <div className="mt-1.5 rounded-lg bg-danger-50 p-2.5 text-sm text-danger-700">
                  原因分类：{offlineReasonLabels[detail.reasonCategory]} · {detail.reason}
                </div>
              </div>
              {detail.acknowledgedAt && (
                <div className="relative">
                  <span className="absolute -left-[25px] top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-warning-500 shadow" />
                  <div className="text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">{detail.assignee || '运维'}</span>{' '}
                    确认此事件
                    <span className="ml-2">{formatDateTime(detail.acknowledgedAt)}</span>
                  </div>
                  <div className="mt-1.5 rounded-lg bg-slate-50 p-2.5 text-sm text-slate-700">
                    响应耗时：{detail.responseMinutes} 分钟 · 已开始现场排查
                  </div>
                </div>
              )}
              {detail.resolvedAt && (
                <div className="relative">
                  <span className="absolute -left-[25px] top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-primary-500 shadow" />
                  <div className="text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">{detail.assignee || '运维'}</span>{' '}
                    处理完成，表计恢复在线
                    <span className="ml-2">{formatDateTime(detail.resolvedAt)}</span>
                  </div>
                  {detail.resolutionNote && (
                    <div className="mt-1.5 rounded-lg bg-primary-50 p-2.5 text-sm text-primary-800">
                      {detail.resolutionNote}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={createModal}
        title="登记离线记录"
        onClose={() => setCreateModal(false)}
        footer={
          <div className="flex justify-end gap-2">
            <button className="btn-secondary" onClick={() => setCreateModal(false)}>
              取消
            </button>
            <button className="btn-primary" onClick={handleCreate}>
              保存
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="label">分区 *</label>
            <select
              className="select"
              value={form.zoneId || ''}
              onChange={(e) => setForm({ ...form, zoneId: e.target.value, meterId: '' })}
            >
              <option value="">请选择</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">表计 *</label>
            <select
              className="select"
              value={form.meterId || ''}
              onChange={(e) => setForm({ ...form, meterId: e.target.value })}
            >
              <option value="">请选择</option>
              {zones
                .find((z) => z.id === form.zoneId)
                ?.meters?.map((m: any) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                )) ||
                (form.zoneId ? (
                  (() => {
                    const zMeters = [];
                    endpoints.meters
                      .listAll({ zoneId: form.zoneId })
                      .then((ms) => (form._meters = ms));
                    return null;
                  })()
                ) : null)}
            </select>
          </div>
          <div>
            <label className="label">离线时间</label>
            <input
              type="datetime-local"
              className="input"
              value={form.offlineAt || ''}
              onChange={(e) => setForm({ ...form, offlineAt: e.target.value })}
            />
          </div>
          <div>
            <label className="label">原因分类 *</label>
            <select
              className="select"
              value={form.reasonCategory || ''}
              onChange={(e) => setForm({ ...form, reasonCategory: e.target.value })}
            >
              <option value="">请选择</option>
              {Object.entries(offlineReasonLabels).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="label">具体原因 *</label>
            <textarea
              className="input min-h-[80px]"
              placeholder="详细描述离线原因"
              value={form.reason || ''}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
            />
          </div>
          <div>
            <label className="label">责任人</label>
            <input
              className="input"
              placeholder="李运维"
              value={form.assignee || ''}
              onChange={(e) => setForm({ ...form, assignee: e.target.value })}
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={!!actionModal}
        title={actionModal?.type === 'acknowledge' ? '确认离线事件' : '标记恢复在线'}
        onClose={() => setActionModal(null)}
        footer={
          <div className="flex justify-end gap-2">
            <button className="btn-secondary" onClick={() => setActionModal(null)}>
              取消
            </button>
            <button className="btn-primary" onClick={() => handleAction(actionModal?.type || '')}>
              确认
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {actionModal?.type === 'acknowledge' && (
            <div>
              <label className="label">责任人</label>
              <input
                className="input"
                placeholder="输入责任人姓名"
                value={actionForm.assignee || ''}
                onChange={(e) => setActionForm({ ...actionForm, assignee: e.target.value })}
              />
            </div>
          )}
          {actionModal?.type === 'resolve' && (
            <div>
              <label className="label">恢复时间</label>
              <input
                type="datetime-local"
                className="input"
                value={actionForm.onlineAt || ''}
                onChange={(e) => setActionForm({ ...actionForm, onlineAt: e.target.value })}
              />
            </div>
          )}
          <div>
            <label className="label">处理说明</label>
            <textarea
              className="input min-h-[90px]"
              placeholder={
                actionModal?.type === 'acknowledge'
                  ? '计划采取的处理措施...'
                  : '具体处理过程和结果...'
              }
              value={actionForm.resolutionNote || ''}
              onChange={(e) =>
                setActionForm({ ...actionForm, resolutionNote: e.target.value })
              }
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
