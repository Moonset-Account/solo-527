import { component$, useStore, useTask$, $ } from "@builder.io/qwik";
import { useNavigate } from "@builder.io/qwik-city";
import Layout from "~/components/layout";
import apiClient from "~/utils/api";
import { useAuth } from "~/context/auth";

interface Stats {
  equipment: { total: number; available: number; in_use: number; maintenance: number };
  settlements: { total: number; confirmed: number; pending: number; total_amount: number };
  today_reservations: number;
  total_reservations: number;
  open_maintenance: number;
  waitlisted_reservations: number;
}

export default component$(() => {
  const auth = useAuth();
  const nav = useNavigate();
  
  const stats = useStore<Stats>({
    equipment: { total: 0, available: 0, in_use: 0, maintenance: 0 },
    settlements: { total: 0, confirmed: 0, pending: 0, total_amount: 0 },
    today_reservations: 0,
    total_reservations: 0,
    open_maintenance: 0,
    waitlisted_reservations: 0,
  });
  
  const loading = useStore({ value: true });

  useTask$(async () => {
    if (!auth.isAuthenticated) {
      nav.navigate('/login');
      return;
    }
    
    try {
      const response = await apiClient.get('/dashboard/stats');
      Object.assign(stats, response.data);
    } catch (e) {
      console.error('加载统计数据失败', e);
    } finally {
      loading.value = false;
    }
  });

  const statCards = [
    { label: '今日预约', value: stats.today_reservations, icon: '📅', color: 'bg-blue-500' },
    { label: '待处理预约', value: stats.waitlisted_reservations, icon: '⏳', color: 'bg-yellow-500' },
    { label: '可用设备', value: stats.equipment.available, icon: '🚜', color: 'bg-green-500' },
    { label: '待维修', value: stats.open_maintenance, icon: '🔧', color: 'bg-red-500' },
    { label: '待结算', value: stats.settlements.pending, icon: '💰', color: 'bg-purple-500' },
    { label: '总预约数', value: stats.total_reservations, icon: '📊', color: 'bg-primary-500' },
  ];

  return (
    <Layout title="仪表板">
      {loading.value ? (
        <div class="flex items-center justify-center h-64">
          <div class="text-gray-500">加载中...</div>
        </div>
      ) : (
        <>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {statCards.map((card) => (
              <div key={card.label} class="card">
                <div class="flex items-center gap-4">
                  <div class={`w-12 h-12 ${card.color} rounded-xl flex items-center justify-center text-white text-2xl`}>
                    {card.icon}
                  </div>
                  <div>
                    <p class="text-2xl font-bold text-gray-800">{card.value}</p>
                    <p class="text-sm text-gray-500">{card.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="card">
              <h3 class="font-bold text-gray-800 mb-4">设备状态概览</h3>
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <span class="text-gray-600">可用</span>
                  <div class="flex items-center gap-2">
                    <div class="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        class="h-full bg-green-500 rounded-full" 
                        style={{ width: `${stats.equipment.total ? (stats.equipment.available / stats.equipment.total) * 100 : 0}%` }}
                      ></div>
                    </div>
                    <span class="text-sm font-medium text-gray-700">{stats.equipment.available}</span>
                  </div>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-gray-600">使用中</span>
                  <div class="flex items-center gap-2">
                    <div class="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        class="h-full bg-blue-500 rounded-full" 
                        style={{ width: `${stats.equipment.total ? (stats.equipment.in_use / stats.equipment.total) * 100 : 0}%` }}
                      ></div>
                    </div>
                    <span class="text-sm font-medium text-gray-700">{stats.equipment.in_use}</span>
                  </div>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-gray-600">维修中</span>
                  <div class="flex items-center gap-2">
                    <div class="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        class="h-full bg-yellow-500 rounded-full" 
                        style={{ width: `${stats.equipment.total ? (stats.equipment.maintenance / stats.equipment.total) * 100 : 0}%` }}
                      ></div>
                    </div>
                    <span class="text-sm font-medium text-gray-700">{stats.equipment.maintenance}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="card">
              <h3 class="font-bold text-gray-800 mb-4">快捷操作</h3>
              <div class="grid grid-cols-2 gap-3">
                {auth.user?.role !== 'operator' && (
                  <button 
                    onClick$={() => nav.navigate('/reservations/new')}
                    class="p-4 bg-primary-50 hover:bg-primary-100 rounded-xl text-center transition-colors"
                  >
                    <div class="text-2xl mb-2">📝</div>
                    <span class="text-sm font-medium text-primary-700">新建预约</span>
                  </button>
                )}
                <button 
                  onClick$={() => nav.navigate('/equipment')}
                  class="p-4 bg-blue-50 hover:bg-blue-100 rounded-xl text-center transition-colors"
                >
                  <div class="text-2xl mb-2">🚜</div>
                  <span class="text-sm font-medium text-blue-700">查看设备</span>
                </button>
                {auth.user?.role === 'admin' && (
                  <button 
                    onClick$={() => nav.navigate('/maintenance')}
                    class="p-4 bg-yellow-50 hover:bg-yellow-100 rounded-xl text-center transition-colors"
                  >
                    <div class="text-2xl mb-2">🔧</div>
                    <span class="text-sm font-medium text-yellow-700">维修工单</span>
                  </button>
                )}
                {auth.user?.role !== 'operator' && (
                  <button 
                    onClick$={() => nav.navigate('/settlement')}
                    class="p-4 bg-purple-50 hover:bg-purple-100 rounded-xl text-center transition-colors"
                  >
                    <div class="text-2xl mb-2">💰</div>
                    <span class="text-sm font-medium text-purple-700">结算管理</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div class="card mt-6">
            <h3 class="font-bold text-gray-800 mb-4">演示场景提示</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div class="p-3 bg-blue-50 rounded-lg">
                <p class="font-medium text-blue-800 mb-1">🎯 场景1：预约冲突</p>
                <p class="text-blue-600">李社员和王社员都预约了 tractor1 明天上午，王社员进入候补队列</p>
              </div>
              <div class="p-3 bg-green-50 rounded-lg">
                <p class="font-medium text-green-800 mb-1">🔄 场景2：撤回重提</p>
                <p class="text-green-600">王社员有已取消的预约，可在预约详情中重新提交</p>
              </div>
              <div class="p-3 bg-yellow-50 rounded-lg">
                <p class="font-medium text-yellow-800 mb-1">⚙️ 场景3：故障重排</p>
                <p class="text-yellow-600">创建高优先级维修工单，自动触发预约重排</p>
              </div>
              <div class="p-3 bg-purple-50 rounded-lg">
                <p class="font-medium text-purple-800 mb-1">✅ 场景4：作业确认</p>
                <p class="text-purple-600">机手可查看任务，开始/完成作业，上传照片和油耗</p>
              </div>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
});
