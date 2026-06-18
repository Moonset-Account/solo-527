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
const logs = computed(() => page.props.logs?.data || []);
const pagination = computed(() => page.props.logs || { current_page: 1, last_page: 1, per_page: 15, total: 0 });
const filters = ref({
    search: '',
    field: '',
    user: '',
    date_from: '',
    date_to: '',
});

const columns = [
    { key: 'field', label: '字段', slot: 'field' },
    { key: 'old_value', label: '旧值', slot: 'old_value' },
    { key: 'new_value', label: '新值', slot: 'new_value' },
    { key: 'user_name', label: '操作人' },
    { key: 'created_at', label: '时间' },
];

const fieldOptions = [
    { value: '', label: '全部字段' },
    { value: 'systemName', label: '系统名称' },
    { value: 'quotationValidDays', label: '报价单默认有效天数' },
    { value: 'lowStockThreshold', label: '低库存预警阈值' },
    { value: 'defaultCurrency', label: '默认货币' },
    { value: 'enableApprovalFlow', label: '启用审批流程' },
    { value: 'enableDeliveryConfirmation', label: '启用到货确认' },
    { value: 'enableSpecAttachment', label: '启用规格附件' },
    { value: 'enableHistoryPrice', label: '启用历史价格查询' },
    { value: 'enableOperationLog', label: '启用操作日志' },
];

const formatValue = (value) => {
    if (typeof value === 'boolean') {
        return value ? '是' : '否';
    }
    if (value === null || value === undefined || value === '') {
        return '-';
    }
    return String(value);
};

const applyFilters = () => {
    router.get(route('config.activity-log'), filters.value, { preserveState: true });
};

const resetFilters = () => {
    filters.value = { search: '', field: '', user: '', date_from: '', date_to: '' };
    applyFilters();
};
</script>

<template>
    <Head title="配置操作日志" />

    <AppLayout>
        <div class="py-12">
            <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
                <div class="flex justify-between items-center mb-6">
                    <div>
                        <Link :href="route('config.index')" class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                            ← 返回系统配置
                        </Link>
                        <h1 class="text-2xl font-bold text-gray-900 dark:text-white mt-2">配置操作日志</h1>
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg mb-6">
                    <div class="p-6">
                        <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
                            <div class="md:col-span-2">
                                <Input
                                    v-model="filters.search"
                                    placeholder="搜索操作人/字段..."
                                    @change="applyFilters"
                                />
                            </div>
                            <Select
                                v-model="filters.field"
                                :options="fieldOptions"
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
                        <Table :columns="columns" :data="logs">
                            <template #field="{ row }">
                                <Badge type="primary">{{ row.field_label || row.field }}</Badge>
                            </template>
                            <template #old_value="{ row }">
                                <span class="text-red-600 dark:text-red-400 font-mono text-sm bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
                                    {{ formatValue(row.old_value) }}
                                </span>
                            </template>
                            <template #new_value="{ row }">
                                <span class="text-green-600 dark:text-green-400 font-mono text-sm bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                                    {{ formatValue(row.new_value) }}
                                </span>
                            </template>
                        </Table>
                    </div>
                    <Pagination
                        v-model:currentPage="pagination.current_page"
                        :lastPage="pagination.last_page"
                        v-model:perPage="pagination.per_page"
                        :total="pagination.total"
                        @change="({ page, perPage }) => router.get(route('config.activity-log'), { page, per_page: perPage }, { preserveState: true })"
                    />
                </div>
            </div>
        </div>
    </AppLayout>
</template>
