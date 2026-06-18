<script setup>
import { ref, computed } from 'vue'
import { Link, usePage } from '@inertiajs/vue3'
import {
    HomeIcon,
    ChartBarIcon,
    ShoppingCartIcon,
    ClipboardListIcon,
    TruckIcon,
    ReceiptRefundIcon,
    WrenchIcon,
    Cog6ToothIcon,
    BellIcon,
    UserCircleIcon,
    ArrowRightOnRectangleIcon,
    Bars3Icon,
    XMarkIcon,
} from '@heroicons/vue/24/outline'

const page = usePage()
const sidebarOpen = ref(true)
const userMenuOpen = ref(false)

const user = computed(() => page.props.auth?.user)

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: '环境监控', href: '/environment', icon: ChartBarIcon },
    { name: '订单管理', href: '/orders', icon: ShoppingCartIcon },
    { name: '分拣管理', href: '/sorting', icon: ClipboardListIcon },
    { name: '发货管理', href: '/shipping', icon: TruckIcon },
    { name: '补贴凭证', href: '/subsidies', icon: ReceiptRefundIcon },
    { name: '农机预约', href: '/machinery', icon: WrenchIcon },
    { name: '系统设置', href: '/settings', icon: Cog6ToothIcon },
]

const isActive = (href) => {
    return page.url === href || page.url.startsWith(href + '/')
}

const toggleSidebar = () => {
    sidebarOpen.value = !sidebarOpen.value
}

const toggleUserMenu = () => {
    userMenuOpen.value = !userMenuOpen.value
}

const logout = () => {
    window.location.href = route('logout')
}
</script>

<template>
    <div class="min-h-screen bg-gray-50 flex">
        <aside
            :class="[
                'fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static',
                sidebarOpen ? 'translate-x-0' : '-translate-x-full',
            ]"
        >
            <div class="flex items-center justify-between h-16 px-6 border-b border-gray-200">
                <Link href="/dashboard" class="text-xl font-bold text-primary">
                    农事溯源台
                </Link>
                <button
                    @click="toggleSidebar"
                    class="lg:hidden p-1 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                >
                    <XMarkIcon class="w-5 h-5" />
                </button>
            </div>
            <nav class="p-4 space-y-1">
                <Link
                    v-for="item in navigation"
                    :key="item.name"
                    :href="item.href"
                    :class="[
                        'flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
                        isActive(item.href)
                            ? 'bg-primary/10 text-primary'
                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
                    ]"
                >
                    <component :is="item.icon" class="w-5 h-5 mr-3 flex-shrink-0" />
                    {{ item.name }}
                </Link>
            </nav>
        </aside>

        <div
            v-if="sidebarOpen"
            class="fixed inset-0 bg-black/50 z-20 lg:hidden"
            @click="toggleSidebar"
        ></div>

        <div class="flex-1 flex flex-col min-w-0">
            <header class="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-10">
                <div class="flex items-center">
                    <button
                        @click="toggleSidebar"
                        class="lg:hidden p-2 -ml-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 mr-2"
                    >
                        <Bars3Icon class="w-5 h-5" />
                    </button>
                    <h1 class="text-lg font-semibold text-gray-900">
                        {{ page.props.title || 'Dashboard' }}
                    </h1>
                </div>

                <div class="flex items-center space-x-3">
                    <button class="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
                        <BellIcon class="w-5 h-5" />
                        <span class="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full"></span>
                    </button>

                    <div class="relative">
                        <button
                            @click="toggleUserMenu"
                            class="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-gray-100"
                        >
                            <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <UserCircleIcon class="w-6 h-6 text-primary" />
                            </div>
                            <div class="hidden md:block text-left">
                                <p class="text-sm font-medium text-gray-900">
                                    {{ user?.name || '管理员' }}
                                </p>
                                <p class="text-xs text-gray-500">
                                    {{ user?.email || 'admin@example.com' }}
                                </p>
                            </div>
                        </button>

                        <div
                            v-if="userMenuOpen"
                            class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1"
                        >
                            <button
                                @click="logout"
                                class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                                <ArrowRightOnRectangleIcon class="w-4 h-4 mr-2" />
                                退出登录
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main class="flex-1 p-4 lg:p-6">
                <slot />
            </main>
        </div>
    </div>
</template>
