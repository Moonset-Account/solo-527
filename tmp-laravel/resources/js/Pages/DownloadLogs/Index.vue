<template>
    <div class="space-y-6">
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-bold text-gray-900">下载记录</h1>
                <p class="text-sm text-gray-500 mt-1">查看所有合规报告和材料的下载历史</p>
            </div>
        </div>

        <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div class="p-4 border-b border-gray-200 flex items-center justify-between">
                <div class="flex items-center space-x-4">
                    <input
                        v-model="search"
                        type="text"
                        placeholder="搜索文件名..."
                        class="w-64 text-sm border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <select
                        v-model="typeFilter"
                        class="text-sm border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="">全部类型</option>
                        <option v-for="(label, value) in download_types" :key="value" :value="value">{{ label }}</option>
                    </select>
                    <select
                        v-model="userFilter"
                        class="text-sm border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="">全部用户</option>
                        <option v-for="user in users" :key="user.id" :value="user.id">{{ user.name }}</option>
                    </select>
                </div>
            </div>

            <div class="p-4 border-b border-gray-200 flex items-center space-x-4">
                <div class="flex items-center space-x-2">
                    <label class="text-sm text-gray-600">日期范围:</label>
                    <input
                        v-model="dateFrom"
                        type="date"
                        class="text-sm border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <span class="text-sm text-gray-500">至</span>
                    <input
                        v-model="dateTo"
                        type="date"
                        class="text-sm border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <button
                        @click="applyFilters"
                        class="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                    >
                        查询
                    </button>
                </div>
            </div>

            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">文件名</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">类型</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">下载人</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">格式</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">文件大小</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP地址</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">下载时间</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        <tr v-for="log in logs.data" :key="log.id" class="hover:bg-gray-50">
                            <td class="px-4 py-4">
                                <div class="flex items-center">
                                    <svg class="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                    </svg>
                                    <span class="text-sm font-medium text-gray-900">{{ log.file_name }}</span>
                                </div>
                            </td>
                            <td class="px-4 py-4">
                                <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                                    {{ download_types[log.download_type] || log.download_type }}
                                </span>
                            </td>
                            <td class="px-4 py-4 text-sm text-gray-600">
                                {{ log.user?.name || '-' }}
                            </td>
                            <td class="px-4 py-4 text-sm text-gray-600">
                                {{ log.file_format?.toUpperCase() || '-' }}
                            </td>
                            <td class="px-4 py-4 text-sm text-gray-600">
                                {{ formatFileSize(log.file_size) }}
                            </td>
                            <td class="px-4 py-4 text-sm text-gray-600">
                                {{ log.ip_address || '-' }}
                            </td>
                            <td class="px-4 py-4 text-sm text-gray-500">
                                {{ formatDateTime(log.created_at) }}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="px-4 py-3 bg-gray-50 border-t border-gray-200">
                <div class="flex items-center justify-between">
                    <div class="text-sm text-gray-700">
                        共 {{ logs.total }} 条记录
                    </div>
                    <div class="flex space-x-2">
                        <button
                            v-if="logs.prev_page_url"
                            @click="prevPage"
                            class="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                            上一页
                        </button>
                        <span class="px-3 py-1 text-sm text-gray-500">
                            第 {{ logs.current_page }} 页
                        </span>
                        <button
                            v-if="logs.next_page_url"
                            @click="nextPage"
                            class="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                            下一页
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                <h3 class="text-lg font-medium text-gray-900 mb-4">下载类型统计</h3>
                <div class="space-y-3">
                    <div v-for="(label, type) in download_types" :key="type" class="flex justify-between items-center">
                        <span class="text-sm text-gray-600">{{ label }}</span>
                        <span class="text-sm font-medium text-gray-900">0 次</span>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                <h3 class="text-lg font-medium text-gray-900 mb-4">下载趋势</h3>
                <div class="h-32 flex items-end justify-between space-x-1">
                    <div v-for="i in 7" :key="i" class="flex-1 bg-indigo-500 rounded-t" :style="{ height: (30 + i * 10) + '%' }"></div>
                </div>
                <p class="text-xs text-gray-500 text-center mt-2">最近7天</p>
            </div>

            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                <h3 class="text-lg font-medium text-gray-900 mb-4">热门下载</h3>
                <div class="space-y-2">
                    <div class="text-sm text-gray-600">暂无数据</div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { router } from '@inertiajs/vue3'

const props = defineProps({
    logs: Object,
    users: Array,
    download_types: Object,
    filters: Object,
})

const search = ref(props.filters.search || '')
const typeFilter = ref(props.filters.download_type || '')
const userFilter = ref(props.filters.user_id || '')
const dateFrom = ref(props.filters.date_from || '')
const dateTo = ref(props.filters.date_to || '')

function applyFilters() {
    router.get(route('download-logs.index'), {
        search: search.value,
        download_type: typeFilter.value,
        user_id: userFilter.value,
        date_from: dateFrom.value,
        date_to: dateTo.value,
    }, { preserveState: true })
}

function prevPage() {
    router.get(route('download-logs.index'), { ...props.filters, page: props.logs.current_page - 1 }, { preserveState: true })
}

function nextPage() {
    router.get(route('download-logs.index'), { ...props.filters, page: props.logs.current_page + 1 }, { preserveState: true })
}

function formatFileSize(bytes) {
    if (!bytes) return '-'
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function formatDateTime(date) {
    if (!date) return ''
    return new Date(date).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    })
}
</script>
