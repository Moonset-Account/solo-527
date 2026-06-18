<script setup>
import { Head, usePage, Link, router } from '@inertiajs/vue3';
import AppLayout from '@/Layouts/AppLayout.vue';
import { computed, ref } from 'vue';
import Table from '@/Components/Table.vue';
import Pagination from '@/Components/Pagination.vue';
import Badge from '@/Components/Badge.vue';
import Input from '@/Components/Input.vue';
import Button from '@/Components/Button.vue';
import Select from '@/Components/Select.vue';

const page = usePage();
const quotations = computed(() => page.props.quotations?.data || []);
const pagination = computed(() => page.props.quotations || { current_page: 1, last_page: 1, per_page: 15, total: 0 });
const expiringCount = computed(() => page.props.expiringCount || 0);
const expiredCount = computed(() => page.props.expiredCount || 0);

const filters = ref({
    search: '',
    supplier_id: '',
    days: '',
});

const daysOptions = [
    { value: '', label: '全部' },
    { value: '3', label: '3天内' },
    { value: '7', label: '7天内' },
    { value: '15', label: '15天内' },
    { value: '30', label: '30天内' },
    { value: 'expired', label: '已过期' },
];

const suppliers = computed(() => page.props.suppliers || []);

const supplierOptions = computed(() => {
    return [
        { value: '', label: '全部供应商' },
        ...suppliers.value.map(s => ({
            value: s.id,
            label: s.name,
        })),
    ];
});

const columns = [
    { key: 'code', label: '报价单号', slot: 'code' },
    { key: 'supplier_name', label: '供应商' },
    { key: 'supply_name', label: '主要耗材' },
    { key: 'total_amount', label: '总金额', slot: 'total_amount' },
    { key: 'valid_until', label: '有效期至', slot: 'valid_until' },
    { key: 'days_remaining', label: '剩余天数', slot: 'days_remaining' },
    { key: 'status', label: '状态', slot: 'status' },
    { key: 'actions', label: '操作', slot: 'actions' },
];

const getDaysRemaining = (validUntil) => {
    if (!validUntil) return 0;
    const now = new Date();
    const end = new Date(validUntil);
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return diff;
};

const getStatusBadge = (quotation) => {
    const days = getDaysRemaining(quotation.valid_until);
    if (days < 0) {
        return { type: 'danger', text: '已过期' };
    }
    if (days <= 3) {
        return { type: 'danger', text: `紧急(${days}天)` };
    }
    if (days <= 7) {
        return { type: 'warning', text: `即将过期(${days}天)` };
    }
    return { type: 'success', text: '有效' };
};

const getRowClass = (quotation) => {
    const days = getDaysRemaining(quotation.valid_until);
    if (days < 0) {
        return 'bg-red-50 dark:bg-red-900/20';
    }
    if (days <= 3) {
        return 'bg-red-50 dark:bg-red-900/10';
    }
    if (days <= 7) {
        return 'bg-yellow-50 dark:bg-yellow-900/10';
    }
    return '';
};

const applyFilters = () => {
    router.get(route('quotations.expiring'), filters.value, { preserveState: true });
};

const resetFilters = () => {
    filters.value = { search: '', supplier_id: '', days: '' };
    applyFilters();
};
</script>

