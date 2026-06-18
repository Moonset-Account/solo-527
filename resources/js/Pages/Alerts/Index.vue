<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { Link, router, useForm } from '@inertiajs/vue3'
import Layout from '@/Components/Layout.vue'

const props = defineProps({
    alerts: Object,
    filters: Object,
    savedQueries: Array,
})

const isAdmin = computed(() => {
    return window.page?.props?.auth?.user?.role === 'admin' ||
           window.page?.props?.auth?.user?.role === 'manager'
})

const selectedAlerts = ref([])
const showSaveQueryModal = ref(false)
const savedQueryForm = useForm({
    name: '',
    description: '',
    is_public: false,
})

const filters = ref({
    keyword: props.filters.keyword || '',
    status: props.filters.status || '',
    level: props.filters.level || '',
    start_date: props.filters.start_date || '',
    end_date: props.filters.end_date || '',
    is_inspected: props.filters.is_inspected || '',
    per_page: props.filters.per_page || 20,
})

const getLevelColor = (level) => {
    const colors = {
        critical: 'bg-red-500',
        warning: 'bg-yellow-500',
        info: 'bg-blue-500',
        debug: 'bg-gray-500',
    }
    return colors[level] || 'bg-gray-500'
}

const getLevelText = (level) => {
    const texts = {
        critical: '严重',
        warning: '警告',
        info: '信息',
        debug: '调试',
    }
    return texts[level] || level
}

const getStatusBadgeClass = (status) => {
    const classes = {
        open: 'bg-red-100 text-red-800',
        acknowledged: 'bg-yellow-100 text-yellow-800',
        processing: 'bg-blue-100 text-blue-800',
        resolved: 'bg-green-100 text-green-800',
        closed: 'bg-gray-100 text-gray-800',
    }
    return classes[status] || 'bg-gray-100 text-gray-800'
}

const getStatusText = (status) => {
    const texts = {
        open: '待处理',
        acknowledged: '已确认',
        processing: '处理中',
        resolved: '已解决',
        closed: '已关闭',
    }
    return texts[status] || status
}

const applyFilters = () => {
    router.get(route('alerts.index'), filters.value, { preserveState: true })
}

const resetFilters = () => {
    filters.value = {
        keyword: '',
        status: '',
        level: '',
        start_date: '',
        end_date: '',
        is_inspected: '',
        per_page: 20,
    }
    router.get(route('alerts.index'), {}, { preserveState: true })
}

const loadSavedQuery = (query) => {
    filters.value = { ...filters.value, ...query.query_params }
    applyFilters()
}

const saveCurrentQuery = () => {
    savedQueryForm.post(route('saved-queries.store'), {
        data: {
            ...savedQueryForm.data(),
            resource_type: 'alerts',
            query_params: JSON.stringify(filters.value),
        },
        onSuccess: () => {
            showSaveQueryModal.value = false
            savedQueryForm.reset()
        },
    })
}

const toggleSelectAll = () => {
    if (selectedAlerts.value.length === props.alerts.data.length) {
        selectedAlerts.value = []
    } else {
        selectedAlerts.value = props.alerts.data.map(a => a.id)
    }
}

const batchAcknowledge = () => {
    if (selectedAlerts.value.length === 0) return
    if (!confirm(`确认将 ${selectedAlerts.value.length} 条告警标记为已确认？`)) return
    router.post(route('alerts.batch-acknowledge'), { ids: selectedAlerts.value })
}

const batchClose = () => {
    if (selectedAlerts.value.length === 0) return
    if (!confirm(`确认关闭 ${selectedAlerts.value.length} 条告警？`)) return
    router.post(route('alerts.batch-close'), { ids: selectedAlerts.value })
}

const exportAlerts = () => {
    window.open(route('alerts.export', filters.value), '_blank')
}

watch(filters, (newVal, oldVal) => {
    if (newVal.per_page !== oldVal.per_page) {
        applyFilters()
    }
}, { deep: true })
</script>

