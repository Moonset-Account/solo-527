<aside class="w-64 bg-white shadow-md flex-shrink-0">
    <div class="p-6 border-b">
        <h1 class="text-xl font-bold text-primary">🧁 烘焙店管理</h1>
    </div>
    <nav class="p-4">
        <ul class="space-y-1">
            <li>
                <a href="/admin" class="flex items-center px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100">
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
