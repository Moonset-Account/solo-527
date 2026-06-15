<template>
    <div class="space-y-6">
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-bold text-gray-900">工作台</h1>
                <p class="text-sm text-gray-500 mt-1">合规数据总览与审阅效率看板</p>
            </div>
            <div class="flex items-center space-x-2">
                <select
                    v-model="period"
                    @change="updatePeriod"
                    class="text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                >
                    <option :value="7">最近7天</option>
                    <option :value="30">最近30天</option>
                    <option :value="90">最近90天</option>
                    <option :value="365">最近一年</option>
                </select>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                <div class="flex items-center">
                    <div class="flex-shrink-0 p-3 bg-blue-100 rounded-lg">
                        <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-gray-500">待处理缺口</p>
                        <p class="text-2xl font-bold text-gray-900">{{ statistics.open_gaps }}</p>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                <div class="flex items-center">
                    <div class="flex-shrink-0 p-3 bg-red-100 rounded-lg">
                        <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-gray-500">逾期缺口</p>
                        <p class="text-2xl font-bold text-red-600">{{ statistics.overdue_gaps }}</p>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                <div class="flex items-center">
                    <div class="flex-shrink-0 p-3 bg-green-100 rounded-lg">
                        <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                        </svg>
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-gray-500">关闭率</p>
                        <p class="text-2xl font-bold text-gray-900">{{ statistics.closure_rate }}%</p>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                <div class="flex items-center">
                    <div class="flex-shrink-0 p-3 bg-purple-100 rounded-lg">
                        <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-gray-500">平均处理时长</p>
                        <p class="text-2xl font-bold text-gray-900">{{ statistics.avg_resolution_hours }}h</p>
                    </div>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                <h3 class="text-lg font-medium text-gray-900 mb-4">缺口趋势</h3>
                <div class="h-64 flex items-end justify-between space-x-1">
                    <div
                        v-for="item in gapTrend"
                        :key="item.date"
                        class="flex-1 flex flex-col items-center"
                    >
                        <div class="w-full flex space-x-0.5 flex-1 items-end">
                            <div
                                class="flex-1 bg-blue-500 rounded-t"
                                :style="{ height: (item.created / maxGapCount) * 100 + '%' }"
                                :title="'创建: ' + item.created"
                            ></div>
                            <div
                                class="flex-1 bg-green-500 rounded-t"
                                :style="{ height: (item.closed / maxGapCount) * 100 + '%' }"
                                :title="'关闭: ' + item.closed"
                            ></div>
                        </div>
                        <span class="text-xs text-gray-500 mt-1">{{ formatDate(item.date) }}</span>
                    </div>
                </div>
                <div class="flex justify-center mt-4 space-x-4">
                    <div class="flex items-center">
                        <span class="w-3 h-3 bg-blue-500 rounded mr-2"></span>
                        <span class="text-sm text-gray-600">新增</span>
                    </div>
                    <div class="flex items-center">
                        <span class="w-3 h-3 bg-green-500 rounded mr-2"></span>
                        <span class="text-sm text-gray-600">关闭</span>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                <h3 class="text-lg font-medium text-gray-900 mb-4">严重程度分布</h3>
                <div class="space-y-4">
                    <div v-for="(count, severity) in severityDistribution" :key="severity">
                        <div class="flex justify-between text-sm mb-1">
                            <span class="text-gray-600">{{ severityLabels[severity] }}</span>
                            <span class="font-medium text-gray-900">{{ count }}</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                                class="h-2.5 rounded-full"
                                :class="severityClasses[severity]"
                                :style="{ width: (count / totalGaps) * 100 + '%' }"
                            ></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <h3 class="text-lg font-medium text-gray-900 mb-4">审阅效率排行</h3>
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">姓名</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">角色</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">部门</th>
                            <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">已处理缺口</th>
                            <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">平均审阅时长</th>
                            <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">平均处理时长</th>
                            <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">待处理任务</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        <tr v-for="user in reviewEfficiency" :key="user.user_id" class="hover:bg-gray-50">
                            <td class="px-4 py-3 whitespace-nowrap">
                                <div class="flex items-center">
                                    <div class="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                                        <span class="text-indigo-600 font-medium text-sm">{{ user.user_name.charAt(0) }}</span>
                                    </div>
                                    <span class="ml-2 text-sm font-medium text-gray-900">{{ user.user_name }}</span>
                                </div>
                            </td>
                            <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                {{ roleLabels[user.role] || user.role }}
                            </td>
                            <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                {{ user.department || '-' }}
                            </td>
                            <td class="px-4 py-3 whitespace-nowrap text-sm text-center font-medium text-gray-900">
                                {{ user.reviewed_gaps }}
                            </td>
                            <td class="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-600">
                                {{ user.avg_review_hours || '-' }}h
                            </td>
                            <td class="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-600">
                                {{ user.avg_handling_hours || '-' }}h
                            </td>
                            <td class="px-4 py-3 whitespace-nowrap text-center">
                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                    {{ user.pending_tasks }}
                                </span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                <h3 class="text-lg font-medium text-gray-900 mb-4">逾期项目</h3>
                <div class="space-y-3">
                    <div
                        v-for="item in overdueItems"
                        :key="item.id"
                        class="flex items-center justify-between p-3 bg-red-50 rounded-lg"
                    >
                        <div class="flex-1 min-w-0">
                            <p class="text-sm font-medium text-gray-900 truncate">{{ item.gap_no }}</p>
                            <p class="text-sm text-gray-500 truncate">{{ item.title }}</p>
                        </div>
                        <div class="ml-4 flex-shrink-0">
                            <SeverityBadge :severity="item.severity" />
                            <p class="text-xs text-red-600 mt-1 text-right">
                                逾期 {{ getDaysOverdue(item) }} 天
                            </p>
                        </div>
                    </div>
                    <p v-if="overdueItems.length === 0" class="text-sm text-gray-500 text-center py-4">
                        暂无逾期项目
                    </p>
                </div>
            </div>

            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                <h3 class="text-lg font-medium text-gray-900 mb-4">最近动态</h3>
                <div class="space-y-4">
                    <div
                        v-for="activity in recentActivities"
                        :key="activity.id"
                        class="flex items-start space-x-3"
                    >
                        <div class="flex-shrink-0 h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                            <span class="text-gray-600 font-medium text-xs">{{ activity.user_name?.charAt(0) }}</span>
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-sm text-gray-900">
                                <span class="font-medium">{{ activity.user_name }}</span>
                                <span class="text-gray-500">{{ actionLabels[activity.action_type] || activity.action_type }} - </span>
                                <span class="font-medium text-indigo-600">{{ activity.gap_no }}</span>
                            </p>
                            <p class="text-xs text-gray-500 mt-0.5">
                                {{ formatDateTime(activity.created_at) }}
                            </p>
                        </div>
                    </div>
                    <p v-if="recentActivities.length === 0" class="text-sm text-gray-500 text-center py-4">
                        暂无动态
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { router } from '@inertiajs/vue3'
import SeverityBadge from '@/Components/SeverityBadge.vue'

