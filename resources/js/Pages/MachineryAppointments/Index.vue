<script setup>
import { usePage, router } from '@inertiajs/vue3'
import { computed, ref } from 'vue'
import { PlusIcon, WrenchIcon, CalendarDaysIcon } from '@heroicons/vue/24/outline'
import AppLayout from '../../Layouts/AppLayout.vue'
import DataTable from '../../Components/DataTable.vue'
import StatusBadge from '../../Components/StatusBadge.vue'
import Button from '../../Components/Button.vue'

const page = usePage()

const appointments = computed(() => page.props.appointments || [])

const columns = [
    { key: 'appointment_no', label: '预约号' },
    { key: 'order_no', label: '关联订单' },
    { key: 'machinery_type', label: '农机类型' },
    { key: 'time_slot', label: '预约时间段' },
    { key: 'status', label: '状态' },
    { key: 'created_at', label: '预约时间' },
]

const getStatusColor = (status) => {
    const colors = {
        pending: 'yellow',
        confirmed: 'green',
        cancelled: 'red',
        completed: 'blue',
    }
    return colors[status] || 'gray'
}

const getStatusText = (status) => {
    const texts = {
        pending: '待确认',
        confirmed: '已确认',
        cancelled: '已取消',
        completed: '已完成',
    }
    return texts[status] || status
}

const getMachineryTypeText = (type) => {
    const texts = {
        tractor: '拖拉机',
        harvester: '收割机',
        transplanter: '插秧机',
        sprayer: '喷雾机',
        irrigation: '灌溉设备',
        other: '其他',
    }
    return texts[type] || type
}
</script>

<template>
    <AppLayout title="农机预约">
        <div class="space-y-6">
            <div class="bg-white rounded-xl border border-gray-200 p-6">
                <DataTable
                    :columns="columns"
                    :data="appointments"
                    searchable
                    search-placeholder="搜索预约号、订单号..."
                >
                    <template #cell-machinery_type="{ value }">
                        <div class="flex items-center gap-2">
                            <WrenchIcon class="w-4 h-4 text-warning" />
                            {{ getMachineryTypeText(value) }}
                        </div>
                    </template>
                    <template #cell-time_slot="{ value }">
                        <div class="flex items-center gap-2">
                            <CalendarDaysIcon class="w-4 h-4 text-gray-400" />
                            {{ value }}
                        </div>
                    </template>
                    <template #cell-status="{ value }">
                        <StatusBadge :color="getStatusColor(value)" dot>
                            {{ getStatusText(value) }}
                        </StatusBadge>
                    </template>
                </DataTable>
            </div>
        </div>
    </AppLayout>
</template>
