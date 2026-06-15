<template>
    <div class="space-y-6">
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-bold text-gray-900">检查记录</h1>
                <p class="text-sm text-gray-500 mt-1">查看和管理所有合规检查记录</p>
            </div>
            <div class="flex items-center space-x-3">
                <Link
                    :href="route('checklists.index')"
                    class="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                    选择清单模板
                </Link>
            </div>
        </div>

        <FilterBar
            :saved-filters="savedFilters"
            :current-filters="filters"
            page="checklist_records"
            @apply="applyFilters"
            @reset="resetFilters"
            @loaded="loadFilters"
        >
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">搜索</label>
                <input
                    v-model="localFilters.search"
                    type="text"
                    placeholder="记录标题"
                    class="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">状态</label>
                <select
                    v-model="localFilters.status"
                    class="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                    <option value="">全部状态</option>
                    <option value="draft">草稿</option>
                    <option value="submitted">已提交</option>
                    <option value="reviewed">已审核</option>
                    <option value="closed">已关闭</option>
                </select>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">清单模板</label>
                <select
                    v-model="localFilters.checklist_id"
                    class="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                    <option value="">全部模板</option>
                    <option v-for="cl in checklists" :key="cl.id" :value="cl.id">
                        {{ cl.title }}
                    </option>
                </select>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">责任人</label>
                <input
                    v-model="localFilters.responsible_user_id"
                    type="text"
                    placeholder="责任人ID"
                    class="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">部门</label>
                <select
                    v-model="localFilters.department"
                    class="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                    <option value="">全部部门</option>
                    <option v-for="dept in departments" :key="dept" :value="dept">
                        {{ dept }}
                    </option>
                </select>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">检查日期起</label>
                <input
                    v-model="localFilters.date_from"
                    type="date"
                    class="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">检查日期止</label>
                <input
                    v-model="localFilters.date_to"
                    type="date"
                    class="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">整改状态</label>
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
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">记录标题</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">清单模板</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">责任人</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">部门</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">检查日期</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">整改期限</th>
                            <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        <tr v-for="record in records.data" :key="record.id" class="hover:bg-gray-50">
                            <td class="px-4 py-4">
                                <Link :href="route('checklist-records.show', record.id)" class="text-indigo-600 hover:text-indigo-900 font-medium">
                                    {{ record.title }}
                                </Link>
                            </td>
                            <td class="px-4 py-4 text-sm text-gray-500">
                                {{ record.checklist?.title || '-' }}
                            </td>
                            <td class="px-4 py-4 whitespace-nowrap">
                                <StatusBadge :status="record.status" type="record" />
                            </td>
                            <td class="px-4 py-4 text-sm text-gray-500">
                                {{ record.responsible_user?.name || '-' }}
                            </td>
                            <td class="px-4 py-4 text-sm text-gray-500">
                                {{ record.department || '-' }}
                            </td>
                            <td class="px-4 py-4 text-sm text-gray-500">
                                {{ record.check_date || '-' }}
                            </td>
                            <td class="px-4 py-4 whitespace-nowrap">
                                <div class="text-sm text-gray-900">{{ record.due_date || '-' }}</div>
                            </td>
                            <td class="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <Link :href="route('checklist-records.show', record.id)" class="text-indigo-600 hover:text-indigo-900">
                                    查看
                                </Link>
                                <span v-if="record.status === 'draft'" class="text-gray-300 mx-2">|</span>
                                <Link
                                    v-if="record.status === 'draft'"
                                    :href="route('checklist-records.edit', record.id)"
                                    class="text-indigo-600 hover:text-indigo-900"
                                >
                                    编辑
                                </Link>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="px-4 py-3 bg-gray-50 border-t border-gray-200">
                <div class="flex items-center justify-between">
                    <div class="text-sm text-gray-700">
                        共 {{ records.total }} 条记录
                    </div>
                    <div class="flex space-x-2">
                        <button
                            v-if="records.prev_page_url"
                            @click="prevPage"
                            class="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                            上一页
                        </button>
                        <span class="px-3 py-1 text-sm text-gray-500">
                            第 {{ records.current_page }} 页
                        </span>
                        <button
                            v-if="records.next_page_url"
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
import { reactive } from 'vue'
import { Link, router } from '@inertiajs/vue3'
import FilterBar from '@/Components/FilterBar.vue'
import StatusBadge from '@/Components/StatusBadge.vue'

const props = defineProps({
    records: Object,
    checklists: Array,
    departments: Array,
    savedFilters: Array,
    filters: Object,
})

const localFilters = reactive({
    search: props.filters.search || '',
    status: props.filters.status || '',
    checklist_id: props.filters.checklist_id || '',
    responsible_user_id: props.filters.responsible_user_id || '',
    department: props.filters.department || '',
    date_from: props.filters.date_from || '',
    date_to: props.filters.date_to || '',
    is_overdue: props.filters.is_overdue || '',
})

function applyFilters() {
    router.get(route('checklist-records.index'), { ...localFilters }, { preserveState: true })
}

function resetFilters() {
    Object.keys(localFilters).forEach(key => {
        localFilters[key] = ''
    })
    router.get(route('checklist-records.index'), {}, { preserveState: true })
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
    router.get(route('checklist-records.index'), { ...props.filters, page: props.records.current_page - 1 }, { preserveState: true })
}

function nextPage() {
    router.get(route('checklist-records.index'), { ...props.filters, page: props.records.current_page + 1 }, { preserveState: true })
}
</script>
