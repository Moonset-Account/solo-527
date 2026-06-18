<script setup>
import { computed, ref } from 'vue'
import { Link, router } from '@inertiajs/vue3'
import Layout from '@/Components/Layout.vue'

const props = defineProps({
    windows: Object,
    filters: Object,
})

const isAdmin = computed(() => {
    return window.page?.props?.auth?.user?.role === 'admin' ||
           window.page?.props?.auth?.user?.role === 'manager'
})

const filters = ref({
    keyword: props.filters.keyword || '',
    status: props.filters.status || '',
    start_date: props.filters.start_date || '',
    end_date: props.filters.end_date || '',
    per_page: props.filters.per_page || 20,
})

const getStatusBadgeClass = (status) => {
    const classes = {
        scheduled: 'bg-blue-100 text-blue-800',
        approved: 'bg-green-100 text-green-800',
        in_progress: 'bg-yellow-100 text-yellow-800',
        completed: 'bg-gray-100 text-gray-800',
        cancelled: 'bg-red-100 text-red-800',
    }
    return classes[status] || 'bg-gray-100 text-gray-800'
}

const getStatusText = (status) => {
    const texts = {
        scheduled: '已排期',
        approved: '已批准',
        in_progress: '进行中',
        completed: '已完成',
        cancelled: '已取消',
    }
    return texts[status] || status
}

const getRiskBadgeClass = (risk) => {
    const classes = {
        low: 'bg-green-100 text-green-800',
        medium: 'bg-yellow-100 text-yellow-800',
        high: 'bg-red-100 text-red-800',
    }
    return classes[risk] || 'bg-gray-100 text-gray-800'
}

const getRiskText = (risk) => {
    const texts = {
        low: '低风险',
        medium: '中风险',
        high: '高风险',
    }
    return texts[risk] || risk
}

const applyFilters = () => {
    router.get(route('change-windows.index'), filters.value, { preserveState: true })
}

const resetFilters = () => {
    filters.value = {
        keyword: '',
        status: '',
        start_date: '',
        end_date: '',
        per_page: 20,
    }
    router.get(route('change-windows.index'), {}, { preserveState: true })
}

const exportData = () => {
    window.open(route('change-windows.export', filters.value), '_blank')
}
</script>

<template>
    <Layout title="变更窗口">
        <div class="mb-4 flex justify-between items-center">
            <div class="flex space-x-2">
                <Link
                    :href="route('change-windows.calendar')"
                    class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                    日历视图
                </Link>
                <Link
                    v-if="isAdmin"
                    :href="route('change-windows.create')"
                    class="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                >
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                    创建变更
                </Link>
            </div>
            <div class="flex space-x-2">
                <button
                    v-if="isAdmin"
                    @click="exportData"
                    class="px-3 py-1.5 text-sm font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200"
                >
                    导出CSV
                </button>
            </div>
        </div>

        <div class="bg-white rounded-lg shadow mb-4">
            <div class="p-4 border-b border-gray-200">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">关键词</label>
                        <input
                            v-model="filters.keyword"
                            type="text"
                            @keyup.enter="applyFilters"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                            placeholder="搜索标题、系统..."
                        />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">状态</label>
                        <select
                            v-model="filters.status"
                            @change="applyFilters"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">全部</option>
                            <option value="scheduled">已排期</option>
                            <option value="approved">已批准</option>
                            <option value="in_progress">进行中</option>
                            <option value="completed">已完成</option>
                            <option value="cancelled">已取消</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
                        <input
                            v-model="filters.start_date"
                            type="date"
                            @change="applyFilters"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
                        <input
                            v-model="filters.end_date"
                            type="date"
                            @change="applyFilters"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>
                <div class="mt-4 flex justify-end space-x-2">
                    <button
                        @click="resetFilters"
                        class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    >
                        重置
                    </button>
                    <button
                        @click="applyFilters"
                        class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                    >
                        查询
                    </button>
                </div>
            </div>
        </div>

        <div class="bg-white rounded-lg shadow overflow-hidden">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">标题</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">风险等级</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">影响系统</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">时间窗口</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">申请人</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    <tr v-if="windows.data?.length === 0">
                        <td colspan="7" class="px-4 py-8 text-center text-gray-500">
                            暂无变更数据
                        </td>
                    </tr>
                    <tr v-for="window in windows.data" :key="window.id" class="hover:bg-gray-50">
                        <td class="px-4 py-3">
                            <Link :href="route('change-windows.show', window.id)" class="text-sm font-medium text-gray-900 hover:text-blue-600">
                                {{ window.title }}
                            </Link>
                        </td>
                        <td class="px-4 py-3">
                            <span :class="getRiskBadgeClass(window.risk_level)" class="px-2 py-1 text-xs font-medium rounded-full">
                                {{ getRiskText(window.risk_level) }}
                            </span>
                        </td>
                        <td class="px-4 py-3 text-sm text-gray-500">{{ window.affected_systems }}</td>
                        <td class="px-4 py-3">
                            <span :class="getStatusBadgeClass(window.status)" class="px-2 py-1 text-xs font-medium rounded-full">
                                {{ getStatusText(window.status) }}
                            </span>
                        </td>
                        <td class="px-4 py-3 text-sm text-gray-500">
                            <div>{{ window.start_time }}</div>
                            <div class="text-xs text-gray-400">至 {{ window.end_time }}</div>
                        </td>
                        <td class="px-4 py-3 text-sm text-gray-900">{{ window.creator?.name }}</td>
                        <td class="px-4 py-3 text-sm">
                            <div class="flex space-x-2">
                                <Link
                                    :href="route('change-windows.show', window.id)"
                                    class="text-blue-600 hover:text-blue-900"
                                >
                                    详情
                                </Link>
                                <Link
                                    v-if="isAdmin && window.status === 'scheduled'"
                                    :href="route('change-windows.approve', window.id)"
                                    as="button"
                                    method="post"
                                    class="text-green-600 hover:text-green-900"
                                >
                                    批准
                                </Link>
                                <Link
                                    v-if="window.status === 'approved'"
                                    :href="route('change-windows.start', window.id)"
                                    as="button"
                                    method="post"
                                    class="text-yellow-600 hover:text-yellow-900"
                                >
                                    开始
                                </Link>
                                <Link
                                    v-if="window.status === 'in_progress'"
                                    :href="route('change-windows.complete', window.id)"
                                    as="button"
                                    method="post"
                                    class="text-green-600 hover:text-green-900"
                                >
                                    完成
                                </Link>
                                <Link
                                    v-if="isAdmin && ['scheduled', 'approved'].includes(window.status)"
                                    :href="route('change-windows.cancel', window.id)"
                                    as="button"
                                    method="post"
                                    class="text-red-600 hover:text-red-900"
                                >
                                    取消
                                </Link>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="mt-4 flex justify-between items-center">
            <div class="text-sm text-gray-500">
                共 {{ windows.total }} 条
            </div>
            <div v-if="windows.links" class="flex space-x-1">
                <Link
                    v-for="(link, index) in windows.links"
                    :key="index"
                    :href="link.url || '#'"
                    v-html="link.label"
                    class="px-3 py-1 text-sm rounded-md border"
                    :class="link.active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'"
                />
            </div>
        </div>
    </Layout>
</template>
