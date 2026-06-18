<script setup>
import { usePage, router } from '@inertiajs/vue3'
import { computed, ref } from 'vue'
import {
    ArrowLeftIcon,
    PencilIcon,
    PlusIcon,
    DocumentIcon,
    CheckCircleIcon,
    XCircleIcon,
    BanknotesIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '../../Layouts/AppLayout.vue'
import StatusBadge from '../../Components/StatusBadge.vue'
import Button from '../../Components/Button.vue'

const page = usePage()

const voucher = computed(() => page.props.voucher)
const proofFiles = computed(() => page.props.proofFiles || [])

const fileInputRef = ref(null)

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

const handleFileUpload = (e) => {
    const files = e.target.files
    if (files && files.length > 0) {
        const formData = new FormData()
        Array.from(files).forEach((file) => formData.append('files[]', file))
        router.post(route('subsidy-vouchers.upload', voucher.value.id), formData, {
            forceFormData: true,
            onSuccess: () => {
                if (fileInputRef.value) fileInputRef.value.value = ''
            },
        })
    }
}

const approve = () => {
    router.post(route('subsidy-vouchers.approve', voucher.value.id), {}, { onSuccess: () => {} })
}

const reject = () => {
    const remark = prompt('请输入驳回原因：')
    if (remark && remark.trim()) {
        router.post(route('subsidy-vouchers.reject', voucher.value.id), { remark: remark.trim() }, { onSuccess: () => {} })
    }
}

const pay = () => {
    router.post(route('subsidy-vouchers.pay', voucher.value.id), {}, { onSuccess: () => {} })
}
</script>

<template>
    <AppLayout :title="`补贴凭证 - ${voucher.voucher_no}`">
        <div class="space-y-6">
            <div class="flex items-center justify-between">
                <Button variant="ghost" @click="router.visit(route('subsidy-vouchers.index'))" class="-ml-2">
                    <ArrowLeftIcon class="w-5 h-5 mr-2" />
                    返回列表
                </Button>
                <div class="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        @click="router.visit(route('subsidy-vouchers.edit', voucher.id))"
                    >
                        <PencilIcon class="w-4 h-4 mr-2" />
                        编辑
                    </Button>
                    <Button
                        v-if="voucher.status === 'pending'"
                        variant="success"
                        size="sm"
                        @click="approve"
                    >
                        <CheckCircleIcon class="w-4 h-4 mr-2" />
                        审核通过
                    </Button>
                    <Button
                        v-if="voucher.status === 'pending'"
                        variant="danger"
                        size="sm"
                        @click="reject"
                    >
                        <XCircleIcon class="w-4 h-4 mr-2" />
                        驳回
                    </Button>
                    <Button
                        v-if="voucher.status === 'approved'"
                        variant="primary"
                        size="sm"
                        @click="pay"
                    >
                        <BanknotesIcon class="w-4 h-4 mr-2" />
                        标记已付款
                    </Button>
                </div>
            </div>

            <div class="bg-white rounded-xl border border-gray-200 p-6">
                <div class="flex items-start justify-between mb-6">
                    <div>
                        <h2 class="text-xl font-semibold text-gray-900">{{ voucher.voucher_no }}</h2>
                        <p class="text-sm text-gray-500 mt-1">
                            来源大棚：{{ voucher.greenhouse?.name || '-' }}
                            · 申请于 {{ voucher.apply_date || voucher.created_at }}
                        </p>
                    </div>
                    <StatusBadge :color="getStatusColor(voucher.status)" dot size="lg">
                        {{ getStatusText(voucher.status) }}
                    </StatusBadge>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4 border-t border-gray-100">
                    <div>
                        <p class="text-sm font-medium text-gray-500">补贴类型</p>
                        <p class="text-base text-gray-900 mt-1">{{ getTypeText(voucher.subsidy_type || voucher.type) }}</p>
                    </div>
                    <div>
                        <p class="text-sm font-medium text-gray-500">申请金额</p>
                        <p class="text-base font-semibold text-emerald-600 mt-1">¥{{ voucher.amount?.toLocaleString() || 0 }}</p>
                    </div>
                    <div>
                        <p class="text-sm font-medium text-gray-500">申请人</p>
                        <p class="text-base text-gray-900 mt-1">{{ voucher.applicant_name || voucher.applicant?.name || '-' }}</p>
                    </div>
                    <div>
                        <p class="text-sm font-medium text-gray-500">审核人</p>
                        <p class="text-base text-gray-900 mt-1">{{ voucher.reviewer_name || voucher.approvedBy?.name || '-' }}</p>
                    </div>
                </div>

                <div v-if="voucher.description || voucher.remark" class="mt-6 pt-4 border-t border-gray-100">
                    <h3 class="text-sm font-medium text-gray-500 mb-2">补贴说明</h3>
                    <p class="text-sm text-gray-700">{{ voucher.description || voucher.remark }}</p>
                </div>

                <div v-if="voucher.status === 'rejected' && (voucher.reject_reason || voucher.remark)" class="mt-6 pt-4 border-t border-gray-100">
                    <h3 class="text-sm font-medium text-red-600 mb-2">驳回原因</h3>
                    <p class="text-sm text-gray-700">{{ voucher.reject_reason || voucher.remark }}</p>
                </div>
            </div>

            <div class="bg-white rounded-xl border border-gray-200 p-6">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-semibold text-gray-900">证明文件</h3>
                    <label class="cursor-pointer">
                        <input
                            ref="fileInputRef"
                            type="file"
                            multiple
                            class="hidden"
                            @change="handleFileUpload"
                        />
                        <Button variant="outline" size="sm">
                            <PlusIcon class="w-4 h-4 mr-2" />
                            上传证明文件
                        </Button>
                    </label>
                </div>

                <div v-if="proofFiles.length === 0" class="text-center py-8 text-gray-500 text-sm">
                    暂无证明文件，点击右上角按钮上传
                </div>
                <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div
                        v-for="file in proofFiles"
                        :key="file.id"
                        class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <div class="p-2 rounded-lg bg-blue-50">
                            <DocumentIcon class="w-5 h-5 text-blue-600" />
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-sm font-medium text-gray-900 truncate">{{ file.name }}</p>
                            <p class="text-xs text-gray-500">{{ file.size }}</p>
                        </div>
                        <a :href="file.url" target="_blank" class="text-sm text-blue-600 hover:text-blue-800 flex-shrink-0">
                            查看
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </AppLayout>
</template>
