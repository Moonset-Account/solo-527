import { createLazyFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Search,
  Filter,
  Download,
  Clock,
  User,
  CheckCircle,
  XCircle,
  MessageSquare,
  ChevronDown,
  BookmarkPlus,
  BookmarkMinus,
  Save,
  Trash2,
  Eye,
} from 'lucide-react';
import {
  PageHeader,
  TagBadge,
  DataTable,
  Pagination,
  Modal,
  EmptyState,
  StatCard,
} from '../components/ui';
import {
  alertLevelColors,
  alertLevelLabels,
  alertStatusColors,
  alertStatusLabels,
  formatDateTime,
  timeAgo,
  cn,
  dayjs,
} from '../lib/utils';
import { endpoints } from '../lib/api';
import { toast } from '../store/app';

export const Route = createLazyFileRoute('/alerts')({
  component: AlertsPage,
});

const DEFAULT_FILTERS = {
  keyword: '',
  zoneId: '',
  level: '',
  status: '',
  assignee: '',
  from: '',
  to: '',
};

function AlertsPage() {
  const navigate = useNavigate();
  const search = Route.useSearch() as any;
  const [filters, setFilters] = useState<any>({ ...DEFAULT_FILTERS, ...search });
  const [page, setPage] = useState(Number(search.page || 1));
  const [pageSize, setPageSize] = useState(Number(search.pageSize || 20));
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [zones, setZones] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [detail, setDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [actionModal, setActionModal] = useState<{ type: string; data: any } | null>(null);
  const [noteText, setNoteText] = useState('');
  const [assigneeText, setAssigneeText] = useState('');
  const [savedFilters, setSavedFilters] = useState<any[]>([]);
  const [saveFilterModal, setSaveFilterModal] = useState(false);
  const [filterName, setFilterName] = useState('');

  const loadData = () => {
    setLoading(true);
    const params = { ...filters, page, pageSize };
    Object.keys(params).forEach((k) => {
      if (!params[k]) delete params[k];
    });
    navigate({ to: '/alerts', search: params, replace: true });
    endpoints.alerts
      .list(params)
      .then((r) => setData(r))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    endpoints.zones.listAll().then(setZones);
    endpoints.users().then(setUsers);
    endpoints.filters.list('alerts').then(setSavedFilters);
  }, []);

  useEffect(() => {
    loadData();
  }, [page, pageSize]);

  const activeCount = useMemo(() => {
    return Object.entries(filters).filter(([k, v]) => k !== 'keyword' && v).length +
      (filters.keyword ? 1 : 0);
  }, [filters]);

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
    setTimeout(loadData, 0);
  };

  const applyFilters = () => {
    setPage(1);
    setTimeout(loadData, 0);
  };

  const openDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      const d = await endpoints.alerts.get(id);
      setDetail(d);
    } catch (e: any) {
      toast('error', e.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const runAction = async (type: string) => {
    if (!detail) return;
    try {
      let data: any = {};
      if (type === 'resolve' || type === 'ignore') data = { note: noteText };
      if (type === 'assign') {
        if (!assigneeText.trim()) return toast('error', '请指定处理人');
        data = { assignee: assigneeText, note: noteText };
      }
      if (type === 'acknowledge') data = { note: noteText };
      if (type === 'comment') {
        if (!noteText.trim()) return toast('error', '请输入备注内容');
        data = { note: noteText };
      }
      const fn = (endpoints.alerts as any)[type];
      await fn(detail.id, data);
      toast('success', '操作成功');
      setActionModal(null);
      setNoteText('');
      setAssigneeText('');
      loadData();
      openDetail(detail.id);
    } catch (e: any) {
      toast('error', e.message);
    }
  };

  const handleExport = () => {
    const params: any = {};
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params[k] = v;
    });
    window.location.href = endpoints.exportUrl.alerts(params);
  };

  const handleSaveFilter = () => {
    if (!filterName.trim()) return toast('error', '请输入方案名称');
    endpoints.filters
      .create({ name: filterName, page: 'alerts', filters })
      .then((f) => {
        setSavedFilters([f, ...savedFilters]);
        setSaveFilterModal(false);
        setFilterName('');
        toast('success', '筛选方案已保存');
      })
      .catch((e) => toast('error', e.message));
  };

  const applySavedFilter = (f: any) => {
    setFilters({ ...DEFAULT_FILTERS, ...f.filters });
    setPage(1);
    setTimeout(loadData, 0);
  };

  const deleteSavedFilter = (id: string) => {
    endpoints.filters
      .delete(id)
      .then(() => {
        setSavedFilters(savedFilters.filter((f) => f.id !== id));
        toast('success', '已删除');
      })
      .catch((e) => toast('error', e.message));
  };

  return (
    <div>
      <PageHeader
        title="告警中心"
        description="设备告警的筛选、响应提醒和处理全流程追踪"
        actions={
          <>
            <button className="btn-secondary" onClick={() => setShowFilter((s) => !s)}>
              <Filter size={15} /> 筛选
              {activeCount > 0 && (
                <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary-600 px-1.5 text-[11px] font-bold text-white">
                  {activeCount}
                </span>
              )}
            </button>
            <div className="relative">
              <button className="btn-secondary">
                <Save size={15} /> 方案
                <ChevronDown size={14} />
              </button>
              {savedFilters.length > 0 && (
                <div className="absolute right-0 z-10 mt-1 w-64 rounded-lg border border-slate-200 bg-white shadow-lg">
                  <div className="max-h-64 overflow-auto p-1">
                    <div className="px-2 py-1.5 text-xs font-semibold text-slate-500">已保存方案</div>
                    {savedFilters.map((f) => (
                      <div
                        key={f.id}
                        className="flex items-center justify-between gap-2 rounded px-2 py-1.5 hover:bg-slate-50"
                      >
                        <button
                          onClick={() => applySavedFilter(f)}
                          className="flex-1 truncate text-left text-sm text-slate-700"
                        >
                          {f.name}
                        </button>
                        <button
                          onClick={() => deleteSavedFilter(f.id)}
                          className="text-slate-400 hover:text-danger-600"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-slate-200 p-2">
                    <button
                      onClick={() => setSaveFilterModal(true)}
                      className="w-full rounded-md px-2 py-1.5 text-sm text-primary-700 hover:bg-primary-50"
                    >
                      <BookmarkPlus size={13} className="mr-1 inline" /> 保存当前筛选
                    </button>
                  </div>
                </div>
              )}
            </div>
            <button className="btn-primary" onClick={handleExport}>
              <Download size={15} /> 导出CSV
            </button>
          </>
        }
      >
        {showFilter && (
          <div className="card p-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="label">关键字搜索</label>
                <input
                  className="input"
                  placeholder="告警标题、描述..."
                  value={filters.keyword}
                  onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                />
              </div>
              <div>
                <label className="label">所属分区</label>
                <select
                  className="select"
                  value={filters.zoneId}
                  onChange={(e) => setFilters({ ...filters, zoneId: e.target.value })}
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
                <label className="label">告警等级</label>
                <select
                  className="select"
                  value={filters.level}
                  onChange={(e) => setFilters({ ...filters, level: e.target.value })}
                >
                  <option value="">全部</option>
                  {['critical', 'warning', 'info'].map((l) => (
                    <option key={l} value={l}>
                      {alertLevelLabels[l]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">处理状态</label>
                <select
                  className="select"
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                >
                  <option value="">全部</option>
                  {['pending', 'processing', 'resolved', 'ignored'].map((s) => (
                    <option key={s} value={s}>
                      {alertStatusLabels[s]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">处理人</label>
                <input
                  className="input"
                  placeholder="处理人姓名..."
                  value={filters.assignee}
                  onChange={(e) => setFilters({ ...filters, assignee: e.target.value })}
                />
              </div>
              <div>
                <label className="label">开始日期</label>
                <input
                  type="date"
                  className="input"
                  value={filters.from}
                  onChange={(e) => setFilters({ ...filters, from: e.target.value })}
                />
              </div>
              <div>
                <label className="label">结束日期</label>
                <input
                  type="date"
                  className="input"
                  value={filters.to}
                  onChange={(e) => setFilters({ ...filters, to: e.target.value })}
                />
              </div>
              <div className="flex items-end gap-2">
                <button className="btn-primary flex-1" onClick={applyFilters}>
                  <Search size={14} /> 查询
                </button>
                <button className="btn-secondary flex-1" onClick={resetFilters}>
                  重置
                </button>
                <button className="btn-ghost" onClick={() => setSaveFilterModal(true)} title="保存筛选方案">
                  <BookmarkPlus size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </PageHeader>

      {data?.summary && (
        <div className="mb-5 grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-7">
          <StatCard label="筛选结果总数" value={data.summary.total} suffix="条" />
          <StatCard
            label="严重"
            value={data.summary.critical}
            suffix="条"
            color="flex h-9 w-9 items-center justify-center rounded-lg bg-danger-50 text-danger-600"
            icon={AlertTriangle}
          />
          <StatCard
            label="警告"
            value={data.summary.warning}
            suffix="条"
            color="flex h-9 w-9 items-center justify-center rounded-lg bg-warning-50 text-warning-600"
            icon={AlertTriangle}
          />
          <StatCard
            label="提示"
            value={data.summary.info}
            suffix="条"
            color="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600"
            icon={AlertTriangle}
          />
          <StatCard label="待处理" value={data.summary.pending} suffix="条" />
          <StatCard label="处理中" value={data.summary.processing} suffix="条" />
          <StatCard label="已解决" value={data.summary.resolved} suffix="条" />
        </div>
      )}

      <DataTable
        columns={[
          {
            key: 'level',
            label: '等级',
            width: '80px',
            render: (r: any) => (
              <TagBadge className={alertLevelColors[r.level]}>{alertLevelLabels[r.level]}</TagBadge>
            ),
          },
          {
            key: 'title',
            label: '告警标题',
            render: (r: any) => (
              <div className="min-w-0">
                <div className="truncate font-medium text-slate-800">{r.title}</div>
                <div className="truncate text-xs text-slate-500">{r.description}</div>
              </div>
            ),
          },
          {
            key: 'zoneName',
            label: '分区 / 设备',
            width: '180px',
            render: (r: any) => (
              <div className="text-sm">
                <div className="text-slate-700">{r.zoneName}</div>
                <div className="text-xs text-slate-500">{r.deviceName}</div>
              </div>
            ),
          },
          {
            key: 'status',
            label: '状态',
            width: '90px',
            render: (r: any) => (
              <TagBadge className={alertStatusColors[r.status]}>
                {alertStatusLabels[r.status]}
              </TagBadge>
            ),
          },
          {
            key: 'assignee',
            label: '处理人',
            width: '100px',
            render: (r: any) => (
              <span className="flex items-center gap-1 text-sm text-slate-600">
                {r.assignee ? (
                  <>
                    <User size={13} />
                    {r.assignee}
                  </>
                ) : (
                  <span className="text-slate-400">未指派</span>
                )}
              </span>
            ),
          },
          {
            key: 'createdAt',
            label: '告警时间',
            width: '160px',
            render: (r: any) => (
              <div className="text-sm">
                <div className="text-slate-700">{formatDateTime(r.createdAt)}</div>
                <div className="text-xs text-slate-500">{timeAgo(r.createdAt)}</div>
              </div>
            ),
          },
          {
            key: 'action',
            label: '操作',
            width: '80px',
            render: (r: any) => (
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
        open={!!detail && !detailLoading}
        title="告警详情"
        onClose={() => setDetail(null)}
        width="max-w-3xl"
        footer={
          detail && (
            <div className="flex flex-wrap justify-end gap-2">
              {detail.status === 'pending' && (
                <button
                  className="btn-secondary"
                  onClick={() => setActionModal({ type: 'acknowledge', data: detail })}
                >
                  <CheckCircle size={14} /> 确认并开始处理
                </button>
              )}
              {(detail.status === 'pending' || detail.status === 'processing') && (
                <>
                  <button
                    className="btn-secondary"
                    onClick={() => setActionModal({ type: 'assign', data: detail })}
                  >
                    <User size={14} /> 指派处理人
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => setActionModal({ type: 'ignore', data: detail })}
                  >
                    <XCircle size={14} /> 标记忽略
                  </button>
                  <button
                    className="btn-primary"
                    onClick={() => setActionModal({ type: 'resolve', data: detail })}
                  >
                    <CheckCircle size={14} /> 标记已解决
                  </button>
                </>
              )}
              <button
                className="btn-ghost"
                onClick={() => setActionModal({ type: 'comment', data: detail })}
              >
                <MessageSquare size={14} /> 添加备注
              </button>
            </div>
          )
        }
      >
        {detail && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-start gap-4">
              <TagBadge className={cn('text-sm px-3 py-1', alertLevelColors[detail.level])}>
                <AlertTriangle size={13} /> {alertLevelLabels[detail.level]}级
              </TagBadge>
              <TagBadge className={cn('text-sm px-3 py-1', alertStatusColors[detail.status])}>
                {alertStatusLabels[detail.status]}
              </TagBadge>
              <h2 className="flex-1 text-lg font-semibold text-slate-900">{detail.title}</h2>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="rounded-lg bg-slate-50 p-3">
                <div className="text-xs text-slate-500">所属分区</div>
                <div className="mt-1 font-medium text-slate-800">{detail.zoneName}</div>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <div className="text-xs text-slate-500">关联设备</div>
                <div className="mt-1 font-medium text-slate-800">{detail.deviceName}</div>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <div className="text-xs text-slate-500">设备型号</div>
                <div className="mt-1 font-medium text-slate-800">
                  {detail.device?.model || '-'}
                </div>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <div className="text-xs text-slate-500">处理人</div>
                <div className="mt-1 font-medium text-slate-800">
                  {detail.assignee || '未指派'}
                </div>
              </div>
            </div>
            <div>
              <div className="mb-1.5 text-sm font-semibold text-slate-800">告警描述</div>
              <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                {detail.description || '暂无描述'}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 text-sm">
              <div>
                <div className="text-xs text-slate-500">创建时间</div>
                <div className="mt-1 text-slate-800">{formatDateTime(detail.createdAt)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">确认时间</div>
                <div className="mt-1 text-slate-800">
                  {detail.acknowledgedAt ? formatDateTime(detail.acknowledgedAt) : '-'}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">解决时间</div>
                <div className="mt-1 text-slate-800">
                  {detail.resolvedAt ? formatDateTime(detail.resolvedAt) : '-'}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">等待时长</div>
                <div className="mt-1 text-slate-800">{timeAgo(detail.createdAt)}</div>
              </div>
            </div>
            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
                <Clock size={15} /> 处理追踪（{detail.activities?.length || 0}）
              </div>
              <div className="relative border-l-2 border-slate-200 pl-5 space-y-5">
                {detail.activities?.length === 0 ? (
                  <EmptyState title="暂无处理记录" />
                ) : (
                  detail.activities.map((a: any) => (
                    <div key={a.id} className="relative">
                      <span
                        className={cn(
                          'absolute -left-[25px] top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white shadow',
                          a.action === 'create'
                            ? 'bg-slate-500'
                            : a.action === 'resolve'
                            ? 'bg-primary-600'
                            : a.action === 'ignore'
                            ? 'bg-slate-400'
                            : 'bg-warning-500'
                        )}
                      />
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="font-semibold text-slate-700">{a.operatorName}</span>
                        <span>
                          {(
                            {
                              create: '创建告警',
                              acknowledge: '确认告警',
                              assign: '指派处理',
                              resolve: '解决告警',
                              ignore: '忽略告警',
                              comment: '添加备注',
                            } as Record<string, string>
                          )[a.action] || a.action}
                        </span>
                        <span>· {formatDateTime(a.createdAt)}</span>
                      </div>
                      {a.note && (
                        <div className="mt-1.5 rounded-lg bg-slate-50 p-2.5 text-sm text-slate-700">
                          {a.note}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!actionModal}
        title={
          { acknowledge: '确认告警', assign: '指派处理人', resolve: '解决告警', ignore: '忽略告警', comment: '添加备注' }[
            actionModal?.type || ''
          ] || ''
        }
        onClose={() => setActionModal(null)}
        footer={
          <div className="flex justify-end gap-2">
            <button className="btn-secondary" onClick={() => setActionModal(null)}>
              取消
            </button>
            <button
              className="btn-primary"
              onClick={() => runAction(actionModal?.type || '')}
            >
              确认
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {actionModal?.type === 'assign' && (
            <div>
              <label className="label">指派给 <span className="text-danger-600">*</span></label>
              <input
                list="user-list"
                className="input"
                placeholder="输入或选择处理人姓名"
                value={assigneeText}
                onChange={(e) => setAssigneeText(e.target.value)}
              />
              <datalist id="user-list">
                {users.map((u) => (
                  <option key={u.id} value={u.name} />
                ))}
              </datalist>
            </div>
          )}
          <div>
            <label className="label">{actionModal?.type === 'comment' ? '备注内容 *' : '备注说明'}</label>
            <textarea
              className="input min-h-[100px]"
              placeholder="请输入处理说明..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={saveFilterModal}
        title="保存筛选方案"
        onClose={() => setSaveFilterModal(false)}
        footer={
          <div className="flex justify-end gap-2">
            <button className="btn-secondary" onClick={() => setSaveFilterModal(false)}>
              取消
            </button>
            <button className="btn-primary" onClick={handleSaveFilter}>
              保存
            </button>
          </div>
        }
      >
        <div>
          <label className="label">方案名称 <span className="text-danger-600">*</span></label>
          <input
            className="input"
            placeholder="例如：本周严重未处理告警"
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
          />
          <p className="mt-2 text-xs text-slate-500">
            方案内包含：关键字、分区、等级、状态、处理人、日期范围共 {activeCount} 个筛选条件
          </p>
        </div>
      </Modal>
    </div>
  );
}
