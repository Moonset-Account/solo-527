<template>
    <div class="space-y-6">
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-bold text-gray-900">合规缺口管理</h1>
                <p class="text-sm text-gray-500 mt-1">管理和跟踪所有合规缺口及其处理过程</p>
            </div>
            <div class="flex items-center space-x-3">
                <Link
                    :href="route('compliance-gaps.export', filters)"
                    class="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                    </svg>
                    导出报告
                </Link>
                <Link
                    :href="route('compliance-gaps.create')"
                    class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                >
                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                    </svg>
                    新建缺口
                </Link>
            </div>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
                <p class="text-sm text-gray-500">全部</p>
                <p class="text-xl font-bold text-gray-900 mt-1">{{ statistics.total }}</p>
            </div>
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
                <p class="text-sm text-gray-500">待处理</p>
                <p class="text-xl font-bold text-yellow-600 mt-1">{{ statistics.open }}</p>
            </div>
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
                <p class="text-sm text-gray-500">处理中</p>
                <p class="text-xl font-bold text-blue-600 mt-1">{{ statistics.in_progress }}</p>
            </div>
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
                <p class="text-sm text-gray-500">待审核</p>
                <p class="text-xl font-bold text-purple-600 mt-1">{{ statistics.pending_review }}</p>
            </div>
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
                <p class="text-sm text-gray-500">已解决</p>
                <p class="text-xl font-bold text-green-600 mt-1">{{ statistics.resolved }}</p>
            </div>
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
                <p class="text-sm text-gray-500">逾期</p>
                <p class="text-xl font-bold text-red-600 mt-1">{{ statistics.overdue }}</p>
            </div>
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
                <p class="text-sm text-gray-500">高风险</p>
                <p class="text-xl font-bold text-orange-600 mt-1">{{ statistics.high }}</p>
            </div>
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
                <p class="text-sm text-gray-500">严重</p>
                <p class="text-xl font-bold text-red-600 mt-1">{{ statistics.critical }}</p>
            </div>
        </div>

        <FilterBar
            :saved-filters="savedFilters"
            :current-filters="filters"
            page="gaps"
            @apply="applyFilters"
            @reset="resetFilters"
            @loaded="loadFilters"
        >
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">搜索</label>
                <input
                    v-model="localFilters.search"
                    type="text"
                    placeholder="缺口编号/标题"
                    class="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">处理状态</label>
                <select
                    v-model="localFilters.status"
                    class="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                    <option value="">全部状态</option>
                    <option v-for="(label, value) in statuses" :key="value" :value="value">
                        {{ label }}
                    </option>
                </select>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">严重程度</label>
                <select
                    v-model="localFilters.severity"
                    class="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                    <option value="">全部</option>
                    <option v-for="(label, value) in severities" :key="value" :value="value">
                        {{ label }}
                    </option>
                </select>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">责任人</label>
                <select
                    v-model="localFilters.responsible_user_id"
                    class="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                    <option value="">全部责任人</option>
                    <option v-for="user in users" :key="user.id" :value="user.id">
                        {{ user.name }}
                    </option>
                </select>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">分类</label>
                <select
                    v-model="localFilters.category"
                    class="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                    <option value="">全部分类</option>
                    <option v-for="cat in categories" :key="cat" :value="cat">
                        {{ cat }}
                    </option>
                </select>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">发现日期起</label>
                <input
                    v-model="localFilters.discovered_from"
                    type="date"
                    class="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">发现日期止</label>
                <input
                    v-model="localFilters.discovered_to"
                    type="date"
                    class="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">整改期限</label>
                <select
                    v-model="localFilters.is_overdue"
                    class="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                    <option value="">全部</option>
                    <option value="true">仅逾期</option>
                </select>
            </div>
        </FilterBar>

        <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">缺口编号</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">标题</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">严重程度</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">责任人</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">发现日期</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">整改期限</th>
                            <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        <tr v-for="gap in gaps.data" :key="gap.id" class="hover:bg-gray-50">
                            <td class="px-4 py-4 whitespace-nowrap">
                                <Link :href="route('compliance-gaps.show', gap.id)" class="text-indigo-600 hover:text-indigo-900 font-medium">
                                    {{ gap.gap_no }}
                                </Link>
                            </td>
                            <td class="px-4 py-4">
                                <div class="text-sm font-medium text-gray-900">{{ gap.title }}</div>
                                <div class="text-xs text-gray-500" v-if="gap.category">
                                    {{ gap.category }}
                                </div>
                            </td>
                            <td class="px-4 py-4 whitespace-nowrap">
                                <StatusBadge :status="gap.status" type="gap" />
                            </td>
                            <td class="px-4 py-4 whitespace-nowrap">
                                <SeverityBadge :severity="gap.severity" />
                            </td>
                            <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                {{ gap.responsible_user?.name || '-' }}
                            </td>
                            <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                {{ gap.discovered_date }}
                            </td>
                            <td class="px-4 py-4 whitespace-nowrap">
                                <div class="text-sm text-gray-900">{{ gap.due_date || '-' }}</div>
                                <div v-if="isOverdue(gap)" class="text-xs text-red-600 font-medium">
                                    逾期 {{ getDaysOverdue(gap) }} 天
                                </div>
                            </td>
                            <td class="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <Link :href="route('compliance-gaps.show', gap.id)" class="text-indigo-600 hover:text-indigo-900">
                                    查看
                                </Link>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="px-4 py-3 bg-gray-50 border-t border-gray-200">
                <div class="flex items-center justify-between">
                    <div class="text-sm text-gray-700">
                        共 {{ gaps.total }} 条记录
                    </div>
                    <div class="flex space-x-2">
                        <button
                            v-if="gaps.prev_page_url"
                            @click="prevPage"
                            class="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                            上一页
                        </button>
                        <span class="px-3 py-1 text-sm text-gray-500">
                            第 {{ gaps.current_page }} 页
                        </span>
                        <button
                            v-if="gaps.next_page_url"
                            @click="nextPage"
                            class="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                            下一页
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { Link, router } from '@inertiajs/vue3'
import FilterBar from '@/Components/FilterBar.vue'
import StatusBadge from '@/Components/StatusBadge.vue'
import SeverityBadge from '@/Components/SeverityBadge.vue'

