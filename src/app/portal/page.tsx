'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Download,
  Eye,
  Calendar,
  Clock,
  CheckCircle,
  Folder,
  Image as ImageIcon,
  File,
  ExternalLink,
  ChevronRight,
  Building,
  User,
} from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'planning' | 'in_progress' | 'review' | 'completed';
  progress: number;
  startDate: string;
  endDate: string | null;
}

interface Deliverable {
  id: string;
  name: string;
  type: 'file' | 'image' | 'folder';
  size: string;
  uploadedAt: string;
  version: string;
  projectId: string;
  projectName: string;
}

const mockProjects: Project[] = [
  {
    id: 'p1',
    name: '官网设计项目',
    description: '企业官网全案设计，包含首页、产品页、关于我们等15个页面',
    status: 'in_progress',
    progress: 75,
    startDate: '2024-01-10T00:00:00.000Z',
    endDate: null,
  },
  {
    id: 'p2',
    name: '品牌VI设计',
    description: '品牌视觉识别系统设计，Logo、色彩规范、应用设计等',
    status: 'review',
    progress: 90,
    startDate: '2024-01-15T00:00:00.000Z',
    endDate: null,
  },
];

const mockDeliverables: Deliverable[] = [
  {
    id: 'd1',
    name: '官网首页设计稿-v2.fig',
    type: 'file',
    size: '15.2 MB',
    uploadedAt: '2024-02-15T10:30:00.000Z',
    version: 'v2.0',
    projectId: 'p1',
    projectName: '官网设计项目',
  },
  {
    id: 'd2',
    name: '产品页面设计稿.png',
    type: 'image',
    size: '3.8 MB',
    uploadedAt: '2024-02-14T14:20:00.000Z',
    version: 'v1.2',
    projectId: 'p1',
    projectName: '官网设计项目',
  },
  {
    id: 'd3',
    name: 'Logo设计源文件.zip',
    type: 'file',
    size: '8.5 MB',
    uploadedAt: '2024-02-10T09:15:00.000Z',
    version: 'v1.0',
    projectId: 'p2',
    projectName: '品牌VI设计',
  },
  {
    id: 'd4',
    name: '品牌色彩规范.pdf',
    type: 'file',
    size: '2.1 MB',
    uploadedAt: '2024-02-08T16:45:00.000Z',
    version: 'v1.0',
    projectId: 'p2',
    projectName: '品牌VI设计',
  },
  {
    id: 'd5',
    name: 'VI应用效果图预览',
    type: 'folder',
    size: '12个文件',
    uploadedAt: '2024-02-12T11:00:00.000Z',
    version: 'v1.0',
    projectId: 'p2',
    projectName: '品牌VI设计',
  },
];

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  planning: { label: '规划中', color: 'bg-slate-100 text-slate-700', icon: Clock },
  in_progress: { label: '进行中', color: 'bg-blue-100 text-blue-700', icon: Clock },
  review: { label: '待验收', color: 'bg-purple-100 text-purple-700', icon: Eye },
  completed: { label: '已完成', color: 'bg-green-100 text-green-700', icon: CheckCircle },
};

const fileTypeConfig: Record<string, { icon: any; color: string }> = {
  file: { icon: FileText, color: 'text-blue-500 bg-blue-50' },
  image: { icon: ImageIcon, color: 'text-green-500 bg-green-50' },
  folder: { icon: Folder, color: 'text-yellow-500 bg-yellow-50' },
};

export default function PortalPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'projects' | 'files'>('projects');

  useEffect(() => {
    setTimeout(() => {
      setProjects(mockProjects);
      setDeliverables(mockDeliverables);
      setIsLoading(false);
    }, 500);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                <Building className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-slate-900">客户门户</h1>
                <p className="text-xs text-slate-500">查看您的项目进度和交付文件</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-900">张经理</p>
                <p className="text-xs text-slate-500">阿里巴巴集团</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-semibold">
                <User className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex gap-2 mb-8 bg-white p-1 rounded-xl border border-slate-200 w-fit">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab('projects')}
            className={`rounded-lg ${activeTab === 'projects' ? 'bg-slate-100 text-slate-900' : 'text-slate-500'}`}
          >
            <Folder className="w-4 h-4 mr-2" />
            项目进度
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab('files')}
            className={`rounded-lg ${activeTab === 'files' ? 'bg-slate-100 text-slate-900' : 'text-slate-500'}`}
          >
            <File className="w-4 h-4 mr-2" />
            交付文件
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-40 bg-white rounded-xl animate-pulse" />
            ))}
          </div>
        ) : activeTab === 'projects' ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-slate-500">进行中项目</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">
                    {projects.filter((p) => p.status === 'in_progress' || p.status === 'review').length}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-slate-500">已完成项目</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">
                    {projects.filter((p) => p.status === 'completed').length}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-slate-500">待验收</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">
                    {projects.filter((p) => p.status === 'review').length}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              {projects.map((project, index) => {
                const StatusIcon = statusConfig[project.status].icon;
                return (
                  <Card key={project.id} className="overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-slate-900">{project.name}</h3>
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[project.status].color}`}
                            >
                              <StatusIcon className="w-3.5 h-3.5" />
                              {statusConfig[project.status].label}
                            </span>
                          </div>
                          <p className="text-sm text-slate-500 mb-4">{project.description}</p>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-500">项目进度</span>
                              <span className="font-medium text-slate-900">{project.progress}%</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500"
                                style={{ width: `${project.progress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
                        <div className="flex items-center gap-6 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            开始于 {formatDate(project.startDate)}
                          </span>
                          {project.endDate && (
                            <span className="flex items-center gap-1">
                              <CheckCircle className="w-4 h-4" />
                              完成于 {formatDate(project.endDate)}
                            </span>
                          )}
                        </div>
                        <Button variant="ghost" size="sm">
                          查看详情
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-slate-500">交付文件总数</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">{deliverables.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-slate-500">本月新增</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">{deliverables.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-slate-500">最新更新</p>
                  <p className="text-sm font-medium text-slate-900 mt-1">
                    {formatDate(deliverables[0]?.uploadedAt || '')}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <div className="divide-y divide-slate-100">
                {deliverables.map((file, index) => {
                  const FileIcon = fileTypeConfig[file.type].icon;
                  return (
                    <div
                      key={file.id}
                      className="p-4 hover:bg-slate-50 transition-colors flex items-center gap-4"
                    >
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center ${fileTypeConfig[file.type].color}`}
                      >
                        <FileIcon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 truncate">{file.name}</p>
                        <div className="flex items-center gap-3 text-sm text-slate-500 mt-0.5">
                          <span className="text-primary">{file.projectName}</span>
                          <span>·</span>
                          <span>{file.version}</span>
                          <span>·</span>
                          <span>{file.size}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-slate-400 hidden sm:block">
                          {formatDate(file.uploadedAt)}
                        </span>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200 mt-12 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <p className="text-center text-sm text-slate-500">
            © 2024 设计工作室 · 客户服务支持
          </p>
        </div>
      </footer>
    </div>
  );
}