const props = defineProps({
    statistics: Object,
    gapTrend: Array,
    reviewEfficiency: Array,
    severityDistribution: Object,
    statusDistribution: Object,
    recentActivities: Array,
    myTasks: Object,
    overdueItems: Array,
    downloadStats: Object,
    period: String,
})

const period = ref(props.period)

const severityLabels = {
    critical: '严重',
    high: '高',
    medium: '中',
    low: '低'
}

const severityClasses = {
    critical: 'bg-red-500',
    high: 'bg-orange-500',
    medium: 'bg-yellow-500',
    low: 'bg-green-500'
}

const roleLabels = {
    admin: '管理员',
    compliance_manager: '合规经理',
    project_secretary: '项目秘书',
    user: '普通用户'
}

const actionLabels = {
    created: '创建了缺口',
    status_changed: '更新了状态',
    comment: '添加了评论',
    evidence_added: '上传了证据',
    assignee_changed: '变更了责任人',
    due_date_changed: '变更了期限'
}

const maxGapCount = computed(() => {
    let max = 0
    props.gapTrend?.forEach(item => {
        max = Math.max(max, item.created, item.closed)
    })
    return max || 1
})

const totalGaps = computed(() => {
    return Object.values(props.severityDistribution || {}).reduce((a, b) => a + b, 0) || 1
})

function updatePeriod() {
    router.get(route('dashboard'), { period: period.value }, { preserveState: true })
}

function formatDate(date) {
    const d = new Date(date)
    return (d.getMonth() + 1) + '/' + d.getDate()
}

function formatDateTime(date) {
    if (!date) return ''
    const d = new Date(date)
    return d.toLocaleString('zh-CN', {
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

function getDaysOverdue(item) {
    if (!item.due_date) return 0
    const due = new Date(item.due_date)
    const now = new Date()
    const diff = Math.floor((now - due) / (1000 * 60 * 60 * 24))
    return Math.max(0, diff)
}
</script>
