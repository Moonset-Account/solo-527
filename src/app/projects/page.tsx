'use client';

import { AppShell } from '~/components/layout/AppShell';
import { trpc } from '~/app/_trpc/client';
import Link from 'next/link';
import { useState } from 'react';
import { BudgetAlertBadge, BudgetBar, StatusBadge, UserAvatar } from '~/components/ui/Badges';
import { formatDate } from '~/lib/utils';
import type { ProjectStatus } from '@prisma/client';
import { Modal } from '~/components/ui/Modal';
import { EmptyState } from '~/components/ui/EmptyState';
import { Plus, Search, FolderOpen } from 'lucide-react';

export default function ProjectsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'ALL'>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    address: '',
    area: '',
    totalBudget: '',
    description: '',
  });

  const utils = trpc.useUtils();
  const projectsQuery = trpc.project.list.useQuery({
    search: search || undefined,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
  });
  const usersQuery = trpc.user.list.useQuery();

  const createProject = trpc.project.create.useMutation({
    onSuccess: () => {
      utils.project.list.invalidate();
      setShowCreateModal(false);
      setFormData({
        name: '',
        clientName: '',
        clientPhone: '',
        clientEmail: '',
        address: '',
        area: '',
        totalBudget: '',
        description: '',
      });
    },
  });

  const handleSubmit = () => {
    createProject.mutate({
      name: formData.name,
      clientName: formData.clientName,
      clientPhone: formData.clientPhone,
      clientEmail: formData.clientEmail || undefined,
      address: formData.address,
      area: formData.area ? parseFloat(formData.area) : undefined,
      totalBudget: formData.totalBudget ? parseFloat(formData.totalBudget) : 0,
      description: formData.description || undefined,
    });
  };

  const projects = projectsQuery.data ?? [];

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-navy-800">项目列表</h1>
            <p className="section-subtitle">管理所有设计项目</p>
          </div>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary inline-flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> 新建项目
          </button>
        </div>

        <div className="card p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索项目名称/编号/客户/地址"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-9"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | 'ALL')}
              className="input w-48"
            >
              <option value="ALL">全部状态</option>
              <option value="DRAFT">草稿</option>
              <option value="QUOTATION_PENDING">报价待确认</option>
              <option value="QUOTATION_CONFIRMED">报价已确认</option>
              <option value="IN_PROGRESS">进行中</option>
              <option value="INSPECTION">巡检中</option>
              <option value="ACCEPTANCE">验收中</option>
              <option value="COMPLETED">已完成</option>
              <option value="ON_HOLD">暂停</option>
              <option value="CANCELLED">已取消</option>
            </select>
          </div>
        </div>

        <div className="card overflow-auto">
          {projectsQuery.isLoading ? (
            <div className="p-8 text-center text-gray-400">加载中...</div>
          ) : projects.length === 0 ? (
            <EmptyState title="暂无项目" description="点击右上角新建项目" icon={<FolderOpen className="w-7 h-7 text-gray-400" />} />
          ) : (
            <table className="table">
              <thead>
                <tr className="border-b bg-gray-50/50">
                  <th className="table-th">编号</th>
                  <th className="table-th">项目名称</th>
                  <th className="table-th">客户</th>
                  <th className="table-th">地址</th>
                  <th className="table-th">状态</th>
                  <th className="table-th w-56">预算执行</th>
                  <th className="table-th">预警</th>
                  <th className="table-th">设计师</th>
                  <th className="table-th">创建时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {projects.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="table-td font-mono text-sm">
                      <Link href={`/projects/${p.id}`} className="text-brand-600 hover:text-brand-700 font-medium">
                        {p.code}
                      </Link>
                    </td>
                    <td className="table-td font-medium text-navy-800">
                      <Link href={`/projects/${p.id}`} className="hover:text-brand-600 transition-colors">
                        {p.name}
                      </Link>
                    </td>
                    <td className="table-td text-sm">
                      <div>{p.clientName}</div>
                      <div className="text-xs text-gray-400">{p.clientPhone}</div>
                    </td>
                    <td className="table-td text-sm text-gray-600">{p.address}</td>
                    <td className="table-td"><StatusBadge status={p.status} /></td>
                    <td className="table-td">
                      <BudgetBar
                        usedPercent={p.budgetUsedPercent}
                        amount={p.actualCost.toNumber()}
                        budget={p.totalBudget.toNumber()}
                      />
                    </td>
                    <td className="table-td"><BudgetAlertBadge level={p.budgetAlertLevel} /></td>
                    <td className="table-td"><UserAvatar name={p.designer?.name} /></td>
                    <td className="table-td text-sm text-gray-400">{formatDate(p.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal
        title="新建项目"
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleSubmit}
        submitLabel="创建"
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">项目名称 *</label>
            <input className="input mt-1" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          </div>
          <div>
            <label className="label">客户姓名 *</label>
            <input className="input mt-1" value={formData.clientName} onChange={(e) => setFormData({ ...formData, clientName: e.target.value })} required />
          </div>
          <div>
            <label className="label">客户电话 *</label>
            <input className="input mt-1" value={formData.clientPhone} onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })} required />
          </div>
          <div>
            <label className="label">客户邮箱</label>
            <input type="email" className="input mt-1" value={formData.clientEmail} onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })} />
          </div>
          <div>
            <label className="label">预算金额 (元)</label>
            <input type="number" className="input mt-1" value={formData.totalBudget} onChange={(e) => setFormData({ ...formData, totalBudget: e.target.value })} />
          </div>
          <div className="col-span-2">
            <label className="label">项目地址 *</label>
            <input className="input mt-1" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} required />
          </div>
          <div>
            <label className="label">面积 (㎡)</label>
            <input type="number" className="input mt-1" value={formData.area} onChange={(e) => setFormData({ ...formData, area: e.target.value })} />
          </div>
          <div>
            <label className="label">负责人</label>
            <select className="input mt-1">
              <option value="">-- 选择 --</option>
              {usersQuery.data?.map((u) => (
                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label className="label">项目描述</label>
            <textarea className="input mt-1 min-h-[80px]" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}
