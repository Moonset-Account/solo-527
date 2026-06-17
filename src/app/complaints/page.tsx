'use client';

import { AppShell } from '~/components/layout/AppShell';
import { trpc } from '~/app/_trpc/client';
import Link from 'next/link';
import { useState } from 'react';
import { Modal } from '~/components/ui/Modal';
import { EmptyState } from '~/components/ui/EmptyState';
import { UserAvatar } from '~/components/ui/Badges';
import { formatDateTime } from '~/lib/utils';
import { StatCard } from '~/components/ui/StatCard';
import type { ComplaintPriority, ComplaintStatus, RiskLevel } from '@prisma/client';
import { Megaphone, ShieldAlert, AlertTriangle, Plus, Bell } from 'lucide-react';

const priorityConfig: Record<ComplaintPriority, { label: string; className: string }> = {
  LOW: { label: '低', className: 'bg-gray-100 text-gray-600 rounded-sm font-display uppercase tracking-wider' },
  MEDIUM: { label: '中', className: 'bg-blue-100 text-blue-700 rounded-sm font-display uppercase tracking-wider' },
  HIGH: { label: '高', className: 'bg-warning-100 text-warning-700 rounded-sm font-display uppercase tracking-wider' },
  URGENT: { label: '紧急', className: 'bg-danger-100 text-danger-600 rounded-sm font-display uppercase tracking-wider' },
};

const statusConfig: Record<ComplaintStatus, { label: string; className: string }> = {
  OPEN: { label: '待处理', className: 'bg-danger-100 text-danger-600 rounded-sm font-display uppercase tracking-wider' },
  PROCESSING: { label: '处理中', className: 'bg-warning-100 text-warning-700 rounded-sm font-display uppercase tracking-wider' },
  RESOLVED: { label: '已解决', className: 'bg-success-100 text-success-600 rounded-sm font-display uppercase tracking-wider' },
  ESCALATED: { label: '已升级', className: 'bg-purple-100 text-purple-700 rounded-sm font-display uppercase tracking-wider' },
};

const riskLevelConfig: Record<RiskLevel, { label: string; className: string }> = {
  LOW: { label: '低', className: 'bg-green-100 text-green-700 rounded-sm font-display uppercase tracking-wider' },
  MEDIUM: { label: '中', className: 'bg-blue-100 text-blue-700 rounded-sm font-display uppercase tracking-wider' },
  HIGH: { label: '高', className: 'bg-warning-100 text-warning-700 rounded-sm font-display uppercase tracking-wider' },
  CRITICAL: { label: '严重', className: 'bg-danger-100 text-danger-600 rounded-sm font-display uppercase tracking-wider' },
};

