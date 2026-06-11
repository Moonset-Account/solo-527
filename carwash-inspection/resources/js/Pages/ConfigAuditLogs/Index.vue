<script setup>
import { Link, router, useForm } from '@inertiajs/vue3'
import AppLayout from '../../Layouts/AppLayout.vue'
import Modal from '../../Components/Modal.vue'
import { ref } from 'vue'

const props = defineProps({
    logs: Object,
    filters: Object,
})

const filterForm = useForm({
    config_type: props.filters.config_type || '',
})

const showDetail = ref(null)

const filter = () => {
    filterForm.get('/config-audit-logs', { preserveState: true, preserveScroll: true })
}

const resetFilter = () => {
    filterForm.reset()
    filterForm.get('/config-audit-logs')
}

const openDetail = (log) => {
    showDetail.value = log
}

const formatDate = (date) => {
    if (!date) return '-'
    return new Date(date).toLocaleString('zh-CN')
}

const actionLabel = (action) => {
    const map = { create: '创建', update: '更新', delete: '删除' }
    return map[action] || action
}

const actionClass = (action) => {
    const map = { create: 'bg-green-100 text-green-800', update: 'bg-blue-100 text-blue-800', delete: 'bg-red-100 text-red-800' }
    return map[action] || 'bg-gray-100 text-gray-800'
}

const diffKeys = (oldVals, newVals) => {
    const keys = new Set([...Object.keys(oldVals || {}), ...Object.keys(newVals || {})])
    return [...keys]
}
</script>

<template>
    <AppLayout title="配置审计日志">
        <div class="space-y-6">
            <div class="flex items-center justify-between">
                <h2 class="text-2xl font-bold text-gray-900">配置审计日志</h2>
            </div>

            <div class="bg-white rounded-xl border border-gray-200 p-4">
                <div class="flex gap-3">
                    <div class="flex-1">
                        <label class="block text-sm font-medium text-gray-700 mb-1">配置类型</label>
                        <select v-model="filterForm.config_type" class="w-full rounded-lg border-gray-300 text-sm shadow-sm">
                            <option value="">全部</option>
                            <option value="service_item">服务项目</option>
                            <option value="inspection_template">检测模板</option>
                            <option value="cashier_order">收银单</option>
                            <option value="technician">技师</option>
                            <option value="work_station">工位</option>
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
                                <th class="px-4 py-3 text-left font-medium text-gray-600">配置类型</th>
                                <th class="px-4 py-3 text-left font-medium text-gray-600">配置ID</th>
                                <th class="px-4 py-3 text-left font-medium text-gray-600">操作</th>
                                <th class="px-4 py-3 text-left font-medium text-gray-600">操作人</th>
                                <th class="px-4 py-3 text-left font-medium text-gray-600">IP地址</th>
                                <th class="px-4 py-3 text-left font-medium text-gray-600">操作</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100">
                            <tr v-for="log in logs.data" :key="log.id" class="hover:bg-gray-50">
                                <td class="px-4 py-3 whitespace-nowrap">{{ formatDate(log.created_at) }}</td>
                                <td class="px-4 py-3">{{ log.config_type }}</td>
                                <td class="px-4 py-3">{{ log.config_id }}</td>
                                <td class="px-4 py-3">
                                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" :class="actionClass(log.action)">{{ actionLabel(log.action) }}</span>
                                </td>
                                <td class="px-4 py-3">{{ log.changed_by_name || log.changed_by_user?.name || '-' }}</td>
                                <td class="px-4 py-3 font-mono text-xs">{{ log.ip_address || '-' }}</td>
                                <td class="px-4 py-3">
                                    <button @click="openDetail(log)" class="text-blue-600 hover:text-blue-800">详情</button>
                                </td>
                            </tr>
                            <tr v-if="logs.data.length === 0">
                                <td colspan="7" class="px-4 py-8 text-center text-gray-500">暂无数据</td>
                            </tr>
                        </tbody>
                    </table>
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

        <Modal :show="!!showDetail" @close="showDetail = null" max-width="3xl">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">变更详情</h3>
            <div v-if="showDetail" class="space-y-4">
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span class="text-gray-500">配置类型:</span>
                        <span class="ml-1 font-medium">{{ showDetail.config_type }}</span>
                    </div>
                    <div>
                        <span class="text-gray-500">配置ID:</span>
                        <span class="ml-1 font-medium">{{ showDetail.config_id }}</span>
                    </div>
                    <div>
                        <span class="text-gray-500">操作:</span>
                        <span class="ml-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium" :class="actionClass(showDetail.action)">{{ actionLabel(showDetail.action) }}</span>
                    </div>
                    <div>
                        <span class="text-gray-500">操作人:</span>
                        <span class="ml-1 font-medium">{{ showDetail.changed_by_name || '-' }}</span>
                    </div>
                </div>

                <div class="border-t border-gray-200 pt-4">
                    <h4 class="text-sm font-semibold text-gray-900 mb-3">变更对比</h4>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <p class="text-xs font-medium text-red-600 mb-2">旧值</p>
                            <div class="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1">
                                <div v-for="key in diffKeys(showDetail.old_values, showDetail.new_values)" :key="key" class="flex justify-between text-xs">
                                    <span class="text-gray-600">{{ key }}</span>
                                    <span class="font-mono text-red-800">{{ showDetail.old_values?.[key] ?? '-' }}</span>
                                </div>
                                <p v-if="!showDetail.old_values || Object.keys(showDetail.old_values).length === 0" class="text-xs text-gray-400">无</p>
                            </div>
                        </div>
                        <div>
                            <p class="text-xs font-medium text-green-600 mb-2">新值</p>
                            <div class="bg-green-50 border border-green-200 rounded-lg p-3 space-y-1">
                                <div v-for="key in diffKeys(showDetail.old_values, showDetail.new_values)" :key="key" class="flex justify-between text-xs">
                                    <span class="text-gray-600">{{ key }}</span>
                                    <span class="font-mono text-green-800">{{ showDetail.new_values?.[key] ?? '-' }}</span>
                                </div>
                                <p v-if="!showDetail.new_values || Object.keys(showDetail.new_values).length === 0" class="text-xs text-gray-400">无</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="flex items-center justify-end pt-4 mt-4 border-t border-gray-200">
                <button @click="showDetail = null" class="px-4 py-2 text-gray-700 bg-gray-100 text-sm font-medium rounded-lg hover:bg-gray-200">关闭</button>
            </div>
        </Modal>
    </AppLayout>
</template>
