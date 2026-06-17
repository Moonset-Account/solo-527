<script setup>
import { ref, computed } from 'vue';
import { usePage, Link } from '@inertiajs/vue3';
import AppLayout from '@/Layouts/AppLayout.vue';
import StatusBadge from '@/Components/StatusBadge.vue';
import CashFlowChart from '@/Components/CashFlowChart.vue';
import Timeline from '@/Components/Timeline.vue';
import DataTable from '@/Components/DataTable.vue';
import dayjs from 'dayjs';

const page = usePage();

const stats = computed(() => page.props.stats || {
    total_receivable: 12580000,
    total_received: 8620000,
    pending_amount: 3960000,
    overdue_amount: 1280000,
    total_projects: 28,
    active_projects: 15,
    pending_differences: 23,
    pending_writeoffs: 8,
});

const greeting = computed(() => {
    const hour = new Date().getHours();
    if (hour < 12) return '早上好';
    if (hour < 18) return '下午好';
    return '晚上好';
});

const today = computed(() => dayjs().format('YYYY年MM月DD日 dddd'));

const quickActions = [
    {
        name: '上传对账单',
        description: '上传银行对账单进行对账',
        icon: 'upload',
        href: route('statement.upload'),
        color: 'bg-blue-500',
    },
    {
        name: '确认差异',
        description: '处理待确认的对账差异',
        icon: 'check',
        href: route('difference.confirm'),
        color: 'bg-green-500',
        badge: stats.pending_differences,
    },
    {
        name: '差异分配',
        description: '分配差异给处理人员',
        icon: 'assign',
        href: route('admin.difference.index'),
        color: 'bg-yellow-500',
    },
    {
        name: '冲销管理',
        description: '管理坏账冲销申请',
        icon: 'writeoff',
        href: route('admin.writeoff.index'),
        color: 'bg-red-500',
        badge: stats.pending_writeoffs,
    },
];

const actionIcons = {
    upload: `<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>`,
    check: `<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
    assign: `<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>`,
    writeoff: `<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
};

const cashFlowLabels = computed(() => page.props.cashFlowLabels || ['1月', '2月', '3月', '4月', '5月', '6月']);

const cashFlowDatasets = computed(() => page.props.cashFlowDatasets || [
    {
        label: '实际回款',
        data: [800000, 1200000, 950000, 1500000, 1100000, 1800000],
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        borderColor: 'rgba(16, 185, 129, 1)',
        fill: true,
    },
    {
        label: '预期回款',
        data: [1000000, 1100000, 1200000, 1400000, 1500000, 1600000],
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderDash: [5, 5],
        fill: false,
    },
]);

const recentActivities = computed(() => page.props.recentActivities || [
    {
        id: 1,
        title: '对账单上传成功',
        description: '建设银行2026年6月对账单已上传，共128条记录',
        date: '10分钟前',
        status: 'completed',
        meta: { '操作人': '张三' },
    },
    {
        id: 2,
        title: '发现对账差异',
        description: '智慧城市一期项目金额差异 ¥20,000',
        date: '30分钟前',
        status: 'warning',
        meta: { '项目': '智慧城市一期' },
    },
    {
        id: 3,
        title: '差异已确认',
        description: 'ERP系统升级项目日期不符差异已确认处理',
        date: '1小时前',
        status: 'completed',
        meta: { '处理人': '李四' },
    },
    {
        id: 4,
        title: '冲销申请待审批',
        description: '移动端应用开发项目坏账冲销申请 ¥50,000',
        date: '2小时前',
        status: 'current',
        meta: { '申请人': '王五' },
        action: { key: 'approve', label: '处理' },
    },
    {
        id: 5,
        title: '款项到账',
        description: '数据分析平台项目尾款 ¥300,000 已到账',
        date: '3小时前',
        status: 'completed',
        meta: { '金额': '¥300,000' },
    },
]);