export default function ComplaintsPage() {
  const [tab, setTab] = useState<'complaints' | 'risks'>('complaints');
  const utils = trpc.useUtils();

  const complaintsQuery = trpc.complaint.list.useQuery({});
  const risksQuery = trpc.complaint.listRisks.useQuery({});
  const projectsQuery = trpc.project.list.useQuery({});
  const usersQuery = trpc.user.list.useQuery();

  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [complaintForm, setComplaintForm] = useState({
    projectId: '', title: '', description: '', priority: 'MEDIUM' as ComplaintPriority,
    clientName: '', clientContact: '', assignedToId: '',
  });
  const createComplaint = trpc.complaint.create.useMutation({
    onSuccess: () => {
      utils.complaint.list.invalidate();
      setShowComplaintModal(false);
    },
  });
  const updateComplaintStatus = trpc.complaint.updateStatus.useMutation({
    onSuccess: () => utils.complaint.list.invalidate(),
  });

  const [showRiskModal, setShowRiskModal] = useState(false);
  const [riskForm, setRiskForm] = useState({
    projectId: '', title: '', description: '', category: '', riskLevel: 'MEDIUM' as RiskLevel, mitigation: '',
  });
  const createRisk = trpc.complaint.createRisk.useMutation({
    onSuccess: () => {
      utils.complaint.listRisks.invalidate();
      setShowRiskModal(false);
    },
  });
  const resolveRisk = trpc.complaint.resolveRisk.useMutation({
    onSuccess: () => utils.complaint.listRisks.invalidate(),
  });

  const complaints = complaintsQuery.data ?? [];
  const openComplaints = complaints.filter((c) => c.status !== 'RESOLVED');
  const bossNotified = complaints.filter((c) => c.bossNotified);

  const risks = risksQuery.data ?? [];
  const unresolvedRisks = risks.filter((r) => !r.isResolved);
  const criticalRisks = unresolvedRisks.filter((r) => r.riskLevel === 'CRITICAL' || r.riskLevel === 'HIGH');

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-900">客户投诉与合同风险</h1>
            <p className="text-sm text-gray-500 mt-1">
              高/紧急投诉自动通知装修公司老板，合同风险写入月底复盘报表
            </p>
          </div>
          {tab === 'complaints' ? (
            <button onClick={() => setShowComplaintModal(true)} className="btn-primary inline-flex items-center gap-1.5">
              <Plus className="w-4 h-4" />
              录入投诉
            </button>
          ) : (
            <button onClick={() => setShowRiskModal(true)} className="btn-primary inline-flex items-center gap-1.5">
              <Plus className="w-4 h-4" />
              录入风险
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            title="待处理投诉"
            value={openComplaints.length}
            icon={Megaphone}
            variant="dark"
          />
          <StatCard
            title="已通知老板"
            value={bossNotified.length}
            icon={Bell}
            trend="高/紧急自动通知"
          />
          <StatCard
            title="未解决合同风险"
            value={unresolvedRisks.length}
            icon={ShieldAlert}
          />
          <StatCard
            title="严重风险"
            value={criticalRisks.length}
            icon={AlertTriangle}
            variant="dark"
          />
        </div>

        <div className="card">
          <div className="flex border-b">
            <button
              onClick={() => setTab('complaints')}
              className={`px-6 py-3 text-sm font-display border-b-2 transition-colors ${
                tab === 'complaints'
                  ? 'border-navy-800 text-navy-800 font-semibold'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                <Megaphone className="w-4 h-4" />
                客户投诉 ({openComplaints.length} 待处理)
              </span>
            </button>
            <button
              onClick={() => setTab('risks')}
              className={`px-6 py-3 text-sm font-display border-b-2 transition-colors ${
                tab === 'risks'
                  ? 'border-navy-800 text-navy-800 font-semibold'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" />
                合同风险 ({unresolvedRisks.length} 未解决)
              </span>
            </button>
          </div>

          <div className="p-6">
            {tab === 'complaints' && (
              complaints.length === 0 ? (
                <EmptyState title="暂无投诉" icon={<Megaphone className="w-6 h-6 text-gray-400" />} />
              ) : (
                <div className="space-y-4">
                  {complaints.map((c) => (
                    <div key={c.id} className="border rounded-lg p-5 hover:border-primary-200">
                      <div className="flex items-start justify-between gap-6">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold badge ${priorityConfig[c.priority].className}`}>
                              {priorityConfig[c.priority].label}优先级
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold badge ${statusConfig[c.status].className}`}>
                              {statusConfig[c.status].label}
                            </span>
                            {c.bossNotified && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-sm font-display uppercase tracking-wider bg-danger-100 text-danger-600 badge">
                                <Bell className="w-3 h-3" />
                                已通知装修公司老板
                              </span>
                            )}
                          </div>
                          <h4 className="font-display font-semibold text-lg mt-2">{c.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{c.description}</p>
                          {c.resolution && (
                            <p className="text-sm bg-success-50 text-success-700 mt-3 p-3 rounded border border-success-100">
                              <strong>解决方案：</strong>{c.resolution}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500">
                            <span>
                              项目：
                              <Link href={`/projects/${c.projectId}`} className="text-primary-600 hover:underline">
                                {c.project?.code} - {c.project?.name}
                              </Link>
                            </span>
                            {c.decorationCompany && (
                              <span className="bg-gray-100 px-2 py-0.5 rounded">
                                装修公司: {c.decorationCompany.name}
                                {c.decorationCompany.bossPhone && ` (老板: ${c.decorationCompany.bossPhone})`}
                              </span>
                            )}
                            <span>客户: {c.clientName} ({c.clientContact})</span>
                            <span>创建: {formatDateTime(c.createdAt)}</span>
                            {c.resolvedAt && <span className="text-success-600">解决: {formatDateTime(c.resolvedAt)}</span>}
                            {c.notifiedAt && <span className="text-danger-600">通知老板: {formatDateTime(c.notifiedAt)}</span>}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          {c.assignedTo ? <UserAvatar name={c.assignedTo.name} role="处理人" /> : <span className="text-xs text-gray-400">未分配</span>}
                          <select
                            className="input text-xs h-8 py-0 w-28"
                            value={c.status}
                            onChange={(e) => updateComplaintStatus.mutate({ id: c.id, status: e.target.value as ComplaintStatus })}
                          >
                            <option value="OPEN">待处理</option>
                            <option value="PROCESSING">处理中</option>
                            <option value="RESOLVED">已解决</option>
                            <option value="ESCALATED">已升级</option>
                          </select>
                          {!c.bossNotified && (
                            <button
                              onClick={() => updateComplaintStatus.mutate({ id: c.id, status: c.status, notifyBoss: true })}
                              className="btn-danger text-xs py-1 inline-flex items-center gap-1"
                            >
                              <Bell className="w-3 h-3" />
                              通知老板
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {tab === 'risks' && (
              risks.length === 0 ? (
                <EmptyState title="暂无合同风险记录" description="月底复盘时可录入本月发现的合同风险" icon={<ShieldAlert className="w-6 h-6 text-gray-400" />} />
              ) : (
                <div className="overflow-auto">
                  <table className="table">
                    <thead>
                      <tr className="border-b bg-gray-50/50">
                        <th className="table-th">风险等级</th>
                        <th className="table-th">标题</th>
                        <th className="table-th">分类</th>
                        <th className="table-th">项目</th>
                        <th className="table-th">描述</th>
                        <th className="table-th">缓解措施</th>
                        <th className="table-th">报表月份</th>
                        <th className="table-th">状态</th>
                        <th className="table-th">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {risks.map((r) => (
                        <tr
                          key={r.id}
                          className={
                            !r.isResolved && (r.riskLevel === 'CRITICAL' || r.riskLevel === 'HIGH')
                              ? 'bg-danger-50 hover:bg-danger-100/50'
                              : 'hover:bg-gray-50/50'
                          }
                        >
                          <td className="table-td">
                            <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold badge ${riskLevelConfig[r.riskLevel].className}`}>
                              {riskLevelConfig[r.riskLevel].label}
                            </span>
                          </td>
                          <td className="table-td font-medium">{r.title}</td>
                          <td className="table-td text-sm text-gray-600">{r.category}</td>
                          <td className="table-td text-sm">
                            <Link href={`/projects/${r.projectId}`} className="text-primary-600 hover:underline">
                              {r.project?.code}
                            </Link>
                            <p className="text-xs text-gray-500">{r.project?.name}</p>
                          </td>
                          <td className="table-td text-sm text-gray-600 max-w-xs">{r.description}</td>
                          <td className="table-td text-sm text-gray-600 max-w-xs">{r.mitigation ?? '-'}</td>
                          <td className="table-td text-sm text-gray-500">{r.reportMonth ?? '-'}</td>
                          <td className="table-td">
                            {r.isResolved ? (
                              <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-sm font-display uppercase tracking-wider bg-success-100 text-success-600 badge">
                                已解决
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-sm font-display uppercase tracking-wider bg-warning-100 text-warning-700 badge">
                                未解决
                              </span>
                            )}
                          </td>
                          <td className="table-td">
                            {!r.isResolved && (
                              <button
                                onClick={() => resolveRisk.mutate({ id: r.id })}
                                className="btn-success text-xs py-1"
                              >
                                标记解决
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      <Modal
        title="录入客户投诉"
        open={showComplaintModal}
        onClose={() => setShowComplaintModal(false)}
        onSubmit={() => createComplaint.mutate({
          ...complaintForm,
          assignedToId: complaintForm.assignedToId || undefined,
        })}
      >
        <div>
          <label className="label">关联项目 *</label>
          <select
            className="input mt-1"
            value={complaintForm.projectId}
            onChange={(e) => setComplaintForm({ ...complaintForm, projectId: e.target.value })}
            required
          >
            <option value="">-- 选择项目 --</option>
            {projectsQuery.data?.map((p) => (
              <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">投诉标题 *</label>
          <input
            className="input mt-1"
            value={complaintForm.title}
            onChange={(e) => setComplaintForm({ ...complaintForm, title: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="label">详细描述 *</label>
          <textarea
            className="input mt-1 min-h-[80px]"
            value={complaintForm.description}
            onChange={(e) => setComplaintForm({ ...complaintForm, description: e.target.value })}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">优先级</label>
            <select
              className="input mt-1"
              value={complaintForm.priority}
              onChange={(e) => setComplaintForm({ ...complaintForm, priority: e.target.value as ComplaintPriority })}
            >
              <option value="LOW">低</option>
              <option value="MEDIUM">中</option>
              <option value="HIGH">高（自动通知装修公司老板）</option>
              <option value="URGENT">紧急（自动通知装修公司老板）</option>
            </select>
          </div>
          <div>
            <label className="label">处理人</label>
            <select
              className="input mt-1"
              value={complaintForm.assignedToId}
              onChange={(e) => setComplaintForm({ ...complaintForm, assignedToId: e.target.value })}
            >
              <option value="">-- 选择 --</option>
              {usersQuery.data?.map((u) => (
                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">客户姓名</label>
            <input
              className="input mt-1"
              value={complaintForm.clientName}
              onChange={(e) => setComplaintForm({ ...complaintForm, clientName: e.target.value })}
            />
          </div>
          <div>
            <label className="label">客户联系方式</label>
            <input
              className="input mt-1"
              value={complaintForm.clientContact}
              onChange={(e) => setComplaintForm({ ...complaintForm, clientContact: e.target.value })}
            />
          </div>
        </div>
      </Modal>

      <Modal
        title="录入合同风险（月底复盘用）"
        open={showRiskModal}
        onClose={() => setShowRiskModal(false)}
        onSubmit={() => createRisk.mutate({
          ...riskForm,
          mitigation: riskForm.mitigation || undefined,
        })}
      >
        <div>
          <label className="label">关联项目 *</label>
          <select
            className="input mt-1"
            value={riskForm.projectId}
            onChange={(e) => setRiskForm({ ...riskForm, projectId: e.target.value })}
            required
          >
            <option value="">-- 选择项目 --</option>
            {projectsQuery.data?.map((p) => (
              <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">风险标题 *</label>
          <input
            className="input mt-1"
            placeholder="如：付款条件模糊、工期违约金过高..."
            value={riskForm.title}
            onChange={(e) => setRiskForm({ ...riskForm, title: e.target.value })}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">风险分类 *</label>
            <input
              className="input mt-1"
              placeholder="如：付款、工期、质量、变更、索赔..."
              value={riskForm.category}
              onChange={(e) => setRiskForm({ ...riskForm, category: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">风险等级</label>
            <select
              className="input mt-1"
              value={riskForm.riskLevel}
              onChange={(e) => setRiskForm({ ...riskForm, riskLevel: e.target.value as RiskLevel })}
            >
              <option value="LOW">低</option>
              <option value="MEDIUM">中</option>
              <option value="HIGH">高</option>
              <option value="CRITICAL">严重</option>
            </select>
          </div>
        </div>
        <div>
          <label className="label">风险描述 *</label>
          <textarea
            className="input mt-1 min-h-[80px]"
            value={riskForm.description}
            onChange={(e) => setRiskForm({ ...riskForm, description: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="label">缓解措施</label>
          <textarea
            className="input mt-1 min-h-[60px]"
            value={riskForm.mitigation}
            onChange={(e) => setRiskForm({ ...riskForm, mitigation: e.target.value })}
          />
        </div>
      </Modal>
    </AppShell>
  );
}
