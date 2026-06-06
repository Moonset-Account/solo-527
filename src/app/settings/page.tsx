'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import type { ImportExportJob, ErrorLog } from '@/types/database';
import { formatDateTime } from '@/lib/utils';
import { Upload, Download, FileWarning, RefreshCw, Users } from 'lucide-react';

type TabType = 'import-export' | 'error-logs' | 'users';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('import-export');
  const [jobs, setJobs] = useState<ImportExportJob[]>([]);
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (activeTab === 'import-export') {
      loadJobs();
    } else if (activeTab === 'error-logs') {
      loadErrorLogs();
    }
  }, [activeTab, supabase]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const { data } = await supabase
        .from('import_export_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      setJobs(data || []);
    } catch (error) {
      console.error('Failed to load jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadErrorLogs = async () => {
    try {
      setLoading(true);
      const { data } = await supabase
        .from('error_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      setErrorLogs(data || []);
    } catch (error) {
      console.error('Failed to load error logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const createExportJob = async (entityType: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      await supabase.from('import_export_jobs').insert({
        job_type: 'export',
        entity_type: entityType,
        status: 'pending',
        created_by: userData.user?.id,
        file_name: `${entityType}_export_${Date.now()}.xlsx`,
        total_records: 0,
        processed_records: 0,
        failed_records: 0,
      });
      loadJobs();
    } catch (error) {
      console.error('Failed to create export job:', error);
    }
  };

  const tabs = [
    { id: 'import-export' as TabType, label: '导入导出队列', icon: Download },
    { id: 'error-logs' as TabType, label: '错误日志', icon: FileWarning },
    { id: 'users' as TabType, label: '用户管理', icon: Users },
  ];

  return (
    <AppLayout>
      <div className="p-6">
        <PageHeader title="系统设置" description="管理系统配置、导入导出和日志" />

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
          <div className="border-b border-gray-100">
            <nav className="flex">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-amber-500 text-amber-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'import-export' && (
              <div>
                <div className="flex gap-3 mb-6">
                  <Button onClick={() => createExportJob('exhibits')}>
                    <Download className="h-4 w-4 mr-2" />
                    导出演品数据
                  </Button>
                  <Button onClick={() => createExportJob('contracts')}>
                    <Download className="h-4 w-4 mr-2" />
                    导出合同数据
                  </Button>
                  <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    导入数据
                  </Button>
                  <Button variant="outline" onClick={loadJobs}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    刷新
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">任务类型</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">实体类型</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">文件名</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">进度</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">创建时间</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {loading ? (
                        <tr><td colSpan={6} className="px-4 py-8 text-center">加载中...</td></tr>
                      ) : jobs.length === 0 ? (
                        <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">暂无任务记录</td></tr>
                      ) : (
                        jobs.map((job) => (
                          <tr key={job.id}>
                            <td className="px-4 py-3 text-sm">
                              {job.job_type === 'export' ? '导出' : '导入'}
                            </td>
                            <td className="px-4 py-3 text-sm">{job.entity_type}</td>
                            <td className="px-4 py-3 text-sm font-mono text-xs">{job.file_name}</td>
                            <td className="px-4 py-3 text-sm">
                              {job.total_records > 0 ? `${job.processed_records}/${job.total_records}` : '-'}
                              {job.failed_records > 0 && <span className="text-red-600 ml-2">({job.failed_records}失败)</span>}
                            </td>
                            <td className="px-4 py-3"><Badge status={job.status} /></td>
                            <td className="px-4 py-3 text-sm text-gray-500">{formatDateTime(job.created_at)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'error-logs' && (
              <div>
                <div className="flex justify-end mb-4">
                  <Button variant="outline" onClick={loadErrorLogs}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    刷新
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">错误代码</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">错误信息</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">路径</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">时间</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {loading ? (
                        <tr><td colSpan={4} className="px-4 py-8 text-center">加载中...</td></tr>
                      ) : errorLogs.length === 0 ? (
                        <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">暂无错误日志</td></tr>
                      ) : (
                        errorLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-mono text-xs text-red-600">
                              {log.error_code || '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 max-w-md truncate">
                              {log.error_message}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500 font-mono text-xs">
                              {log.path || '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {formatDateTime(log.created_at)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">用户管理模块</p>
                <p className="text-sm text-gray-400 mt-1">在这里可以管理系统用户和角色权限</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
