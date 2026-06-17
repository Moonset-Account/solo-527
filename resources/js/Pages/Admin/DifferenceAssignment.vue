<script setup>
import { ref, computed } from 'vue';
import { usePage, router, useForm } from '@inertiajs/vue3';
import DataTable from '@/Components/DataTable.vue';
import StatusBadge from '@/Components/StatusBadge.vue';

const page = usePage();

const differences = computed(() => page.props.differences?.data || []);
const pagination = computed(() => page.props.differences);
const users = computed(() => page.props.users || []);

const showAssignModal = ref(false);
const selectedDifferences = ref([]);
const currentDifference = ref(null);
const isBulkAssign = ref(false);

const form = useForm({
    assignee_id: '',
    deadline: '',
    priority: 'medium',
    remark: '',
});

const filters = ref({
    status: page.props.filters?.status || 'confirmed',
    project_id: page.props.filters?.project_id || '',
    type: page.props.filters?.type || '',
});

const columns = [
    { key: 'id', label: 'ID', sortable: false },
    { key: 'project_name', label: '项目名称' },
    { key: 'type', label: '差异类型' },
    {
        key: 'difference_amount',
        label: '差异金额',
        render: (row) => formatCurrency(row.difference_amount),
    },
    { key: 'discovered_at', label: '发现日期' },
    { key: 'assignee_name', label: '当前责任人' },
    { key: 'deadline', label: '处理时限' },
    { key: 'status', label: '状态' },
];

const rowActions = [
    { key: 'assign', label: '分配', variant: 'primary' },
    { key: 'reassign', label: '重新分配', variant: 'secondary' },
];

const priorityOptions = [
    { value: 'low', label: '低', color: 'bg-gray-100 text-gray-800' },
    { value: 'medium', label: '中', color: 'bg-blue-100 text-blue-800' },
    { value: 'high', label: '高', color: 'bg-orange-100 text-orange-800' },
    { value: 'urgent', label: '紧急', color: 'bg-red-100 text-red-800' },
];

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
        status: 'confirmed',
        project_id: '',
        type: '',
    };
    loadData();
};

const handlePageChange = (page) => {
    loadData({ page });
};

const loadData = (params = {}) => {
    router.get(route('admin.difference.assignment'), {
        ...filters.value,
        ...params,
    }, { preserveState: true });
};

const handleRowAction = (action, row) => {
    currentDifference.value = row;
    isBulkAssign.value = false;
    form.reset();

    if (action === 'reassign' && row.assignee_id) {
        form.assignee_id = row.assignee_id;
        form.deadline = row.deadline || '';
        form.priority = row.priority || 'medium';
    }

    showAssignModal.value = true;
};

const handleBulkAssign = () => {
    isBulkAssign.value = true;
    currentDifference.value = null;
    form.reset();
    showAssignModal.value = true;
};

const submitAssignment = () => {
    const data = {
        ids: isBulkAssign.value ? selectedDifferences.value : [currentDifference.value.id],
        assignee_id: form.assignee_id,
        deadline: form.deadline,
        priority: form.priority,
        remark: form.remark,
    };

    router.post(route('admin.difference.assign'), data, {
        preserveScroll: true,
        onSuccess: () => {
            showAssignModal.value = false;
            selectedDifferences.value = [];
            form.reset();
        },
    });
};

const getDaysRemaining = (deadline) => {
    if (!deadline) return null;
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
};
</script>