const pendingDifferences = computed(() => page.props.pendingDifferences?.data || [
    {
        id: 1,
        project_name: '智慧城市一期',
        difference_type: 'amount_mismatch',
        amount: 20000,
        assigned_to: '张三',
        created_at: '2026-06-17',
        status: 'pending',
    },
    {
        id: 2,
        project_name: 'ERP系统升级',
        difference_type: 'date_mismatch',
        amount: 800000,
        assigned_to: '李四',
        created_at: '2026-06-16',
        status: 'processing',
    },
    {
        id: 3,
        project_name: '移动端应用开发',
        difference_type: 'missing_record',
        amount: 250000,
        assigned_to: '王五',
        created_at: '2026-06-15',
        status: 'pending',
    },
    {
        id: 4,
        project_name: '数据分析平台',
        difference_type: 'amount_mismatch',
        amount: 50000,
        assigned_to: '张三',
        created_at: '2026-06-14',
        status: 'waiting_approval',
    },
]);

const differenceColumns = [
    { key: 'project_name', label: '项目名称' },
    {
        key: 'difference_type',
        label: '差异类型',
        render: (row) => {
            const types = {
                amount_mismatch: '金额不符',
                date_mismatch: '日期不符',
                missing_record: '缺失记录',
            };
            return types[row.difference_type] || row.difference_type;
        },
    },
    {
        key: 'amount',
        label: '涉及金额',
        render: (row) => formatCurrency(row.amount),
    },
    { key: 'assigned_to', label: '处理人' },
    { key: 'created_at', label: '创建时间' },
    { key: 'status', label: '状态' },
];

const formatCurrency = (value) => {
    if (!value) return '-';
    return new Intl.NumberFormat('zh-CN', {
        style: 'currency',
        currency: 'CNY',
    }).format(value);
};

const collectionRate = computed(() => {
    if (!stats.value.total_receivable) return 0;
    return ((stats.value.total_received / stats.value.total_receivable) * 100).toFixed(1);
});

const handleTimelineAction = (action, item) => {
    console.log('Action:', action, item);
};
</script>

