@extends('layouts.admin')

@section('title', '生产看板')

@section('content')
<div id="productionApp" v-cloak>
    <div class="flex h-screen">
        @include('admin.partials.sidebar')

        <main class="flex-1 overflow-auto">
            <div class="p-8">
                <div class="flex justify-between items-center mb-8">
                    <div>
                        <h1 class="text-2xl font-bold text-gray-800">生产看板</h1>
                        <p class="text-gray-500">实时追踪生产进度，优化资源分配</p>
                    </div>
                    <div class="flex items-center gap-4">
                        <div>
                            <label class="text-sm text-gray-600 mr-2">日期</label>
                            <input v-model="selectedDate" type="date" class="border rounded-lg px-3 py-2 text-sm" @change="loadBoard">
                        </div>
                        <button @click="loadBoard" class="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-secondary">
                            刷新
                        </button>
                    </div>
                </div>

                <div class="grid grid-cols-4 gap-4 mb-6">
                    <div class="bg-white rounded-xl p-4 shadow-sm">
                        <p class="text-gray-500 text-sm">总任务</p>
                        <p class="text-3xl font-bold text-gray-800">@{{ board.stats?.total || 0 }}</p>
                    </div>
                    <div class="bg-white rounded-xl p-4 shadow-sm">
                        <p class="text-gray-500 text-sm">待开始</p>
                        <p class="text-3xl font-bold text-yellow-600">@{{ board.stats?.pending || 0 }}</p>
                    </div>
                    <div class="bg-white rounded-xl p-4 shadow-sm">
                        <p class="text-gray-500 text-sm">进行中</p>
                        <p class="text-3xl font-bold text-purple-600">@{{ board.stats?.in_progress || 0 }}</p>
                    </div>
                    <div class="bg-white rounded-xl p-4 shadow-sm">
                        <p class="text-gray-500 text-sm">已完成</p>
                        <p class="text-3xl font-bold text-green-600">@{{ board.stats?.completed || 0 }}</p>
                    </div>
                </div>

                <div class="flex gap-4 overflow-x-auto pb-4">
                    <div class="kanban-column" v-for="(column, status) in board.board" :key="status">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="font-semibold text-gray-700">@{{ column.label }}</h3>
                            <span class="px-2 py-1 bg-gray-200 rounded-full text-xs font-medium">
                                @{{ column.count }}
                            </span>
                        </div>

                        <div v-for="item in column.items" :key="item.id"
                             class="kanban-card"
                             @click="showTaskDetail(item)">
                            <div class="flex justify-between items-start mb-2">
                                <span class="font-mono text-xs text-gray-500">
                                    #@{{ item.order?.order_number }}
                                </span>
                                <span class="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded">
                                    P@{{ item.priority }}
                                </span>
                            </div>

                            <h4 class="font-medium text-sm mb-1">
                                @{{ item.order_item?.product?.name }}
                            </h4>
                            <p class="text-xs text-gray-500 mb-2">
                                x@{{ item.order_item?.quantity }}
                            </p>

                            <div class="flex justify-between items-center text-xs">
                                <span class="text-gray-500">
                                    👤 @{{ item.assigned_to?.name || '未分配' }}
                                </span>
                                <span class="text-gray-400">
                                    @{{ formatDateTime(item.scheduled_at) }}
                                </span>
                            </div>

                            <div class="flex gap-1 mt-3 pt-3 border-t">
                                <select v-if="status !== 'completed'"
                                        @click.stop
                                        @change="updateStatus(item, $event.target.value)"
                                        class="text-xs flex-1 border rounded px-2 py-1">
                                    <option value="">更新状态</option>
                                    <option v-if="status === 'pending'" value="preparing">开始准备</option>
                                    <option v-if="status === 'preparing'" value="baking">开始烘焙</option>
                                    <option v-if="status === 'baking'" value="decorating">开始装饰</option>
                                    <option v-if="status === 'decorating'" value="completed">完成</option>
                                    <option value="on_hold">暂停</option>
                                </select>
                                <button v-if="item.status !== 'completed'"
                                        @click.stop="assignTask(item)"
                                        class="text-xs px-2 py-1 border rounded hover:bg-gray-50">
                                    分配
                                </button>
                            </div>
                        </div>

                        <div v-if="column.count === 0" class="text-center py-8 text-gray-400 text-sm">
                            暂无任务
                        </div>
                    </div>
                </div>

                <div class="bg-white rounded-xl shadow-sm p-6 mt-6">
                    <h2 class="text-lg font-semibold mb-4">人员工作负载</h2>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div v-for="worker in productionStats.by_assignee" :key="worker.name"
                             class="p-4 border rounded-lg">
                            <p class="font-medium">@{{ worker.name }}</p>
                            <div class="flex gap-4 mt-2 text-sm">
                                <span class="text-gray-500">总任务: @{{ worker.count }}</span>
                                <span class="text-green-600">已完成: @{{ worker.completed }}</span>
                            </div>
                            <div class="mt-2 w-full bg-gray-200 rounded-full h-2">
                                <div class="bg-green-500 h-2 rounded-full transition-all"
                                     :style="{ width: worker.count > 0 ? (worker.completed / worker.count * 100) + '%' : '0%' }">
                                </div>
                            </div>
                        </div>
                    </div>
                    <div v-if="productionStats.by_assignee?.length === 0" class="text-center py-4 text-gray-500">
                        暂无数据
                    </div>
                </div>
            </div>
        </main>
    </div>

    <div v-if="showDetail" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="showDetail = false">
        <div class="bg-white rounded-xl p-6 w-full max-w-lg mx-4">
            <h3 class="text-lg font-bold mb-4">任务详情</h3>
            <div v-if="selectedTask" class="space-y-3">
                <div class="flex justify-between">
                    <span class="text-gray-500">订单号</span>
                    <span class="font-mono">@{{ selectedTask.order?.order_number }}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-500">商品</span>
                    <span>@{{ selectedTask.order_item?.product?.name }} x@{{ selectedTask.order_item?.quantity }}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-500">客户</span>
                    <span>@{{ selectedTask.order?.customer_name }}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-500">取货时间</span>
                    <span>@{{ selectedTask.order?.pickup_slot?.date }} @{{ selectedTask.order?.pickup_slot?.start_time?.substring(0,5) }}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-500">状态</span>
                    <span :class="['status-badge', 'status-' + selectedTask.status]">
                        @{{ getStatusLabel(selectedTask.status) }}
                    </span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-500">负责人</span>
                    <span>@{{ selectedTask.assigned_to?.name || '未分配' }}</span>
                </div>
                <div v-if="selectedTask.notes">
                    <span class="text-gray-500">备注</span>
                    <p class="text-sm">@{{ selectedTask.notes }}</p>
                </div>
            </div>
            <div class="flex justify-end mt-6 gap-3">
                <button @click="showDetail = false" class="px-4 py-2 border rounded-lg hover:bg-gray-50">
                    关闭
                </button>
            </div>
        </div>
    </div>
