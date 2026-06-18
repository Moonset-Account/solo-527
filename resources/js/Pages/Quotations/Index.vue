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
    status: '',
    supplier_id: '',
    is_expiring: '',
});

const columns = [
    { key: 'code', label: '报价单号', slot: 'code' },
    { key: 'supplier_name', label: '供应商' },
    { key: 'supply_name', label: '耗材名称' },
    { key: 'price', label: '单价', slot: 'price' },
    { key: 'valid_from', label: '有效期开始' },
    { key: 'valid_until', label: '有效期结束', slot: 'valid_until' },
    { key: 'status', label: '状态', slot: 'status' },
    { key: 'actions', label: '操作', slot: 'actions' },
];

const statusOptions = [
    { value: '', label: '全部状态' },
    { value: 'active', label: '有效' },
    { value: 'expiring', label: '即将过期' },
    { value: 'expired', label: '已过期' },
    { value: 'disabled', label: '已停用' },
];

const expiringOptions = [
    { value: '', label: '全部' },
    { value: '1', label: '即将过期' },
    { value: '2', label: '已过期' },
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
    if (quotation.status === 'disabled') {
        return { type: 'default', text: '已停用' };
    }
    if (days < 0) {
        return { type: 'danger', text: '已过期' };
    }
    if (days <= 7) {
        return { type: 'warning', text: `即将过期(${days}天)` };
    }
    return { type: 'success', text: '有效' };
};

const applyFilters = () => {
    router.get(route('quotations.index'), filters.value, { preserveState: true });
};

const resetFilters = () => {
    filters.value = { search: '', status: '', supplier_id: '', is_expiring: '' };
    applyFilters();
};
</script>

<template>
    <Head title="报价单管理" />

    <AppLayout>
        <div class="py-12">
            <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
                <div class="flex justify-between items-center mb-6">
                    <h1 class="text-2xl font-bold text-gray-900 dark:text-white">报价单管理</h1>
                    <Link :href="route('quotations.create')">
                        <Button variant="primary">新增报价单</Button>
                    </Link>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <div class="flex items-center">
                            <div class="p-3 rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">有效报价</p>
                                <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ pagination.total - expiringCount - expiredCount }}</p>
                            </div>
                        </div>
                    </div>

                    <div class="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg shadow p-6 border border-yellow-200 dark:border-yellow-700">
                        <div class="flex items-center">
                            <div class="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-yellow-600 dark:text-yellow-400">即将过期(7天内)</p>
                                <p class="text-2xl font-semibold text-yellow-700 dark:text-yellow-300">{{ expiringCount }}</p>
                            </div>
                        </div>
                    </div>

                    <div class="bg-red-50 dark:bg-red-900/20 rounded-lg shadow p-6 border border-red-200 dark:border-red-700">
                        <div class="flex items-center">
                            <div class="p-3 rounded-full bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-red-600 dark:text-red-400">已过期</p>
                                <p class="text-2xl font-semibold text-red-700 dark:text-red-300">{{ expiredCount }}</p>
                            </div>
                        </div>
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
                                v-model="filters.status"
                                :options="statusOptions"
                                @change="applyFilters"
                            />
                            <Select
                                v-model="filters.is_expiring"
                                :options="expiringOptions"
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
                        <Table :columns="columns" :data="quotations">
                            <template #code="{ row }">
                                <Link
                                    :href="route('quotations.show', row.id)"
                                    class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
                                >
                                    {{ row.code }}
                                </Link>
                            </template>
                            <template #price="{ row }">
                                <span class="font-semibold text-gray-900 dark:text-white">
                                    ¥{{ row.price?.toLocaleString() }}
                                </span>
                            </template>
                            <template #valid_until="{ row }">
                                <div>
                                    <p class="text-gray-900 dark:text-white">{{ row.valid_until }}</p>
                                    <p :class="[
                                        'text-xs',
                                        getDaysRemaining(row.valid_until) < 0 ? 'text-red-600 dark:text-red-400' :
                                        getDaysRemaining(row.valid_until) <= 7 ? 'text-yellow-600 dark:text-yellow-400' :
                                        'text-gray-500 dark:text-gray-400'
                                    ]">
                                        {{ getDaysRemaining(row.valid_until) < 0 ? `已过期${Math.abs(getDaysRemaining(row.valid_until))}天` : `剩余${getDaysRemaining(row.valid_until)}天` }}
                                    </p>
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
                                    <Link
                                        :href="route('quotations.edit', row.id)"
                                        class="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                                    >
                                        编辑
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
                        @change="({ page, perPage }) => router.get(route('quotations.index'), { page, per_page: perPage }, { preserveState: true })"
                    />
                </div>
            </div>
        </div>
    </AppLayout>
</template>
