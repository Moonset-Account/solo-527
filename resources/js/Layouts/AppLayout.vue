<script setup>
import { Link, usePage } from '@inertiajs/vue3';
import { computed } from 'vue';

const page = usePage();
const user = computed(() => page.props.auth?.user);

const navigation = [
    { name: '首页', href: route('dashboard'), icon: 'home', routeName: 'dashboard' },
    { name: '耗材管理', href: route('supplies.index'), icon: 'box', routeName: 'supplies.*' },
    { name: '供应商管理', href: route('suppliers.index'), icon: 'users', routeName: 'suppliers.*' },
    { name: '采购申请', href: route('purchase-requests.index'), icon: 'document', routeName: 'purchase-requests.*' },
    { name: '报价单', href: route('quotations.index'), icon: 'currency', routeName: 'quotations.*' },
    { name: '到货确认', href: route('delivery.index'), icon: 'truck', routeName: 'delivery.*' },
    { name: '财务复核', href: route('financial-reviews.index'), icon: 'check', routeName: 'financial-reviews.*' },
    { name: '系统配置', href: route('config.index'), icon: 'cog', routeName: 'config.*' },
];
</script>

<template>
    <div class="min-h-screen bg-gray-100 dark:bg-gray-900">
        <nav class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between h-16">
                    <div class="flex">
                        <div class="shrink-0 flex items-center">
                            <Link :href="route('dashboard')" class="text-xl font-bold text-gray-800 dark:text-white">
                                耗材采购管理系统
                            </Link>
                        </div>
                        <div class="hidden space-x-8 sm:-my-px sm:ms-10 sm:flex">
                            <template v-for="item in navigation" :key="item.name">
                                <Link
                                    :href="item.href"
                                    :class="['inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium',
                                        route().current(item.routeName)
                                            ? 'border-indigo-500 text-gray-900 dark:text-gray-100'
                                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-700'
                                    ]"
                                >
                                    {{ item.name }}
                                </Link>
                            </template>
                        </div>
                    </div>
                    <div class="hidden sm:flex sm:items-center sm:ms-6">
                        <div class="ms-3 relative">
                            <span class="text-sm text-gray-500 dark:text-gray-400">
                                {{ user?.name }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </nav>

        <main class="py-6">
            <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
                <slot />
            </div>
        </main>
    </div>
</template>
