<script setup>
import { usePage, router } from '@inertiajs/vue3'
import { ref, computed } from 'vue'
import { CheckIcon, CheckCircleIcon } from '@heroicons/vue/24/outline'
import AppLayout from '../../Layouts/AppLayout.vue'
import DataTable from '../../Components/DataTable.vue'
import StatusBadge from '../../Components/StatusBadge.vue'
import Button from '../../Components/Button.vue'
import Select from '../../Components/Select.vue'

const page = usePage()

const alerts = computed(() => page.props.alerts || [])

const levelFilter = ref('')
const statusFilter = ref('')

const levelOptions = [
    { value: '', label: '全部级别' },
    { value: 'high', label: '严重' },
    { value: 'medium', label: '警告' },
    { value: 'low', label: '提示' },
]

const statusOptions = [
    { value: '', label: '全部状态' },
    { value: 'pending', label: '待处理' },
    { value: 'acknowledged', label: '已确认' },
    { value: 'resolved', label: '已解决' },
]

const filteredData = computed(() => {
    return alerts.value.filter((item) => {
        if (levelFilter.value && item.level !== levelFilter.value) return false
        if (statusFilter.value && item.status !== statusFilter.value) return false
        return true
    })
})

const columns = [
    { key: 'level', label: '级别' },
    { key: 'greenhouse_name', label: '大棚' },
    { key: 'message', label: '告警内容' },
    { key: 'status', label: '状态' },
    { key: 'created_at', label: '触发时间' },
    { key: 'resolved_at', label: '解决时间' },
]

const getLevelColor = (level) => {
    const colors = {
        high: 'red',
        medium: 'yellow',
        low: 'blue',
    }
    return colors[level] || 'gray'
}

const getLevelText = (level) => {
    const texts = {
        high: '严重',
        medium: '警告',
        low: '提示',
    }
    return texts[level] || level
}

const getStatusColor = (status) => {
    const colors = {
        pending: 'red',
        acknowledged: 'yellow',
        resolved: 'green',
    }
    return colors[status] || 'gray'
}

const getStatusText = (status) => {
    const texts = {
        pending: '待处理',
        acknowledged: '已确认',
        resolved: '已解决',
    }
    return texts[status] || status
}

const acknowledge = (id) => {
    router.post(route('environment-alerts.acknowledge', id), {}, {
        onSuccess: () => {},
    })
}

const resolve = (id) => {
    router.post(route('environment-alerts.resolve', id), {}, {
        onSuccess: () => {},
    })
}
</script>

<template>
    <AppLayout title="异常告警">
        <div class="space-y-6">
            <div class="flex flex-col sm:flex-row gap-3">
                <Select v-model="levelFilter" :options="levelOptions" class="sm:w-40" />
                <Select v-model="statusFilter" :options="statusOptions" class="sm:w-40" />
            </div>

            <div class="bg-white rounded-xl border border-gray-200 p-6">
                <DataTable
                    :columns="columns"
                    :data="filteredData"
                    searchable
                    search-placeholder="搜索告警内容..."
                >
                    <template #cell-level="{ value }">
                        <StatusBadge :color="getLevelColor(value)" dot>
                            {{ getLevelText(value) }}
                        </StatusBadge>
                    </template>
                    <template #cell-status="{ value }">
                        <StatusBadge :color="getStatusColor(value)" dot>
                            {{ getStatusText(value) }}
                        </StatusBadge>
                    </template>
                    <template #actions="{ row }">
                        <div class="flex items-center justify-end gap-2">
                            <Button
                                v-if="row.status === 'pending'"
                                variant="warning"
                                size="sm"
                                @click="acknowledge(row.id)"
                            >
                                <CheckIcon class="w-4 h-4 mr-1" />
                                确认
                            </Button>
                            <Button
                                v-if="row.status !== 'resolved'"
                                variant="success"
                                size="sm"
                                @click="resolve(row.id)"
                            >
                                <CheckCircleIcon class="w-4 h-4 mr-1" />
                                解决
                            </Button>
                        </div>
                    </template>
                </DataTable>
            </div>
        </div>
    </AppLayout>
</template>
