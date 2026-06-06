@extends('layouts.app')

@section('title', '在线预订 - 甜蜜时光烘焙')

@section('content')
<div id="orderApp" v-cloak>
    <nav class="bg-white shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">
                <a href="{{ route('home') }}" class="flex items-center">
                    <span class="text-2xl font-bold text-primary">🧁 甜蜜时光烘焙</span>
                </a>
                <div class="flex items-center space-x-4">
                    <a href="{{ route('home') }}" class="text-gray-700 hover:text-primary">首页</a>
                </div>
            </div>
        </div>
    </nav>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div v-if="step === 1" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div class="lg:col-span-2">
                <h1 class="text-3xl font-bold mb-6 text-gray-800">选择蛋糕</h1>

                <div class="mb-6 flex flex-wrap gap-4">
                    <select v-model="filterFlavor" class="border rounded-lg px-4 py-2">
                        <option value="">所有口味</option>
                        <option v-for="flavor in flavors" :key="flavor" :value="flavor">@{{ flavor }}</option>
                    </select>
                    <select v-model="filterSize" class="border rounded-lg px-4 py-2">
                        <option value="">所有尺寸</option>
                        <option v-for="size in sizes" :key="size" :value="size">@{{ size }}</option>
                    </select>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div v-for="product in filteredProducts" :key="product.id"
                         class="bg-white rounded-xl shadow-sm border p-4 cursor-pointer transition-all"
                         :class="{ 'border-primary ring-2 ring-primary/20': isSelected(product) }"
                         @click="toggleProduct(product)">
                        <div class="h-32 bg-gradient-to-br from-amber-100 to-orange-200 rounded-lg flex items-center justify-center text-4xl mb-3">
                            🎂
                        </div>
                        <h3 class="font-semibold text-lg">@{{ product.name }}</h3>
                        <p class="text-sm text-gray-500 mb-2">@{{ product.flavor }} / @{{ product.size }}</p>
                        <p class="text-sm text-gray-600 mb-3 line-clamp-2">@{{ product.description }}</p>
                        <div class="flex justify-between items-center">
                            <span class="text-xl font-bold text-primary">¥@{{ product.price }}</span>
                            <div v-if="isSelected(product)" class="flex items-center gap-2">
                                <button @click.stop="decreaseQuantity(product)" class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">-</button>
                                <span class="w-8 text-center">@{{ getQuantity(product) }}</span>
                                <button @click.stop="increaseQuantity(product)" class="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center">+</button>
                            </div>
                            <button v-else @click.stop="toggleProduct(product)" class="px-4 py-1 bg-primary text-white rounded-full text-sm">
                                选择
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="lg:col-span-1">
                <div class="bg-white rounded-xl shadow-sm border p-6 sticky top-8">
                    <h2 class="text-xl font-bold mb-4">购物车</h2>
                    <div v-if="cart.length === 0" class="text-center py-8 text-gray-500">
                        <div class="text-4xl mb-2">🛒</div>
                        <p>还没有选择商品</p>
                    </div>
                    <div v-else class="space-y-4">
                        <div v-for="item in cart" :key="item.id" class="flex justify-between items-center border-b pb-3">
                            <div>
                                <p class="font-medium">@{{ item.name }}</p>
                                <p class="text-sm text-gray-500">@{{ item.size }} / x@{{ item.quantity }}</p>
                            </div>
                            <div class="text-right">
                                <p class="font-semibold">¥@{{ item.subtotal }}</p>
                                <button @click="removeFromCart(item.id)" class="text-xs text-red-500">删除</button>
                            </div>
                        </div>

                        <div class="pt-4 border-t">
                            <div class="flex justify-between mb-2">
                                <span>商品总价</span>
                                <span>¥@{{ totalAmount }}</span>
                            </div>
                            <div class="flex justify-between mb-2">
                                <span>预付定金</span>
                                <span class="text-primary">¥@{{ totalDeposit }}</span>
                            </div>
                            <div class="flex justify-between font-bold text-lg pt-2 border-t">
                                <span>应付定金</span>
                                <span class="text-primary">¥@{{ totalDeposit }}</span>
                            </div>
                        </div>

                        <button @click="goToStep2" :disabled="cart.length === 0"
                                class="w-full py-3 bg-primary text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary transition-colors">
                            下一步: 选择取货时间
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="step === 2" class="max-w-3xl mx-auto">
            <button @click="step = 1" class="mb-4 text-primary hover:underline">← 返回选择商品</button>
            <h1 class="text-3xl font-bold mb-6 text-gray-800">选择取货时间</h1>

            <div class="bg-white rounded-xl shadow-sm border p-6 mb-6">
                <h3 class="font-semibold mb-4">选择日期</h3>
                <div class="flex gap-2 overflow-x-auto pb-2">
                    <button v-for="date in availableDates" :key="date.date"
                            @click="selectedDate = date.date"
                            class="flex-shrink-0 px-4 py-3 rounded-lg border text-center transition-colors"
                            :class="selectedDate === date.date ? 'bg-primary text-white border-primary' : 'hover:border-primary'">
                        <div class="text-sm">@{{ date.weekday }}</div>
                        <div class="font-bold">@{{ date.day }}</div>
                    </button>
                </div>
            </div>

            <div v-if="selectedDate" class="bg-white rounded-xl shadow-sm border p-6 mb-6">
                <h3 class="font-semibold mb-4">选择时段</h3>
                <div v-if="slots.length === 0" class="text-center py-8 text-gray-500">
                    该日期暂无可预约时段
                </div>
                <div v-else class="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <button v-for="slot in slots" :key="slot.id"
                            @click="selectedSlot = slot"
                            :disabled="slot.is_full"
                            class="p-3 rounded-lg border text-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            :class="selectedSlot?.id === slot.id ? 'bg-primary text-white border-primary' : 'hover:border-primary'">
                        <div class="font-semibold">@{{ slot.start_time.substring(0,5) }} - @{{ slot.end_time.substring(0,5) }}</div>
                        <div class="text-xs mt-1" :class="slot.is_full ? 'text-red-500' : ''">
                            @{{ slot.is_full ? '已满' : `剩余 ${slot.available_slots} 位` }}
                        </div>
                    </button>
                </div>
            </div>

            <div class="bg-white rounded-xl shadow-sm border p-6">
                <h3 class="font-semibold mb-4">填写信息</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">姓名 *</label>
                        <input v-model="customerInfo.name" type="text" class="w-full border rounded-lg px-4 py-2" placeholder="请输入姓名">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">手机号 *</label>
                        <input v-model="customerInfo.phone" type="tel" class="w-full border rounded-lg px-4 py-2" placeholder="请输入手机号">
                    </div>
                    <div class="md:col-span-2">
                        <label class="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
                        <input v-model="customerInfo.email" type="email" class="w-full border rounded-lg px-4 py-2" placeholder="选填，用于接收订单通知">
                    </div>
                    <div class="md:col-span-2">
                        <label class="block text-sm font-medium text-gray-700 mb-1">特殊要求</label>
                        <textarea v-model="customerInfo.notes" rows="3" class="w-full border rounded-lg px-4 py-2" placeholder="如：生日祝福语、特殊装饰等"></textarea>
                    </div>
                </div>

                <div class="flex justify-between items-center pt-4 border-t">
                    <div>
                        <p class="text-sm text-gray-500">订单定金: <span class="text-primary font-bold text-lg">¥@{{ totalDeposit }}</span></p>
                    </div>
                    <div class="flex gap-3">
                        <button @click="step = 1" class="px-6 py-2 border rounded-lg hover:bg-gray-50">
                            上一步
                        </button>
                        <button @click="submitOrder" :disabled="!canSubmit"
                                class="px-6 py-2 bg-primary text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary transition-colors">
                            提交订单
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="step === 3" class="max-w-xl mx-auto text-center py-16">
            <div class="text-6xl mb-6">🎉</div>
            <h1 class="text-3xl font-bold mb-4 text-gray-800">订单提交成功！</h1>
            <p class="text-gray-600 mb-2">订单号: <span class="font-mono font-bold">@{{ orderResult.order_number }}</span></p>
            <p class="text-gray-600 mb-6">我们会尽快确认您的订单，请保持手机畅通</p>

            <div class="bg-white rounded-xl shadow-sm border p-6 mb-6 text-left">
                <h3 class="font-semibold mb-4">订单详情</h3>
                <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                        <span class="text-gray-500">取货时间</span>
                        <span>@{{ orderResult.pickup_slot?.date }} @{{ orderResult.pickup_slot?.start_time?.substring(0,5) }}-@{{ orderResult.pickup_slot?.end_time?.substring(0,5) }}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-500">订单总额</span>
                        <span>¥@{{ orderResult.total_amount }}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-500">已付定金</span>
                        <span class="text-primary">¥@{{ orderResult.deposit_amount }}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-500">待付尾款</span>
                        <span>¥@{{ orderResult.balance_amount }}</span>
                    </div>
                </div>
            </div>

            <div class="flex gap-4 justify-center">
                <a href="{{ route('home') }}" class="px-6 py-3 border rounded-lg hover:bg-gray-50">
                    返回首页
                </a>
                <a href="{{ route('order') }}" class="px-6 py-3 bg-primary text-white rounded-lg hover:bg-secondary transition-colors">
                    继续预订
                </a>
            </div>
        </div>
    </div>
