import { createLazyFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import {
  MapPin,
  Search,
  Plus,
  Edit3,
  Trash2,
  Zap,
  Network,
  AlertTriangle,
  Eye,
  Gauge,
} from 'lucide-react';
import {
  PageHeader,
  TagBadge,
  DataTable,
  Pagination,
  StatCard,
  Modal,
  EmptyState,
  ProgressBar,
} from '../../components/ui';
import {
  formatNumber,
  formatDate,
  formatDateTime,
  alertLevelColors,
  alertLevelLabels,
  meterStatusColors,
  meterStatusLabels,
  buildQuery,
} from '../../lib/utils';
import { endpoints } from '../../lib/api';
import { toast } from '../../store/app';

export const Route = createLazyFileRoute('/config/zones')({
  component: ZoneConfigPage,
});

function ZoneConfigPage() {
  const navigate = useNavigate();
  const search: any = Route.useSearch();
  const [keyword, setKeyword] = useState(search.keyword || '');
  const [page, setPage] = useState(Number(search.page || 1));
  const [pageSize, setPageSize] = useState(Number(search.pageSize || 20));
  const [data, setData] = useState<any>(null);
  const [zonesAll, setZonesAll] = useState<any[]>([]);
  const [editModal, setEditModal] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [detail, setDetail] = useState<any>(null);

  const load = () => {
    const params: any = { page, pageSize };
    if (keyword) params.keyword = keyword;
    navigate({ to: '/config/zones', search: params, replace: true });
    endpoints.zones
      .list(params)
      .then((r) => setData(r))
      .catch((e) => toast('error', e.message));
  };

  useEffect(() => {
    endpoints.zones.listAll().then(setZonesAll);
  }, []);

  useEffect(() => {
    load();
  }, [page, pageSize]);

  const openEdit = (r?: any) => {
    setEditModal(r ? { ...r } : { isNew: true });
    setForm(r || { name: '', capacity: 0, description: '' });
  };

  const handleSave = () => {
    if (!form.name) return toast('error', '请输入分区名称');
    const fn = editModal?.isNew
      ? endpoints.zones.create
      : (d: any) => endpoints.zones.update(editModal.id, d);
    fn(form)
      .then(() => {
        toast('success', editModal?.isNew ? '已创建' : '已更新');
        setEditModal(null);
        load();
        endpoints.zones.listAll().then(setZonesAll);
      })
      .catch((e) => toast('error', e.message));
  };

  const handleDelete = (id: string) => {
    if (!confirm('确认删除该分区？')) return;
    endpoints.zones
      .delete(id)
      .then(() => {
        toast('success', '已删除');
        load();
      })
      .catch((e) => toast('error', e.message));
  };

  const openDetail = (id: string) => {
    endpoints.zones
      .get(id)
      .then((d) => setDetail(d))
      .catch((e) => toast('error', e.message));
  };

  return (
    <div>
      <PageHeader
        title="分区管理"
        description="管理电站各分区信息，查看容量、设备、告警等概况"
        actions={
          <>
            <div className="relative w-56">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="input pl-9"
                placeholder="搜索分区名称..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (setPage(1), load())}
              />
            </div>
            <button className="btn-primary" onClick={() => openEdit()}>
              <Plus size={15} /> 新建分区
            </button>
          </>
        }
      />

      <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard
          label="分区总数"
          value={zonesAll.length || data?.total || 0}
          suffix="个"
          icon={MapPin}
          color="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600"
        />
        <StatCard
          label="总装机容量"
          value={formatNumber(zonesAll.reduce((s, z) => s + Number(z.capacity || 0), 0), 0)}
          suffix="kWp"
          icon={Zap}
          color="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(data?.data || []).map((z: any) => (
          <div
            key={z.id}
            className="card p-5 transition-shadow hover:shadow-md"
            onClick={() => openDetail(z.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                  <MapPin size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{z.name}</h3>
                  <p className="text-xs text-slate-500">
                    {formatDate(z.createdAt)} 创建
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  className="btn-ghost h-7 px-2 py-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    openEdit(z);
                  }}
                >
                  <Edit3 size={13} />
                </button>
                <button
                  className="btn-ghost h-7 px-2 py-1 text-danger-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(z.id);
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
            {z.description && (
              <p className="mt-3 text-sm text-slate-600 line-clamp-2">{z.description}</p>
            )}
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-slate-50 p-2">
                <div className="text-xs text-slate-500">装机容量</div>
                <div className="text-sm font-bold text-slate-800">
                  {formatNumber(z.capacity || z.stats?.capacity, 0)} kW
                </div>
              </div>
              <div className="rounded-lg bg-slate-50 p-2">
                <div className="text-xs text-slate-500">表计量</div>
                <div className="text-sm font-bold text-slate-800">
                  {z.stats?.meterCount || '-'}
                </div>
              </div>
              <div className="rounded-lg bg-slate-50 p-2">
                <div className="text-xs text-slate-500">活动告警</div>
                <div
                  className={`text-sm font-bold ${
                    (z.stats?.activeAlerts || 0) > 0 ? 'text-danger-700' : 'text-slate-800'
                  }`}
                >
                  {z.stats?.activeAlerts || 0}
                </div>
              </div>
            </div>
          </div>
        ))}
        {data?.data?.length === 0 && (
          <div className="md:col-span-2 xl:col-span-3">
            <EmptyState title="暂无分区数据" desc="点击右上角新建分区" icon={MapPin} />
          </div>
        )}
      </div>

      {data?.total > pageSize && (
        <div className="mt-6">
          <Pagination
            page={page}
            pageSize={pageSize}
            total={data.total}
            onChange={(p, ps) => {
              setPage(p);
              setPageSize(ps);
            }}
          />
        </div>
      )}

      <Modal
        open={!!detail}
        title="分区详情"
        onClose={() => setDetail(null)}
        width="max-w-3xl"
        footer={
          detail && (
            <div className="flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => setDetail(null)}>
                关闭
              </button>
              <button className="btn-primary" onClick={() => openEdit(detail)}>
                <Edit3 size={14} /> 编辑
              </button>
            </div>
          )
        }
      >
        {detail && (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-bold text-slate-900">{detail.name}</h3>
              <p className="text-sm text-slate-500">{detail.description || '暂无描述'}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <StatCard
                label="装机容量"
                value={formatNumber(detail.capacity || detail.stats?.capacity, 0)}
                suffix="kWp"
                icon={Zap}
              />
              <StatCard
                label="今日发电"
                value={formatNumber(detail.stats?.productionToday, 1)}
                suffix="kWh"
                icon={Gauge}
              />
              <StatCard
                label="设备数量"
                value={detail.stats?.deviceCount || 0}
                suffix="台"
                icon={Network}
              />
              <StatCard
                label="活动告警"
                value={detail.stats?.activeAlerts || 0}
                suffix="条"
                icon={AlertTriangle}
              />
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-xs text-slate-500">创建时间</div>
                <div className="mt-1 text-slate-800">{formatDateTime(detail.createdAt)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">更新时间</div>
                <div className="mt-1 text-slate-800">{formatDateTime(detail.updatedAt)}</div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!editModal}
        title={editModal?.isNew ? '新建分区' : '编辑分区'}
        onClose={() => setEditModal(null)}
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
        <div className="space-y-4">
          <div>
            <label className="label">分区名称 *</label>
            <input
              className="input"
              placeholder="例如：A区 - 屋顶阵列"
              value={form.name || ''}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="label">装机容量（kW）*</label>
            <input
              type="number"
              step="0.01"
              className="input"
              placeholder="500"
              value={form.capacity ?? ''}
              onChange={(e) => setForm({ ...form, capacity: e.target.value })}
            />
          </div>
          <div>
            <label className="label">分区描述</label>
            <textarea
              className="input min-h-[90px]"
              placeholder="描述分区位置、用途等..."
              value={form.description || ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
