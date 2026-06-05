import { component$, useStore, useTask$, $ } from "@builder.io/qwik";
import { useNavigate } from "@builder.io/qwik-city";
import Layout from "~/components/layout";
import apiClient from "~/utils/api";
import { useAuth } from "~/context/auth";
import dayjs from "dayjs";

interface WorkTask {
  id: string;
  reservation_id: string;
  operator_id: string;
  equipment_id: string;
  field_id: string;
  member_id: string;
  status: 'assigned' | 'in_progress' | 'completed';
  assigned_at: string;
  started_at: string | null;
  completed_at: string | null;
  route_info: any;
  crop: string;
  start_time: string;
  end_time: string;
  price_type: string;
  equipment_name: string;
  equipment_type: string;
  field_name: string;
  field_area: number;
  member_name: string;
  member_phone: string;
  notes: string | null;
  fuel_consumption?: number;
  work_hours?: number;
  field_photos?: string[];
  record_notes?: string;
}

const statusLabels: Record<string, string> = {
  assigned: '待开始',
  in_progress: '进行中',
  completed: '已完成',
};

export default component$(() => {
  const auth = useAuth();
  const nav = useNavigate();
  
  const state = useStore({
    tasks: [] as WorkTask[],
    loading: true,
    showCompleteModal: false,
    selectedTask: null as WorkTask | null,
    completeForm: {
      work_hours: '',
      fuel_consumption: '',
      notes: '',
      photos: [] as string[],
    },
  });

  const loadTasks = $(async () => {
    try {
      const response = await apiClient.get('/work/tasks');
      state.tasks = response.data;
    } catch (e) {
      console.error('加载任务失败', e);
    } finally {
      state.loading = false;
    }
  });

  useTask$(async () => {
    if (!auth.isAuthenticated) {
      nav.navigate('/login');
      return;
    }
    await loadTasks();
  });

  const handleStartWork = $(async (task: WorkTask) => {
    try {
      await apiClient.post(`/work/tasks/${task.id}/start`);
      await loadTasks();
    } catch (e: any) {
      alert(e.response?.data?.error || '开始作业失败');
    }
  });

  const handlePhotoUpload = $(async (e: Event) => {
    const input = e.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    if (!state.selectedTask) return;

    const formData = new FormData();
    for (let i = 0; i < input.files.length; i++) {
      formData.append('photos', input.files[i]);
    }

    try {
      const response = await apiClient.post(
        `/work/tasks/${state.selectedTask.id}/upload-photo`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      state.completeForm.photos.push(...response.data.photos);
    } catch (e: any) {
      alert(e.response?.data?.error || '照片上传失败');
    }
  });

  const handleCompleteWork = $(async () => {
    if (!state.selectedTask) return;
    
    try {
      await apiClient.post(`/work/tasks/${state.selectedTask.id}/complete`, {
        work_hours: parseFloat(state.completeForm.work_hours),
        fuel_consumption: parseFloat(state.completeForm.fuel_consumption),
        notes: state.completeForm.notes,
        photos: state.completeForm.photos,
      });
      
      state.showCompleteModal = false;
      state.selectedTask = null;
      state.completeForm = { work_hours: '', fuel_consumption: '', notes: '', photos: [] };
      await loadTasks();
      alert('作业完成，结算单已生成');
    } catch (e: any) {
      alert(e.response?.data?.error || '完成作业失败');
    }
  });

  return (
    <Layout title="作业任务">
      <div class="space-y-6">
        {state.loading ? (
          <div class="card text-center text-gray-500">加载中...</div>
        ) : state.tasks.length === 0 ? (
          <div class="card text-center py-12">
            <div class="text-4xl mb-4">📋</div>
            <p class="text-gray-500">暂无分配的作业任务</p>
          </div>
        ) : (
          state.tasks.map((task) => (
            <div key={task.id} class="card">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center gap-3 mb-2">
                    <h3 class="font-bold text-gray-800">{task.equipment_name}</h3>
                    <span class={`badge ${
                      task.status === 'assigned' ? 'badge-pending' :
                      task.status === 'in_progress' ? 'badge-confirmed' :
                      'badge-completed'
                    }`}>
                      {statusLabels[task.status]}
                    </span>
                  </div>
                  
                  <div class="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <span class="text-gray-500">地块：</span>
                      <span class="text-gray-800">{task.field_name}</span>
                    </div>
                    <div>
                      <span class="text-gray-500">作物：</span>
                      <span class="text-gray-800">{task.crop}</span>
                    </div>
                    <div>
                      <span class="text-gray-500">社员：</span>
                      <span class="text-gray-800">{task.member_name}</span>
                    </div>
                    <div>
                      <span class="text-gray-500">预约时间：</span>
                      <span class="text-gray-800">
                        {dayjs(task.start_time).format('MM-DD HH:mm')}
                      </span>
                    </div>
                  </div>

                  {task.notes && (
                    <div class="text-sm text-gray-500 mb-4">
                      <span class="text-gray-400">备注：</span>{task.notes}
                    </div>
                  )}

                  <div class="text-xs text-gray-400">
                    分配时间：{dayjs(task.assigned_at).format('YYYY-MM-DD HH:mm')}
                    {task.started_at && ` · 开始时间：${dayjs(task.started_at).format('HH:mm')}`}
                    {task.completed_at && ` · 完成时间：${dayjs(task.completed_at).format('HH:mm')}`}
                  </div>
                </div>

                <div class="flex flex-col gap-2 ml-6">
                  {task.status === 'assigned' && (
                    <button
                      onClick$={() => handleStartWork(task)}
                      class="btn-primary"
                    >
                      开始作业
                    </button>
                  )}
                  {task.status === 'in_progress' && (
                    <button
                      onClick$={() => { state.selectedTask = task; state.showCompleteModal = true; }}
                      class="btn-primary"
                    >
                      完成作业
                    </button>
                  )}
                  {task.status === 'completed' && (
                    <button
                      onClick$={() => nav.navigate(`/reservations/${task.reservation_id}`)}
                      class="btn-secondary"
                    >
                      查看详情
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {state.showCompleteModal && state.selectedTask && (
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div class="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 class="text-lg font-bold text-gray-800 mb-6">完成作业</h3>
            
            <div class="space-y-4">
              <div>
                <label class="label">作业时长（小时）*</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  class="input-field"
                  placeholder="请输入作业时长"
                  value={state.completeForm.work_hours}
                  onInput$={(e) => state.completeForm.work_hours = (e.target as HTMLInputElement).value}
                />
              </div>

              <div>
                <label class="label">油耗（升）*</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  class="input-field"
                  placeholder="请输入耗油量"
                  value={state.completeForm.fuel_consumption}
                  onInput$={(e) => state.completeForm.fuel_consumption = (e.target as HTMLInputElement).value}
                />
              </div>

              <div>
                <label class="label">地块照片</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  class="input-field"
                  onChange$={handlePhotoUpload}
                />
                {state.completeForm.photos.length > 0 && (
                  <div class="mt-2 flex flex-wrap gap-2">
                    {state.completeForm.photos.map((photo, i) => (
                      <div key={i} class="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
                        📷
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label class="label">作业备注</label>
                <textarea
                  class="input-field"
                  rows={3}
                  placeholder="作业情况说明"
                  value={state.completeForm.notes}
                  onInput$={(e) => state.completeForm.notes = (e.target as HTMLTextAreaElement).value}
                />
              </div>
            </div>

            <div class="flex gap-3 mt-6">
              <button
                onClick$={() => {
                  state.showCompleteModal = false;
                  state.selectedTask = null;
                  state.completeForm = { work_hours: '', fuel_consumption: '', notes: '', photos: [] };
                }}
                class="flex-1 btn-secondary"
              >
                取消
              </button>
              <button
                onClick$={handleCompleteWork}
                class="flex-1 btn-primary"
              >
                确认完成
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
});
