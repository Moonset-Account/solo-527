import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  CalendarCheck2,
  Trash2,
  Eye,
  Sparkles,
  X,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Clock,
  Filter,
} from 'lucide-react';
import { mockMeetings } from '@/lib/mockData';
import type { MeetingListItem } from '#shared/types';
import { cn } from '@/lib/utils';

const statusMap: Record<MeetingListItem['status'], { label: string; cls: string; icon: typeof Clock }> = {
  created: { label: '待抽取', cls: 'bg-slate-100 text-slate-700 ring-slate-200', icon: Clock },
  extracting: { label: '抽取中', cls: 'bg-blue-100 text-blue-700 ring-blue-200 animate-pulse', icon: Loader2 },
  extracted: { label: '已完成', cls: 'bg-emerald-100 text-emerald-700 ring-emerald-200', icon: CheckCircle2 },
  failed: { label: '失败', cls: 'bg-rose-100 text-rose-700 ring-rose-200', icon: AlertCircle },
};

export default function Meetings() {
  const [meetings, setMeetings] = useState(mockMeetings);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [form, setForm] = useState({
    title: '',
    date: new Date().toISOString().slice(0, 10),
    project: 'p1',
    topics: '',
    transcriptText: `[00:00:00] 李明: 大家好，今天我们来讨论Q3产品迭代计划。\n[00:02:15] 王芳: 技术方面我这边安排张三负责后端接口开发，截止日期7月15日。\n[00:05:30] 刘洋: 测试需要7月20日拿到提测版本。`,
  });

  const filtered = meetings.filter((m) => {
    const matchSearch = m.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || m.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleCreate = () => {
    if (!form.title.trim()) return;
    const topics = form.topics.split(/[,，\n]/).map((t) => t.trim()).filter(Boolean);
    const lines = form.transcriptText.split('\n').filter((l) => l.trim());
    const newMeeting: MeetingListItem = {
      id: `m${Date.now()}`,
      title: form.title,
      date: form.date,
      projectId: form.project,
      speakers: Array.from(new Set(lines.map((l) => l.match(/\]\s*(.+?):/)?.[1]).filter(Boolean))).map(
        (name, i) => ({ id: `ns${i}`, name: name || '未知', color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][i % 5] })
      ),
      topics: topics.length > 0 ? topics : ['未分类'],
      maskingApplied: true,
      status: 'created',
      actionItemCount: 0,
      createdAt: new Date().toISOString(),
      createdBy: '1',
    };
    setMeetings([newMeeting, ...meetings]);
    setDrawerOpen(false);
    setForm({
      title: '',
      date: new Date().toISOString().slice(0, 10),
      project: 'p1',
      topics: '',
      transcriptText: `[00:00:00] 李明: \n[00:02:15] 王芳: `,
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('确定删除该会议吗？')) {
      setMeetings(meetings.filter((m) => m.id !== id));
    }
  };

  const startExtraction = (id: string) => {
    setMeetings(
      meetings.map((m) => (m.id === id ? { ...m, status: 'extracting' as const } : m))
    );
    setTimeout(() => {
      setMeetings((ms) =>
        ms.map((m) => (m.id === id ? { ...m, status: 'extracted' as const, actionItemCount: 3 + Math.floor(Math.random() * 5) } : m))
      );
    }, 2500);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">会议管理</h1>
          <p className="text-sm text-slate-500 mt-1">管理会议转写，发起 AI 行动项提取</p>
        </div>
        <button
          onClick={() => setDrawerOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 text-white text-sm font-medium hover:from-primary-700 hover:to-primary-800 shadow-lg shadow-primary-500/25 transition-all"
        >
          <Plus className="h-4.5 w-4.5" />
          新建会议
        </button>
      </div>

      <div className="rounded-2xl bg-white shadow-sm shadow-slate-200/60 border border-slate-100 p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索会议标题..."
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 bg-slate-50/50 text-sm outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 focus:bg-white transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400 ml-1" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 focus:bg-white"
          >
            <option value="all">全部状态</option>
            <option value="created">待抽取</option>
            <option value="extracting">抽取中</option>
            <option value="extracted">已完成</option>
            <option value="failed">失败</option>
          </select>
        </div>
      </div>

      <div className="rounded-2xl bg-white shadow-sm shadow-slate-200/60 border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5 text-left font-medium">会议信息</th>
                <th className="px-5 py-3.5 text-left font-medium">日期 / 项目</th>
                <th className="px-5 py-3.5 text-left font-medium">参与人</th>
                <th className="px-5 py-3.5 text-left font-medium">议题</th>
                <th className="px-5 py-3.5 text-left font-medium">状态</th>
                <th className="px-5 py-3.5 text-center font-medium">行动项</th>
                <th className="px-5 py-3.5 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((m) => {
                const s = statusMap[m.status];
                const StatusIcon = s.icon;
                return (
                  <tr key={m.id} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary-500/15 to-primary-700/15 flex items-center justify-center text-primary-700">
                          <CalendarCheck2 className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <Link
                            to={`/meetings/${m.id}`}
                            className="font-medium text-slate-800 hover:text-primary-700 transition-colors truncate max-w-[220px] block"
                          >
                            {m.title}
                          </Link>
                          <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                            ID: <code className="font-mono">{m.id}</code>
                            {m.maskingApplied && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 text-[10px] font-medium">
                                已脱敏
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-slate-700">{m.date}</div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        项目 {m.projectId.toUpperCase()}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex -space-x-2">
                        {m.speakers.slice(0, 4).map((sp) => (
                          <div
                            key={sp.id}
                            title={`${sp.name} · ${sp.role || ''}`}
                            className="h-7 w-7 rounded-full ring-2 ring-white flex items-center justify-center text-white text-[11px] font-medium"
                            style={{ backgroundColor: sp.color }}
                          >
                            {sp.name.charAt(0)}
                          </div>
                        ))}
                        {m.speakers.length > 4 && (
                          <div className="h-7 w-7 rounded-full ring-2 ring-white bg-slate-100 flex items-center justify-center text-[11px] font-medium text-slate-600">
                            +{m.speakers.length - 4}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1 max-w-[180px]">
                        {m.topics.slice(0, 2).map((t) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 text-[11px] rounded-md bg-slate-100 text-slate-700"
                          >
                            {t}
                          </span>
                        ))}
                        {m.topics.length > 2 && (
                          <span className="text-[11px] text-slate-400">+{m.topics.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={cn(
                        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset',
                        s.cls
                      )}>
                        <StatusIcon className={cn('h-3.5 w-3.5', m.status === 'extracting' && 'animate-spin')} />
                        {s.label}
                      </span>
                      {m.status === 'failed' && m.extractionError && (
                        <div className="text-[10px] text-rose-500 mt-1 max-w-[140px] truncate" title={m.extractionError}>
                          {m.extractionError}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={cn(
                        'inline-flex items-center justify-center min-w-[2.5rem] px-2 py-0.5 rounded-lg text-sm font-bold',
                        m.actionItemCount && m.actionItemCount > 0
                          ? 'bg-primary-50 text-primary-700'
                          : 'bg-slate-100 text-slate-500'
                      )}>
                        {m.actionItemCount || 0}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        {m.status === 'created' && (
                          <button
                            onClick={() => startExtraction(m.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-accent-500 to-orange-600 text-white text-xs font-medium hover:from-accent-600 hover:to-orange-700 shadow-sm shadow-accent-500/20 transition-all"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            抽取
                          </button>
                        )}
                        {m.status === 'failed' && (
                          <button
                            onClick={() => startExtraction(m.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs font-medium hover:bg-rose-100 transition-all"
                          >
                            重试
                          </button>
                        )}
                        <Link
                          to={`/meetings/${m.id}`}
                          className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-primary-700 transition-all"
                          title="查看详情"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(m.id)}
                          className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-all"
                          title="删除"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-slate-400">
                    暂无符合条件的会议
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="relative ml-auto w-full max-w-xl h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">新建会议</h2>
                <p className="text-xs text-slate-500 mt-0.5">填写会议信息并粘贴转写文本</p>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="h-9 w-9 rounded-lg text-slate-500 hover:bg-slate-100 flex items-center justify-center"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">会议标题 *</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="例如：Q3产品迭代规划会议"
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">会议日期</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">项目</label>
                  <select
                    value={form.project}
                    onChange={(e) => setForm({ ...form, project: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10"
                  >
                    <option value="p1">P1 · 用户中心重构</option>
                    <option value="p2">P2 · 新功能开发</option>
                    <option value="p3">P3 · 基础架构升级</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  议题标签 <span className="text-slate-400 font-normal text-xs">(逗号或换行分隔)</span>
                </label>
                <input
                  value={form.topics}
                  onChange={(e) => setForm({ ...form, topics: e.target.value })}
                  placeholder="例如：产品规划, 技术方案, 排期"
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-slate-700">
                    转写文本 <span className="text-accent-600">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">格式: [时间] 发言人: 内容</span>
                </div>
                <textarea
                  value={form.transcriptText}
                  onChange={(e) => setForm({ ...form, transcriptText: e.target.value })}
                  rows={14}
                  placeholder={`[00:00:00] 李明: 文本内容...\n[00:01:23] 王芳: 文本内容...`}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-mono text-slate-700 bg-slate-50/40 outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 focus:bg-white resize-none leading-relaxed"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50">
              <button
                onClick={() => setDrawerOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all"
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                disabled={!form.title.trim()}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 text-white text-sm font-medium hover:from-primary-700 hover:to-primary-800 shadow-lg shadow-primary-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all inline-flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                创建并发起抽取
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
