import { component$, useStore, useTask$, $ } from "@builder.io/qwik";
import { useNavigate, routeLoader$ } from "@builder.io/qwik-city";
import Layout from "~/components/layout";
import apiClient from "~/utils/api";
import { useAuth } from "~/context/auth";
import dayjs from "dayjs";

export const useEquipmentId = routeLoader$(({ params }) => {
  return params.id;
});

export default component$(() => {
  const auth = useAuth();
  const nav = useNavigate();
  const id = useEquipmentId();
  
  const state = useStore({
    equipment: null as any,
    loading: true,
  });

  useTask$(async () => {
    if (!auth.isAuthenticated) {
      nav.navigate('/login');
      return;
    }
    
    try {
      const response = await apiClient.get(`/equipment/${id.value}`);
      state.equipment = response.data;
    } catch (e) {
      console.error('加载设备详情失败', e);
    } finally {
      state.loading = false;
    }
  });

  const typeLabels: Record<string, string> = {
    tractor: '拖拉机',
    transplanter: '插秧机',
    drone: '无人机',
    other: '其他',
  };

  const statusLabels: Record<string, string> = {
    available: '可用',
    in_use: '使用中',
    maintenance: '维修中',
    broken: '故障',
  };

  const statusBadgeClass: Record<string, string> = {
    available: 'bg-green-100 text-green-800',
    in_use: 'bg-blue-100 text-blue-800',
    maintenance: 'bg-yellow-100 text-yellow-800',
    broken: 'bg-red-100 text-red-800',
  };

  return (
    <Layout title="设备详情">
      {state.loading ? (
        <div class="card text-center text-gray-500">加载中...</div>
      ) : !state.equipment ? (
        <div class="card text-center py-12">
          <p class="text-gray-500">设备不存在</p>
          <button onClick$={() => nav.navigate('/equipment')} class="btn-primary mt-4">
            返回设备列表
          </button>
        </div>
      ) : (
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2">
            <div class="card">
              <div class="flex items-start justify-between mb-6">
                <div class="flex items-center gap-4">
                  <div class="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center text-3xl">
                    {state.equipment.type === 'tractor' && '🚜'}
                    {state.equipment.type === 'transplanter' && '🌱'}
                    {state.equipment.type === 'drone' && '🛸'}
                    {state.equipment.type === 'other' && '⚙️'}
                  </div>
                  <div>
                    <h2 class="text-xl font-bold text-gray-800">{state.equipment.name}</h2>
                    <p class="text-gray-500">{state.equipment.model}</p>
                  </div>
                </div>
                <span class={`badge ${statusBadgeClass[state.equipment.status]}`}>
                  {statusLabels[state.equipment.status]}
                </span>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div class="p-4 bg-gray-50 rounded-lg">
                  <p class="text-sm text-gray-500 mb-1">设备类型</p>
                  <p class="font-medium text-gray-800">{typeLabels[state.equipment.type]}</p>
                </div>
                <div class="p-4 bg-gray-50 rounded-lg">
                  <p class="text-sm text-gray-500 mb-1">设备编号</p>
                  <p class="font-medium text-gray-800">{state.equipment.serial_number}</p>
                </div>
                <div class="p-4 bg-gray-50 rounded-lg">
                  <p class="text-sm text-gray-500 mb-1">购置日期</p>
                  <p class="font-medium text-gray-800">{state.equipment.purchase_date}</p>
                </div>
                <div class="p-4 bg-gray-50 rounded-lg">
                  <p class="text-sm text-gray-500 mb-1">购置价格</p>
                  <p class="font-medium text-gray-800">¥{state.equipment.purchase_price?.toLocaleString()}</p>
                </div>
                <div class="p-4 bg-gray-50 rounded-lg">
                  <p class="text-sm text-gray-500 mb-1">累计工时</p>
                  <p class="font-medium text-gray-800">{state.equipment.total_hours} 小时</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div class="card">
              <h3 class="font-bold text-gray-800 mb-4">快捷操作</h3>
              <div class="space-y-3">
                {state.equipment.status === 'available' && auth.user?.role !== 'operator' && (
                  <button
                    onClick$={() => nav.navigate(`/reservations/new?equipment=${state.equipment.id}`)}
                    class="w-full btn-primary"
                  >
                    预约此设备
                  </button>
                )}
                {auth.user?.role !== 'member' && (
                  <button
                    onClick$={() => nav.navigate('/maintenance')}
                    class="w-full btn-secondary"
                  >
                    查看维修工单
                  </button>
                )}
                <button
                  onClick$={() => nav.navigate('/equipment')}
                  class="w-full btn-secondary"
                >
                  返回设备列表
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
});