const props = defineProps({
    gaps: Object,
    statistics: Object,
    users: Array,
    categories: Array,
    savedFilters: Array,
    filters: Object,
    statuses: Object,
    severities: Object,
})

const localFilters = reactive({
    search: props.filters.search || '',
    status: props.filters.status || '',
    severity: props.filters.severity || '',
    responsible_user_id: props.filters.responsible_user_id || '',
    category: props.filters.category || '',
    discovered_from: props.filters.discovered_from || '',
    discovered_to: props.filters.discovered_to || '',
    is_overdue: props.filters.is_overdue || '',
})

function applyFilters() {
    router.get(route('compliance-gaps.index'), { ...localFilters }, { preserveState: true })
}

function resetFilters() {
    Object.keys(localFilters).forEach(key => {
        localFilters[key] = ''
    })
    router.get(route('compliance-gaps.index'), {}, { preserveState: true })
}

function loadFilters(savedFilters) {
    Object.keys(savedFilters).forEach(key => {
        if (key in localFilters) {
            localFilters[key] = savedFilters[key] || ''
        }
    })
    applyFilters()
}

function prevPage() {
    router.get(route('compliance-gaps.index'), { ...props.filters, page: props.gaps.current_page - 1 }, { preserveState: true })
}

function nextPage() {
    router.get(route('compliance-gaps.index'), { ...props.filters, page: props.gaps.current_page + 1 }, { preserveState: true })
}

function isOverdue(gap) {
    if (!gap.due_date || isClosed(gap)) return false
    return new Date(gap.due_date) < new Date()
}

function isClosed(gap) {
    return ['resolved', 'closed'].includes(gap.status)
}

function getDaysOverdue(gap) {
    if (!isOverdue(gap)) return 0
    const due = new Date(gap.due_date)
    const now = new Date()
    return Math.floor((now - due) / (1000 * 60 * 60 * 24))
}
</script>
