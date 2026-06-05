import { component$, useStore, useTask$, $ } from "@builder.io/qwik";
import { useNavigate, useLocation } from "@builder.io/qwik-city";
import Layout from "~/components/layout";
import apiClient from "~/utils/api";
import { useAuth } from "~/context/auth";
import dayjs from "dayjs";

interface Equipment {
  id: string;
  name: string;
  type: string;
  status: string;
}

interface Field {
  id: string;
  name: string;
  area: number;
  location: string;
}

export default component$(() => {
  const auth = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  
  const originalId = new URLSearchParams(loc.url.search).get('original');
  
  const form = useStore({
    equipment_id: '',
    field_id: '',
    crop: '',
    start_time: dayjs().add(1, 'day').hour(8).minute(0).format('YYYY-MM-DDTHH:mm'),
    end_time: dayjs().add(1, 'day').hour(12).minute(0).format('YYYY-MM-DDTHH:mm'),
    price_type: 'member' as 'member' | 'subsidy' | 'commercial',
    notes: '',
    loading: false,
    error: '',
    checkingConflict: false,
    hasConflict: false,
  });
  
  const equipments = useStore<Equipment[]>([]);
  const fields = useStore<Field[]>([]);

  useTask$(async () => {
    if (!auth.isAuthenticated) {
      nav.navigate('/login');
      return;
    }
    
    try {
      const [equipRes, fieldRes] = await Promise.all([
        apiClient.get('/equipment?status=available'),
        apiClient.get('/fields'),
      ]);
      equipments.splice(0, equipments.length, ...equipRes.data);
      fields.splice(0, fields.length, ...fieldRes.data);
      
      if (equipments.length > 0) form.equipment_id = equipments[0].id;
      if (fields.length > 0) form.field_id = fields[0].id;
      
      if (originalId) {
        try {
          const original = await apiClient.get(`/reservations/${originalId}`);
          if (original.data) {
            form.crop = original.data.crop || '';
            form.notes = original.data.notes || '';
            form.price_type = original.data.price_type || 'member';
          }
        } catch (e) {}
      }
    } catch (e) {
      console.error('加载数据失败', e);
    }
  });

  const checkConflict = $(async () => {
    if (!form.equipment_id || !form.start_time || !form.end_time) return;
    
    form.checkingConflict = true;
    try {
      const response = await apiClient.post('/reservations/check-conflict', {
        equipment_id: form.equipment_id,
        start_time: new Date(form.start_time).toISOString(),
        end_time: new Date(form.end_time).toISOString(),
      });
      form.hasConflict = response.data.hasConflict;
    } catch (e) {
      console.error('检查冲突失败', e);
    } finally {
      form.checkingConflict = false;
    }
  });

  const handleSubmit = $(async (e: Event) => {
    e.preventDefault();
    form.error = '';
    form.loading = true;

    try {
      const start = new Date(form.start_time).toISOString();
      const end = new Date(form.end_time).toISOString();
      
      const response = await apiClient.post('/reservations', {
        equipment_id: form.equipment_id,
        field_id: form.field_id,
        crop: form.crop,
        start_time: start,
        end_time: end,
        price_type: form.price_type,
        notes: form.notes,
      });
      
      if (response.data.is_waitlisted) {
        alert(`预约提交成功！由于时段冲突，已进入候补队列 #${response.data.queue_position}`);
      } else {
        alert('预约提交成功！');
      }
      
      nav.navigate('/reservations');
    } catch (e: any) {
      form.error = e.response?.data?.error || '提交失败，请重试';
    } finally {
      form.loading = false;
    }
  });

  const priceMultipliers = {
    member: 0.7,
    subsidy: 0.5,
    commercial: 1.3,
  };

  const estimatedHours = form.start_time && form.end_time 
    ? Math.max(0.5, dayjs(form.end_time).diff(dayjs(form.start_time), 'hour', true))
    : 0;
  const basePrice = estimatedHours * 100;
  const estimatedPrice = Math.round(basePrice * priceMultipliers[form.price_type]);

  return (
    <Layout title={originalId ? '重新提交预约' : '新建预约'}>
      <div class="max-w-2xl mx-auto">
        <div class="card">
          <form onSubmit$={handleSubmit} class="space-y-6">
            <div>
              <label class="label">选择设备 *</label>
              <select
                class="input-field"
                value={form.equipment_id}
                onInput$={(e) => form.equipment_id = (e.target as HTMLSelectElement).value}
                required
              >
                <option value="">请选择设备</option>
                {equipments.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.name} - {eq.status === 'available' ? '可用' : eq.status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label class="label">选择地块 *</label>
              <select
                class="input-field"
                value={form.field_id}
                onInput$={(e) => form.field_id = (e.target as HTMLSelectElement).value}
                required
              >
                <option value="">请选择地块</option>
                {fields.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.area}亩) - {f.location}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label class="label">作物类型 *</label>
              <input
                type="text"
                class="input-field"
                placeholder="如：小麦、玉米、水稻等"
                value={form.crop}
                onInput$={(e) => form.crop = (e.target as HTMLInputElement).value}
                required
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="label">开始时间 *</label>
                <input
                  type="datetime-local"
                  class="input-field"
                  value={form.start_time}
                  onInput$={(e) => { form.start_time = (e.target as HTMLInputElement).value; checkConflict(); }}
                  required
                />
              </div>
              <div>
                <label class="label">结束时间 *</label>
                <input
                  type="datetime-local"
                  class="input-field"
                  value={form.end_time}
                  onInput$={(e) => { form.end_time = (e.target as HTMLInputElement).value; checkConflict(); }}
                  required
                />
              </div>
            </div>

            {form.checkingConflict && (
              <div class="text-sm text-yellow-600">正在检查时段冲突...</div>
            )}
            {form.hasConflict && !form.checkingConflict && (
              <div class="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm">
                ⚠️ 该时段已有预约，提交后将进入候补队列
              </div>
            )}
            {!form.hasConflict && !form.checkingConflict && form.start_time && form.end_time && (
              <div class="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                ✅ 该时段可用
              </div>
            )}

            <div>
              <label class="label">价格类型 *</label>
              <select
                class="input-field"
                value={form.price_type}
                onInput$={(e) => form.price_type = (e.target as HTMLSelectElement).value as any}
                required
              >
                <option value="member">社员自用 (×0.7 倍)</option>
                <option value="subsidy">合作社补贴 (×0.5 倍)</option>
                <option value="commercial">跨村租赁 (×1.3 倍)</option>
              </select>
            </div>

            <div class="p-4 bg-gray-50 rounded-lg">
              <div class="flex justify-between items-center">
                <span class="text-gray-600">预计时长</span>
                <span class="font-medium">{estimatedHours.toFixed(1)} 小时</span>
              </div>
              <div class="flex justify-between items-center mt-2">
                <span class="text-gray-600">基础价格 (¥100/小时)</span>
                <span class="font-medium">¥{basePrice.toFixed(0)}</span>
              </div>
              <div class="flex justify-between items-center mt-2">
                <span class="text-gray-600">价格倍率</span>
                <span class="font-medium">×{priceMultipliers[form.price_type]}</span>
              </div>
              <div class="border-t border-gray-200 mt-3 pt-3 flex justify-between items-center">
                <span class="font-medium text-gray-800">预估费用</span>
                <span class="text-xl font-bold text-primary-600">¥{estimatedPrice}</span>
              </div>
            </div>

            <div>
              <label class="label">备注</label>
              <textarea
                class="input-field"
                rows={3}
                placeholder="作业要求或其他说明"
                value={form.notes}
                onInput$={(e) => form.notes = (e.target as HTMLTextAreaElement).value}
              />
            </div>

            {form.error && (
              <div class="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                {form.error}
              </div>
            )}

            <div class="flex gap-3">
              <button
                type="button"
                onClick$={() => nav.navigate('/reservations')}
                class="flex-1 btn-secondary"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={form.loading}
                class="flex-1 btn-primary"
              >
                {form.loading ? '提交中...' : '提交预约'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
});
