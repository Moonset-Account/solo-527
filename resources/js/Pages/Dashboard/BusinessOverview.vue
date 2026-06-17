<script setup>
import { ref, computed } from 'vue';
import { usePage } from '@inertiajs/vue3';
import Timeline from '@/Components/Timeline.vue';
import CashFlowChart from '@/Components/CashFlowChart.vue';
import StatusBadge from '@/Components/StatusBadge.vue';
import DataTable from '@/Components/DataTable.vue';

const page = usePage();

const activeTab = ref('timeline');

const stats = computed(() => page.props.stats || {
    total_receivable: 0,
    total_received: 0,
    pending_amount: 0,
    overdue_amount: 0,
    total_projects: 0,
    active_projects: 0,
});

const collectionTimeline = computed(() => page.props.collectionTimeline || [
    {
        id: 1,
        title: '付款提醒发送',
        date: '2026-06-01',
        description: '已向客户发送第一期付款提醒邮件',
        status: 'completed',
        meta: { '客户': 'ABC科技', '项目': '智慧城市一期' },
    },
    {
        id: 2,
        title: '电话跟进',
        date: '2026-06-05',
        description: '财务人员电话确认付款进度，客户表示正在走审批流程',
        status: 'completed',
        meta: { '跟进人': '张三' },
    },
    {
        id: 3,
        title: '第二期提醒',
        date: '2026-06-10',
        description: '发送第二期付款提醒，附带对账单明细',
        status: 'completed',
        meta: { '方式': '邮件+短信' },
    },
    {
        id: 4,
        title: '逾期预警',
        date: '2026-06-15',
        description: '付款已逾期3天，启动升级催收流程',
        status: 'warning',
        meta: { '逾期天数': '3天', '涉及金额': '¥500,000' },
        action: { key: 'escalate', label: '升级处理' },
    },
    {
        id: 5,
        title: '管理层介入',
        date: '2026-06-20',
        description: '计划由销售总监与客户高层沟通',
        status: 'pending',
    },
]);

