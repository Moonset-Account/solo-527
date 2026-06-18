<script setup>
import { usePage, router } from '@inertiajs/vue3'
import { computed } from 'vue'
import { PlusIcon, EyeIcon, PencilIcon } from '@heroicons/vue/24/outline'
import AppLayout from '../../Layouts/AppLayout.vue'
import DataTable from '../../Components/DataTable.vue'
import StatusBadge from '../../Components/StatusBadge.vue'
import Button from '../../Components/Button.vue'

const page = usePage()

const shipments = computed(() => page.props.shipments || [])

const columns = [
    { key: 'shipment_no', label: '发货单号' },
    { key: 'order_no', label: '关联订单' },
    { key: 'logistics_provider', label: '物流公司' },
    { key: 'tracking_no', label: '跟踪号' },
    { key: 'status', label: '状态' },
    { key: 'shipped_at', label: '发货时间' },
]

const getStatusColor = (status) => {
    const colors = {
        pending: 'gray',
        picked: 'yellow',
        in_transit: 'blue',
        delivered: 'green',
        failed: 'red',
        returned: 'purple',
    }
    return colors[status] || 'gray'
}

const getStatusText = (status) => {
    const texts = {
        pending: '待发货',
        picked: '已揽收',
        in_transit: '运输中',
        delivered: '已签收',
        failed: '派送失败',
        returned: '已退回',
    }
    return texts[status] || status
}
</script>

<template>
    <AppLayout title="发货管理">
        <div class="space-y-6">
            <div class="flex justify-end">
                <Button @click="router.visit('/shipping/create')">
                    <PlusIcon class="w-5 h-5 mr-2" />
                    新建发货单
                </Button>
            </div>

            <div class="bg-white rounded-xl border border-gray-200 p-6">
                <DataTable
                    :columns="columns"
                    :data="shipments"
                    searchable
                    search-placeholder="搜索发货单号、跟踪号..."
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
                                @click="router.visit(`/shipping/${row.id}`)"
                            >
                                <EyeIcon class="w-4 h-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                @click="router.visit(`/shipping/${row.id}/edit`)"
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
