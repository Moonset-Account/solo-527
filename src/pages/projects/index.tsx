import { useState } from 'react';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import Layout from '@/components/Layout';
import {
  Plus,
  Filter,
  Calendar,
  Users,
  CheckSquare,
  FileText,
  MessageSquare,
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
  const [statusFilter, setStatusFilter] = useState('');
  const { data: projects, mutate } = useSWR(
    `/api/projects${statusFilter ? `?status=${statusFilter}` : ''}`
  );

  const projectList = projects?.data?.items || [];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">项目看板</h1>
            <p className="text-gray-500 mt-1">管理所有婚礼策划项目</p>
          </div>
          <button className="btn btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            新建项目
          </button>
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

        {projectList.length === 0 && (
          <div className="card p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无项目</h3>
            <p className="text-gray-500 mb-4">创建您的第一个婚礼策划项目</p>
            <button className="btn btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              新建项目
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
