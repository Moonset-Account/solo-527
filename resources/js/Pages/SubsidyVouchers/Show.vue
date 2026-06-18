<script setup>
import { usePage, router } from '@inertiajs/vue3'
import { computed, ref } from 'vue'
import {
    ArrowLeftIcon,
    PaperClipIcon,
    PlusIcon,
    DocumentIcon,
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
        router.post(route('subsidies.proofs.store', voucher.value.id), formData, {
            onSuccess: () => {
                if (fileInputRef.value) fileInputRef.value.value = ''
            },
        })
    }
}
</script>

<template>
    <AppLayout :title="`补贴凭证 - ${voucher.voucher_no}`">
        <div class="space-y-6">
            <Button variant="ghost" @click="router.visit('/subsidies')" class="-ml-2">
                <ArrowLeftIcon class="w-5 h-5 mr-2" />
                返回列表
            </Button>

            <div class="bg-white rounded-xl border border-gray-200 p-6">
                <div class="flex items-start justify-between mb-6">
                    <div>
                        <h2 class="text-xl font-semibold text-gray-900">{{ voucher.voucher_no }}</h2>
                        <p class="text-sm text-gray-500 mt-1">
                            关联订单：
                            <a class="text-primary hover:underline cursor-pointer" @click="router.visit(`/orders/${voucher.order_id}`)">
                                {{ voucher.order_no }}
                            </a>
                            · 申请于 {{ voucher.created_at }}
                        </p>
                    </div>
                    <StatusBadge :color="getStatusColor(voucher.status)" dot size="lg">
                        {{ getStatusText(voucher.status) }}
                    </StatusBadge>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4 border-t border-gray-100">
                    <div>
                        <p class="text-sm font-medium text-gray-500">补贴类型</p>
                        <p class="text-base text-gray-900 mt-1">{{ getTypeText(voucher.type) }}</p>
                    </div>
                    <div>
                        <p class="text-sm font-medium text-gray-500">申请金额</p>
                        <p class="text-base font-semibold text-success mt-1">¥{{ voucher.amount?.toLocaleString() || 0 }}</p>
                    </div>
                    <div>
                        <p class="text-sm font-medium text-gray-500">申请人</p>
                        <p class="text-base text-gray-900 mt-1">{{ voucher.applicant_name || '-' }}</p>
                    </div>
                    <div>
                        <p class="text-sm font-medium text-gray-500">审核人</p>
                        <p class="text-base text-gray-900 mt-1">{{ voucher.reviewer_name || '-' }}</p>
                    </div>
                </div>

                <div v-if="voucher.description" class="mt-6 pt-4 border-t border-gray-100">
                    <h3 class="text-sm font-medium text-gray-500 mb-2">补贴说明</h3>
                    <p class="text-sm text-gray-700">{{ voucher.description }}</p>
                </div>

                <div v-if="voucher.reject_reason" class="mt-6 pt-4 border-t border-gray-100">
                    <h3 class="text-sm font-medium text-danger mb-2">驳回原因</h3>
                    <p class="text-sm text-gray-700">{{ voucher.reject_reason }}</p>
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
                    暂无证明文件
                </div>
                <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div
                        v-for="file in proofFiles"
                        :key="file.id"
                        class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <div class="p-2 rounded-lg bg-primary/10">
                            <DocumentIcon class="w-5 h-5 text-primary" />
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-sm font-medium text-gray-900 truncate">{{ file.name }}</p>
                            <p class="text-xs text-gray-500">{{ file.size }}</p>
                        </div>
                        <a :href="file.url" class="text-sm text-primary hover:text-primary-dark flex-shrink-0">
                            查看
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </AppLayout>
</template>
