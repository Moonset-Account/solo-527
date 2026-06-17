<script setup>
import { ref, computed } from 'vue';
import { usePage, router } from '@inertiajs/vue3';
import DataTable from '@/Components/DataTable.vue';
import StatusBadge from '@/Components/StatusBadge.vue';
import CashFlowChart from '@/Components/CashFlowChart.vue';

const page = usePage();

const reportData = computed(() => page.props.reportData?.data || []);
const pagination = computed(() => page.props.reportData);
const summary = computed(() => page.props.summary || {});
const chartData = computed(() => page.props.chartData || { labels: [], datasets: [] });

const isExporting = ref(false);
const showChart = ref(true);

const filters = ref({
    project_id: page.props.filters?.project_id || '',
    date_from: page.props.filters?.date_from || '',
    date_to: page.props.filters?.date_to || '',
    type: page.props.filters?.type || '',
    status: page.props.filters?.status || '',
});

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
    { key: 'assignee_name', label: '责任人' },
    { key: 'discovered_at', label: '发现日期' },
    { key: 'resolved_at', label: '解决日期' },
    { key: 'status', label: '状态' },
];

const filterOptions = {
    projects: page.props.projects || [],
    types: [
        { value: 'amount_mismatch', label: '金额不符' },
        { value: 'date_mismatch', label: '日期不符' },
        { value: 'missing_record', label: '缺失记录' },
    ],
    statuses: [
        { value: 'pending', label: '待处理' },
        { value: 'confirmed', label: '已确认' },
        { value: 'processing', label: '处理中' },
        { value: 'completed', label: '已完成' },
        { value: 'written_off', label: '已冲销' },
        { value: 'rejected', label: '已驳回' },
    ],
};

const formatCurrency = (value) => {
    if (!value) return '-';
    return new Intl.NumberFormat('zh-CN', {
        style: 'currency',
        currency: 'CNY',
    }).format(value);
};

const handleFilter = () => {
    loadData();
};

const handleReset = () => {
    filters.value = {
        project_id: '',
        date_from: '',
        date_to: '',
        type: '',
        status: '',
    };
    loadData();
};

const handlePageChange = (page) => {
    loadData({ page });
};

const loadData = (params = {}) => {
    router.get(route('report.difference'), {
        ...filters.value,
        ...params,
    }, { preserveState: true });
};

const handleExport = (format) => {
    isExporting.value = true;

    router.get(route('report.difference.export'), {
        ...filters.value,
        format,
    }, {
        preserveState: true,
        onSuccess: () => {
            isExporting.value = false;
        },
        onError: () => {
            isExporting.value = false;
        },
    });
};

const chartDatasets = computed(() => {
    if (!chartData.value.datasets || chartData.value.datasets.length === 0) {
        return [
            {
                label: '差异金额',
                data: [120000, 190000, 150000, 220000, 180000, 250000, 210000],
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                borderColor: 'rgba(239, 68, 68, 1)',
            },
            {
                label: '已解决金额',
                data: [80000, 150000, 120000, 180000, 140000, 200000, 170000],
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                borderColor: 'rgba(16, 185, 129, 1)',
            },
        ];
    }
    return chartData.value.datasets;
});

const chartLabels = computed(() => {
    if (!chartData.value.labels || chartData.value.labels.length === 0) {
        return ['1月', '2月', '3月', '4月', '5月', '6月', '7月'];
    }
    return chartData.value.labels;
});
</script>

