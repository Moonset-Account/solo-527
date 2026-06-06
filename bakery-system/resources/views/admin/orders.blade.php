@extends('layouts.admin')

@section('title', '订单管理')

@section('content')
<div id="ordersApp" v-cloak>
    <div class="flex h-screen">
        @include('admin.partials.sidebar')

        <main class="flex-1 overflow-auto">
            <div class="p-8">
                <div class="flex justify-between items-center mb-8">
                    <div>
                        <h1 class="text-2xl font-bold text-gray-800">订单管理</h1>
                        <p class="text-gray-500">管理所有订单和状态流转</p>
                    </div>
                </div>

                <div class="bg-white rounded-xl shadow-sm p-4 mb-6">
                    <div class="flex flex-wrap gap-4">
                        <div>
                            <label class="block text-sm text-gray-600 mb-1">订单状态</label>
                            <select v-model="filters.status" class="border rounded-lg px-3 py-2 text-sm">
                                <option value="">全部状态</option>
                                <option value="pending">待确认</option>
                                <option value="confirmed">已确认</option>
                                <option value="in_production">生产中</option>
                                <option value="ready">待取货</option>
                                <option value="picked_up">已取货</option>
                                <option value="cancelled">已取消</option>
                                <option value="refunded">已退款</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm text-gray-600 mb-1">取货日期</label>
                            <input v-model="filters.pickup_date" type="date" class="border rounded-lg px-3 py-2 text-sm">
                        </div>
                        <div>
                            <label class="block text-sm text-gray-600 mb-1">搜索</label>
                            <input v-model="filters.search" type="text" placeholder="订单号/客户名/电话"
                                   class="border rounded-lg px-3 py-2 text-sm w-48">
                        </div>
                        <div class="flex items-end">
                            <button @click="loadOrders" class="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-secondary">
                                筛选
                            </button>
                        </div>
                    </div>
                </div>

                <div class="bg-white rounded-xl shadow-sm overflow-hidden">
                    <table class="w-full">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">订单号</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">客户</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">商品</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">金额</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">取货时间</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">支付</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200">
                            <tr v-for="order in orders" :key="order.id" class="hover:bg-gray-50">
                                <td class="px-6 py-4">
                                    <span class="font-mono text-sm font-medium">@{{ order.order_number }}</span>
                                </td>
                                <td class="px-6 py-4">
                                    <p class="font-medium">@{{ order.customer_name }}</p>
                                    <p class="text-sm text-gray-500">@{{ order.customer_phone }}</p>
                                </td>
                                <td class="px-6 py-4">
                                    <div class="text-sm">
                                        <p v-for="item in order.items" :key="item.id" class="text-gray-600">
                                            @{{ item.product?.name }} x@{{ item.quantity }}
                                        </p>
                                    </div>
                                </td>
                                <td class="px-6 py-4">
                                    <p class="font-semibold">¥@{{ order.total_amount }}</p>
                                    <p class="text-xs text-gray-500">定金: ¥@{{ order.deposit_amount }}</p>
                                </td>
                                <td class="px-6 py-4 text-sm">
                                    <p>@{{ order.pickup_slot?.date }}</p>
                                    <p class="text-gray-500">@{{ order.pickup_slot?.start_time?.substring(0,5) }}-@{{ order.pickup_slot?.end_time?.substring(0,5) }}</p>
                                </td>
                                <td class="px-6 py-4">
                                    <span :class="['status-badge', 'status-' + order.status]">
                                        @{{ getStatusLabel(order.status) }}
                                    </span>
                                </td>
                                <td class="px-6 py-4">
                                    <span :class="['status-badge', 'payment-' + order.payment_status]">
                                        @{{ getPaymentLabel(order.payment_status) }}
                                    </span>
                                </td>
                                <td class="px-6 py-4">
                                    <div class="flex gap-2">
                                        <button v-if="order.status === 'pending'" @click="confirmOrder(order)"
                                                class="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
                                            确认
                                        </button>
                                        <button v-if="order.status === 'confirmed' && order.payment_status !== 'unpaid'"
                                                @click="startProduction(order)"
                                                class="text-xs px-2 py-1 bg-purple-500 text-white rounded hover:bg-purple-600">
                                            开始生产
                                        </button>
                                        <button v-if="order.status === 'in_production'" @click="markReady(order)"
                                                class="text-xs px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600">
                                            标记就绪
                                        </button>
                                        <button v-if="order.status === 'ready' && order.payment_status === 'paid'"
                                                @click="pickup(order)"
                                                class="text-xs px-2 py-1 bg-amber-500 text-white rounded hover:bg-amber-600">
                                            核销取货
                                        </button>
                                        <button v-if="order.canCancel !== false && order.status === 'pending'"
                                                @click="cancelOrder(order)"
                                                class="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600">
                                            取消
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <div v-if="orders.length === 0" class="text-center py-12 text-gray-500">
                        暂无订单数据
                    </div>
                </div>

                <div class="mt-4 flex justify-between items-center">
                    <p class="text-sm text-gray-500">共 @{{ total }} 条记录</p>
                    <div class="flex gap-2">
                        <button @click="prevPage" :disabled="page <= 1"
                                class="px-3 py-1 border rounded disabled:opacity-50">
                            上一页
                        </button>
                        <span class="px-3 py-1">第 @{{ page }} 页</span>
                        <button @click="nextPage" :disabled="page >= lastPage"
                                class="px-3 py-1 border rounded disabled:opacity-50">
                            下一页
                        </button>
                    </div>
                </div>
            </div>
        </main>
    </div>
