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
const suppliers = computed(() => page.props.suppliers?.data || []);
const pagination = computed(() => page.props.suppliers || { current_page: 1, last_page: 1, per_page: 15, total: 0 });
const riskSummary = computed(() => page.props.riskSummary || { high: 0, medium: 0, low: 0 });
const filters = ref({
    search: '',
    risk_level: '',
    status: '',
});

const columns = [
    { key: 'code', label: '供应商编码' },
    { key: 'name', label: '供应商名称', slot: 'name' },
    { key: 'contact_person', label: '联系人' },
    { key: 'phone', label: '联系电话' },
    { key: 'risk_level', label: '风险等级', slot: 'risk_level' },
    { key: 'risk_score', label: '风险评分', slot: 'risk_score' },
    { key: 'status', label: '状态', slot: 'status' },
    { key: 'actions', label: '操作', slot: 'actions' },
];

const riskOptions = [
    { value: '', label: '全部风险等级' },
    { value: 'high', label: '高风险' },
    { value: 'medium', label: '中风险' },
    { value: 'low', label: '低风险' },
];

const statusOptions = [
    { value: '', label: '全部状态' },
    { value: 'active', label: '合作中' },
    { value: 'inactive', label: '已暂停' },
    { value: 'blacklisted', label: '黑名单' },
];

const getRiskBadge = (level) => {
    const map = {
        high: { type: 'danger', text: '高风险' },
        medium: { type: 'warning', text: '中风险' },
        low: { type: 'success', text: '低风险' },
    };
    return map[level] || { type: 'default', text: level };
};

const getStatusBadge = (status) => {
    const map = {
        active: { type: 'success', text: '合作中' },
        inactive: { type: 'warning', text: '已暂停' },
        blacklisted: { type: 'danger', text: '黑名单' },
    };
    return map[status] || { type: 'default', text: status };
};

const getRiskScoreColor = (score) => {
    if (score >= 80) return 'text-red-600 dark:text-red-400';
    if (score >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
};

const applyFilters = () => {
    router.get(route('suppliers.index'), filters.value, { preserveState: true });
};

const resetFilters = () => {
    filters.value = { search: '', risk_level: '', status: '' };
    applyFilters();
};
</script>

<template>
    <Head title="供应商管理" />

    <AppLayout>
        <div class="py-12">
            <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
                <div class="flex justify-between items-center mb-6">
                    <h1 class="text-2xl font-bold text-gray-900 dark:text-white">供应商管理</h1>
                    <Link :href="route('suppliers.create')">
                        <Button variant="primary">新增供应商</Button>
                    </Link>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div class="bg-red-50 dark:bg-red-900/20 rounded-lg p-6">
                        <p class="text-sm font-medium text-red-600 dark:text-red-400">高风险供应商</p>
                        <p class="text-3xl font-bold text-red-700 dark:text-red-300 mt-2">{{ riskSummary.high }}</p>
                    </div>
                    <div class="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6">
                        <p class="text-sm font-medium text-yellow-600 dark:text-yellow-400">中风险供应商</p>
                        <p class="text-3xl font-bold text-yellow-700 dark:text-yellow-300 mt-2">{{ riskSummary.medium }}</p>
                    </div>
                    <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
                        <p class="text-sm font-medium text-green-600 dark:text-green-400">低风险供应商</p>
                        <p class="text-3xl font-bold text-green-700 dark:text-green-300 mt-2">{{ riskSummary.low }}</p>
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg mb-6">
                    <div class="p-6">
                        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div class="md:col-span-2">
                                <Input
                                    v-model="filters.search"
                                    placeholder="搜索供应商名称/编码..."
                                    @change="applyFilters"
                                />
                            </div>
                            <Select
                                v-model="filters.risk_level"
                                :options="riskOptions"
                                @change="applyFilters"
                            />
                            <Select
                                v-model="filters.status"
                                :options="statusOptions"
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
                        <Table :columns="columns" :data="suppliers">
                            <template #name="{ row }">
                                <div class="font-medium text-gray-900 dark:text-white">{{ row.name }}</div>
                            </template>
                            <template #risk_level="{ row }">
                                <Badge :type="getRiskBadge(row.risk_level).type">
                                    {{ getRiskBadge(row.risk_level).text }}
                                </Badge>
                            </template>
                            <template #risk_score="{ row }">
                                <span :class="['font-semibold', getRiskScoreColor(row.risk_score)]">
                                    {{ row.risk_score }}
                                </span>
                            </template>
                            <template #status="{ row }">
                                <Badge :type="getStatusBadge(row.status).type">
                                    {{ getStatusBadge(row.status).text }}
                                </Badge>
                            </template>
                            <template #actions="{ row }">
                                <div class="flex space-x-2">
                                    <Link :href="route('suppliers.show', row.id)" class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                                        查看
                                    </Link>
                                    <Link :href="route('suppliers.edit', row.id)" class="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300">
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
                        @change="({ page, perPage }) => router.get(route('suppliers.index'), { page, per_page: perPage }, { preserveState: true })"
                    />
                </div>
            </div>
        </div>
    </AppLayout>
</template>