<template>
    <div class="py-12">
        <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div class="flex items-center justify-between mb-8">
                <div>
                    <h1 class="text-2xl font-bold text-gray-900">差异报表</h1>
                    <p class="mt-1 text-sm text-gray-600">查看和导出差异分析报表，支持多维度筛选</p>
                </div>
                <div class="flex gap-2">
                    <button
                        @click="handleExport('excel')"
                        :disabled="isExporting"
                        class="inline-flex items-center px-4 py-2 bg-green-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-green-700 focus:bg-green-700 active:bg-green-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition ease-in-out duration-150 disabled:opacity-50"
                    >
                        <svg v-if="isExporting" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <svg v-else class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        导出 Excel
                    </button>
                    <button
                        @click="handleExport('pdf')"
                        :disabled="isExporting"
                        class="inline-flex items-center px-4 py-2 bg-red-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-red-700 focus:bg-red-700 active:bg-red-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition ease-in-out duration-150 disabled:opacity-50"
                    >
                        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        导出 PDF
                    </button>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg p-4">
                    <p class="text-sm text-gray-500">差异总数</p>
                    <p class="text-2xl font-bold text-gray-900 mt-1">{{ summary.total || 0 }}</p>
                </div>
                <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg p-4">
                    <p class="text-sm text-gray-500">待处理</p>
                    <p class="text-2xl font-bold text-yellow-600 mt-1">{{ summary.pending || 0 }}</p>
                </div>
                <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg p-4">
                    <p class="text-sm text-gray-500">已完成</p>
                    <p class="text-2xl font-bold text-green-600 mt-1">{{ summary.completed || 0 }}</p>
                </div>
                <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg p-4">
                    <p class="text-sm text-gray-500">累计差异金额</p>
                    <p class="text-2xl font-bold text-red-600 mt-1">{{ formatCurrency(summary.total_amount) }}</p>
                </div>
            </div>

            <div class="bg-white rounded-lg shadow p-4 mb-4">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-semibold text-gray-900">筛选条件</h3>
                    <button
                        @click="showChart = !showChart"
                        class="text-sm text-primary-600 hover:text-primary-500 font-medium"
                    >
                        {{ showChart ? '隐藏图表' : '显示图表' }}
                    </button>
                </div>
                <div class="flex flex-wrap gap-4 items-end">
                    <div class="flex-1 min-w-[200px]">
                        <label class="block text-sm font-medium text-gray-700 mb-1">项目</label>
                        <select
                            v-model="filters.project_id"
                            class="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        >
                            <option value="">全部项目</option>
                            <option v-for="project in filterOptions.projects" :key="project.id" :value="project.id">
                                {{ project.name }}
                            </option>
                        </select>
                    </div>
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
                        <label class="block text-sm font-medium text-gray-700 mb-1">差异类型</label>
                        <select
                            v-model="filters.type"
                            class="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        >
                            <option value="">全部类型</option>
                            <option v-for="type in filterOptions.types" :key="type.value" :value="type.value">
                                {{ type.label }}
                            </option>
                        </select>
                    </div>
                    <div class="flex-1 min-w-[200px]">
                        <label class="block text-sm font-medium text-gray-700 mb-1">状态</label>
                        <select
                            v-model="filters.status"
                            class="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        >
                            <option value="">全部状态</option>
                            <option v-for="status in filterOptions.statuses" :key="status.value" :value="status.value">
                                {{ status.label }}
                            </option>
                        </select>
                    </div>
                    <div class="flex gap-2">
                        <button
                            @click="handleFilter"
                            class="inline-flex items-center px-4 py-2 bg-primary-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-primary-700 focus:bg-primary-700 active:bg-primary-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition ease-in-out duration-150"
                        >
                            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            筛选
                        </button>
                        <button
                            @click="handleReset"
                            class="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md font-semibold text-xs text-gray-700 uppercase tracking-widest shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition ease-in-out duration-150"
                        >
                            重置
                        </button>
                    </div>
                </div>
            </div>

            <div v-if="showChart" class="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6 mb-4">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">差异趋势图</h3>
                <div class="h-80">
                    <CashFlowChart
                        type="line"
                        :labels="chartLabels"
                        :datasets="chartDatasets"
                    />
                </div>
            </div>

            <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                <DataTable
                    :columns="columns"
                    :data="reportData"
                    :pagination="pagination"
                    @page-change="handlePageChange"
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
        </div>
    </div>
</template>
