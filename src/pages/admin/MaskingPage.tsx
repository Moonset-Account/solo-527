import { useState } from 'react';
import {
  Shield,
  Plus,
  Search,
  Power,
  Edit3,
  Trash2,
  Save,
  X,
  Code2,
  Type,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { mockMaskingRules } from '@/lib/mockData';
import type { MaskingRule } from '#shared/types';
import { cn } from '@/lib/utils';

export default function MaskingPage() {
  const [rules, setRules] = useState<MaskingRule[]>(mockMaskingRules);
  const [search, setSearch] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [editing, setEditing] = useState<MaskingRule | null>(null);
  const [form, setForm] = useState<Partial<MaskingRule>>({
    name: '',
    type: 'regex',
    pattern: '',
    replacement: '',
    enabled: true,
  });

  const filtered = rules.filter((r) =>
    [r.name, r.pattern, r.replacement].some((v) =>
      v.toLowerCase().includes(search.toLowerCase())
    )
  );

  const toggleRule = (id: string) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  };

  const deleteRule = (id: string) => {
    if (confirm('确定删除该脱敏规则吗？')) {
      setRules((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const openEdit = (r: MaskingRule) => {
    setEditing(r);
    setForm({ ...r });
  };

  const handleSave = () => {
    if (!form.name?.trim() || !form.pattern?.trim()) return;
    if (editing) {
      setRules((prev) => prev.map((r) => (r.id === editing.id ? { ...r, ...form } as MaskingRule : r)));
      setEditing(null);
    } else {
      const newRule: MaskingRule = {
        id: `mr${Date.now()}`,
        name: form.name!,
        type: form.type as 'regex' | 'keyword',
        pattern: form.pattern!,
        replacement: form.replacement || '[MASKED]',
        enabled: !!form.enabled,
      };
      setRules([...rules, newRule]);
      setShowNew(false);
    }
    setForm({ name: '', type: 'regex', pattern: '', replacement: '', enabled: true });
  };

  const enabledCount = rules.filter((r) => r.enabled).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">脱敏规则管理</h1>
          <p className="text-sm text-slate-500 mt-1">
            配置正则/关键字脱敏 · 已启用 <span className="font-semibold text-emerald-600">{enabledCount}</span> / 共 {rules.length} 条规则
          </p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 text-white text-sm font-medium hover:from-primary-700 hover:to-primary-800 shadow-lg shadow-primary-500/25 transition-all"
        >
          <Plus className="h-4.5 w-4.5" />
          新建规则
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-emerald-700">{enabledCount}</div>
              <div className="text-xs text-slate-500 mt-1">已启用规则</div>
            </div>
            <CheckCircle2 className="h-10 w-10 text-emerald-500 opacity-80" />
          </div>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-rose-50 to-white border border-rose-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-rose-600">{rules.length - enabledCount}</div>
              <div className="text-xs text-slate-500 mt-1">已停用规则</div>
            </div>
            <AlertTriangle className="h-10 w-10 text-rose-500 opacity-80" />
          </div>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-violet-50 to-white border border-violet-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-violet-700">
                {rules.filter((r) => r.type === 'regex').length} / {rules.filter((r) => r.type === 'keyword').length}
              </div>
              <div className="text-xs text-slate-500 mt-1">正则 / 关键字</div>
            </div>
            <Shield className="h-10 w-10 text-violet-500 opacity-80" />
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white shadow-sm shadow-slate-200/60 border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索规则名称、模式或替换文本..."
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 bg-slate-50/50 text-sm outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 focus:bg-white transition-all"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5 text-left font-medium">规则名称</th>
                <th className="px-5 py-3.5 text-left font-medium">类型</th>
                <th className="px-5 py-3.5 text-left font-medium">匹配模式</th>
                <th className="px-5 py-3.5 text-left font-medium">替换为</th>
                <th className="px-5 py-3.5 text-center font-medium">状态</th>
                <th className="px-5 py-3.5 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((r) => (
                <tr key={r.id} className={cn('hover:bg-slate-50/60 transition-colors', !r.enabled && 'opacity-60 bg-slate-50/30')}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'h-9 w-9 rounded-xl flex items-center justify-center shadow-sm',
                        r.type === 'regex'
                          ? 'bg-gradient-to-br from-violet-500 to-purple-700'
                          : 'bg-gradient-to-br from-amber-500 to-orange-600'
                      )}>
                        {r.type === 'regex' ? (
                          <Code2 className="h-4 w-4 text-white" />
                        ) : (
                          <Type className="h-4 w-4 text-white" />
                        )}
                      </div>
                      <div className="font-semibold text-slate-800">{r.name}</div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={cn(
                      'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold',
                      r.type === 'regex'
                        ? 'bg-violet-100 text-violet-700'
                        : 'bg-amber-100 text-amber-700'
                    )}>
                      {r.type === 'regex' ? '正则表达式' : '关键字'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <code className="inline-block max-w-[280px] truncate px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-mono" title={r.pattern}>
                      {r.pattern}
                    </code>
                  </td>
                  <td className="px-5 py-4">
                    <code className="inline-block px-3 py-1.5 rounded-lg bg-primary-50 text-primary-700 text-xs font-mono">
                      {r.replacement}
                    </code>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <button
                      onClick={() => toggleRule(r.id)}
                      className={cn(
                        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                        r.enabled ? 'bg-emerald-500' : 'bg-slate-300'
                      )}
                    >
                      <span
                        className={cn(
                          'inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform',
                          r.enabled ? 'translate-x-5' : 'translate-x-0.5'
                        )}
                      />
                    </button>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openEdit(r)}
                        className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-slate-500 hover:bg-primary-50 hover:text-primary-700 transition-all"
                        title="编辑"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteRule(r.id)}
                        className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-all"
                        title="删除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-slate-400 text-sm">
                    <Shield className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    没有匹配的脱敏规则
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-violet-50/60 to-transparent">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-white shadow-md">
                  <Shield className="h-4.5 w-4.5" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">
                  {editing ? '编辑脱敏规则' : '新建脱敏规则'}
                </h3>
              </div>
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
                <label className="block text-sm font-medium text-slate-700 mb-1.5">规则名称 *</label>
                <input
                  value={form.name || ''}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="例如：手机号脱敏"
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">规则类型</label>
                <div className="grid grid-cols-2 gap-3">
                  {(['regex', 'keyword'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setForm({ ...form, type: t })}
                      className={cn(
                        'h-11 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition-all',
                        form.type === t
                          ? t === 'regex'
                            ? 'border-violet-400 bg-violet-50 text-violet-700 ring-4 ring-violet-500/10'
                            : 'border-amber-400 bg-amber-50 text-amber-700 ring-4 ring-amber-500/10'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      )}
                    >
                      {t === 'regex' ? <Code2 className="h-4 w-4" /> : <Type className="h-4 w-4" />}
                      {t === 'regex' ? '正则表达式' : '关键字'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">匹配模式 *</label>
                <input
                  value={form.pattern || ''}
                  onChange={(e) => setForm({ ...form, pattern: e.target.value })}
                  placeholder={form.type === 'regex' ? '例如：1[3-9]\\d{9}' : '例如：ProjectX'}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm font-mono outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">替换为</label>
                <input
                  value={form.replacement || ''}
                  onChange={(e) => setForm({ ...form, replacement: e.target.value })}
                  placeholder="例如：[PHONE]（默认 [MASKED]）"
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm font-mono outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10"
                />
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer p-3 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-all">
                <input
                  type="checkbox"
                  checked={!!form.enabled}
                  onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
                  className="h-4 w-4 rounded text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <div className="text-sm font-medium text-slate-800">创建后立即启用</div>
                  <div className="text-[11px] text-slate-500">关闭则保存为草稿</div>
                </div>
                <div className="flex-1" />
                <Power className={cn('h-4 w-4', form.enabled ? 'text-emerald-500' : 'text-slate-400')} />
              </label>
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
                disabled={!form.name?.trim() || !form.pattern?.trim()}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 text-white text-sm font-medium hover:from-primary-700 hover:to-primary-800 shadow-lg shadow-primary-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all inline-flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                保存规则
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
