<script setup>
import { ref, computed } from 'vue';
import { usePage, router } from '@inertiajs/vue3';
import DataTable from '@/Components/DataTable.vue';
import StatusBadge from '@/Components/StatusBadge.vue';

const page = usePage();

const activeTab = ref('responsibility');

const responsibilityData = computed(() => page.props.responsibilityData?.data || []);
const processingData = computed(() => page.props.processingData?.data || []);
const auditLogs = computed(() => page.props.auditLogs?.data || []);

const responsibilityPagination = computed(() => page.props.responsibilityData);
const processingPagination = computed(() => page.props.processingData);
const auditPagination = computed(() => page.props.auditLogs);

const filters = ref({
    date_from: page.props.filters?.date_from || '',
    date_to: page.props.filters?.date_to || '',
    assignee_id: page.props.filters?.assignee_id || '',
});

const responsibilityColumns = [
    { key: 'assignee_name', label: '责任人' },
    { key: 'department', label: '部门' },
    {
        key: 'total_count',
        label: '分配总数',
        render: (row) => `${row.total_count} 条`,
    },
    {
        key: 'completed_count',
        label: '已完成',
        render: (row) => `${row.completed_count} 条`,
    },
    {
        key: 'pending_count',
        label: '处理中',
        render: (row) => `${row.pending_count} 条`,
    },
    {
        key: 'overdue_count',
        label: '已逾期',
        render: (row) => `${row.overdue_count} 条`,
    },
    {
        key: 'completion_rate',
        label: '完成率',
        render: (row) => `${row.completion_rate}%`,
    },
    {
        key: 'avg_processing_days',
        label: '平均处理时长',
        render: (row) => `${row.avg_processing_days} 天`,
    },
];

const processingColumns = [
    { key: 'id', label: '差异ID' },
    { key: 'project_name', label: '项目名称' },
    { key: 'type', label: '差异类型' },
    {
        key: 'difference_amount',
        label: '差异金额',
        render: (row) => formatCurrency(row.difference_amount),
    },
    { key: 'assignee_name', label: '责任人' },
    { key: 'assigned_at', label: '分配时间' },
    { key: 'deadline', label: '处理时限' },
    {
        key: 'processing_days',
        label: '已处理天数',
        render: (row) => `${row.processing_days} 天`,
    },
    { key: 'status', label: '状态' },
];

const auditColumns = [
    { key: 'id', label: '日志ID' },
    { key: 'action', label: '操作类型' },
    { key: 'target_type', label: '操作对象' },
    { key: 'target_id', label: '关联ID' },
    { key: 'operator_name', label: '操作人' },
    { key: 'created_at', label: '操作时间' },
    { key: 'ip_address', label: 'IP地址' },
];

const formatCurrency = (value) => {
    if (!value) return '-';
    return new Intl.NumberFormat('zh-CN', {
        style: 'currency',
        currency: 'CNY',
    }).format(value);
};

const getProcessingStatusColor = (days, deadline) => {
    if (!deadline) return 'text-gray-600';

    const deadlineDate = new Date(deadline);
    const today = new Date();
    const remainingDays = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));

    if (remainingDays < 0) return 'text-red-600 font-medium';
    if (remainingDays <= 3) return 'text-orange-600 font-medium';
    return 'text-gray-600';
};

const handleFilter = () => {
    router.get(route('dashboard.review'), {
        ...filters.value,
        tab: activeTab.value,
    }, { preserveState: true });
};

const handleRowAction = (action, row) => {
    console.log('Row action:', action, row);
};

const rowActions = [
    { key: 'view', label: '查看详情', variant: 'secondary' },
];
</script>

