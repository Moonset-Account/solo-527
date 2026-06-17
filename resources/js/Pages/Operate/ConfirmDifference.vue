<script setup>
import { ref, computed } from 'vue';
import { usePage, router } from '@inertiajs/vue3';
import DataTable from '@/Components/DataTable.vue';
import StatusBadge from '@/Components/StatusBadge.vue';

const page = usePage();

const differences = computed(() => page.props.differences?.data || []);
const pagination = computed(() => page.props.differences);
const filters = ref({
    project_id: page.props.filters?.project_id || '',
    type: page.props.filters?.type || '',
    status: 'pending',
});

const selectedDifferences = ref([]);
const showConfirmModal = ref(false);
const currentDifference = ref(null);
const confirmAction = ref('');
const remark = ref('');

const columns = [
    { key: 'id', label: 'ID', sortable: false },
    { key: 'project_name', label: '项目名称' },
    { key: 'type', label: '差异类型' },
    {
        key: 'planned_amount',
        label: '应收金额',
        render: (row) => formatCurrency(row.planned_amount),
    },
    {
        key: 'actual_amount',
        label: '实收金额',
        render: (row) => formatCurrency(row.actual_amount),
    },
    {
        key: 'difference_amount',
        label: '差异金额',
        render: (row) => formatCurrency(row.difference_amount),
    },
    { key: 'discovered_at', label: '发现日期' },
    { key: 'status', label: '状态' },
];

const rowActions = [
    { key: 'confirm', label: '确认差异', variant: 'primary' },
    { key: 'reject', label: '驳回', variant: 'secondary' },
];

const filterOptions = {
    projects: page.props.projects || [],
    types: [
        { value: 'amount_mismatch', label: '金额不符' },
        { value: 'date_mismatch', label: '日期不符' },
        { value: 'missing_record', label: '缺失记录' },
    ],
};

const formatCurrency = (value) => {
    if (!value) return '-';
    return new Intl.NumberFormat('zh-CN', {
        style: 'currency',
        currency: 'CNY',
    }).format(value);
};

const handleFilter = (newFilters) => {
    filters.value = { ...filters.value, ...newFilters };
    loadData();
};

const handleReset = () => {
    filters.value = {
        project_id: '',
        type: '',
        status: 'pending',
    };
    loadData();
};

const handlePageChange = (page) => {
    loadData({ page });
};

const loadData = (params = {}) => {
    router.get(route('difference.confirm'), {
        ...filters.value,
        ...params,
    }, { preserveState: true });
};

const handleRowAction = (action, row) => {
    currentDifference.value = row;
    confirmAction.value = action;
    remark.value = '';
    showConfirmModal.value = true;
};

const handleBulkConfirm = () => {
    confirmAction.value = 'bulk_confirm';
    showConfirmModal.value = true;
};

const executeAction = () => {
    const data = {
        ids: confirmAction.value === 'bulk_confirm' ? selectedDifferences.value : [currentDifference.value.id],
        action: confirmAction.value.replace('bulk_', ''),
        remark: remark.value,
    };

    router.post(route('difference.batch-update'), data, {
        preserveScroll: true,
        onSuccess: () => {
            showConfirmModal.value = false;
            selectedDifferences.value = [];
        },
    });
};
</script>

