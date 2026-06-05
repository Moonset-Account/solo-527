import { component$, useStore, useTask$, $ } from "@builder.io/qwik";
import { useNavigate } from "@builder.io/qwik-city";
import Layout from "~/components/layout";
import apiClient from "~/utils/api";
import { useAuth } from "~/context/auth";

interface Equipment {
  id: string;
  name: string;
  type: 'tractor' | 'transplanter' | 'drone' | 'other';
  model: string;
  serial_number: string;
  purchase_date: string;
  purchase_price: number;
  status: 'available' | 'in_use' | 'maintenance' | 'broken';
  total_hours: number;
}

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

export default component$(() => {
  const auth = useAuth();
  const nav = useNavigate();
  
  const state = useStore({
    equipments: [] as Equipment[],
    loading: true,
    filter: 'all',
  });

  const loadEquipments = $(async () => {
    try {
      const params: any = {};
      if (state.filter !== 'all') {
        params.status = state.filter;
      }
      const response = await apiClient.get('/equipment', { params });
      state.equipments = response.data;
    } catch (e) {
      console.error('加载设备失败', e);
    } finally {
      state.loading = false;
    }
  });

  useTask$(async () => {
    if (!auth.isAuthenticated) {
      nav.navigate('/login');
      return;
    }
    await loadEquipments();
  });

  return (
    <Layout title="设备管理">
      <div class="flex items-center justify-between mb-6">
        <div class="flex gap-2">
          {['all', 'available', 'in_use', 'maintenance', 'broken'].map((f) => (
            <button
              key={f}
              onClick$={() => { state.filter = f; loadEquipments(); }}
              class={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                state.filter === f
                  ? 'bg-primary-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {f === 'all' ? '全部' : statusLabels[f]}
            </button>
          ))}
        </div>
      </div>

      {state.loading ? (
        <div class="card text-center text-gray-500">加载中...</div>
      ) : (
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {state.equipments.map((eq) => (
            <div key={eq.id} class="card hover:shadow-md transition-shadow cursor-pointer"
              onClick$={() => nav.navigate(`/equipment/${eq.id}`)}
            >
              <div class="flex items-start justify-between mb-4">
                <div class="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center text-2xl">
                  {eq.type === 'tractor' && '🚜'}
                  {eq.type === 'transplanter' && '🌱'}
                  {eq.type === 'drone' && '🛸'}
                  {eq.type === 'other' && '⚙️'}
                </div>
                <span class={`badge ${statusBadgeClass[eq.status]}`}>
                  {statusLabels[eq.status]}
                </span>
              </div>
              
              <h3 class="font-bold text-gray-800 mb-1">{eq.name}</h3>
              <p class="text-sm text-gray-500 mb-3">{eq.model}</p>
              
              <div class="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span class="text-gray-400">类型</span>
                  <p class="text-gray-700 font-medium">{typeLabels[eq.type]}</p>
                </div>
                <div>
                  <span class="text-gray-400">累计工时</span>
                  <p class="text-gray-700 font-medium">{eq.total_hours}h</p>
                </div>
                <div>
                  <span class="text-gray-400">编号</span>
                  <p class="text-gray-700 font-medium truncate">{eq.serial_number}</p>
                </div>
                <div>
                  <span class="text-gray-400">购置日期</span>
                  <p class="text-gray-700 font-medium">{eq.purchase_date}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
});
