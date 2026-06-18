<script setup>
import { computed, onMounted, ref } from 'vue'
import { Link, router } from '@inertiajs/vue3'

const props = defineProps({
    title: String,
})

const showNotifications = ref(false)
const showUserMenu = ref(false)
const notifications = ref([])
const unreadCount = ref(0)

const isAdmin = computed(() => {
    return window.page?.props?.auth?.user?.role === 'admin' ||
           window.page?.props?.auth?.user?.role === 'manager'
})

const currentUser = computed(() => {
    return window.page?.props?.auth?.user
})

const navItems = computed(() => {
    const items = [
        { href: route('dashboard'), label: '仪表盘', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
        { href: route('alerts.index'), label: '告警管理', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
        { href: route('duty.index'), label: '值班安排', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    ]

    if (isAdmin.value) {
        items.push(
            { href: route('escalation.index'), label: '升级规则', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
            { href: route('account-applications.index'), label: '账号申请', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
            { href: route('change-windows.index'), label: '变更窗口', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
            { href: route('operation-logs.index'), label: '操作日志', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
        )
    }

    return items
})

const fetchNotifications = async () => {
    try {
        const response = await axios.get(route('api.notifications.latest'))
        notifications.value = response.data
        unreadCount.value = response.data.filter(n => !n.read_at).length
    } catch (e) {
        // ignore
    }
}

const markAllRead = () => {
    axios.post(route('notifications.mark-all-read')).then(() => {
        unreadCount.value = 0
        notifications.value.forEach(n => n.read_at = new Date().toISOString())
    })
    showNotifications.value = false
}

const logout = () => {
    router.post(route('logout'))
}

onMounted(() => {
    fetchNotifications()
    setInterval(fetchNotifications, 30000)
})
</script>

<template>
    <div class="min-h-screen bg-gray-100">
        <nav class="bg-white border-b border-gray-200">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between h-16">
                    <div class="flex">
                        <div class="flex-shrink-0 flex items-center">
                            <span class="text-xl font-bold text-blue-600">告警值班系统</span>
                        </div>
                        <div class="hidden sm:ml-6 sm:flex sm:space-x-1">
                            <Link
                                v-for="item in navItems"
                                :key="item.href"
                                :href="item.href"
                                class="inline-flex items-center px-3 pt-1 border-b-2 text-sm font-medium transition-colors"
                                :class="route().current(route().current(item.href?.toString().split('/').pop()?.toString())) ? 'border-blue-500 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
                            >
                                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.icon" />
                                </svg>
                                {{ item.label }}
                            </Link>
                        </div>
                    </div>
                    <div class="flex items-center space-x-4">
                        <div class="relative">
                            <button
                                @click="showNotifications = !showNotifications"
                                class="p-2 text-gray-400 hover:text-gray-600 focus:outline-none relative"
                            >
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                                <span v-if="unreadCount > 0" class="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
                                    {{ unreadCount > 99 ? '99+' : unreadCount }}
                                </span>
                            </button>
                            <div
                                v-if="showNotifications"
                                class="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg py-1 z-50 max-h-96 overflow-y-auto"
                            >
                                <div class="px-4 py-2 border-b border-gray-100 flex justify-between items-center">
                                    <span class="font-medium text-gray-700">通知</span>
                                    <button v-if="unreadCount > 0" @click="markAllRead" class="text-xs text-blue-600 hover:text-blue-800">
                                        全部已读
                                    </button>
                                </div>
                                <div v-if="notifications.length === 0" class="px-4 py-8 text-center text-gray-500">
                                    暂无通知
                                </div>
                                <div v-else>
                                    <div
                                        v-for="notification in notifications"
                                        :key="notification.id"
                                        class="px-4 py-3 hover:bg-gray-50 border-b border-gray-50"
                                        :class="notification.read_at ? 'opacity-60' : ''"
                                    >
                                        <div class="text-sm font-medium text-gray-900">{{ notification.title }}</div>
                                        <div class="text-xs text-gray-500 mt-1">{{ notification.message }}</div>
                                        <div class="text-xs text-gray-400 mt-1">{{ notification.created_at }}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="relative">
                            <button
                                @click="showUserMenu = !showUserMenu"
                                class="flex items-center space-x-2 text-gray-500 hover:text-gray-700 focus:outline-none"
                            >
                                <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                                    {{ currentUser?.name?.charAt(0)?.toUpperCase() }}
                                </div>
                                <span class="hidden md:block text-sm font-medium">{{ currentUser?.name }}</span>
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            <div
                                v-if="showUserMenu"
                                class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50"
                            >
                                <Link
                                    :href="route('profile')"
                                    class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                    个人设置
                                </Link>
                                <button
                                    v-if="isAdmin"
                                    @click="router.get(route('users.index'))"
                                    class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                    用户管理
                                </button>
                                <div class="border-t border-gray-100 my-1"></div>
                                <button
                                    @click="logout"
                                    class="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                >
                                    退出登录
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </nav>

        <main class="py-6">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div v-if="title" class="mb-6">
                    <h1 class="text-2xl font-bold text-gray-900">{{ title }}</h1>
                </div>
                <slot />
            </div>
        </main>
    </div>
</template>
