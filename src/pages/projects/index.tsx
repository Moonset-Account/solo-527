import { useState } from 'react';
import { useRouter } from 'next/router';
import useSWR, { mutate } from 'swr';
import { useSession } from 'next-auth/react';
import Layout from '@/components/Layout';
import Modal from '@/components/Modal';
import ProjectForm from '@/components/ProjectForm';
import QRScanner from '@/components/QRScanner';
import {
  Plus,
  Filter,
  Calendar,
  Users,
  CheckSquare,
  FileText,
  MessageSquare,
  QrCode,
  Scan,
} from 'lucide-react';
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils';

const statusFilters = [
  { value: '', label: '全部' },
  { value: 'DRAFT', label: '草稿' },
  { value: 'IN_PROGRESS', label: '进行中' },
  { value: 'COMPLETED', label: '已完成' },
];

export default function ProjectsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const { data: projects, isLoading } = useSWR(
    `/api/projects${statusFilter ? `?status=${statusFilter}` : ''}`
  );

  const projectList = projects?.data?.items || [];
  const canCreate = session?.user.role === 'ADMIN' || session?.user.role === 'PLANNER';

  const handleCreateProject = async (formData: any) => {
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await res.json();
      if (result.success) {
        mutate('/api/projects');
        setShowCreateModal(false);
      }
    } catch (e) {
      console.error('创建项目失败', e);
    }
  };

  const handleScan = (code: string) => {
    if (code.startsWith('project-')) {
      router.push(`/projects/${code}`);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">项目看板</h1>
            <p className="text-gray-500 mt-1">管理所有婚礼策划项目</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowScanner(true)}
              className="btn btn-secondary"
            >
              <Scan className="w-4 h-4 mr-2" />
              扫码
            </button>
            {canCreate && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn btn-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                新建项目
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto pb-2">
          <Filter className="w-4 h-4 text-gray-500 flex-shrink-0" />
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                statusFilter === filter.value
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-3" />
                <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-4" />
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projectList.map((project: any) => (
              <div
                key={project.id}
                className="card hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/projects/${project.id}`)}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 line-clamp-1">
                      {project.name}
                    </h3>
                    <span className={`badge ${getStatusColor(project.status)}`}>
                      {getStatusLabel(project.status)}
                    </span>
                  </div>

                  <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                    {project.description || '暂无描述'}
                  </p>

                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span>{project.weddingDate ? formatDate(project.weddingDate) : '未设置日期'}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Users className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span>{project.couple?.name || '未分配新人'}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center text-gray-500">
                          <CheckSquare className="w-4 h-4 mr-1" />
                          {project._count?.tasks || 0}
                        </span>
                        <span className="flex items-center text-gray-500">
                          <FileText className="w-4 h-4 mr-1" />
                          {project._count?.files || 0}
                        </span>
                        <span className="flex items-center text-gray-500">
                          <MessageSquare className="w-4 h-4 mr-1" />
                          {project._count?.comments || 0}
                        </span>
                      </div>
                      <span className="font-medium text-primary-600">
                        {formatCurrency(project.totalBudget)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && projectList.length === 0 && (
          <div className="card p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无项目</h3>
            <p className="text-gray-500 mb-4">创建您的第一个婚礼策划项目</p>
            {canCreate && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn btn-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                新建项目
              </button>
            )}
          </div>
        )}
      </div>

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="新建项目"
        size="lg"
      >
        <ProjectForm
          onSubmit={handleCreateProject}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      <QRScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleScan}
      />
    </Layout>
  );
}