<template>
    <div class="py-12">
        <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div class="mb-8">
                <h1 class="text-2xl font-bold text-gray-900">确认差异</h1>
                <p class="mt-1 text-sm text-gray-600">核对并确认系统识别出的差异记录</p>
            </div>

            <div class="bg-white rounded-lg shadow p-4 mb-4">
                <div class="flex flex-wrap gap-4 items-end">
                    <div class="flex-1 min-w-[200px]">
                        <label class="block text-sm font-medium text-gray-700 mb-1">项目</label>
                        <select
                            v-model="filters.project_id"
                            @change="handleFilter({ project_id: filters.project_id })"
                            class="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        >
                            <option value="">全部项目</option>
                            <option v-for="project in filterOptions.projects" :key="project.id" :value="project.id">
                                {{ project.name }}
                            </option>
                        </select>
                    </div>
                    <div class="flex-1 min-w-[200px]">
                        <label class="block text-sm font-medium text-gray-700 mb-1">差异类型</label>
                        <select
                            v-model="filters.type"
                            @change="handleFilter({ type: filters.type })"
                            class="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        >
                            <option value="">全部类型</option>
                            <option v-for="type in filterOptions.types" :key="type.value" :value="type.value">
                                {{ type.label }}
                            </option>
                        </select>
                    </div>
                    <div class="flex gap-2">
                        <button
                            @click="handleReset"
                            class="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md font-semibold text-xs text-gray-700 uppercase tracking-widest shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition ease-in-out duration-150"
                        >
                            重置
                        </button>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-lg shadow p-4 mb-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-4">
                        <span class="text-sm text-gray-600">
                            已选择 <span class="font-semibold text-primary-600">{{ selectedDifferences.length }}</span> 条记录
                        </span>
                    </div>
                    <div class="flex gap-2">
                        <button
                            v-if="selectedDifferences.length > 0"
                            @click="handleBulkConfirm"
                            class="inline-flex items-center px-4 py-2 bg-primary-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-primary-700 focus:bg-primary-700 active:bg-primary-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition ease-in-out duration-150"
                        >
                            批量确认差异
                        </button>
                    </div>
                </div>
            </div>

            <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                <DataTable
                    :columns="columns"
                    :data="differences"
                    :pagination="pagination"
                    :selectable="true"
                    :row-actions="rowActions"
                    @page-change="handlePageChange"
                    @row-select="(ids) => selectedDifferences = ids"
                    @row-action="handleRowAction"
                >
                    <template #cell-type="{ row }">
                        <StatusBadge :status="row.type" size="sm" />
                    </template>
                    <template #cell-status="{ row }">
                        <StatusBadge :status="row.status" size="sm" />
                    </template>
                    <template #cell-difference_amount="{ row }">
                        <span
                            :class="[
                                'font-medium',
                                row.difference_amount > 0 ? 'text-green-600' : 'text-red-600',
                            ]"
                        >
                            {{ formatCurrency(row.difference_amount) }}
                        </span>
                    </template>
                </DataTable>
            </div>

            <div v-if="showConfirmModal" class="fixed inset-0 overflow-y-auto z-50">
                <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
                    <div class="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" @click="showConfirmModal = false"></div>

                    <div class="relative inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
                        <div class="mb-4">
                            <h3 class="text-lg font-semibold text-gray-900">
                                {{ confirmAction === 'bulk_confirm' ? '批量确认差异' : confirmAction === 'confirm' ? '确认差异' : '驳回差异' }}
                            </h3>
                            <p v-if="confirmAction !== 'bulk_confirm'" class="mt-1 text-sm text-gray-500">
                                项目: {{ currentDifference?.project_name }}
                            </p>
                        </div>

                        <div v-if="confirmAction !== 'bulk_confirm'" class="mb-4 p-4 bg-gray-50 rounded-lg">
                            <div class="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p class="text-gray-500">应收金额</p>
                                    <p class="font-medium">{{ formatCurrency(currentDifference?.planned_amount) }}</p>
                                </div>
                                <div>
                                    <p class="text-gray-500">实收金额</p>
                                    <p class="font-medium">{{ formatCurrency(currentDifference?.actual_amount) }}</p>
                                </div>
                                <div class="col-span-2">
                                    <p class="text-gray-500">差异金额</p>
                                    <p
                                        :class="[
                                            'font-medium',
                                            currentDifference?.difference_amount > 0 ? 'text-green-600' : 'text-red-600',
                                        ]"
                                    >
                                        {{ formatCurrency(currentDifference?.difference_amount) }}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-2">备注说明</label>
                            <textarea
                                v-model="remark"
                                rows="3"
                                class="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                placeholder="请输入备注说明（可选）"
                            ></textarea>
                        </div>

                        <div class="flex justify-end gap-3">
                            <button
                                type="button"
                                @click="showConfirmModal = false"
                                class="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md font-semibold text-xs text-gray-700 uppercase tracking-widest shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition ease-in-out duration-150"
                            >
                                取消
                            </button>
                            <button
                                type="button"
                                @click="executeAction"
                                :class="[
                                    'inline-flex items-center px-4 py-2 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest transition ease-in-out duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2',
                                    confirmAction === 'reject'
                                        ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                                        : 'bg-primary-600 hover:bg-primary-700 focus:ring-primary-500',
                                ]"
                            >
                                {{ confirmAction === 'reject' ? '确认驳回' : '确认提交' }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
