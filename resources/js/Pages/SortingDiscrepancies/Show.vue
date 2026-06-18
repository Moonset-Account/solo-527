<script setup>
import { usePage, useForm, router } from '@inertiajs/vue3'
import { computed, ref } from 'vue'
import {
    ArrowLeftIcon,
    UserGroupIcon,
    CurrencyDollarIcon,
    ShieldExclamationIcon,
    SparklesIcon,
    PaperClipIcon,
    PaperAirplaneIcon,
    ClockIcon,
    UserIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '../../Layouts/AppLayout.vue'
import StatusBadge from '../../Components/StatusBadge.vue'
import Badge from '../../Components/Badge.vue'
import Button from '../../Components/Button.vue'
import Input from '../../Components/Input.vue'
import Select from '../../Components/Select.vue'

const page = usePage()

const discrepancy = computed(() => page.props.discrepancy)
const comments = computed(() => page.props.comments || [])
const attachments = computed(() => page.props.attachments || [])
const auditLogs = computed(() => page.props.auditLogs || [])

const commentForm = useForm({
    content: '',
})

const fileInputRef = ref(null)

const submitComment = () => {
    commentForm.post(route('comments.store', { commentableType: 'sorting-discrepancies', commentableId: discrepancy.value.id }), {
        onSuccess: () => commentForm.reset(),
    })
}

const handleFileUpload = (e) => {
    const files = e.target.files
    if (files && files.length > 0) {
        const formData = new FormData()
        Array.from(files).forEach((file) => formData.append('files[]', file))
        router.post(route('attachments.store', { attachableType: 'sorting-discrepancies', attachableId: discrepancy.value.id }), formData, {
            onSuccess: () => {
                if (fileInputRef.value) fileInputRef.value.value = ''
            },
        })
    }
}

const form = useForm({
    remark: discrepancy.value?.remark || '',
    handling_result: discrepancy.value?.handling_result || '',
    social_impact: {
        customer_complaint: discrepancy.value?.social_impact?.customer_complaint || false,
        reputation_loss_level: discrepancy.value?.social_impact?.reputation_loss_level || 'low',
        economic_loss: discrepancy.value?.social_impact?.economic_loss || '',
        remedial_measures: discrepancy.value?.social_impact?.remedial_measures || '',
    },
})

const resultOptions = [
    { value: '', label: '请选择处理结果' },
    { value: 'refund', label: '退款处理' },
    { value: 'rework', label: '返工处理' },
    { value: 'accept', label: '客户接受' },
    { value: 'reject', label: '客户拒收' },
    { value: 'other', label: '其他' },
]

const reputationOptions = [
    { value: 'low', label: '低' },
    { value: 'medium', label: '中' },
    { value: 'high', label: '高' },
]

const getDiscrepancyTypeText = (type) => {
    const texts = {
        quantity: '数量短缺',
        overage: '数量超收',
        quality: '质量问题',
        damage: '损坏',
        other: '其他',
    }
    return texts[type] || type
}

const getDiscrepancyTypeVariant = (type) => {
    const variants = {
        quantity: 'danger',
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
        handled: 'yellow',
        closed: 'green',
    }
    return colors[status] || 'gray'
}

const getStatusText = (status) => {
    const texts = {
        pending: '待处理',
        handled: '已处理',
        closed: '已结案',
    }
    return texts[status] || status
}

const getResultText = (result) => {
    const texts = {
        refund: '退款处理',
        rework: '返工处理',
        accept: '客户接受',
        reject: '客户拒收',
        other: '其他',
    }
    return texts[result] || result || '-'
}

const submit = () => {
    form.post(route('sorting-discrepancies.handle', discrepancy.value.id), {
        data: {
            remark: form.remark,
            handling_result: form.handling_result,
            social_impact: form.social_impact,
        },
        onSuccess: () => {
            router.visit(route('sorting-discrepancies.index'))
        },
    })
}
</script>

<template>
    <AppLayout title="分拣差异详情">
        <div class="space-y-6">
            <Button variant="ghost" @click="router.visit(route('sorting-discrepancies.index'))" class="-ml-2">
                <ArrowLeftIcon class="w-5 h-5 mr-2" />
                返回列表
            </Button>

            <div class="bg-white rounded-xl border border-gray-200 p-6">
                <div class="flex items-start justify-between mb-6">
                    <div>
                        <div class="flex items-center gap-3 mb-2">
                            <h2 class="text-xl font-semibold text-gray-900">差异详情</h2>
                            <Badge :variant="getDiscrepancyTypeVariant(discrepancy.discrepancy_type)">
                                {{ getDiscrepancyTypeText(discrepancy.discrepancy_type) }}
                            </Badge>
                            <StatusBadge :color="getStatusColor(discrepancy.status)" dot>
                                {{ getStatusText(discrepancy.status) }}
                            </StatusBadge>
                        </div>
                        <p class="text-sm text-gray-500">
                            分拣任务：{{ discrepancy.task_no }} ·
                            关联订单：{{ discrepancy.order_no }} ·
                            创建于 {{ discrepancy.created_at }}
                        </p>
                    </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4 border-t border-gray-100">
                    <div>
                        <p class="text-sm font-medium text-gray-500">计划数量</p>
                        <p class="text-lg font-semibold text-gray-900 mt-1">{{ discrepancy.planned_qty }} kg</p>
                    </div>
                    <div>
                        <p class="text-sm font-medium text-gray-500">实际数量</p>
                        <p class="text-lg font-semibold text-gray-900 mt-1">{{ discrepancy.actual_qty }} kg</p>
                    </div>
                    <div>
                        <p class="text-sm font-medium text-gray-500">数量差异</p>
                        <p :class="['text-lg font-semibold mt-1', discrepancy.difference < 0 ? 'text-red-600' : discrepancy.difference > 0 ? 'text-yellow-600' : 'text-gray-900']">
                            {{ discrepancy.difference > 0 ? '+' : '' }}{{ discrepancy.difference }} kg
                        </p>
                    </div>
                    <div>
                        <p class="text-sm font-medium text-gray-500">处理结果</p>
                        <p class="text-lg font-semibold text-gray-900 mt-1">{{ getResultText(discrepancy.handling_result) }}</p>
                    </div>
                </div>

                <div v-if="discrepancy.remark" class="mt-6 pt-4 border-t border-gray-100">
                    <p class="text-sm font-medium text-gray-500">差异原因</p>
                    <p class="text-sm text-gray-700 mt-1">{{ discrepancy.remark }}</p>
                </div>
            </div>

            <form @submit.prevent="submit" class="space-y-6">
                <div class="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">处理表单</h3>
                    <div class="space-y-6">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Select
                                v-model="form.handling_result"
                                label="处理结果"
                                :options="resultOptions"
                                :error="form.errors.handling_result"
                                required
                            />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">处理备注</label>
                            <textarea
                                v-model="form.remark"
                                rows="3"
                                class="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                placeholder="请输入处理备注"
                                required
                            ></textarea>
                            <p v-if="form.errors.remark" class="mt-1 text-sm text-red-600">
                                {{ form.errors.remark }}
                            </p>
                        </div>
                    </div>
                </div>

                <div class="bg-white rounded-xl border border-gray-200 p-6">
                    <div class="flex items-center gap-2 mb-4">
                        <ShieldExclamationIcon class="w-5 h-5 text-red-600" />
                        <h3 class="text-lg font-semibold text-gray-900">社会影响评估</h3>
                    </div>
                    <div class="space-y-6">
                        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                            <div class="flex items-center gap-3">
                                <div class="p-2 rounded-lg bg-red-100">
                                    <UserGroupIcon class="w-5 h-5 text-red-600" />
                                </div>
                                <div>
                                    <p class="text-xs text-gray-500">客户投诉</p>
                                    <label class="flex items-center mt-1">
                                        <input
                                            v-model="form.social_impact.customer_complaint"
                                            type="checkbox"
                                            class="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                        />
                                        <span class="ml-2 text-sm text-gray-700">存在投诉</span>
                                    </label>
                                </div>
                            </div>
                            <div class="flex items-center gap-3">
                                <div class="p-2 rounded-lg bg-yellow-100">
                                    <SparklesIcon class="w-5 h-5 text-yellow-600" />
                                </div>
                                <div class="flex-1">
                                    <p class="text-xs text-gray-500 mb-1">信誉损失</p>
                                    <Select v-model="form.social_impact.reputation_loss_level" :options="reputationOptions" size="sm" />
                                </div>
                            </div>
                            <div class="md:col-span-2 flex items-center gap-3">
                                <div class="p-2 rounded-lg bg-red-100">
                                    <CurrencyDollarIcon class="w-5 h-5 text-red-600" />
                                </div>
                                <div class="flex-1">
                                    <p class="text-xs text-gray-500 mb-1">经济损失（元）</p>
                                    <Input v-model="form.social_impact.economic_loss" type="number" step="0.01" placeholder="请输入损失金额" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">补救措施</label>
                            <textarea
                                v-model="form.social_impact.remedial_measures"
                                rows="3"
                                class="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                placeholder="请描述已采取或计划采取的补救措施"
                            ></textarea>
                        </div>
                    </div>
                </div>

                <div class="flex items-center justify-end gap-3">
                    <Button variant="secondary" type="button" @click="router.visit(route('sorting-discrepancies.index'))">
                        取消
                    </Button>
                    <Button type="submit" :loading="form.processing">
                        保存处理结果
                    </Button>
                </div>
            </form>

            <div class="bg-white rounded-xl border border-gray-200 p-6">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-semibold text-gray-900">附件</h3>
                    <Button variant="outline" size="sm" @click="fileInputRef?.click()">
                        <PaperClipIcon class="w-4 h-4 mr-2" />
                        上传附件
                    </Button>
                    <input ref="fileInputRef" type="file" multiple class="hidden" @change="handleFileUpload" />
                </div>
                <div v-if="attachments.length === 0" class="text-center py-8 text-gray-500 text-sm">
                    暂无附件
                </div>
                <div v-else class="space-y-2">
                    <div
                        v-for="attachment in attachments"
                        :key="attachment.id"
                        class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <div class="flex items-center gap-3">
                            <PaperClipIcon class="w-5 h-5 text-gray-400" />
                            <div>
                                <p class="text-sm font-medium text-gray-900">{{ attachment.file_name }}</p>
                                <p class="text-xs text-gray-500">{{ attachment.created_at }}</p>
                            </div>
                        </div>
                        <a :href="route('attachments.download', attachment.id)" class="text-sm text-primary hover:text-primary-dark">下载</a>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-xl border border-gray-200 p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">备注</h3>
                <div class="space-y-4">
                    <div v-if="comments.length === 0" class="text-center py-6 text-gray-500 text-sm">
                        暂无备注
                    </div>
                    <div
                        v-for="comment in comments"
                        :key="comment.id"
                        class="flex gap-3"
                    >
                        <div class="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                            <UserIcon class="w-4 h-4 text-gray-500" />
                        </div>
                        <div class="flex-1">
                            <div class="flex items-center gap-2">
                                <span class="text-sm font-medium text-gray-900">{{ comment.user_name }}</span>
                                <span class="text-xs text-gray-500">{{ comment.created_at }}</span>
                            </div>
                            <p class="text-sm text-gray-700 mt-1">{{ comment.content }}</p>
                        </div>
                    </div>
                </div>
                <form @submit.prevent="submitComment" class="mt-4 flex gap-3">
                    <Input
                        v-model="commentForm.content"
                        placeholder="添加备注..."
                        class="flex-1"
                        :error="commentForm.errors.content"
                    />
                    <Button type="submit" :loading="commentForm.processing">
                        <PaperAirplaneIcon class="w-5 h-5" />
                    </Button>
                </form>
            </div>

            <div class="bg-white rounded-xl border border-gray-200 p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">修改历史</h3>
                <div class="relative">
                    <div class="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                    <div class="space-y-4">
                        <div v-if="auditLogs.length === 0" class="text-center py-6 text-gray-500 text-sm relative pl-10">
                            暂无修改记录
                        </div>
                        <div
                            v-for="log in auditLogs"
                            :key="log.id"
                            class="relative pl-10"
                        >
                            <div class="absolute left-2 top-1 w-5 h-5 rounded-full bg-white border-2 border-primary flex items-center justify-center">
                                <ClockIcon class="w-2.5 h-2.5 text-primary" />
                            </div>
                            <div class="bg-gray-50 rounded-lg p-3">
                                <div class="flex items-center gap-2 mb-1">
                                    <span class="text-sm font-medium text-gray-900">{{ log.user_name }}</span>
                                    <span class="text-xs text-gray-500">{{ log.created_at }}</span>
                                    <Badge variant="primary" size="sm">{{ log.action }}</Badge>
                                </div>
                                <p class="text-sm text-gray-600">{{ log.description }}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </AppLayout>
</template>
