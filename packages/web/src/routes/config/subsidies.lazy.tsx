import { createLazyFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import {
  DollarSign,
  Search,
  Filter,
  Download,
  Plus,
  TrendingUp,
  Calendar,
  MapPin,
  User,
  Edit3,
  Trash2,
  CheckCircle2,
  Eye,
  AlertTriangle,
  Clock,
  Zap,
} from 'lucide-react';
import {
  PageHeader,
  TagBadge,
  DataTable,
  Pagination,
  StatCard,
  Modal,
  EmptyState,
} from '../../components/ui';
import {
  formatNumber,
  formatDate,
  formatDateTime,
  subsidyStatusColors,
  subsidyStatusLabels,
  dayjs,
  buildQuery,
} from '../../lib/utils';
import { endpoints } from '../../lib/api';
import { toast } from '../../store/app';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  ComposedChart,
  Area,
  AreaChart,
} from 'recharts';

export const Route = createLazyFileRoute('/config/subsidies')({
  component: SubsidyConfigPage,
});

function SubsidyConfigPage() {
  const navigate = useNavigate();
  const search: any = Route.useSearch();
  const [zoneId, setZoneId] = useState(search.zoneId || '');
  const [status, setStatus] = useState(search.status || '');
  const [year, setYear] = useState(search.year || '');
  const [page, setPage] = useState(Number(search.page || 1));
  const [pageSize, setPageSize] = useState(Number(search.pageSize || 20));
  const [data, setData] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [zones, setZones] = useState<any[]>([]);
  const [showFilter, setShowFilter] = useState(false);
  const [detail, setDetail] = useState<any>(null);
  const [editModal, setEditModal] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [energyTrend, setEnergyTrend] = useState<any[]>([]);

  const load = () => {
    const params: any = { page, pageSize };
    if (zoneId) params.zoneId = zoneId;
    if (status) params.status = status;
    if (year) params.year = year;
    navigate({ to: '/config/subsidies', search: params, replace: true });
    endpoints.subsidies
      .list(params)
      .then((r) => setData(r))
      .catch((e) => toast('error', e.message));
  };

  useEffect(() => {
    endpoints.zones.listAll().then(setZones);
    endpoints.subsidies.summary().then(setSummary);
    endpoints.energyTrend({ days: 30 }).then(setEnergyTrend);
  }, []);

  useEffect(() => {
    load();
  }, [page, pageSize]);

  const byZoneChart = useMemo(
    () =>
      (summary?.byZone || []).map((z: any) => ({
        name: z.zoneName.split(' - ')[0].slice(0, 6),
        fullName: z.zoneName,
        补贴金额: Number(z.totalAmount || 0),
        发电量: Number((z.totalKwh / 1000).toFixed(1)),
      })),
    [summary]
  );

  const openDetail = (id: string) => {
    endpoints.subsidies
      .get(id)
      .then((d) => setDetail(d))
      .catch((e) => toast('error', e.message));
  };

  const openEdit = (r?: any) => {
    setEditModal(r ? { ...r } : { isNew: true });
    setForm(
      r
        ? { ...r }
        : {
            periodStart: dayjs().startOf('month').format('YYYY-MM-DD'),
            periodEnd: dayjs().endOf('month').format('YYYY-MM-DD'),
            subsidyRate: 0.42,
          }
    );
  };

  const handleSave = () => {
    if (!form.zoneId || !form.periodStart || !form.periodEnd) {
      return toast('error', '请填写必要字段');
    }
    const pay = {
      ...form,
      productionKwh: Number(form.productionKwh || 0),
      subsidyRate: Number(form.subsidyRate || 0.42),
      subsidyAmount:
        Number(form.subsidyAmount) || Number(form.productionKwh || 0) * Number(form.subsidyRate || 0.42),
    };
    const fn = editModal?.isNew ? endpoints.subsidies.create : (d: any) =>
      endpoints.subsidies.update(editModal.id, d);
    fn(pay)
      .then(() => {
        toast('success', editModal?.isNew ? '已创建' : '已更新');
        setEditModal(null);
        load();
        endpoints.subsidies.summary().then(setSummary);
      })
      .catch((e) => toast('error', e.message));
  };

  const handleApprove = (id: string) => {
    endpoints.subsidies
      .approve(id)
      .then(() => {
        toast('success', '已审批');
        load();
        endpoints.subsidies.summary().then(setSummary);
        openDetail(id);
      })
      .catch((e) => toast('error', e.message));
  };

  const handleDelete = (id: string) => {
    if (!confirm('确认删除该补贴记录？')) return;
    endpoints.subsidies
      .delete(id)
      .then(() => {
        toast('success', '已删除');
        load();
        endpoints.subsidies.summary().then(setSummary);
      })
      .catch((e) => toast('error', e.message));
  };

  const handleExport = () => {
    const params: any = {};
    if (zoneId) params.zoneId = zoneId;
    if (status) params.status = status;
    window.location.href = endpoints.exportUrl.subsidies(params);
  };

  return (
    <div>
      <PageHeader
        title="补贴记录配置"
        description="管理光伏补贴周期记录、能耗曲线对照、审批状态追踪，记录每笔修改操作人"
        actions={
          <>
            <button className="btn-secondary" onClick={() => setShowFilter((s) => !s)}>
              <Filter size={15} /> 筛选
            </button>
            <button className="btn-secondary" onClick={handleExport}>
              <Download size={15} /> 导出
            </button>
            <button className="btn-primary" onClick={() => openEdit()}>
              <Plus size={15} /> 新建补贴记录
            </button>
          </>
        }
      >
        {showFilter && (
          <div className="card p-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
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
                <label className="label">状态</label>
                <select
                  className="select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="">全部</option>
                  {Object.entries(subsidyStatusLabels).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">年份</label>
                <select
                  className="select"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                >
                  <option value="">全部</option>
                  {Array.from({ length: 5 }).map((_, i) => {
                    const y = new Date().getFullYear() - i;
                    return (
                      <option key={y} value={y}>
                        {y} 年
                      </option>
                    );
                  })}
                </select>
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
                    setZoneId('');
                    setStatus('');
                    setYear('');
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

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="累计补贴总额"
          value={formatNumber(summary?.totalAmount || 0, 2)}
          suffix="元"
          icon={DollarSign}
          color="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"
        />
        <StatCard
          label="待审核金额"
          value={formatNumber(summary?.byStatus?.pending || 0, 2)}
          suffix="元"
          icon={Clock}
          color="flex h-11 w-11 items-center justify-center rounded-xl bg-warning-50 text-warning-600"
        />
        <StatCard
          label="已审批金额"
          value={formatNumber((summary?.byStatus?.approved || 0) + (summary?.byStatus?.paid || 0), 2)}
          suffix="元"
          icon={CheckCircle2}
          color="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600"
        />
        <StatCard
          label="累计发电量"
          value={formatNumber(
            byZoneChart.reduce((s: number, r: any) => s + (r.发电量 * 1000 || 0), 0),
            0
          )}
          suffix="kWh"
          icon={Zap}
          color="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600"
        />
        <StatCard
          label="记录总数"
          value={data?.total || 0}
          suffix="条"
          icon={Calendar}
          color="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600"
        />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="card p-5">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-slate-900">分区间补贴与发电量对比</h3>
            <p className="text-xs text-slate-500">各分区累计补贴金额和发电量对比</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer>
              <ComposedChart data={byZoneChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis yAxisId="left" stroke="#94a3b8" fontSize={11} />
                <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" fontSize={11} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} />
                <Legend />
                <Bar yAxisId="left" dataKey="补贴金额" name="补贴(元)" fill="#16a34a" radius={[4, 4, 0, 0]} />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="发电量"
                  name="发电量(MWh)"
                  stroke="#f59e0b"
                  strokeWidth={2}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-slate-900">近12月补贴趋势</h3>
            <p className="text-xs text-slate-500">月度补贴金额与发电量</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={summary?.last12Months || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} />
                <Legend />
                <Bar dataKey="amount" name="补贴金额(元)" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
                <Bar dataKey="production" name="发电量(kWh)" fill="#06b6d4" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mb-5 card p-5">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-slate-900">能耗曲线（近30天）</h3>
          <p className="text-xs text-slate-500">补贴记录与实际能耗数据对照</p>
        </div>
        <div className="h-56">
          <ResponsiveContainer>
            <AreaChart data={energyTrend}>
              <defs>
                <linearGradient id="prodGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} />
              <Legend />
              <Area
                type="monotone"
                dataKey="production"
                name="发电量(kWh)"
                stroke="#16a34a"
                fill="url(#prodGrad)"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="consumption"
                name="用电量(kWh)"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">补贴记录列表</h3>
        <span className="text-sm text-slate-500">共 {data?.total || 0} 条</span>
      </div>
      <DataTable
        columns={[
          {
            key: 'zoneName',
            label: '分区',
            width: '180px',
            render: (r: any) => (
              <div>
                <div className="flex items-center gap-1 text-sm font-medium text-slate-800">
                  <MapPin size={12} />
                  {r.zoneName}
                </div>
              </div>
            ),
          },
          {
            key: 'period',
            label: '补贴周期',
            width: '180px',
            render: (r: any) => (
              <div>
                <div className="flex items-center gap-1 text-sm text-slate-800">
                  <Calendar size={12} />
                  {formatDate(r.periodStart)}
                </div>
                <div className="ml-5 text-xs text-slate-500">至 {formatDate(r.periodEnd)}</div>
              </div>
            ),
          },
          {
            key: 'productionKwh',
            label: '发电量 / 单价',
            width: '170px',
            render: (r: any) => (
              <div className="text-sm">
                <div className="text-slate-800">
                  {formatNumber(r.productionKwh, 1)}
                  <span className="ml-0.5 text-xs text-slate-400">kWh</span>
                </div>
                <div className="text-xs text-slate-500">× {formatNumber(r.subsidyRate, 4)} 元</div>
              </div>
            ),
          },
          {
            key: 'subsidyAmount',
            label: '补贴金额',
            width: '130px',
            render: (r: any) => (
              <div className="text-base font-bold text-primary-700">
                ¥{formatNumber(r.subsidyAmount, 2)}
              </div>
            ),
          },
          {
            key: 'status',
            label: '状态',
            width: '90px',
            render: (r: any) => (
              <TagBadge className={subsidyStatusColors[r.status]}>
                {subsidyStatusLabels[r.status]}
              </TagBadge>
            ),
          },
          {
            key: 'approvedBy',
            label: '审批人 / 修改人',
            width: '130px',
            render: (r: any) => (
              <div className="text-xs">
                <div className="flex items-center gap-1 text-slate-700">
                  <User size={11} />
                  {r.approvedByName || '-'}
                </div>
                <div className="ml-4 mt-0.5 text-slate-500">
                  改: {r.updatedByName || '-'}
                </div>
              </div>
            ),
          },
          {
            key: 'updatedAt',
            label: '更新时间',
            width: '150px',
            render: (r: any) => (
              <div className="text-xs text-slate-600">
                <div>创建 {formatDate(r.createdAt)}</div>
                <div className="mt-0.5">修改 {formatDateTime(r.updatedAt)}</div>
              </div>
            ),
          },
          {
            key: 'action',
            label: '操作',
            width: '180px',
            render: (r: any) => (
              <div className="flex items-center gap-1">
                <button
                  className="btn-ghost h-7 px-2 py-1 text-primary-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    openDetail(r.id);
                  }}
                >
                  <Eye size={13} />
                </button>
                <button
                  className="btn-ghost h-7 px-2 py-1 text-slate-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    openEdit(r);
                  }}
                >
                  <Edit3 size={13} />
                </button>
                {r.status === 'pending' && (
                  <button
                    className="btn-ghost h-7 px-2 py-1 text-primary-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApprove(r.id);
                    }}
                    title="审批"
                  >
                    <CheckCircle2 size={13} />
                  </button>
                )}
                <button
                  className="btn-ghost h-7 px-2 py-1 text-danger-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(r.id);
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ),
          },
        ]}
        data={data?.data || []}
        rowKey="id"
        onRowClick={(r: any) => openDetail(r.id)}
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
        title="补贴记录详情"
        onClose={() => setDetail(null)}
        width="max-w-3xl"
        footer={
          detail && (
            <div className="flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => setDetail(null)}>
                关闭
              </button>
              {detail.status === 'pending' && (
                <button className="btn-primary" onClick={() => handleApprove(detail.id)}>
                  <CheckCircle2 size={14} /> 审批通过
                </button>
              )}
              <button className="btn-secondary" onClick={() => openEdit(detail)}>
                <Edit3 size={14} /> 编辑
              </button>
            </div>
          )
        }
      >
        {detail && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                <DollarSign size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900">{detail.zoneName}</h3>
                  <TagBadge className={subsidyStatusColors[detail.status]}>
                    {subsidyStatusLabels[detail.status]}
                  </TagBadge>
                </div>
                <p className="text-sm text-slate-500">
                  {formatDate(detail.periodStart)} ~ {formatDate(detail.periodEnd)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="rounded-xl bg-gradient-to-br from-primary-50 to-white p-4">
                <div className="text-xs text-slate-500">发电量</div>
                <div className="mt-1 text-xl font-bold text-slate-900">
                  {formatNumber(detail.productionKwh, 1)}
                  <span className="ml-1 text-xs font-normal text-slate-500">kWh</span>
                </div>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-amber-50 to-white p-4">
                <div className="text-xs text-slate-500">补贴单价</div>
                <div className="mt-1 text-xl font-bold text-slate-900">
                  ¥{formatNumber(detail.subsidyRate, 4)}
                </div>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-white p-4 col-span-2">
                <div className="text-xs text-slate-500">补贴金额合计</div>
                <div className="mt-1 text-2xl font-bold text-primary-700">
                  ¥{formatNumber(detail.subsidyAmount, 2)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 text-sm">
              <div>
                <div className="text-xs text-slate-500">创建时间</div>
                <div className="mt-1 text-slate-800">{formatDateTime(detail.createdAt)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">审批人</div>
                <div className="mt-1 text-slate-800">{detail.approvedByName || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">审批时间</div>
                <div className="mt-1 text-slate-800">
                  {detail.approvedAt ? formatDateTime(detail.approvedAt) : '-'}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">最后修改人</div>
                <div className="mt-1 text-slate-800">{detail.updatedByName || '-'}</div>
              </div>
            </div>

            {detail.remark && (
              <div>
                <div className="mb-1.5 text-sm font-semibold text-slate-800">备注说明</div>
                <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                  {detail.remark}
                </div>
              </div>
            )}

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" />
                <div className="text-xs text-amber-800">
                  <div className="font-semibold">操作审计说明</div>
                  <div className="mt-1">
                    本记录由 <b>{detail.updatedByName || '系统'}</b> 于{' '}
                    {formatDateTime(detail.updatedAt)} 最后修改。所有修改操作已记录到审计日志，包含修改前后完整对比数据。
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!editModal}
        title={editModal?.isNew ? '新建补贴记录' : '编辑补贴记录'}
        onClose={() => setEditModal(null)}
        width="max-w-2xl"
        footer={
          <div className="flex justify-end gap-2">
            <button className="btn-secondary" onClick={() => setEditModal(null)}>
              取消
            </button>
            <button className="btn-primary" onClick={handleSave}>
              保存
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="label">适用分区 *</label>
            <select
              className="select"
              value={form.zoneId || ''}
              onChange={(e) => setForm({ ...form, zoneId: e.target.value })}
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
            <label className="label">状态</label>
            <select
              className="select"
              value={form.status || 'pending'}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              {Object.entries(subsidyStatusLabels).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">周期开始 *</label>
            <input
              type="date"
              className="input"
              value={form.periodStart ? String(form.periodStart).slice(0, 10) : ''}
              onChange={(e) => setForm({ ...form, periodStart: e.target.value })}
            />
          </div>
          <div>
            <label className="label">周期结束 *</label>
            <input
              type="date"
              className="input"
              value={form.periodEnd ? String(form.periodEnd).slice(0, 10) : ''}
              onChange={(e) => setForm({ ...form, periodEnd: e.target.value })}
            />
          </div>
          <div>
            <label className="label">发电量（kWh）*</label>
            <input
              type="number"
              step="0.01"
              className="input"
              value={form.productionKwh ?? ''}
              onChange={(e) =>
                setForm({
                  ...form,
                  productionKwh: e.target.value,
                  subsidyAmount:
                    Number(e.target.value || 0) * Number(form.subsidyRate || 0.42),
                })
              }
            />
          </div>
          <div>
            <label className="label">补贴单价（元/kWh）</label>
            <input
              type="number"
              step="0.0001"
              className="input"
              value={form.subsidyRate ?? ''}
              onChange={(e) =>
                setForm({
                  ...form,
                  subsidyRate: e.target.value,
                  subsidyAmount: Number(form.productionKwh || 0) * Number(e.target.value || 0),
                })
              }
            />
          </div>
          <div className="md:col-span-2">
            <label className="label">补贴金额（元）（自动计算）</label>
            <input
              type="number"
              step="0.01"
              className="input font-bold text-primary-700"
              value={form.subsidyAmount ?? ''}
              onChange={(e) => setForm({ ...form, subsidyAmount: e.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <label className="label">备注说明</label>
            <textarea
              className="input min-h-[70px]"
              placeholder="可填写审批说明、特殊情况等..."
              value={form.remark || ''}
              onChange={(e) => setForm({ ...form, remark: e.target.value })}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
