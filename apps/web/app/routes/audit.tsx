import { useEffect, useState } from 'react';
import { useNavigate } from '@remix-run/react';
import { useAuth } from '~/contexts/AuthContext';
import { api } from '~/lib/api';
import Layout from '~/components/Layout';

export default function Audit() {
  const { token, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterEntityType, setFilterEntityType] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadLogs();
  }, [token, isAuthenticated, navigate, filterEntityType]);

  const loadLogs = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params: any = {};
      if (filterEntityType) params.entityType = filterEntityType;
      const data: any = await api.audit.logs(token, params);
      setLogs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('加载审计日志失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const actionText: Record<string, string> = {
    login: '登录',
    logout: '登出',
    create_material: '创建物资',
    update_material: '更新物资',
    create_category: '创建分类',
    create_activity: '创建活动',
    update_activity: '更新活动',
    update_activity_status: '更新活动状态',
    create_application: '创建申请',
    approve_application: '批准申请',
    reject_application: '拒绝申请',
    cancel_application: '取消申请',
    borrow_material: '借出物资',
    return_material: '归还物资',
    create_compensation: '创建赔付单',
    handle_compensation_paid: '确认赔付收款',
    handle_compensation_waived: '豁免赔付',
    manual_entry_borrow: '借用补录',
    manual_entry_return: '归还补录',
    manual_entry_material: '物资补录',
    manual_entry_compensation: '赔付补录',
  };

  const entityTypeText: Record<string, string> = {
    user: '用户',
    material: '物资',
    material_category: '物资分类',
    activity: '活动',
    borrow_application: '借用申请',
    borrow_item: '借用明细',
    compensation_order: '赔付单',
    manual_entry: '人工补录',
  };

  if (!isAuthenticated || (user?.role !== 'warehouse_manager' && user?.role !== 'admin')) {
    return null;
  }

  return (
    <Layout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">审计日志</h1>
          <select
            value={filterEntityType}
            onChange={(e) => setFilterEntityType(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          >
            <option value="">全部类型</option>
            <option value="user">用户</option>
            <option value="material">物资</option>
            <option value="activity">活动</option>
            <option value="borrow_application">借用申请</option>
            <option value="compensation_order">赔付单</option>
          </select>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">加载中...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">时间</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作人</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">对象类型</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP地址</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        暂无审计日志
                      </td>
                    </tr>
                  ) : (
                    logs.map((log: any) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {log.real_name || log.username || '系统'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs rounded-full bg-primary-100 text-primary-800">
                            {actionText[log.action] || log.action}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {entityTypeText[log.entity_type] || log.entity_type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                          {log.ip_address || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
