<script setup>
import { Link, router, useForm } from '@inertiajs/vue3'
import AppLayout from '../../Layouts/AppLayout.vue'
import { ref } from 'vue'

const props = defineProps({
    logs: Object,
    filters: Object,
})

const filterForm = useForm({
    api_type: props.filters.api_type || '',
    status: props.filters.status || '',
})

const expandedScope = ref({})

const filter = () => {
    filterForm.get('/api-failure-logs', { preserveState: true, preserveScroll: true })
}

const resetFilter = () => {
    filterForm.reset()
    filterForm.get('/api-failure-logs')
}

const toggleScope = (id) => {
    expandedScope.value[id] = !expandedScope.value[id]
}

const retry = (log) => {
    router.post(`/api-failure-logs/${log.id}/retry`)
}

const resolve = (log) => {
    router.post(`/api-failure-logs/${log.id}/resolve`)
}

const statusClass = (status) => {
    const map = {
        pending: 'bg-yellow-100 text-yellow-800',
        retrying: 'bg-blue-100 text-blue-800',
        resolved: 'bg-green-100 text-green-800',
        failed: 'bg-red-100 text-red-800',
    }
    return map[status] || 'bg-gray-100 text-gray-800'
}

const statusLabel = (status) => {
    const map = {
        pending: '待处理',
        retrying: '重试中',
        resolved: '已解决',
        failed: '失败',
    }
    return map[status] || status
}

const formatDate = (date) => {
    if (!date) return '-'
    return new Date(date).toLocaleString('zh-CN')
}
</script>

<template>
    <AppLayout title="接口失败日志">
        <div class="space-y-6">
            <div class="flex items-center justify-between">
                <h2 class="text-2xl font-bold text-gray-900">接口失败日志</h2>
            </div>

            <div class="bg-white rounded-xl border border-gray-200 p-4">
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">接口类型</label>
                        <select v-model="filterForm.api_type" class="w-full rounded-lg border-gray-300 text-sm shadow-sm">
                            <option value="">全部</option>
                            <option value="payment">支付</option>
                            <option value="message">消息</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">状态</label>
                        <select v-model="filterForm.status" class="w-full rounded-lg border-gray-300 text-sm shadow-sm">
                            <option value="">全部</option>
                            <option value="pending">待处理</option>
                            <option value="retrying">重试中</option>
                            <option value="resolved">已解决</option>
                            <option value="failed">失败</option>
                        </select>
                    </div>
                    <div class="flex items-end gap-2">
                        <button @click="filter" class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">查询</button>
                        <button @click="resetFilter" class="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200">重置</button>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead>
                            <tr class="bg-gray-50 border-b border-gray-200">
                                <th class="px-4 py-3 text-left font-medium text-gray-600">时间</th>
                                <th class="px-4 py-3 text-left font-medium text-gray-600">接口类型</th>
                                <th class="px-4 py-3 text-left font-medium text-gray-600">渠道</th>
                                <th class="px-4 py-3 text-left font-medium text-gray-600">关联单号</th>
                                <th class="px-4 py-3 text-left font-medium text-gray-600">错误信息</th>
                                <th class="px-4 py-3 text-left font-medium text-gray-600">影响范围</th>
                                <th class="px-4 py-3 text-center font-medium text-gray-600">重试次数</th>
                                <th class="px-4 py-3 text-left font-medium text-gray-600">最近重试</th>
                                <th class="px-4 py-3 text-left font-medium text-gray-600">状态</th>
                                <th class="px-4 py-3 text-left font-medium text-gray-600">操作</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100">
                            <tr v-for="log in logs.data" :key="log.id" class="hover:bg-gray-50">
                                <td class="px-4 py-3 whitespace-nowrap">{{ formatDate(log.created_at) }}</td>
                                <td class="px-4 py-3">
                                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium" :class="log.api_type === 'payment' ? 'bg-purple-100 text-purple-800' : 'bg-cyan-100 text-cyan-800'">
                                        {{ log.api_type === 'payment' ? '支付' : '消息' }}
                                    </span>
                                </td>
                                <td class="px-4 py-3">{{ log.channel || '-' }}</td>
                                <td class="px-4 py-3">{{ log.order_no || '-' }}</td>
                                <td class="px-4 py-3 max-w-xs truncate" :title="log.error_message">{{ log.error_message || '-' }}</td>
                                <td class="px-4 py-3">
                                    <button @click="toggleScope(log.id)" class="inline-flex items-center gap-1 text-sm">
                                        <span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-800 text-xs font-medium">{{ (log.impact_scope || []).length }}</span>
                                        <svg class="w-3 h-3 text-gray-400 transition-transform" :class="{ 'rotate-180': expandedScope[log.id] }" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
                                    </button>
                                </td>
                                <td class="px-4 py-3 text-center">{{ log.retry_count || 0 }}</td>
                                <td class="px-4 py-3 whitespace-nowrap">{{ formatDate(log.last_retry_at) }}</td>
                                <td class="px-4 py-3">
                                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" :class="statusClass(log.status)">{{ statusLabel(log.status) }}</span>
                                </td>
                                <td class="px-4 py-3">
                                    <div class="flex items-center gap-2">
                                        <button v-if="log.status !== 'resolved'" @click="retry(log)" class="text-blue-600 hover:text-blue-800">重试</button>
                                        <button v-if="log.status !== 'resolved'" @click="resolve(log)" class="text-green-600 hover:text-green-800">解决</button>
                                    </div>
                                </td>
                            </tr>
                            <tr v-if="logs.data.length === 0">
                                <td colspan="10" class="px-4 py-8 text-center text-gray-500">暂无数据</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div v-if="expandedScope" class="border-t border-gray-200">
                    <div v-for="log in logs.data" :key="'scope-' + log.id">
                        <div v-if="expandedScope[log.id]" class="px-6 py-3 bg-gray-50">
                            <p class="text-xs text-gray-500 mb-1">受影响记录:</p>
                            <div class="flex flex-wrap gap-1">
                                <span v-for="(item, idx) in (log.impact_scope || [])" :key="idx" class="inline-flex items-center px-2 py-0.5 rounded text-xs bg-orange-100 text-orange-800">{{ item }}</span>
                                <span v-if="!log.impact_scope || log.impact_scope.length === 0" class="text-xs text-gray-400">无</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div v-if="logs.links && logs.last_page > 1" class="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                    <p class="text-sm text-gray-600">共 {{ logs.total }} 条记录</p>
                    <div class="flex gap-1">
                        <a
                            v-for="link in logs.links"
                            :key="link.label"
                            :href="link.url || '#'"
                            :class="[link.active ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50', !link.url ? 'pointer-events-none opacity-50' : '', 'px-3 py-1 text-sm rounded border border-gray-300']"
                            v-html="link.label"
                            @click.prevent="link.url && router.visit(link.url)"
                        />
                    </div>
                </div>
            </div>
        </div>
    </AppLayout>
</template>
