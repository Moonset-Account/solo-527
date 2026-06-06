@extends('layouts.admin')

@section('title', '库存管理')

@section('content')
<div id="inventoryApp" v-cloak>
    <div class="flex h-screen">
        @include('admin.partials.sidebar')

        <main class="flex-1 overflow-auto">
            <div class="p-8">
                <div class="flex justify-between items-center mb-8">
                    <div>
                        <h1 class="text-2xl font-bold text-gray-800">库存管理</h1>
                        <p class="text-gray-500">管理原料库存，追踪库存变动</p>
                    </div>
                    <button @click="showAddStock = true" class="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-secondary">
                        + 新增原料入库
                    </button>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div class="bg-white rounded-xl p-4 shadow-sm border-l-4 border-red-500">
                        <p class="text-gray-500 text-sm">库存不足</p>
                        <p class="text-2xl font-bold text-red-600">@{{ lowStockCount }}</p>
                    </div>
                    <div class="bg-white rounded-xl p-4 shadow-sm border-l-4 border-yellow-500">
                        <p class="text-gray-500 text-sm">即将过期</p>
                        <p class="text-2xl font-bold text-yellow-600">@{{ expiringCount }}</p>
                    </div>
                    <div class="bg-white rounded-xl p-4 shadow-sm border-l-4 border-green-500">
                        <p class="text-gray-500 text-sm">原料种类</p>
                        <p class="text-2xl font-bold text-green-600">@{{ totalIngredients }}</p>
                    </div>
                </div>

                <div class="bg-white rounded-xl shadow-sm p-4 mb-6">
                    <div class="flex gap-4">
                        <input v-model="search" type="text" placeholder="搜索原料名称..."
                               class="border rounded-lg px-3 py-2 text-sm flex-1 max-w-xs">
                        <select v-model="filterStock" class="border rounded-lg px-3 py-2 text-sm">
                            <option value="">全部库存</option>
                            <option value="low">库存不足</option>
                        </select>
                        <button @click="loadIngredients" class="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-secondary">
                            搜索
                        </button>
                    </div>
                </div>

                <div class="bg-white rounded-xl shadow-sm overflow-hidden">
                    <table class="w-full">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">原料名称</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">单位</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">当前库存</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">预警阈值</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">临期批次</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200">
                            <tr v-for="ingredient in ingredients" :key="ingredient.id" class="hover:bg-gray-50">
                                <td class="px-6 py-4">
                                    <p class="font-medium">@{{ ingredient.name }}</p>
                                    <p class="text-xs text-gray-500">单价: ¥@{{ ingredient.unit_price }}/@{{ ingredient.unit }}</p>
                                </td>
                                <td class="px-6 py-4">@{{ ingredient.unit }}</td>
                                <td class="px-6 py-4">
                                    <span class="font-semibold" :class="ingredient.is_low_stock ? 'text-red-600' : ''">
                                        @{{ ingredient.total_stock?.toFixed(2) || 0 }}
                                    </span>
                                </td>
                                <td class="px-6 py-4">@{{ ingredient.alert_threshold }}</td>
                                <td class="px-6 py-4">
                                    <span v-if="ingredient.is_low_stock" class="status-badge status-pending">
                                        库存不足
                                    </span>
                                    <span v-else class="status-badge status-ready">
                                        正常
                                    </span>
                                </td>
                                <td class="px-6 py-4">
                                    <div v-if="ingredient.expiring_soon_stocks?.length > 0" class="text-xs">
                                        <p v-for="stock in ingredient.expiring_soon_stocks.slice(0,2)" :key="stock.id"
                                           class="text-yellow-600">
                                            @{{ stock.quantity }}@{{ ingredient.unit }} @{{ formatDate(stock.expiry_date) }}到期
                                        </p>
                                        <p v-if="ingredient.expiring_soon_stocks.length > 2" class="text-gray-400">
                                            还有 @{{ ingredient.expiring_soon_stocks.length - 2 }} 批次
                                        </p>
                                    </div>
                                    <span v-else class="text-gray-400 text-sm">无</span>
                                </td>
                                <td class="px-6 py-4">
                                    <button @click="openAddStock(ingredient)"
                                            class="text-xs px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600">
                                        入库
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    </div>

    <div v-if="showAddStock" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="showAddStock = false">
        <div class="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 class="text-lg font-bold mb-4">新增原料入库</h3>
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">原料</label>
                    <select v-model="stockForm.ingredient_id" class="w-full border rounded-lg px-3 py-2">
                        <option value="">选择原料</option>
                        <option v-for="ing in ingredients" :key="ing.id" :value="ing.id">
                            @{{ ing.name }} (@{{ ing.unit }})
                        </option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">数量</label>
                    <input v-model.number="stockForm.quantity" type="number" step="0.01" min="0"
                           class="w-full border rounded-lg px-3 py-2">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">保质期</label>
                    <input v-model="stockForm.expiry_date" type="date" class="w-full border rounded-lg px-3 py-2">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">批号</label>
                    <input v-model="stockForm.batch_number" type="text" class="w-full border rounded-lg px-3 py-2" placeholder="选填">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">供应商</label>
                    <input v-model="stockForm.supplier" type="text" class="w-full border rounded-lg px-3 py-2" placeholder="选填">
                </div>
            </div>
            <div class="flex justify-end mt-6 gap-3">
                <button @click="showAddStock = false" class="px-4 py-2 border rounded-lg hover:bg-gray-50">
                    取消
                </button>
                <button @click="submitAddStock" :disabled="!stockForm.ingredient_id || !stockForm.quantity"
                        class="px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50 hover:bg-secondary">
                    确认入库
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
        const ingredients = ref([]);
        const search = ref('');
        const filterStock = ref('');
        const showAddStock = ref(false);
        const stockForm = reactive({
            ingredient_id: '',
            quantity: '',
            expiry_date: '',
            batch_number: '',
            supplier: ''
        });

        const lowStockCount = computed(() =>
            ingredients.value.filter(i => i.is_low_stock).length
        );
        const expiringCount = computed(() =>
            ingredients.value.reduce((sum, i) => sum + (i.expiring_soon_stocks?.length || 0), 0)
        );
        const totalIngredients = computed(() => ingredients.value.length);

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

        const loadIngredients = async () => {
            try {
                let url = '/ingredients?per_page=100';
                if (search.value) url += `&search=${search.value}`;
                if (filterStock.value === 'low') url += '&low_stock=1';

                const data = await apiRequest(url);
                ingredients.value = (data.data || data).map(ing => ({
                    ...ing,
                    total_stock: ing.stocks?.reduce((sum, s) => sum + parseFloat(s.quantity), 0) || 0,
                    is_low_stock: (ing.stocks?.reduce((sum, s) => sum + parseFloat(s.quantity), 0) || 0) <= ing.alert_threshold,
                    expiring_soon_stocks: ing.stocks?.filter(s => {
                        if (!s.expiry_date) return false;
                        const expiry = new Date(s.expiry_date);
                        const diffDays = Math.ceil((expiry - new Date()) / (1000 * 60 * 60 * 24));
                        return diffDays >= 0 && diffDays <= (ing.expiry_alert_days || 7);
                    }) || []
                }));
            } catch (e) {
                console.error('加载原料失败:', e);
            }
        };

        const openAddStock = (ingredient) => {
            stockForm.ingredient_id = ingredient.id;
            stockForm.quantity = '';
            stockForm.expiry_date = '';
            stockForm.batch_number = '';
            stockForm.supplier = '';
            showAddStock.value = true;
        };

        const submitAddStock = async () => {
            try {
                await apiRequest(`/ingredients/${stockForm.ingredient_id}/add-stock`, {
                    method: 'POST',
                    body: JSON.stringify({
                        quantity: stockForm.quantity,
                        expiry_date: stockForm.expiry_date || null,
                        batch_number: stockForm.batch_number,
                        supplier: stockForm.supplier
                    })
                });
                showAddStock.value = false;
                loadIngredients();
                alert('入库成功');
            } catch (e) {
                alert(e.message);
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
            loadIngredients();
        });

        return {
            user, ingredients, search, filterStock,
            lowStockCount, expiringCount, totalIngredients,
            showAddStock, stockForm,
            openAddStock, submitAddStock, loadIngredients,
            logout, formatDate
        };
    }
}).mount('#inventoryApp');
</script>
@endsection
