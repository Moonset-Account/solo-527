@extends('layouts.app')

@section('title', '甜蜜时光烘焙 - 首页')

@section('content')
<div id="app" v-cloak>
    <nav class="bg-white shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">
                <div class="flex items-center">
                    <span class="text-2xl font-bold text-primary">🧁 甜蜜时光烘焙</span>
                </div>
                <div class="flex items-center space-x-4">
                    <a href="{{ route('order') }}" class="text-gray-700 hover:text-primary">在线预订</a>
                    <a href="{{ route('login') }}" class="text-gray-700 hover:text-primary">员工登录</a>
                </div>
            </div>
        </div>
    </nav>

    <div class="relative bg-gradient-to-r from-amber-50 to-orange-50 py-20">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 class="text-5xl font-bold text-gray-800 mb-6">新鲜现做，甜蜜每一天</h1>
            <p class="text-xl text-gray-600 mb-8">精选优质原料，用心烘焙每一份幸福</p>
            <a href="{{ route('order') }}" class="inline-block bg-primary hover:bg-secondary text-white font-bold py-4 px-8 rounded-full text-lg transition-colors">
                立即预订蛋糕
            </a>
        </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 class="text-3xl font-bold text-center mb-12 text-gray-800">热销产品</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div v-for="product in products" :key="product.id" class="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div class="h-48 bg-gradient-to-br from-amber-200 to-orange-300 flex items-center justify-center text-6xl">
                    🎂
                </div>
                <div class="p-6">
                    <h3 class="text-xl font-semibold mb-2">@{{ product.name }}</h3>
                    <p class="text-gray-600 mb-2">@{{ product.flavor }} / @{{ product.size }}</p>
                    <p class="text-sm text-gray-500 mb-4">@{{ product.description }}</p>
                    <div class="flex justify-between items-center">
                        <span class="text-2xl font-bold text-primary">¥@{{ product.price }}</span>
                        <span class="text-sm text-gray-500">定金: ¥@{{ product.deposit }}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="bg-gray-800 text-white py-12">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
                <div>
                    <div class="text-4xl mb-2">🍰</div>
                    <h3 class="text-lg font-semibold mb-2">新鲜现做</h3>
                    <p class="text-gray-400">每日新鲜烘焙，绝不使用预制品</p>
                </div>
                <div>
                    <div class="text-4xl mb-2">🥇</div>
                    <h3 class="text-lg font-semibold mb-2">品质保证</h3>
                    <p class="text-gray-400">精选进口原料，层层品质把控</p>
                </div>
                <div>
                    <div class="text-4xl mb-2">🚚</div>
                    <h3 class="text-lg font-semibold mb-2">到店自取</h3>
                    <p class="text-gray-400">预约时段，到店即取</p>
                </div>
                <div>
                    <div class="text-4xl mb-2">💝</div>
                    <h3 class="text-lg font-semibold mb-2">个性定制</h3>
                    <p class="text-gray-400">支持定制图案和祝福语</p>
                </div>
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
        const products = ref([]);

        const loadProducts = async () => {
            try {
                const data = await apiRequest('/products?is_active=1&per_page=6');
                products.value = data.data || data;
            } catch (e) {
                console.error('加载产品失败:', e);
            }
        };

        onMounted(() => {
            loadProducts();
        });

        return { products };
    }
}).mount('#app');
</script>
@endsection
