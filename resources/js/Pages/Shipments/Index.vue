<script setup>
import { usePage, router } from '@inertiajs/vue3'
import { computed } from 'vue'
import { PlusIcon, EyeIcon, PencilIcon } from '@heroicons/vue/24/outline'
import AppLayout from '../../Layouts/AppLayout.vue'
import DataTable from '../../Components/DataTable.vue'
import StatusBadge from '../../Components/StatusBadge.vue'
import Button from '../../Components/Button.vue'

const page = usePage()

const shipments = computed(() => page.props.shipments || {})

const columns = [
    { key: 'shipment_no', label: '发货单号' },
    { key: 'order_no', label: '关联订单' },
    { key: 'logistics_provider', label: '物流公司' },
    { key: 'tracking_no', label: '跟踪号' },
    { key: 'recipient_name', label: '收件人' },
    { key: 'status', label: '状态' },
    { key: 'shipped_at', label: '发货时间' },
]

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
</script>

<template>
    <AppLayout title="发货管理">
        <div class="space-y-6">
            <div class="flex justify-end">
                <Button @click="router.visit(route('shipments.create'))">
                    <PlusIcon class="w-5 h-5 mr-2" />
                    新建发货单
                </Button>
            </div>

            <div class="bg-white rounded-xl border border-gray-200 p-6">
                <DataTable
                    :columns="columns"
                    :data="shipments.data || []"
                    :pagination="shipments"
                    searchable
                    search-placeholder="搜索发货单号、跟踪号、收件人..."
                >
                    <template #cell-status="{ value }">
                        <StatusBadge :color="getStatusColor(value)" dot>
                            {{ getStatusText(value) }}
                        </StatusBadge>
                    </template>
                    <template #actions="{ row }">
                        <div class="flex items-center justify-end gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                @click="router.visit(route('shipments.show', row.id))"
                            >
                                <EyeIcon class="w-4 h-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                @click="router.visit(route('shipments.edit', row.id))"
                            >
                                <PencilIcon class="w-4 h-4" />
                            </Button>
                        </div>
                    </template>
                </DataTable>
            </div>
        </div>
    </AppLayout>
</template>
