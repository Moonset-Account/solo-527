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
const requests = computed(() => page.props.requests?.data || []);
const pagination = computed(() => page.props.requests || { current_page: 1, last_page: 1, per_page: 15, total: 0 });
const filters = ref({
    search: '',
    status: '',
    date_from: '',
    date_to: '',
});

const columns = [
    { key: 'code', label: '申请单号', slot: 'code' },
    { key: 'requester_name', label: '申请人' },
    { key: 'department', label: '部门' },
    { key: 'total_amount', label: '预估金额', slot: 'total_amount' },
    { key: 'status', label: '状态', slot: 'status' },
    { key: 'current_approval', label: '当前审批', slot: 'current_approval' },
    { key: 'request_date', label: '申请时间' },
    { key: 'actions', label: '操作', slot: 'actions' },
];

const statusOptions = [
    { value: '', label: '全部状态' },
    { value: 'draft', label: '草稿' },
    { value: 'pending', label: '审批中' },
    { value: 'approved', label: '已通过' },
    { value: 'rejected', label: '已拒绝' },
    { value: 'cancelled', label: '已取消' },
];

const getStatusBadge = (status) => {
    const map = {
        draft: { type: 'default', text: '草稿' },
        pending: { type: 'warning', text: '审批中' },
        approved: { type: 'success', text: '已通过' },
        rejected: { type: 'danger', text: '已拒绝' },
        cancelled: { type: 'default', text: '已取消' },
    };
    return map[status] || { type: 'default', text: status };
};

const applyFilters = () => {
    router.get(route('purchase-requests.index'), filters.value, { preserveState: true });
};

const resetFilters = () => {
    filters.value = { search: '', status: '', date_from: '', date_to: '' };
    applyFilters();
};
</script>

<template>
    <Head title="采购申请" />

    <AppLayout>
        <div class="py-12">
            <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
                <div class="flex justify-between items-center mb-6">
                    <h1 class="text-2xl font-bold text-gray-900 dark:text-white">采购申请</h1>
                    <Link :href="route('purchase-requests.create')">
                        <Button variant="primary">新建申请</Button>
                    </Link>
                </div>

                <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg mb-6">
                    <div class="p-6">
                        <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
                            <div class="md:col-span-2">
                                <Input
                                    v-model="filters.search"
                                    placeholder="搜索申请单号/申请人..."
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
                        <Table :columns="columns" :data="requests">
                            <template #code="{ row }">
                                <Link
                                    :href="route('purchase-requests.show', row.id)"
                                    class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
                                >
                                    {{ row.code }}
                                </Link>
                            </template>
                            <template #total_amount="{ row }">
                                <span class="font-semibold text-gray-900 dark:text-white">
                                    ¥{{ row.total_amount?.toLocaleString() || 0 }}
                                </span>
                            </template>
                            <template #status="{ row }">
                                <Badge :type="getStatusBadge(row.status).type">
                                    {{ getStatusBadge(row.status).text }}
                                </Badge>
                            </template>
                            <template #current_approval="{ row }">
                                <span v-if="row.current_approval" class="text-sm text-gray-600 dark:text-gray-400">
                                    {{ row.current_approval }}
                                </span>
                                <span v-else class="text-sm text-gray-400">-</span>
                            </template>
                            <template #actions="{ row }">
                                <div class="flex space-x-2">
                                    <Link
                                        :href="route('purchase-requests.show', row.id)"
                                        class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                    >
                                        查看
                                    </Link>
                                    <Link
                                        v-if="row.status === 'draft'"
                                        :href="route('purchase-requests.edit', row.id)"
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
                        @change="({ page, perPage }) => router.get(route('purchase-requests.index'), { page, per_page: perPage }, { preserveState: true })"
                    />
                </div>
            </div>
        </div>
    </AppLayout>
</template>
