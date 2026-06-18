<script setup>
import { ref } from 'vue'
import { Link, router } from '@inertiajs/vue3'
import Layout from '@/Components/Layout.vue'

const props = defineProps({
    logs: Object,
    filters: Object,
})

const filters = ref({
    keyword: props.filters.keyword || '',
    action: props.filters.action || '',
    user_id: props.filters.user_id || '',
    resource_type: props.filters.resource_type || '',
    start_date: props.filters.start_date || '',
    end_date: props.filters.end_date || '',
    per_page: props.filters.per_page || 20,
})

const getActionBadgeClass = (action) => {
    if (action.includes('create') || action.includes('insert')) return 'bg-green-100 text-green-800'
    if (action.includes('update') || action.includes('edit')) return 'bg-blue-100 text-blue-800'
    if (action.includes('delete') || action.includes('remove')) return 'bg-red-100 text-red-800'
    if (action.includes('miss') || action.includes('fail')) return 'bg-red-100 text-red-800'
    return 'bg-gray-100 text-gray-800'
}

const actionOptions = [
    { value: '', label: '全部操作' },
    { value: 'create', label: '创建' },
    { value: 'update', label: '更新' },
    { value: 'delete', label: '删除' },
    { value: 'acknowledge', label: '确认' },
    { value: 'resolve', label: '解决' },
    { value: 'close', label: '关闭' },
    { value: 'escalate', label: '升级' },
    { value: 'inspect', label: '巡检' },
    { value: 'miss', label: '遗漏' },
]

const resourceOptions = [
    { value: '', label: '全部资源' },
    { value: 'alert', label: '告警' },
    { value: 'duty_schedule', label: '值班' },
    { value: 'account_application', label: '账号申请' },
    { value: 'change_window', label: '变更窗口' },
    { value: 'inspection', label: '巡检' },
    { value: 'user', label: '用户' },
]

const applyFilters = () => {
    router.get(route('operation-logs.index'), filters.value, { preserveState: true })
}

const resetFilters = () => {
    filters.value = {
        keyword: '',
        action: '',
        user_id: '',
        resource_type: '',
        start_date: '',
        end_date: '',
        per_page: 20,
    }
    router.get(route('operation-logs.index'), {}, { preserveState: true })
}

const exportData = () => {
    window.open(route('operation-logs.export', filters.value), '_blank')
}
</script>

<template>
    <Layout title="操作日志">
        <div class="mb-4 flex justify-between items-center">
            <div class="text-sm text-gray-500">
                记录所有关键操作，包括巡检遗漏等动作
            </div>
            <div>
                <button
                    @click="exportData"
                    class="px-3 py-1.5 text-sm font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200"
                >
                    导出CSV
                </button>
            </div>
        </div>

        <div class="bg-white rounded-lg shadow mb-4">
            <div class="p-4 border-b border-gray-200">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">关键词</label>
                        <input
                            v-model="filters.keyword"
                            type="text"
                            @keyup.enter="applyFilters"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                            placeholder="搜索详情、IP..."
                        />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">操作类型</label>
                        <select
                            v-model="filters.action"
                            @change="applyFilters"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option v-for="opt in actionOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">资源类型</label>
                        <select
                            v-model="filters.resource_type"
                            @change="applyFilters"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option v-for="opt in resourceOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">操作人ID</label>
                        <input
                            v-model="filters.user_id"
                            type="text"
                            @keyup.enter="applyFilters"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                            placeholder="用户ID"
                        />
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
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">时间</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作人</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">资源</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP地址</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">详情</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    <tr v-if="logs.data?.length === 0">
                        <td colspan="7" class="px-4 py-8 text-center text-gray-500">
                            暂无日志数据
                        </td>
                    </tr>
                    <tr v-for="log in logs.data" :key="log.id" class="hover:bg-gray-50">
                        <td class="px-4 py-3 text-sm text-gray-500">{{ log.created_at }}</td>
                        <td class="px-4 py-3 text-sm text-gray-900">{{ log.user?.name || '-' }}</td>
                        <td class="px-4 py-3">
                            <span :class="getActionBadgeClass(log.action)" class="px-2 py-1 text-xs font-medium rounded-full">
                                {{ log.action }}
                            </span>
                        </td>
                        <td class="px-4 py-3 text-sm text-gray-500">
                            {{ log.resource_type }} #{{ log.resource_id }}
                        </td>
                        <td class="px-4 py-3 text-sm text-gray-500 font-mono">{{ log.ip_address || '-' }}</td>
                        <td class="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">{{ log.details }}</td>
                        <td class="px-4 py-3 text-sm">
                            <Link
                                :href="route('operation-logs.show', log.id)"
                                class="text-blue-600 hover:text-blue-900"
                            >
                                详情
                            </Link>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="mt-4 flex justify-between items-center">
            <div class="text-sm text-gray-500">
                共 {{ logs.total }} 条
            </div>
            <div v-if="logs.links" class="flex space-x-1">
                <Link
                    v-for="(link, index) in logs.links"
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
