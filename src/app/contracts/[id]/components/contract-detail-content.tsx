'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  FileText,
  Download,
  MessageSquare,
  Paperclip,
  Stamp,
  History,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
  Send,
  User,
  Upload,
} from 'lucide-react';
import { getDataService } from '@/lib/data-service';
import {
  getContractStatusLabel,
  getRiskLevelLabel,
  getMaterialStatusLabel,
  getOperationTypeLabel,
  formatDate,
  formatFileSize,
  cn,
} from '@/lib/utils';
import { ContractStatus, RiskLevel, MaterialStatus } from '@prisma/client';

type TabType = 'overview' | 'reviews' | 'materials' | 'stamp' | 'downloads' | 'logs';

export function ContractDetailContent() {
  const params = useParams();
  const router = useRouter();
  const contractId = params.id as string;
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [reviewText, setReviewText] = useState('');
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [contract, setContract] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [stampNodes, setStampNodes] = useState<any[]>([]);
  const [downloadRecords, setDownloadRecords] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const service = await getDataService();
      const [contractData, reviewsData, materialsData, stampNodesData, downloadRecordsData, logsData, usersData] = await Promise.all([
        service.getContractById(contractId),
        service.getContractReviews(contractId),
        service.getContractMaterials(contractId),
        service.getStampNodes(contractId),
        service.getDownloadRecords({ contractId }),
        service.getOperationLogs({ contractId }),
        service.getUsers(),
      ]);
      setContract(contractData);
      setReviews(reviewsData);
      setMaterials(materialsData);
      setStampNodes(stampNodesData);
      setDownloadRecords(downloadRecordsData);
      setLogs(logsData);
      setUsers(usersData);
      setLoading(false);
    }
    loadData();
  }, [contractId]);

  const userMap = new Map(users.map(u => [u.id, u]));

  const uploader = contract ? userMap.get(contract.uploaderId) : null;
  const assignee = contract && contract.assigneeId ? userMap.get(contract.assigneeId) : null;

  const tabs = [
    { id: 'overview', label: '概览', icon: FileText },
    { id: 'reviews', label: '审阅意见', icon: MessageSquare },
    { id: 'materials', label: '证据材料', icon: Paperclip },
    { id: 'stamp', label: '盖章节点', icon: Stamp },
    { id: 'downloads', label: '下载记录', icon: Download },
    { id: 'logs', label: '操作留痕', icon: History },
  ];

  function getStatusBadgeClass(status: string) {
    switch (status) {
      case ContractStatus.APPROVED:
      case ContractStatus.STAMPED:
      case ContractStatus.COMPLETED:
        return 'badge-success';
      case ContractStatus.REJECTED:
        return 'badge-danger';
      case ContractStatus.UNDER_REVIEW:
      case ContractStatus.REVISE_REQUESTED:
        return 'badge-warning';
      case ContractStatus.PENDING_REVIEW:
        return 'badge-primary';
      default:
        return 'badge-gray';
    }
  }

  function getRiskBadgeClass(risk: string | null) {
    switch (risk) {
      case RiskLevel.CRITICAL:
      case RiskLevel.HIGH:
        return 'badge-danger';
      case RiskLevel.MEDIUM:
        return 'badge-warning';
      case RiskLevel.LOW:
        return 'badge-success';
      default:
        return 'badge-gray';
    }
  }

  function getMaterialStatusClass(status: string) {
    switch (status) {
      case MaterialStatus.VERIFIED:
        return 'badge-success';
      case MaterialStatus.UPLOADED:
        return 'badge-primary';
      case MaterialStatus.REJECTED:
        return 'badge-danger';
      default:
        return 'badge-gray';
    }
  }

  const verifiedCount = materials.filter((m: any) => m.status === MaterialStatus.VERIFIED).length;
  const materialComplete = verifiedCount === materials.length && materials.length > 0;

  async function handleSubmitReview() {
    if (!reviewText.trim()) return;
    const service = await getDataService();
    await service.createContractReview({
      contractId,
      reviewerId: 'user-1',
      comment: reviewText,
      riskLevel: RiskLevel.MEDIUM,
      isApproved: undefined,
    });
    setReviewText('');
    const updatedReviews = await service.getContractReviews(contractId);
    setReviews(updatedReviews);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/contracts" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900 truncate">加载中...</h1>
          </div>
        </div>
        <div className="card p-12 text-center">
          <p className="text-gray-500">正在加载合同详情...</p>
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <FileText className="h-16 w-16 text-gray-300 mb-4" />
        <p className="text-gray-500 mb-4">合同不存在</p>
        <Link href="/contracts" className="btn-primary">
          返回列表
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/contracts" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900 truncate">{contract.title}</h1>
            <span className={cn('badge', getStatusBadgeClass(contract.status))}>
              {getContractStatusLabel(contract.status)}
            </span>
            {contract.riskLevel && (
              <span className={cn('badge', getRiskBadgeClass(contract.riskLevel))}>
                {getRiskLevelLabel(contract.riskLevel)}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500">
            编号: {contract.contractNumber || '未编号'} · 版本 v{contract.version}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary">
            <Download className="mr-2 h-4 w-4" />
            下载
          </button>
          <button className="btn-primary">
            提交审阅
          </button>
        </div>
      </div>

      <div className="card">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-1 px-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={cn(
                    'flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                  {tab.id === 'reviews' && reviews.length > 0 && (
                    <span className="ml-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                      {reviews.length}
                    </span>
                  )}
                  {tab.id === 'materials' && materials.length > 0 && (
                    <span className={cn(
                      'ml-1 rounded-full px-2 py-0.5 text-xs',
                      materialComplete ? 'bg-success-100 text-success-700' : 'bg-warning-100 text-warning-700'
                    )}>
                      {verifiedCount}/{materials.length}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">合同描述</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {contract.description || '暂无描述'}
                  </p>
                </div>

                {contract.riskDescription && (
                  <div className="rounded-lg bg-danger-50 border border-danger-200 p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-danger-500 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-danger-800">风险说明</h4>
                        <p className="mt-1 text-sm text-danger-700">{contract.riskDescription}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">审阅进度</h3>
                  <div className="space-y-3">
                    {[
                      { label: '合同上传', done: true, date: contract.createdAt },
                      { label: '分配审阅人', done: !!contract.assigneeId, date: contract.createdAt },
                      { label: '审阅中', done: contract.status !== ContractStatus.DRAFT && contract.status !== ContractStatus.PENDING_REVIEW },
                      { label: '审批通过', done: contract.status === ContractStatus.APPROVED || contract.status === ContractStatus.STAMPED || contract.status === ContractStatus.COMPLETED },
                      { label: '盖章完成', done: contract.status === ContractStatus.STAMPED || contract.status === ContractStatus.COMPLETED },
                    ].map((step, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className={cn(
                          'flex h-6 w-6 items-center justify-center rounded-full flex-shrink-0',
                          step.done ? 'bg-success-100 text-success-600' : 'bg-gray-100 text-gray-400'
                        )}>
                          {step.done ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <Clock className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className={cn(
                            'text-sm',
                            step.done ? 'text-gray-900 font-medium' : 'text-gray-500'
                          )}>
                            {step.label}
                          </p>
                          {step.date && (
                            <p className="text-xs text-gray-400">{formatDate(step.date)}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-lg bg-gray-50 p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">基本信息</h3>
                  <dl className="space-y-3">
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">上传人</dt>
                      <dd className="text-sm text-gray-900">{uploader?.name || '未知'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">当前处理人</dt>
                      <dd className="text-sm text-gray-900">{assignee?.name || '未分配'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">文件大小</dt>
                      <dd className="text-sm text-gray-900">{formatFileSize(contract.fileSize)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">上传时间</dt>
                      <dd className="text-sm text-gray-900">{formatDate(contract.createdAt).split(' ')[0]}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">截止日期</dt>
                      <dd className="text-sm text-danger-600 font-medium">
                        {contract.deadline ? formatDate(contract.deadline).split(' ')[0] : '-'}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">材料完整</dt>
                      <dd className={cn(
                        'text-sm font-medium',
                        materialComplete ? 'text-success-600' : 'text-warning-600'
                      )}>
                        {materialComplete ? '是' : '否'}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="rounded-lg bg-gray-50 p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">材料完整度</h3>
                  <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        materialComplete ? 'bg-success-500' : 'bg-warning-500'
                      )}
                      style={{ width: `${materials.length > 0 ? (verifiedCount / materials.length) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <p className="mt-2 text-xs text-gray-500 text-right">
                    {verifiedCount} / {materials.length} 份材料已验证
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900">审阅意见列表</h3>
                <span className="text-sm text-gray-500">共 {reviews.length} 条意见</span>
              </div>

              <div className="space-y-4">
                {reviews.length === 0 ? (
                  <div className="py-12 text-center">
                    <MessageSquare className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                    <p className="text-gray-500">暂无审阅意见</p>
                  </div>
                ) : (
                  reviews.map((review: any) => {
                    const reviewer = userMap.get(review.reviewerId) || review.reviewer;
                    return (
                      <div key={review.id} className="rounded-lg border border-gray-200 p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-primary-600 text-sm font-medium">
                              {reviewer?.name?.charAt(0) || '?'}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {reviewer?.name || '未知用户'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatDate(review.createdAt)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {review.riskLevel && (
                              <span className={cn('badge', getRiskBadgeClass(review.riskLevel))}>
                                {getRiskLevelLabel(review.riskLevel)}
                              </span>
                            )}
                            {review.isApproved === true && (
                              <span className="badge badge-success">
                                <CheckCircle className="mr-1 h-3 w-3" />
                                同意
                              </span>
                            )}
                            {review.isApproved === false && (
                              <span className="badge badge-danger">
                                <XCircle className="mr-1 h-3 w-3" />
                                驳回
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="mt-3 pl-12">
                          <p className="text-sm text-gray-700">{review.comment}</p>
                          {review.suggestions && (
                            <div className="mt-2 rounded-lg bg-gray-50 p-3">
                              <p className="text-xs font-medium text-gray-500 mb-1">修改建议</p>
                              <p className="text-sm text-gray-600">{review.suggestions}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-3">提交审阅意见</h4>
                <div className="rounded-lg border border-gray-200 p-4">
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="请输入您的审阅意见..."
                    className="input min-h-[100px] resize-none"
                  />
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex gap-2">
                      <select className="input w-40">
                        <option value="">风险等级</option>
                        <option value="LOW">低风险</option>
                        <option value="MEDIUM">中风险</option>
                        <option value="HIGH">高风险</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button className="btn-secondary text-danger-600 border-danger-200 hover:bg-danger-50">
                        驳回
                      </button>
                      <button
                        onClick={handleSubmitReview}
                        className="btn-primary"
                      >
                        <Send className="mr-2 h-4 w-4" />
                        提交意见
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'materials' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900">证据材料清单</h3>
                <button
                  onClick={() => setShowAddMaterial(true)}
                  className="btn-secondary text-sm"
                >
                  <Plus className="mr-1 h-4 w-4" />
                  添加材料
                </button>
              </div>

              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        材料名称
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        状态
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        上传人
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        验证人
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        上传时间
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {materials.map((material: any) => {
                      const materialUploader = userMap.get(material.uploaderId) || material.uploader;
                      const verifier = material.verifierId ? (userMap.get(material.verifierId) || material.verifier) : null;
                      return (
                        <tr key={material.id} className="hover:bg-gray-50">
                          <td className="whitespace-nowrap px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Paperclip className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-900">{material.name}</span>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            <span className={cn('badge', getMaterialStatusClass(material.status))}>
                              {getMaterialStatusLabel(material.status)}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                            {materialUploader?.name || '-'}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                            {verifier?.name || '-'}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                            {formatDate(material.createdAt).split(' ')[0]}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-success-500" />
                  <span className="text-sm text-gray-700">
                    材料完整度：{verifiedCount} / {materials.length} 已验证
                  </span>
                </div>
                <button className="btn-primary text-sm">
                  标记材料完整
                </button>
              </div>

              {showAddMaterial && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                  <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">添加证据材料</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="label">材料名称</label>
                        <input type="text" className="input" placeholder="请输入材料名称" />
                      </div>
                      <div>
                        <label className="label">材料文件</label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors cursor-pointer">
                          <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600">点击或拖拽文件上传</p>
                        </div>
                      </div>
                      <div>
                        <label className="label">备注说明</label>
                        <textarea className="input min-h-[80px] resize-none" placeholder="可选" />
                      </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                      <button onClick={() => setShowAddMaterial(false)} className="btn-secondary">
                        取消
                      </button>
                      <button className="btn-primary">确认添加</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'stamp' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900">盖章节点流程</h3>
                <button className="btn-secondary text-sm">
                  <Plus className="mr-1 h-4 w-4" />
                  添加节点
                </button>
              </div>

              <div className="relative">
                <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                <div className="space-y-6">
                  {stampNodes.map((node: any, index: number) => {
                    const stampUser = node.stampUserId ? (userMap.get(node.stampUserId) || node.stampUser) : null;
                    const isCompleted = node.isCompleted;
                    return (
                      <div key={node.id} className="relative flex items-start gap-4 pl-12">
                        <div className={cn(
                          'absolute left-0 flex h-10 w-10 items-center justify-center rounded-full border-2',
                          isCompleted
                            ? 'border-success-500 bg-success-500 text-white'
                            : 'border-gray-300 bg-white text-gray-400'
                        )}>
                          <Stamp className="h-5 w-5" />
                        </div>
                        <div className={cn(
                          'flex-1 rounded-lg border p-4',
                          isCompleted ? 'border-success-200 bg-success-50' : 'border-gray-200 bg-white'
                        )}>
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">
                                {node.nodeName}
                              </h4>
                              <p className="text-xs text-gray-500 mt-0.5">
                                第 {node.orderIndex} 个节点
                              </p>
                            </div>
                            <span className={cn(
                              'badge',
                              isCompleted ? 'badge-success' : 'badge-gray'
                            )}>
                              {isCompleted ? '已完成' : '待处理'}
                            </span>
                          </div>
                          {isCompleted && (
                            <div className="mt-3 pt-3 border-t border-success-200">
                              <div className="flex items-center gap-2 text-sm">
                                <User className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-600">
                                  {stampUser?.name || '未知用户'}
                                </span>
                                <span className="text-gray-400">·</span>
                                <Clock className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-600">
                                  {node.completedAt ? formatDate(node.completedAt) : '-'}
                                </span>
                              </div>
                              {node.remark && (
                                <p className="mt-2 text-sm text-gray-600">
                                  备注：{node.remark}
                                </p>
                              )}
                            </div>
                          )}
                          {!isCompleted && index === stampNodes.filter((n: any) => !n.isCompleted)[0]?.orderIndex - 1 && (
                            <div className="mt-3 flex gap-2">
                              <button className="btn-primary text-sm">
                                完成盖章
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'downloads' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900">下载记录</h3>
                <span className="text-sm text-gray-500">共 {downloadRecords.length} 次下载</span>
              </div>

              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        文件名
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        下载人
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        下载时间
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        IP地址
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {downloadRecords.map((record: any) => {
                      const user = userMap.get(record.userId) || record.user;
                      return (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="whitespace-nowrap px-4 py-3">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-900">{record.fileName}</span>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                            {user?.name || '-'}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                            {formatDate(record.downloadAt)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500 font-mono">
                            {record.ipAddress || '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900">操作留痕</h3>
                <span className="text-sm text-gray-500">共 {logs.length} 条记录</span>
              </div>

              <div className="relative">
                <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                <div className="space-y-4">
                  {logs.map((log: any) => {
                    const user = userMap.get(log.userId) || log.user;
                    return (
                      <div key={log.id} className="relative pl-8">
                        <div className="absolute left-0 flex h-6 w-6 items-center justify-center rounded-full bg-white border-2 border-primary-200">
                          <div className="h-2 w-2 rounded-full bg-primary-500"></div>
                        </div>
                        <div className="rounded-lg bg-gray-50 p-3">
                          <div className="flex items-center gap-2">
                            <span className="badge badge-primary text-xs">
                              {getOperationTypeLabel(log.operationType)}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDate(log.createdAt)}
                            </span>
                          </div>
                          <p className="mt-1.5 text-sm text-gray-700">{log.description}</p>
                          <p className="mt-1 text-xs text-gray-400">
                            操作人：{user?.name || '未知'}
                            {log.ipAddress && ` · IP: ${log.ipAddress}`}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
