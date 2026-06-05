import { useState } from 'react';
import Layout from '@/components/Layout';
import { Filter, FileText, Image, CheckCircle, XCircle, Clock } from 'lucide-react';
import { formatFileSize, formatRelativeTime, getStatusLabel, getStatusColor } from '@/lib/utils';

const statusFilters = [
  { value: '', label: '全部' },
  { value: 'PENDING', label: '待审批' },
  { value: 'APPROVED', label: '已通过' },
  { value: 'REJECTED', label: '已拒绝' },
];

const mockFiles = [
  {
    id: '1',
    name: '婚礼场地实景图.jpg',
    type: 'image/jpeg',
    size: 1024000,
    status: 'APPROVED',
    category: 'venue',
    uploadedBy: { name: '策划师李姐' },
    createdAt: new Date('2024-08-10'),
    projectName: '张先生 & 王小姐 婚礼',
  },
  {
    id: '2',
    name: '花艺设计初稿.pdf',
    type: 'application/pdf',
    size: 2048000,
    status: 'PENDING',
    category: 'design',
    uploadedBy: { name: '花艺师小林' },
    createdAt: new Date('2024-08-22'),
    projectName: '张先生 & 王小姐 婚礼',
  },
  {
    id: '3',
    name: '摄影套餐明细.xlsx',
    type: 'application/vnd.ms-excel',
    size: 512000,
    status: 'APPROVED',
    category: 'document',
    uploadedBy: { name: '摄影师老王' },
    createdAt: new Date('2024-08-18'),
    projectName: '张先生 & 王小姐 婚礼',
  },
  {
    id: '4',
    name: '菜单方案.docx',
    type: 'application/msword',
    size: 256000,
    status: 'REJECTED',
    category: 'document',
    uploadedBy: { name: '策划师李姐' },
    createdAt: new Date('2024-08-05'),
    projectName: '张先生 & 王小姐 婚礼',
  },
];

export default function FilesPage() {
  const [statusFilter, setStatusFilter] = useState('');

  const filteredFiles = mockFiles.filter(
    (file) => !statusFilter || file.status === statusFilter
  );

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return Image;
    return FileText;
  };

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

        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">文件</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">项目</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">上传者</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">大小</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">时间</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredFiles.map((file) => {
                  const Icon = getFileIcon(file.type);
                  return (
                    <tr key={file.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                            <Icon className="w-5 h-5 text-gray-500" />
                          </div>
                          <span className="font-medium text-gray-900 text-sm">{file.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{file.projectName}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{file.uploadedBy.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{formatFileSize(file.size)}</td>
                      <td className="px-4 py-3">
                        <span className={`badge ${getStatusColor(file.status)}`}>
                          {getStatusLabel(file.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatRelativeTime(file.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {file.status === 'PENDING' && (
                          <div className="flex items-center justify-end space-x-2">
                            <button className="p-1.5 rounded-lg hover:bg-green-50 text-green-600">
                              <CheckCircle className="w-5 h-5" />
                            </button>
                            <button className="p-1.5 rounded-lg hover:bg-red-50 text-red-600">
                              <XCircle className="w-5 h-5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-xl bg-yellow-50 text-yellow-600">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {mockFiles.filter(f => f.status === 'PENDING').length}
                </p>
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
                <p className="text-2xl font-bold text-gray-900">
                  {mockFiles.filter(f => f.status === 'APPROVED').length}
                </p>
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
                <p className="text-2xl font-bold text-gray-900">
                  {mockFiles.filter(f => f.status === 'REJECTED').length}
                </p>
                <p className="text-sm text-gray-500">已拒绝</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