</div>
@endsection

@section('scripts')
<script>
const { createApp, ref, onMounted } = Vue;

createApp({
    setup() {
        const user = ref(null);
        const selectedDate = ref(new Date().toISOString().split('T')[0]);
        const board = ref({ board: {}, stats: {} });
        const productionStats = ref({ by_assignee: [] });
        const showDetail = ref(false);
        const selectedTask = ref(null);

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

        const loadBoard = async () => {
            try {
                board.value = await apiRequest(`/production/board/data?date=${selectedDate.value}`);
                productionStats.value = await apiRequest(`/dashboard/production-stats?date=${selectedDate.value}`);
            } catch (e) {
                console.error('加载看板失败:', e);
            }
        };

        const getStatusLabel = (status) => {
            const labels = {
                pending: '待开始',
                preparing: '准备中',
                baking: '烘焙中',
                decorating: '装饰中',
                completed: '已完成',
                on_hold: '暂停'
            };
            return labels[status] || status;
        };

        const updateStatus = async (task, status) => {
            if (!status) return;
            try {
                await apiRequest(`/production/${task.id}/status`, {
                    method: 'POST',
                    body: JSON.stringify({ status })
                });
                loadBoard();
            } catch (e) {
                alert(e.message);
            }
        };

        const assignTask = async (task) => {
            const staffId = prompt('请输入负责人用户ID (例如: 2)');
            if (!staffId) return;
            try {
                await apiRequest(`/production/${task.id}/assign`, {
                    method: 'POST',
                    body: JSON.stringify({ assigned_to: parseInt(staffId) })
                });
                loadBoard();
            } catch (e) {
                alert(e.message);
            }
        };

        const showTaskDetail = (task) => {
            selectedTask.value = task;
            showDetail.value = true;
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
            loadBoard();
        });

        return {
            user, selectedDate, board, productionStats,
            showDetail, selectedTask,
            loadBoard, getStatusLabel, updateStatus, assignTask, showTaskDetail,
            logout, formatDateTime
        };
    }
}).mount('#productionApp');
</script>
@endsection
