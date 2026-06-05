import { component$, useStore, useTask$, $ } from "@builder.io/qwik";
import { useNavigate, Link } from "@builder.io/qwik-city";
import Layout from "~/components/layout";
import apiClient from "~/utils/api";
import { useAuth } from "~/context/auth";
import dayjs from "dayjs";

interface Reservation {
  id: string;
  member_id: string;
  member_name: string;
  equipment_id: string;
  equipment_name: string;
  field_id: string;
  field_name: string;
  crop: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'waitlisted';
  price_type: 'member' | 'subsidy' | 'commercial';
  estimated_price: number;
  queue_position: number | null;
  cancel_reason: string | null;
  notes: string | null;
  operator_name: string | null;
  created_at: string;
}

const statusLabels: Record<string, string> = {
  pending: '待确认',
  confirmed: '已确认',
  in_progress: '作业中',
  completed: '已完成',
  cancelled: '已取消',
  waitlisted: '候补中',
};

const statusBadgeClass: Record<string, string> = {
  pending: 'badge-pending',
  confirmed: 'badge-confirmed',
  in_progress: 'badge-blue',
  completed: 'badge-completed',
  cancelled: 'badge-cancelled',
  waitlisted: 'badge-waitlisted',
};

const priceTypeLabels: Record<string, string> = {
  member: '社员自用 (×0.7)',
  subsidy: '合作社补贴 (×0.5)',
  commercial: '跨村租赁 (×1.3)',
};

export default component$(() => {
  const auth = useAuth();
  const nav = useNavigate();
  
  const state = useStore({
    reservations: [] as Reservation[],
    loading: true,
    filter: 'all',
    showCancelModal: false,
    selectedReservation: null as Reservation | null,
    cancelReason: '',
  });

  const loadReservations = $(async () => {
    try {
      const params: any = {};
      if (state.filter !== 'all') {
        params.status = state.filter;
      }
      const response = await apiClient.get('/reservations', { params });
      state.reservations = response.data;
    } catch (e) {
      console.error('加载预约失败', e);
    } finally {
      state.loading = false;
    }
  });

  useTask$(async () => {
    if (!auth.isAuthenticated) {
      nav.navigate('/login');
      return;
    }
    await loadReservations();
  });

  const handleCancel = $(async () => {
    if (!state.selectedReservation) return;
    
    try {
      await apiClient.post(`/reservations/${state.selectedReservation.id}/cancel`, {
        reason: state.cancelReason || '用户取消',
      });
      state.showCancelModal = false;
      state.selectedReservation = null;
      state.cancelReason = '';
      await loadReservations();
    } catch (e: any) {
      alert(e.response?.data?.error || '取消失败');
    }
  });

  const handleResubmit = $((reservation: Reservation) => {
    nav.navigate(`/reservations/new?original=${reservation.id}`);
  });

  const handleConfirm = $(async (reservation: Reservation) => {
    try {
      await apiClient.post(`/reservations/${reservation.id}/confirm`);
      await loadReservations();
    } catch (e: any) {
      alert(e.response?.data?.error || '确认失败');
    }
  });

  const filteredReservations = state.reservations.filter(r => {
    if (state.filter === 'all') return true;
    return r.status === state.filter;
  });

  return (
    <Layout title="预约管理">
      <div class="flex items-center justify-between mb-6">
        <div class="flex gap-2">
          {['all', 'pending', 'confirmed', 'waitlisted', 'cancelled', 'completed'].map((f) => (
            <button
              key={f}
              onClick$={() => { state.filter = f; loadReservations(); }}
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
        
        {auth.user?.role !== 'operator' && (
          <button
            onClick$={() => nav.navigate('/reservations/new')}
            class="btn-primary flex items-center gap-2"
          >
            <span>+</span>
            新建预约
          </button>
        )}
      </div>

      {state.loading ? (
        <div class="card text-center text-gray-500">加载中...</div>
      ) : (
        <div class="card overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-100">
                <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">设备</th>
                <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">地块</th>
                <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">作物</th>
                <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">预约时间</th>
                <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">社员</th>
                <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">价格</th>
                <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">状态</th>
                <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredReservations.length === 0 ? (
                <tr>
                  <td colspan="8" class="text-center py-8 text-gray-500">暂无预约记录</td>
                </tr>
              ) : (
                filteredReservations.map((r) => (
                  <tr key={r.id} class="border-b border-gray-50 hover:bg-gray-50">
                    <td class="py-3 px-4">
                      <div class="font-medium text-gray-800">{r.equipment_name}</div>
                    </td>
                    <td class="py-3 px-4 text-gray-600">{r.field_name}</td>
                    <td class="py-3 px-4 text-gray-600">{r.crop}</td>
                    <td class="py-3 px-4">
                      <div class="text-sm text-gray-800">
                        {dayjs(r.start_time).format('MM-DD HH:mm')} - {dayjs(r.end_time).format('HH:mm')}
                      </div>
                      <div class="text-xs text-gray-400">
                        {dayjs(r.start_time).fromNow()}
                      </div>
                    </td>
                    <td class="py-3 px-4 text-gray-600">{r.member_name}</td>
                    <td class="py-3 px-4">
                      <div class="text-sm font-medium text-gray-800">¥{r.estimated_price}</div>
                      <div class="text-xs text-gray-400">{priceTypeLabels[r.price_type]}</div>
                    </td>
                    <td class="py-3 px-4">
                      <span class={`badge ${statusBadgeClass[r.status]}`}>
                        {statusLabels[r.status]}
                        {r.status === 'waitlisted' && r.queue_position && ` #${r.queue_position}`}
                      </span>
                    </td>
                    <td class="py-3 px-4">
                      <div class="flex gap-2">
                        {r.status === 'pending' && auth.user?.role !== 'member' && (
                          <button
                            onClick$={() => handleConfirm(r)}
                            class="text-sm text-primary-600 hover:text-primary-700"
                          >
                            确认
                          </button>
                        )}
                        {(r.status === 'pending' || r.status === 'waitlisted') && (
                          <button
                            onClick$={() => { state.selectedReservation = r; state.showCancelModal = true; }}
                            class="text-sm text-red-600 hover:text-red-700"
                          >
                            取消
                          </button>
                        )}
                        {r.status === 'cancelled' && (
                          <button
                            onClick$={() => handleResubmit(r)}
                            class="text-sm text-primary-600 hover:text-primary-700"
                          >
                            重新提交
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {state.showCancelModal && state.selectedReservation && (
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div class="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 class="text-lg font-bold text-gray-800 mb-4">取消预约</h3>
            <p class="text-gray-600 mb-4">
              确定要取消 {state.selectedReservation.equipment_name} 的预约吗？
              {!state.selectedReservation.status.includes('wait') && (
                <span class="text-red-500 block mt-1 text-sm">注意：取消将扣除10积分</span>
              )}
            </p>
            <div class="mb-4">
              <label class="label">取消原因</label>
              <textarea
                class="input-field"
                rows={3}
                placeholder="请输入取消原因"
                value={state.cancelReason}
                onInput$={(e) => state.cancelReason = (e.target as HTMLTextAreaElement).value}
              />
            </div>
            <div class="flex gap-3 justify-end">
              <button
                onClick$={() => { state.showCancelModal = false; state.selectedReservation = null; }}
                class="btn-secondary"
              >
                取消
              </button>
              <button
                onClick$={handleCancel}
                class="btn-danger"
              >
                确认取消
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
});
