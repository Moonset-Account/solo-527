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
import { useToast } from '@/Composables/useToast';

const page = usePage();
const toast = useToast();
const discrepancies = computed(() => page.props.discrepancies?.data || []);
const pagination = computed(() => page.props.discrepancies || { current_page: 1, last_page: 1, per_page: 15, total: 0 });
const stats = computed(() => page.props.stats || { pending: 0, resolved: 0, waived: 0, total: 0, total_amount: 0 });
const filters = ref({
    search: '',
    status: '',
    date_from: '',
    date_to: '',
});

const columns = [
    { key: 'purchase_request_code', label: '采购申请', slot: 'purchase_request_code' },
    { key: 'supply_name', label: '耗材' },
    { key: 'specification', label: '规格' },
    { key: 'ordered_qty', label: '订购数量', slot: 'ordered_qty' },
    { key: 'received_qty', label: '实收数量', slot: 'received_qty' },
    { key: 'diff_qty', label: '差异数量', slot: 'diff_qty' },
    { key: 'diff_amount', label: '差异金额', slot: 'diff_amount' },
    { key: 'status', label: '处理状态', slot: 'status' },
    { key: 'actions', label: '操作', slot: 'actions' },
];

const statusOptions = [
    { value: '', label: '全部状态' },
    { value: 'pending', label: '待处理' },
    { value: 'resolved', label: '已解决' },
    { value: 'waived', label: '已豁免' },
];

const getStatusBadge = (status) => {
    const map = {
        pending: { type: 'warning', text: '待处理' },
        resolved: { type: 'success', text: '已解决' },
        waived: { type: 'info', text: '已豁免' },
    };
    return map[status] || { type: 'default', text: status };
};

const applyFilters = () => {
    router.get(route('financial-reviews.delivery-discrepancies'), filters.value, { preserveState: true });
};

const resetFilters = () => {
    filters.value = { search: '', status: '', date_from: '', date_to: '' };
    applyFilters();
};

const waiveDiscrepancy = (row) => {
    router.post(route('financial-reviews.delivery-discrepancies.waive', row.id), {}, {
        onSuccess: () => {
            toast.success('已豁免');
        },
        onError: () => {
            toast.error('操作失败');
        },
    });
};
</script>

<template>
    <Head title="交付差异看板" />

    <AppLayout>
        <div class="py-12">
            <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
                <div class="flex justify-between items-center mb-6">
                    <div>
                        <Link :href="route('financial-reviews.index')" class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                            ← 返回财务复核
                        </Link>
                        <h1 class="text-2xl font-bold text-gray-900 dark:text-white mt-2">交付差异看板</h1>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
                    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <p class="text-sm font-medium text-gray-500 dark:text-gray-400">全部差异</p>
                        <p class="text-2xl font-semibold text-gray-900 dark:text-white mt-1">{{ stats.total }}</p>
                    </div>
                    <div class="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg shadow p-6 border border-yellow-200 dark:border-yellow-700">
                        <p class="text-sm font-medium text-yellow-600 dark:text-yellow-400">待处理</p>
                        <p class="text-2xl font-semibold text-yellow-700 dark:text-yellow-300 mt-1">{{ stats.pending }}</p>
                    </div>
                    <div class="bg-green-50 dark:bg-green-900/20 rounded-lg shadow p-6 border border-green-200 dark:border-green-700">
                        <p class="text-sm font-medium text-green-600 dark:text-green-400">已解决</p>
                        <p class="text-2xl font-semibold text-green-700 dark:text-green-300 mt-1">{{ stats.resolved }}</p>
                    </div>
                    <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg shadow p-6 border border-blue-200 dark:border-blue-700">
                        <p class="text-sm font-medium text-blue-600 dark:text-blue-400">已豁免</p>
                        <p class="text-2xl font-semibold text-blue-700 dark:text-blue-300 mt-1">{{ stats.waived }}</p>
                    </div>
                    <div class="bg-red-50 dark:bg-red-900/20 rounded-lg shadow p-6 border border-red-200 dark:border-red-700">
                        <p class="text-sm font-medium text-red-600 dark:text-red-400">差异金额总计</p>
                        <p class="text-2xl font-semibold text-red-700 dark:text-red-300 mt-1">¥{{ stats.total_amount?.toLocaleString() || 0 }}</p>
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg mb-6">
                    <div class="p-6">
                        <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
                            <div class="md:col-span-2">
                                <Input
                                    v-model="filters.search"
                                    placeholder="搜索采购申请/耗材..."
                                    @change="applyFilters"
                                />
                            </div>
                            <Select
                                v-model="filters.status"
                                :options="statusOptions"
                                @change="applyFilters"
                            />
                            <Input
                                v-model="filters.date_from"
                                type="date"
                                label=""
                                placeholder="开始日期"
                                @change="applyFilters"
                            />
                            <Input
                                v-model="filters.date_to"
                                type="date"
                                label=""
                                placeholder="结束日期"
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
                        <Table :columns="columns" :data="discrepancies">
                            <template #purchase_request_code="{ row }">
                                <Link
                                    :href="row.purchase_request_link || '#'"
                                    class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
                                >
                                    {{ row.purchase_request_code }}
                                </Link>
                            </template>
                            <template #ordered_qty="{ row }">
                                <span class="font-medium text-gray-900 dark:text-white">{{ row.ordered_qty }}</span>
                            </template>
                            <template #received_qty="{ row }">
                                <span :class="['font-medium', row.received_qty < row.ordered_qty ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400']">
                                    {{ row.received_qty }}
                                </span>
                            </template>
                            <template #diff_qty="{ row }">
                                <span class="font-semibold text-red-600 dark:text-red-400">
                                    {{ row.diff_qty > 0 ? '+' : '' }}{{ row.diff_qty }}
                                </span>
                            </template>
                            <template #diff_amount="{ row }">
                                <span class="font-semibold text-red-600 dark:text-red-400">
                                    ¥{{ row.diff_amount?.toLocaleString() || 0 }}
                                </span>
                            </template>
                            <template #status="{ row }">
                                <Badge :type="getStatusBadge(row.status).type">
                                    {{ getStatusBadge(row.status).text }}
                                </Badge>
                            </template>
                            <template #actions="{ row }">
                                <div class="flex space-x-2">
                                    <button
                                        v-if="row.status === 'pending'"
                                        class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                        @click="waiveDiscrepancy(row)"
                                    >
                                        豁免
                                    </button>
                                    <Link
                                        :href="row.purchase_request_link || '#'"
                                        class="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                                    >
                                        详情
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
                        @change="({ page, perPage }) => router.get(route('financial-reviews.delivery-discrepancies'), { page, per_page: perPage }, { preserveState: true })"
                    />
                </div>
            </div>
        </div>
    </AppLayout>
</template>
