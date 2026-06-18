<script setup>
import { usePage, useForm, router } from '@inertiajs/vue3'
import { computed, ref } from 'vue'
import {
    ArrowLeftIcon,
    PlusIcon,
    ExclamationTriangleIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '../../Layouts/AppLayout.vue'
import StatusBadge from '../../Components/StatusBadge.vue'
import Button from '../../Components/Button.vue'
import Input from '../../Components/Input.vue'
import Select from '../../Components/Select.vue'
import Badge from '../../Components/Badge.vue'

const page = usePage()

const task = computed(() => page.props.task)
const discrepancies = computed(() => page.props.discrepancies || [])

const showAddDiscrepancy = ref(false)

const discrepancyForm = useForm({
    discrepancy_type: '',
    planned_qty: '',
    actual_qty: '',
    difference: '',
    unit: 'kg',
    remark: '',
    sorting_task_id: '',
    order_id: '',
})

const discrepancyTypeOptions = [
    { value: 'quantity', label: '数量短缺' },
    { value: 'overage', label: '数量超收' },
    { value: 'quality', label: '质量问题' },
    { value: 'damage', label: '损坏' },
    { value: 'other', label: '其他' },
]

const getStatusColor = (status) => {
    const colors = {
        pending: 'gray',
        in_progress: 'yellow',
        completed: 'green',
        cancelled: 'red',
    }
    return colors[status] || 'gray'
}

const getStatusText = (status) => {
    const texts = {
        pending: '待开始',
        in_progress: '进行中',
        completed: '已完成',
        cancelled: '已取消',
    }
    return texts[status] || status
}

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

const getDiscrepancyTypeColor = (type) => {
    const colors = {
        quantity: 'danger',
        overage: 'warning',
        quality: 'warning',
        damage: 'danger',
        other: 'default',
    }
    return colors[type] || 'default'
}

const calculateDifference = () => {
    const planned = parseFloat(discrepancyForm.planned_qty) || 0
    const actual = parseFloat(discrepancyForm.actual_qty) || 0
    discrepancyForm.difference = (actual - planned).toFixed(2)
}

const submitDiscrepancy = () => {
    discrepancyForm.sorting_task_id = task.value.id
    discrepancyForm.order_id = task.value.order_id
    discrepancyForm.difference = parseFloat(discrepancyForm.difference) || 0
    discrepancyForm.post(route('sorting-discrepancies.store'), {
        onSuccess: () => {
            discrepancyForm.reset()
            showAddDiscrepancy.value = false
        },
    })
}

const getProgress = () => {
    if (!task.value.planned_quantity || task.value.planned_quantity <= 0) return 0
    return Math.min(100, Math.round((task.value.actual_quantity / task.value.planned_quantity) * 100))
}
</script>

<template>
    <AppLayout :title="`分拣任务 - ${task.task_no}`">
        <div class="space-y-6">
            <Button variant="ghost" @click="router.visit(route('sorting-tasks.index'))" class="-ml-2">
                <ArrowLeftIcon class="w-5 h-5 mr-2" />
                返回列表
            </Button>

            <div class="bg-white rounded-xl border border-gray-200 p-6">
                <div class="flex items-start justify-between mb-6">
                    <div>
                        <h2 class="text-xl font-semibold text-gray-900">{{ task.task_no }}</h2>
                        <p class="text-sm text-gray-500 mt-1">创建于 {{ task.created_at }}</p>
                    </div>
                    <StatusBadge :color="getStatusColor(task.status)" dot size="lg">
                        {{ getStatusText(task.status) }}
                    </StatusBadge>
                </div>

                <div class="mb-6">
                    <div class="flex items-center justify-between text-sm mb-2">
                        <span class="text-gray-600">完成进度</span>
                        <span class="font-medium text-gray-900">{{ getProgress() }}%</span>
                    </div>
                    <div class="h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            class="h-full bg-primary rounded-full transition-all"
                            :style="{ width: `${getProgress()}%` }"
                        ></div>
                    </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4 border-t border-gray-100">
                    <div>
                        <p class="text-sm font-medium text-gray-500">关联订单</p>
                        <p class="text-sm font-medium text-primary mt-1">{{ task.order_no }}</p>
                    </div>
                    <div>
                        <p class="text-sm font-medium text-gray-500">大棚</p>
                        <p class="text-sm text-gray-900 mt-1">{{ task.greenhouse_name }}</p>
                    </div>
                    <div>
                        <p class="text-sm font-medium text-gray-500">分配人员</p>
                        <p class="text-sm text-gray-900 mt-1">{{ task.assignee_name }}</p>
                    </div>
                    <div>
                        <p class="text-sm font-medium text-gray-500">计划日期</p>
                        <p class="text-sm text-gray-900 mt-1">{{ task.planned_sort_date }}</p>
                    </div>
                    <div>
                        <p class="text-sm font-medium text-gray-500">计划数量</p>
                        <p class="text-sm text-gray-900 mt-1">{{ task.planned_quantity }} kg</p>
                    </div>
                    <div>
                        <p class="text-sm font-medium text-gray-500">实际数量</p>
                        <p class="text-sm text-gray-900 mt-1">{{ task.actual_quantity || 0 }} kg</p>
                    </div>
                </div>

                <div v-if="task.remark" class="mt-4 pt-4 border-t border-gray-100">
                    <p class="text-sm font-medium text-gray-500">备注</p>
                    <p class="text-sm text-gray-700 mt-1">{{ task.remark }}</p>
                </div>
            </div>

            <div class="bg-white rounded-xl border border-gray-200 p-6">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-semibold text-gray-900">分拣差异记录</h3>
                    <Button size="sm" @click="showAddDiscrepancy = !showAddDiscrepancy">
                        <PlusIcon class="w-4 h-4 mr-2" />
                        新增差异
                    </Button>
                </div>

                <div v-if="showAddDiscrepancy" class="mb-6 p-4 bg-gray-50 rounded-lg">
                    <form @submit.prevent="submitDiscrepancy" class="space-y-4">
                        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <Select
                                v-model="discrepancyForm.discrepancy_type"
                                label="差异类型"
                                :options="discrepancyTypeOptions"
                                :error="discrepancyForm.errors.discrepancy_type"
                                required
                            />
                            <Input
                                v-model="discrepancyForm.planned_qty"
                                type="number"
                                label="计划数量(kg)"
                                :error="discrepancyForm.errors.planned_qty"
                                @change="calculateDifference"
                                required
                            />
                            <Input
                                v-model="discrepancyForm.actual_qty"
                                type="number"
                                label="实际数量(kg)"
                                :error="discrepancyForm.errors.actual_qty"
                                @change="calculateDifference"
                                required
                            />
                            <Input
                                v-model="discrepancyForm.difference"
                                type="number"
                                label="差异数量(kg)"
                                :error="discrepancyForm.errors.difference"
                                required
                            />
                        </div>
                        <Input
                            v-model="discrepancyForm.remark"
                            label="差异原因备注"
                            placeholder="请详细说明差异原因"
                            :error="discrepancyForm.errors.remark"
                        />
                        <div class="flex justify-end gap-3">
                            <Button variant="secondary" type="button" @click="showAddDiscrepancy = false">
                                取消
                            </Button>
                            <Button type="submit" :loading="discrepancyForm.processing">
                                保存差异
                            </Button>
                        </div>
                    </form>
                </div>

                <div v-if="discrepancies.length === 0" class="text-center py-8 text-gray-500 text-sm">
                    暂无差异记录
                </div>
                <div v-else class="space-y-3">
                    <div
                        v-for="d in discrepancies"
                        :key="d.id"
                        class="flex items-start justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                        @click="router.visit(route('sorting-discrepancies.show', d.id))"
                    >
                        <div class="flex items-start gap-3">
                            <ExclamationTriangleIcon class="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
                            <div>
                                <div class="flex items-center gap-2 mb-1">
                                    <Badge :variant="getDiscrepancyTypeColor(d.discrepancy_type)">
                                        {{ getDiscrepancyTypeText(d.discrepancy_type) }}
                                    </Badge>
                                    <span class="text-sm text-gray-500">{{ d.created_at }}</span>
                                </div>
                                <p class="text-sm text-gray-700">
                                    计划：{{ d.planned_qty }}kg · 实际：{{ d.actual_qty }}kg · 差异：
                                    <span :class="d.difference < 0 ? 'text-danger' : 'text-warning'">
                                        {{ d.difference > 0 ? '+' : '' }}{{ d.difference }}kg
                                    </span>
                                </p>
                                <p v-if="d.remark" class="text-sm text-gray-500 mt-1">{{ d.remark }}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </AppLayout>
</template>