</div>
@endsection

@section('scripts')
<script>
const { createApp, ref, computed, onMounted } = Vue;

createApp({
    setup() {
        const step = ref(1);
        const products = ref([]);
        const flavors = ref([]);
        const sizes = ref([]);
        const cart = ref([]);
        const filterFlavor = ref('');
        const filterSize = ref('');
        const selectedDate = ref('');
        const selectedSlot = ref(null);
        const slots = ref([]);
        const customerInfo = ref({
            name: '',
            phone: '',
            email: '',
            notes: ''
        });
        const orderResult = ref({});

        const availableDates = computed(() => {
            const dates = [];
            for (let i = 1; i <= 14; i++) {
                const d = new Date();
                d.setDate(d.getDate() + i);
                dates.push({
                    date: d.toISOString().split('T')[0],
                    weekday: ['周日','周一','周二','周三','周四','周五','周六'][d.getDay()],
                    day: `${d.getMonth()+1}/${d.getDate()}`
                });
            }
            return dates;
        });

        const filteredProducts = computed(() => {
            return products.value.filter(p => {
                if (filterFlavor.value && p.flavor !== filterFlavor.value) return false;
                if (filterSize.value && p.size !== filterSize.value) return false;
                return true;
            });
        });

        const totalAmount = computed(() => {
            return cart.value.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2);
        });

        const totalDeposit = computed(() => {
            return cart.value.reduce((sum, item) => sum + (item.deposit * item.quantity), 0).toFixed(2);
        });

        const canSubmit = computed(() => {
            return selectedSlot.value &&
                   customerInfo.value.name &&
                   customerInfo.value.phone &&
                   cart.value.length > 0;
        });

        const isSelected = (product) => {
            return cart.value.some(item => item.id === product.id);
        };

        const getQuantity = (product) => {
            const item = cart.value.find(item => item.id === product.id);
            return item ? item.quantity : 0;
        };

        const toggleProduct = (product) => {
            const existing = cart.value.find(item => item.id === product.id);
            if (existing) {
                existing.quantity++;
                existing.subtotal = (product.price * existing.quantity).toFixed(2);
            } else {
                cart.value.push({
                    id: product.id,
                    name: product.name,
                    size: product.size,
                    price: product.price,
                    deposit: product.deposit,
                    quantity: 1,
                    subtotal: product.price.toFixed(2)
                });
            }
        };

        const increaseQuantity = (product) => {
            const item = cart.value.find(item => item.id === product.id);
            if (item) {
                item.quantity++;
                item.subtotal = (product.price * item.quantity).toFixed(2);
            }
        };

        const decreaseQuantity = (product) => {
            const item = cart.value.find(item => item.id === product.id);
            if (item) {
                if (item.quantity > 1) {
                    item.quantity--;
                    item.subtotal = (product.price * item.quantity).toFixed(2);
                } else {
                    removeFromCart(product.id);
                }
            }
        };

        const removeFromCart = (productId) => {
            cart.value = cart.value.filter(item => item.id !== productId);
        };

        const goToStep2 = () => {
            if (cart.value.length > 0) {
                step.value = 2;
                selectedDate.value = availableDates.value[0]?.date;
            }
        };

        const loadSlots = async () => {
            if (!selectedDate.value) return;
            try {
                const data = await apiRequest(`/pickup-slots?date=${selectedDate.value}&available=1`);
                slots.value = (data.data || data).map(slot => ({
                    ...slot,
                    is_full: slot.current_orders >= slot.max_orders,
                    available_slots: slot.max_orders - slot.current_orders
                }));
            } catch (e) {
                console.error('加载时段失败:', e);
            }
        };

        const submitOrder = async () => {
            if (!canSubmit.value) return;

            try {
                const orderData = {
                    pickup_slot_id: selectedSlot.value.id,
                    customer_name: customerInfo.value.name,
                    customer_phone: customerInfo.value.phone,
                    customer_email: customerInfo.value.email,
                    special_notes: customerInfo.value.notes,
                    items: cart.value.map(item => ({
                        product_id: item.id,
                        quantity: item.quantity
                    }))
                };

                const result = await apiRequest('/orders', {
                    method: 'POST',
                    body: JSON.stringify(orderData)
                });

                orderResult.value = result.order;
                step.value = 3;
            } catch (e) {
                alert(e.message || '提交失败，请重试');
            }
        };

        const loadProducts = async () => {
            try {
                const data = await apiRequest('/products?is_active=1');
                products.value = data.data || data;

                const flavorData = await apiRequest('/product/flavors');
                flavors.value = flavorData;

                const sizeData = await apiRequest('/product/sizes');
                sizes.value = sizeData;
            } catch (e) {
                console.error('加载产品失败:', e);
            }
        };

        onMounted(() => {
            loadProducts();
        });

        const unwatch = selectedDate;
        const watchSelectedDate = () => {
            if (selectedDate.value) {
                loadSlots();
            }
        };

        return {
            step,
            products,
            flavors,
            sizes,
            cart,
            filterFlavor,
            filterSize,
            filteredProducts,
            isSelected,
            getQuantity,
            toggleProduct,
            increaseQuantity,
            decreaseQuantity,
            removeFromCart,
            totalAmount,
            totalDeposit,
            goToStep2,
            availableDates,
            selectedDate,
            selectedSlot,
            slots,
            customerInfo,
            canSubmit,
            submitOrder,
            orderResult,
            watchSelectedDate
        };
    },
    watch: {
        selectedDate() {
            this.watchSelectedDate();
        }
    }
}).mount('#orderApp');
</script>
@endsection
