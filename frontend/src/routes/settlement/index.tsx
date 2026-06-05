import { component$, useStore, useTask$, $ } from "@builder.io/qwik";
import { useNavigate } from "@builder.io/qwik-city";
import Layout from "~/components/layout";
import apiClient from "~/utils/api";
import { useAuth } from "~/context/auth";
import dayjs from "dayjs";

interface Settlement {
  id: string;
  reservation_id: string;
  member_id: string;
  member_name: string;
  price_type: 'member' | 'subsidy' | 'commercial';
  base_price: number;
  price_multiplier: number;
  fuel_cost: number;
  total_amount: number;
  points_deducted: number;
  status: 'pending' | 'confirmed' | 'paid';
  created_at: string;
  confirmed_at: string | null;
  reservation: {
    equipment_name: string;
    field_name: string;
    crop: string;
  };
}

const priceTypeLabels: Record<string, string> = {
  member: '社员自用',
  subsidy: '合作社补贴',
  commercial: '跨村租赁',
};

const statusLabels: Record<string, string> = {
  pending: '待确认',
  confirmed: '已确认',
  paid: '已支付',
};

const statusBadgeClass: Record<string, string> = {
  pending: 'badge-pending',
  confirmed: 'badge-confirmed',
  paid: 'badge-completed',
};

export default component$(() => {
  const auth = useAuth();
  const nav = useNavigate();
  
  const state = useStore({
    settlements: [] as Settlement[],
    loading: true,
    stats: {
      total: 0,
      confirmed: 0,
      pending: 0,
      total_amount: 0,
    },
  });

  const loadData = $(async () => {
    try {
      const [settleRes, statsRes] = await Promise.all([
        apiClient.get('/settlements'),
        apiClient.get('/settlements/stats/summary'),
      ]);
      state.settlements = settleRes.data;
      state.stats = statsRes.data;
    } catch (e) {
      console.error('加载数据失败', e);
    } finally {
      state.loading = false;
    }
  });

  useTask$(async () => {
    if (!auth.isAuthenticated) {
      nav.navigate('/login');
      return;
    }
    await loadData();
  });

  const handleConfirm = $(async (id: string) => {
    try {
      await apiClient.post(`/settlements/${id}/confirm`);
      await loadData();
    } catch (e: any) {
      alert(e.response?.data?.error || '确认失败');
    }
  });

  return (
    <Layout title="结算管理">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div class="card">
          <p class="text-sm text-gray-500 mb-1">总单数</p>
          <p class="text-2xl font-bold text-gray-800">{state.stats.total}</p>
        </div>
        <div class="card">
          <p class="text-sm text-gray-500 mb-1">待确认</p>
          <p class="text-2xl font-bold text-yellow-600">{state.stats.pending}</p>
        </div>
        <div class="card">
          <p class="text-sm text-gray-500 mb-1">已确认</p>
          <p class="text-2xl font-bold text-green-600">{state.stats.confirmed}</p>
        </div>
        <div class="card">
          <p class="text-sm text-gray-500 mb-1">总金额</p>
          <p class="text-2xl font-bold text-primary-600">¥{state.stats.total_amount}</p>
        </div>
      </div>

      {state.loading ? (
        <div class="card text-center text-gray-500">加载中...</div>
      ) : state.settlements.length === 0 ? (
        <div class="card text-center py-12">
          <div class="text-4xl mb-4">💰</div>
          <p class="text-gray-500">暂无结算记录</p>
        </div>
      ) : (
        <div class="card overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-100">
                <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">设备</th>
                <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">地块</th>
                <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">社员</th>
                <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">价格类型</th>
                <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">金额</th>
                <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">状态</th>
                <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">创建时间</th>
                <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody>
              {state.settlements.map((s) => (
                <tr key={s.id} class="border-b border-gray-50 hover:bg-gray-50">
                  <td class="py-3 px-4 text-gray-800">{s.reservation?.equipment_name || '-'}</td>
                  <td class="py-3 px-4 text-gray-600">{s.reservation?.field_name || '-'}</td>
                  <td class="py-3 px-4 text-gray-600">{s.member_name}</td>
                  <td class="py-3 px-4 text-gray-600">{priceTypeLabels[s.price_type]}</td>
                  <td class="py-3 px-4">
                    <span class="font-bold text-gray-800">¥{s.total_amount}</span>
                    <div class="text-xs text-gray-400">
                      基础¥{s.base_price} × {s.price_multiplier}
                    </div>
                  </td>
                  <td class="py-3 px-4">
                    <span class={`badge ${statusBadgeClass[s.status]}`}>
                      {statusLabels[s.status]}
                    </span>
                  </td>
                  <td class="py-3 px-4 text-sm text-gray-500">
                    {dayjs(s.created_at).format('MM-DD HH:mm')}
                  </td>
                  <td class="py-3 px-4">
                    {s.status === 'pending' && auth.user?.role === 'admin' && (
                      <button
                        onClick$={() => handleConfirm(s.id)}
                        class="text-sm text-primary-600 hover:text-primary-700"
                      >
                        确认
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
});
