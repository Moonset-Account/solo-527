import { createLazyFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import {
  Zap,
  Search,
  Filter,
  Plus,
  Edit3,
  Trash2,
  Wifi,
  WifiOff,
  Network,
  Eye,
  MapPin,
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
  meterStatusColors,
  meterStatusLabels,
  timeAgo,
  buildQuery,
  cn,
} from '../../lib/utils';
import { endpoints } from '../../lib/api';
import { toast } from '../../store/app';

export const Route = createLazyFileRoute('/config/meters')({
  component: MeterConfigPage,
});

function MeterConfigPage() {
  const navigate = useNavigate();
  const search: any = Route.useSearch();
  const [keyword, setKeyword] = useState(search.keyword || '');
  const [zoneId, setZoneId] = useState(search.zoneId || '');
  const [status, setStatus] = useState(search.status || '');
  const [page, setPage] = useState(Number(search.page || 1));
  const [pageSize, setPageSize] = useState(Number(search.pageSize || 20));
  const [data, setData] = useState<any>(null);
  const [zones, setZones] = useState<any[]>([]);
  const [showFilter, setShowFilter] = useState(false);
  const [editModal, setEditModal] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [detail, setDetail] = useState<any>(null);

  const load = () => {
    const params: any = { page, pageSize };
    if (keyword) params.keyword = keyword;
    if (zoneId) params.zoneId = zoneId;
    if (status) params.status = status;
    navigate({ to: '/config/meters', search: params, replace: true });
    endpoints.meters
      .list(params)
      .then((r) => setData(r))
      .catch((e) => toast('error', e.message));
  };

  useEffect(() => {
    endpoints.zones.listAll().then(setZones);
  }, []);

  useEffect(() => {
    load();
  }, [page, pageSize]);

  const openEdit = (r?: any) => {
    setEditModal(r ? { ...r } : { isNew: true });
    setForm(
      r || {
        name: '',
        model: '',
        serialNumber: '',
        zoneId: zones[0]?.id,
        status: 'online',
        installedAt: new Date().toISOString().slice(0, 10),
      }
    );
  };

  const handleSave = () => {
    if (!form.name || !form.zoneId) return toast('error', '请填写必要字段');
    const fn = editModal?.isNew
      ? endpoints.meters.create
      : (d: any) => endpoints.meters.update(editModal.id, d);
    fn(form)
      .then(() => {
        toast('success', editModal?.isNew ? '已创建' : '已更新');
        setEditModal(null);
        load();
      })
      .catch((e) => toast('error', e.message));
  };

  const handleDelete = (id: string) => {
    if (!confirm('确认删除该表计？')) return;
    endpoints.meters
      .delete(id)
      .then(() => {
        toast('success', '已删除');
        load();
      })
      .catch((e) => toast('error', e.message));
  };

  const openDetail = (id: string) => {
    endpoints.meters
      .get(id)
      .then((d) => setDetail(d))
      .catch((e) => toast('error', e.message));
  };

  const statusCounts = {
    online: data?.data?.filter((m: any) => m.status === 'online').length || 0,
    offline: data?.data?.filter((m: any) => m.status === 'offline').length || 0,
    maintenance: data?.data?.filter((m: any) => m.status === 'maintenance').length || 0,
  };

  return (
    <div>
      <PageHeader
        title="表计管理"
        description="管理电站各表计的接入信息、运行状态与心跳数据"
        actions={
          <>
            <button className="btn-secondary" onClick={() => setShowFilter((s) => !s)}>
              <Filter size={15} /> 筛选
            </button>
            <button className="btn-primary" onClick={() => openEdit()}>
              <Plus size={15} /> 接入表计
            </button>
          </>
        }
      >
        {showFilter && (
          <div className="card p-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div>
                <label className="label">表计名称/序列号</label>
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
                <label className="label">状态</label>
                <select
                  className="select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="">全部</option>
                  {Object.entries(meterStatusLabels).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
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
                    setKeyword('');
                    setZoneId('');
                    setStatus('');
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

      <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard
          label="表计总数"
          value={data?.total || 0}
          suffix="台"
          icon={Network}
          color="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600"
        />
        <StatCard
          label="在线表计"
          value={statusCounts.online}
          suffix="台"
          icon={Wifi}
          color="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600"
        />
        <StatCard
          label="离线表计"
          value={statusCounts.offline}
          suffix="台"
          icon={WifiOff}
          color="flex h-11 w-11 items-center justify-center rounded-xl bg-danger-50 text-danger-600"
        />
        <StatCard
          label="维护中"
          value={statusCounts.maintenance}
          suffix="台"
          icon={Zap}
          color="flex h-11 w-11 items-center justify-center rounded-xl bg-warning-50 text-warning-600"
        />
      </div>

      <DataTable
        columns={[
          {
            key: 'status',
            label: '状态',
            width: '80px',
            render: (r) => (
              <TagBadge className={meterStatusColors[r.status]}>
                {r.status === 'online' ? <Wifi size={11} /> : r.status === 'offline' ? <WifiOff size={11} /> : <Zap size={11} />}
                {meterStatusLabels[r.status]}
              </TagBadge>
            ),
          },
          {
            key: 'name',
            label: '表计信息',
            render: (r) => (
              <div>
                <div className="font-medium text-slate-800">{r.name}</div>
                <div className="text-xs text-slate-500">
                  型号: {r.model} · SN: {r.serialNumber}
                </div>
              </div>
            ),
          },
          {
            key: 'zoneName',
            label: '所属分区',
            width: '180px',
            render: (r) => (
              <span className="flex items-center gap-1 text-sm text-slate-700">
                <MapPin size={12} />
                {r.zoneName}
              </span>
            ),
          },
          {
            key: 'lastHeartbeat',
            label: '最后心跳',
            width: '150px',
            render: (r) => (
              <div className="text-xs">
                <div className="text-slate-700">{r.lastHeartbeat ? timeAgo(r.lastHeartbeat) : '-'}</div>
                <div className="text-slate-500">
                  {r.lastHeartbeat ? formatDateTime(r.lastHeartbeat) : ''}
                </div>
              </div>
            ),
          },
          {
            key: 'installedAt',
            label: '安装时间',
            width: '130px',
            render: (r) => <span className="text-sm text-slate-600">{formatDate(r.installedAt)}</span>,
          },
          {
            key: 'action',
            label: '操作',
            width: '140px',
            render: (r) => (
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
        title="表计详情"
        onClose={() => setDetail(null)}
        width="max-w-2xl"
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
            <div className="flex items-center gap-4">
              <TagBadge className={cn('px-3 py-1', meterStatusColors[detail.status])}>
                {meterStatusLabels[detail.status]}
              </TagBadge>
              <h3 className="text-lg font-bold text-slate-900">{detail.name}</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="rounded-lg bg-slate-50 p-3">
                <div className="text-xs text-slate-500">分区</div>
                <div className="mt-1 font-medium text-slate-800">{detail.zoneName}</div>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <div className="text-xs text-slate-500">型号</div>
                <div className="mt-1 font-medium text-slate-800">{detail.model || '-'}</div>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <div className="text-xs text-slate-500">序列号</div>
                <div className="mt-1 font-medium text-slate-800">{detail.serialNumber || '-'}</div>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <div className="text-xs text-slate-500">最后心跳</div>
                <div className="mt-1 font-medium text-slate-800">
                  {detail.lastHeartbeat ? timeAgo(detail.lastHeartbeat) : '-'}
                </div>
              </div>
            </div>
            <div>
              <div className="mb-2 text-sm font-semibold text-slate-800">今日数据概览</div>
              <div className="grid grid-cols-3 gap-4">
                <StatCard label="发电量" value={formatNumber(detail.todayStats?.production, 1)} suffix="kWh" />
                <StatCard label="用电量" value={formatNumber(detail.todayStats?.consumption, 1)} suffix="kWh" />
                <StatCard
                  label="平均效率"
                  value={formatNumber(detail.todayStats?.efficiency, 2)}
                  suffix="%"
                />
              </div>
            </div>
            <div>
              <div className="mb-2 text-sm font-semibold text-slate-800">
                关联设备（{detail.devices?.length || 0}）
              </div>
              {detail.devices?.length === 0 ? (
                <EmptyState title="暂无关联设备" />
              ) : (
                <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                  {detail.devices.slice(0, 9).map((d: any) => (
                    <div key={d.id} className="rounded-lg border border-slate-200 p-2 text-sm">
                      <div className="font-medium text-slate-800">{d.name}</div>
                      <div className="text-xs text-slate-500">{d.model}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!editModal}
        title={editModal?.isNew ? '接入新表计' : '编辑表计'}
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="label">表计名称 *</label>
            <input
              className="input"
              placeholder="A区表计1号"
              value={form.name || ''}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="label">所属分区 *</label>
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
            <label className="label">型号</label>
            <input
              className="input"
              placeholder="Sungrow-MT100"
              value={form.model || ''}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
            />
          </div>
          <div>
            <label className="label">序列号</label>
            <input
              className="input"
              placeholder="MTR-XXXX-001"
              value={form.serialNumber || ''}
              onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
            />
          </div>
          <div>
            <label className="label">运行状态</label>
            <select
              className="select"
              value={form.status || 'online'}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              {Object.entries(meterStatusLabels).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">安装时间</label>
            <input
              type="date"
              className="input"
              value={form.installedAt ? String(form.installedAt).slice(0, 10) : ''}
              onChange={(e) => setForm({ ...form, installedAt: e.target.value })}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
