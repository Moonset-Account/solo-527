<script setup>
import { usePage, router } from '@inertiajs/vue3'
import { computed } from 'vue'
import {
    EyeIcon,
    CheckCircleIcon,
    XCircleIcon,
    BanknotesIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '../../Layouts/AppLayout.vue'
import DataTable from '../../Components/DataTable.vue'
import StatusBadge from '../../Components/StatusBadge.vue'
import Button from '../../Components/Button.vue'

const page = usePage()

const vouchers = computed(() => page.props.vouchers || [])

const columns = [
    { key: 'voucher_no', label: '凭证号' },
    { key: 'order_no', label: '关联订单' },
    { key: 'type', label: '类型' },
    { key: 'amount', label: '金额(元)' },
    { key: 'status', label: '状态' },
    { key: 'created_at', label: '申请时间' },
]

const getStatusColor = (status) => {
    const colors = {
        pending: 'yellow',
        approved: 'green',
        rejected: 'red',
        paid: 'blue',
    }
    return colors[status] || 'gray'
}

const getStatusText = (status) => {
    const texts = {
        pending: '待审核',
        approved: '已通过',
        rejected: '已驳回',
        paid: '已付款',
    }
    return texts[status] || status
}

const getTypeText = (type) => {
    const texts = {
        planting: '种植补贴',
        logistics: '物流补贴',
        machinery: '农机补贴',
        insurance: '保险补贴',
        other: '其他补贴',
    }
    return texts[type] || type
}

const approve = (id) => {
    router.post(route('subsidies.approve', id), {}, { onSuccess: () => {} })
}

const reject = (id) => {
    router.post(route('subsidies.reject', id), {}, { onSuccess: () => {} })
}

const pay = (id) => {
    router.post(route('subsidies.pay', id), {}, { onSuccess: () => {} })
}
</script>

<template>
    <AppLayout title="补贴凭证">
        <div class="space-y-6">
            <div class="bg-white rounded-xl border border-gray-200 p-6">
                <DataTable
                    :columns="columns"
                    :data="vouchers"
                    searchable
                    search-placeholder="搜索凭证号、订单号..."
                >
                    <template #cell-amount="{ value }">
                        <span class="font-medium text-success">¥{{ value?.toLocaleString() || 0 }}</span>
                    </template>
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
                                @click="router.visit(`/subsidies/${row.id}`)"
                            >
                                <EyeIcon class="w-4 h-4" />
                            </Button>
                            <Button
                                v-if="row.status === 'pending'"
                                variant="success"
                                size="sm"
                                @click="approve(row.id)"
                            >
                                <CheckCircleIcon class="w-4 h-4 mr-1" />
                                审核
                            </Button>
                            <Button
                                v-if="row.status === 'pending'"
                                variant="danger"
                                size="sm"
                                @click="reject(row.id)"
                            >
                                <XCircleIcon class="w-4 h-4 mr-1" />
                                驳回
                            </Button>
                            <Button
                                v-if="row.status === 'approved'"
                                variant="primary"
                                size="sm"
                                @click="pay(row.id)"
                            >
                                <BanknotesIcon class="w-4 h-4 mr-1" />
                                付款
                            </Button>
                        </div>
                    </template>
                </DataTable>
            </div>
        </div>
    </AppLayout>
</template>
