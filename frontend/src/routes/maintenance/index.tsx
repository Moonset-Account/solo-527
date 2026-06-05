import { component$, useStore, useTask$, $ } from "@builder.io/qwik";
import { useNavigate } from "@builder.io/qwik-city";
import Layout from "~/components/layout";
import apiClient from "~/utils/api";
import { useAuth } from "~/context/auth";
import dayjs from "dayjs";

interface MaintenanceTicket {
  id: string;
  equipment_id: string;
  equipment_name: string;
  reported_by: string;
  reporter_name: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  cost: number;
  reported_at: string;
  resolved_at: string | null;
}

const priorityLabels: Record<string, string> = {
  low: '低',
  medium: '中',
  high: '高',
  critical: '紧急',
};

const priorityBadgeClass: Record<string, string> = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-yellow-100 text-yellow-800',
  critical: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  open: '待处理',
  in_progress: '处理中',
  resolved: '已解决',
  closed: '已关闭',
};

export default component$(() => {
  const auth = useAuth();
  const nav = useNavigate();
  
  const state = useStore({
    tickets: [] as MaintenanceTicket[],
    equipments: [] as any[],
    loading: true,
    showCreateModal: false,
    newTicket: {
      equipment_id: '',
      title: '',
      description: '',
      priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    },
  });

  const loadData = $(async () => {
    try {
      const [ticketRes, equipRes] = await Promise.all([
        apiClient.get('/maintenance'),
        apiClient.get('/equipment'),
      ]);
      state.tickets = ticketRes.data;
      state.equipments = equipRes.data;
      if (state.equipments.length > 0 && !state.newTicket.equipment_id) {
        state.newTicket.equipment_id = state.equipments[0].id;
      }
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

  const handleCreateTicket = $(async () => {
    try {
      await apiClient.post('/maintenance', state.newTicket);
      state.showCreateModal = false;
      state.newTicket = { equipment_id: state.equipments[0]?.id || '', title: '', description: '', priority: 'medium' };
      await loadData();
      alert('工单创建成功！高优先级工单将自动触发设备故障重排流程');
    } catch (e: any) {
      alert(e.response?.data?.error || '创建失败');
    }
  });

  return (
    <Layout title="维修工单">
      <div class="flex items-center justify-between mb-6">
        <div class="text-gray-500 text-sm">
          共 {state.tickets.length} 个工单
        </div>
        <button
          onClick$={() => state.showCreateModal = true}
          class="btn-primary flex items-center gap-2"
        >
          <span>+</span>
          新建工单
        </button>
      </div>

      {state.loading ? (
        <div class="card text-center text-gray-500">加载中...</div>
      ) : state.tickets.length === 0 ? (
        <div class="card text-center py-12">
          <div class="text-4xl mb-4">🔧</div>
          <p class="text-gray-500">暂无维修工单</p>
        </div>
      ) : (
        <div class="space-y-4">
          {state.tickets.map((ticket) => (
            <div key={ticket.id} class="card">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center gap-3 mb-2">
                    <h3 class="font-bold text-gray-800">{ticket.title}</h3>
                    <span class={`badge ${priorityBadgeClass[ticket.priority]}`}>
                      {priorityLabels[ticket.priority]}
                    </span>
                    <span class="badge bg-gray-100 text-gray-600">
                      {statusLabels[ticket.status]}
                    </span>
                  </div>
                  
                  <p class="text-gray-600 text-sm mb-3">{ticket.description}</p>
                  
                  <div class="flex flex-wrap gap-4 text-xs text-gray-400">
                    <span>设备：{ticket.equipment_name}</span>
                    <span>上报人：{ticket.reporter_name}</span>
                    <span>上报时间：{dayjs(ticket.reported_at).format('YYYY-MM-DD HH:mm')}</span>
                    {ticket.cost > 0 && <span>费用：¥{ticket.cost}</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {state.showCreateModal && (
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div class="bg-white rounded-xl p-6 w-full max-w-lg">
            <h3 class="text-lg font-bold text-gray-800 mb-6">新建维修工单</h3>
            
            <div class="space-y-4">
              <div>
                <label class="label">选择设备 *</label>
                <select
                  class="input-field"
                  value={state.newTicket.equipment_id}
                  onInput$={(e) => state.newTicket.equipment_id = (e.target as HTMLSelectElement).value}
                >
                  {state.equipments.map((eq) => (
                    <option key={eq.id} value={eq.id}>{eq.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label class="label">标题 *</label>
                <input
                  type="text"
                  class="input-field"
                  placeholder="简要描述故障"
                  value={state.newTicket.title}
                  onInput$={(e) => state.newTicket.title = (e.target as HTMLInputElement).value}
                />
              </div>

              <div>
                <label class="label">详细描述 *</label>
                <textarea
                  class="input-field"
                  rows={3}
                  placeholder="详细描述故障现象和情况"
                  value={state.newTicket.description}
                  onInput$={(e) => state.newTicket.description = (e.target as HTMLTextAreaElement).value}
                />
              </div>

              <div>
                <label class="label">优先级 *</label>
                <select
                  class="input-field"
                  value={state.newTicket.priority}
                  onInput$={(e) => state.newTicket.priority = (e.target as HTMLSelectElement).value as any}
                >
                  <option value="low">低</option>
                  <option value="medium">中</option>
                  <option value="high">高</option>
                  <option value="critical">紧急（将自动重排预约）</option>
                </select>
                <p class="text-xs text-yellow-600 mt-1">
                  选择"高"或"紧急"优先级时，系统将自动重排受影响的预约
                </p>
              </div>
            </div>

            <div class="flex gap-3 mt-6">
              <button
                onClick$={() => state.showCreateModal = false}
                class="flex-1 btn-secondary"
              >
                取消
              </button>
              <button
                onClick$={handleCreateTicket}
                class="flex-1 btn-primary"
              >
                创建工单
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
});
