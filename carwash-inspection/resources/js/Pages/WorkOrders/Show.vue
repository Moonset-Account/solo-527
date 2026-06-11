<script setup>
import { Link } from '@inertiajs/vue3'
import AppLayout from '../../Layouts/AppLayout.vue'
import StatusLabel from '../../Components/StatusLabel.vue'
import PaymentStatus from '../../Components/PaymentStatus.vue'

defineProps({
    work_order: Object,
})

const formatDate = (date) => {
    if (!date) return '-'
    return new Date(date).toLocaleString('zh-CN')
}

const inspectionResultMap = {
    pass: { label: '合格', class: 'bg-green-100 text-green-800' },
    fail: { label: '不合格', class: 'bg-red-100 text-red-800' },
    warning: { label: '警告', class: 'bg-yellow-100 text-yellow-800' },
    skip: { label: '跳过', class: 'bg-gray-100 text-gray-800' },
}
</script>

<template>
    <AppLayout title="工单详情">
        <div class="space-y-6">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <Link href="/work-orders" class="text-gray-500 hover:text-gray-700 text-sm">工单列表</Link>
                    <span class="text-gray-400">/</span>
                    <h2 class="text-2xl font-bold text-gray-900">{{ work_order.order_no }}</h2>
                </div>
                <div class="flex items-center gap-2">
                    <Link
                        v-if="['pending', 'confirmed'].includes(work_order.status)"
                        :href="`/work-orders/${work_order.id}/no-show`"
                        class="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700"
                    >
                        标记爽约
                    </Link>
                    <Link
                        :href="`/work-orders/${work_order.id}/update-status`"
                        class="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
                    >
                        变更状态
                    </Link>
                    <Link
                        v-if="work_order.inspection_template_id"
                        :href="`/work-orders/${work_order.id}/inspection`"
                        class="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700"
                    >
                        开始检测
                    </Link>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div class="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">订单信息</h3>
                    <dl class="space-y-3">
                        <div class="flex justify-between">
                            <dt class="text-sm text-gray-500">工单号</dt>
                            <dd class="text-sm font-medium text-gray-900">{{ work_order.order_no }}</dd>
                        </div>
                        <div class="flex justify-between">
                            <dt class="text-sm text-gray-500">状态</dt>
                            <dd><StatusLabel :status="work_order.status" /></dd>
                        </div>
                        <div class="flex justify-between">
                            <dt class="text-sm text-gray-500">支付状态</dt>
                            <dd><PaymentStatus :status="work_order.payment_status" /></dd>
                        </div>
                        <div class="flex justify-between">
                            <dt class="text-sm text-gray-500">总金额</dt>
                            <dd class="text-sm font-medium text-gray-900">¥{{ work_order.total_amount || '0.00' }}</dd>
                        </div>
                        <div class="flex justify-between">
                            <dt class="text-sm text-gray-500">支付方式</dt>
                            <dd class="text-sm text-gray-900">{{ work_order.payment_method || '-' }}</dd>
                        </div>
                        <div class="flex justify-between">
                            <dt class="text-sm text-gray-500">预约时间</dt>
                            <dd class="text-sm text-gray-900">{{ formatDate(work_order.scheduled_time) }}</dd>
                        </div>
                        <div class="flex justify-between">
                            <dt class="text-sm text-gray-500">开始时间</dt>
                            <dd class="text-sm text-gray-900">{{ formatDate(work_order.started_at) }}</dd>
                        </div>
                        <div class="flex justify-between">
                            <dt class="text-sm text-gray-500">完成时间</dt>
                            <dd class="text-sm text-gray-900">{{ formatDate(work_order.completed_at) }}</dd>
                        </div>
                    </dl>
                </div>

                <div class="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">车辆信息</h3>
                    <dl class="space-y-3" v-if="work_order.vehicle">
                        <div class="flex justify-between">
                            <dt class="text-sm text-gray-500">车牌号</dt>
                            <dd class="text-sm font-medium text-gray-900">{{ work_order.vehicle.plate_number }}</dd>
                        </div>
                        <div class="flex justify-between">
                            <dt class="text-sm text-gray-500">品牌</dt>
                            <dd class="text-sm text-gray-900">{{ work_order.vehicle.make || '-' }}</dd>
                        </div>
                        <div class="flex justify-between">
                            <dt class="text-sm text-gray-500">型号</dt>
                            <dd class="text-sm text-gray-900">{{ work_order.vehicle.model || '-' }}</dd>
                        </div>
                        <div class="flex justify-between">
                            <dt class="text-sm text-gray-500">颜色</dt>
                            <dd class="text-sm text-gray-900">{{ work_order.vehicle.color || '-' }}</dd>
                        </div>
                        <div class="flex justify-between">
                            <dt class="text-sm text-gray-500">车主</dt>
                            <dd class="text-sm text-gray-900">{{ work_order.vehicle.owner_name || '-' }}</dd>
                        </div>
                        <div class="flex justify-between">
                            <dt class="text-sm text-gray-500">联系电话</dt>
                            <dd class="text-sm text-gray-900">{{ work_order.vehicle.owner_phone || '-' }}</dd>
                        </div>
                    </dl>
                    <p v-else class="text-sm text-gray-500">暂无车辆信息</p>
                </div>

                <div class="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">分配信息</h3>
                    <dl class="space-y-3">
                        <div class="flex justify-between">
                            <dt class="text-sm text-gray-500">服务项目</dt>
                            <dd class="text-sm font-medium text-gray-900">{{ work_order.service_item?.name || '-' }}</dd>
                        </div>
                        <div class="flex justify-between">
                            <dt class="text-sm text-gray-500">技师</dt>
                            <dd class="text-sm text-gray-900">{{ work_order.technician?.name || '-' }}</dd>
                        </div>
                        <div class="flex justify-between">
                            <dt class="text-sm text-gray-500">工位</dt>
                            <dd class="text-sm text-gray-900">{{ work_order.station?.name || '-' }}</dd>
                        </div>
                        <div class="flex justify-between">
                            <dt class="text-sm text-gray-500">检测模板</dt>
                            <dd class="text-sm text-gray-900">{{ work_order.inspection_template?.name || '-' }}</dd>
                        </div>
                        <div class="flex justify-between">
                            <dt class="text-sm text-gray-500">备注</dt>
                            <dd class="text-sm text-gray-900">{{ work_order.notes || '-' }}</dd>
                        </div>
                    </dl>
                </div>
            </div>

            <div v-if="work_order.status_timeline && work_order.status_timeline.length > 0" class="bg-white rounded-xl border border-gray-200 p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">状态变更记录</h3>
                <div class="relative">
                    <div class="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                    <div v-for="(timeline, index) in work_order.status_timeline" :key="index" class="relative ml-0 pl-10 pb-6 last:pb-0">
                        <div class="absolute left-2.5 top-1 w-3 h-3 rounded-full" :class="index === 0 ? 'bg-blue-600' : 'bg-gray-400'"></div>
                        <div class="flex items-start justify-between">
                            <div>
                                <div class="flex items-center gap-2">
                                    <StatusLabel :status="timeline.from_status" v-if="timeline.from_status" />
                                    <svg v-if="timeline.from_status" class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
                                    <StatusLabel :status="timeline.to_status" />
                                </div>
                                <p class="mt-1 text-sm text-gray-600">操作人: {{ timeline.handler_name || '-' }}</p>
                                <p v-if="timeline.remarks" class="text-sm text-gray-500">备注: {{ timeline.remarks }}</p>
                            </div>
                            <span class="text-xs text-gray-400">{{ formatDate(timeline.created_at) }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="work_order.inspections && work_order.inspections.length > 0" class="bg-white rounded-xl border border-gray-200 p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">检测结果</h3>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead>
                            <tr class="bg-gray-50 border-b border-gray-200">
                                <th class="px-4 py-3 text-left font-medium text-gray-600">检测项</th>
                                <th class="px-4 py-3 text-left font-medium text-gray-600">类别</th>
                                <th class="px-4 py-3 text-left font-medium text-gray-600">结果</th>
                                <th class="px-4 py-3 text-left font-medium text-gray-600">备注</th>
                                <th class="px-4 py-3 text-left font-medium text-gray-600">检测人</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100">
                            <tr v-for="insp in work_order.inspections" :key="insp.id" class="hover:bg-gray-50">
                                <td class="px-4 py-3">{{ insp.item_name }}</td>
                                <td class="px-4 py-3">{{ insp.category }}</td>
                                <td class="px-4 py-3">
                                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" :class="inspectionResultMap[insp.result]?.class || 'bg-gray-100 text-gray-800'">
                                        {{ inspectionResultMap[insp.result]?.label || insp.result }}
                                    </span>
                                </td>
                                <td class="px-4 py-3">{{ insp.remarks || '-' }}</td>
                                <td class="px-4 py-3">{{ insp.inspector?.name || insp.inspected_by || '-' }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div v-if="work_order.no_show_records && work_order.no_show_records.length > 0" class="bg-white rounded-xl border border-gray-200 p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">爽约记录</h3>
                <div class="space-y-4">
                    <div v-for="record in work_order.no_show_records" :key="record.id" class="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <dl class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div>
                                <dt class="text-xs text-red-600">原因</dt>
                                <dd class="text-sm text-red-900">{{ record.reason }}</dd>
                            </div>
                            <div>
                                <dt class="text-xs text-red-600">联系次数</dt>
                                <dd class="text-sm text-red-900">{{ record.contact_attempts }}</dd>
                            </div>
                            <div>
                                <dt class="text-xs text-red-600">是否改约</dt>
                                <dd class="text-sm text-red-900">{{ record.rescheduled ? '是' : '否' }}</dd>
                            </div>
                            <div>
                                <dt class="text-xs text-red-600">处理人</dt>
                                <dd class="text-sm text-red-900">{{ record.handler_name || '-' }}</dd>
                            </div>
                        </dl>
                    </div>
                </div>
            </div>
        </div>
    </AppLayout>
</template>
