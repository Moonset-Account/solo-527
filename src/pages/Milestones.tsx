import { useState } from 'react';
import {
  Plus,
  Flag,
  Calendar,
  ListTodo,
  X,
  Save,
  GripVertical,
  CheckCircle2,
  AlertTriangle,
  Clock,
  XCircle,
  Target,
  ChevronRight,
} from 'lucide-react';
import { mockMilestones, mockActionItems } from '@/lib/mockData';
import type { Milestone } from '#shared/types';
import { cn } from '@/lib/utils';

type ColumnStatus = Milestone['status'];

const columns: { status: ColumnStatus; title: string; icon: typeof Flag; gradient: string; header: string; accent: string }[] = [
  { status: 'planned', title: '规划中', icon: Target, gradient: 'from-slate-50 to-white', header: 'bg-slate-500', accent: 'text-slate-600' },
  { status: 'in_progress', title: '进行中', icon: Clock, gradient: 'from-blue-50 to-white', header: 'bg-blue-500', accent: 'text-blue-600' },
  { status: 'at_risk', title: '有风险', icon: AlertTriangle, gradient: 'from-orange-50 to-white', header: 'bg-orange-500', accent: 'text-orange-600' },
  { status: 'completed', title: '已完成', icon: CheckCircle2, gradient: 'from-emerald-50 to-white', header: 'bg-emerald-500', accent: 'text-emerald-600' },
  { status: 'cancelled', title: '已取消', icon: XCircle, gradient: 'from-rose-50 to-white', header: 'bg-rose-500', accent: 'text-rose-600' },
];

export default function Milestones() {
  const [milestones, setMilestones] = useState<Milestone[]>(mockMilestones);
  const [editing, setEditing] = useState<Milestone | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<ColumnStatus | null>(null);
  const [form, setForm] = useState<Partial<Milestone>>({
    title: '',
    description: '',
    dueDate: '',
    status: 'planned',
    actionItemIds: [],
  });

  const groupedByStatus = columns.reduce(
    (acc, col) => ({
      ...acc,
      [col.status]: milestones.filter((m) => m.status === col.status),
    }),
    {} as Record<ColumnStatus, Milestone[]>
  );

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: React.DragEvent, status: ColumnStatus) => {
    e.preventDefault();
    if (dragId) {
      setMilestones((prev) =>
        prev.map((m) => (m.id === dragId ? { ...m, status } : m))
      );
    }
    setDragId(null);
    setDragOver(null);
  };

  const handleSave = () => {
    if (!form.title?.trim()) return;
    if (editing) {
      setMilestones((prev) =>
        prev.map((m) => (m.id === editing.id ? { ...m, ...form, dueDate: form.dueDate || null } as Milestone : m))
      );
      setEditing(null);
    } else {
      const newMs: Milestone = {
        id: `ms${Date.now()}`,
        projectId: 'p1',
        title: form.title!,
        description: form.description || '',
        dueDate: form.dueDate || null,
        status: (form.status as ColumnStatus) || 'planned',
        actionItemIds: [],
        createdAt: new Date().toISOString(),
      };
      setMilestones([...milestones, newMs]);
      setShowNew(false);
    }
    setForm({ title: '', description: '', dueDate: '', status: 'planned', actionItemIds: [] });
  };

  const openEdit = (m: Milestone) => {
    setEditing(m);
    setForm({ ...m, dueDate: m.dueDate || '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">里程碑看板</h1>
          <p className="text-sm text-slate-500 mt-1">
            拖拽卡片调整状态 · 共 {milestones.length} 个里程碑
          </p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 text-white text-sm font-medium hover:from-primary-700 hover:to-primary-800 shadow-lg shadow-primary-500/25 transition-all"
        >
          <Plus className="h-4.5 w-4.5" />
          新建里程碑
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-4 lg:gap-5">
        {columns.map((col) => {
          const items = groupedByStatus[col.status];
          const Icon = col.icon;
          return (
            <div
              key={col.status}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(col.status);
              }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => handleDrop(e, col.status)}
              className={cn(
                'rounded-2xl border min-h-[480px] flex flex-col transition-all',
                dragOver === col.status
                  ? 'border-primary-400 ring-4 ring-primary-500/15 shadow-lg'
                  : 'border-slate-200/70 bg-white shadow-sm shadow-slate-200/60'
              )}
            >
              <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between rounded-t-2xl bg-gradient-to-r from-slate-50/80 to-transparent">
                <div className="flex items-center gap-2.5">
                  <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center text-white shadow-sm', col.header)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-800">{col.title}</div>
                    <div className="text-[11px] text-slate-500">{items.length} 项</div>
                  </div>
                </div>
              </div>
              <div className={cn('flex-1 p-3 space-y-3 rounded-b-2xl transition-colors', dragOver === col.status ? 'bg-primary-50/30' : '')}>
                {items.map((m) => {
                  const linkCount = m.actionItemIds.length || mockActionItems.filter((a) => a.milestoneId === m.id).length;
                  return (
                    <div
                      key={m.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, m.id)}
                      onDragEnd={() => setDragId(null)}
                      onClick={() => openEdit(m)}
                      className={cn(
                        'group relative rounded-xl p-4 cursor-grab active:cursor-grabbing bg-white border transition-all hover:shadow-md',
                        dragId === m.id ? 'opacity-50 scale-95' : 'border-slate-200 hover:border-primary-200 hover:-translate-y-0.5'
                      )}
                    >
                      <div className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-40 transition-opacity text-slate-400">
                        <GripVertical className="h-4 w-4" />
                      </div>
                      <div className="pl-2">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2 group-hover:text-primary-700 transition-colors">
                            {m.title}
                          </h3>
                          <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-primary-500 flex-shrink-0 mt-0.5 transition-colors" />
                        </div>
                        {m.description && (
                          <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
                            {m.description}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 text-[11px]">
                          {m.dueDate && (
                            <span className={cn(
                              'inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium',
                              new Date(m.dueDate) < new Date() && m.status !== 'completed'
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-slate-100 text-slate-600'
                            )}>
                              <Calendar className="h-3 w-3" />
                              {m.dueDate}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary-50 text-primary-700 font-medium">
                            <ListTodo className="h-3 w-3" />
                            {linkCount} 行动项
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {items.length === 0 && (
                  <div className="py-10 text-center text-xs text-slate-400">
                    <Flag className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    拖拽卡片到此
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {(showNew || editing) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => {
              setShowNew(false);
              setEditing(null);
            }}
          />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-primary-50/50 to-transparent">
              <h3 className="text-base font-semibold text-slate-900">
                {editing ? '编辑里程碑' : '新建里程碑'}
              </h3>
              <button
                onClick={() => {
                  setShowNew(false);
                  setEditing(null);
                }}
                className="h-9 w-9 rounded-lg text-slate-500 hover:bg-slate-100 flex items-center justify-center"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">标题 *</label>
                <input
                  value={form.title || ''}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="里程碑名称"
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">描述</label>
                <textarea
                  value={form.description || ''}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  placeholder="简要说明里程碑目标..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">截止日期</label>
                  <input
                    type="date"
                    value={form.dueDate || ''}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">状态</label>
                  <select
                    value={form.status || 'planned'}
                    onChange={(e) => setForm({ ...form, status: e.target.value as ColumnStatus })}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10"
                  >
                    {columns.map((c) => (
                      <option key={c.status} value={c.status}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowNew(false);
                  setEditing(null);
                }}
                className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-100 transition-all"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={!form.title?.trim()}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 text-white text-sm font-medium hover:from-primary-700 hover:to-primary-800 shadow-lg shadow-primary-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all inline-flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
