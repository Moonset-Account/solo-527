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
                            <label class="block text-sm text-gray-600 mb-1">支付状态</label>
                            <select v-model="filters.payment_status" class="border rounded-lg px-3 py-2 text-sm">
                                <option value="">全部支付</option>
                                <option value="unpaid">未支付</option>
                                <option value="deposit_paid">定金已付</option>
                                <option value="paid">已付清</option>
                                <option value="partial_refund">部分退款</option>
                                <option value="full_refund">全额退款</option>
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
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">订单号</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">客户</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">商品</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">金额</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">取货时间</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">订单状态</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">支付状态</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200">
                            <tr v-for="order in orders" :key="order.id" class="hover:bg-gray-50">
                                <td class="px-4 py-4">
                                    <span class="font-mono text-sm font-medium">@{{ order.order_number }}</span>
                                </td>
                                <td class="px-4 py-4">
                                    <p class="font-medium text-sm">@{{ order.customer_name }}</p>
                                    <p class="text-xs text-gray-500">@{{ order.customer_phone }}</p>
                                </td>
                                <td class="px-4 py-4">
                                    <div class="text-xs">
                                        <p v-for="item in order.items" :key="item.id" class="text-gray-600">
                                            @{{ item.product?.name }} x@{{ item.quantity }}
                                        </p>
                                    </div>
                                </td>
                                <td class="px-4 py-4">
                                    <p class="font-semibold text-sm">¥@{{ order.total_amount }}</p>
                                    <p class="text-xs text-gray-500">定:¥@{{ order.deposit_amount }} / 尾:¥@{{ order.balance_amount }}</p>
                                </td>
                                <td class="px-4 py-4 text-xs">
                                    <p>@{{ order.pickup_slot?.date }}</p>
                                    <p class="text-gray-500">@{{ order.pickup_slot?.start_time?.substring(0,5) }}-@{{ order.pickup_slot?.end_time?.substring(0,5) }}</p>
                                </td>
                                <td class="px-4 py-4">
                                    <span :class="['status-badge', 'status-' + order.status]">
                                        @{{ getStatusLabel(order.status) }}
                                    </span>
                                </td>
                                <td class="px-4 py-4">
                                    <span :class="['status-badge', 'payment-' + order.payment_status]">
                                        @{{ getPaymentLabel(order.payment_status) }}
                                    </span>
                                </td>
                                <td class="px-4 py-4">
                                    <div class="flex flex-wrap gap-1">
                                        <button v-if="order.status === 'pending'" @click="confirmOrder(order)"
                                                class="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
                                            确认
                                        </button>

                                        <button v-if="!hasDepositPaid(order) && getRemainingAmount(order) > 0 && ['pending','confirmed'].includes(order.status)"
                                                @click="openPayment(order, 'deposit')"
                                                class="text-xs px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600">
                                            收定金
                                        </button>

                                        <button v-if="hasDepositPaid(order) && getRemainingAmount(order) > 0 && ['confirmed','in_production','ready'].includes(order.status)"
                                                @click="openPayment(order, 'balance')"
                                                class="text-xs px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600">
                                            收尾款
                                        </button>

                                        <button v-if="getRemainingAmount(order) > 0 && ['pending','confirmed','in_production','ready'].includes(order.status) && order.payment_status !== 'full_refund' && order.status !== 'refunded'"
                                                @click="openPayment(order, 'full')"
                                                class="text-xs px-2 py-1 bg-emerald-500 text-white rounded hover:bg-emerald-600">
                                            收全款
                                        </button>

                                        <button v-if="order.status === 'confirmed' && order.payment_status !== 'unpaid'"
                                                @click="startProduction(order)"
                                                class="text-xs px-2 py-1 bg-purple-500 text-white rounded hover:bg-purple-600">
                                            开始生产
                                        </button>

                                        <button v-if="order.status === 'in_production'" @click="markReady(order)"
                                                class="text-xs px-2 py-1 bg-teal-500 text-white rounded hover:bg-teal-600">
                                            标记就绪
                                        </button>

                                        <button v-if="order.status === 'ready' && order.payment_status === 'paid'"
                                                @click="pickup(order)"
                                                class="text-xs px-2 py-1 bg-amber-500 text-white rounded hover:bg-amber-600">
                                            核销取货
                                        </button>

                                        <button v-if="order.payment_status !== 'unpaid' && order.payment_status !== 'full_refund' && order.status !== 'refunded'"
                                                @click="openRefund(order)"
                                                class="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600">
                                            退款
                                        </button>

                                        <button v-if="['pending','confirmed'].includes(order.status)" @click="cancelOrder(order)"
                                                class="text-xs px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600">
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

    <div v-if="showPaymentModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="showPaymentModal = false">
        <div class="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 class="text-lg font-bold mb-4">
                @{{ paymentType === 'deposit' ? '收取定金' : paymentType === 'balance' ? '收取尾款' : '收取全款' }}
            </h3>
            <div v-if="selectedOrder" class="space-y-4">
                <div class="p-3 bg-gray-50 rounded-lg">
                    <p class="text-sm">订单号: <span class="font-mono font-medium">@{{ selectedOrder.order_number }}</span></p>
                    <p class="text-sm">客户: @{{ selectedOrder.customer_name }}</p>
                    <p class="text-sm">已付: ¥@{{ getPaidAmount(selectedOrder) }}</p>
                    <p class="text-lg font-bold mt-2">
                        应收金额:
                        <span class="text-primary">
                            ¥@{{ paymentType === 'deposit' ? selectedOrder.deposit_amount :
                                getRemainingAmount(selectedOrder) }}
                        </span>
                    </p>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">实收金额</label>
                    <input v-model.number="paymentForm.amount" type="number" step="0.01" min="0"
                           class="w-full border rounded-lg px-3 py-2">
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">支付方式</label>
                    <select v-model="paymentForm.method" class="w-full border rounded-lg px-3 py-2">
                        <option value="cash">现金</option>
                        <option value="wechat">微信</option>
                        <option value="alipay">支付宝</option>
                        <option value="bank_transfer">银行转账</option>
                        <option value="other">其他</option>
                    </select>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">交易号/备注</label>
                    <input v-model="paymentForm.transaction_id" type="text"
                           class="w-full border rounded-lg px-3 py-2" placeholder="选填">
                </div>
            </div>
            <div class="flex justify-end mt-6 gap-3">
                <button @click="showPaymentModal = false" class="px-4 py-2 border rounded-lg hover:bg-gray-50">
                    取消
                </button>
                <button @click="submitPayment" :disabled="!paymentForm.amount || paymentForm.amount <= 0"
                        class="px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50 hover:bg-secondary">
                    确认收款
                </button>
            </div>
        </div>
    </div>

    <div v-if="showRefundModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="showRefundModal = false">
        <div class="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 class="text-lg font-bold mb-4">订单退款</h3>
            <div v-if="selectedOrder" class="space-y-4">
                <div class="p-3 bg-gray-50 rounded-lg">
                    <p class="text-sm">订单号: <span class="font-mono font-medium">@{{ selectedOrder.order_number }}</span></p>
                    <p class="text-sm">客户: @{{ selectedOrder.customer_name }}</p>
                    <p class="text-sm">总额: ¥@{{ selectedOrder.total_amount }}</p>
                    <p class="text-sm">已付: ¥@{{ getPaidAmount(selectedOrder) }}</p>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">退款类型</label>
                    <select v-model="refundForm.type" class="w-full border rounded-lg px-3 py-2">
                        <option value="full">全额退款</option>
                        <option value="partial">部分退款</option>
                        <option value="deposit">退定金</option>
                    </select>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">退款金额</label>
                    <input v-model.number="refundForm.amount" type="number" step="0.01" min="0"
                           class="w-full border rounded-lg px-3 py-2">
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">退款方式</label>
                    <select v-model="refundForm.method" class="w-full border rounded-lg px-3 py-2">
                        <option value="cash">现金</option>
                        <option value="wechat">微信</option>
                        <option value="alipay">支付宝</option>
                        <option value="bank_transfer">银行转账</option>
                        <option value="other">其他</option>
                    </select>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">退款原因 *</label>
                    <textarea v-model="refundForm.reason" rows="2" required
                              class="w-full border rounded-lg px-3 py-2" placeholder="请填写退款原因"></textarea>
                </div>
            </div>
            <div class="flex justify-end mt-6 gap-3">
                <button @click="showRefundModal = false" class="px-4 py-2 border rounded-lg hover:bg-gray-50">
                    取消
                </button>
                <button @click="submitRefund" :disabled="!refundForm.amount || !refundForm.reason"
                        class="px-4 py-2 bg-red-500 text-white rounded-lg disabled:opacity-50 hover:bg-red-600">
                    确认退款
                </button>
            </div>
        </div>
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
            payment_status: '',
            pickup_date: '',
            search: ''
        });

        const showPaymentModal = ref(false);
        const showRefundModal = ref(false);
        const selectedOrder = ref(null);
        const paymentType = ref('deposit');
        const paymentForm = reactive({
            amount: 0,
            method: 'cash',
            transaction_id: ''
        });
        const refundForm = reactive({
            type: 'full',
            amount: 0,
            method: 'cash',
            reason: ''
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
                if (filters.payment_status) url += `&payment_status=${filters.payment_status}`;
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

        const getPaidAmount = (order) => {
            let totalPaid = 0;
            if (order.payments && order.payments.length > 0) {
                totalPaid = order.payments
                    .filter(p => p.status === 'completed')
                    .reduce((sum, p) => sum + parseFloat(p.amount), 0);
            }
            let totalRefunded = 0;
            if (order.refunds && order.refunds.length > 0) {
                totalRefunded = order.refunds
                    .filter(r => r.status === 'completed')
                    .reduce((sum, r) => sum + parseFloat(r.amount), 0);
            }
            return Math.max(0, totalPaid - totalRefunded);
        };

        const getRemainingAmount = (order) => {
            const paid = getPaidAmount(order);
            return Math.max(0, parseFloat(order.total_amount) - paid);
        };

        const hasDepositPaid = (order) => {
            if (!order.payments) return false;
            const depositPaid = order.payments
                .filter(p => p.type === 'deposit' && p.status === 'completed')
                .reduce((sum, p) => sum + parseFloat(p.amount), 0);
            return depositPaid >= parseFloat(order.deposit_amount);
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

        const openPayment = (order, type) => {
            selectedOrder.value = order;
            paymentType.value = type;
            const remaining = getRemainingAmount(order);
            if (type === 'deposit') {
                paymentForm.amount = parseFloat(order.deposit_amount);
            } else if (type === 'balance') {
                paymentForm.amount = remaining;
            } else {
                paymentForm.amount = remaining;
            }
            paymentForm.method = 'cash';
            paymentForm.transaction_id = '';
            showPaymentModal.value = true;
        };

        const submitPayment = async () => {
            if (!selectedOrder.value) return;
            try {
                await apiRequest('/payments', {
                    method: 'POST',
                    body: JSON.stringify({
                        order_id: selectedOrder.value.id,
                        amount: paymentForm.amount,
                        type: paymentType.value,
                        method: paymentForm.method,
                        transaction_id: paymentForm.transaction_id
                    })
                });
                showPaymentModal.value = false;
                loadOrders();
                alert('收款成功！');
            } catch (e) {
                alert(e.message);
            }
        };

        const openRefund = (order) => {
            selectedOrder.value = order;
            refundForm.type = 'full';
            refundForm.amount = getPaidAmount(order);
            refundForm.method = 'cash';
            refundForm.reason = '';
            showRefundModal.value = true;
        };

        const submitRefund = async () => {
            if (!selectedOrder.value) return;
            if (!confirm('确认退款？此操作不可撤销。')) return;
            try {
                await apiRequest('/refunds', {
                    method: 'POST',
                    body: JSON.stringify({
                        order_id: selectedOrder.value.id,
                        amount: refundForm.amount,
                        type: refundForm.type,
                        method: refundForm.method,
                        reason: refundForm.reason
                    })
                });
                showRefundModal.value = false;
                loadOrders();
                alert('退款成功！');
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
            showPaymentModal, showRefundModal, selectedOrder, paymentType, paymentForm, refundForm,
            loadOrders, getStatusLabel, getPaymentLabel, getPaidAmount, getRemainingAmount, hasDepositPaid,
            confirmOrder, openPayment, submitPayment, openRefund, submitRefund,
            startProduction, markReady, pickup, cancelOrder,
            prevPage, nextPage, logout
        };
    }
}).mount('#ordersApp');
</script>
@endsection
