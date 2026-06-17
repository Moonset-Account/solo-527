'use client';

import { AppShell } from '~/components/layout/AppShell';
import { trpc } from '~/app/_trpc/client';
import Link from 'next/link';
import { useState } from 'react';
import { BudgetAlertBadge, BudgetBar, UserAvatar } from '~/components/ui/Badges';
import { formatCurrency, formatDateTime } from '~/lib/utils';
import { EmptyState } from '~/components/ui/EmptyState';
import { Modal } from '~/components/ui/Modal';
import { StatCard } from '~/components/ui/StatCard';
import { Plus, AlertTriangle, BarChart3, TrendingUp, Eye, CheckCircle2 } from 'lucide-react';

export default function BudgetPage() {
  const utils = trpc.useUtils();
  const projectsQuery = trpc.project.list.useQuery({});
  const budgetChangesQuery = trpc.phase.listAllBudgetChanges.useQuery();
  const usersQuery = trpc.user.list.useQuery();

  const [showModal, setShowModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [form, setForm] = useState({
    newBudget: '', reason: '', responsibleId: '', remark: '',
  });

  const recordBudgetChange = trpc.phase.recordBudgetChange.useMutation({
    onSuccess: () => {
      utils.project.list.invalidate();
      utils.phase.listAllBudgetChanges.invalidate();
      setShowModal(false);
      setForm({ newBudget: '', reason: '', responsibleId: '', remark: '' });
      setSelectedProject('');
    },
  });

  const projects = projectsQuery.data ?? [];
  const abnormalProjects = projects.filter((p) => p.budgetAlertLevel !== 'NORMAL');
  const changes = budgetChangesQuery.data ?? [];
  const abnormalChanges = changes.filter((c) => c.isAbnormal);

  const warningCount = abnormalProjects.filter((p) => p.budgetAlertLevel === 'WARNING').length;
  const criticalCount = abnormalProjects.filter((p) => p.budgetAlertLevel === 'CRITICAL').length;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-900">预算监控与异常追踪</h1>
            <p className="text-sm text-gray-500 mt-1">实时监控项目预算使用情况，异常时定位责任人</p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary inline-flex items-center gap-1.5">
            <Plus className="w-4 h-4" />
            记录预算变更
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            title="监控项目总数"
            value={projects.length}
            icon={BarChart3}
            trend="全量预算监控"
          />
          <StatCard
            title="预算预警项目"
            value={warningCount}
            icon={AlertTriangle}
            trend={warningCount > 0 ? '需关注' : '状态良好'}
          />
          <StatCard
            title="预算超支项目"
            value={criticalCount}
            icon={TrendingUp}
            trend={criticalCount > 0 ? '需立即处理' : '无超支'}
          />
          <StatCard
            title="累计异常变更"
            value={abnormalChanges.length}
            icon={AlertTriangle}
            trend="全周期统计"
          />
        </div>

        <div className="card">
          <div className="p-4 border-b">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning-600" />
              <h3 className="font-display font-semibold text-gray-900">预算异常项目列表</h3>
            </div>
            <p className="text-xs text-gray-500 mt-0.5 ml-6">点击项目查看详细变更记录和责任人</p>
          </div>
          <div className="overflow-auto">
            {abnormalProjects.length === 0 ? (
              <EmptyState title="当前无预算异常项目" icon={<CheckCircle2 className="w-6 h-6 text-success-500" />} />
            ) : (
              <table className="table">
                <thead>
                  <tr className="border-b bg-gray-50/50">
                    <th className="table-th">项目</th>
                    <th className="table-th">客户</th>
                    <th className="table-th w-64">预算执行进度</th>
                    <th className="table-th">预警等级</th>
                    <th className="table-th">最近异常变更</th>
                    <th className="table-th">责任人</th>
                    <th className="table-th">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {abnormalProjects.map((p) => {
                    const lastAbnormal = p.budgetChanges[0];
                    return (
                      <tr
                        key={p.id}
                        className={
                          p.budgetAlertLevel === 'CRITICAL'
                            ? 'bg-danger-50 hover:bg-danger-100/50'
                            : 'bg-warning-50 hover:bg-warning-100/50'
                        }
                      >
                        <td className="table-td">
                          <Link href={`/projects/${p.id}`} className="font-medium hover:text-primary-600">
                            {p.name}
                          </Link>
                          <p className="text-xs text-gray-500">{p.code}</p>
                        </td>
                        <td className="table-td text-sm">{p.clientName}</td>
                        <td className="table-td">
                          <BudgetBar
                            usedPercent={p.budgetUsedPercent}
                            amount={p.actualCost.toNumber()}
                            budget={p.totalBudget.toNumber()}
                          />
                        </td>
                        <td className="table-td"><BudgetAlertBadge level={p.budgetAlertLevel} /></td>
                        <td className="table-td text-sm">
                          {lastAbnormal ? (
                            <div>
                              <p className={
                                lastAbnormal.changeAmount.toNumber() > 0
                                  ? 'text-danger-600 font-display font-bold'
                                  : 'text-success-600 font-display font-bold'
                              }>
                                {lastAbnormal.changeAmount.toNumber() > 0 ? '+' : ''}{formatCurrency(lastAbnormal.changeAmount.toNumber())}
                              </p>
                              <p className="text-xs text-gray-500">{lastAbnormal.reason}</p>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="table-td">
                          {lastAbnormal?.responsible ? (
                            <UserAvatar name={lastAbnormal.responsible.name} />
                          ) : (
                            <span className="text-gray-400 text-sm">未指定</span>
                          )}
                        </td>
                        <td className="table-td">
                          <Link
                            href={`/projects/${p.id}?tab=budget`}
                            className="inline-flex items-center gap-1 btn-secondary text-xs py-1"
                          >
                            <Eye className="w-3 h-3" />
                            查看详情
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="card">
          <div className="p-4 border-b">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-gray-600" />
              <h3 className="font-display font-semibold text-gray-900">预算变更历史（异常高亮）</h3>
            </div>
          </div>
          <div className="overflow-auto">
            {changes.length === 0 ? (
              <EmptyState title="暂无预算变更记录" icon={<BarChart3 className="w-6 h-6 text-gray-400" />} />
            ) : (
              <table className="table">
                <thead>
                  <tr className="border-b bg-gray-50/50">
                    <th className="table-th">时间</th>
                    <th className="table-th">项目</th>
                    <th className="table-th">原预算</th>
                    <th className="table-th">新预算</th>
                    <th className="table-th">变动金额</th>
                    <th className="table-th">变动率</th>
                    <th className="table-th">原因</th>
                    <th className="table-th">预警</th>
                    <th className="table-th">责任人</th>
                    <th className="table-th">记录人</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {changes.map((c) => (
                    <tr
                      key={c.id}
                      className={
                        c.isAbnormal
                          ? c.alertLevel === 'CRITICAL'
                            ? 'bg-danger-50 hover:bg-danger-100/50'
                            : 'bg-warning-50 hover:bg-warning-100/50'
                          : 'hover:bg-gray-50/50'
                      }
                    >
                      <td className="table-td text-sm text-gray-500">{formatDateTime(c.createdAt)}</td>
                      <td className="table-td text-sm">
                        <Link href={`/projects/${c.projectId}`} className="text-primary-600 hover:underline">
                          {c.project?.name}
                        </Link>
                      </td>
                      <td className="table-td text-sm">{formatCurrency(c.oldBudget.toNumber())}</td>
                      <td className="table-td text-sm font-medium">{formatCurrency(c.newBudget.toNumber())}</td>
                      <td className={
                        c.changeAmount.toNumber() > 0
                          ? 'table-td font-display font-bold text-danger-600'
                          : 'table-td font-display font-bold text-success-600'
                      }>
                        {c.changeAmount.toNumber() > 0 ? '+' : ''}{formatCurrency(c.changeAmount.toNumber())}
                      </td>
                      <td className={`table-td text-sm ${Math.abs(c.changePercent) > 10 ? 'text-danger-600 font-medium' : ''}`}>
                        {c.changePercent > 0 ? '+' : ''}{c.changePercent.toFixed(2)}%
                      </td>
                      <td className="table-td text-sm">
                        {c.isAbnormal && (
                          <span className="inline-flex items-center rounded-sm bg-danger-100 text-danger-600 px-1.5 py-0.5 text-[10px] font-display font-semibold uppercase tracking-wider mr-1">
                            异常
                          </span>
                        )}
                        {c.reason}
                      </td>
                      <td className="table-td"><BudgetAlertBadge level={c.alertLevel} /></td>
                      <td className="table-td"><UserAvatar name={c.responsible?.name} /></td>
                      <td className="table-td"><UserAvatar name={c.createdBy?.name} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <Modal
        title="记录预算变更"
        open={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={() => selectedProject && recordBudgetChange.mutate({
          projectId: selectedProject,
          newBudget: parseFloat(form.newBudget),
          reason: form.reason,
          responsibleId: form.responsibleId || undefined,
          remark: form.remark || undefined,
        })}
      >
        <div>
          <label className="label">选择项目 *</label>
          <select
            className="input mt-1"
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            required
          >
            <option value="">-- 选择项目 --</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} - {p.name} (当前: {formatCurrency(p.totalBudget.toNumber())})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">新预算金额 (元) *</label>
          <input
            type="number"
            className="input mt-1"
            value={form.newBudget}
            onChange={(e) => setForm({ ...form, newBudget: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="label">变更原因 *</label>
          <input
            className="input mt-1"
            placeholder="如：增项确认、客户需求变更、材料价格上涨..."
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="label">责任人（异常时可追溯）</label>
          <select
            className="input mt-1"
            value={form.responsibleId}
            onChange={(e) => setForm({ ...form, responsibleId: e.target.value })}
          >
            <option value="">-- 选择责任人 --</option>
            {usersQuery.data?.map((u) => (
              <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">备注</label>
          <input
            className="input mt-1"
            value={form.remark}
            onChange={(e) => setForm({ ...form, remark: e.target.value })}
          />
        </div>
      </Modal>
    </AppShell>
  );
}
