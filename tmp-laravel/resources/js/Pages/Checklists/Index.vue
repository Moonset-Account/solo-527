<template>
    <div class="space-y-6">
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-bold text-gray-900">检查清单模板</h1>
                <p class="text-sm text-gray-500 mt-1">管理合规检查清单模板，用于日常合规检查</p>
            </div>
            <Link
                :href="route('checklists.create')"
                class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            >
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                </svg>
                新建模板
            </Link>
        </div>

        <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div class="p-4 border-b border-gray-200 flex items-center justify-between">
                <div class="flex items-center space-x-4">
                    <input
                        v-model="search"
                        type="text"
                        placeholder="搜索模板名称..."
                        class="w-64 text-sm border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <select
                        v-model="categoryFilter"
                        class="text-sm border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="">全部分类</option>
                        <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
                    </select>
                </div>
            </div>

            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">模板名称</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">分类</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">版本</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">检查项数</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">创建人</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                            <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        <tr v-for="checklist in checklists.data" :key="checklist.id" class="hover:bg-gray-50">
                            <td class="px-4 py-4">
                                <Link :href="route('checklists.show', checklist.id)" class="text-indigo-600 hover:text-indigo-900 font-medium">
                                    {{ checklist.title }}
                                </Link>
                                <p class="text-xs text-gray-500 mt-0.5" v-if="checklist.description">
                                    {{ checklist.description }}
                                </p>
                            </td>
                            <td class="px-4 py-4 text-sm text-gray-600">
                                {{ checklist.category || '-' }}
                            </td>
                            <td class="px-4 py-4 text-sm text-gray-600">
                                {{ checklist.version || '1.0' }}
                            </td>
                            <td class="px-4 py-4 text-sm font-medium text-gray-900">
                                {{ checklist.items_count || 0 }} 项
                            </td>
                            <td class="px-4 py-4 text-sm text-gray-600">
                                {{ checklist.created_by?.name || '-' }}
                            </td>
                            <td class="px-4 py-4">
                                <span
                                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                                    :class="checklist.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
                                >
                                    {{ checklist.is_active ? '启用' : '禁用' }}
                                </span>
                            </td>
                            <td class="px-4 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                <Link :href="route('checklist-records.create', checklist.id)" class="text-green-600 hover:text-green-800">
                                    填写
                                </Link>
                                <Link :href="route('checklists.show', checklist.id)" class="text-indigo-600 hover:text-indigo-900">
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
                        共 {{ checklists.total }} 条模板
                    </div>
                    <div class="flex space-x-2">
                        <button
                            v-if="checklists.prev_page_url"
                            @click="prevPage"
                            class="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                            上一页
                        </button>
                        <span class="px-3 py-1 text-sm text-gray-500">
                            第 {{ checklists.current_page }} 页
                        </span>
                        <button
                            v-if="checklists.next_page_url"
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
import { ref } from 'vue'
import { Link, router } from '@inertiajs/vue3'

const props = defineProps({
    checklists: Object,
    categories: Array,
    filters: Object,
})

const search = ref(props.filters.search || '')
const categoryFilter = ref(props.filters.category || '')

function prevPage() {
    router.get(route('checklists.index'), { ...props.filters, page: props.checklists.current_page - 1 }, { preserveState: true })
}

function nextPage() {
    router.get(route('checklists.index'), { ...props.filters, page: props.checklists.current_page + 1 }, { preserveState: true })
}
</script>
