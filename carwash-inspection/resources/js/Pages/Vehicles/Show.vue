<script setup>
import { Link } from '@inertiajs/vue3'
import AppLayout from '../../Layouts/AppLayout.vue'
import StatusLabel from '../../Components/StatusLabel.vue'

defineProps({
    vehicle: Object,
})

const formatDate = (date) => {
    if (!date) return '-'
    return new Date(date).toLocaleString('zh-CN')
}
</script>

<template>
    <AppLayout title="车辆详情">
        <div class="space-y-6">
            <div class="flex items-center gap-3">
                <Link href="/vehicles" class="text-gray-500 hover:text-gray-700 text-sm">车辆列表</Link>
                <span class="text-gray-400">/</span>
                <h2 class="text-2xl font-bold text-gray-900">{{ vehicle.plate_number }}</h2>
            </div>

            <div class="bg-white rounded-xl border border-gray-200 p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">车辆信息</h3>
                <dl class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    <div>
                        <dt class="text-sm text-gray-500">车牌号</dt>
                        <dd class="text-sm font-medium text-gray-900">{{ vehicle.plate_number }}</dd>
                    </div>
                    <div>
                        <dt class="text-sm text-gray-500">品牌</dt>
                        <dd class="text-sm text-gray-900">{{ vehicle.make || '-' }}</dd>
                    </div>
                    <div>
                        <dt class="text-sm text-gray-500">型号</dt>
                        <dd class="text-sm text-gray-900">{{ vehicle.model || '-' }}</dd>
                    </div>
                    <div>
                        <dt class="text-sm text-gray-500">年份</dt>
                        <dd class="text-sm text-gray-900">{{ vehicle.year || '-' }}</dd>
                    </div>
                    <div>
                        <dt class="text-sm text-gray-500">颜色</dt>
                        <dd class="text-sm text-gray-900">{{ vehicle.color || '-' }}</dd>
                    </div>
                    <div>
                        <dt class="text-sm text-gray-500">车主</dt>
                        <dd class="text-sm text-gray-900">{{ vehicle.owner_name || '-' }}</dd>
                    </div>
                    <div>
                        <dt class="text-sm text-gray-500">联系电话</dt>
                        <dd class="text-sm text-gray-900">{{ vehicle.owner_phone || '-' }}</dd>
                    </div>
                    <div>
                        <dt class="text-sm text-gray-500">备注</dt>
                        <dd class="text-sm text-gray-900">{{ vehicle.notes || '-' }}</dd>
                    </div>
                </dl>
            </div>

            <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div class="px-6 py-4 border-b border-gray-200">
                    <h3 class="text-lg font-semibold text-gray-900">工单历史</h3>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead>
                            <tr class="bg-gray-50 border-b border-gray-200">
                                <th class="px-4 py-3 text-left font-medium text-gray-600">工单号</th>
                                <th class="px-4 py-3 text-left font-medium text-gray-600">服务项目</th>
                                <th class="px-4 py-3 text-left font-medium text-gray-600">技师</th>
                                <th class="px-4 py-3 text-left font-medium text-gray-600">状态</th>
                                <th class="px-4 py-3 text-left font-medium text-gray-600">预约时间</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100">
                            <tr v-for="order in (vehicle.work_orders || vehicle.workOrders || [])" :key="order.id" class="hover:bg-gray-50">
                                <td class="px-4 py-3 font-medium text-blue-600">
                                    <Link :href="`/work-orders/${order.id}`">{{ order.order_no }}</Link>
                                </td>
                                <td class="px-4 py-3">{{ order.service_item?.name || order.serviceItem?.name || '-' }}</td>
                                <td class="px-4 py-3">{{ order.technician?.name || '-' }}</td>
                                <td class="px-4 py-3"><StatusLabel :status="order.status" /></td>
                                <td class="px-4 py-3">{{ formatDate(order.scheduled_time) }}</td>
                            </tr>
                            <tr v-if="(vehicle.work_orders || vehicle.workOrders || []).length === 0">
                                <td colspan="5" class="px-4 py-8 text-center text-gray-500">暂无工单记录</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </AppLayout>
</template>
