import { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  CheckSquare,
  Square,
  CheckCircle2,
  UserPlus,
  Download,
  Sparkles,
  User,
  Calendar,
  Hash,
  Flag,
  History,
  Undo2,
  X,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  FileText,
  StickyNote,
  ArrowLeftRight,
  ChevronRight,
} from 'lucide-react';
import ConfidenceBadge from '@/components/ConfidenceBadge';
import { mockActionItems, mockMeetings, mockUsers, mockVersionHistories } from '@/lib/mockData';
import type { ActionItem, ActionItemStatus, FieldConfidence } from '#shared/types';
import { cn } from '@/lib/utils';

const fieldLabels: Record<string, string> = {
  content: '内容',
  assignee: '负责人',
  dueDate: '截止日期',
  topic: '议题',
  milestone: '里程碑',
  priority: '优先级',
  status: '状态',
  remarks: '备注',
  assigneeStatus: '负责人状态',
};

const statusOptions: { value: ActionItemStatus; label: string; cls: string }[] = [
  { value: 'draft', label: '草稿', cls: 'bg-slate-100 text-slate-700' },
  { value: 'pending', label: '待确认', cls: 'bg-amber-100 text-amber-700' },
  { value: 'confirmed', label: '已确认', cls: 'bg-blue-100 text-blue-700' },
  { value: 'assigned', label: '已分配', cls: 'bg-violet-100 text-violet-700' },
  { value: 'in_progress', label: '进行中', cls: 'bg-cyan-100 text-cyan-700' },
  { value: 'completed', label: '已完成', cls: 'bg-emerald-100 text-emerald-700' },
  { value: 'cancelled', label: '已取消', cls: 'bg-rose-100 text-rose-700' },
];

const priorityOptions = ['P0', 'P1', 'P2', 'P3'];

