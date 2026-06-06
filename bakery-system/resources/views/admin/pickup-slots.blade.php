@extends('layouts.admin')

@section('title', '取货时段')

@section('content')
<div id="slotsApp" v-cloak>
    <div class="flex h-screen">
        @include('admin.partials.sidebar')

        <main class="flex-1 overflow-auto">
            <div class="p-8">
                <div class="flex justify-between items-center mb-8">
                    <div>
                        <h1 class="text-2xl font-bold text-gray-800">取货时段管理</h1>
                        <p class="text-gray-500">设置取货时段和限流数量</p>
                    </div>
                    <div class="flex gap-3">
                        <button @click="showBulkCreate = true" class="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">
                            + 批量创建
                        </button>
                        <button @click="showCreate = true" class="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-secondary">
                            + 新增时段
                        </button>
                    </div>
                </div>

                <div class="bg-white rounded-xl shadow-sm p-4 mb-6">
                    <div class="flex gap-4">
                        <div>
                            <label class="block text-sm text-gray-600 mb-1">开始日期</label>
                            <input v-model="filters.start_date" type="date" class="border rounded-lg px-3 py-2 text-sm">
                        </div>
                        <div>
                            <label class="block text-sm text-gray-600 mb-1">结束日期</label>
                            <input v-model="filters.end_date" type="date" class="border rounded-lg px-3 py-2 text-sm">
                        </div>
                        <div class="flex items-end">
                            <button @click="loadSlots" class="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-secondary">
                                查询
                            </button>
                        </div>
                    </div>
                </div>

                <div class="bg-white rounded-xl shadow-sm overflow-hidden">
                    <table class="w-full">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">日期</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">时段</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">最大单量</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">已预约</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200">
                            <tr v-for="slot in slots" :key="slot.id" class="hover:bg-gray-50">
                                <td class="px-6 py-4">
                                    <span class="font-medium">@{{ slot.date }}</span>
                                </td>
                                <td class="px-6 py-4">
                                    @{{ slot.start_time?.substring(0,5) }} - @{{ slot.end_time?.substring(0,5) }}
                                </td>
                                <td class="px-6 py-4">@{{ slot.max_orders }}</td>
                                <td class="px-6 py-4">
                                    <span :class="slot.is_full ? 'text-red-600 font-semibold' : ''">
                                        @{{ slot.current_orders }}
                                    </span>
                                </td>
                                <td class="px-6 py-4">
                                    <span v-if="slot.is_full" class="status-badge status-pending">已满</span>
                                    <span v-else-if="!slot.is_active" class="status-badge status-cancelled">已停用</span>
                                    <span v-else class="status-badge status-ready">可预约</span>
                                </td>
                                <td class="px-6 py-4">
                                    <button @click="editSlot(slot)" class="text-xs px-2 py-1 border rounded hover:bg-gray-50">
                                        编辑
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <div v-if="slots.length === 0" class="text-center py-12 text-gray-500">
                        暂无时段数据
                    </div>
                </div>
            </div>
        </main>
    </div>

    <div v-if="showCreate" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="showCreate = false">
        <div class="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 class="text-lg font-bold mb-4">新增取货时段</h3>
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">日期</label>
                    <input v-model="slotForm.date" type="date" class="w-full border rounded-lg px-3 py-2">
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">开始时间</label>
                        <input v-model="slotForm.start_time" type="time" class="w-full border rounded-lg px-3 py-2">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">结束时间</label>
                        <input v-model="slotForm.end_time" type="time" class="w-full border rounded-lg px-3 py-2">
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">最大预约单量</label>
                    <input v-model.number="slotForm.max_orders" type="number" min="1" class="w-full border rounded-lg px-3 py-2">
                </div>
                <div class="flex items-center">
                    <input v-model="slotForm.is_active" type="checkbox" id="is_active" class="mr-2">
                    <label for="is_active" class="text-sm">启用该时段</label>
                </div>
            </div>
            <div class="flex justify-end mt-6 gap-3">
                <button @click="showCreate = false" class="px-4 py-2 border rounded-lg hover:bg-gray-50">
                    取消
                </button>
                <button @click="submitCreate" :disabled="!canSubmitSlot"
                        class="px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50 hover:bg-secondary">
                    创建
                </button>
            </div>
        </div>
    </div>

    <div v-if="showBulkCreate" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="showBulkCreate = false">
        <div class="bg-white rounded-xl p-6 w-full max-w-lg mx-4">
            <h3 class="text-lg font-bold mb-4">批量创建取货时段</h3>
            <div class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
                        <input v-model="bulkForm.start_date" type="date" class="w-full border rounded-lg px-3 py-2">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
                        <input v-model="bulkForm.end_date" type="date" class="w-full border rounded-lg px-3 py-2">
                    </div>
                </div>
                <div class="flex items-center">
                    <input v-model="bulkForm.exclude_weekends" type="checkbox" id="exclude_weekends" class="mr-2">
                    <label for="exclude_weekends" class="text-sm">排除周末</label>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">时段配置</label>
                    <div v-for="(time, index) in bulkForm.time_slots" :key="index"
                         class="flex gap-2 items-center mb-2">
                        <input v-model="time.start_time" type="time" class="flex-1 border rounded px-2 py-1 text-sm">
                        <span class="text-gray-400">-</span>
                        <input v-model="time.end_time" type="time" class="flex-1 border rounded px-2 py-1 text-sm">
                        <input v-model.number="time.max_orders" type="number" min="1" placeholder="单量"
                               class="w-20 border rounded px-2 py-1 text-sm">
                        <button @click="removeTimeSlot(index)" class="text-red-500 text-sm">删除</button>
                    </div>
                    <button @click="addTimeSlot" class="text-sm text-primary hover:underline">+ 添加时段</button>
                </div>
            </div>
            <div class="flex justify-end mt-6 gap-3">
                <button @click="showBulkCreate = false" class="px-4 py-2 border rounded-lg hover:bg-gray-50">
                    取消
                </button>
                <button @click="submitBulkCreate"
                        class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary">
                    批量创建
                </button>
            </div>
        </div>
    </div>
