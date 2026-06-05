import { component$, useStore, useTask$, $ } from "@builder.io/qwik";
import { useNavigate } from "@builder.io/qwik-city";
import Layout from "~/components/layout";
import apiClient from "~/utils/api";
import { useAuth } from "~/context/auth";
import dayjs from "dayjs";

interface AuditLog {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  module: string;
  target_type: string;
  target_id: string;
  description: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

const actionLabels: Record<string, string> = {
  create: '创建',
  create_waitlisted: '创建（候补）',
  cancel: '取消',
  rain_cancel: '雨天取消',
  confirm: '确认',
  resubmit: '重新提交',
  breakdown_reschedule: '故障重排',
  login: '登录',
  logout: '登出',
};

const moduleLabels: Record<string, string> = {
  reservation: '预约',
  auth: '认证',
  equipment: '设备',
  maintenance: '维修',
  settlement: '结算',
};

export default component$(() => {
  const auth = useAuth();
  const nav = useNavigate();
  
  const state = useStore({
    logs: [] as AuditLog[],
    loading: true,
  });

  useTask$(async () => {
    if (!auth.isAuthenticated) {
      nav.navigate('/login');
      return;
    }
    
    if (auth.user?.role !== 'admin') {
      nav.navigate('/dashboard');
      return;
    }
    
    try {
      const response = await apiClient.get('/audit-logs');
      state.logs = response.data;
    } catch (e) {
      console.error('加载审计日志失败', e);
    } finally {
      state.loading = false;
    }
  });

  return (
    <Layout title="审计日志">
      {state.loading ? (
        <div class="card text-center text-gray-500">加载中...</div>
      ) : state.logs.length === 0 ? (
        <div class="card text-center py-12">
          <div class="text-4xl mb-4">📋</div>
          <p class="text-gray-500">暂无审计日志</p>
        </div>
      ) : (
        <div class="card overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-100">
                <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">时间</th>
                <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">用户</th>
                <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">模块</th>
                <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">操作</th>
                <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">描述</th>
                <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">IP</th>
              </tr>
            </thead>
            <tbody>
              {state.logs.map((log) => (
                <tr key={log.id} class="border-b border-gray-50 hover:bg-gray-50">
                  <td class="py-3 px-4 text-sm text-gray-500 whitespace-nowrap">
                    {dayjs(log.created_at).format('MM-DD HH:mm:ss')}
                  </td>
                  <td class="py-3 px-4 text-sm text-gray-800">{log.user_name}</td>
                  <td class="py-3 px-4">
                    <span class="badge bg-gray-100 text-gray-600">
                      {moduleLabels[log.module] || log.module}
                    </span>
                  </td>
                  <td class="py-3 px-4 text-sm text-gray-600">
                    {actionLabels[log.action] || log.action}
                  </td>
                  <td class="py-3 px-4 text-sm text-gray-600 max-w-xs truncate">
                    {log.description}
                  </td>
                  <td class="py-3 px-4 text-sm text-gray-400">{log.ip_address}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
});
