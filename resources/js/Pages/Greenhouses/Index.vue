<script setup>
import { usePage, router } from '@inertiajs/vue3'
import { ref, computed } from 'vue'
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/vue/24/outline'
import AppLayout from '../../Layouts/AppLayout.vue'
import DataTable from '../../Components/DataTable.vue'
import StatusBadge from '../../Components/StatusBadge.vue'
import Button from '../../Components/Button.vue'
import Select from '../../Components/Select.vue'

const page = usePage()

const greenhouses = computed(() => page.props.greenhouses || [])

const statusFilter = ref('')
const cropTypeFilter = ref('')

const statusOptions = [
    { value: '', label: '全部状态' },
    { value: 'active', label: '运行中' },
    { value: 'maintenance', label: '维护中' },
    { value: 'inactive', label: '停用' },
]

const cropTypeOptions = [
    { value: '', label: '全部作物' },
    { value: 'tomato', label: '番茄' },
    { value: 'cucumber', label: '黄瓜' },
    { value: 'pepper', label: '辣椒' },
    { value: 'lettuce', label: '生菜' },
    { value: 'strawberry', label: '草莓' },
]

const filteredData = computed(() => {
    return greenhouses.value.filter((item) => {
        if (statusFilter.value && item.status !== statusFilter.value) return false
        if (cropTypeFilter.value && item.crop_type !== cropTypeFilter.value) return false
        return true
    })
})

const columns = [
    { key: 'name', label: '名称' },
    { key: 'code', label: '编号' },
    { key: 'location', label: '位置' },
    { key: 'area', label: '面积(㎡)' },
    { key: 'crop_type', label: '作物类型' },
    { key: 'status', label: '状态' },
    { key: 'manager_name', label: '管理员' },
]

const getStatusColor = (status) => {
    const colors = {
        active: 'green',
        maintenance: 'yellow',
        inactive: 'gray',
    }
    return colors[status] || 'gray'
}

const getStatusText = (status) => {
    const texts = {
        active: '运行中',
        maintenance: '维护中',
        inactive: '停用',
    }
    return texts[status] || status
}

const getCropTypeText = (type) => {
    const texts = {
        tomato: '番茄',
        cucumber: '黄瓜',
        pepper: '辣椒',
        lettuce: '生菜',
        strawberry: '草莓',
    }
    return texts[type] || type
}
</script>

<template>
    <AppLayout title="大棚管理">
        <div class="space-y-6">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div class="flex flex-col sm:flex-row gap-3">
                    <Select v-model="statusFilter" :options="statusOptions" class="sm:w-40" />
                    <Select v-model="cropTypeFilter" :options="cropTypeOptions" class="sm:w-40" />
                </div>
                <Button @click="router.visit('/greenhouses/create')">
                    <PlusIcon class="w-5 h-5 mr-2" />
                    新增大棚
                </Button>
            </div>

            <div class="bg-white rounded-xl border border-gray-200 p-6">
                <DataTable
                    :columns="columns"
                    :data="filteredData"
                    searchable
                    search-placeholder="搜索大棚名称、编号..."
                >
                    <template #cell-status="{ row }">
                        <StatusBadge :color="getStatusColor(row.status)" dot>
                            {{ getStatusText(row.status) }}
                        </StatusBadge>
                    </template>
                    <template #cell-crop_type="{ value }">
                        {{ getCropTypeText(value) }}
                    </template>
                    <template #actions="{ row }">
                        <div class="flex items-center justify-end gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                @click="router.visit(`/greenhouses/${row.id}/edit`)"
                            >
                                <PencilIcon class="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" class="text-danger hover:bg-danger/10 hover:text-danger">
                                <TrashIcon class="w-4 h-4" />
                            </Button>
                        </div>
                    </template>
                </DataTable>
            </div>
        </div>
    </AppLayout>
</template>
