<script setup>
import { Link, router, useForm } from '@inertiajs/vue3'
import AppLayout from '../../Layouts/AppLayout.vue'
import StatusLabel from '../../Components/StatusLabel.vue'
import PaymentStatus from '../../Components/PaymentStatus.vue'
import { ref } from 'vue'

const props = defineProps({
    orders: Object,
    filters: Object,
    technicians: Array,
})

const form = useForm({
    status: props.filters.status || '',
    date_from: props.filters.date_from || '',
    date_to: props.filters.date_to || '',
    technician_id: props.filters.technician_id || '',
})

const search = () => {
    form.get('/work-orders', { preserveState: true, preserveScroll: true })
}

const reset = () => {
    form.reset()
    form.get('/work-orders')
}

const canMarkNoShow = (status) => ['pending', 'confirmed'].includes(status)
</script>

<template>
    <AppLayout title="工单管理">
        <div class="space-y-6">
            <div class="flex items-center justify-between">
                <h2 class="text-2xl font-bold text-gray-900">工单管理</h2>
                <Link
                    href="/work-orders/create"
                    class="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                    创建工单
                </Link>
            </div>

            <div class="bg-white rounded-xl border border-gray-200 p-4">
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">状态</label>
                        <select v-model="form.status" class="w-full rounded-lg border-gray-300 text-sm shadow-sm">
                            <option value="">全部</option>
                            <option value="pending">待处理</option>
                            <option value="confirmed">已确认</option>
                            <option value="in_progress">进行中</option>
                            <option value="completed">已完成</option>
                            <option value="no_show">爽约</option>
                            <option value="cancelled">已取消</option>
                        </select>
                    </div>
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
                                <th class="px-4 py-3 text-left font-medium text-gray-600">工单号</th>
                                <th class="px-4 py-3 text-left font-medium text-gray-600">车牌号</th>
                                <th class="px-4 py-3 text-left font-medium text-gray-600">车主</th>
                                <th class="px-4 py-3 text-left font-medium text-gray-600">服务项目</th>
                                <th class="px-4 py-3 text-left font-medium text-gray-600">技师</th>
                                <th class="px-4 py-3 text-left font-medium text-gray-600">工位</th>
                                <th class="px-4 py-3 text-left font-medium text-gray-600">状态</th>
                                <th class="px-4 py-3 text-left font-medium text-gray-600">支付状态</th>
                                <th class="px-4 py-3 text-left font-medium text-gray-600">预约时间</th>
                                <th class="px-4 py-3 text-left font-medium text-gray-600">操作</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100">
                            <tr v-for="order in orders.data" :key="order.id" class="hover:bg-gray-50">
                                <td class="px-4 py-3 font-medium text-blue-600">
                                    <Link :href="`/work-orders/${order.id}`">{{ order.order_no }}</Link>
                                </td>
                                <td class="px-4 py-3">{{ order.vehicle?.plate_number || '-' }}</td>
                                <td class="px-4 py-3">{{ order.vehicle?.owner_name || '-' }}</td>
                                <td class="px-4 py-3">{{ order.service_item?.name || '-' }}</td>
                                <td class="px-4 py-3">{{ order.technician?.name || '-' }}</td>
                                <td class="px-4 py-3">{{ order.station?.name || '-' }}</td>
                                <td class="px-4 py-3"><StatusLabel :status="order.status" /></td>
                                <td class="px-4 py-3"><PaymentStatus :status="order.payment_status" /></td>
                                <td class="px-4 py-3">{{ order.scheduled_time ? new Date(order.scheduled_time).toLocaleString('zh-CN') : '-' }}</td>
                                <td class="px-4 py-3">
                                    <div class="flex items-center gap-2">
                                        <Link :href="`/work-orders/${order.id}`" class="text-blue-600 hover:text-blue-800">查看</Link>
                                        <Link v-if="canMarkNoShow(order.status)" :href="`/work-orders/${order.id}/no-show`" class="text-red-600 hover:text-red-800">标记爽约</Link>
                                        <Link :href="`/work-orders/${order.id}/update-status`" class="text-indigo-600 hover:text-indigo-800">状态变更</Link>
                                    </div>
                                </td>
                            </tr>
                            <tr v-if="orders.data.length === 0">
                                <td colspan="10" class="px-4 py-8 text-center text-gray-500">暂无数据</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div v-if="orders.links && orders.last_page > 1" class="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                    <p class="text-sm text-gray-600">共 {{ orders.total }} 条记录</p>
                    <div class="flex gap-1">
                        <Link
                            v-for="link in orders.links"
                            :key="link.label"
                            :href="link.url || '#'"
                            :class="[link.active ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50', !link.url ? 'pointer-events-none opacity-50' : '', 'px-3 py-1 text-sm rounded border border-gray-300']"
                            v-html="link.label"
                        />
                    </div>
                </div>
            </div>
        </div>
    </AppLayout>
</template>
