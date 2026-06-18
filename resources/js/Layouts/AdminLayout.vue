<script setup>
import { Link, usePage } from '@inertiajs/vue3';
import { computed } from 'vue';

const page = usePage();
const user = computed(() => page.props.auth?.user);

const navigation = [
    { name: '仪表盘', href: route('dashboard.index'), icon: 'chart' },
    { name: '耗材管理', href: route('supplies.index'), icon: 'box' },
    { name: '供应商管理', href: route('suppliers.index'), icon: 'users' },
    { name: '审批流程', href: route('approval-flows.index'), icon: 'flow' },
    { name: '采购申请', href: route('purchase-requests.index'), icon: 'document' },
    { name: '报价单管理', href: route('quotations.index'), icon: 'currency' },
    { name: '到货管理', href: route('delivery.index'), icon: 'truck' },
    { name: '批次管理', href: route('batches.index'), icon: 'refresh' },
    { name: '财务复核', href: route('financial-reviews.index'), icon: 'check' },
    { name: '系统配置', href: route('config.index'), icon: 'cog' },
];
</script>

<template>
    <div class="min-h-screen bg-gray-100 dark:bg-gray-900 flex">
        <aside class="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 hidden md:block">
            <div class="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-700">
                <span class="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                    管理员控制台
                </span>
            </div>
            <nav class="p-4 space-y-1">
                <template v-for="item in navigation" :key="item.name">
                    <Link
                        :href="item.href"
                        :class="['block px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                            route().current(item.href) || (item.href.includes('index') && route().current(item.href.replace('.index', '.*')))
                                ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300'
                                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        ]"
                    >
                        {{ item.name }}
                    </Link>
                </template>
            </nav>
        </aside>

        <div class="flex-1 flex flex-col">
            <header class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <h1 class="text-lg font-semibold text-gray-800 dark:text-white">
                        管理员面板
                    </h1>
                    <div class="flex items-center space-x-4">
                        <span class="text-sm text-gray-500 dark:text-gray-400">
                            {{ user?.name }} ({{ user?.role }})
                        </span>
                    </div>
                </div>
            </header>

            <main class="flex-1 py-6">
                <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <slot />
                </div>
            </main>
        </div>
    </div>
</template>
