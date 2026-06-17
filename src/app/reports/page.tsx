'use client';

import { AppShell } from '~/components/layout/AppShell';
import { trpc } from '~/app/_trpc/client';
import Link from 'next/link';
import { useState } from 'react';
import { EmptyState } from '~/components/ui/EmptyState';
import { StatCard } from '~/components/ui/StatCard';
import type { RiskLevel } from '@prisma/client';
import {
  FileText,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Megaphone,
  Bell,
} from 'lucide-react';

const riskLevelConfig: Record<RiskLevel, { label: string; className: string }> = {
  LOW: { label: '低', className: 'bg-success-100 text-success-600' },
  MEDIUM: { label: '中', className: 'bg-blue-100 text-blue-700' },
  HIGH: { label: '高', className: 'bg-warning-100 text-warning-700' },
  CRITICAL: { label: '严重', className: 'bg-danger-100 text-danger-600' },
};

const riskBlockStyle: Record<RiskLevel, string> = {
  CRITICAL: 'bg-danger-50 border-danger-200',
  HIGH: 'bg-warning-50 border-warning-200',
  MEDIUM: 'bg-blue-50 border-blue-200',
  LOW: 'bg-success-50 border-success-200',
};

export default function ReportsPage() {
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [month, setMonth] = useState(defaultMonth);

  const reportQuery = trpc.complaint.getMonthlyReport.useQuery({ month });
  const report = reportQuery.data;

  const months = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-navy-900 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-brand-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold font-display text-navy-900">月度复盘报表</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  合同风险汇总、投诉处理统计、预算异常分析，供月底复盘使用
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-600">月份</label>
            <select
              className="input w-40"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            >
              {months.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        {reportQuery.isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            <span className="ml-3 text-sm text-gray-500">加载中...</span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard
                title="监控项目总数"
                value={(report?.projectStats as any)?.[0]?.total ?? 0}
                icon={FileText}
                variant="dark"
              />
              <StatCard
                title="预算异常项目"
                value={(report?.projectStats as any)?.[0]?.abnormal_budget ?? 0}
                icon={AlertTriangle}
                variant="dark"
              />
              <StatCard
                title="本月投诉总数"
                value={(report?.complaintsStats as any)?.[0]?.total ?? 0}
                icon={Megaphone}
                variant="dark"
                trend={`待处理: ${(report?.complaintsStats as any)?.[0]?.open ?? 0} | 处理中: ${(report?.complaintsStats as any)?.[0]?.processing ?? 0} | 已解决: ${(report?.complaintsStats as any)?.[0]?.resolved ?? 0}`}
              />
              <StatCard
                title="通知装修公司老板"
                value={(report?.complaintsStats as any)?.[0]?.boss_notified ?? 0}
                icon={Bell}
                variant="dark"
                trend="高/紧急投诉自动通知"
              />
            </div>

            <div className="card">
              <div className="p-4 border-b bg-gray-50/50">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-danger-500" />
                  <h3 className="font-semibold font-display text-navy-900">合同风险汇总（本月报表）</h3>
                </div>
                <p className="text-xs text-gray-500 mt-0.5 ml-6">月底复盘重点关注项</p>
              </div>
              <div className="p-6">
                {!report || report.risks.length === 0 ? (
                  <EmptyState
                    title="本月暂无合同风险记录"
                    icon={<CheckCircle2 className="w-12 h-12 text-success-400" />}
                    description="保持良好！"
                  />
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-4 gap-4">
                      {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as RiskLevel[]).map((level) => (
                        <div
                          key={level}
                          className={`p-4 rounded-lg border ${riskBlockStyle[level]}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`rounded-sm font-display uppercase tracking-wider text-xs px-2 py-0.5 ${riskLevelConfig[level].className}`}>
                              {riskLevelConfig[level].label}
                            </span>
                            <span className="text-2xl font-bold font-display text-navy-900">
                              {report.risks.filter((r) => r.riskLevel === level).length}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">条风险</p>
                        </div>
                      ))}
                    </div>

                    <div className="overflow-auto mt-6">
                      <table className="table">
                        <thead>
                          <tr className="border-b bg-gray-50/50">
                            <th className="table-th">等级</th>
                            <th className="table-th">分类</th>
                            <th className="table-th">标题</th>
                            <th className="table-th">项目</th>
                            <th className="table-th">描述</th>
                            <th className="table-th">缓解措施</th>
                            <th className="table-th">状态</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {report.risks.map((r) => (
                            <tr
                              key={r.id}
                              className={!r.isResolved && (r.riskLevel === 'CRITICAL' || r.riskLevel === 'HIGH') ? 'bg-danger-50' : ''}
                            >
                              <td className="table-td">
                                <span className={`rounded-sm font-display uppercase tracking-wider text-xs px-2 py-0.5 ${riskLevelConfig[r.riskLevel].className}`}>
                                  {riskLevelConfig[r.riskLevel].label}
                                </span>
                              </td>
                              <td className="table-td text-sm">{r.category}</td>
                              <td className="table-td font-medium">{r.title}</td>
                              <td className="table-td text-sm">
                                <Link href={`/projects/${r.projectId}`} className="text-primary-600 hover:underline">
                                  {r.project?.code} - {r.project?.name}
                                </Link>
                              </td>
                              <td className="table-td text-sm text-gray-600 max-w-sm">{r.description}</td>
                              <td className="table-td text-sm text-gray-600 max-w-sm">{r.mitigation ?? '-'}</td>
                              <td className="table-td">
                                {r.isResolved ? (
                                  <span className="rounded-sm font-display uppercase tracking-wider text-xs px-2 py-0.5 bg-success-100 text-success-600">已解决</span>
                                ) : (
                                  <span className="rounded-sm font-display uppercase tracking-wider text-xs px-2 py-0.5 bg-warning-100 text-warning-700">未解决</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="card">
              <div className="p-4 border-b bg-gray-50/50">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-navy-600" />
                  <h3 className="font-semibold font-display text-navy-900">月底复盘建议</h3>
                </div>
              </div>
              <div className="p-6">
                <ol className="space-y-4 text-sm text-gray-600">
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-sm bg-navy-100 text-navy-700 flex items-center justify-center text-xs font-display font-bold">1</span>
                    <span>
                      检查 <Link href="/budget" className="text-primary-600 hover:underline inline-flex items-center gap-1">预算异常项目<ArrowRight className="w-3 h-3" /></Link>，
                      确认责任人已采取纠正措施
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-sm bg-navy-100 text-navy-700 flex items-center justify-center text-xs font-display font-bold">2</span>
                    <span>
                      跟进 <Link href="/complaints" className="text-primary-600 hover:underline inline-flex items-center gap-1">未解决投诉<ArrowRight className="w-3 h-3" /></Link>，
                      高优先级需通知装修公司老板
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-sm bg-navy-100 text-navy-700 flex items-center justify-center text-xs font-display font-bold">3</span>
                    <span>
                      确认所有 <Link href="/phases" className="text-primary-600 hover:underline inline-flex items-center gap-1">项目阶段<ArrowRight className="w-3 h-3" /></Link> 是否
                      与实际进度一致
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-sm bg-navy-100 text-navy-700 flex items-center justify-center text-xs font-display font-bold">4</span>
                    <span>
                      审核 <Link href="/quotations" className="text-primary-600 hover:underline inline-flex items-center gap-1">未确认的报价和增项<ArrowRight className="w-3 h-3" /></Link>，
                      避免财务风险
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-sm bg-navy-100 text-navy-700 flex items-center justify-center text-xs font-display font-bold">5</span>
                    <span>
                      汇总本月合同风险教训，更新模板或流程以规避下月同类风险
                    </span>
                  </li>
                </ol>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
