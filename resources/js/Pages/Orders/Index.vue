<script setup>
import { usePage, useForm, router } from '@inertiajs/vue3'
import { ref, computed } from 'vue'
import {
    PlusIcon,
    EyeIcon,
    PencilIcon,
    ClipboardDocumentCheckIcon,
    BookmarkIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '../../Layouts/AppLayout.vue'
import DataTable from '../../Components/DataTable.vue'
import StatusBadge from '../../Components/StatusBadge.vue'
import Badge from '../../Components/Badge.vue'
import Button from '../../Components/Button.vue'
import Select from '../../Components/Select.vue'
import Input from '../../Components/Input.vue'
import SaveFilterModal from '../SavedFilters/Modals/SaveFilter.vue'

const page = usePage()

const orders = computed(() => page.props.orders || [])
const greenhouses = computed(() => page.props.greenhouses || [])
const savedFilters = computed(() => page.props.savedFilters || [])

const statusFilter = ref('')
const greenhouseFilter = ref('')
const dateFrom = ref('')
const dateTo = ref('')
const productFilter = ref('')

const showSaveFilterModal = ref(false)

const greenhouseOptions = computed(() => [
    { value: '', label: '全部大棚' },
    ...greenhouses.value.map((g) => ({ value: g.id, label: g.name })),
])

const statusOptions = [
    { value: '', label: '全部状态' },
    { value: 'pending', label: '待确认' },
    { value: 'confirmed', label: '已确认' },
    { value: 'sorting', label: '分拣中' },
    { value: 'shipped', label: '已发货' },
    { value: 'completed', label: '已完成' },
    { value: 'cancelled', label: '已取消' },
]

const productOptions = [
    { value: '', label: '全部产品' },
    { value: 'tomato', label: '番茄' },
    { value: 'cucumber', label: '黄瓜' },
    { value: 'pepper', label: '辣椒' },
    { value: 'lettuce', label: '生菜' },
    { value: 'strawberry', label: '草莓' },
]

const filteredData = computed(() => {
    return orders.value.filter((item) => {
        if (statusFilter.value && item.status !== statusFilter.value) return false
        if (greenhouseFilter.value && String(item.greenhouse_id) !== String(greenhouseFilter.value)) return false
        if (productFilter.value && item.product !== productFilter.value) return false
        if (dateFrom.value && item.created_at < dateFrom.value) return false
        if (dateTo.value && item.created_at > dateTo.value) return false
        return true
    })
})

const columns = [
    { key: 'order_no', label: '订单号' },
    { key: 'customer_name', label: '客户' },
    { key: 'product', label: '产品' },
    { key: 'quantity', label: '数量' },
    { key: 'status', label: '状态' },
    { key: 'env_data', label: '关联环境数据' },
    { key: 'subsidy_status', label: '补贴凭证' },
    { key: 'machinery_status', label: '农机预约' },
]

const getStatusColor = (status) => {
    const colors = {
        pending: 'gray',
        confirmed: 'blue',
        sorting: 'yellow',
        shipped: 'indigo',
        completed: 'green',
        cancelled: 'red',
    }
    return colors[status] || 'gray'
}

const getStatusText = (status) => {
    const texts = {
        pending: '待确认',
        confirmed: '已确认',
        sorting: '分拣中',
        shipped: '已发货',
        completed: '已完成',
        cancelled: '已取消',
    }
    return texts[status] || status
}

const getProductText = (product) => {
    const texts = {
        tomato: '番茄',
        cucumber: '黄瓜',
        pepper: '辣椒',
        lettuce: '生菜',
        strawberry: '草莓',
    }
    return texts[product] || product
}

const getSubsidyStatusColor = (status) => {
    const colors = {
        pending: 'yellow',
        approved: 'green',
        rejected: 'red',
        not_applied: 'gray',
    }
    return colors[status] || 'gray'
}

const getSubsidyStatusText = (status) => {
    const texts = {
        pending: '审核中',
        approved: '已通过',
        rejected: '已驳回',
        not_applied: '未申请',
    }
    return texts[status] || status
}

const getMachineryStatusColor = (status) => {
    const colors = {
        pending: 'yellow',
        confirmed: 'green',
        cancelled: 'red',
        not_applied: 'gray',
    }
    return colors[status] || 'gray'
}

const getMachineryStatusText = (status) => {
    const texts = {
        pending: '待确认',
        confirmed: '已预约',
        cancelled: '已取消',
        not_applied: '未预约',
    }
    return texts[status] || status
}
</script>

<template>
    <AppLayout title="订单管理">
        <div class="space-y-6">
            <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div class="flex flex-wrap gap-3">
                    <Select v-model="statusFilter" :options="statusOptions" class="sm:w-40" />
                    <Select v-model="greenhouseFilter" :options="greenhouseOptions" class="sm:w-44" />
                    <Select v-model="productFilter" :options="productOptions" class="sm:w-40" />
                    <Input v-model="dateFrom" type="date" class="sm:w-40" placeholder="开始日期" />
                    <Input v-model="dateTo" type="date" class="sm:w-40" placeholder="结束日期" />
                </div>
                <div class="flex items-center gap-2">
                    <Button variant="outline" @click="showSaveFilterModal = true">
                        <BookmarkIcon class="w-5 h-5 mr-2" />
                        保存筛选
                    </Button>
                    <Button @click="router.visit('/orders/create')">
                        <PlusIcon class="w-5 h-5 mr-2" />
                        新建订单
                    </Button>
                </div>
            </div>

            <div v-if="savedFilters.length > 0" class="flex flex-wrap gap-2">
                <Button
                    v-for="filter in savedFilters"
                    :key="filter.id"
                    variant="ghost"
                    size="sm"
                    class="bg-gray-50"
                >
                    <BookmarkIcon class="w-4 h-4 mr-1.5 text-primary" />
                    {{ filter.name }}
                </Button>
            </div>

            <div class="bg-white rounded-xl border border-gray-200 p-6">
                <DataTable
                    :columns="columns"
                    :data="filteredData"
                    searchable
                    search-placeholder="搜索订单号、客户..."
                >
                    <template #cell-product="{ value }">
                        {{ getProductText(value) }}
                    </template>
                    <template #cell-status="{ value }">
                        <StatusBadge :color="getStatusColor(value)" dot>
                            {{ getStatusText(value) }}
                        </StatusBadge>
                    </template>
                    <template #cell-env_data="{ row }">
                        <div class="flex items-center gap-1.5">
                            <Badge variant="danger" size="sm">
                                {{ row.latest_temperature || '-' }}°C
                            </Badge>
                            <Badge variant="info" size="sm">
                                {{ row.latest_humidity || '-' }}%
                            </Badge>
                        </div>
                    </template>
                    <template #cell-subsidy_status="{ value }">
                        <StatusBadge :color="getSubsidyStatusColor(value)">
                            {{ getSubsidyStatusText(value) }}
                        </StatusBadge>
                    </template>
                    <template #cell-machinery_status="{ value }">
                        <StatusBadge :color="getMachineryStatusColor(value)">
                            {{ getMachineryStatusText(value) }}
                        </StatusBadge>
                    </template>
                    <template #actions="{ row }">
                        <div class="flex items-center justify-end gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                @click="router.visit(`/orders/${row.id}`)"
                            >
                                <EyeIcon class="w-4 h-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                @click="router.visit(`/orders/${row.id}/edit`)"
                            >
                                <PencilIcon class="w-4 h-4" />
                            </Button>
                            <Button
                                variant="warning"
                                size="sm"
                                @click="router.visit(`/sorting/create?order_id=${row.id}`)"
                            >
                                <ClipboardDocumentCheckIcon class="w-4 h-4 mr-1" />
                                分拣
                            </Button>
                        </div>
                    </template>
                </DataTable>
            </div>
        </div>

        <SaveFilterModal
            :show="showSaveFilterModal"
            @close="showSaveFilterModal = false"
        />
    </AppLayout>
</template>
