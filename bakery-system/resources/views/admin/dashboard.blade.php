@extends('layouts.admin')

@section('title', '仪表盘')

@section('content')
<div id="dashboardApp" v-cloak>
    <div class="flex h-screen">
        <aside class="w-64 bg-white shadow-md flex-shrink-0">
            <div class="p-6 border-b">
                <h1 class="text-xl font-bold text-primary">🧁 烘焙店管理</h1>
            </div>
            <nav class="p-4">
                <ul class="space-y-1">
                    <li>
                        <a href="/admin" class="flex items-center px-4 py-2 rounded-lg bg-primary/10 text-primary font-medium">
                            <span class="mr-3">📊</span> 仪表盘
                        </a>
                    </li>
                    <li>
                        <a href="/admin/orders" class="flex items-center px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100">
                            <span class="mr-3">📋</span> 订单管理
                        </a>
                    </li>
                    <li>
                        <a href="/admin/production" class="flex items-center px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100">
                            <span class="mr-3">👨‍🍳</span> 生产看板
                        </a>
                    </li>
                    <li>
                        <a href="/admin/inventory" class="flex items-center px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100">
                            <span class="mr-3">📦</span> 库存管理
                        </a>
                    </li>
                    <li>
                        <a href="/admin/pickup-slots" class="flex items-center px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100">
                            <span class="mr-3">⏰</span> 取货时段
                        </a>
                    </li>
                </ul>
            </nav>
            <div class="absolute bottom-0 left-0 right-0 p-4 border-t">
                <div class="flex items-center mb-4">
                    <div class="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-primary mr-3">
                        @{{ user?.name?.charAt(0) || 'U' }}
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="font-medium text-sm truncate">@{{ user?.name }}</p>
                        <p class="text-xs text-gray-500">@{{ user?.user_type === 'admin' ? '管理员' : '店员' }}</p>
                    </div>
                </div>
                <button @click="logout" class="w-full py-2 text-sm text-gray-600 hover:text-red-500 border rounded-lg hover:border-red-200">
                    退出登录
                </button>
            </div>
        </aside>

        <main class="flex-1 overflow-auto">
            <div class="p-8">
                <div class="mb-8">
                    <h1 class="text-2xl font-bold text-gray-800">仪表盘</h1>
                    <p class="text-gray-500">@{{ formatDate(new Date().toISOString()) }} · 欢迎回来，@{{ user?.name }}</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div class="bg-white rounded-xl shadow-sm p-6">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-gray-500 text-sm">今日订单</p>
                                <p class="text-3xl font-bold text-gray-800 mt-1">@{{ stats.summary?.total_orders || 0 }}</p>
                            </div>
                            <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
                                📋
                            </div>
                        </div>
                    </div>
                    <div class="bg-white rounded-xl shadow-sm p-6">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-gray-500 text-sm">总收入</p>
                                <p class="text-3xl font-bold text-gray-800 mt-1">¥@{{ stats.summary?.total_revenue || 0 }}</p>
                            </div>
                            <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl">
                                💰
                            </div>
                        </div>
                    </div>
                    <div class="bg-white rounded-xl shadow-sm p-6">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-gray-500 text-sm">生产中</p>
                                <p class="text-3xl font-bold text-gray-800 mt-1">@{{ stats.summary?.in_production || 0 }}</p>
                            </div>
                            <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-2xl">
                                👨‍🍳
                            </div>
                        </div>
                    </div>
                    <div class="bg-white rounded-xl shadow-sm p-6">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-gray-500 text-sm">待取货</p>
                                <p class="text-3xl font-bold text-gray-800 mt-1">@{{ stats.summary?.ready_pickup || 0 }}</p>
                            </div>
                            <div class="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-2xl">
                                🎁
                            </div>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <div class="bg-white rounded-xl shadow-sm p-6">
                        <h2 class="text-lg font-semibold mb-4">库存预警</h2>
                        <div v-if="inventoryAlerts.alerts_count === 0" class="text-center py-8 text-gray-500">
                            <div class="text-4xl mb-2">✅</div>
                            <p>库存状态良好</p>
                        </div>
                        <div v-else class="space-y-3">
                            <div v-if="inventoryAlerts.low_stock?.length > 0" class="p-3 bg-red-50 rounded-lg border border-red-100">
                                <p class="text-red-700 font-medium mb-2">⚠️ 库存不足 (@{{ inventoryAlerts.low_stock.length }})</p>
                                <div class="flex flex-wrap gap-2">
                                    <span v-for="item in inventoryAlerts.low_stock" :key="item.id"
                                          class="px-2 py-1 bg-white rounded text-sm">
                                        @{{ item.name }}
                                    </span>
                                </div>
                            </div>
                            <div v-if="inventoryAlerts.expiring_soon?.length > 0" class="p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                                <p class="text-yellow-700 font-medium mb-2">⏰ 临期原料 (@{{ inventoryAlerts.expiring_soon.length }})</p>
                                <div class="space-y-1">
                                    <div v-for="item in inventoryAlerts.expiring_soon" :key="item.id"
                                         class="flex justify-between text-sm">
                                        <span>@{{ item.ingredient?.name }}</span>
                                        <span class="text-yellow-600">@{{ formatDate(item.expiry_date) }} 到期</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white rounded-xl shadow-sm p-6">
                        <h2 class="text-lg font-semibold mb-4">即将取货</h2>
                        <div v-if="stats.upcoming_pickups?.length === 0" class="text-center py-8 text-gray-500">
                            <p>暂无待取货订单</p>
                        </div>
                        <div v-else class="space-y-3">
                            <div v-for="order in stats.upcoming_pickups" :key="order.id"
                                 class="p-3 border rounded-lg hover:bg-gray-50">
                                <div class="flex justify-between items-start mb-2">
                                    <div>
                                        <p class="font-medium">@{{ order.order_number }}</p>
                                        <p class="text-sm text-gray-500">@{{ order.customer_name }}</p>
                                    </div>
                                    <span :class="['status-badge', 'status-' + order.status]">
                                        @{{ order.status === 'ready' ? '待取货' : '生产中' }}
                                    </span>
                                </div>
                                <p class="text-sm text-gray-500">
                                    ⏰ @{{ order.pickup_slot?.date }} @{{ order.pickup_slot?.start_time?.substring(0,5) }}
                                </p>
                                <p class="text-xs text-gray-400 mt-1">
                                    @{{ order.items?.map(i => i.product?.name + 'x' + i.quantity).join(', ') }}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="bg-white rounded-xl shadow-sm p-6">
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-lg font-semibold">今日取货时段</h2>
                    </div>
                    <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        <div v-for="slot in stats.today_pickup_slots" :key="slot.id"
                             class="p-3 border rounded-lg text-center"
                             :class="slot.is_full ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'">
                            <p class="font-semibold">@{{ slot.start_time?.substring(0,5) }}</p>
                            <p class="text-xs text-gray-500">@{{ slot.orders_count || 0 }}/@{{ slot.max_orders }} 单</p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </div>
</div>
@endsection

@section('scripts')
<script>
const { createApp, ref, onMounted } = Vue;

createApp({
    setup() {
        const user = ref(null);
        const stats = ref({});
        const inventoryAlerts = ref({});

        const loadUser = async () => {
            if (!store.isAuthenticated()) {
                window.location.href = '/login';
                return;
            }
            try {
                const data = await apiRequest('/auth/me');
                user.value = data.user;

                if (data.user.user_type === 'customer') {
                    window.location.href = '/';
                }
            } catch (e) {
                console.error(e);
            }
        };

        const loadStats = async () => {
            try {
                stats.value = await apiRequest('/dashboard/stats');
            } catch (e) {
                console.error('加载统计失败:', e);
            }
        };

        const loadInventoryAlerts = async () => {
            try {
                inventoryAlerts.value = await apiRequest('/dashboard/inventory-alerts');
            } catch (e) {
                console.error('加载库存预警失败:', e);
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
            loadStats();
            loadInventoryAlerts();
        });

        return { user, stats, inventoryAlerts, logout, formatDate };
    }
}).mount('#dashboardApp');
</script>
@endsection
