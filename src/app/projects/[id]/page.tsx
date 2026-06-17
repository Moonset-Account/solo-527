'use client';

import { AppShell } from '~/components/layout/AppShell';
import { trpc } from '~/app/_trpc/client';
import { useState } from 'react';
import Link from 'next/link';
import { BudgetAlertBadge, BudgetBar, StatusBadge, UserAvatar } from '~/components/ui/Badges';
import { formatCurrency, formatDate, formatDateTime } from '~/lib/utils';
import { Modal } from '~/components/ui/Modal';
import { EmptyState } from '~/components/ui/EmptyState';
import { type ProjectStatus, type InspectionStatus, type AcceptanceStatus, type ComplaintPriority, type ComplaintStatus, type RiskLevel, ExtraItemStatus, QuotationStatus } from '@prisma/client';
import {
  ClipboardList,
  Receipt,
  RefreshCw,
  Search,
  BarChart3,
  Megaphone,
  ShieldAlert,
  ScrollText,
  Plus,
  Check,
  X,
  CheckCircle,
  Bell,
  Eye,
  ArrowRight,
  FileText,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';

type TabKey = 'overview' | 'quotations' | 'phases' | 'inspection' | 'budget' | 'complaints' | 'risks' | 'history';

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'overview', label: '基本信息', icon: <ClipboardList className="w-4 h-4" /> },
  { key: 'quotations', label: '报价/增项', icon: <Receipt className="w-4 h-4" /> },
  { key: 'phases', label: '阶段', icon: <RefreshCw className="w-4 h-4" /> },
  { key: 'inspection', label: '巡检/验收/方案', icon: <Search className="w-4 h-4" /> },
  { key: 'budget', label: '预算变更', icon: <BarChart3 className="w-4 h-4" /> },
  { key: 'complaints', label: '客户投诉', icon: <Megaphone className="w-4 h-4" /> },
  { key: 'risks', label: '合同风险', icon: <ShieldAlert className="w-4 h-4" /> },
  { key: 'history', label: '历史对比', icon: <ScrollText className="w-4 h-4" /> },
];

const inspectionStatusConfig: Record<InspectionStatus, { label: string; className: string }> = {
  PENDING: { label: '待巡检', className: 'bg-warning-100 text-warning-700 rounded-sm font-display uppercase tracking-wider' },
  IN_PROGRESS: { label: '巡检中', className: 'bg-blue-100 text-blue-700 rounded-sm font-display uppercase tracking-wider' },
  COMPLETED: { label: '已完成', className: 'bg-success-100 text-success-600 rounded-sm font-display uppercase tracking-wider' },
  FAILED: { label: '不通过', className: 'bg-danger-100 text-danger-600 rounded-sm font-display uppercase tracking-wider' },
};

const acceptanceStatusConfig: Record<AcceptanceStatus, { label: string; className: string }> = {
  PENDING: { label: '待验收', className: 'bg-warning-100 text-warning-700 rounded-sm font-display uppercase tracking-wider' },
  PASSED: { label: '已通过', className: 'bg-success-100 text-success-600 rounded-sm font-display uppercase tracking-wider' },
  FAILED: { label: '未通过', className: 'bg-danger-100 text-danger-600 rounded-sm font-display uppercase tracking-wider' },
  RECTIFYING: { label: '整改中', className: 'bg-orange-100 text-orange-700 rounded-sm font-display uppercase tracking-wider' },
};

const complaintStatusConfig: Record<ComplaintStatus, { label: string; className: string }> = {
  OPEN: { label: '待处理', className: 'bg-danger-100 text-danger-600 rounded-sm font-display uppercase tracking-wider' },
  PROCESSING: { label: '处理中', className: 'bg-warning-100 text-warning-700 rounded-sm font-display uppercase tracking-wider' },
  RESOLVED: { label: '已解决', className: 'bg-success-100 text-success-600 rounded-sm font-display uppercase tracking-wider' },
  ESCALATED: { label: '已升级', className: 'bg-purple-100 text-purple-700 rounded-sm font-display uppercase tracking-wider' },
};

const priorityConfig: Record<ComplaintPriority, { label: string; className: string }> = {
  LOW: { label: '低', className: 'bg-gray-100 text-gray-600 rounded-sm font-display uppercase tracking-wider' },
  MEDIUM: { label: '中', className: 'bg-blue-100 text-blue-700 rounded-sm font-display uppercase tracking-wider' },
  HIGH: { label: '高', className: 'bg-warning-100 text-warning-700 rounded-sm font-display uppercase tracking-wider' },
  URGENT: { label: '紧急', className: 'bg-danger-100 text-danger-600 rounded-sm font-display uppercase tracking-wider' },
};

const riskLevelConfig: Record<RiskLevel, { label: string; className: string }> = {
  LOW: { label: '低', className: 'bg-green-100 text-green-700 rounded-sm font-display uppercase tracking-wider' },
  MEDIUM: { label: '中', className: 'bg-blue-100 text-blue-700 rounded-sm font-display uppercase tracking-wider' },
  HIGH: { label: '高', className: 'bg-warning-100 text-warning-700 rounded-sm font-display uppercase tracking-wider' },
  CRITICAL: { label: '严重', className: 'bg-danger-100 text-danger-600 rounded-sm font-display uppercase tracking-wider' },
};

const quotationStatusConfig: Record<QuotationStatus, { label: string; className: string }> = {
  DRAFT: { label: '草稿', className: 'bg-gray-100 text-gray-600 rounded-sm font-display uppercase tracking-wider' },
  PENDING_CONFIRM: { label: '待确认', className: 'bg-warning-100 text-warning-700 rounded-sm font-display uppercase tracking-wider' },
  CONFIRMED: { label: '已确认', className: 'bg-success-100 text-success-600 rounded-sm font-display uppercase tracking-wider' },
  REJECTED: { label: '已拒绝', className: 'bg-danger-100 text-danger-600 rounded-sm font-display uppercase tracking-wider' },
};

