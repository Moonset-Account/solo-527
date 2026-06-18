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
const supplies = computed(() => page.props.supplies?.data || []);
const pagination = computed(() => page.props.supplies || { current_page: 1, last_page: 1, per_page: 15, total: 0 });
const monthlyUsage = computed(() => page.props.monthlyUsage || []);
const filters = ref({
    search: '',
    category: '',
    status: '',
});

const columns = [
    { key: 'code', label: '编码' },
    { key: 'name', label: '名称' },
    { key: 'category', label: '分类', slot: 'category' },
    { key: 'specification', label: '规格型号' },
    { key: 'unit', label: '单位' },
    { key: 'stock', label: '当前库存' },
    { key: 'monthlyUsage', label: '月度用量', slot: 'monthlyUsage' },
    { key: 'status', label: '状态', slot: 'status' },
    { key: 'actions', label: '操作', slot: 'actions' },
];

const categoryOptions = [
    { value: '', label: '全部分类' },
    { value: 'laboratory', label: '实验室耗材' },
    { value: 'office', label: '办公用品' },
    { value: 'cleaning', label: '清洁用品' },
    { value: 'medical', label: '医用耗材' },
];

const statusOptions = [
    { value: '', label: '全部状态' },
    { value: 'normal', label: '正常' },
    { value: 'low', label: '库存不足' },
    { value: 'out', label: '已缺货' },
];

const getStatusBadge = (status) => {
    const map = {
        normal: { type: 'success', text: '正常' },
        low: { type: 'warning', text: '库存不足' },
        out: { type: 'danger', text: '已缺货' },
    };
    return map[status] || { type: 'default', text: status };
};

const applyFilters = () => {
    router.get(route('supplies.index'), filters.value, { preserveState: true });
};

const resetFilters = () => {
    filters.value = { search: '', category: '', status: '' };
    applyFilters();
};
</script>

<template>
    <Head title="耗材管理" />

    <AppLayout>
        <div class="py-12">
            <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
                <div class="flex justify-between items-center mb-6">
                    <h1 class="text-2xl font-bold text-gray-900 dark:text-white">耗材管理</h1>
                    <Link :href="route('supplies.create')">
                        <Button variant="primary">新增耗材</Button>
                    </Link>
                </div>

                <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg mb-6">
                    <div class="p-6">
                        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div class="md:col-span-2">
                                <Input
                                    v-model="filters.search"
                                    placeholder="搜索耗材名称/编码..."
                                    @change="applyFilters"
                                />
                            </div>
                            <Select
                                v-model="filters.category"
                                :options="categoryOptions"
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

                <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg mb-6">
                    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 class="text-lg font-medium text-gray-900 dark:text-white">月度用量统计</h3>
                    </div>
                    <div class="p-6">
                        <div v-if="monthlyUsage.length > 0" class="grid grid-cols-2 md:grid-cols-6 gap-4">
                            <div v-for="item in monthlyUsage" :key="item.month" class="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <p class="text-sm text-gray-500 dark:text-gray-400">{{ item.month }}</p>
                                <p class="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">{{ item.count }}</p>
                            </div>
                        </div>
                        <div v-else class="text-center py-8 text-gray-500 dark:text-gray-400">
                            暂无月度用量数据
                        </div>
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                    <div class="overflow-x-auto">
                        <Table :columns="columns" :data="supplies">
                            <template #category="{ row }">
                                <Badge type="info">{{ row.category }}</Badge>
                            </template>
                            <template #monthlyUsage="{ row }">
                                <span class="text-gray-900 dark:text-white font-medium">{{ row.monthly_usage || 0 }}</span>
                            </template>
                            <template #status="{ row }">
                                <Badge :type="getStatusBadge(row.status).type">
                                    {{ getStatusBadge(row.status).text }}
                                </Badge>
                            </template>
                            <template #actions="{ row }">
                                <div class="flex space-x-2">
                                    <Link :href="route('supplies.edit', row.id)" class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                                        编辑
                                    </Link>
                                    <Link :href="route('supplies.show', row.id)" class="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300">
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
                        @change="({ page, perPage }) => router.get(route('supplies.index'), { page, per_page: perPage }, { preserveState: true })"
                    />
                </div>
            </div>
        </div>
    </AppLayout>
</template>
