<script setup>
import { usePage, useForm, router } from '@inertiajs/vue3'
import { computed } from 'vue'
import {
    ArrowLeftIcon,
    UserGroupIcon,
    CurrencyDollarIcon,
    ShieldExclamationIcon,
    SparklesIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '../../Layouts/AppLayout.vue'
import StatusBadge from '../../Components/StatusBadge.vue'
import Badge from '../../Components/Badge.vue'
import Button from '../../Components/Button.vue'
import Input from '../../Components/Input.vue'
import Select from '../../Components/Select.vue'

const page = usePage()

const discrepancy = computed(() => page.props.discrepancy)

const form = useForm({
    handling_notes: discrepancy.value?.handling_notes || '',
    handling_result: discrepancy.value?.handling_result || '',
    customer_complaint: discrepancy.value?.social_impact?.customer_complaint || false,
    reputation_loss_level: discrepancy.value?.social_impact?.reputation_loss_level || 'low',
    economic_loss: discrepancy.value?.social_impact?.economic_loss || '',
    remedial_measures: discrepancy.value?.social_impact?.remedial_measures || '',
})

const resultOptions = [
    { value: '', label: '请选择处理结果' },
    { value: 'compensation', label: '已赔偿' },
    { value: 'rework', label: '返工处理' },
    { value: 'discount', label: '折扣处理' },
    { value: 'accepted', label: '客户接受' },
    { value: 'other', label: '其他' },
]

const reputationOptions = [
    { value: 'low', label: '低' },
    { value: 'medium', label: '中' },
    { value: 'high', label: '高' },
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

const getResultText = (result) => {
    const texts = {
        compensation: '已赔偿',
        rework: '返工处理',
        discount: '折扣处理',
        accepted: '客户接受',
        other: '其他',
    }
    return texts[result] || result || '-'
}

const submit = () => {
    form.put(route('sorting-discrepancies.update', discrepancy.value.id), {
        onSuccess: () => {},
    })
}
</script>

<template>
    <AppLayout title="分拣差异详情">
        <div class="space-y-6">
            <Button variant="ghost" @click="router.visit('/sorting-discrepancies')" class="-ml-2">
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
                        <p class="text-sm text-gray-500">分拣任务：{{ discrepancy.task_no }} · 创建于 {{ discrepancy.created_at }}</p>
                    </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4 border-t border-gray-100">
                    <div>
                        <p class="text-sm font-medium text-gray-500">计划数量</p>
                        <p class="text-lg font-semibold text-gray-900 mt-1">{{ discrepancy.planned_quantity }} kg</p>
                    </div>
                    <div>
                        <p class="text-sm font-medium text-gray-500">实际数量</p>
                        <p class="text-lg font-semibold text-gray-900 mt-1">{{ discrepancy.actual_quantity }} kg</p>
                    </div>
                    <div>
                        <p class="text-sm font-medium text-gray-500">数量差异</p>
                        <p :class="['text-lg font-semibold mt-1', discrepancy.diff_quantity < 0 ? 'text-danger' : discrepancy.diff_quantity > 0 ? 'text-warning' : 'text-gray-900']">
                            {{ discrepancy.diff_quantity > 0 ? '+' : '' }}{{ discrepancy.diff_quantity }} kg
                        </p>
                    </div>
                    <div>
                        <p class="text-sm font-medium text-gray-500">处理结果</p>
                        <p class="text-lg font-semibold text-gray-900 mt-1">{{ getResultText(discrepancy.handling_result) }}</p>
                    </div>
                </div>

                <div v-if="discrepancy.reason" class="mt-6 pt-4 border-t border-gray-100">
                    <p class="text-sm font-medium text-gray-500">差异原因</p>
                    <p class="text-sm text-gray-700 mt-1">{{ discrepancy.reason }}</p>
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
                            />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">处理备注</label>
                            <textarea
                                v-model="form.handling_notes"
                                rows="3"
                                class="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                placeholder="请输入处理备注"
                            ></textarea>
                            <p v-if="form.errors.handling_notes" class="mt-1 text-sm text-danger">
                                {{ form.errors.handling_notes }}
                            </p>
                        </div>
                    </div>
                </div>

                <div class="bg-white rounded-xl border border-gray-200 p-6">
                    <div class="flex items-center gap-2 mb-4">
                        <ShieldExclamationIcon class="w-5 h-5 text-danger" />
                        <h3 class="text-lg font-semibold text-gray-900">社会影响评估</h3>
                    </div>
                    <div class="space-y-6">
                        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                            <div class="flex items-center gap-3">
                                <div class="p-2 rounded-lg bg-danger/10">
                                    <UserGroupIcon class="w-5 h-5 text-danger" />
                                </div>
                                <div>
                                    <p class="text-xs text-gray-500">客户投诉</p>
                                    <label class="flex items-center mt-1">
                                        <input
                                            v-model="form.customer_complaint"
                                            type="checkbox"
                                            class="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                        />
                                        <span class="ml-2 text-sm text-gray-700">存在投诉</span>
                                    </label>
                                </div>
                            </div>
                            <div class="flex items-center gap-3">
                                <div class="p-2 rounded-lg bg-warning/10">
                                    <SparklesIcon class="w-5 h-5 text-warning" />
                                </div>
                                <div class="flex-1">
                                    <p class="text-xs text-gray-500 mb-1">信誉损失</p>
                                    <Select v-model="form.reputation_loss_level" :options="reputationOptions" size="sm" />
                                </div>
                            </div>
                            <div class="md:col-span-2 flex items-center gap-3">
                                <div class="p-2 rounded-lg bg-danger/10">
                                    <CurrencyDollarIcon class="w-5 h-5 text-danger" />
                                </div>
                                <div class="flex-1">
                                    <p class="text-xs text-gray-500 mb-1">经济损失（元）</p>
                                    <Input v-model="form.economic_loss" type="number" step="0.01" placeholder="请输入损失金额" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">补救措施</label>
                            <textarea
                                v-model="form.remedial_measures"
                                rows="3"
                                class="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                placeholder="请描述已采取或计划采取的补救措施"
                            ></textarea>
                        </div>
                    </div>
                </div>

                <div class="flex items-center justify-end gap-3">
                    <Button variant="secondary" type="button" @click="router.visit('/sorting-discrepancies')">
                        取消
                    </Button>
                    <Button type="submit" :loading="form.processing">
                        保存处理结果
                    </Button>
                </div>
            </form>
        </div>
    </AppLayout>
</template>