</div>
@endsection

@section('scripts')
<script>
const { createApp, ref, reactive, computed, onMounted } = Vue;

createApp({
    setup() {
        const user = ref(null);
        const slots = ref([]);
        const filters = reactive({
            start_date: new Date().toISOString().split('T')[0],
            end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        });
        const showCreate = ref(false);
        const showBulkCreate = ref(false);

        const slotForm = reactive({
            date: '',
            start_time: '',
            end_time: '',
            max_orders: 10,
            is_active: true
        });

        const bulkForm = reactive({
            start_date: '',
            end_date: '',
            exclude_weekends: true,
            time_slots: [
                { start_time: '09:00:00', end_time: '10:00:00', max_orders: 8 },
                { start_time: '10:00:00', end_time: '11:00:00', max_orders: 8 },
                { start_time: '14:00:00', end_time: '15:00:00', max_orders: 8 },
                { start_time: '15:00:00', end_time: '16:00:00', max_orders: 10 },
                { start_time: '16:00:00', end_time: '17:00:00', max_orders: 10 },
            ]
        });

        const canSubmitSlot = computed(() => {
            return slotForm.date && slotForm.start_time && slotForm.end_time && slotForm.max_orders > 0;
        });

        const loadUser = async () => {
            if (!store.isAuthenticated()) {
                window.location.href = '/login';
                return;
            }
            try {
                const data = await apiRequest('/auth/me');
                user.value = data.user;
            } catch (e) {}
        };

        const loadSlots = async () => {
            try {
                let url = '/pickup-slots?per_page=100';
                if (filters.start_date) url += `&start_date=${filters.start_date}`;
                if (filters.end_date) url += `&end_date=${filters.end_date}`;

                const data = await apiRequest(url);
                slots.value = (data.data || data).map(slot => ({
                    ...slot,
                    is_full: slot.current_orders >= slot.max_orders
                }));
            } catch (e) {
                console.error('加载时段失败:', e);
            }
        };

        const addTimeSlot = () => {
            bulkForm.time_slots.push({ start_time: '', end_time: '', max_orders: 8 });
        };

        const removeTimeSlot = (index) => {
            bulkForm.time_slots.splice(index, 1);
        };

        const submitCreate = async () => {
            try {
                await apiRequest('/pickup-slots', {
                    method: 'POST',
                    body: JSON.stringify({
                        ...slotForm,
                        start_time: slotForm.start_time + ':00',
                        end_time: slotForm.end_time + ':00'
                    })
                });
                showCreate.value = false;
                loadSlots();
                alert('创建成功');
            } catch (e) {
                alert(e.message);
            }
        };

        const submitBulkCreate = async () => {
            try {
                const result = await apiRequest('/pickup-slots/bulk/create', {
                    method: 'POST',
                    body: JSON.stringify(bulkForm)
                });
                showBulkCreate.value = false;
                loadSlots();
                alert(`成功创建 ${result.created_count} 个时段`);
            } catch (e) {
                alert(e.message);
            }
        };

        const editSlot = (slot) => {
            alert('编辑功能请调用API实现');
        };

        const logout = async () => {
            try {
                await apiRequest('/auth/logout', { method: 'POST' });
            } catch (e) {}
            store.logout();
            window.location.href = '/login';
        };

        onMounted(() => {
            loadUser();
            loadSlots();
        });

        return {
            user, slots, filters,
            showCreate, showBulkCreate, slotForm, bulkForm,
            canSubmitSlot,
            loadSlots, addTimeSlot, removeTimeSlot,
            submitCreate, submitBulkCreate, editSlot,
            logout
        };
    }
}).mount('#slotsApp');
</script>
@endsection