const cashFlowLabels = computed(() => page.props.cashFlowLabels || ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']);

const cashFlowDatasets = computed(() => page.props.cashFlowDatasets || [
    {
        label: '实际回款',
        data: [800000, 1200000, 950000, 1500000, 1100000, 1800000, 1350000, 0, 0, 0, 0, 0],
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        borderColor: 'rgba(16, 185, 129, 1)',
        fill: true,
    },
    {
        label: '预测回款',
        data: [800000, 1200000, 950000, 1500000, 1100000, 1800000, 1350000, 1600000, 1400000, 1900000, 1700000, 2000000],
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderDash: [5, 5],
        fill: false,
    },
]);

const paymentRecords = computed(() => page.props.paymentRecords?.data || []);
const pagination = computed(() => page.props.paymentRecords);

const paymentColumns = [
    { key: 'id', label: '流水号', sortable: false },
    { key: 'project_name', label: '项目名称' },
    { key: 'payer_name', label: '付款方' },
    {
        key: 'amount',
        label: '金额',
        render: (row) => formatCurrency(row.amount),
    },
    { key: 'payment_method', label: '支付方式' },
    { key: 'transaction_date', label: '交易日期' },
    { key: 'status', label: '状态' },
];

const formatCurrency = (value) => {
    if (!value) return '-';
    return new Intl.NumberFormat('zh-CN', {
        style: 'currency',
        currency: 'CNY',
    }).format(value);
};

const handleTimelineAction = (action, item) => {
    console.log('Timeline action:', action, item);
};
</script>

<template>
    <div class="py-12">
        <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div class="mb-8">
                <h1 class="text-2xl font-bold text-gray-900">统一业务视角</h1>
                <p class="mt-1 text-sm text-gray-600">全面掌握项目尾款催收节奏、现金预测及付款流水</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
                <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg p-4">
                    <p class="text-sm text-gray-500">应收总额</p>
                    <p class="text-xl font-bold text-gray-900 mt-1">{{ formatCurrency(stats.total_receivable) }}</p>
                </div>
                <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg p-4">
                    <p class="text-sm text-gray-500">已收金额</p>
                    <p class="text-xl font-bold text-green-600 mt-1">{{ formatCurrency(stats.total_received) }}</p>
                </div>
                <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg p-4">
                    <p class="text-sm text-gray-500">待收金额</p>
                    <p class="text-xl font-bold text-yellow-600 mt-1">{{ formatCurrency(stats.pending_amount) }}</p>
                </div>
                <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg p-4">
                    <p class="text-sm text-gray-500">逾期金额</p>
                    <p class="text-xl font-bold text-red-600 mt-1">{{ formatCurrency(stats.overdue_amount) }}</p>
                </div>
                <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg p-4">
                    <p class="text-sm text-gray-500">项目总数</p>
                    <p class="text-xl font-bold text-gray-900 mt-1">{{ stats.total_projects }}</p>
                </div>
                <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg p-4">
                    <p class="text-sm text-gray-500">进行中项目</p>
                    <p class="text-xl font-bold text-primary-600 mt-1">{{ stats.active_projects }}</p>
                </div>
            </div>

            <div class="bg-white shadow-sm sm:rounded-lg mb-6">
                <div class="border-b border-gray-200">
                    <nav class="-mb-px flex space-x-8" aria-label="Tabs">
                        <button
                            @click="activeTab = 'timeline'"
                            :class="[
                                activeTab === 'timeline'
                                    ? 'border-primary-500 text-primary-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                                'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm',
                            ]"
                        >
                            催收节奏
                        </button>
                        <button
                            @click="activeTab = 'cashflow'"
                            :class="[
                                activeTab === 'cashflow'
                                    ? 'border-primary-500 text-primary-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                                'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm',
                            ]"
                        >
                            现金预测
                        </button>
                        <button
                            @click="activeTab = 'payments'"
                            :class="[
                                activeTab === 'payments'
                                    ? 'border-primary-500 text-primary-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                                'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm',
                            ]"
                        >
                            付款流水
                        </button>
                    </nav>
                </div>

                <div class="p-6">
                    <div v-show="activeTab === 'timeline'">
                        <div class="flex items-center justify-between mb-6">
                            <h3 class="text-lg font-semibold text-gray-900">催收节奏时间线</h3>
                            <button class="inline-flex items-center px-3 py-1.5 bg-primary-600 border border-transparent rounded-md text-xs font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
                                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                                </svg>
                                添加催收记录
                            </button>
                        </div>
                        <Timeline :items="collectionTimeline" @action="handleTimelineAction" />
                    </div>

                    <div v-show="activeTab === 'cashflow'">
                        <h3 class="text-lg font-semibold text-gray-900 mb-6">现金流预测图表</h3>
                        <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
                            <div class="lg:col-span-3 h-96">
                                <CashFlowChart
                                    type="line"
                                    :labels="cashFlowLabels"
                                    :datasets="cashFlowDatasets"
                                />
                            </div>
                            <div class="space-y-4">
                                <div class="p-4 bg-blue-50 rounded-lg">
                                    <p class="text-sm text-blue-700">本月预测回款</p>
                                    <p class="text-2xl font-bold text-blue-900 mt-1">{{ formatCurrency(1600000) }}</p>
                                    <p class="text-xs text-blue-600 mt-1">较上月 +18.5%</p>
                                </div>
                                <div class="p-4 bg-green-50 rounded-lg">
                                    <p class="text-sm text-green-700">已完成回款率</p>
                                    <p class="text-2xl font-bold text-green-900 mt-1">68.5%</p>
                                    <p class="text-xs text-green-600 mt-1">目标: 85%</p>
                                </div>
                                <div class="p-4 bg-yellow-50 rounded-lg">
                                    <p class="text-sm text-yellow-700">待确认款项</p>
                                    <p class="text-2xl font-bold text-yellow-900 mt-1">{{ formatCurrency(450000) }}</p>
                                    <p class="text-xs text-yellow-600 mt-1">涉及 3 个项目</p>
                                </div>
                                <div class="p-4 bg-red-50 rounded-lg">
                                    <p class="text-sm text-red-700">逾期未收</p>
                                    <p class="text-2xl font-bold text-red-900 mt-1">{{ formatCurrency(280000) }}</p>
                                    <p class="text-xs text-red-600 mt-1">最长逾期 15 天</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div v-show="activeTab === 'payments'">
                        <div class="flex items-center justify-between mb-6">
                            <h3 class="text-lg font-semibold text-gray-900">付款流水列表</h3>
                            <div class="flex gap-2">
                                <button class="inline-flex items-center px-3 py-1.5 bg-white border border-gray-300 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
                                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    导出
                                </button>
                            </div>
                        </div>
                        <DataTable
                            :columns="paymentColumns"
                            :data="paymentRecords"
                            :pagination="pagination"
                        >
                            <template #cell-status="{ row }">
                                <StatusBadge :status="row.status" size="sm" />
                            </template>
                            <template #cell-amount="{ row }">
                                <span class="font-medium text-green-600">
                                    {{ formatCurrency(row.amount) }}
                                </span>
                            </template>
                        </DataTable>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
