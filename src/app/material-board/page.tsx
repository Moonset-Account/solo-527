'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FileCheck,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileWarning,
  TrendingUp,
  Users,
  Shield,
  ChevronRight,
  Eye,
  Paperclip,
  Bell,
  FileText,
  Check,
  X,
} from 'lucide-react';
import { getDataService } from '@/lib/data-service';
import {
  getContractStatusLabel,
  getRiskLevelLabel,
  getMaterialStatusLabel,
  formatDate,
  cn,
} from '@/lib/utils';
import { ContractStatus, RiskLevel, MaterialStatus, UserRole } from '@prisma/client';

export default function MaterialBoardPage() {
  const [data, setData] = useState<any>(null);
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedContract, setSelectedContract] = useState<any>(null);

  async function loadBoard() {
    const [contractsRes, usersRes] = await Promise.all([
      fetch('/api/contracts'),
      fetch('/api/users'),
    ]);
    let contracts: any[] = [];
    let users: any[] = [];
    if (contractsRes.ok) {
      const cData = await contractsRes.json();
      contracts = cData.contracts || [];
    }
    if (usersRes.ok) {
      const uData = await usersRes.json();
      users = uData.users || [];
    }
    const allMaterials: any[] = [];
    for (const c of contracts) {
      const mRes = await fetch(`/api/contracts/${c.id}/materials`);
      if (mRes.ok) {
        const mData = await mRes.json();
        allMaterials.push(...(mData.materials || []).map((m: any) => ({ ...m, contractTitle: c.title })));
      }
    }
    setData({ contracts, users, materials: allMaterials });
  }

  useEffect(() => {
    loadBoard();
  }, []);

  if (!data) return <div className="p-8 text-gray-500">加载中...</div>;

  const { contracts, users, materials } = data;
  const userMap = new Map<string, any>(users.map((u: any) => [u.id, u]));

  const materialIncompleteContracts = contracts.filter((c: any) => !c.materialComplete);
  const materialCompleteContracts = contracts.filter((c: any) => c.materialComplete);
  const highRiskContracts = contracts.filter((c: any) =>
    c.riskLevel === RiskLevel.HIGH || c.riskLevel === RiskLevel.CRITICAL
  );
  const proBonoLawyers = users.filter((u: any) => u.role === UserRole.PRO_BONO_LAWYER);

  let filteredContracts = contracts;
  if (filterRisk !== 'all') {
    if (filterRisk === 'high') {
      filteredContracts = filteredContracts.filter((c: any) =>
        c.riskLevel === RiskLevel.HIGH || c.riskLevel === RiskLevel.CRITICAL
      );
    } else if (filterRisk === 'medium') {
      filteredContracts = filteredContracts.filter((c: any) => c.riskLevel === RiskLevel.MEDIUM);
    } else if (filterRisk === 'low') {
      filteredContracts = filteredContracts.filter((c: any) =>
        c.riskLevel === RiskLevel.LOW || !c.riskLevel
      );
    }
  }
  if (filterStatus !== 'all') {
    if (filterStatus === 'incomplete') {
      filteredContracts = filteredContracts.filter((c: any) => !c.materialComplete);
    } else if (filterStatus === 'complete') {
      filteredContracts = filteredContracts.filter((c: any) => c.materialComplete);
    }
  }

  function getRiskBadgeClass(risk: string | null | undefined) {
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

  function getMaterialStatusIcon(complete: boolean) {
    return complete ? (
      <CheckCircle className="h-5 w-5 text-success-500" />
    ) : (
      <AlertTriangle className="h-5 w-5 text-warning-500" />
    );
  }

  function getMaterialStatusBadgeClass(status: string) {
    switch (status) {
      case MaterialStatus.VERIFIED: return 'badge-success';
      case MaterialStatus.UPLOADED: return 'badge-primary';
      case MaterialStatus.REJECTED: return 'badge-danger';
      default: return 'badge-gray';
    }
  }

  const selectedMaterials = selectedContract
    ? materials.filter((m: any) => m.contractId === selectedContract.id)
    : [];

  const pendingCount = selectedMaterials.filter((m: any) => m.status === MaterialStatus.PENDING).length;
  const uploadedCount = selectedMaterials.filter((m: any) => m.status === MaterialStatus.UPLOADED).length;
  const verifiedCount = selectedMaterials.filter((m: any) => m.status === MaterialStatus.VERIFIED).length;
  const rejectedCount = selectedMaterials.filter((m: any) => m.status === MaterialStatus.REJECTED).length;

  async function markMaterialComplete(contractId: string) {
    const svc = await getDataService();
    const all = await svc.getContractMaterials(contractId);
    await Promise.all(all.map((m: any) => svc.updateMaterial(m.id, { status: MaterialStatus.VERIFIED })));
    setSelectedContract(null);
    // Refresh
    const contracts = await svc.getContracts();
    setData({ ...data, contracts });
  }

  const contractMaterialsMap: Record<string, any[]> = {};
  for (const m of materials) {
    if (!contractMaterialsMap[m.contractId]) contractMaterialsMap[m.contractId] = [];
    contractMaterialsMap[m.contractId].push(m);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">材料完整看板</h1>
          <p className="mt-1 text-sm text-gray-500">公益律师合同风险监控与材料完整性管理</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge badge-danger flex items-center gap-1">
            <Bell className="h-3 w-3" />
            公益律师风险提醒专页
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">材料完整</p>
              <p className="mt-1 text-2xl font-bold text-success-600">{materialCompleteContracts.length}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success-100 text-success-600">
              <CheckCircle className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-500 flex items-center">
            <TrendingUp className="mr-1 h-3 w-3 text-success-600" />
            占比 {contracts.length ? Math.round((materialCompleteContracts.length / contracts.length) * 100) : 0}%
          </p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">材料不完整</p>
              <p className="mt-1 text-2xl font-bold text-warning-600">{materialIncompleteContracts.length}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning-100 text-warning-600">
              <FileWarning className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-500">需要补充材料</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">高风险合同</p>
              <p className="mt-1 text-2xl font-bold text-danger-600">{highRiskContracts.length}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-danger-100 text-danger-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-500">需重点关注</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">公益律师</p>
              <p className="mt-1 text-2xl font-bold text-primary-600">{proBonoLawyers.length}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-500">在线处理中</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="flex items-center justify-between border-b border-gray-200 p-4">
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-primary-600" />
                合同材料状态一览
              </h2>
              <div className="flex gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="input text-xs h-8 py-1 w-32"
                >
                  <option value="all">全部状态</option>
                  <option value="incomplete">材料不完整</option>
                  <option value="complete">材料完整</option>
                </select>
                <select
                  value={filterRisk}
                  onChange={(e) => setFilterRisk(e.target.value)}
                  className="input text-xs h-8 py-1 w-32"
                >
                  <option value="all">全部风险</option>
                  <option value="high">高风险</option>
                  <option value="medium">中风险</option>
                  <option value="low">低风险</option>
                </select>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {filteredContracts.map((contract: any) => {
                const assignee = contract.assigneeId ? userMap.get(contract.assigneeId) : null;
                const cMaterials = contractMaterialsMap[contract.id] || [];
                const verified = cMaterials.filter((m: any) => m.status === MaterialStatus.VERIFIED).length;

                return (
                  <div
                    key={contract.id}
                    className={cn(
                      'p-4 hover:bg-gray-50 cursor-pointer transition-colors',
                      selectedContract?.id === contract.id ? 'bg-primary-50' : ''
                    )}
                    onClick={() => setSelectedContract(contract)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {getMaterialStatusIcon(contract.materialComplete)}
                          <h3 className="font-medium text-gray-900 truncate">{contract.title}</h3>
                        </div>
                        <div className="mt-1.5 flex items-center gap-3 text-xs text-gray-500">
                          <span className="text-gray-400">{contract.contractNumber || '未编号'}</span>
                          {contract.riskLevel && (
                            <span className={cn('badge', getRiskBadgeClass(contract.riskLevel))}>
                              {getRiskLevelLabel(contract.riskLevel)}
                            </span>
                          )}
                          <span className="badge badge-primary">
                            {getContractStatusLabel(contract.status)}
                          </span>
                        </div>
                        {cMaterials.length > 0 && (
                          <div className="mt-2 flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  'h-full rounded-full',
                                  contract.materialComplete ? 'bg-success-500' : 'bg-warning-500'
                                )}
                                style={{ width: `${cMaterials.length > 0 ? (verified / cMaterials.length) * 100 : 0}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-500 flex-shrink-0">
                              {verified}/{cMaterials.length}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4 flex-shrink-0 text-right">
                        {assignee && (
                          <div className="flex items-center gap-1.5">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-primary-600 text-xs">
                              {assignee.name.charAt(0)}
                            </div>
                            <span className="text-xs text-gray-600">{assignee.name}</span>
                          </div>
                        )}
                        <p className="mt-1 text-xs text-gray-400">
                          截止: {contract.deadline ? formatDate(contract.deadline).split(' ')[0] : '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center justify-between border-b border-gray-200 p-4">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Shield className="h-5 w-5 text-danger-500" />
                高风险预警
              </h3>
              <span className="badge badge-danger">
                {highRiskContracts.length} 项
              </span>
            </div>
            <div className="divide-y divide-gray-100">
              {highRiskContracts.map((contract: any) => (
                <div key={contract.id} className="p-3 hover:bg-gray-50 cursor-pointer">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-danger-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{contract.title}</p>
                      {contract.riskDescription && (
                        <p className="mt-1 text-xs text-gray-500 line-clamp-2">{contract.riskDescription}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between border-b border-gray-200 p-4">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Users className="h-5 w-5 text-primary-600" />
                公益律师团队
              </h3>
            </div>
            <div className="p-4 space-y-3">
              {proBonoLawyers.map((lawyer: any) => {
                const assignedCount = contracts.filter((c: any) => c.assigneeId === lawyer.id && !c.materialComplete).length;
                return (
                  <div key={lawyer.id} className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-primary-600 font-medium">
                      {lawyer.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{lawyer.name}</p>
                      <p className="text-xs text-gray-500">待处理 {assignedCount} 份</p>
                    </div>
                    <span className="flex h-2 w-2 rounded-full bg-success-500"></span>
                  </div>
                );
              })}
            </div>
          </div>

          {selectedContract && (
            <div className="card">
              <div className="flex items-center justify-between border-b border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-gray-900">材料详情</h3>
                <button
                  onClick={() => setSelectedContract(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">{selectedContract.title}</h4>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <p className="text-lg font-bold text-gray-600">{pendingCount}</p>
                    <p className="text-xs text-gray-500">待上传</p>
                  </div>
                  <div className="text-center p-2 bg-primary-50 rounded">
                    <p className="text-lg font-bold text-primary-600">{uploadedCount}</p>
                    <p className="text-xs text-gray-500">已上传</p>
                  </div>
                  <div className="text-center p-2 bg-success-50 rounded">
                    <p className="text-lg font-bold text-success-600">{verifiedCount}</p>
                    <p className="text-xs text-gray-500">已验证</p>
                  </div>
                  <div className="text-center p-2 bg-danger-50 rounded">
                    <p className="text-lg font-bold text-danger-600">{rejectedCount}</p>
                    <p className="text-xs text-gray-500">已驳回</p>
                  </div>
                </div>

                <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
                  {selectedMaterials.length === 0 ? (
                    <p className="text-center text-sm text-gray-400 py-4">暂无材料</p>
                  ) : (
                    selectedMaterials.map((material: any) => (
                      <div key={material.id} className="flex items-center gap-2 text-sm p-2 rounded bg-gray-50">
                        <Paperclip className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span className="flex-1 truncate text-gray-700">{material.name}</span>
                        <span className={cn('badge text-xs flex-shrink-0', getMaterialStatusBadgeClass(material.status))}>
                          {getMaterialStatusLabel(material.status)}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/contracts/${selectedContract.id}`}
                    className="btn-secondary flex-1 text-sm"
                  >
                    <Eye className="mr-1 h-4 w-4" />
                    查看详情
                  </Link>
                  {!selectedContract.materialComplete && verifiedCount === selectedMaterials.length && selectedMaterials.length > 0 && (
                    <button
                      onClick={() => markMaterialComplete(selectedContract.id)}
                      className="btn-primary flex-1 text-sm"
                    >
                      <Check className="mr-1 h-4 w-4" />
                      标记完整
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary-600" />
            最近材料更新
          </h2>
          <Link href="/operation-logs" className="text-sm text-primary-600 hover:text-primary-700 flex items-center">
            查看全部 <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="divide-y divide-gray-100">
          {materials.slice(0, 5).map((material: any) => {
            const contract = contracts.find((c: any) => c.id === material.contractId);
            const uploader = userMap.get(material.uploaderId);
            return (
              <div key={material.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-lg',
                    material.status === MaterialStatus.VERIFIED ? 'bg-success-100 text-success-600' :
                    material.status === MaterialStatus.UPLOADED ? 'bg-primary-100 text-primary-600' :
                    'bg-gray-100 text-gray-600'
                  )}>
                    <Paperclip className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{material.name}</p>
                    <p className="text-xs text-gray-500">
                      {contract?.title || '未知合同'} · {uploader?.name || '未知用户'}
                    </p>
                  </div>
                  <span className={cn('badge', getMaterialStatusBadgeClass(material.status))}>
                    {getMaterialStatusLabel(material.status)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