const extraItemStatusConfig: Record<ExtraItemStatus, { label: string; className: string }> = {
  DRAFT: { label: '草稿', className: 'bg-gray-100 text-gray-600 rounded-sm font-display uppercase tracking-wider' },
  PENDING_CONFIRM: { label: '待确认', className: 'bg-warning-100 text-warning-700 rounded-sm font-display uppercase tracking-wider' },
  CONFIRMED: { label: '已确认', className: 'bg-success-100 text-success-600 rounded-sm font-display uppercase tracking-wider' },
  REJECTED: { label: '已拒绝', className: 'bg-danger-100 text-danger-600 rounded-sm font-display uppercase tracking-wider' },
};

export default function ProjectDetail({ params }: { params: { id: string } }) {
  const [tab, setTab] = useState<TabKey>('overview');
  const utils = trpc.useUtils();

  const projectQuery = trpc.project.getById.useQuery({ id: params.id });
  const usersQuery = trpc.user.list.useQuery();

  const [showPhaseModal, setShowPhaseModal] = useState(false);
  const [phaseForm, setPhaseForm] = useState({ name: '', description: '' });
  const createPhase = trpc.phase.create.useMutation({
    onSuccess: () => {
      utils.project.getById.invalidate({ id: params.id });
      setShowPhaseModal(false);
      setPhaseForm({ name: '', description: '' });
    },
  });

  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetForm, setBudgetForm] = useState({ newBudget: '', reason: '', responsibleId: '', remark: '' });
  const recordBudgetChange = trpc.phase.recordBudgetChange.useMutation({
    onSuccess: () => {
      utils.project.getById.invalidate({ id: params.id });
      setShowBudgetModal(false);
      setBudgetForm({ newBudget: '', reason: '', responsibleId: '', remark: '' });
    },
  });

  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [complaintForm, setComplaintForm] = useState({
    title: '', description: '', priority: 'MEDIUM' as ComplaintPriority,
    clientName: projectQuery.data?.clientName ?? '', clientContact: projectQuery.data?.clientPhone ?? '',
  });
  const createComplaint = trpc.complaint.create.useMutation({
    onSuccess: () => {
      utils.project.getById.invalidate({ id: params.id });
      setShowComplaintModal(false);
      setComplaintForm({ title: '', description: '', priority: 'MEDIUM', clientName: '', clientContact: '' });
    },
  });

  const [showRiskModal, setShowRiskModal] = useState(false);
  const [riskForm, setRiskForm] = useState({ title: '', description: '', category: '', riskLevel: 'MEDIUM' as RiskLevel, mitigation: '' });
  const createRisk = trpc.complaint.createRisk.useMutation({
    onSuccess: () => {
      utils.project.getById.invalidate({ id: params.id });
      setShowRiskModal(false);
      setRiskForm({ title: '', description: '', category: '', riskLevel: 'MEDIUM', mitigation: '' });
    },
  });

  const [showExtraItemModal, setShowExtraItemModal] = useState(false);
  const [extraItemForm, setExtraItemForm] = useState({ name: '', description: '', amount: '', reason: '' });
  const createExtraItem = trpc.quotation.createExtraItem.useMutation({
    onSuccess: () => {
      utils.project.getById.invalidate({ id: params.id });
      setShowExtraItemModal(false);
      setExtraItemForm({ name: '', description: '', amount: '', reason: '' });
    },
  });

  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [inspectionForm, setInspectionForm] = useState({ title: '', description: '', scheduledDate: '', inspectorId: '' });
  const createInspection = trpc.inspection.create.useMutation({
    onSuccess: () => {
      utils.project.getById.invalidate({ id: params.id });
      setShowInspectionModal(false);
      setInspectionForm({ title: '', description: '', scheduledDate: '', inspectorId: '' });
    },
  });

  const [showAcceptanceModal, setShowAcceptanceModal] = useState(false);
  const [acceptanceForm, setAcceptanceForm] = useState({ title: '', description: '', scheduledDate: '' });
  const createAcceptance = trpc.inspection.createAcceptance.useMutation({
    onSuccess: () => {
      utils.project.getById.invalidate({ id: params.id });
      setShowAcceptanceModal(false);
      setAcceptanceForm({ title: '', description: '', scheduledDate: '' });
    },
  });

  const confirmQuotation = trpc.quotation.confirmQuotation.useMutation({
    onSuccess: () => utils.project.getById.invalidate({ id: params.id }),
  });
  const confirmExtraItem = trpc.quotation.confirmExtraItem.useMutation({
    onSuccess: () => utils.project.getById.invalidate({ id: params.id }),
  });
  const updateInspectionStatus = trpc.inspection.updateStatus.useMutation({
    onSuccess: () => utils.project.getById.invalidate({ id: params.id }),
  });
  const updateAcceptanceStatus = trpc.inspection.updateAcceptanceStatus.useMutation({
    onSuccess: () => utils.project.getById.invalidate({ id: params.id }),
  });
  const updateComplaintStatus = trpc.complaint.updateStatus.useMutation({
    onSuccess: () => utils.project.getById.invalidate({ id: params.id }),
  });
  const resolveRisk = trpc.complaint.resolveRisk.useMutation({
    onSuccess: () => utils.project.getById.invalidate({ id: params.id }),
  });
  const completePhase = trpc.phase.complete.useMutation({
    onSuccess: () => utils.project.getById.invalidate({ id: params.id }),
  });
  const updateProjectStatus = trpc.phase.updateProjectStatus.useMutation({
    onSuccess: () => utils.project.getById.invalidate({ id: params.id }),
  });

  const project = projectQuery.data;

  if (projectQuery.isLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center p-16">
          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-500 border-t-transparent" />
        </div>
      </AppShell>
    );
  }
  if (!project) {
    return <AppShell><div className="p-8 text-center text-gray-500">项目不存在</div></AppShell>;
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/projects" className="hover:text-brand-600 transition-colors">项目列表</Link>
          <span>/</span>
          <span className="text-navy-800 font-medium">{project.code}</span>
        </div>

        <div className="card p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-display font-bold text-navy-800">{project.name}</h1>
                <StatusBadge status={project.status} />
                <BudgetAlertBadge level={project.budgetAlertLevel} />
              </div>
              <p className="text-sm text-gray-500 mt-1">{project.code} · {project.address}</p>
              <div className="flex flex-wrap items-center gap-6 mt-3 text-sm">
                <div>
                  <span className="text-gray-500">客户：</span>
                  <span className="font-medium text-navy-800">{project.clientName}</span>
                  <span className="text-gray-500 ml-2">{project.clientPhone}</span>
                </div>
                <div>
                  <span className="text-gray-500">设计师：</span>
                  <UserAvatar name={project.designer?.name} />
                </div>
                <div>
                  <span className="text-gray-500">项目经理：</span>
                  <UserAvatar name={project.projectManager?.name} />
                </div>
                {project.decorationCompany && (
                  <div>
                    <span className="text-gray-500">装修公司：</span>
                    <span className="font-medium text-navy-800">{project.decorationCompany.name}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="w-80">
              <BudgetBar
                usedPercent={project.budgetUsedPercent}
                amount={project.actualCost.toNumber()}
                budget={project.totalBudget.toNumber()}
              />
              <div className="flex justify-between mt-2 text-sm">
                <span className="text-gray-500">当前阶段：{project.phases.find(p => p.isCurrent)?.name ?? '-'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex border-b overflow-auto">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-3 text-sm whitespace-nowrap border-b-2 transition-colors font-display ${
                  tab === t.key
                    ? 'border-navy-800 text-navy-800 font-semibold'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                <span className="inline-flex items-center gap-1.5">
                  {t.icon}
                  {t.label}
                </span>
              </button>
            ))}
          </div>

          <div className="p-6">
            {tab === 'overview' && (
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Field label="项目编号" value={project.code} />
                  <Field label="项目名称" value={project.name} />
                  <Field label="客户姓名" value={project.clientName} />
                  <Field label="客户电话" value={project.clientPhone} />
                  <Field label="客户邮箱" value={project.clientEmail} />
                </div>
                <div className="space-y-3">
                  <Field label="项目地址" value={project.address} />
                  <Field label="面积" value={project.area ? `${project.area} ㎡` : undefined} />
                  <Field label="开工日期" value={formatDate(project.startDate)} />
                  <Field label="竣工日期" value={formatDate(project.endDate)} />
                  <Field label="项目描述" value={project.description} />
                </div>
                <div className="col-span-2">
                  <label className="label">项目状态</label>
                  <div className="flex gap-2 mt-2">
                    <select
                      className="input w-48"
                      value={project.status}
                      onChange={(e) => updateProjectStatus.mutate({ projectId: project.id, status: e.target.value as ProjectStatus })}
                    >
                      {(['DRAFT', 'QUOTATION_PENDING', 'QUOTATION_CONFIRMED', 'IN_PROGRESS', 'INSPECTION', 'ACCEPTANCE', 'COMPLETED', 'ON_HOLD', 'CANCELLED'] as ProjectStatus[]).map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {tab === 'quotations' && (
              <div className="space-y-8">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display font-semibold text-navy-800">报价单</h3>
                  </div>
                  {project.quotations.length === 0 ? (
                    <EmptyState title="暂无报价单" icon={<Receipt className="w-7 h-7 text-gray-400" />} />
                  ) : (
                    <div className="space-y-3">
                      {project.quotations.map((q) => (
                        <div key={q.id} className="p-4 border rounded-lg hover:border-brand-200 transition-colors">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-navy-800">v{q.version}</span>
                                <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold badge ${quotationStatusConfig[q.status].className}`}>
                                  {quotationStatusConfig[q.status].label}
                                </span>
                              </div>
                              <p className="text-2xl font-display font-bold text-navy-800 mt-2">{formatCurrency(q.amount.toNumber())}</p>
                              <p className="text-xs text-gray-500 mt-1">{formatDateTime(q.createdAt)}</p>
                              {q.remark && <p className="text-sm text-gray-600 mt-2">{q.remark}</p>}
                            </div>
                            {q.status === QuotationStatus.PENDING_CONFIRM && (
                              <div className="flex gap-2">
                                <button onClick={() => confirmQuotation.mutate({ id: q.id, confirmed: true })} className="btn-success inline-flex items-center gap-1.5">
                                  <Check className="w-4 h-4" />
                                  确认
                                </button>
                                <button onClick={() => confirmQuotation.mutate({ id: q.id, confirmed: false, rejectReason: '' })} className="btn-danger inline-flex items-center gap-1.5">
                                  <X className="w-4 h-4" />
                                  拒绝
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display font-semibold text-navy-800">增项</h3>
                    <button onClick={() => setShowExtraItemModal(true)} className="btn-primary inline-flex items-center gap-1.5 text-sm">
                      <Plus className="w-4 h-4" /> 新增增项
                    </button>
                  </div>
                  {project.extraItems.length === 0 ? (
                    <EmptyState title="暂无增项" icon={<FileText className="w-7 h-7 text-gray-400" />} />
                  ) : (
                    <div className="overflow-auto">
                      <table className="table">
                        <thead>
                          <tr className="border-b bg-gray-50/50">
                            <th className="table-th">名称</th>
                            <th className="table-th">描述</th>
                            <th className="table-th">金额</th>
                            <th className="table-th">原因</th>
                            <th className="table-th">状态</th>
                            <th className="table-th">确认人</th>
                            <th className="table-th">操作</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {project.extraItems.map((e) => (
                            <tr key={e.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="table-td font-medium text-navy-800">{e.name}</td>
                              <td className="table-td text-sm text-gray-600">{e.description}</td>
                              <td className="table-td font-medium text-navy-800">{formatCurrency(e.amount.toNumber())}</td>
                              <td className="table-td text-sm text-gray-600">{e.reason ?? '-'}</td>
                              <td className="table-td">
                                <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold badge ${extraItemStatusConfig[e.status].className}`}>
                                  {extraItemStatusConfig[e.status].label}
                                </span>
                              </td>
                              <td className="table-td text-sm">{e.confirmedAt ? formatDate(e.confirmedAt) : '-'}</td>
                              <td className="table-td">
                                {e.status === ExtraItemStatus.PENDING_CONFIRM && (
                                  <div className="flex gap-2">
                                    <button onClick={() => confirmExtraItem.mutate({ id: e.id, confirmed: true })} className="btn-success text-xs py-1 inline-flex items-center gap-1">
                                      <Check className="w-3 h-3" /> 确认
                                    </button>
                                    <button onClick={() => confirmExtraItem.mutate({ id: e.id, confirmed: false })} className="btn-danger text-xs py-1 inline-flex items-center gap-1">
                                      <X className="w-3 h-3" /> 拒绝
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {tab === 'phases' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-semibold text-navy-800">项目阶段</h3>
                  <button onClick={() => setShowPhaseModal(true)} className="btn-primary inline-flex items-center gap-1.5 text-sm">
                    <Plus className="w-4 h-4" /> 新建阶段
                  </button>
                </div>
                {project.phases.length === 0 ? (
                  <EmptyState title="暂无阶段记录" icon={<RefreshCw className="w-7 h-7 text-gray-400" />} />
                ) : (
                  <div className="relative pl-8">
                    <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-gray-200" />
                    {project.phases.map((phase) => (
                      <div key={phase.id} className="relative pb-8">
                        <div className={`absolute -left-5 w-4 h-4 rounded-full border-4 ${
                          phase.isCurrent ? 'bg-brand-500 border-brand-200' : phase.completedAt ? 'bg-success-500 border-success-200' : 'bg-gray-300 border-gray-100'
                        }`} />
                        <div className="card">
                          <div className="p-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-display font-semibold text-navy-800">{phase.name}</span>
                                  {phase.isCurrent && (
                                    <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-sm font-display uppercase tracking-wider bg-brand-100 text-brand-700 badge">
                                      当前阶段
                                    </span>
                                  )}
                                  {phase.completedAt && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-sm font-display uppercase tracking-wider bg-success-100 text-success-600 badge">
                                      <CheckCircle className="w-3 h-3" />
                                      已完成
                                    </span>
                                  )}
                                </div>
                                <div className="flex gap-4 mt-2 text-sm text-gray-500">
                                  <span>开始: {formatDate(phase.startDate)}</span>
                                  {phase.endDate && <span>计划结束: {formatDate(phase.endDate)}</span>}
                                  {phase.completedAt && <span>完成: {formatDate(phase.completedAt)}</span>}
                                </div>
                                {phase.description && <p className="text-sm text-gray-600 mt-2">{phase.description}</p>}
                                {phase.remark && <p className="text-sm text-gray-500 mt-2 italic">备注: {phase.remark}</p>}
                              </div>
                              {!phase.completedAt && (
                                <button onClick={() => completePhase.mutate({ id: phase.id })} className="btn-secondary inline-flex items-center gap-1.5 text-sm">
                                  <Check className="w-4 h-4" />
                                  标记完成
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'inspection' && (
              <div className="space-y-8">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display font-semibold text-navy-800">巡检任务</h3>
                    <button onClick={() => setShowInspectionModal(true)} className="btn-primary inline-flex items-center gap-1.5 text-sm">
                      <Plus className="w-4 h-4" /> 新增巡检
                    </button>
                  </div>
                  {project.inspections.length === 0 ? (
                    <EmptyState title="暂无巡检任务" icon={<Search className="w-7 h-7 text-gray-400" />} />
                  ) : (
                    <div className="overflow-auto">
                      <table className="table">
                        <thead>
                          <tr className="border-b bg-gray-50/50">
                            <th className="table-th">标题</th>
                            <th className="table-th">描述</th>
                            <th className="table-th">计划日期</th>
                            <th className="table-th">巡检员</th>
                            <th className="table-th">状态</th>
                            <th className="table-th">结果</th>
                            <th className="table-th">操作</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {project.inspections.map((i) => (
                            <tr key={i.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="table-td font-medium text-navy-800">{i.title}</td>
                              <td className="table-td text-sm text-gray-600">{i.description ?? '-'}</td>
                              <td className="table-td text-sm">{formatDate(i.scheduledDate)}</td>
                              <td className="table-td"><UserAvatar name={i.inspector?.name} /></td>
                              <td className="table-td">
                                <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold badge ${inspectionStatusConfig[i.status].className}`}>
                                  {inspectionStatusConfig[i.status].label}
                                </span>
                              </td>
                              <td className="table-td text-sm text-gray-600 max-w-xs truncate">{i.result ?? '-'}</td>
                              <td className="table-td">
                                <select
                                  className="input text-xs h-8 py-0"
                                  value={i.status}
                                  onChange={(e) => updateInspectionStatus.mutate({ id: i.id, status: e.target.value as InspectionStatus })}
                                >
                                  <option value="PENDING">待巡检</option>
                                  <option value="IN_PROGRESS">巡检中</option>
                                  <option value="COMPLETED">已完成</option>
                                  <option value="FAILED">不通过</option>
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display font-semibold text-navy-800">验收</h3>
                    <button onClick={() => setShowAcceptanceModal(true)} className="btn-primary inline-flex items-center gap-1.5 text-sm">
                      <Plus className="w-4 h-4" /> 新增验收
                    </button>
                  </div>
                  {project.acceptances.length === 0 ? (
                    <EmptyState title="暂无验收" icon={<CheckCircle className="w-7 h-7 text-gray-400" />} />
                  ) : (
                    <div className="overflow-auto">
                      <table className="table">
                        <thead>
                          <tr className="border-b bg-gray-50/50">
                            <th className="table-th">标题</th>
                            <th className="table-th">描述</th>
                            <th className="table-th">计划日期</th>
                            <th className="table-th">状态</th>
                            <th className="table-th">反馈</th>
                            <th className="table-th">操作</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {project.acceptances.map((a) => (
                            <tr key={a.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="table-td font-medium text-navy-800">{a.title}</td>
                              <td className="table-td text-sm text-gray-600">{a.description ?? '-'}</td>
                              <td className="table-td text-sm">{formatDate(a.scheduledDate)}</td>
                              <td className="table-td">
                                <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold badge ${acceptanceStatusConfig[a.status].className}`}>
                                  {acceptanceStatusConfig[a.status].label}
                                </span>
                              </td>
                              <td className="table-td text-sm text-gray-600 max-w-xs truncate">{a.feedback ?? '-'}</td>
                              <td className="table-td">
                                <select
                                  className="input text-xs h-8 py-0"
                                  value={a.status}
                                  onChange={(e) => updateAcceptanceStatus.mutate({ id: a.id, status: e.target.value as AcceptanceStatus })}
                                >
                                  <option value="PENDING">待验收</option>
                                  <option value="PASSED">已通过</option>
                                  <option value="FAILED">未通过</option>
                                  <option value="RECTIFYING">整改中</option>
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display font-semibold text-navy-800">设计方案</h3>
                  </div>
                  {project.designPlans.length === 0 ? (
                    <EmptyState title="暂无设计方案" icon={<FileText className="w-7 h-7 text-gray-400" />} />
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {project.designPlans.map((p) => (
                        <div key={p.id} className="p-4 border rounded-lg hover:border-brand-200 transition-colors">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-navy-800">{p.name}</span>
                                {p.isActive && (
                                  <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-sm font-display uppercase tracking-wider bg-brand-100 text-brand-700 badge">
                                    当前版本
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-1">v{p.version} · {formatDate(p.createdAt)}</p>
                              {p.description && <p className="text-sm text-gray-600 mt-2">{p.description}</p>}
                            </div>
                            {p.fileUrl && (
                              <a href={p.fileUrl} target="_blank" rel="noreferrer" className="btn-secondary inline-flex items-center gap-1.5 text-xs">
                                <Eye className="w-3 h-3" />
                                查看
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {tab === 'budget' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-semibold text-navy-800">预算变更记录</h3>
                  <button onClick={() => setShowBudgetModal(true)} className="btn-primary inline-flex items-center gap-1.5 text-sm">
                    <Plus className="w-4 h-4" /> 记录变更
                  </button>
                </div>
                {project.budgetChanges.length === 0 ? (
                  <EmptyState title="暂无预算变更" icon={<BarChart3 className="w-7 h-7 text-gray-400" />} />
                ) : (
                  <div className="overflow-auto">
                    <table className="table">
                      <thead>
                        <tr className="border-b bg-gray-50/50">
                          <th className="table-th">时间</th>
                          <th className="table-th">原预算</th>
                          <th className="table-th">新预算</th>
                          <th className="table-th">变动额</th>
                          <th className="table-th">变动率</th>
                          <th className="table-th">原因</th>
                          <th className="table-th">预警</th>
                          <th className="table-th">责任人</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {project.budgetChanges.map((b) => (
                          <tr key={b.id} className={`hover:bg-gray-50/50 transition-colors ${b.isAbnormal ? 'bg-warning-50' : ''}`}>
                            <td className="table-td text-sm text-gray-500">{formatDateTime(b.createdAt)}</td>
                            <td className="table-td text-sm">{formatCurrency(b.oldBudget.toNumber())}</td>
                            <td className="table-td text-sm font-medium text-navy-800">{formatCurrency(b.newBudget.toNumber())}</td>
                            <td className={`table-td font-medium font-display ${b.changeAmount.toNumber() > 0 ? 'text-danger-600' : 'text-success-600'}`}>
                              {b.changeAmount.toNumber() > 0 ? '+' : ''}{formatCurrency(b.changeAmount.toNumber())}
                            </td>
                            <td className="table-td text-sm font-display tabular-nums">{b.changePercent.toFixed(2)}%</td>
                            <td className="table-td text-sm">
                              {b.isAbnormal && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-sm font-display uppercase tracking-wider bg-danger-100 text-danger-600 badge mr-1">
                                  <AlertTriangle className="w-3 h-3" />
                                  异常
                                </span>
                              )}
                              {b.reason}
                            </td>
                            <td className="table-td"><BudgetAlertBadge level={b.alertLevel} /></td>
                            <td className="table-td"><UserAvatar name={b.responsible?.name} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {tab === 'complaints' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-semibold text-navy-800">客户投诉</h3>
                  <button onClick={() => setShowComplaintModal(true)} className="btn-primary inline-flex items-center gap-1.5 text-sm">
                    <Plus className="w-4 h-4" /> 录入投诉
                  </button>
                </div>
                {project.complaints.length === 0 ? (
                  <EmptyState title="暂无投诉" icon={<Megaphone className="w-7 h-7 text-gray-400" />} />
                ) : (
                  <div className="space-y-3">
                    {project.complaints.map((c) => (
                      <div key={c.id} className="card hover:border-brand-200 transition-colors">
                        <div className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold badge ${priorityConfig[c.priority].className}`}>
                                  {priorityConfig[c.priority].label}
                                </span>
                                <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold badge ${complaintStatusConfig[c.status].className}`}>
                                  {complaintStatusConfig[c.status].label}
                                </span>
                                {c.bossNotified && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-sm font-display uppercase tracking-wider bg-danger-100 text-danger-600 badge">
                                    <Bell className="w-3 h-3" />
                                    已通知老板
                                  </span>
                                )}
                                <span className="font-medium text-navy-800 ml-1">{c.title}</span>
                              </div>
                              <p className="text-sm text-gray-600 mt-2">{c.description}</p>
                              <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500">
                                <span>客户: {c.clientName} ({c.clientContact})</span>
                                {c.decorationCompany && <span>装修公司: {c.decorationCompany.name}</span>}
                                <span>创建: {formatDateTime(c.createdAt)}</span>
                                {c.resolvedAt && <span>解决: {formatDateTime(c.resolvedAt)}</span>}
                              </div>
                              {c.resolution && (
                                <p className="text-sm text-success-700 mt-2 bg-success-50 p-2 rounded border border-success-100">
                                  <strong>解决方案：</strong>{c.resolution}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-2 ml-4">
                              <UserAvatar name={c.assignedTo?.name} />
                              <select
                                className="input text-xs h-8 py-0"
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
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'risks' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-semibold text-navy-800">合同风险</h3>
                  <button onClick={() => setShowRiskModal(true)} className="btn-primary inline-flex items-center gap-1.5 text-sm">
                    <Plus className="w-4 h-4" /> 录入风险
                  </button>
                </div>
                {project.contractRisks.length === 0 ? (
                  <EmptyState title="暂无合同风险" icon={<ShieldAlert className="w-7 h-7 text-gray-400" />} />
                ) : (
                  <div className="overflow-auto">
                    <table className="table">
                      <thead>
                        <tr className="border-b bg-gray-50/50">
                          <th className="table-th">标题</th>
                          <th className="table-th">分类</th>
                          <th className="table-th">风险等级</th>
                          <th className="table-th">描述</th>
                          <th className="table-th">缓解措施</th>
                          <th className="table-th">状态</th>
                          <th className="table-th">操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {project.contractRisks.map((r) => (
                          <tr key={r.id} className={
                            !r.isResolved && (r.riskLevel === 'CRITICAL' || r.riskLevel === 'HIGH')
                              ? 'bg-danger-50 hover:bg-danger-100/50'
                              : 'hover:bg-gray-50/50 transition-colors'
                          }>
                            <td className="table-td font-medium text-navy-800">{r.title}</td>
                            <td className="table-td text-sm">{r.category}</td>
                            <td className="table-td">
                              <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold badge ${riskLevelConfig[r.riskLevel].className}`}>
                                {riskLevelConfig[r.riskLevel].label}
                              </span>
                            </td>
                            <td className="table-td text-sm text-gray-600">{r.description}</td>
                            <td className="table-td text-sm text-gray-600">{r.mitigation ?? '-'}</td>
                            <td className="table-td">
                              {r.isResolved ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-sm font-display uppercase tracking-wider bg-success-100 text-success-600 badge">
                                  <CheckCircle className="w-3 h-3" />
                                  已解决 {formatDate(r.resolvedAt)}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-sm font-display uppercase tracking-wider bg-warning-100 text-warning-700 badge">
                                  <AlertTriangle className="w-3 h-3" />
                                  未解决
                                </span>
                              )}
                            </td>
                            <td className="table-td">
                              {!r.isResolved && (
                                <button onClick={() => resolveRisk.mutate({ id: r.id })} className="btn-success text-xs py-1 inline-flex items-center gap-1">
                                  <Check className="w-3 h-3" /> 标记解决
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {tab === 'history' && (
              <div>
                <h3 className="font-display font-semibold text-navy-800 mb-4">
                  <span className="inline-flex items-center gap-1.5">
                    <ScrollText className="w-5 h-5" />
                    变更历史对比（金额 / 状态 / 负责人）
                  </span>
                </h3>
                {project.changeHistories.length === 0 ? (
                  <EmptyState title="暂无变更记录" icon={<ScrollText className="w-7 h-7 text-gray-400" />} />
                ) : (
                  <div className="relative pl-8">
                    <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-gray-200" />
                    {project.changeHistories.map((h) => (
                      <div key={h.id} className="relative pb-6">
                        <div className={`absolute -left-5 w-4 h-4 rounded-full border-4 ${
                          h.changeType === 'CREATE' ? 'bg-success-500 border-success-200' :
                          h.fieldName === 'status' ? 'bg-blue-500 border-blue-200' :
                          h.fieldName === 'totalBudget' || h.fieldName.includes('amount') || h.fieldName.includes('Budget') ? 'bg-warning-500 border-warning-200' :
                          h.fieldName.includes('designer') || h.fieldName.includes('manager') || h.fieldName.includes('responsible') ? 'bg-purple-500 border-purple-200' :
                          'bg-gray-400 border-gray-200'
                        }`} />
                        <div className="card">
                          <div className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-sm font-display uppercase tracking-wider bg-gray-100 text-gray-700 badge">
                                    {h.entityType}
                                  </span>
                                  <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-sm font-display uppercase tracking-wider badge ${
                                    h.changeType === 'CREATE' ? 'bg-success-100 text-success-700' :
                                    'bg-blue-100 text-blue-700'
                                  }`}>
                                    {h.changeType === 'CREATE' ? '创建' : '更新'}
                                  </span>
                                  <span className="font-medium text-navy-800">{h.fieldName}</span>
                                  {(h.fieldName === 'totalBudget' || h.fieldName.includes('Budget') || h.fieldName.includes('amount')) && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-sm font-display uppercase tracking-wider bg-warning-100 text-warning-700 badge">
                                      <TrendingUp className="w-3 h-3" />
                                      金额变更
                                    </span>
                                  )}
                                  {h.fieldName === 'status' && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-sm font-display uppercase tracking-wider bg-blue-100 text-blue-700 badge">
                                      <BarChart3 className="w-3 h-3" />
                                      状态变更
                                    </span>
                                  )}
                                  {(h.fieldName.includes('designer') || h.fieldName.includes('manager') || h.fieldName.includes('responsible') || h.fieldName.includes('assignedTo')) && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-sm font-display uppercase tracking-wider bg-purple-100 text-purple-700 badge">
                                      <ArrowRight className="w-3 h-3" />
                                      负责人变更
                                    </span>
                                  )}
                                </div>

                                {h.changeType === 'UPDATE' && h.oldValue !== null && (
                                  <div className="mt-3 flex items-center gap-3 text-sm">
                                    <div className="bg-red-50 px-3 py-2 rounded border border-red-100 flex-1">
                                      <p className="text-xs text-red-500 mb-0.5 font-display">变更前</p>
                                      <p className="text-red-700 font-medium">{formatFieldValue(h.fieldName, h.oldValue)}</p>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    <div className="bg-green-50 px-3 py-2 rounded border border-green-100 flex-1">
                                      <p className="text-xs text-green-600 mb-0.5 font-display">变更后</p>
                                      <p className="text-green-700 font-medium">{formatFieldValue(h.fieldName, h.newValue)}</p>
                                    </div>
                                  </div>
                                )}

                                {h.remark && (
                                  <p className="text-sm text-gray-600 mt-3 italic flex items-center gap-1.5">
                                    <FileText className="w-3 h-3 text-gray-400" />
                                    {h.remark}
                                  </p>
                                )}
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-xs text-gray-500">{formatDateTime(h.createdAt)}</p>
                                <div className="mt-2">
                                  <UserAvatar name={h.createdBy?.name} />
                                </div>
                                {h.responsibleId && h.responsibleId !== h.createdById && (
                                  <div className="mt-2">
                                    <p className="text-xs text-gray-400">责任人:</p>
                                    <UserAvatar name={h.responsible?.name} />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal title="新建阶段" open={showPhaseModal} onClose={() => setShowPhaseModal(false)} onSubmit={() => createPhase.mutate({ projectId: project.id, ...phaseForm })}>
        <div>
          <label className="label">阶段名称 *</label>
          <input className="input mt-1" value={phaseForm.name} onChange={(e) => setPhaseForm({ ...phaseForm, name: e.target.value })} required />
        </div>
        <div>
          <label className="label">描述</label>
          <textarea className="input mt-1 min-h-[80px]" value={phaseForm.description} onChange={(e) => setPhaseForm({ ...phaseForm, description: e.target.value })} />
        </div>
      </Modal>

      <Modal title="记录预算变更" open={showBudgetModal} onClose={() => setShowBudgetModal(false)} onSubmit={() => recordBudgetChange.mutate({
        projectId: project.id,
        newBudget: parseFloat(budgetForm.newBudget),
        reason: budgetForm.reason,
        responsibleId: budgetForm.responsibleId || undefined,
        remark: budgetForm.remark || undefined,
      })}>
        <div>
          <label className="label">新预算金额 (元) *</label>
          <input type="number" className="input mt-1" value={budgetForm.newBudget} onChange={(e) => setBudgetForm({ ...budgetForm, newBudget: e.target.value })} required />
          <p className="text-xs text-gray-500 mt-1">当前预算: {formatCurrency(project.totalBudget.toNumber())}</p>
        </div>
        <div>
          <label className="label">变更原因 *</label>
          <input className="input mt-1" value={budgetForm.reason} onChange={(e) => setBudgetForm({ ...budgetForm, reason: e.target.value })} required />
        </div>
        <div>
          <label className="label">责任人</label>
          <select className="input mt-1" value={budgetForm.responsibleId} onChange={(e) => setBudgetForm({ ...budgetForm, responsibleId: e.target.value })}>
            <option value="">-- 选择 --</option>
            {usersQuery.data?.map((u) => (
              <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">备注</label>
          <input className="input mt-1" value={budgetForm.remark} onChange={(e) => setBudgetForm({ ...budgetForm, remark: e.target.value })} />
        </div>
      </Modal>

      <Modal title="录入客户投诉" open={showComplaintModal} onClose={() => setShowComplaintModal(false)} onSubmit={() => createComplaint.mutate({
        projectId: project.id,
        ...complaintForm,
      })}>
        <div>
          <label className="label">标题 *</label>
          <input className="input mt-1" value={complaintForm.title} onChange={(e) => setComplaintForm({ ...complaintForm, title: e.target.value })} required />
        </div>
        <div>
          <label className="label">详细描述 *</label>
          <textarea className="input mt-1 min-h-[80px]" value={complaintForm.description} onChange={(e) => setComplaintForm({ ...complaintForm, description: e.target.value })} required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">优先级</label>
            <select className="input mt-1" value={complaintForm.priority} onChange={(e) => setComplaintForm({ ...complaintForm, priority: e.target.value as ComplaintPriority })}>
              <option value="LOW">低</option>
              <option value="MEDIUM">中</option>
              <option value="HIGH">高（自动通知老板）</option>
              <option value="URGENT">紧急（自动通知老板）</option>
            </select>
          </div>
          <div>
            <label className="label">联系人</label>
            <input className="input mt-1" value={complaintForm.clientName} onChange={(e) => setComplaintForm({ ...complaintForm, clientName: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="label">联系方式</label>
          <input className="input mt-1" value={complaintForm.clientContact} onChange={(e) => setComplaintForm({ ...complaintForm, clientContact: e.target.value })} />
        </div>
      </Modal>

      <Modal title="录入合同风险" open={showRiskModal} onClose={() => setShowRiskModal(false)} onSubmit={() => createRisk.mutate({
        projectId: project.id,
        ...riskForm,
      })}>
        <div>
          <label className="label">风险标题 *</label>
          <input className="input mt-1" value={riskForm.title} onChange={(e) => setRiskForm({ ...riskForm, title: e.target.value })} required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">分类 *</label>
            <input className="input mt-1" placeholder="如：付款、工期、质量..." value={riskForm.category} onChange={(e) => setRiskForm({ ...riskForm, category: e.target.value })} required />
          </div>
          <div>
            <label className="label">风险等级</label>
            <select className="input mt-1" value={riskForm.riskLevel} onChange={(e) => setRiskForm({ ...riskForm, riskLevel: e.target.value as RiskLevel })}>
              <option value="LOW">低</option>
              <option value="MEDIUM">中</option>
              <option value="HIGH">高</option>
              <option value="CRITICAL">严重</option>
            </select>
          </div>
        </div>
        <div>
          <label className="label">风险描述 *</label>
          <textarea className="input mt-1 min-h-[80px]" value={riskForm.description} onChange={(e) => setRiskForm({ ...riskForm, description: e.target.value })} required />
        </div>
        <div>
          <label className="label">缓解措施</label>
          <textarea className="input mt-1 min-h-[60px]" value={riskForm.mitigation} onChange={(e) => setRiskForm({ ...riskForm, mitigation: e.target.value })} />
        </div>
      </Modal>

      <Modal title="新增增项" open={showExtraItemModal} onClose={() => setShowExtraItemModal(false)} onSubmit={() => createExtraItem.mutate({
        projectId: project.id,
        name: extraItemForm.name,
        description: extraItemForm.description,
        amount: parseFloat(extraItemForm.amount),
        reason: extraItemForm.reason || undefined,
      })}>
        <div>
          <label className="label">增项名称 *</label>
          <input className="input mt-1" value={extraItemForm.name} onChange={(e) => setExtraItemForm({ ...extraItemForm, name: e.target.value })} required />
        </div>
        <div>
          <label className="label">描述 *</label>
          <textarea className="input mt-1 min-h-[60px]" value={extraItemForm.description} onChange={(e) => setExtraItemForm({ ...extraItemForm, description: e.target.value })} required />
        </div>
        <div>
          <label className="label">金额 (元) *</label>
          <input type="number" className="input mt-1" value={extraItemForm.amount} onChange={(e) => setExtraItemForm({ ...extraItemForm, amount: e.target.value })} required />
        </div>
        <div>
          <label className="label">产生原因</label>
          <input className="input mt-1" value={extraItemForm.reason} onChange={(e) => setExtraItemForm({ ...extraItemForm, reason: e.target.value })} />
        </div>
      </Modal>

      <Modal title="新增巡检任务" open={showInspectionModal} onClose={() => setShowInspectionModal(false)} onSubmit={() => createInspection.mutate({
        projectId: project.id,
        title: inspectionForm.title,
        description: inspectionForm.description || undefined,
        scheduledDate: new Date(inspectionForm.scheduledDate),
        inspectorId: inspectionForm.inspectorId || undefined,
      })}>
        <div>
          <label className="label">标题 *</label>
          <input className="input mt-1" value={inspectionForm.title} onChange={(e) => setInspectionForm({ ...inspectionForm, title: e.target.value })} required />
        </div>
        <div>
          <label className="label">描述</label>
          <textarea className="input mt-1 min-h-[60px]" value={inspectionForm.description} onChange={(e) => setInspectionForm({ ...inspectionForm, description: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">计划日期 *</label>
            <input type="date" className="input mt-1" value={inspectionForm.scheduledDate} onChange={(e) => setInspectionForm({ ...inspectionForm, scheduledDate: e.target.value })} required />
          </div>
          <div>
            <label className="label">巡检员</label>
            <select className="input mt-1" value={inspectionForm.inspectorId} onChange={(e) => setInspectionForm({ ...inspectionForm, inspectorId: e.target.value })}>
              <option value="">-- 选择 --</option>
              {usersQuery.data?.map((u) => (
                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
              ))}
            </select>
          </div>
        </div>
      </Modal>

      <Modal title="新增验收" open={showAcceptanceModal} onClose={() => setShowAcceptanceModal(false)} onSubmit={() => createAcceptance.mutate({
        projectId: project.id,
        title: acceptanceForm.title,
        description: acceptanceForm.description || undefined,
        scheduledDate: new Date(acceptanceForm.scheduledDate),
      })}>
        <div>
          <label className="label">验收标题 *</label>
          <input className="input mt-1" value={acceptanceForm.title} onChange={(e) => setAcceptanceForm({ ...acceptanceForm, title: e.target.value })} required />
        </div>
        <div>
          <label className="label">描述</label>
          <textarea className="input mt-1 min-h-[60px]" value={acceptanceForm.description} onChange={(e) => setAcceptanceForm({ ...acceptanceForm, description: e.target.value })} />
        </div>
        <div>
          <label className="label">计划日期 *</label>
          <input type="date" className="input mt-1" value={acceptanceForm.scheduledDate} onChange={(e) => setAcceptanceForm({ ...acceptanceForm, scheduledDate: e.target.value })} required />
        </div>
      </Modal>
    </AppShell>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <label className="label text-gray-500">{label}</label>
      <p className="text-sm text-navy-800 font-medium mt-1">{value ?? '-'}</p>
    </div>
  );
}

function formatFieldValue(field: string, value: string | null) {
  if (value === null) return '(空)';
  if (field === 'totalBudget' || field.includes('Budget') || field.includes('amount')) {
    const num = parseFloat(value);
    if (!isNaN(num)) return formatCurrency(num);
  }
  const statusMap: Record<string, string> = {
    DRAFT: '草稿',
    QUOTATION_PENDING: '报价待确认',
    QUOTATION_CONFIRMED: '报价已确认',
    IN_PROGRESS: '进行中',
    INSPECTION: '巡检中',
    ACCEPTANCE: '验收中',
    COMPLETED: '已完成',
    ON_HOLD: '暂停',
    CANCELLED: '已取消',
    PENDING: '待处理',
    PENDING_CONFIRM: '待确认',
    CONFIRMED: '已确认',
    REJECTED: '已拒绝',
    PROCESSING: '处理中',
    RESOLVED: '已解决',
    OPEN: '待处理',
    ESCALATED: '已升级',
  };
  return statusMap[value] ?? value;
}