</div>
@endsection

@section('scripts')
<script>
const { createApp, ref, reactive, onMounted } = Vue;

createApp({
    setup() {
        const user = ref(null);
        const orders = ref([]);
        const page = ref(1);
        const lastPage = ref(1);
        const total = ref(0);
        const filters = reactive({
            status: '',
            pickup_date: '',
            search: ''
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

        const loadOrders = async () => {
            try {
                let url = `/orders?page=${page.value}&per_page=20`;
                if (filters.status) url += `&status=${filters.status}`;
                if (filters.pickup_date) url += `&pickup_date=${filters.pickup_date}`;
                if (filters.search) url += `&search=${filters.search}`;

                const data = await apiRequest(url);
                orders.value = data.data || [];
                lastPage.value = data.last_page || 1;
                total.value = data.total || 0;
            } catch (e) {
                console.error('加载订单失败:', e);
            }
        };

        const getStatusLabel = (status) => {
            const labels = {
                pending: '待确认',
                confirmed: '已确认',
                in_production: '生产中',
                ready: '待取货',
                picked_up: '已取货',
                cancelled: '已取消',
                refunded: '已退款'
            };
            return labels[status] || status;
        };

        const getPaymentLabel = (status) => {
            const labels = {
                unpaid: '未支付',
                deposit_paid: '定金已付',
                paid: '已付清',
                partial_refund: '部分退款',
                full_refund: '全额退款'
            };
            return labels[status] || status;
        };

        const confirmOrder = async (order) => {
            if (!confirm('确认该订单？')) return;
            try {
                await apiRequest(`/orders/${order.id}/confirm`, { method: 'POST' });
                loadOrders();
            } catch (e) {
                alert(e.message);
            }
        };

        const startProduction = async (order) => {
            if (!confirm('开始生产并扣减库存？')) return;
            try {
                await apiRequest(`/orders/${order.id}/start-production`, { method: 'POST' });
                loadOrders();
                alert('生产已开始，库存已扣减');
            } catch (e) {
                alert(e.message);
            }
        };

        const markReady = async (order) => {
            if (!confirm('标记为生产完成？')) return;
            try {
                await apiRequest(`/orders/${order.id}/mark-ready`, { method: 'POST' });
                loadOrders();
            } catch (e) {
                alert(e.message);
            }
        };

        const pickup = async (order) => {
            if (!confirm('确认取货核销？')) return;
            try {
                await apiRequest(`/orders/${order.id}/pickup`, { method: 'POST' });
                loadOrders();
                alert('取货核销成功');
            } catch (e) {
                alert(e.message);
            }
        };

        const cancelOrder = async (order) => {
            if (!confirm('确定取消该订单？')) return;
            try {
                await apiRequest(`/orders/${order.id}/cancel`, { method: 'POST' });
                loadOrders();
            } catch (e) {
                alert(e.message);
            }
        };

        const prevPage = () => {
            if (page.value > 1) {
                page.value--;
                loadOrders();
            }
        };

        const nextPage = () => {
            if (page.value < lastPage.value) {
                page.value++;
                loadOrders();
            }
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
            loadOrders();
        });

        return {
            user, orders, page, lastPage, total, filters,
            loadOrders, getStatusLabel, getPaymentLabel,
            confirmOrder, startProduction, markReady, pickup, cancelOrder,
            prevPage, nextPage, logout
        };
    }
}).mount('#ordersApp');
</script>
@endsection
