<script setup>
import { usePage, router } from '@inertiajs/vue3'
import { computed } from 'vue'
import { ArrowLeftIcon, PencilIcon, TruckIcon } from '@heroicons/vue/24/outline'
import AppLayout from '../../Layouts/AppLayout.vue'
import StatusBadge from '../../Components/StatusBadge.vue'
import Button from '../../Components/Button.vue'

const page = usePage()

const shipment = computed(() => page.props.shipment)

const getStatusColor = (status) => {
    const colors = {
        pending: 'gray',
        picked: 'yellow',
        transit: 'blue',
        delivered: 'green',
        returned: 'purple',
        cancelled: 'red',
    }
    return colors[status] || 'gray'
}

const getStatusText = (status) => {
    const texts = {
        pending: '待发货',
        picked: '已揽收',
        transit: '运输中',
        delivered: '已签收',
        returned: '已退回',
        cancelled: '已取消',
    }
    return texts[status] || status
}

const trackingSteps = [
    { key: 'pending', label: '待发货' },
    { key: 'picked', label: '已揽收' },
    { key: 'transit', label: '运输中' },
    { key: 'delivered', label: '已签收' },
]

const getStepIndex = () => {
    const statusOrder = ['pending', 'picked', 'transit', 'delivered', 'returned', 'cancelled']
    return statusOrder.indexOf(shipment.value?.status)
}
</script>

<template>
    <AppLayout :title="`发货详情 - ${shipment.shipment_no}`">
        <div class="space-y-6">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <Button variant="ghost" @click="router.visit(route('shipments.index'))" class="-ml-2">
                    <ArrowLeftIcon class="w-5 h-5 mr-2" />
                    返回列表
                </Button>
                <Button @click="router.visit(route('shipments.edit', shipment.id))">
                    <PencilIcon class="w-5 h-5 mr-2" />
                    编辑
                </Button>
            </div>

            <div class="bg-white rounded-xl border border-gray-200 p-6">
                <div class="flex items-start justify-between mb-6">
                    <div>
                        <div class="flex items-center gap-3 mb-2">
                            <TruckIcon class="w-6 h-6 text-blue-600" />
                            <h2 class="text-xl font-semibold text-gray-900">{{ shipment.shipment_no }}</h2>
                            <StatusBadge :color="getStatusColor(shipment.status)" dot size="lg">
                                {{ getStatusText(shipment.status) }}
                            </StatusBadge>
                        </div>
                        <p class="text-sm text-gray-500">
                            关联订单：
                            <a v-if="shipment.order_id" class="text-blue-600 hover:underline cursor-pointer" @click="router.visit(route('orders.show', shipment.order_id))">
                                {{ shipment.order_no || shipment.order?.order_no || '#' + shipment.order_id }}
                            </a>
                            <span v-else>-</span>
                            · 来源大棚：{{ shipment.greenhouse?.name || '-' }}
                        </p>
                    </div>
                </div>

                <div class="mb-8">
                    <h3 class="text-sm font-medium text-gray-500 mb-4">物流进度</h3>
                    <div class="relative">
                        <div class="absolute top-3 left-0 right-0 h-0.5 bg-gray-200"></div>
                        <div
                            class="absolute top-3 left-0 h-0.5 bg-blue-600 transition-all"
                            :style="{ width: `${Math.max(0, Math.min(100, (getStepIndex() / (trackingSteps.length - 1)) * 100))}%` }"
                        ></div>
                        <div class="flex justify-between relative">
                            <div
                                v-for="(step, index) in trackingSteps"
                                :key="step.key"
                                class="flex flex-col items-center"
                            >
                                <div
                                    :class="[
                                        'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium z-10',
                                        index <= getStepIndex()
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-200 text-gray-500'
                                    ]"
                                >
                                    {{ index + 1 }}
                                </div>
                                <span
                                    :class="[
                                        'mt-2 text-xs font-medium',
                                        index <= getStepIndex() ? 'text-blue-600' : 'text-gray-500'
                                    ]"
                                >
                                    {{ step.label }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                    <div>
                        <h3 class="text-sm font-medium text-gray-500 mb-2">物流信息</h3>
                        <div class="space-y-1.5 text-sm">
                            <p class="text-gray-900">
                                <span class="text-gray-500">物流公司：</span>{{ shipment.logistics_provider || shipment.logistics_company || '-' }}
                            </p>
                            <p class="text-gray-900">
                                <span class="text-gray-500">跟踪号：</span>{{ shipment.tracking_no || '-' }}
                            </p>
                            <p class="text-gray-900">
                                <span class="text-gray-500">发货时间：</span>{{ shipment.shipped_at || shipment.shipment_date || '-' }}
                            </p>
                            <p class="text-gray-900">
                                <span class="text-gray-500">预计送达：</span>{{ shipment.estimated_delivery || shipment.estimated_arrival || '-' }}
                            </p>
                            <p class="text-gray-900">
                                <span class="text-gray-500">实际到达：</span>{{ shipment.actual_arrival || '-' }}
                            </p>
                            <p class="text-gray-900">
                                <span class="text-gray-500">重量：</span>{{ shipment.weight ? shipment.weight + ' kg' : '-' }}
                            </p>
                            <p class="text-gray-900">
                                <span class="text-gray-500">包裹数：</span>{{ shipment.packages || '-' }}
                            </p>
                        </div>
                    </div>
                    <div>
                        <h3 class="text-sm font-medium text-gray-500 mb-2">收件人信息</h3>
                        <div class="space-y-1.5 text-sm">
                            <p class="text-gray-900">
                                <span class="text-gray-500">姓名：</span>{{ shipment.recipient_name || shipment.receiver_name || '-' }}
                            </p>
                            <p class="text-gray-900">
                                <span class="text-gray-500">电话：</span>{{ shipment.recipient_phone || shipment.receiver_phone || '-' }}
                            </p>
                            <p class="text-gray-900">
                                <span class="text-gray-500">地址：</span>{{ shipment.recipient_address || shipment.receiver_address || '-' }}
                            </p>
                        </div>
                    </div>
                </div>

                <div v-if="shipment.notes || shipment.remark" class="mt-6 pt-4 border-t border-gray-100">
                    <h3 class="text-sm font-medium text-gray-500 mb-2">备注</h3>
                    <p class="text-sm text-gray-700">{{ shipment.notes || shipment.remark }}</p>
                </div>
            </div>
        </div>
    </AppLayout>
</template>
