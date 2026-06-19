'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  FileText,
  Search,
  Filter,
  Upload,
  Plus,
  ChevronDown,
  AlertTriangle,
  Clock,
  FileCheck,
} from 'lucide-react';
import { getDataService } from '@/lib/data-service';
import { getContractStatusLabel, getRiskLevelLabel, formatDate, formatFileSize, cn } from '@/lib/utils';
import { ContractStatus, RiskLevel } from '@prisma/client';

export function ContractListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    contractNumber: '',
    assigneeId: '',
    deadline: '',
    fileName: '',
    fileSize: 0,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      const service = await getDataService();
      const data = await service.getContracts();
      setContracts(data);
      setLoading(false);
    }
    loadData();
  }, []);

  async function handleUploadSubmit() {
    if (!uploadForm.title.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: uploadForm.title,
          contractNumber: uploadForm.contractNumber || undefined,
          assigneeId: uploadForm.assigneeId || undefined,
          deadline: uploadForm.deadline || undefined,
          fileName: uploadForm.fileName || '合同文件.pdf',
          fileSize: uploadForm.fileSize || 102400,
          uploaderId: 'user-1',
        }),
      });
      if (res.ok) {
        const service = await getDataService();
        const data = await service.getContracts();
        setContracts(data);
        setShowUploadModal(false);
        setUploadForm({ title: '', contractNumber: '', assigneeId: '', deadline: '', fileName: '', fileSize: 0 });
      }
    } finally {
      setSubmitting(false);
    }
  }

  let filteredContracts = contracts;

  if (searchTerm) {
    filteredContracts = filteredContracts.filter((c: any) =>
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.contractNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  if (statusFilter !== 'all') {
    filteredContracts = filteredContracts.filter((c: any) => c.status === statusFilter);
  }

  if (riskFilter !== 'all') {
    filteredContracts = filteredContracts.filter((c: any) => c.riskLevel === riskFilter);
  }

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
        return 'badge-danger';
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">合同管理</h1>
            <p className="mt-1 text-sm text-gray-500">管理所有合同的上传、审阅和跟踪</p>
          </div>
        </div>
        <div className="card p-12 text-center">
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">合同管理</h1>
          <p className="mt-1 text-sm text-gray-500">管理所有合同的上传、审阅和跟踪</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="btn-primary"
        >
          <Upload className="mr-2 h-4 w-4" />
          上传合同
        </button>
      </div>

      <div className="card p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索合同名称或编号..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input w-40"
            >
              <option value="all">全部状态</option>
              <option value="DRAFT">草稿</option>
              <option value="PENDING_REVIEW">待审阅</option>
              <option value="UNDER_REVIEW">审阅中</option>
              <option value="REVISE_REQUESTED">待修改</option>
              <option value="APPROVED">已通过</option>
              <option value="STAMPED">已盖章</option>
              <option value="COMPLETED">已完成</option>
              <option value="REJECTED">已驳回</option>
            </select>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="input w-40"
            >
              <option value="all">全部风险</option>
              <option value="LOW">低风险</option>
              <option value="MEDIUM">中风险</option>
              <option value="HIGH">高风险</option>
              <option value="CRITICAL">严重风险</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                合同信息
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                状态
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                风险等级
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                截止日期
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                材料
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filteredContracts.map((contract: any) => (
              <tr key={contract.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-4 py-4">
                  <div className="flex items-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{contract.title}</p>
                      <p className="text-xs text-gray-500">
                        {contract.contractNumber || '未编号'} · {formatFileSize(contract.fileSize)}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-4">
                  <span className={cn('badge', getStatusBadgeClass(contract.status))}>
                    {getContractStatusLabel(contract.status)}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-4">
                  {contract.riskLevel ? (
                    <span className={cn('badge', getRiskBadgeClass(contract.riskLevel))}>
                      {getRiskLevelLabel(contract.riskLevel)}
                    </span>
                  ) : (
                    <span className="badge badge-gray">未评估</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500">
                  {contract.deadline ? formatDate(contract.deadline).split(' ')[0] : '-'}
                </td>
                <td className="whitespace-nowrap px-4 py-4">
                  <span className={cn(
                    'inline-flex items-center gap-1 text-xs',
                    contract.materialComplete ? 'text-success-600' : 'text-warning-600'
                  )}>
                    {contract.materialComplete ? (
                      <FileCheck className="h-3.5 w-3.5" />
                    ) : (
                      <AlertTriangle className="h-3.5 w-3.5" />
                    )}
                    {contract.materialComplete ? '完整' : '不完整'}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-right text-sm">
                  <Link
                    href={`/contracts/${contract.id}`}
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    查看详情
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredContracts.length === 0 && (
          <div className="p-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500">暂无合同数据</p>
          </div>
        )}
      </div>

      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">上传合同</h3>
            <div className="space-y-4">
              <div>
                <label className="label">合同名称</label>
                <input
                  type="text"
                  className="input"
                  placeholder="请输入合同名称"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                />
              </div>
              <div>
                <label className="label">合同编号</label>
                <input
                  type="text"
                  className="input"
                  placeholder="请输入合同编号"
                  value={uploadForm.contractNumber}
                  onChange={(e) => setUploadForm({ ...uploadForm, contractNumber: e.target.value })}
                />
              </div>
              <div>
                <label className="label">合同文件</label>
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-400 transition-colors cursor-pointer"
                  onClick={() => {
                    const mockName = `合同_${uploadForm.title || '未命名'}.pdf`;
                    setUploadForm({ ...uploadForm, fileName: mockName, fileSize: Math.floor(Math.random() * 500000) + 50000 });
                  }}
                >
                  <Upload className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                  {uploadForm.fileName ? (
                    <p className="text-sm text-primary-600 font-medium">{uploadForm.fileName}</p>
                  ) : (
                    <p className="text-sm text-gray-600">点击或拖拽文件到此处上传</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">支持 PDF、DOC、DOCX 格式</p>
                </div>
              </div>
              <div>
                <label className="label">指派给</label>
                <select
                  className="input"
                  value={uploadForm.assigneeId}
                  onChange={(e) => setUploadForm({ ...uploadForm, assigneeId: e.target.value })}
                >
                  <option value="">请选择</option>
                  <option value="user-2">李公益（公益律师）</option>
                  <option value="user-3">王审阅（合同审阅人）</option>
                </select>
              </div>
              <div>
                <label className="label">截止日期</label>
                <input
                  type="date"
                  className="input"
                  value={uploadForm.deadline}
                  onChange={(e) => setUploadForm({ ...uploadForm, deadline: e.target.value })}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowUploadModal(false)}
                className="btn-secondary"
                disabled={submitting}
              >
                取消
              </button>
              <button
                className="btn-primary"
                onClick={handleUploadSubmit}
                disabled={submitting || !uploadForm.title.trim()}
              >
                {submitting ? '提交中...' : '提交'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
