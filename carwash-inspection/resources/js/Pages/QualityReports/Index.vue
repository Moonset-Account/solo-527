<script setup>
import { Link, router, useForm } from '@inertiajs/vue3'
import AppLayout from '../../Layouts/AppLayout.vue'
import { ref } from 'vue'

const props = defineProps({
    reports: Object,
    filters: Object,
    technicians: Array,
})

const form = useForm({
    date_from: props.filters.date_from || '',
    date_to: props.filters.date_to || '',
    technician_id: props.filters.technician_id || '',
})

const search = () => {
    form.get('/quality-reports', { preserveState: true, preserveScroll: true })
}

const reset = () => {
    form.reset()
    form.get('/quality-reports')
}

const scoreColor = (score) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
}
</script>

<template>
    <AppLayout title="质量报告">
        <div class="space-y-6">
            <div class="flex items-center justify-between">
                <h2 class="text-2xl font-bold text-gray-900">质量报告</h2>
            </div>

            <div class="bg-white rounded-xl border border-gray-200 p-4">
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
                        <input v-model="form.date_from" type="date" class="w-full rounded-lg border-gray-300 text-sm shadow-sm" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
                        <input v-model="form.date_to" type="date" class="w-full rounded-lg border-gray-300 text-sm shadow-sm" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">技师</label>
                        <select v-model="form.technician_id" class="w-full rounded-lg border-gray-300 text-sm shadow-sm">
                            <option value="">全部</option>
                            <option v-for="tech in technicians" :key="tech.id" :value="tech.id">{{ tech.name }}</option>
                        </select>
                    </div>
                    <div class="flex items-end gap-2">
                        <button @click="search" class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">查询</button>
                        <button @click="reset" class="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200">重置</button>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead>
                            <tr class="bg-gray-50 border-b border-gray-200">
                                <th class="px-4 py-3 text-left font-medium text-gray-600">日期</th>
                                <th class="px-4 py-3 text-left font-medium text-gray-600">工单号</th>
                                <th class="px-4 py-3 text-left font-medium text-gray-600">车牌</th>
                                <th class="px-4 py-3 text-left font-medium text-gray-600">技师</th>
                                <th class="px-4 py-3 text-left font-medium text-gray-600">服务</th>
                                <th class="px-4 py-3 text-center font-medium text-gray-600">合格项</th>
                                <th class="px-4 py-3 text-center font-medium text-gray-600">不合格项</th>
                                <th class="px-4 py-3 text-center font-medium text-gray-600">警告项</th>
                                <th class="px-4 py-3 text-center font-medium text-gray-600">爽约</th>
                                <th class="px-4 py-3 text-center font-medium text-gray-600">总分</th>
                                <th class="px-4 py-3 text-left font-medium text-gray-600">操作</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100">
                            <tr v-for="report in reports.data" :key="report.id" class="hover:bg-gray-50">
                                <td class="px-4 py-3">{{ report.report_date }}</td>
                                <td class="px-4 py-3">
                                    <Link v-if="report.work_order" :href="`/work-orders/${report.work_order.id}`" class="text-blue-600">{{ report.work_order.order_no }}</Link>
                                    <span v-else>-</span>
                                </td>
                                <td class="px-4 py-3">{{ report.vehicle?.plate_number || '-' }}</td>
                                <td class="px-4 py-3">{{ report.technician?.name || '-' }}</td>
                                <td class="px-4 py-3">{{ report.service_item || '-' }}</td>
                                <td class="px-4 py-3 text-center"><span class="text-green-600 font-medium">{{ report.inspection_pass_count || 0 }}</span></td>
                                <td class="px-4 py-3 text-center"><span class="text-red-600 font-medium">{{ report.inspection_fail_count || 0 }}</span></td>
                                <td class="px-4 py-3 text-center"><span class="text-yellow-600 font-medium">{{ report.inspection_warning_count || 0 }}</span></td>
                                <td class="px-4 py-3 text-center">
                                    <span v-if="report.no_show" class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">是</span>
                                    <span v-else class="text-gray-400">否</span>
                                </td>
                                <td class="px-4 py-3 text-center font-bold" :class="scoreColor(report.overall_score)">{{ report.overall_score }}</td>
                                <td class="px-4 py-3">
                                    <Link :href="`/quality-reports/${report.id}`" class="text-blue-600 hover:text-blue-800">查看</Link>
                                </td>
                            </tr>
                            <tr v-if="reports.data.length === 0">
                                <td colspan="11" class="px-4 py-8 text-center text-gray-500">暂无数据</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div v-if="reports.links && reports.last_page > 1" class="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                    <p class="text-sm text-gray-600">共 {{ reports.total }} 条记录</p>
                    <div class="flex gap-1">
                        <a
                            v-for="link in reports.links"
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