<template>
    <Head title="即将过期报价单" />

    <AppLayout>
        <div class="py-12">
            <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
                <div class="flex justify-between items-center mb-6">
                    <div>
                        <Link :href="route('quotations.index')" class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                            ← 返回全部报价单
                        </Link>
                        <h1 class="text-2xl font-bold text-gray-900 dark:text-white mt-2">即将过期报价单</h1>
                    </div>
                    <Link :href="route('quotations.create')">
                        <Button variant="primary">新增报价单</Button>
                    </Link>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div class="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg shadow p-6 border border-yellow-200 dark:border-yellow-700">
                        <div class="flex items-center">
                            <div class="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400">
                                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-yellow-600 dark:text-yellow-400">7天内即将过期</p>
                                <p class="text-3xl font-bold text-yellow-700 dark:text-yellow-300 mt-1">{{ expiringCount }}</p>
                            </div>
                        </div>
                        <p class="mt-4 text-sm text-yellow-700 dark:text-yellow-400">
                            以下报价单将在7天内过期，请及时处理或续期。
                        </p>
                    </div>

                    <div class="bg-red-50 dark:bg-red-900/20 rounded-lg shadow p-6 border border-red-200 dark:border-red-700">
                        <div class="flex items-center">
                            <div class="p-3 rounded-full bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400">
                                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-red-600 dark:text-red-400">已过期</p>
                                <p class="text-3xl font-bold text-red-700 dark:text-red-300 mt-1">{{ expiredCount }}</p>
                            </div>
                        </div>
                        <p class="mt-4 text-sm text-red-700 dark:text-red-400">
                            以下报价单已过期，请确认是否需要重新询价。
                        </p>
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg mb-6">
                    <div class="p-6">
                        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div class="md:col-span-2">
                                <Input
                                    v-model="filters.search"
                                    placeholder="搜索报价单号/供应商/耗材..."
                                    @change="applyFilters"
                                />
                            </div>
                            <Select
                                v-model="filters.supplier_id"
                                :options="supplierOptions"
                                @change="applyFilters"
                            />
                            <Select
                                v-model="filters.days"
                                :options="daysOptions"
                                label=""
                                @change="applyFilters"
                            />
                        </div>
                        <div class="mt-4 flex justify-end space-x-2">
                            <Button variant="secondary" @click="resetFilters">重置</Button>
                            <Button variant="primary" @click="applyFilters">筛选</Button>
                        </div>
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                    <div class="overflow-x-auto">
                        <Table :columns="columns" :data="quotations" :rowClass="getRowClass">
                            <template #code="{ row }">
                                <Link
                                    :href="route('quotations.show', row.id)"
                                    class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
                                >
                                    {{ row.code }}
                                </Link>
                            </template>
                            <template #total_amount="{ row }">
                                <span class="font-semibold text-gray-900 dark:text-white">
                                    ¥{{ row.total_amount?.toLocaleString() }}
                                </span>
                            </template>
                            <template #valid_until="{ row }">
                                <p class="text-gray-900 dark:text-white">{{ row.valid_until }}</p>
                            </template>
                            <template #days_remaining="{ row }">
                                <div :class="[
                                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                                    getDaysRemaining(row.valid_until) < 0 ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' :
                                    getDaysRemaining(row.valid_until) <= 3 ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' :
                                    getDaysRemaining(row.valid_until) <= 7 ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
                                    'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                ]">
                                    {{ getDaysRemaining(row.valid_until) < 0 ? `已过期${Math.abs(getDaysRemaining(row.valid_until))}天` : `${getDaysRemaining(row.valid_until)}天` }}
                                </div>
                            </template>
                            <template #status="{ row }">
                                <Badge :type="getStatusBadge(row).type">
                                    {{ getStatusBadge(row).text }}
                                </Badge>
                            </template>
                            <template #actions="{ row }">
                                <div class="flex space-x-2">
                                    <Link
                                        :href="route('quotations.show', row.id)"
                                        class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                    >
                                        查看
                                    </Link>
                                </div>
                            </template>
                        </Table>
                    </div>
                    <Pagination
                        v-model:currentPage="pagination.current_page"
                        :lastPage="pagination.last_page"
                        v-model:perPage="pagination.per_page"
                        :total="pagination.total"
                        @change="({ page, perPage }) => router.get(route('quotations.expiring'), { ...filters.value, page, per_page: perPage }, { preserveState: true })"
                    />
                </div>

                <div class="mt-6 bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-4">
                    <div class="flex flex-wrap items-center gap-4 text-sm">
                        <div class="flex items-center">
                            <span class="w-4 h-4 rounded bg-red-100 dark:bg-red-900/50 mr-2 border border-red-300 dark:border-red-700"></span>
                            <span class="text-gray-600 dark:text-gray-300">已过期/3天内过期</span>
                        </div>
                        <div class="flex items-center">
                            <span class="w-4 h-4 rounded bg-yellow-100 dark:bg-yellow-900/50 mr-2 border border-yellow-300 dark:border-yellow-700"></span>
                            <span class="text-gray-600 dark:text-gray-300">7天内即将过期</span>
                        </div>
                        <div class="flex items-center">
                            <span class="w-4 h-4 rounded bg-white dark:bg-gray-700 mr-2 border border-gray-300 dark:border-gray-600"></span>
                            <span class="text-gray-600 dark:text-gray-300">正常有效</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </AppLayout>
</template>
