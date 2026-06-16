'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/components/providers/trpc-provider';
import {
  ArrowLeft,
  ShieldAlert,
  Clock,
  User,
  Calendar,
  FileText,
  Upload,
  Plus,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Edit3,
  Send,
  Trash2,
  Bell,
} from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  formatDateTime,
  formatDate,
  getRiskLabel,
  getRiskColor,
  getStatusLabel,
  getStatusColor,
  getRoleLabel,
} from '@/lib/utils';
import { RISK_LEVELS, RISK_STATUSES, DEPARTMENTS } from '@/lib/constants';
import { isBefore } from 'date-fns';

export default function RiskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const utils = trpc.useUtils();

  const { data: risk, isLoading } = trpc.risk.get.useQuery(
    { id: params.id as string },
    { enabled: !!params.id }
  );

  const { data: currentUser } = trpc.user.me.useQuery();
  const { data: legalUsers } = trpc.user.getLegalUsers.useQuery();
  const { data: proBonoLawyers } = trpc.user.getProBonoLawyers.useQuery();

  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showRectificationModal, setShowRectificationModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const isLegal = currentUser?.role === 'LEGAL' || currentUser?.role === 'ADMIN';
  const isEditable = isLegal || currentUser?.id === risk?.submitterId;

  const updateRiskMutation = trpc.risk.update.useMutation({
    onSuccess: () => {
      toast.success('更新成功');
      utils.risk.get.invalidate({ id: params.id as string });
      utils.risk.list.invalidate();
      setShowEditModal(false);
    },
  });

  const updateStatusMutation = trpc.risk.updateStatus.useMutation({
    onSuccess: () => {
      toast.success('状态已更新');
      utils.risk.get.invalidate({ id: params.id as string });
      utils.risk.list.invalidate();
    },
  });

  const addAssessmentMutation = trpc.risk.addAssessment.useMutation({
    onSuccess: () => {
      toast.success('风险评估已保存');
      utils.risk.get.invalidate({ id: params.id as string });
      setShowAssessmentModal(false);
    },
  });

  const addEvidenceMutation = trpc.risk.addEvidence.useMutation({
    onSuccess: () => {
      toast.success('证据已上传');
      utils.risk.get.invalidate({ id: params.id as string });
      setShowEvidenceModal(false);
    },
  });

  const addReviewMutation = trpc.risk.addReviewOpinion.useMutation({
    onSuccess: () => {
      toast.success('复核意见已保存');
      utils.risk.get.invalidate({ id: params.id as string });
      setShowReviewModal(false);
    },
  });

  const addRectificationMutation = trpc.risk.addRectificationPlan.useMutation({
    onSuccess: () => {
      toast.success('整改计划已添加');
      utils.risk.get.invalidate({ id: params.id as string });
      setShowRectificationModal(false);
    },
  });

  const createAlertMutation = trpc.alert.create.useMutation({
    onSuccess: () => {
      toast.success('越权提醒已发送');
      utils.risk.get.invalidate({ id: params.id as string });
      utils.alert.list.invalidate();
      setShowAlertModal(false);
    },
  });

  const deleteEvidenceMutation = trpc.risk.deleteEvidence.useMutation({
    onSuccess: () => {
      toast.success('证据已删除');
      utils.risk.get.invalidate({ id: params.id as string });
    },
  });

  const updateRectificationMutation = trpc.risk.updateRectificationPlan.useMutation({
    onSuccess: () => {
      toast.success('整改计划已更新');
      utils.risk.get.invalidate({ id: params.id as string });
    },
  });

  const isOverdue = (dueDate: Date | string | null) => {
    if (!dueDate) return false;
    return isBefore(new Date(dueDate), new Date());
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AppLayout>
    );
  }

  if (!risk) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-slate-500">风险不存在</p>
          <Link href="/risks" className="text-blue-600 hover:underline mt-2 inline-block">
            返回列表
          </Link>
        </div>
      </AppLayout>
    );
  }

  const tabs = [
    { id: 'overview', label: '概览' },
    { id: 'assessment', label: '风险评估' },
    { id: 'evidence', label: '证据附件' },
    { id: 'review', label: '复核意见' },
    { id: 'rectification', label: '整改计划' },
    { id: 'contracts', label: '合同关联' },
    { id: 'alerts', label: '越权提醒' },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{risk.title}</h1>
              <div className="flex flex-wrap items-center gap-4 mt-1 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  提交人: {risk.submitter?.name}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDateTime(risk.createdAt)}
                </span>
                {risk.checklist && (
                  <Link
                    href={`/checklists/${risk.checklist.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    关联清单: {risk.checklist.title}
                  </Link>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={getRiskColor(risk.riskLevel)} variant="outline">
              {getRiskLabel(risk.riskLevel)}
            </Badge>
            <Badge className={getStatusColor(risk.status)} variant="outline">
              {getStatusLabel(risk.status)}
            </Badge>
            {isLegal && (
              <>
                <Button variant="outline" onClick={() => setShowEditModal(true)}>
                  <Edit3 className="mr-2 h-4 w-4" />
                  编辑
                </Button>
                <Button
                  variant="warning"
                  onClick={() => setShowAlertModal(true)}
                >
                  <Bell className="mr-2 h-4 w-4" />
                  越权提醒
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">责任部门</p>
              <p className="text-lg font-semibold mt-1">
                {DEPARTMENTS.find((d) => d.value === risk.responsibleDept)?.label}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">负责人</p>
              <p className="text-lg font-semibold mt-1">
                {risk.assignee?.name || '未分配'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">到期日</p>
              <p
                className={`text-lg font-semibold mt-1 ${
                  isOverdue(risk.dueDate) && risk.status !== 'CLOSED'
                    ? 'text-red-600'
                    : ''
                }`}
              >
                {formatDate(risk.dueDate) || '未设置'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">状态流转</p>
              <div className="flex gap-1 mt-2">
                <Select
                  value={risk.status}
                  onChange={(e) =>
                    updateStatusMutation.mutate({
                      id: risk.id,
                      status: e.target.value as any,
                    })
                  }
                  disabled={!isEditable}
                  className="text-sm"
                >
                  {RISK_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium text-slate-900 mb-2">风险描述</h3>
            <p className="text-slate-600 whitespace-pre-wrap">{risk.description}</p>
          </CardContent>
        </Card>

        <div className="flex border-b overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">风险概览</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <ShieldAlert className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-purple-700">
                    {risk.assessments?.[0]?.likelihood || '-'}
                  </p>
                  <p className="text-sm text-purple-600">可能性评分</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-red-700">
                    {risk.assessments?.[0]?.impact || '-'}
                  </p>
                  <p className="text-sm text-red-600">影响程度评分</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-700">
                    {risk.rectificationPlans?.filter((p) => p.status === 'COMPLETED').length || 0}
                    /{risk.rectificationPlans?.length || 0}
                  </p>
                  <p className="text-sm text-green-600">整改完成</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {isLegal && (
                  <Button onClick={() => setShowAssessmentModal(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    添加风险评估
                  </Button>
                )}
                <Button variant="outline" onClick={() => setShowEvidenceModal(true)}>
                  <Upload className="mr-2 h-4 w-4" />
                  上传证据
                </Button>
                {isLegal && (
                  <Button variant="outline" onClick={() => setShowReviewModal(true)}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    添加复核意见
                  </Button>
                )}
                <Button variant="outline" onClick={() => setShowRectificationModal(true)}>
                  <FileText className="mr-2 h-4 w-4" />
                  添加整改计划
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'assessment' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">风险评估历史</CardTitle>
              {isLegal && (
                <Button size="sm" onClick={() => setShowAssessmentModal(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  新评估
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {risk.assessments?.length === 0 ? (
                <p className="text-slate-500 text-center py-8">暂无评估记录</p>
              ) : (
                <div className="space-y-4">
                  {risk.assessments.map((assessment) => (
                    <Card key={assessment.id} className="border-l-4 border-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge className={getRiskColor(assessment.riskLevel)} variant="outline">
                              {getRiskLabel(assessment.riskLevel)}
                            </Badge>
                            <span className="text-sm text-slate-500">
                              可能性: {assessment.likelihood}/10 · 影响: {assessment.impact}/10
                            </span>
                          </div>
                          <span className="text-xs text-slate-500">
                            {formatDateTime(assessment.createdAt)}
                          </span>
                        </div>
                        {assessment.description && (
                          <p className="text-slate-600">{assessment.description}</p>
                        )}
                        <p className="text-sm text-slate-500 mt-2">
                          评估人: {assessment.assessor?.name}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'evidence' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">证据附件 ({risk.evidences?.length || 0})</CardTitle>
              <Button size="sm" onClick={() => setShowEvidenceModal(true)}>
                <Upload className="mr-2 h-4 w-4" />
                上传证据
              </Button>
            </CardHeader>
            <CardContent>
              {risk.evidences?.length === 0 ? (
                <p className="text-slate-500 text-center py-8">暂无证据附件</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {risk.evidences.map((evidence) => (
                    <Card key={evidence.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="bg-blue-100 p-2 rounded-lg">
                              <FileText className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium">{evidence.fileName}</p>
                              <p className="text-xs text-slate-500">
                                {evidence.fileType} · {formatDateTime(evidence.createdAt)}
                              </p>
                            </div>
                          </div>
                          {isLegal && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                if (confirm('确定删除这个证据吗？')) {
                                  deleteEvidenceMutation.mutate({ id: evidence.id });
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                        {evidence.description && (
                          <p className="text-sm text-slate-600 mt-2">
                            {evidence.description}
                          </p>
                        )}
                        <p className="text-xs text-slate-500 mt-2">
                          上传人: {evidence.uploader?.name}
                        </p>
                        <a
                          href={evidence.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                        >
                          查看文件
                        </a>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'review' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">复核意见 ({risk.reviewOpinions?.length || 0})</CardTitle>
              {isLegal && (
                <Button size="sm" onClick={() => setShowReviewModal(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  添加意见
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {risk.reviewOpinions?.length === 0 ? (
                <p className="text-slate-500 text-center py-8">暂无复核意见</p>
              ) : (
                <div className="space-y-4">
                  {risk.reviewOpinions.map((opinion) => (
                    <Card key={opinion.id} className="border-l-4 border-indigo-500">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-slate-400" />
                            <span className="font-medium">{opinion.reviewer?.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {getRoleLabel(opinion.reviewer?.role || '')}
                            </Badge>
                          </div>
                          <span className="text-xs text-slate-500">
                            {formatDateTime(opinion.createdAt)}
                          </span>
                        </div>
                        <p className="text-slate-700 whitespace-pre-wrap">{opinion.content}</p>
                        <div className="flex items-center gap-2 mt-3">
                          <Badge variant={opinion.status === 'APPROVED' ? 'success' : opinion.status === 'REJECTED' ? 'danger' : 'warning'}>
                            {opinion.status === 'APPROVED' ? '已通过' : opinion.status === 'REJECTED' ? '已驳回' : '待处理'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'rectification' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">整改计划 ({risk.rectificationPlans?.length || 0})</CardTitle>
              <Button size="sm" onClick={() => setShowRectificationModal(true)}>
                <Plus className="mr-2 h-4 w-4" />
                添加计划
              </Button>
            </CardHeader>
            <CardContent>
              {risk.rectificationPlans?.length === 0 ? (
                <p className="text-slate-500 text-center py-8">暂无整改计划</p>
              ) : (
                <div className="space-y-4">
                  {risk.rectificationPlans.map((plan) => (
                    <Card key={plan.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-medium">{plan.description}</h4>
                            <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                到期: {formatDate(plan.dueDate)}
                              </span>
                              {plan.completedAt && (
                                <span className="flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                                  完成: {formatDate(plan.completedAt)}
                                </span>
                              )}
                            </div>
                          </div>
                          <Select
                            value={plan.status}
                            onChange={(e) =>
                              updateRectificationMutation.mutate({
                                id: plan.id,
                                status: e.target.value as any,
                                completedAt:
                                  e.target.value === 'COMPLETED'
                                    ? new Date().toISOString()
                                    : undefined,
                              })
                            }
                            className="w-32 text-sm"
                          >
                            <option value="PENDING">待开始</option>
                            <option value="IN_PROGRESS">进行中</option>
                            <option value="COMPLETED">已完成</option>
                          </Select>
                        </div>
                        <p className="text-sm text-slate-600">
                          <span className="font-medium">整改措施：</span>
                          {plan.actions}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'contracts' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">关联合同 ({risk.contracts?.length || 0})</CardTitle>
              {isLegal && (
                <Link href={`/contracts/new?riskId=${risk.id}`}>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    关联合同
                  </Button>
                </Link>
              )}
            </CardHeader>
            <CardContent>
              {risk.contracts?.length === 0 ? (
                <p className="text-slate-500 text-center py-8">暂无关联合同</p>
              ) : (
                <div className="space-y-3">
                  {risk.contracts.map((contract) => (
                    <Link
                      key={contract.id}
                      href={`/contracts/${contract.id}`}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="font-medium">{contract.title}</p>
                          <p className="text-xs text-slate-500">版本: {contract.version}</p>
                        </div>
                      </div>
                      <Badge variant="outline">{contract.status}</Badge>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'alerts' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">越权提醒 ({risk.alerts?.length || 0})</CardTitle>
              {isLegal && (
                <Button size="sm" onClick={() => setShowAlertModal(true)}>
                  <Bell className="mr-2 h-4 w-4" />
                  发送提醒
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {risk.alerts?.length === 0 ? (
                <p className="text-slate-500 text-center py-8">暂无越权提醒</p>
              ) : (
                <div className="space-y-3">
                  {risk.alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-200"
                    >
                      <div>
                        <p className="font-medium text-amber-800">{alert.title}</p>
                        <p className="text-xs text-amber-600">
                          {formatDateTime(alert.createdAt)}
                        </p>
                      </div>
                      <Badge
                        variant={
                          alert.status === 'CLOSED'
                            ? 'success'
                            : alert.status === 'OPEN'
                            ? 'danger'
                            : 'warning'
                        }
                      >
                        {alert.status === 'OPEN'
                          ? '待处理'
                          : alert.status === 'ACKNOWLEDGED'
                          ? '已确认'
                          : alert.status === 'INVESTIGATING'
                          ? '调查中'
                          : alert.status === 'RESOLVED'
                          ? '已解决'
                          : '已关闭'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {showAssessmentModal && (
        <AssessmentModal
          riskId={risk.id}
          onClose={() => setShowAssessmentModal(false)}
          onSubmit={(data) => addAssessmentMutation.mutate(data)}
          isLoading={addAssessmentMutation.isLoading}
        />
      )}

      {showEvidenceModal && (
        <EvidenceModal
          riskId={risk.id}
          onClose={() => setShowEvidenceModal(false)}
          onSubmit={(data) => addEvidenceMutation.mutate(data)}
          isLoading={addEvidenceMutation.isLoading}
        />
      )}

      {showReviewModal && (
        <ReviewModal
          riskId={risk.id}
          onClose={() => setShowReviewModal(false)}
          onSubmit={(data) => addReviewMutation.mutate(data)}
          isLoading={addReviewMutation.isLoading}
        />
      )}

      {showRectificationModal && (
        <RectificationModal
          riskId={risk.id}
          onClose={() => setShowRectificationModal(false)}
          onSubmit={(data) => addRectificationMutation.mutate(data)}
          isLoading={addRectificationMutation.isLoading}
        />
      )}

      {showAlertModal && (
        <AlertModal
          riskId={risk.id}
          proBonoLawyers={proBonoLawyers || []}
          onClose={() => setShowAlertModal(false)}
          onSubmit={(data) => createAlertMutation.mutate(data)}
          isLoading={createAlertMutation.isLoading}
        />
      )}

      {showEditModal && (
        <EditRiskModal
          risk={risk}
          legalUsers={legalUsers || []}
          onClose={() => setShowEditModal(false)}
          onSubmit={(data) => updateRiskMutation.mutate(data)}
          isLoading={updateRiskMutation.isLoading}
        />
      )}
    </AppLayout>
  );
}

function Link({ href, children, className }: any) {
  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}

function AssessmentModal({
  riskId,
  onClose,
  onSubmit,
  isLoading,
}: {
  riskId: string;
  onClose: () => void;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    riskLevel: 'MEDIUM',
    likelihood: 5,
    impact: 5,
    description: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ riskId, ...formData });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">风险评估</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>风险等级</Label>
            <Select
              value={formData.riskLevel}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, riskLevel: e.target.value }))
              }
            >
              {RISK_LEVELS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>可能性评分 (1-10)</Label>
            <Input
              type="range"
              min="1"
              max="10"
              value={formData.likelihood}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  likelihood: parseInt(e.target.value),
                }))
              }
            />
            <div className="text-center text-sm text-slate-500">
              {formData.likelihood}
            </div>
          </div>
          <div>
            <Label>影响程度评分 (1-10)</Label>
            <Input
              type="range"
              min="1"
              max="10"
              value={formData.impact}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  impact: parseInt(e.target.value),
                }))
              }
            />
            <div className="text-center text-sm text-slate-500">
              {formData.impact}
            </div>
          </div>
          <div>
            <Label>评估说明</Label>
            <Textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="可选"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? '保存中...' : '保存评估'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EvidenceModal({
  riskId,
  onClose,
  onSubmit,
  isLoading,
}: {
  riskId: string;
  onClose: () => void;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    fileName: '',
    fileUrl: '',
    fileType: '',
    description: '',
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        fileName: file.name,
        fileType: file.type,
        fileUrl: URL.createObjectURL(file),
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ riskId, ...formData });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold mb-4">上传证据</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>选择文件</Label>
            <Input
              type="file"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
          </div>
          {formData.fileName && (
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-600">已选择: {formData.fileName}</p>
              <p className="text-xs text-slate-500">{formData.fileType}</p>
            </div>
          )}
          <div>
            <Label>描述</Label>
            <Textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="证据说明（可选）"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button type="submit" disabled={isLoading || !formData.fileName}>
              {isLoading ? '上传中...' : '上传'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ReviewModal({
  riskId,
  onClose,
  onSubmit,
  isLoading,
}: {
  riskId: string;
  onClose: () => void;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    content: '',
    status: 'PENDING',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ riskId, ...formData });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold mb-4">复核意见</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>意见内容 *</Label>
            <Textarea
              value={formData.content}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, content: e.target.value }))
              }
              placeholder="请输入复核意见"
              rows={5}
              required
            />
          </div>
          <div>
            <Label>状态</Label>
            <Select
              value={formData.status}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, status: e.target.value }))
              }
            >
              <option value="PENDING">待处理</option>
              <option value="APPROVED">已通过</option>
              <option value="REJECTED">已驳回</option>
            </Select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? '保存中...' : '保存意见'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RectificationModal({
  riskId,
  onClose,
  onSubmit,
  isLoading,
}: {
  riskId: string;
  onClose: () => void;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    description: '',
    actions: '',
    dueDate: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ riskId, ...formData });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold mb-4">整改计划</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>整改内容 *</Label>
            <Input
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="简要描述整改内容"
              required
            />
          </div>
          <div>
            <Label>具体措施 *</Label>
            <Textarea
              value={formData.actions}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, actions: e.target.value }))
              }
              placeholder="详细说明整改措施"
              rows={4}
              required
            />
          </div>
          <div>
            <Label>完成期限 *</Label>
            <Input
              type="date"
              value={formData.dueDate}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, dueDate: e.target.value }))
              }
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? '保存中...' : '添加计划'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AlertModal({
  riskId,
  proBonoLawyers,
  onClose,
  onSubmit,
  isLoading,
}: {
  riskId: string;
  proBonoLawyers: any[];
  onClose: () => void;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    type: 'PERMISSION_ESCALATION',
    title: '',
    description: '',
    assigneeId: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      riskId,
      ...formData,
      type: formData.type as any,
      assigneeId: formData.assigneeId || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold mb-4">发送越权提醒</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>提醒类型</Label>
            <Select
              value={formData.type}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, type: e.target.value }))
              }
            >
              <option value="PERMISSION_ESCALATION">权限越权</option>
              <option value="UNAUTHORIZED_ACCESS">未授权访问</option>
              <option value="DATA_BREACH">数据泄露</option>
              <option value="POLICY_VIOLATION">策略违规</option>
            </Select>
          </div>
          <div>
            <Label>标题 *</Label>
            <Input
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="提醒标题"
              required
            />
          </div>
          <div>
            <Label>详细描述 *</Label>
            <Textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="详细描述越权情况"
              rows={4}
              required
            />
          </div>
          <div>
            <Label>指派给（公益律师）</Label>
            <Select
              value={formData.assigneeId}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, assigneeId: e.target.value }))
              }
            >
              <option value="">自动分配</option>
              {proBonoLawyers.map((lawyer) => (
                <option key={lawyer.id} value={lawyer.id}>
                  {lawyer.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button type="submit" disabled={isLoading} variant="warning">
              {isLoading ? '发送中...' : '发送提醒'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditRiskModal({
  risk,
  legalUsers,
  onClose,
  onSubmit,
  isLoading,
}: {
  risk: any;
  legalUsers: any[];
  onClose: () => void;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    id: risk.id,
    title: risk.title,
    description: risk.description,
    riskLevel: risk.riskLevel,
    status: risk.status,
    responsibleDept: risk.responsibleDept,
    assigneeId: risk.assigneeId || '',
    dueDate: risk.dueDate ? new Date(risk.dueDate).toISOString().split('T')[0] : '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      riskLevel: formData.riskLevel as any,
      status: formData.status as any,
      responsibleDept: formData.responsibleDept as any,
      assigneeId: formData.assigneeId || undefined,
      dueDate: formData.dueDate || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">编辑风险</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>风险名称 *</Label>
            <Input
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              required
            />
          </div>
          <div>
            <Label>风险描述 *</Label>
            <Textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              rows={3}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>风险等级</Label>
              <Select
                value={formData.riskLevel}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, riskLevel: e.target.value }))
                }
              >
                {RISK_LEVELS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>状态</Label>
              <Select
                value={formData.status}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, status: e.target.value }))
                }
              >
                {RISK_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <Label>责任部门</Label>
            <Select
              value={formData.responsibleDept}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  responsibleDept: e.target.value,
                }))
              }
            >
              {DEPARTMENTS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>负责人</Label>
            <Select
              value={formData.assigneeId}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, assigneeId: e.target.value }))
              }
            >
              <option value="">未分配</option>
              {legalUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>到期日</Label>
            <Input
              type="date"
              value={formData.dueDate}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, dueDate: e.target.value }))
              }
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? '保存中...' : '保存'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