export default function Workbench() {
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState<ActionItem[]>(mockActionItems);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filterMeeting, setFilterMeeting] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [onlyLowConf, setOnlyLowConf] = useState(false);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState<string | null>(null);

  const highlightId = searchParams.get('highlight');

  useEffect(() => {
    if (highlightId) {
      const el = document.getElementById(`ai-${highlightId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [highlightId]);

  const filtered = useMemo(() => {
    return items.filter((ai) => {
      if (filterMeeting !== 'all' && ai.meetingId !== filterMeeting) return false;
      if (filterStatus !== 'all' && ai.status !== filterStatus) return false;
      if (filterPriority !== 'all' && ai.priority !== filterPriority) return false;
      if (onlyLowConf && ai.lowConfidenceFields.length === 0) return false;
      if (search && !ai.content.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [items, filterMeeting, filterStatus, filterPriority, onlyLowConf, search]);

  const allSelected = filtered.length > 0 && filtered.every((i) => selected.has(i.id));

  const toggleAll = () => {
    if (allSelected) {
      const next = new Set(selected);
      filtered.forEach((i) => next.delete(i.id));
      setSelected(next);
    } else {
      const next = new Set(selected);
      filtered.forEach((i) => next.add(i.id));
      setSelected(next);
    }
  };

  const toggleOne = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const updateField = (id: string, patch: Partial<ActionItem>) => {
    setItems((prev) =>
      prev.map((ai) =>
        ai.id === id
          ? {
              ...ai,
              ...patch,
              version: ai.version + 1,
              updatedAt: new Date().toISOString(),
              updatedBy: 'me',
            }
          : ai
      )
    );
  };

  const handleBatchConfirm = () => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setItems((prev) =>
      prev.map((ai) =>
        ids.includes(ai.id) && ai.status === 'pending'
          ? { ...ai, status: 'confirmed' as const, version: ai.version + 1, updatedAt: new Date().toISOString() }
          : ai
      )
    );
    setSelected(new Set());
  };

  const handleBatchAssign = (userId: string) => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setItems((prev) =>
      prev.map((ai) =>
        ids.includes(ai.id)
          ? {
              ...ai,
              assignee: userId,
              assigneeStatus: 'confirmed',
              version: ai.version + 1,
              updatedAt: new Date().toISOString(),
            }
          : ai
      )
    );
    setSelected(new Set());
  };

  const exportCsv = () => {
    const headers = ['ID', '会议', '内容', '负责人', '截止日期', '议题', '优先级', '状态', '置信度'];
    const rows = filtered.map((ai) => {
      const meeting = mockMeetings.find((m) => m.id === ai.meetingId);
      const minConf = ai.fieldConfidences.reduce((m, f) => Math.min(m, f.confidence), 1);
      const assigneeName = ai.assignee ? mockUsers.find((u) => u.id === ai.assignee)?.name || ai.assignee : '';
      return [
        ai.id,
        meeting?.title || '',
        `"${ai.content.replace(/"/g, '""')}"`,
        assigneeName,
        ai.dueDate || '',
        ai.topic || '',
        ai.priority,
        ai.status,
        Math.round(minConf * 100) + '%',
      ].join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `action-items-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const FieldRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex items-start gap-3 py-2 border-b border-slate-100 last:border-0">
      <div className="w-20 flex-shrink-0 pt-1.5 text-xs font-medium text-slate-500">{label}</div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">行动项工作台</h1>
          <p className="text-sm text-slate-500 mt-1">
            AI 自动提取 · 人工校对确认 · 共 <span className="font-semibold text-slate-700">{items.length}</span> 条行动项
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-white shadow-sm shadow-slate-200/60 border border-slate-100 p-4 space-y-3">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative lg:flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索行动项内容..."
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 bg-slate-50/50 text-sm outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 focus:bg-white transition-all"
            />
          </div>
          <div className="flex flex-wrap gap-2.5">
            <div className="flex items-center gap-1.5">
              <Filter className="h-4 w-4 text-slate-400" />
              <select
                value={filterMeeting}
                onChange={(e) => setFilterMeeting(e.target.value)}
                className="h-10 px-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 focus:bg-white"
              >
                <option value="all">全部会议</option>
                {mockMeetings.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-10 px-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 focus:bg-white"
            >
              <option value="all">全部状态</option>
              {statusOptions.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="h-10 px-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 focus:bg-white"
            >
              <option value="all">全部优先级</option>
              {priorityOptions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 h-10 px-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm cursor-pointer hover:bg-slate-100">
              <input
                type="checkbox"
                checked={onlyLowConf}
                onChange={(e) => setOnlyLowConf(e.target.checked)}
                className="rounded text-accent-600 focus:ring-accent-500"
              />
              <span className="text-slate-700">仅低置信度</span>
            </label>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleAll}
              className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-primary-700"
            >
              {allSelected ? (
                <CheckSquare className="h-4.5 w-4.5 text-primary-600" />
              ) : (
                <Square className="h-4.5 w-4.5" />
              )}
              全选
              {selected.size > 0 && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-primary-100 text-primary-700 font-semibold">
                  已选 {selected.size}
                </span>
              )}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBatchConfirm}
              disabled={selected.size === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 shadow-sm shadow-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <CheckCircle2 className="h-4 w-4" />
              批量确认
            </button>
            <div className="relative group">
              <button
                disabled={selected.size === 0}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 shadow-sm shadow-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <UserPlus className="h-4 w-4" />
                批量分配
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 hidden group-hover:block z-20">
                {mockUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => handleBatchAssign(u.id)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
                  >
                    <div className="h-6 w-6 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white text-[10px] flex items-center justify-center">
                      {u.name.charAt(0)}
                    </div>
                    <span className="text-slate-700">{u.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={exportCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 shadow-sm transition-all"
            >
              <Download className="h-4 w-4" />
              导出 CSV
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filtered.map((ai) => {
          const meeting = mockMeetings.find((m) => m.id === ai.meetingId);
          const assigneeName = ai.assignee
            ? mockUsers.find((u) => u.id === ai.assignee)?.name || ai.assignee
            : null;
          const histories = mockVersionHistories[ai.id] || [];
          const isHighlight = highlightId === ai.id;
          const isEditing = editingId === ai.id;
          return (
            <div
              key={ai.id}
              id={`ai-${ai.id}`}
              className={cn(
                'rounded-2xl overflow-hidden border shadow-sm transition-all duration-300',
                isHighlight
                  ? 'border-accent-400 ring-4 ring-accent-500/20 shadow-lg shadow-accent-500/10'
                  : 'border-slate-200 bg-white hover:shadow-md hover:shadow-slate-200/60'
              )}
            >
              <div className="flex items-center gap-3 px-5 py-3.5 bg-gradient-to-r from-slate-50/80 to-white border-b border-slate-100">
                <button
                  onClick={() => toggleOne(ai.id)}
                  className="flex-shrink-0 text-slate-500 hover:text-primary-600"
                >
                  {selected.has(ai.id) ? (
                    <CheckSquare className="h-5 w-5 text-primary-600" />
                  ) : (
                    <Square className="h-5 w-5" />
                  )}
                </button>
                <div className="flex items-center gap-2 min-w-0">
                  <code className="flex-shrink-0 text-[11px] px-2 py-0.5 rounded-md bg-slate-200/60 text-slate-600 font-mono">
                    {ai.id}
                  </code>
                  <span className="text-xs text-slate-500 truncate">
                    <FileText className="h-3 w-3 inline mr-1 -mt-0.5" />
                    {meeting?.title || '未知会议'}
                  </span>
                  {ai.version > 1 && (
                    <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-700 font-medium">
                      v{ai.version}
                    </span>
                  )}
                </div>
                <div className="flex-1" />
                <button
                  onClick={() => setEditingId(isEditing ? null : ai.id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                    isEditing
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  )}
                >
                  {isEditing ? (
                    <>
                      <ChevronUp className="h-3.5 w-3.5" />
                      收起
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3.5 w-3.5" />
                      展开编辑
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-0 xl:divide-x divide-slate-100">
                <div className="p-5 bg-gradient-to-br from-primary-50/30 via-white to-white">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800">AI 提取建议</h3>
                      <p className="text-[11px] text-slate-500">模型 {ai.modelVersion}</p>
                    </div>
                  </div>

                  <div className="space-y-3.5">
                    <div>
                      <div className="text-xs font-medium text-slate-500 mb-1.5">内容</div>
                      <p className="text-sm text-slate-800 leading-relaxed bg-white rounded-xl p-3.5 border border-slate-200/60 shadow-sm">
                        {ai.content}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-xs font-medium text-slate-500 mb-1.5">负责人</div>
                        <div
                          className={cn(
                            'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm',
                            ai.assigneeStatus === 'ai_suggested'
                              ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-300/40'
                              : ai.assigneeStatus === 'pending_assignment'
                              ? 'bg-rose-50 border-rose-200 ring-2 ring-rose-300/50 animate-pulse'
                              : 'bg-emerald-50 border-emerald-200'
                          )}
                        >
                          <User className={cn(
                            'h-4 w-4 flex-shrink-0',
                            ai.assigneeStatus === 'confirmed' ? 'text-emerald-600' : 'text-rose-500'
                          )} />
                          <span className="font-medium text-slate-800 truncate">
                            {assigneeName || '待分配'}
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-slate-500 mb-1.5">截止日期</div>
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm">
                          <Calendar className="h-4 w-4 flex-shrink-0 text-slate-400" />
                          <span className="font-medium text-slate-800">{ai.dueDate || '-'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-xs font-medium text-slate-500 mb-1.5">议题</div>
                        <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm">
                          <Hash className="h-4 w-4 flex-shrink-0 text-primary-500" />
                          <span className="font-medium text-slate-800">{ai.topic || '-'}</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-slate-500 mb-1.5">优先级</div>
                        <span className={cn(
                          'inline-flex items-center justify-center h-9 px-3 rounded-lg text-sm font-bold w-full',
                          ai.priority === 'P0' && 'bg-gradient-to-r from-rose-500 to-rose-600 text-white',
                          ai.priority === 'P1' && 'bg-gradient-to-r from-orange-500 to-accent-600 text-white',
                          ai.priority === 'P2' && 'bg-gradient-to-r from-amber-400 to-amber-500 text-white',
                          ai.priority === 'P3' && 'bg-gradient-to-r from-slate-400 to-slate-500 text-white'
                        )}>
                          <Flag className="h-4 w-4 mr-1" />
                          {ai.priority}
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-medium text-slate-500">字段置信度</div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {ai.fieldConfidences.map((fc: FieldConfidence) => {
                          const isLow = ai.lowConfidenceFields.includes(fc.field);
                          return (
                            <div
                              key={fc.field}
                              className={cn(
                                'p-2.5 rounded-xl border',
                                isLow
                                  ? 'bg-orange-50/80 border-orange-200 ring-1 ring-orange-300/30'
                                  : 'bg-slate-50/60 border-slate-200'
                              )}
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <span className={cn(
                                  'text-[11px] font-medium',
                                  isLow ? 'text-orange-700' : 'text-slate-600'
                                )}>
                                  {fieldLabels[fc.field]}
                                </span>
                                {isLow && <AlertTriangle className="h-3 w-3 text-orange-500" />}
                              </div>
                              <ConfidenceBadge level={fc.level} value={fc.confidence} size="sm" showText={false} />
                              {isLow && fc.reason && (
                                <div className="mt-1.5 text-[10px] text-orange-700 leading-snug">
                                  {fc.reason}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {ai.evidence.length > 0 && (
                      <div>
                        <div className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5 text-yellow-600" />
                          证据链（点击高亮对应转写段）
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {ai.evidence.map((ev, idx) => (
                            <div
                              key={idx}
                              className="group relative p-2.5 rounded-xl bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200/70 text-xs max-w-full cursor-pointer hover:shadow-md transition-all"
                            >
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="font-medium text-yellow-800">证据 #{idx + 1}</span>
                                <span className="text-[10px] text-yellow-600 font-mono">
                                  {ev.segmentId}
                                </span>
                              </div>
                              <div className="text-slate-700 line-clamp-2 italic">
                                &ldquo;{ev.quotedText}&rdquo;
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-5 bg-white">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-accent-500 to-orange-600 flex items-center justify-center text-white">
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800">人工编辑区</h3>
                      <p className="text-[11px] text-slate-500">
                        {isEditing ? '编辑中 · 修改将自动递增版本' : '点击右上角"展开编辑"开始修改'}
                      </p>
                    </div>
                  </div>

                  <div className={cn('space-y-0', !isEditing && 'opacity-60 pointer-events-none')}>
                    <FieldRow label="内容">
                      <textarea
                        value={ai.content}
                        onChange={(e) => updateField(ai.id, { content: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 resize-none leading-relaxed"
                      />
                    </FieldRow>
                    <FieldRow label="负责人">
                      <select
                        value={ai.assignee || ''}
                        onChange={(e) =>
                          updateField(ai.id, {
                            assignee: e.target.value || null,
                            assigneeStatus: e.target.value ? 'confirmed' : 'pending_assignment',
                          })
                        }
                        className="w-full h-9 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10"
                      >
                        <option value="">-- 未分配 --</option>
                        {mockUsers.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} · {u.email}
                          </option>
                        ))}
                      </select>
                    </FieldRow>
                    <FieldRow label="截止日期">
                      <input
                        type="date"
                        value={ai.dueDate || ''}
                        onChange={(e) => updateField(ai.id, { dueDate: e.target.value || null })}
                        className="w-full h-9 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10"
                      />
                    </FieldRow>
                    <FieldRow label="议题">
                      <input
                        value={ai.topic || ''}
                        onChange={(e) => updateField(ai.id, { topic: e.target.value || null })}
                        placeholder="例如：技术方案"
                        className="w-full h-9 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10"
                      />
                    </FieldRow>
                    <FieldRow label="优先级">
                      <select
                        value={ai.priority}
                        onChange={(e) =>
                          updateField(ai.id, { priority: e.target.value as ActionItem['priority'] })
                        }
                        className="w-full h-9 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10"
                      >
                        {priorityOptions.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </FieldRow>
                    <FieldRow label="状态">
                      <select
                        value={ai.status}
                        onChange={(e) =>
                          updateField(ai.id, { status: e.target.value as ActionItemStatus })
                        }
                        className="w-full h-9 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10"
                      >
                        {statusOptions.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </FieldRow>
                    <FieldRow label="备注">
                      <textarea
                        value={ai.remarks || ''}
                        onChange={(e) => updateField(ai.id, { remarks: e.target.value })}
                        rows={2}
                        placeholder="添加备注信息..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 resize-none"
                      />
                    </FieldRow>
                    <div className="pt-4 flex flex-wrap items-center gap-3 justify-between border-t border-slate-100 mt-3">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 font-mono">v{ai.version}</span>
                        <span>更新于 {new Date(ai.updatedAt).toLocaleString('zh-CN')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setHistoryOpen(ai.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-all"
                        >
                          <History className="h-3.5 w-3.5" />
                          查看历史
                        </button>
                        {ai.version > 1 && (
                          <button
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-xs font-medium text-rose-700 hover:bg-rose-100 transition-all"
                            title="回滚到上一个版本"
                          >
                            <Undo2 className="h-3.5 w-3.5" />
                            回滚
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {historyOpen === ai.id && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <div
                    className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
                    onClick={() => setHistoryOpen(null)}
                  />
                  <div className="relative w-full max-w-2xl max-h-[80vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
                      <div className="flex items-center gap-2.5">
                        <div className="h-9 w-9 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center">
                          <History className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-slate-900">版本历史</h3>
                          <p className="text-xs text-slate-500">行动项 {ai.id} · 共 {histories.length || 1} 个版本</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setHistoryOpen(null)}
                        className="h-9 w-9 rounded-lg text-slate-500 hover:bg-slate-200/70 flex items-center justify-center"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                      {histories.length === 0 && (
                        <div className="py-8 text-center text-slate-400 text-sm">暂无历史变更记录</div>
                      )}
                      {histories.length > 0 && histories.map((h, hi) => (
                        <div
                          key={h.id}
                          className="relative pl-8 pb-4 last:pb-0"
                        >
                          {hi < histories.length - 1 && (
                            <div className="absolute left-3 top-6 bottom-0 w-px bg-slate-200" />
                          )}
                          <div className={cn(
                            'absolute left-0 top-0 h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-bold border-2',
                            hi === 0
                              ? 'bg-primary-600 text-white border-primary-200'
                              : 'bg-white text-slate-600 border-slate-200'
                          )}>
                            v{h.version}
                          </div>
                          <div className="rounded-xl border border-slate-200 bg-slate-50/40 overflow-hidden">
                            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-white border-b border-slate-100">
                              <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white text-[10px] flex items-center justify-center font-semibold">
                                  {h.operatorName.charAt(0)}
                                </div>
                                <span className="text-sm font-medium text-slate-800">{h.operatorName}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                {h.remark && (
                                  <span className="text-xs px-2 py-0.5 rounded-md bg-accent-100 text-accent-700">
                                    <StickyNote className="h-3 w-3 inline mr-0.5 -mt-0.5" />
                                    {h.remark}
                                  </span>
                                )}
                                <span className="text-[11px] text-slate-500 font-mono">
                                  {new Date(h.timestamp).toLocaleString('zh-CN')}
                                </span>
                              </div>
                            </div>
                            <div className="p-4 space-y-2">
                              {Object.entries(h.diff).map(([field, change]) => (
                                <div key={field} className="rounded-lg bg-white p-3 border border-slate-200/60">
                                  <div className="flex items-center gap-2 mb-2">
                                    <ArrowLeftRight className="h-3.5 w-3.5 text-violet-600" />
                                    <span className="text-xs font-semibold text-slate-700">
                                      {fieldLabels[field] || field}
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-3 text-xs">
                                    <div className="rounded-md bg-rose-50 p-2.5 border border-rose-200/60">
                                      <div className="text-[10px] text-rose-500 font-semibold mb-1">旧值</div>
                                      <div className="text-slate-700 break-all">
                                        {String((change as { old: unknown; new: unknown }).old ?? '-')}
                                      </div>
                                    </div>
                                    <div className="rounded-md bg-emerald-50 p-2.5 border border-emerald-200/60">
                                      <div className="text-[10px] text-emerald-600 font-semibold mb-1">新值</div>
                                      <div className="text-slate-700 break-all">
                                        {String((change as { old: unknown; new: unknown }).new ?? '-')}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            {hi > 0 && (
                              <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/60 flex justify-end">
                                <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 bg-white text-[11px] font-medium text-slate-600 hover:bg-slate-100 transition-all">
                                  <Undo2 className="h-3 w-3" />
                                  回滚到此版本
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
              <Filter className="h-7 w-7" />
            </div>
            <div className="text-sm font-medium text-slate-600 mb-1">没有匹配的行动项</div>
            <div className="text-xs text-slate-400">请尝试调整筛选条件</div>
          </div>
        )}
      </div>
    </div>
  );
}
