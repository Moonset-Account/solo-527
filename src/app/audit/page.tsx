'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId?: string;
  details?: any;
  createdAt: string;
  user?: {
    name: string;
    email: string;
  };
}

const actionMap: Record<string, { label: string; class: string }> = {
  MEETING_CREATED: { label: '会议创建', class: 'badge-success' },
  MEETING_UPDATED: { label: '会议更新', class: 'badge-info' },
  MEETING_CANCELLED: { label: '会议取消', class: 'badge-danger' },
  VISITOR_INVITED: { label: '访客邀请', class: 'badge-info' },
  VISITOR_CHECKED_IN: { label: '访客签到', class: 'badge-success' },
  VISITOR_CHECKED_OUT: { label: '访客签退', class: 'badge-secondary' },
  ACCESS_GRANTED: { label: '门禁授权', class: 'badge-success' },
  ACCESS_REVOKED: { label: '门禁撤销', class: 'badge-danger' },
  ID_PHOTO_UPLOADED: { label: '照片上传', class: 'badge-info' },
  ID_PHOTO_DELETED: { label: '照片删除', class: 'badge-secondary' },
  TASK_CREATED: { label: '任务创建', class: 'badge-info' },
  TASK_COMPLETED: { label: '任务完成', class: 'badge-success' },
  QR_CODE_GENERATED: { label: '二维码生成', class: 'badge-info' },
  QR_CODE_UPDATED: { label: '二维码更新', class: 'badge-warning' },
};

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    try {
      const res = await fetch('/api/audit?entityType=Meeting');
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="text-center py-12">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">审计日志</h1>
        <p className="text-gray-600 mt-1">系统操作记录追踪</p>
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">操作记录</h2>
          <select
            className="input max-w-xs"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="">全部操作</option>
            {Object.entries(actionMap).map(([key, value]) => (
              <option key={key} value={key}>
                {value.label}
              </option>
            ))}
          </select>
        </div>

        {logs.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">暂无审计记录</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">时间</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">操作类型</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">操作人</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">实体类型</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">详情</th>
                </tr>
              </thead>
              <tbody>
                {logs
                  .filter((log) => !filter || log.action === filter)
                  .map((log) => (
                    <tr key={log.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`badge ${actionMap[log.action]?.class || 'badge-secondary'}`}>
                          {actionMap[log.action]?.label || log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {log.user ? log.user.name : '系统'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {log.entityType}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 max-w-xs truncate">
                        {log.details ? JSON.stringify(log.details) : '-'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="font-semibold mb-3">审计说明</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <p className="font-medium text-gray-700 mb-1">记录内容</p>
            <ul className="list-disc list-inside space-y-1">
              <li>所有会议的创建、修改、取消操作</li>
              <li>访客的邀请、签到、签退记录</li>
              <li>门禁权限的授予与撤销</li>
              <li>证件照片的上传与删除</li>
              <li>前台任务的创建与完成</li>
              <li>访客二维码的生成与更新</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-gray-700 mb-1">数据保留</p>
            <ul className="list-disc list-inside space-y-1">
              <li>审计日志永久保存</li>
              <li>证件照片72小时后自动删除</li>
              <li>所有操作记录不可篡改</li>
              <li>仅管理员可查看审计日志</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
