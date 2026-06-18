<script setup>
import { usePage, router } from '@inertiajs/vue3'
import { computed } from 'vue'
import { PlusIcon, EyeIcon, PencilIcon } from '@heroicons/vue/24/outline'
import AppLayout from '../../Layouts/AppLayout.vue'
import DataTable from '../../Components/DataTable.vue'
import StatusBadge from '../../Components/StatusBadge.vue'
import Button from '../../Components/Button.vue'

const page = usePage()

const sortingTasks = computed(() => page.props.sortingTasks || [])

const columns = [
    { key: 'task_no', label: '任务号' },
    { key: 'order_no', label: '关联订单' },
    { key: 'greenhouse_name', label: '大棚' },
    { key: 'assignee_name', label: '分配人员' },
    { key: 'planned_quantity', label: '计划数量(kg)' },
    { key: 'actual_quantity', label: '实际数量(kg)' },
    { key: 'status', label: '状态' },
    { key: 'progress', label: '进度' },
]

const getStatusColor = (status) => {
    const colors = {
        pending: 'gray',
        in_progress: 'yellow',
        completed: 'green',
        cancelled: 'red',
    }
    return colors[status] || 'gray'
}

const getStatusText = (status) => {
    const texts = {
        pending: '待开始',
        in_progress: '进行中',
        completed: '已完成',
        cancelled: '已取消',
    }
    return texts[status] || status
}

const getProgress = (planned, actual) => {
    if (!planned || planned <= 0) return 0
    return Math.min(100, Math.round((actual / planned) * 100))
}
</script>

<template>
    <AppLayout title="分拣任务">
        <div class="space-y-6">
            <div class="flex justify-end">
                <Button @click="router.visit('/sorting/create')">
                    <PlusIcon class="w-5 h-5 mr-2" />
                    新建分拣任务
                </Button>
            </div>

            <div class="bg-white rounded-xl border border-gray-200 p-6">
                <DataTable
                    :columns="columns"
                    :data="sortingTasks"
                    searchable
                    search-placeholder="搜索任务号、订单..."
                >
                    <template #cell-status="{ value }">
                        <StatusBadge :color="getStatusColor(value)" dot>
                            {{ getStatusText(value) }}
                        </StatusBadge>
                    </template>
                    <template #cell-progress="{ row }">
                        <div class="w-full max-w-[120px]">
                            <div class="flex items-center justify-between text-xs text-gray-500 mb-1">
                                <span>{{ getProgress(row.planned_quantity, row.actual_quantity) }}%</span>
                            </div>
                            <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    class="h-full bg-primary rounded-full transition-all"
                                    :style="{ width: `${getProgress(row.planned_quantity, row.actual_quantity)}%` }"
                                ></div>
                            </div>
                        </div>
                    </template>
                    <template #actions="{ row }">
                        <div class="flex items-center justify-end gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                @click="router.visit(`/sorting/${row.id}`)"
                            >
                                <EyeIcon class="w-4 h-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                @click="router.visit(`/sorting/${row.id}/edit`)"
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
