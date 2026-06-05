import { useState } from 'react';
import { useRouter } from 'next/router';
import useSWR, { mutate } from 'swr';
import { useSession } from 'next-auth/react';
import Layout from '@/components/Layout';
import {
  Filter,
  FileText,
  Image,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
} from 'lucide-react';
import {
  formatFileSize,
  formatRelativeTime,
  getStatusLabel,
  getStatusColor,
} from '@/lib/utils';

const statusFilters = [
  { value: '', label: '全部' },
  { value: 'PENDING', label: '待审批' },
  { value: 'APPROVED', label: '已通过' },
  { value: 'REJECTED', label: '已拒绝' },
];

export default function FilesPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [statusFilter, setStatusFilter] = useState('');

  const { data: filesData, isLoading } = useSWR(
    `/api/files${statusFilter ? `?status=${statusFilter}` : ''}`
  );

  const files = filesData?.data?.items || [];
  const canApprove = session?.user.role === 'ADMIN' || session?.user.role === 'PLANNER';

  const filteredFiles = files;

  const handleFileStatus = async (fileId: string, status: 'APPROVED' | 'REJECTED') => {
    await fetch(`/api/files/${fileId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    mutate(`/api/files${statusFilter ? `?status=${statusFilter}` : ''}`);
  };

  const getFileIcon = (type: string) => {
    if (type?.startsWith('image/')) return Image;
    return FileText;
  };

  const pendingCount = files.filter((f: any) => f.status === 'PENDING').length;
  const approvedCount = files.filter((f: any) => f.status === 'APPROVED').length;
  const rejectedCount = files.filter((f: any) => f.status === 'REJECTED').length;

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">文件审批</h1>
          <p className="text-gray-500 mt-1">管理和审批所有项目文件</p>
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-xl bg-yellow-50 text-yellow-600">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
                <p className="text-sm text-gray-500">待审批</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-xl bg-green-50 text-green-600">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{approvedCount}</p>
                <p className="text-sm text-gray-500">已通过</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-xl bg-red-50 text-red-600">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{rejectedCount}</p>
                <p className="text-sm text-gray-500">已拒绝</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    文件
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    项目
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    上传者
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    大小
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    状态
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    时间
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  [1, 2, 3].map((i) => (
                    <tr key={i}>
                      <td colSpan={7} className="px-4 py-4">
                        <div className="h-5 bg-gray-200 rounded animate-pulse w-1/3" />
                      </td>
                    </tr>
                  ))
                ) : filteredFiles.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                      暂无文件数据
                    </td>
                  </tr>
                ) : (
                  filteredFiles.map((file: any) => {
                    const Icon = getFileIcon(file.type);
                    return (
                      <tr key={file.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                              <Icon className="w-5 h-5 text-gray-500" />
                            </div>
                            <span className="font-medium text-gray-900 text-sm">
                              {file.name}
                            </span>
                          </div>
                        </td>
                        <td
                          className="px-4 py-3 text-sm text-gray-500 cursor-pointer hover:text-primary-600"
                          onClick={() => router.push(`/projects/${file.projectId}?tab=files`)}
                        >
                          {file.project?.name || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {file.uploadedBy?.name || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {formatFileSize(file.size)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`badge ${getStatusColor(file.status)}`}>
                            {getStatusLabel(file.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {formatRelativeTime(file.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <a
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"
                              title="查看"
                            >
                              <Eye className="w-4 h-4" />
                            </a>
                            {file.status === 'PENDING' && canApprove && (
                              <>
                                <button
                                  onClick={() => handleFileStatus(file.id, 'APPROVED')}
                                  className="p-1.5 rounded-lg hover:bg-green-50 text-green-600"
                                  title="通过"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleFileStatus(file.id, 'REJECTED')}
                                  className="p-1.5 rounded-lg hover:bg-red-50 text-red-600"
                                  title="拒绝"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
