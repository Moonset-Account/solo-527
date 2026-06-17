<script setup>
import { ref, computed } from 'vue';
import { Head, Link, usePage, router } from '@inertiajs/vue3';

const props = defineProps({
    title: {
        type: String,
        default: '',
    },
});

const page = usePage();
const sidebarOpen = ref(true);
const mobileMenuOpen = ref(false);
const userMenuOpen = ref(false);

const user = computed(() => page.props.auth?.user || { name: '用户', email: 'user@example.com' });

const navigation = [
    {
        name: '仪表盘',
        href: route('dashboard'),
        icon: 'dashboard',
        current: route().current('dashboard'),
    },
    {
        name: '操作入口',
        isGroup: true,
        children: [
            {
                name: '上传对账单',
                href: route('statement.upload'),
                icon: 'upload',
                current: route().current('statement.upload'),
            },
            {
                name: '确认差异',
                href: route('difference.confirm'),
                icon: 'check',
                current: route().current('difference.confirm'),
            },
        ],
    },
    {
        name: '管理侧',
        isGroup: true,
        children: [
            {
                name: '差异分配',
                href: route('admin.difference.index'),
                icon: 'assign',
                current: route().current('admin.difference.index'),
            },
            {
                name: '冲销管理',
                href: route('admin.writeoff.index'),
                icon: 'writeoff',
                current: route().current('admin.writeoff.index'),
            },
        ],
    },
    {
        name: '报表',
        isGroup: true,
        children: [
            {
                name: '差异报表',
                href: route('report.difference'),
                icon: 'report',
                current: route().current('report.difference'),
            },
        ],
    },
    {
        name: '业务视角',
        isGroup: true,
        children: [
            {
                name: '统一业务视角',
                href: route('dashboard.business-overview'),
                icon: 'overview',
                current: route().current('dashboard.business-overview'),
            },
            {
                name: '复盘面板',
                href: route('dashboard.review'),
                icon: 'review',
                current: route().current('dashboard.review'),
            },
        ],
    },
];

const icons = {
    dashboard: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>`,
    upload: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>`,
    check: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
    assign: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>`,
    writeoff: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
    report: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>`,
    overview: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>`,
    review: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>`,
};

const toggleSidebar = () => {
    sidebarOpen.value = !sidebarOpen.value;
};

const logout = () => {
    router.post(route('logout'));
};

const isCurrent = (item) => {
    if (item.current) return true;
    if (item.children) {
        return item.children.some(child => child.current);
    }
    return false;
};
</script>

<template>
    <Head :title="title" />

    <div class="min-h-screen bg-gray-100">
        <nav class="bg-white border-b border-gray-200 fixed z-30 w-full">
            <div class="px-3 py-3 lg:px-5 lg:pl-3">
                <div class="flex items-center justify-between">
                    <div class="flex items-center justify-start">
                        <button
                            @click="toggleSidebar"
                            class="p-2 mr-2 text-gray-600 rounded-lg cursor-pointer hover:bg-gray-100 focus:bg-gray-100 focus:ring-2 focus:ring-primary-500"
                        >
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                            </svg>
                        </button>
                        <Link :href="route('dashboard')" class="flex items-center">
                            <div class="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center mr-3">
                                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <span class="self-center text-xl font-semibold sm:text-2xl whitespace-nowrap text-gray-900">
                                项目尾款对接中心
                            </span>
                        </Link>
                    </div>

                    <div class="flex items-center">
                        <div class="hidden md:block relative mr-3">
                            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="搜索项目、对账单..."
                                class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-80 pl-10 p-2.5"
                            />
                        </div>

                        <button
                            class="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg mr-2"
                        >
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                            </svg>
                            <span class="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                        </button>

                        <div class="relative">
                            <button
                                @click="userMenuOpen = !userMenuOpen"
                                class="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded-lg"
                            >
                                <div class="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-medium">
                                    {{ user.name.charAt(0) }}
                                </div>
                                <span class="hidden md:block text-sm font-medium text-gray-700">{{ user.name }}</span>
                                <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                                </svg>
                            </button>

                            <div
                                v-if="userMenuOpen"
                                class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50 border border-gray-200"
                            >
                                <div class="px-4 py-2 border-b border-gray-100">
                                    <p class="text-sm font-medium text-gray-900">{{ user.name }}</p>
                                    <p class="text-xs text-gray-500">{{ user.email }}</p>
                                </div>
                                <a
                                    href="#"
                                    class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                    个人设置
                                </a>
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

        <aside
            :class="[
                'fixed left-0 top-16 z-20 h-screen pt-8 transition-all duration-300 bg-white border-r border-gray-200',
                sidebarOpen ? 'w-64' : 'w-16',
            ]"
        >
            <div class="h-full px-3 pb-4 overflow-y-auto bg-white">
                <ul class="space-y-2">
                    <template v-for="(item, index) in navigation" :key="index">
                        <li v-if="item.isGroup" class="pt-2">
                            <span
                                v-if="sidebarOpen"
                                class="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider"
                            >
                                {{ item.name }}
                            </span>
                            <ul class="mt-2 space-y-1">
                                <li v-for="child in item.children" :key="child.name">
                                    <Link
                                        :href="child.href"
                                        :class="[
                                            'flex items-center p-2 rounded-lg transition-colors',
                                            child.current
                                                ? 'bg-primary-100 text-primary-700'
                                                : 'text-gray-600 hover:bg-gray-100',
                                        ]"
                                    >
                                        <span v-html="icons[child.icon]"></span>
                                        <span v-if="sidebarOpen" class="ml-3">{{ child.name }}</span>
                                    </Link>
                                </li>
                            </ul>
                        </li>
                        <li v-else>
                            <Link
                                :href="item.href"
                                :class="[
                                    'flex items-center p-2 rounded-lg transition-colors',
                                    item.current
                                        ? 'bg-primary-100 text-primary-700'
                                        : 'text-gray-600 hover:bg-gray-100',
                                ]"
                            >
                                <span v-html="icons[item.icon]"></span>
                                <span v-if="sidebarOpen" class="ml-3">{{ item.name }}</span>
                            </Link>
                        </li>
                    </template>
                </ul>
            </div>
        </aside>

        <div
            :class="[
                'p-4 transition-all duration-300',
                sidebarOpen ? 'ml-64' : 'ml-16',
            ]"
        >
            <div class="pt-16">
                <slot />
            </div>
        </div>

        <div
            v-if="userMenuOpen"
            @click="userMenuOpen = false"
            class="fixed inset-0 z-10"
        ></div>
    </div>
</template>