<template>
    <div class="py-12">
        <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div class="mb-8">
                <h1 class="text-2xl font-bold text-gray-900">差异分配</h1>
                <p class="mt-1 text-sm text-gray-600">为已确认的差异分配处理责任人并设置处理时限</p>
            </div>

            <div class="bg-white rounded-lg shadow p-4 mb-4">
                <div class="flex flex-wrap gap-4 items-end">
                    <div class="flex-1 min-w-[200px]">
                        <label class="block text-sm font-medium text-gray-700 mb-1">状态</label>
                        <select
                            v-model="filters.status"
                            @change="handleFilter({ status: filters.status })"
                            class="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        >
                            <option value="confirmed">已确认待分配</option>
                            <option value="processing">处理中</option>
                            <option value="all">全部</option>
                        </select>
                    </div>
                    <div class="flex-1 min-w-[200px]">
                        <label class="block text-sm font-medium text-gray-700 mb-1">项目</label>
                        <select
                            v-model="filters.project_id"
                            @change="handleFilter({ project_id: filters.project_id })"
                            class="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        >
                            <option value="">全部项目</option>
                            <option v-for="project in page.props.projects" :key="project.id" :value="project.id">
                                {{ project.name }}
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
                            @click="handleBulkAssign"
                            class="inline-flex items-center px-4 py-2 bg-primary-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-primary-700 focus:bg-primary-700 active:bg-primary-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition ease-in-out duration-150"
                        >
                            批量分配
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
                    <template #cell-assignee_name="{ row }">
                        <span v-if="row.assignee_name" class="text-sm text-gray-900">
                            {{ row.assignee_name }}
                        </span>
                        <span v-else class="text-sm text-gray-400">
                            未分配
                        </span>
                    </template>
                    <template #cell-deadline="{ row }">
                        <div v-if="row.deadline">
                            <p class="text-sm text-gray-900">{{ row.deadline }}</p>
                            <p
                                :class="[
                                    'text-xs',
                                    getDaysRemaining(row.deadline) < 0
                                        ? 'text-red-600 font-medium'
                                        : getDaysRemaining(row.deadline) <= 3
                                        ? 'text-orange-600'
                                        : 'text-gray-500',
                                ]"
                            >
                                {{ getDaysRemaining(row.deadline) < 0
                                    ? `已逾期 ${Math.abs(getDaysRemaining(row.deadline))} 天`
                                    : `剩余 ${getDaysRemaining(row.deadline)} 天` }}
                            </p>
                        </div>
                        <span v-else class="text-sm text-gray-400">-</span>
                    </template>
                </DataTable>
            </div>

            <div v-if="showAssignModal" class="fixed inset-0 overflow-y-auto z-50">
                <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
                    <div class="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" @click="showAssignModal = false"></div>

                    <div class="relative inline-block w-full max-w-lg p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
                        <div class="mb-6">
                            <h3 class="text-lg font-semibold text-gray-900">
                                {{ isBulkAssign ? '批量分配差异' : '分配差异处理' }}
                            </h3>
                            <p v-if="!isBulkAssign" class="mt-1 text-sm text-gray-500">
                                项目: {{ currentDifference?.project_name }}
                            </p>
                            <p v-else class="mt-1 text-sm text-gray-500">
                                已选择 {{ selectedDifferences.length }} 条记录
                            </p>
                        </div>

                        <div v-if="!isBulkAssign" class="mb-6 p-4 bg-gray-50 rounded-lg">
                            <div class="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p class="text-gray-500">差异类型</p>
                                    <p class="font-medium">
                                        <StatusBadge :status="currentDifference?.type" size="sm" />
                                    </p>
                                </div>
                                <div>
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

                        <form @submit.prevent="submitAssignment" class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">
                                    处理责任人 <span class="text-red-500">*</span>
                                </label>
                                <select
                                    v-model="form.assignee_id"
                                    class="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                    required
                                >
                                    <option value="">请选择责任人</option>
                                    <option v-for="user in users" :key="user.id" :value="user.id">
                                        {{ user.name }} ({{ user.department }})
                                    </option>
                                </select>
                                <p v-if="form.errors.assignee_id" class="mt-1 text-sm text-red-600">
                                    {{ form.errors.assignee_id }}
                                </p>
                            </div>

                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">
                                        处理时限 <span class="text-red-500">*</span>
                                    </label>
                                    <input
                                        v-model="form.deadline"
                                        type="date"
                                        :min="new Date().toISOString().split('T')[0]"
                                        class="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                        required
                                    />
                                    <p v-if="form.errors.deadline" class="mt-1 text-sm text-red-600">
                                        {{ form.errors.deadline }}
                                    </p>
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">
                                        优先级
                                    </label>
                                    <select
                                        v-model="form.priority"
                                        class="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                    >
                                        <option v-for="option in priorityOptions" :key="option.value" :value="option.value">
                                            {{ option.label }}
                                        </option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">
                                    备注说明
                                </label>
                                <textarea
                                    v-model="form.remark"
                                    rows="3"
                                    class="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                    placeholder="请输入分配备注（可选）"
                                ></textarea>
                            </div>

                            <div class="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    @click="showAssignModal = false"
                                    class="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md font-semibold text-xs text-gray-700 uppercase tracking-widest shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition ease-in-out duration-150"
                                >
                                    取消
                                </button>
                                <button
                                    type="submit"
                                    :disabled="form.processing"
                                    class="inline-flex items-center px-4 py-2 bg-primary-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-primary-700 focus:bg-primary-700 active:bg-primary-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition ease-in-out duration-150 disabled:opacity-50"
                                >
                                    <svg v-if="form.processing" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    确认分配
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
