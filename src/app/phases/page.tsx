'use client';

import { AppShell } from '~/components/layout/AppShell';
import { trpc } from '~/app/_trpc/client';
import { useState } from 'react';
import { Modal } from '~/components/ui/Modal';
import { EmptyState } from '~/components/ui/EmptyState';
import { formatDate, formatDateTime } from '~/lib/utils';
import { UserAvatar, StatusBadge } from '~/components/ui/Badges';
import type { ProjectStatus } from '@prisma/client';
import { Plus, CheckCircle, Settings2, ArrowRight } from 'lucide-react';

export default function PhasesPage() {
  const utils = trpc.useUtils();
  const projectsQuery = trpc.project.list.useQuery({});
  const usersQuery = trpc.user.list.useQuery();

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [showPhaseModal, setShowPhaseModal] = useState(false);
  const [phaseForm, setPhaseForm] = useState({ name: '', description: '' });
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusForm, setStatusForm] = useState<{ projectId: string; status: ProjectStatus; remark: string }>({
    projectId: '',
    status: 'DRAFT',
    remark: '',
  });

  const createPhase = trpc.phase.create.useMutation({
    onSuccess: () => {
      utils.project.list.invalidate();
      if (selectedProjectId) utils.project.getById.invalidate({ id: selectedProjectId });
      setShowPhaseModal(false);
      setPhaseForm({ name: '', description: '' });
    },
  });
  const completePhase = trpc.phase.complete.useMutation({
    onSuccess: () => {
      utils.project.list.invalidate();
      if (selectedProjectId) utils.project.getById.invalidate({ id: selectedProjectId });
    },
  });
  const updateStatus = trpc.phase.updateProjectStatus.useMutation({
    onSuccess: () => {
      utils.project.list.invalidate();
      setShowStatusModal(false);
    },
  });

  const selectedProject = projectsQuery.data?.find((p) => p.id === selectedProjectId);
  const projectDetailQuery = trpc.project.getById.useQuery(
    { id: selectedProjectId! },
    { enabled: !!selectedProjectId },
  );

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-semibold text-navy-800">项目阶段维护</h1>
            <p className="text-sm text-gray-500 mt-1">内部后台 - 记录和维护项目各阶段</p>
          </div>
          {selectedProjectId && (
            <button onClick={() => setShowPhaseModal(true)} className="btn-primary">
              <Plus className="w-4 h-4" />
              新建阶段
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-navy-800">
              <h3 className="font-display font-semibold text-white text-sm tracking-wide">项目列表</h3>
              <p className="text-xs text-navy-300 mt-0.5">点击选择项目维护阶段</p>
            </div>
            <div className="max-h-[70vh] overflow-auto divide-y divide-gray-100">
              {(projectsQuery.data ?? []).map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProjectId(p.id)}
                  className={`w-full text-left px-5 py-4 transition-all duration-150 ${
                    selectedProjectId === p.id
                      ? 'bg-brand-50 border-l-2 border-l-brand-500'
                      : 'border-l-2 border-l-transparent hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-display font-medium text-sm text-navy-800 truncate">{p.name}</p>
                      <p className="text-xs text-gray-500 font-mono">{p.code}</p>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-500">
                    <ArrowRight className="w-3 h-3 text-brand-500" />
                    <span>当前: {p.phases[0]?.name ?? '-'}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 card overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-navy-800 flex items-center justify-between">
              <div>
                <h3 className="font-display font-semibold text-white text-sm tracking-wide">
                  {selectedProject ? selectedProject.name : '选择左侧项目查看阶段'}
                </h3>
                {selectedProject && (
                  <div className="flex items-center gap-3 mt-1.5 text-xs">
                    <span className="text-navy-300 font-mono">{selectedProject.code}</span>
                    <StatusBadge status={selectedProject.status} />
                    <button
                      onClick={() => {
                        setStatusForm({
                          projectId: selectedProject.id,
                          status: selectedProject.status,
                          remark: '',
                        });
                        setShowStatusModal(true);
                      }}
                      className="inline-flex items-center gap-1 text-brand-400 hover:text-brand-300 transition-colors"
                    >
                      <Settings2 className="w-3 h-3" />
                      修改项目状态
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6">
              {!selectedProjectId ? (
                <EmptyState
                  title="选择项目"
                  description="点击左侧项目查看和维护阶段"
                  icon={<ArrowRight className="w-6 h-6 text-brand-500" />}
                />
              ) : projectDetailQuery.isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                  <span className="ml-3 text-sm text-gray-500">加载中...</span>
                </div>
              ) : (
                <div className="relative pl-8">
                  <div className="absolute left-[11px] top-3 bottom-3 w-px bg-gray-200" />
                  {(projectDetailQuery.data?.phases ?? []).length === 0 ? (
                    <EmptyState
                      title="暂无阶段"
                      description="点击右上角新建阶段开始维护"
                      icon={<Plus className="w-6 h-6 text-gray-400" />}
                    />
                  ) : (
                    (projectDetailQuery.data?.phases ?? []).map((phase) => (
                      <div key={phase.id} className="relative pb-8 last:pb-0">
                        <div
                          className={`absolute -left-[21px] w-3.5 h-3.5 rounded-full border-[3px] ${
                            phase.isCurrent
                              ? 'bg-brand-500 border-brand-200 shadow-sm'
                              : phase.completedAt
                                ? 'bg-success-500 border-success-200'
                                : 'bg-gray-300 border-gray-100'
                          }`}
                        />
                        <div className="rounded-lg border border-gray-200/80 bg-white shadow-card hover:shadow-card-hover transition-shadow duration-200">
                          <div className="p-5">
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2.5 flex-wrap">
                                  <span className="font-display font-semibold text-navy-800">{phase.name}</span>
                                  {phase.isCurrent && (
                                    <span className="inline-flex items-center gap-1 rounded-sm bg-brand-100 px-2 py-0.5 text-xs font-display font-semibold text-brand-700 uppercase tracking-wider">
                                      <ArrowRight className="w-3 h-3" />
                                      当前阶段
                                    </span>
                                  )}
                                  {phase.completedAt && (
                                    <span className="inline-flex items-center gap-1 rounded-sm bg-success-100 px-2 py-0.5 text-xs font-display font-semibold text-success-600 uppercase tracking-wider">
                                      <CheckCircle className="w-3 h-3" />
                                      已完成
                                    </span>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2.5 text-sm text-gray-500">
                                  <span>开始: {formatDate(phase.startDate)}</span>
                                  {phase.endDate && <span>结束: {formatDate(phase.endDate)}</span>}
                                  {phase.completedAt && (
                                    <span className="text-success-600 font-medium">
                                      完成: {formatDate(phase.completedAt)}
                                    </span>
                                  )}
                                </div>
                                {phase.description && (
                                  <p className="text-sm text-gray-600 mt-3 bg-gray-50 border border-gray-100 p-3 rounded-md">
                                    {phase.description}
                                  </p>
                                )}
                                {phase.remark && (
                                  <p className="text-sm text-gray-500 mt-2 italic flex items-start gap-1.5">
                                    <Settings2 className="w-3.5 h-3.5 mt-0.5 text-gray-400 flex-shrink-0" />
                                    {phase.remark}
                                  </p>
                                )}
                              </div>
                              {!phase.completedAt && (
                                <button
                                  onClick={() => completePhase.mutate({ id: phase.id })}
                                  className="btn-success text-sm flex-shrink-0"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  标记完成
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal
        title="新建阶段"
        open={showPhaseModal}
        onClose={() => setShowPhaseModal(false)}
        onSubmit={() =>
          selectedProjectId &&
          createPhase.mutate({
            projectId: selectedProjectId,
            name: phaseForm.name,
            description: phaseForm.description || undefined,
          })
        }
      >
        <div>
          <label className="label">阶段名称 *</label>
          <input
            className="input mt-1"
            value={phaseForm.name}
            onChange={(e) => setPhaseForm({ ...phaseForm, name: e.target.value })}
            placeholder="如：方案设计、现场交底、水电验收..."
            required
          />
        </div>
        <div>
          <label className="label">阶段说明</label>
          <textarea
            className="input mt-1 min-h-[80px]"
            value={phaseForm.description}
            onChange={(e) => setPhaseForm({ ...phaseForm, description: e.target.value })}
          />
        </div>
      </Modal>

      <Modal
        title="修改项目状态"
        open={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        onSubmit={() => updateStatus.mutate(statusForm)}
      >
        <div>
          <label className="label">状态</label>
          <select
            className="input mt-1"
            value={statusForm.status}
            onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value as ProjectStatus })}
          >
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
        <div>
          <label className="label">变更备注</label>
          <input
            className="input mt-1"
            value={statusForm.remark}
            onChange={(e) => setStatusForm({ ...statusForm, remark: e.target.value })}
          />
        </div>
      </Modal>
    </AppShell>
  );
}
