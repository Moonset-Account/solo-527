'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/AppLayout';
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils';
import {
  FolderKanban,
  Filter,
  Plus,
  Calendar,
  User as UserIcon,
  Building2,
  Search,
} from 'lucide-react';
import Link from 'next/link';

interface Project {
  id: string;
  name: string;
  status: string;
  budget: number;
  progress: number;
  dueDate: string;
  client: { id: string; name: string };
  members: { user: { id: string; name: string } }[];
}

export default function ProjectsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    fetchProjects();
  }, [status, statusFilter]);

  const fetchProjects = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      
      const res = await fetch(`/api/projects?${params}`);
      const data = await res.json();
      if (data.success) {
        setProjects(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.client.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statuses = ['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED'];

  const getProjectsByStatus = (status: string) => {
    if (status === 'ALL') return filteredProjects;
    return filteredProjects.filter((p) => p.status === status);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">项目看板</h1>
            <p className="text-gray-500 mt-1">查看和管理所有项目</p>
          </div>
          {session?.user?.role !== 'CLIENT' && (
            <button className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg font-medium hover:bg-primary/90 transition">
              <Plus className="w-5 h-5" />
              新建项目
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索项目或客户..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">状态:</span>
              <div className="flex gap-1">
                {statuses.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition ${
                      statusFilter === s
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {s === 'ALL' ? '全部' : getStatusLabel(s)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {statusFilter === 'ALL' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {statuses.slice(1).map((status) => {
              const columnProjects = getProjectsByStatus(status);
              return (
                <div key={status} className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-700">{getStatusLabel(status)}</h3>
                    <span className="text-sm text-gray-500 bg-white px-2 py-0.5 rounded-full">
                      {columnProjects.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {columnProjects.map((project) => (
                      <ProjectCard key={project.id} project={project} />
                    ))}
                    {columnProjects.length === 0 && (
                      <div className="text-center py-8 text-gray-400 text-sm">
                        暂无项目
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
            {filteredProjects.length === 0 && (
              <div className="col-span-full text-center py-16 text-gray-500">
                <FolderKanban className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>暂无符合条件的项目</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      href={`/projects/${project.id}`}
      className="block bg-white rounded-lg border border-gray-100 p-4 hover:shadow-md hover:border-gray-200 transition group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <FolderKanban className="w-5 h-5 text-primary" />
        </div>
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>
          {getStatusLabel(project.status)}
        </span>
      </div>
      <h4 className="font-semibold text-gray-900 group-hover:text-primary transition mb-1 line-clamp-1">
        {project.name}
      </h4>
      <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-3">
        <Building2 className="w-3.5 h-3.5" />
        <span className="truncate">{project.client.name}</span>
      </div>
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>进度</span>
          <span>{project.progress}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-gray-50">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Calendar className="w-3.5 h-3.5" />
          {formatDate(project.dueDate)}
        </div>
        <span className="text-sm font-semibold text-gray-900">
          {formatCurrency(project.budget)}
        </span>
      </div>
    </Link>
  );
}