<template>
    <div class="py-12">
        <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div class="mb-8">
                <h1 class="text-2xl font-bold text-gray-900">复盘面板</h1>
                <p class="mt-1 text-sm text-gray-600">追踪责任人绩效、处理时间记录及审计日志</p>
            </div>

            <div class="bg-white rounded-lg shadow p-4 mb-6">
                <div class="flex flex-wrap gap-4 items-end">
                    <div class="flex-1 min-w-[200px]">
                        <label class="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
                        <input
                            v-model="filters.date_from"
                            type="date"
                            class="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                    </div>
                    <div class="flex-1 min-w-[200px]">
                        <label class="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
                        <input
                            v-model="filters.date_to"
                            type="date"
                            class="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                    </div>
                    <div class="flex-1 min-w-[200px]">
                        <label class="block text-sm font-medium text-gray-700 mb-1">责任人</label>
                        <select
                            v-model="filters.assignee_id"
                            class="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        >
                            <option value="">全部责任人</option>
                            <option v-for="user in page.props.users" :key="user.id" :value="user.id">
                                {{ user.name }}
                            </option>
                        </select>
                    </div>
                    <div class="flex gap-2">
                        <button
                            @click="handleFilter"
                            class="inline-flex items-center px-4 py-2 bg-primary-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-primary-700 focus:bg-primary-700 active:bg-primary-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition ease-in-out duration-150"
                        >
                            查询
                        </button>
                    </div>
                </div>
            </div>

            <div class="bg-white shadow-sm sm:rounded-lg mb-6">
                <div class="border-b border-gray-200">
                    <nav class="-mb-px flex space-x-8" aria-label="Tabs">
                        <button
                            @click="activeTab = 'responsibility'"
                            :class="[
                                activeTab === 'responsibility'
                                    ? 'border-primary-500 text-primary-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                                'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm',
                            ]"
                        >
                            责任人定位
                        </button>
                        <button
                            @click="activeTab = 'processing'"
                            :class="[
                                activeTab === 'processing'
                                    ? 'border-primary-500 text-primary-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                                'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm',
                            ]"
                        >
                            处理时间追踪
                        </button>
                        <button
                            @click="activeTab = 'audit'"
                            :class="[
                                activeTab === 'audit'
                                    ? 'border-primary-500 text-primary-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                                'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm',
                            ]"
                        >
                            审计日志
                        </button>
                    </nav>
                </div>

                <div class="p-6">
                    <div v-show="activeTab === 'responsibility'">
                        <h3 class="text-lg font-semibold text-gray-900 mb-6">责任人绩效概览</h3>
                        <DataTable
                            :columns="responsibilityColumns"
                            :data="responsibilityData"
                            :pagination="responsibilityPagination"
                            :row-actions="rowActions"
                            @row-action="handleRowAction"
                        >
                            <template #cell-completion_rate="{ row }">
                                <div class="flex items-center gap-2">
                                    <div class="w-24 bg-gray-200 rounded-full h-2">
                                        <div
                                            class="h-2 rounded-full"
                                            :class="[
                                                row.completion_rate >= 80 ? 'bg-green-500' :
                                                row.completion_rate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                            ]"
                                            :style="{ width: `${row.completion_rate}%` }"
                                        ></div>
                                    </div>
                                    <span class="text-sm font-medium">{{ row.completion_rate }}%</span>
                                </div>
                            </template>
                            <template #cell-overdue_count="{ row }">
                                <span
                                    :class="[
                                        'font-medium',
                                        row.overdue_count > 0 ? 'text-red-600' : 'text-gray-600',
                                    ]"
                                >
                                    {{ row.overdue_count }} 条
                                </span>
                            </template>
                        </DataTable>
                    </div>

                    <div v-show="activeTab === 'processing'">
                        <h3 class="text-lg font-semibold text-gray-900 mb-6">处理时间追踪</h3>
                        <DataTable
                            :columns="processingColumns"
                            :data="processingData"
                            :pagination="processingPagination"
                            :row-actions="rowActions"
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
                            <template #cell-deadline="{ row }">
                                <div>
                                    <p class="text-sm text-gray-900">{{ row.deadline }}</p>
                                    <p :class="getProcessingStatusColor(row.processing_days, row.deadline)">
                                        {{ getProcessingStatusColor(row.processing_days, row.deadline).includes('red')
                                            ? '已逾期'
                                            : getProcessingStatusColor(row.processing_days, row.deadline).includes('orange')
                                            ? '即将到期'
                                            : '处理中' }}
                                    </p>
                                </div>
                            </template>
                        </DataTable>
                    </div>

                    <div v-show="activeTab === 'audit'">
                        <div class="flex items-center justify-between mb-6">
                            <h3 class="text-lg font-semibold text-gray-900">审计日志</h3>
                            <button class="inline-flex items-center px-3 py-1.5 bg-white border border-gray-300 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
                                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                导出日志
                            </button>
                        </div>
                        <DataTable
                            :columns="auditColumns"
                            :data="auditLogs"
                            :pagination="auditPagination"
                        >
                            <template #cell-action="{ row }">
                                <span
                                    :class="[
                                        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                                        row.action === 'create' ? 'bg-green-100 text-green-800' :
                                        row.action === 'update' ? 'bg-blue-100 text-blue-800' :
                                        row.action === 'delete' ? 'bg-red-100 text-red-800' :
                                        row.action === 'approve' ? 'bg-purple-100 text-purple-800' :
                                        'bg-gray-100 text-gray-800',
                                    ]"
                                >
                                    {{ row.action_label }}
                                </span>
                            </template>
                            <template #cell-target_type="{ row }">
                                <span class="text-sm text-gray-600">{{ row.target_type_label }}</span>
                            </template>
                        </DataTable>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
