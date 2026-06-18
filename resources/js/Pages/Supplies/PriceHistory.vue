<script setup>
import { Head, usePage, Link, router } from '@inertiajs/vue3';
import AppLayout from '@/Layouts/AppLayout.vue';
import { computed } from 'vue';
import Badge from '@/Components/Badge.vue';
import Button from '@/Components/Button.vue';
import Table from '@/Components/Table.vue';
import Pagination from '@/Components/Pagination.vue';

const page = usePage();
const supply = computed(() => page.props.supply || {});
const priceHistory = computed(() => page.props.priceHistory?.data || []);
const pagination = computed(() => page.props.priceHistory || { current_page: 1, last_page: 1, per_page: 15, total: 0 });

const columns = [
    { key: 'date', label: '变更日期' },
    { key: 'old_price', label: '旧价格', slot: 'old_price' },
    { key: 'new_price', label: '新价格', slot: 'new_price' },
    { key: 'change', label: '变动', slot: 'change' },
    { key: 'changed_by', label: '变更人' },
    { key: 'remark', label: '备注' },
];

const getChangeBadge = (row) => {
    const diff = row.new_price - row.old_price;
    if (diff > 0) {
        return { type: 'danger', text: `+¥${diff.toFixed(2)}` };
    } else if (diff < 0) {
        return { type: 'success', text: `-¥${Math.abs(diff).toFixed(2)}` };
    }
    return { type: 'default', text: '无变动' };
};
</script>

<template>
    <Head :title="`${supply.name || '耗材'} - 历史价格`" />

    <AppLayout>
        <div class="py-12">
            <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
                <div class="flex justify-between items-center mb-6">
                    <div>
                        <Link :href="route('supplies.show', supply.id)" class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                            ← 返回耗材详情
                        </Link>
                        <h1 class="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                            {{ supply.name }} - 历史价格
                        </h1>
                    </div>
                    <Link :href="route('supplies.edit', supply.id)">
                        <Button variant="secondary">编辑耗材</Button>
                    </Link>
                </div>

                <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg mb-6">
                    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 class="text-lg font-medium text-gray-900 dark:text-white">价格概览</h3>
                    </div>
                    <div class="p-6">
                        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <p class="text-sm text-gray-500 dark:text-gray-400">当前价格</p>
                                <p class="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                                    ¥{{ supply.current_price?.toLocaleString() || '0.00' }}
                                </p>
                            </div>
                            <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <p class="text-sm text-gray-500 dark:text-gray-400">历史最高</p>
                                <p class="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                                    ¥{{ page.props.maxPrice?.toLocaleString() || '0.00' }}
                                </p>
                            </div>
                            <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <p class="text-sm text-gray-500 dark:text-gray-400">历史最低</p>
                                <p class="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                                    ¥{{ page.props.minPrice?.toLocaleString() || '0.00' }}
                                </p>
                            </div>
                            <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <p class="text-sm text-gray-500 dark:text-gray-400">变更次数</p>
                                <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                    {{ pagination.total }}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                    <div class="overflow-x-auto">
                        <Table :columns="columns" :data="priceHistory">
                            <template #old_price="{ row }">
                                <span class="text-gray-900 dark:text-white">¥{{ row.old_price?.toLocaleString() || '0.00' }}</span>
                            </template>
                            <template #new_price="{ row }">
                                <span class="font-medium text-gray-900 dark:text-white">¥{{ row.new_price?.toLocaleString() || '0.00' }}</span>
                            </template>
                            <template #change="{ row }">
                                <Badge :type="getChangeBadge(row).type">
                                    {{ getChangeBadge(row).text }}
                                </Badge>
                            </template>
                        </Table>
                    </div>
                    <Pagination
                        v-model:currentPage="pagination.current_page"
                        :lastPage="pagination.last_page"
                        v-model:perPage="pagination.per_page"
                        :total="pagination.total"
                        @change="({ page: p, perPage }) => router.get(route('supplies.price-history', supply.id), { page: p, per_page: perPage }, { preserveState: true })"
                    />
                </div>
            </div>
        </div>
    </AppLayout>
</template>
