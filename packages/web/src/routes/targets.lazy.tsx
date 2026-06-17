import { createLazyFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Target,
  TrendingUp,
  Calendar,
  Filter,
  Plus,
  Download,
  ChevronRight,
  Search,
  Zap,
  MapPin,
} from 'lucide-react';
import {
  PageHeader,
  TagBadge,
  DataTable,
  Pagination,
  ProgressBar,
  StatCard,
  Modal,
  EmptyState,
} from '../components/ui';
import { formatNumber, formatDate, formatDateTime, cn, dayjs } from '../lib/utils';
import { endpoints } from '../lib/api';
import { toast } from '../store/app';

export const Route = createLazyFileRoute('/targets')({
  component: TargetsPage,
});

const periodLabels: Record<string, string> = {
  daily: '每日',
  weekly: '每周',
  monthly: '每月',
  quarterly: '每季度',
  yearly: '每年',
};

const periodColors: Record<string, string> = {
  daily: 'bg-blue-100 text-blue-700',
  weekly: 'bg-purple-100 text-purple-700',
  monthly: 'bg-primary-100 text-primary-700',
  quarterly: 'bg-amber-100 text-amber-700',
  yearly: 'bg-rose-100 text-rose-700',
};

function TargetsPage() {
  const navigate = useNavigate();
  const search: any = Route.useSearch();
  const [keyword, setKeyword] = useState(search.keyword || '');
  const [zoneId, setZoneId] = useState(search.zoneId || '');
  const [period, setPeriod] = useState(search.period || '');
  const [page, setPage] = useState(Number(search.page || 1));
  const [pageSize, setPageSize] = useState(Number(search.pageSize || 10));
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [zones, setZones] = useState<any[]>([]);
  const [showFilter, setShowFilter] = useState(false);
  const [createModal, setCreateModal] = useState(false);
  const [form, setForm] = useState<any>({});

  const load = () => {
    setLoading(true);
    const params: any = { page, pageSize };
    if (keyword) params.keyword = keyword;
    if (zoneId) params.zoneId = zoneId;
    if (period) params.period = period;
    navigate({ to: '/targets', search: params, replace: true });
    endpoints.targets
      .list(params)
      .then((r) => setData(r))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    endpoints.zones.listAll().then(setZones);
  }, []);

  useEffect(() => {
    load();
  }, [page, pageSize]);

  const handleCreate = () => {
    if (!form.name || !form.period || !form.targetKwh || !form.startDate || !form.endDate) {
      return toast('error', '请填写必要字段');
    }
    endpoints.targets
      .create({
        ...form,
        baselineKwh: Number(form.baselineKwh) || Number(form.targetKwh) * 5,
      })
      .then(() => {
        toast('success', '目标已创建');
        setCreateModal(false);
        setForm({});
        load();
      })
      .catch((e) => toast('error', e.message));
  };

  const handleExport = () => {
    toast('info', '导出功能可通过节能目标详情页查看明细后导出');
  };

  const totalProgress = useMemo(() => {
    if (!data?.data) return { target: 0, saved: 0, pct: 0 };
    const target = data.data.reduce((s: number, r: any) => s + Number(r.targetKwh || 0), 0);
    const saved = data.data.reduce((s: number, r: any) => s + Number(r.savedKwh || 0), 0);
    return { target, saved, pct: target > 0 ? (saved / target) * 100 : 0 };
  }, [data]);

  return (
    <div>
      <PageHeader
        title="节能目标管理"
        description="设定节能目标并追踪执行进度，下钻查看每日明细"
        actions={
          <>
            <button className="btn-secondary" onClick={() => setShowFilter((s) => !s)}>
              <Filter size={15} /> 筛选
            </button>
            <button className="btn-secondary" onClick={handleExport}>
              <Download size={15} /> 导出
            </button>
            <button className="btn-primary" onClick={() => setCreateModal(true)}>
              <Plus size={15} /> 新建目标
            </button>
          </>
        }
      >
        {showFilter && (
          <div className="card p-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div>
                <label className="label">目标名称</label>
                <input
                  className="input"
                  placeholder="搜索目标名称..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
              </div>
              <div>
                <label className="label">适用分区</label>
                <select className="select" value={zoneId} onChange={(e) => setZoneId(e.target.value)}>
                  <option value="">全部</option>
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">统计周期</label>
                <select className="select" value={period} onChange={(e) => setPeriod(e.target.value)}>
                  <option value="">全部</option>
                  {Object.entries(periodLabels).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end gap-2">
                <button className="btn-primary flex-1" onClick={() => { setPage(1); load(); }}>
                  <Search size={14} /> 查询
                </button>
                <button
                  className="btn-secondary flex-1"
                  onClick={() => {
                    setKeyword(''); setZoneId(''); setPeriod(''); setPage(1);
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

      <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard
          label="目标总数"
          value={data?.total || 0}
          suffix="个"
          icon={Target}
          color="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600"
        />
        <StatCard
          label="目标节电量合计"
          value={formatNumber(totalProgress.target, 0)}
          suffix="kWh"
          icon={Zap}
          color="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600"
        />
        <StatCard
          label="实际已节能"
          value={formatNumber(totalProgress.saved, 0)}
          suffix="kWh"
          icon={TrendingUp}
          color="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"
        />
        <StatCard
          label="整体完成率"
          value={formatNumber(totalProgress.pct, 1)}
          suffix="%"
          color="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600"
          icon={Target}
        />
      </div>

      <div className="space-y-4">
        {loading && !data ? (
          <div className="card p-12 text-center text-slate-500">加载中...</div>
        ) : data?.data?.length === 0 ? (
          <EmptyState title="暂无节能目标" desc="点击右上角新建目标开始追踪节能进度" icon={Target} />
        ) : (
          data?.data?.map((t: any) => {
            const start = dayjs(t.startDate);
            const end = dayjs(t.endDate);
            const now = dayjs();
            const daysTotal = end.diff(start, 'day') + 1;
            const daysPassed = Math.min(daysTotal, Math.max(0, now.diff(start, 'day') + 1));
            const timeProgress = (daysPassed / daysTotal) * 100;
            return (
              <div
                key={t.id}
                onClick={() => navigate({ to: `/targets/$id`, params: { id: t.id } })}
                className="card cursor-pointer p-5 transition-shadow hover:shadow-md"
              >
                <div className="flex flex-wrap items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                    <Target size={22} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-slate-900">{t.name}</h3>
                      <TagBadge className={periodColors[t.period]}>
                        {periodLabels[t.period]}
                      </TagBadge>
                      <TagBadge className="bg-slate-100 text-slate-700">
                        <MapPin size={11} /> {t.zoneName || '全站'}
                      </TagBadge>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                      <span>
                        <Calendar size={12} className="mr-1 inline" />
                        {formatDate(t.startDate)} ~ {formatDate(t.endDate)}
                        （{daysPassed}/{daysTotal} 天）
                      </span>
                      <span>时间进度 {formatNumber(timeProgress, 0)}%</span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
                      <div>
                        <div className="text-xs text-slate-500">目标节电量</div>
                        <div className="mt-1 text-lg font-bold text-slate-900">
                          {formatNumber(t.targetKwh, 0)}
                          <span className="ml-1 text-xs font-normal text-slate-500">kWh</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">已完成节能</div>
                        <div className="mt-1 text-lg font-bold text-primary-700">
                          {formatNumber(t.savedKwh, 0)}
                          <span className="ml-1 text-xs font-normal text-slate-500">kWh</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">基准用电量</div>
                        <div className="mt-1 text-lg font-bold text-slate-700">
                          {formatNumber(t.baselineKwh, 0)}
                          <span className="ml-1 text-xs font-normal text-slate-500">kWh</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">已记录天数</div>
                        <div className="mt-1 text-lg font-bold text-slate-700">
                          {t.detailCount || t.completion || 0}
                          <span className="ml-1 text-xs font-normal text-slate-500">天</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      <div>
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="text-slate-600">节能目标完成度</span>
                          <span className="font-semibold text-slate-800">
                            {formatNumber(t.progress, 1)}%
                          </span>
                        </div>
                        <ProgressBar value={Number(t.progress || 0)} />
                      </div>
                      <div>
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="text-slate-600">时间进度 vs 目标进度</span>
                          <span
                            className={cn(
                              'font-semibold',
                              Number(t.progress || 0) >= timeProgress
                                ? 'text-primary-700'
                                : 'text-warning-700'
                            )}
                          >
                            {Number(t.progress || 0) >= timeProgress ? '进度超前' : '进度落后'}
                            {' '}
                            {formatNumber(
                              Math.abs(Number(t.progress || 0) - timeProgress),
                              1
                            )}
                            %
                          </span>
                        </div>
                        <div className="relative h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="absolute inset-y-0 left-0 bg-slate-300"
                            style={{ width: `${timeProgress}%` }}
                          />
                          <div
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary-400 to-primary-600 transition-all"
                            style={{ width: `${t.progress || 0}%`, opacity: 0.9 }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="hidden items-center self-center md:flex">
                    <span className="text-sm font-medium text-primary-700">下钻明细</span>
                    <ChevronRight size={18} className="text-primary-600" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {data?.total > pageSize && (
        <div className="mt-6">
          <Pagination
            page={page}
            pageSize={pageSize}
            total={data?.total || 0}
            onChange={(p, ps) => {
              setPage(p);
              setPageSize(ps);
            }}
          />
        </div>
      )}

      <Modal
        open={createModal}
        title="新建节能目标"
        onClose={() => setCreateModal(false)}
        footer={
          <div className="flex justify-end gap-2">
            <button className="btn-secondary" onClick={() => setCreateModal(false)}>
              取消
            </button>
            <button className="btn-primary" onClick={handleCreate}>
              创建
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="label">目标名称 *</label>
            <input
              className="input"
              placeholder="例如：A区Q3节能目标"
              value={form.name || ''}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="label">适用分区</label>
            <select
              className="select"
              value={form.zoneId || ''}
              onChange={(e) => setForm({ ...form, zoneId: e.target.value || undefined })}
            >
              <option value="">全站</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">统计周期 *</label>
            <select
              className="select"
              value={form.period || ''}
              onChange={(e) => setForm({ ...form, period: e.target.value })}
            >
              <option value="">请选择</option>
              {Object.entries(periodLabels).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">开始日期 *</label>
            <input
              type="date"
              className="input"
              value={form.startDate ? String(form.startDate).slice(0, 10) : ''}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />
          </div>
          <div>
            <label className="label">结束日期 *</label>
            <input
              type="date"
              className="input"
              value={form.endDate ? String(form.endDate).slice(0, 10) : ''}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            />
          </div>
          <div>
            <label className="label">目标节电量（kWh）*</label>
            <input
              type="number"
              className="input"
              placeholder="15000"
              value={form.targetKwh || ''}
              onChange={(e) => setForm({ ...form, targetKwh: e.target.value })}
            />
          </div>
          <div>
            <label className="label">基准用电量（kWh）</label>
            <input
              type="number"
              className="input"
              placeholder="默认=目标×5"
              value={form.baselineKwh || ''}
              onChange={(e) => setForm({ ...form, baselineKwh: e.target.value })}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