<template>
    <AppLayout title="仪表盘">
        <div class="mb-8">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 class="text-2xl font-bold text-gray-900">
                        {{ greeting }}，欢迎回来！
                    </h1>
                    <p class="mt-1 text-sm text-gray-600">
                        今天是 {{ today }}，让我们开始工作吧
                    </p>
                </div>
                <div class="mt-4 md:mt-0 flex gap-3">
                    <Link
                        :href="route('report.difference')"
                        class="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md font-semibold text-xs text-gray-700 uppercase tracking-widest shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                    >
                        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                        查看报表
                    </Link>
                    <Link
                        :href="route('statement.upload')"
                        class="inline-flex items-center px-4 py-2 bg-primary-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-primary-700 focus:bg-primary-700 active:bg-primary-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                    >
                        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                        </svg>
                        上传对账单
                    </Link>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                <div class="p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-500">应收总额</p>
                            <p class="text-2xl font-bold text-gray-900 mt-1">{{ formatCurrency(stats.total_receivable) }}</p>
                        </div>
                        <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                        </div>
                    </div>
                    <div class="mt-4">
                        <div class="flex items-center justify-between text-sm">
                            <span class="text-gray-500">回款率</span>
                            <span class="font-medium text-gray-900">{{ collectionRate }}%</span>
                        </div>
                        <div class="mt-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                class="h-full bg-blue-500 rounded-full transition-all duration-500"
                                :style="{ width: `${collectionRate}%` }"
                            ></div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                <div class="p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-500">已收金额</p>
                            <p class="text-2xl font-bold text-green-600 mt-1">{{ formatCurrency(stats.total_received) }}</p>
                        </div>
                        <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                        </div>
                    </div>
                    <div class="mt-4 flex items-center text-sm">
                        <svg class="w-4 h-4 text-green-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                        </svg>
                        <span class="text-green-600 font-medium">+12.5%</span>
                        <span class="text-gray-500 ml-1">较上月</span>
                    </div>
                </div>
            </div>

            <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                <div class="p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-500">待收金额</p>
                            <p class="text-2xl font-bold text-yellow-600 mt-1">{{ formatCurrency(stats.pending_amount) }}</p>
                        </div>
                        <div class="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                            <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                        </div>
                    </div>
                    <div class="mt-4 flex items-center text-sm">
                        <span class="text-gray-500">涉及</span>
                        <span class="text-yellow-600 font-medium mx-1">{{ stats.active_projects }}</span>
                        <span class="text-gray-500">个项目</span>
                    </div>
                </div>
            </div>

            <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                <div class="p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-500">逾期金额</p>
                            <p class="text-2xl font-bold text-red-600 mt-1">{{ formatCurrency(stats.overdue_amount) }}</p>
                        </div>
                        <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                            <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                            </svg>
                        </div>
                    </div>
                    <div class="mt-4 flex items-center text-sm">
                        <span class="text-gray-500">最长逾期</span>
                        <span class="text-red-600 font-medium mx-1">15</span>
                        <span class="text-gray-500">天</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Link
                v-for="action in quickActions"
                :key="action.name"
                :href="action.href"
                class="bg-white overflow-hidden shadow-sm sm:rounded-lg hover:shadow-md transition-shadow group"
            >
                <div class="p-6">
                    <div class="flex items-start justify-between">
                        <div class="flex-1">
                            <p class="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                                {{ action.name }}
                            </p>
                            <p class="mt-1 text-sm text-gray-500">{{ action.description }}</p>
                        </div>
                        <div class="relative">
                            <div
                                :class="[
                                    'w-12 h-12 rounded-full flex items-center justify-center transition-transform group-hover:scale-110',
                                    action.color,
                                ]"
                                v-html="actionIcons[action.icon]"
                            ></div>
                            <span
                                v-if="action.badge"
                                class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
                            >
                                {{ action.badge }}
                            </span>
                        </div>
                    </div>
                </div>
            </Link>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div class="bg-white shadow-sm sm:rounded-lg">
                <div class="p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h2 class="text-lg font-semibold text-gray-900">现金流趋势</h2>
                        <Link
                            :href="route('dashboard.business-overview')"
                            class="text-sm text-primary-600 hover:text-primary-700 font-medium"
                        >
                            查看详情 →
                        </Link>
                    </div>
                    <div class="h-80">
                        <CashFlowChart
                            type="line"
                            :labels="cashFlowLabels"
                            :datasets="cashFlowDatasets"
                        />
                    </div>
                </div>
            </div>

            <div class="bg-white shadow-sm sm:rounded-lg">
                <div class="p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h2 class="text-lg font-semibold text-gray-900">最近动态</h2>
                        <button class="text-sm text-gray-500 hover:text-gray-700">
                            全部动态
                        </button>
                    </div>
                    <Timeline :items="recentActivities" @action="handleTimelineAction" />
                </div>
            </div>
        </div>

        <div class="bg-white shadow-sm sm:rounded-lg">
            <div class="p-6">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-lg font-semibold text-gray-900">待处理差异</h2>
                    <div class="flex gap-2">
                        <Link
                            :href="route('difference.confirm')"
                            class="inline-flex items-center px-3 py-1.5 bg-white border border-gray-300 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                        >
                            确认差异
                        </Link>
                        <Link
                            :href="route('admin.difference.index')"
                            class="inline-flex items-center px-3 py-1.5 bg-primary-600 border border-transparent rounded-md text-xs font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                        >
                            分配处理
                        </Link>
                    </div>
                </div>
                <DataTable
                    :columns="differenceColumns"
                    :data="pendingDifferences"
                    :pagination="null"
                >
                    <template #cell-status="{ row }">
                        <StatusBadge :status="row.status" size="sm" />
                    </template>
                    <template #cell-amount="{ row }">
                        <span class="font-medium text-red-600">
                            {{ formatCurrency(row.amount) }}
                        </span>
                    </template>
                </DataTable>
            </div>
        </div>
    </AppLayout>
</template>