<template>
    <Layout title="告警管理">
        <div class="mb-4 flex justify-between items-center">
            <div class="flex items-center space-x-4">
                <Link
                    :href="route('alerts.create')"
                    class="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                >
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                    提交告警
                </Link>
                <div v-if="selectedAlerts.length > 0" class="flex items-center space-x-2">
                    <button
                        @click="batchAcknowledge"
                        class="px-3 py-1.5 text-sm font-medium text-yellow-700 bg-yellow-100 rounded-md hover:bg-yellow-200"
                    >
                        批量确认 ({{ selectedAlerts.length }})
                    </button>
                    <button
                        @click="batchClose"
                        class="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    >
                        批量关闭 ({{ selectedAlerts.length }})
                    </button>
                </div>
            </div>
            <div class="flex items-center space-x-2">
                <button
                    @click="showSaveQueryModal = true"
                    class="px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200"
                >
                    保存查询
                </button>
                <button
                    v-if="isAdmin"
                    @click="exportAlerts"
                    class="px-3 py-1.5 text-sm font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200"
                >
                    导出CSV
                </button>
            </div>
        </div>

        <div v-if="savedQueries && savedQueries.length > 0" class="mb-4 bg-white rounded-lg shadow p-4">
            <div class="text-sm font-medium text-gray-700 mb-2">常用查询</div>
            <div class="flex flex-wrap gap-2">
                <button
                    v-for="query in savedQueries"
                    :key="query.id"
                    @click="loadSavedQuery(query)"
                    class="px-3 py-1 text-sm rounded-md border border-gray-200 hover:bg-gray-50"
                    :class="query.is_favorite ? 'border-yellow-400 bg-yellow-50' : ''"
                >
                    <span v-if="query.is_favorite" class="text-yellow-500 mr-1">★</span>
                    {{ query.name }}
                </button>
            </div>
        </div>

        <div class="bg-white rounded-lg shadow mb-4">
            <div class="p-4 border-b border-gray-200">
                <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">关键词</label>
                        <input
                            v-model="filters.keyword"
                            type="text"
                            @keyup.enter="applyFilters"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                            placeholder="搜索标题、内容..."
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
                            <option value="open">待处理</option>
                            <option value="acknowledged">已确认</option>
                            <option value="processing">处理中</option>
                            <option value="resolved">已解决</option>
                            <option value="closed">已关闭</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">级别</label>
                        <select
                            v-model="filters.level"
                            @change="applyFilters"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">全部</option>
                            <option value="critical">严重</option>
                            <option value="warning">警告</option>
                            <option value="info">信息</option>
                            <option value="debug">调试</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">巡检状态</label>
                        <select
                            v-model="filters.is_inspected"
                            @change="applyFilters"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">全部</option>
                            <option value="0">未巡检</option>
                            <option value="1">已巡检</option>
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
                        <th class="px-4 py-3 text-left">
                            <input
                                type="checkbox"
                                :checked="selectedAlerts.length === alerts.data?.length && alerts.data?.length > 0"
                                @change="toggleSelectAll"
                                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                        </th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">级别</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">标题</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">服务器</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">服务</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">巡检</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建时间</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    <tr v-if="alerts.data?.length === 0">
                        <td colspan="9" class="px-4 py-8 text-center text-gray-500">
                            暂无告警数据
                        </td>
                    </tr>
                    <tr v-for="alert in alerts.data" :key="alert.id" class="hover:bg-gray-50">
                        <td class="px-4 py-3">
                            <input
                                type="checkbox"
                                :value="alert.id"
                                v-model="selectedAlerts"
                                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                        </td>
                        <td class="px-4 py-3">
                            <span class="inline-flex items-center">
                                <span :class="getLevelColor(alert.level)" class="w-3 h-3 rounded-full mr-2"></span>
                                {{ getLevelText(alert.level) }}
                            </span>
                        </td>
                        <td class="px-4 py-3">
                            <Link :href="route('alerts.show', alert.id)" class="text-sm font-medium text-gray-900 hover:text-blue-600">
                                {{ alert.title }}
                            </Link>
                        </td>
                        <td class="px-4 py-3 text-sm text-gray-500">{{ alert.server_ip }}</td>
                        <td class="px-4 py-3 text-sm text-gray-500">{{ alert.service }}</td>
                        <td class="px-4 py-3">
                            <span :class="getStatusBadgeClass(alert.status)" class="px-2 py-1 text-xs font-medium rounded-full">
                                {{ getStatusText(alert.status) }}
                            </span>
                        </td>
                        <td class="px-4 py-3">
                            <span class="px-2 py-1 text-xs font-medium rounded-full" :class="alert.is_inspected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
                                {{ alert.is_inspected ? '已巡检' : '未巡检' }}
                            </span>
                        </td>
                        <td class="px-4 py-3 text-sm text-gray-500">{{ alert.created_at }}</td>
                        <td class="px-4 py-3 text-sm">
                            <div class="flex space-x-2">
                                <Link
                                    v-if="alert.status === 'open'"
                                    :href="route('alerts.acknowledge', alert.id)"
                                    as="button"
                                    method="post"
                                    class="text-yellow-600 hover:text-yellow-900"
                                >
                                    确认
                                </Link>
                                <Link
                                    v-if="alert.status === 'acknowledged'"
                                    :href="route('alerts.process', alert.id)"
                                    as="button"
                                    method="post"
                                    class="text-blue-600 hover:text-blue-900"
                                >
                                    处理
                                </Link>
                                <Link
                                    v-if="alert.status === 'processing'"
                                    :href="route('alerts.resolve', alert.id)"
                                    as="button"
                                    method="post"
                                    class="text-green-600 hover:text-green-900"
                                >
                                    解决
                                </Link>
                                <Link
                                    v-if="alert.status === 'resolved'"
                                    :href="route('alerts.close', alert.id)"
                                    as="button"
                                    method="post"
                                    class="text-gray-600 hover:text-gray-900"
                                >
                                    关闭
                                </Link>
                                <Link
                                    v-if="!alert.is_inspected"
                                    :href="route('alerts.inspect', alert.id)"
                                    as="button"
                                    method="post"
                                    class="text-purple-600 hover:text-purple-900"
                                >
                                    巡检
                                </Link>
                                <Link
                                    :href="route('alerts.show', alert.id)"
                                    class="text-gray-600 hover:text-gray-900"
                                >
                                    详情
                                </Link>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="mt-4 flex justify-between items-center">
            <div class="text-sm text-gray-500">
                共 {{ alerts.total }} 条，每页显示
                <select v-model="filters.per_page" @change="applyFilters" class="mx-1 border border-gray-300 rounded text-sm">
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                </select>
                条
            </div>
            <div v-if="alerts.links" class="flex space-x-1">
                <Link
                    v-for="(link, index) in alerts.links"
                    :key="index"
                    :href="link.url || '#'"
                    v-html="link.label"
                    class="px-3 py-1 text-sm rounded-md border"
                    :class="link.active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'"
                />
            </div>
        </div>

        <div v-if="showSaveQueryModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 class="text-lg font-medium text-gray-900 mb-4">保存查询条件</h3>
                <form @submit.prevent="saveCurrentQuery">
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">名称</label>
                            <input
                                v-model="savedQueryForm.name"
                                type="text"
                                required
                                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                                placeholder="输入查询名称"
                            />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">描述</label>
                            <textarea
                                v-model="savedQueryForm.description"
                                rows="2"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                                placeholder="可选，描述查询用途"
                            />
                        </div>
                        <div class="flex items-center">
                            <input
                                v-model="savedQueryForm.is_public"
                                type="checkbox"
                                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <label class="ml-2 text-sm text-gray-700">设为公共查询（其他人可见）</label>
                        </div>
                    </div>
                    <div class="mt-6 flex justify-end space-x-3">
                        <button
                            type="button"
                            @click="showSaveQueryModal = false"
                            class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                        >
                            取消
                        </button>
                        <button
                            type="submit"
                            :disabled="savedQueryForm.processing"
                            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            保存
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </Layout>
</template>
