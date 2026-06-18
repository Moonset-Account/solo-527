<script setup>
import { usePage, router } from '@inertiajs/vue3'
import { computed, ref } from 'vue'
import { EyeIcon, ChartPieIcon } from '@heroicons/vue/24/outline'
import AppLayout from '../../Layouts/AppLayout.vue'
import DataTable from '../../Components/DataTable.vue'
import StatusBadge from '../../Components/StatusBadge.vue'
import Badge from '../../Components/Badge.vue'
import Button from '../../Components/Button.vue'
import Select from '../../Components/Select.vue'

const page = usePage()

const discrepancies = computed(() => page.props.discrepancies || [])
const socialImpactSummary = computed(() => page.props.socialImpactSummary || {
    totalComplaints: 0,
    reputationLoss: '低',
    economicLoss: 0,
})

const typeFilter = ref('')
const statusFilter = ref('')

const typeOptions = [
    { value: '', label: '全部类型' },
    { value: 'shortage', label: '数量短缺' },
    { value: 'overage', label: '数量超收' },
    { value: 'quality', label: '质量问题' },
    { value: 'damage', label: '损坏' },
    { value: 'other', label: '其他' },
]

const statusOptions = [
    { value: '', label: '全部状态' },
    { value: 'pending', label: '待处理' },
    { value: 'processing', label: '处理中' },
    { value: 'resolved', label: '已解决' },
]

const filteredData = computed(() => {
    return discrepancies.value.filter((item) => {
        if (typeFilter.value && item.discrepancy_type !== typeFilter.value) return false
        if (statusFilter.value && item.status !== statusFilter.value) return false
        return true
    })
})

const columns = [
    { key: 'task_no', label: '分拣任务' },
    { key: 'discrepancy_type', label: '差异类型' },
    { key: 'planned_quantity', label: '计划数量(kg)' },
    { key: 'actual_quantity', label: '实际数量(kg)' },
    { key: 'diff_quantity', label: '数量差异(kg)' },
    { key: 'status', label: '处理状态' },
]

const getDiscrepancyTypeText = (type) => {
    const texts = {
        shortage: '数量短缺',
        overage: '数量超收',
        quality: '质量问题',
        damage: '损坏',
        other: '其他',
    }
    return texts[type] || type
}

const getDiscrepancyTypeVariant = (type) => {
    const variants = {
        shortage: 'danger',
        overage: 'warning',
        quality: 'warning',
        damage: 'danger',
        other: 'default',
    }
    return variants[type] || 'default'
}

const getStatusColor = (status) => {
    const colors = {
        pending: 'red',
        processing: 'yellow',
        resolved: 'green',
    }
    return colors[status] || 'gray'
}

const getStatusText = (status) => {
    const texts = {
        pending: '待处理',
        processing: '处理中',
        resolved: '已解决',
    }
    return texts[status] || status
}
</script>

<template>
    <AppLayout title="分拣差异">
        <div class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div class="bg-white rounded-xl border border-gray-200 p-5">
                    <div class="flex items-center gap-3">
                        <div class="p-3 rounded-lg bg-danger/10">
                            <ChartPieIcon class="w-6 h-6 text-danger" />
                        </div>
                        <div>
                            <p class="text-sm font-medium text-gray-500">客户投诉</p>
                            <p class="mt-1 text-2xl font-bold text-gray-900">{{ socialImpactSummary.totalComplaints }}</p>
                        </div>
                    </div>
                </div>
                <div class="bg-white rounded-xl border border-gray-200 p-5">
                    <div class="flex items-center gap-3">
                        <div class="p-3 rounded-lg bg-warning/10">
                            <ChartPieIcon class="w-6 h-6 text-warning" />
                        </div>
                        <div>
                            <p class="text-sm font-medium text-gray-500">信誉损失</p>
                            <p class="mt-1 text-2xl font-bold text-gray-900">{{ socialImpactSummary.reputationLoss }}</p>
                        </div>
                    </div>
                </div>
                <div class="bg-white rounded-xl border border-gray-200 p-5 md:col-span-2">
                    <div class="flex items-center gap-3">
                        <div class="p-3 rounded-lg bg-danger/10">
                            <ChartPieIcon class="w-6 h-6 text-danger" />
                        </div>
                        <div>
                            <p class="text-sm font-medium text-gray-500">累计经济损失</p>
                            <p class="mt-1 text-2xl font-bold text-danger">¥{{ socialImpactSummary.economicLoss?.toLocaleString() || 0 }}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="flex flex-col sm:flex-row gap-3">
                <Select v-model="typeFilter" :options="typeOptions" class="sm:w-40" />
                <Select v-model="statusFilter" :options="statusOptions" class="sm:w-40" />
            </div>

            <div class="bg-white rounded-xl border border-gray-200 p-6">
                <DataTable
                    :columns="columns"
                    :data="filteredData"
                    searchable
                    search-placeholder="搜索任务号..."
                >
                    <template #cell-discrepancy_type="{ value }">
                        <Badge :variant="getDiscrepancyTypeVariant(value)">
                            {{ getDiscrepancyTypeText(value) }}
                        </Badge>
                    </template>
                    <template #cell-diff_quantity="{ value }">
                        <span :class="value < 0 ? 'text-danger font-medium' : value > 0 ? 'text-warning font-medium' : ''">
                            {{ value > 0 ? '+' : '' }}{{ value }}
                        </span>
                    </template>
                    <template #cell-status="{ value }">
                        <StatusBadge :color="getStatusColor(value)" dot>
                            {{ getStatusText(value) }}
                        </StatusBadge>
                    </template>
                    <template #actions="{ row }">
                        <Button
                            variant="ghost"
                            size="sm"
                            @click="router.visit(`/sorting-discrepancies/${row.id}`)"
                        >
                            <EyeIcon class="w-4 h-4" />
                        </Button>
                    </template>
                </DataTable>
            </div>
        </div>
    </AppLayout>
</template>
