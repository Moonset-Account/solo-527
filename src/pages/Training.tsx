import { useState } from 'react';
import {
  Plus,
  BrainCircuit,
  Save,
  Play,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Power,
  Sparkles,
  X,
  TrendingUp,
  Target,
  History,
} from 'lucide-react';
import { mockModelVersions } from '@/lib/mockData';
import type { ModelVersion } from '#shared/types';
import { cn } from '@/lib/utils';

const statusConfig: Record<ModelVersion['status'], { label: string; cls: string; icon: typeof Play }> = {
  pending: { label: '待启动', cls: 'bg-slate-100 text-slate-700 ring-slate-200', icon: History },
  running: { label: '训练中', cls: 'bg-blue-100 text-blue-700 ring-blue-200 animate-pulse', icon: Loader2 },
  ready: { label: '已就绪', cls: 'bg-emerald-100 text-emerald-700 ring-emerald-200', icon: CheckCircle2 },
  failed: { label: '失败', cls: 'bg-rose-100 text-rose-700 ring-rose-200', icon: AlertCircle },
};

export default function Training() {
  const [models, setModels] = useState<ModelVersion[]>(mockModelVersions);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({
    name: 'v1.3.0',
    baseModel: 'gpt-4o-mini-2024-07-18',
    dataset: 'dataset-v2026-06',
    epochs: 3,
    lr: '1e-4',
  });

  const handleToggleActive = (id: string) => {
    setModels((prev) =>
      prev.map((m) =>
        m.id === id
          ? { ...m, isActive: !m.isActive }
          : m.isActive && models.find((mm) => mm.id === id)?.isActive === false
          ? { ...m, isActive: false }
          : m
      )
    );
  };

  const handleStartTraining = () => {
    const newModel: ModelVersion = {
      id: `mv${Date.now()}`,
      name: form.name,
      baseModel: form.baseModel,
      status: 'running',
      isActive: false,
      createdAt: new Date().toISOString(),
    };
    setModels([newModel, ...models]);
    setShowNew(false);
    setForm({ name: `v${Math.floor(Math.random() * 2)}.${Math.floor(Math.random() * 5)}.${Math.floor(Math.random() * 10)}`, baseModel: 'gpt-4o-mini-2024-07-18', dataset: 'dataset-v2026-06', epochs: 3, lr: '1e-4' });
    setTimeout(() => {
      setModels((ms) =>
        ms.map((m) =>
          m.id === newModel.id
            ? { ...m, status: 'ready', metrics: { precision: 0.912, recall: 0.887, f1: 0.899 } }
            : m
        )
      );
    }, 8000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">模型训练</h1>
          <p className="text-sm text-slate-500 mt-1">
            管理 Fine-tuning 任务 · 当前激活模型：
            <span className="ml-1 font-semibold text-emerald-600">
              {models.find((m) => m.isActive)?.name || '-'}
            </span>
          </p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 text-white text-sm font-medium hover:from-primary-700 hover:to-primary-800 shadow-lg shadow-primary-500/25 transition-all"
        >
          <Plus className="h-4.5 w-4.5" />
          发起 Fine-tuning
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5">
        {[
          { label: '模型版本数', value: models.length, unit: '个', icon: BrainCircuit, gradient: 'from-blue-500 to-primary-700' },
          { label: '当前最佳 F1', value: `${(Math.max(...models.map((m) => m.metrics?.f1 || 0)) * 100).toFixed(1)}%`, icon: Target, gradient: 'from-emerald-500 to-teal-600' },
          { label: '累计训练', value: '147.5h', icon: History, gradient: 'from-accent-500 to-orange-600' },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm shadow-slate-200/60 border border-slate-100 hover:shadow-md transition-all">
              <div className={cn('absolute -right-6 -top-6 h-28 w-28 rounded-full opacity-10 bg-gradient-to-br', s.gradient)} />
              <div className="relative flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500">{s.label}</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900 tracking-tight">
                    {s.value}
                    <span className="text-base font-normal text-slate-400 ml-1">{s.unit || ''}</span>
                  </p>
                </div>
                <div className={cn('h-11 w-11 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-lg shadow-slate-900/10 group-hover:scale-110 transition-transform', s.gradient)}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl bg-white shadow-sm shadow-slate-200/60 border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5 text-left font-medium">版本 / Base Model</th>
                <th className="px-5 py-3.5 text-left font-medium">状态</th>
                <th className="px-5 py-3.5 text-left font-medium">激活</th>
                <th className="px-5 py-3.5 text-left font-medium">指标 (P / R / F1)</th>
                <th className="px-5 py-3.5 text-left font-medium">创建时间</th>
                <th className="px-5 py-3.5 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {models.map((m) => {
                const sc = statusConfig[m.status];
                const StatusIcon = sc.icon;
                return (
                  <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'h-10 w-10 rounded-xl flex items-center justify-center shadow-sm',
                          m.status === 'ready'
                            ? 'bg-gradient-to-br from-emerald-500 to-emerald-700'
                            : m.status === 'running'
                            ? 'bg-gradient-to-br from-blue-500 to-primary-700'
                            : m.status === 'failed'
                            ? 'bg-gradient-to-br from-rose-500 to-rose-700'
                            : 'bg-gradient-to-br from-slate-400 to-slate-600'
                        )}>
                          <BrainCircuit className="h-5 w-5 text-white" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-800 flex items-center gap-2">
                            {m.name}
                            {m.isActive && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                                <Power className="h-2.5 w-2.5" />
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5 font-mono truncate max-w-[280px]">
                            {m.baseModel}
                          </div>
                          {m.openaiFinetuneId && (
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                              {m.openaiFinetuneId}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={cn(
                        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset',
                        sc.cls
                      )}>
                        <StatusIcon className={cn('h-3.5 w-3.5', m.status === 'running' && 'animate-spin')} />
                        {sc.label}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => handleToggleActive(m.id)}
                        disabled={m.status !== 'ready'}
                        className={cn(
                          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
                          m.isActive ? 'bg-emerald-500' : 'bg-slate-200'
                        )}
                      >
                        <span
                          className={cn(
                            'inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform',
                            m.isActive ? 'translate-x-5' : 'translate-x-0.5'
                          )}
                        />
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      {m.metrics ? (
                        <div className="flex items-center gap-2.5">
                          <div className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-md bg-blue-50 text-blue-700 font-medium">
                            <Target className="h-3 w-3" />
                            P {(m.metrics.precision! * 100).toFixed(1)}
                          </div>
                          <div className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-md bg-violet-50 text-violet-700 font-medium">
                            <TrendingUp className="h-3 w-3" />
                            R {(m.metrics.recall! * 100).toFixed(1)}
                          </div>
                          <div className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-md bg-accent-50 text-accent-700 font-bold">
                            <Sparkles className="h-3 w-3" />
                            F1 {(m.metrics.f1! * 100).toFixed(1)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-600 font-mono">
                      {new Date(m.createdAt).toLocaleString('zh-CN')}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {m.status === 'failed' && (
                          <button className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs font-medium hover:bg-rose-100 transition-all">
                            <Play className="h-3 w-3" />
                            重试
                          </button>
                        )}
                        {m.status === 'ready' && (
                          <>
                            <button className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary-50 text-primary-700 border border-primary-200 text-xs font-medium hover:bg-primary-100 transition-all">
                              <Save className="h-3 w-3" />
                              下载
                            </button>
                            <button
                              onClick={() => handleToggleActive(m.id)}
                              className={cn(
                                'inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border',
                                m.isActive
                                  ? 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              )}
                            >
                              <Power className="h-3 w-3" />
                              {m.isActive ? '停用' : '激活'}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setShowNew(false)}
          />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-primary-50/60 to-transparent">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white shadow-md">
                  <Sparkles className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">发起 Fine-tuning 任务</h3>
                  <p className="text-xs text-slate-500">配置训练参数并启动</p>
                </div>
              </div>
              <button
                onClick={() => setShowNew(false)}
                className="h-9 w-9 rounded-lg text-slate-500 hover:bg-slate-100 flex items-center justify-center"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">版本名称</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">数据集</label>
                  <select
                    value={form.dataset}
                    onChange={(e) => setForm({ ...form, dataset: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10"
                  >
                    <option>dataset-v2026-06 (1248 条)</option>
                    <option>dataset-v2026-05 (986 条)</option>
                    <option>dataset-v2026-04-full (2415 条)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Base Model</label>
                <select
                  value={form.baseModel}
                  onChange={(e) => setForm({ ...form, baseModel: e.target.value })}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 font-mono"
                >
                  <option>gpt-4o-mini-2024-07-18</option>
                  <option>gpt-4o-2024-08-06</option>
                  <option>gpt-3.5-turbo-1106</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">训练轮数 Epochs</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={form.epochs}
                    onChange={(e) => setForm({ ...form, epochs: parseInt(e.target.value) || 3 })}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">学习率 LR</label>
                  <select
                    value={form.lr}
                    onChange={(e) => setForm({ ...form, lr: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 font-mono"
                  >
                    <option>1e-4</option>
                    <option>5e-5</option>
                    <option>2e-5</option>
                    <option>1e-5</option>
                  </select>
                </div>
              </div>
              <div className="rounded-xl bg-amber-50 border border-amber-200/60 p-3.5 text-xs text-amber-800 flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <div>
                  Fine-tuning 任务通常需要 30 分钟 ~ 2 小时完成，费用约 $5-20。完成后会自动出现在上方列表，可手动切换激活版本。
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowNew(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-100 transition-all"
              >
                取消
              </button>
              <button
                onClick={handleStartTraining}
                disabled={!form.name.trim()}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 text-white text-sm font-medium hover:from-primary-700 hover:to-primary-800 shadow-lg shadow-primary-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all inline-flex items-center gap-2"
              >
                <Play className="h-4 w-4" />
                开始训练
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
