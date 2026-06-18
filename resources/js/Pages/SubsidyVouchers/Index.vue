<script setup>
import { usePage, router } from '@inertiajs/vue3'
import { computed } from 'vue'
import {
    EyeIcon,
    PencilIcon,
    PlusIcon,
    CheckCircleIcon,
    XCircleIcon,
    BanknotesIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '../../Layouts/AppLayout.vue'
import DataTable from '../../Components/DataTable.vue'
import StatusBadge from '../../Components/StatusBadge.vue'
import Button from '../../Components/Button.vue'

const page = usePage()

const vouchers = computed(() => page.props.vouchers || {})

const columns = [
    { key: 'voucher_no', label: '凭证号' },
    { key: 'subsidy_type', label: '类型' },
    { key: 'amount', label: '金额(元)' },
    { key: 'applicant_name', label: '申请人' },
    { key: 'status', label: '状态' },
    { key: 'apply_date', label: '申请日期' },
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
        fertilizer: '肥料补贴',
        seed: '种子补贴',
        equipment: '农机补贴',
        irrigation: '灌溉补贴',
        planting: '种植补贴',
        logistics: '物流补贴',
        machinery: '农机补贴',
        insurance: '保险补贴',
        other: '其他补贴',
    }
    return texts[type] || type
}

const approve = (id) => {
    router.post(route('subsidy-vouchers.approve', id), {}, { onSuccess: () => {} })
}

const reject = (id) => {
    const remark = prompt('请输入驳回原因：')
    if (remark && remark.trim()) {
        router.post(route('subsidy-vouchers.reject', id), { remark: remark.trim() }, { onSuccess: () => {} })
    }
}

const pay = (id) => {
    router.post(route('subsidy-vouchers.pay', id), {}, { onSuccess: () => {} })
}
</script>

<template>
    <AppLayout title="补贴凭证">
        <div class="space-y-6">
            <div class="flex justify-end">
                <Button @click="router.visit(route('subsidy-vouchers.create'))">
                    <PlusIcon class="w-5 h-5 mr-2" />
                    新建补贴申请
                </Button>
            </div>

            <div class="bg-white rounded-xl border border-gray-200 p-6">
                <DataTable
                    :columns="columns"
                    :data="vouchers.data || []"
                    :pagination="vouchers"
                    searchable
                    search-placeholder="搜索凭证号、申请人..."
                >
                    <template #cell-subsidy_type="{ value }">
                        {{ getTypeText(value) }}
                    </template>
                    <template #cell-amount="{ value }">
                        <span class="font-medium text-emerald-600">¥{{ value?.toLocaleString() || 0 }}</span>
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
                                @click="router.visit(route('subsidy-vouchers.show', row.id))"
                            >
                                <EyeIcon class="w-4 h-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                @click="router.visit(route('subsidy-vouchers.edit', row.id))"
                            >
                                <PencilIcon class="w-4 h-4" />
                            </Button>
                            <Button
                                v-if="row.status === 'pending'"
                                variant="success"
                                size="sm"
                                @click="approve(row.id)"
                            >
                                <CheckCircleIcon class="w-4 h-4 mr-1" />
                                通过
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
