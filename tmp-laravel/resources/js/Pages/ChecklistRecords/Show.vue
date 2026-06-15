<template>
    <div class="space-y-6">
        <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
                <Link :href="route('checklist-records.index')" class="text-gray-400 hover:text-gray-600">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                    </svg>
                </Link>
                <div>
                    <h1 class="text-2xl font-bold text-gray-900">{{ record.title }}</h1>
                    <p class="text-sm text-gray-500 mt-1">{{ record.checklist?.title }}</p>
                </div>
            </div>
            <div class="flex items-center space-x-3">
                <StatusBadge :status="record.status" type="record" />
                <Link
                    v-if="record.status === 'draft'"
                    :href="route('checklist-records.edit', record.id)"
                    class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                >
                    编辑
                </Link>
                <button
                    v-if="record.status === 'draft'"
                    @click="submitRecord"
                    class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                >
                    提交审核
                </button>
                <div v-if="record.status === 'submitted'" class="flex space-x-2">
                    <button
                        @click="reviewRecord('reviewed')"
                        class="px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                    >
                        通过
                    </button>
                    <button
                        @click="reviewRecord('returned')"
                        class="px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                    >
                        退回
                    </button>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="lg:col-span-2 space-y-6">
                <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                    <h3 class="text-lg font-medium text-gray-900 mb-4">基本信息</h3>
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span class="text-gray-500">检查清单：</span>
                            <span class="font-medium">{{ record.checklist?.title || '-' }}</span>
                        </div>
                        <div>
                            <span class="text-gray-500">状态：</span>
                            <StatusBadge :status="record.status" type="record" />
                        </div>
                        <div>
                            <span class="text-gray-500">部门：</span>
                            <span class="font-medium">{{ record.department || '-' }}</span>
                        </div>
                        <div>
                            <span class="text-gray-500">责任人：</span>
                            <span class="font-medium">{{ record.responsible_user?.name || '-' }}</span>
                        </div>
                        <div>
                            <span class="text-gray-500">检查日期：</span>
                            <span class="font-medium">{{ record.check_date || '-' }}</span>
                        </div>
                        <div>
                            <span class="text-gray-500">整改期限：</span>
                            <span class="font-medium" :class="{ 'text-red-600': isOverdue }">
                                {{ record.due_date || '-' }}
                            </span>
                        </div>
                        <div>
                            <span class="text-gray-500">提交人：</span>
                            <span class="font-medium">{{ record.submitted_by?.name || '-' }}</span>
                        </div>
                        <div>
                            <span class="text-gray-500">审核人：</span>
                            <span class="font-medium">{{ record.reviewed_by?.name || '-' }}</span>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t border-gray-200" v-if="record.description">
                        <h4 class="text-sm font-medium text-gray-700 mb-2">描述</h4>
                        <p class="text-sm text-gray-600">{{ record.description }}</p>
                    </div>
                </div>

                <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-medium text-gray-900">检查项结果</h3>
                        <div class="flex items-center space-x-4 text-sm">
                            <span>通过: <strong class="text-green-600">{{ passCount }}</strong></span>
                            <span>不符合: <strong class="text-red-600">{{ failCount }}</strong></span>
                            <span>待处理: <strong class="text-yellow-600">{{ pendingCount }}</strong></span>
                        </div>
                    </div>

                    <div class="space-y-3">
                        <div
                            v-for="(item, index) in record.items"
                            :key="item.id"
                            class="border border-gray-200 rounded-lg p-4"
                            :class="{
                                'border-green-200 bg-green-50': item.result === 'pass',
                                'border-red-200 bg-red-50': item.result === 'fail' || item.result === 'partial',
                                'border-yellow-200 bg-yellow-50': item.result === 'pending'
                            }"
                        >
                            <div class="flex items-start justify-between">
                                <div class="flex-1">
                                    <div class="flex items-center space-x-2">
                                        <span class="text-sm font-medium text-gray-900">
                                            {{ index + 1 }}. {{ item.checklist_item?.title }}
                                        </span>
                                        <span
                                            class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                                            :class="resultClass(item.result)"
                                        >
                                            {{ resultLabel(item.result) }}
                                        </span>
                                    </div>
                                    <p class="text-xs text-gray-500 mt-1" v-if="item.checklist_item?.criteria">
                                        标准: {{ item.checklist_item?.criteria }}
                                    </p>
                                </div>
                                <span v-if="item.has_gap" class="text-xs font-medium text-red-600 bg-red-100 px-2 py-0.5 rounded">
                                    已生成缺口
                                </span>
                            </div>
                            <div class="mt-2 grid grid-cols-2 gap-3 text-xs">
                                <div v-if="item.evidence">
                                    <span class="text-gray-500">证据: </span>
                                    <span class="text-gray-700">{{ item.evidence }}</span>
                                </div>
                                <div v-if="item.remark">
                                    <span class="text-gray-500">备注: </span>
                                    <span class="text-gray-700">{{ item.remark }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="space-y-6">
                <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                    <h3 class="text-lg font-medium text-gray-900 mb-4">相关合规缺口</h3>
                    <div class="space-y-3" v-if="record.gaps?.length">
                        <div
                            v-for="gap in record.gaps"
                            :key="gap.id"
                            class="border border-gray-200 rounded-lg p-3 hover:bg-gray-50"
                        >
                            <div class="flex items-start justify-between">
                                <div class="flex-1 min-w-0">
                                    <Link
                                        :href="route('compliance-gaps.show', gap.id)"
                                        class="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                                    >
                                        {{ gap.gap_no }}
                                    </Link>
                                    <p class="text-sm text-gray-900 truncate">{{ gap.title }}</p>
                                </div>
                                <StatusBadge :status="gap.status" type="gap" />
                            </div>
                            <div class="mt-2 flex items-center justify-between text-xs">
                                <SeverityBadge :severity="gap.severity" />
                                <span class="text-gray-500">期限: {{ gap.due_date || '-' }}</span>
                            </div>
                        </div>
                    </div>
                    <p v-else class="text-sm text-gray-500 text-center py-4">
                        暂无合规缺口
                    </p>
                </div>

                <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                    <h3 class="text-lg font-medium text-gray-900 mb-4">检查统计</h3>
                    <div class="space-y-3">
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-500">总检查项</span>
                            <span class="font-medium">{{ record.items?.length || 0 }} 项</span>
                        </div>
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-500">通过项</span>
                            <span class="font-medium text-green-600">{{ passCount }} 项</span>
                        </div>
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-500">不符合项</span>
                            <span class="font-medium text-red-600">{{ failCount }} 项</span>
                        </div>
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-500">待处理项</span>
                            <span class="font-medium text-yellow-600">{{ pendingCount }} 项</span>
                        </div>
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-500">生成缺口数</span>
                            <span class="font-medium text-red-600">{{ gapCount }} 项</span>
                        </div>
                        <div class="pt-2 border-t border-gray-200">
                            <div class="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    class="bg-green-500 h-2 rounded-full"
                                    :style="{ width: passRate + '%' }"
                                ></div>
                            </div>
                            <p class="text-xs text-gray-500 mt-1 text-right">
                                通过率: {{ passRate }}%
                            </p>
                        </div>
                    </div>
                </div>

                <div class="bg-indigo-50 rounded-lg border border-indigo-200 p-5">
                    <h3 class="text-sm font-medium text-indigo-900 mb-2">操作提示</h3>
                    <ul class="text-sm text-indigo-700 space-y-1">
                        <li>• 草稿状态可继续编辑</li>
                        <li>• 提交后进入审核流程</li>
                        <li>• 不符合项自动生成合规缺口</li>
                        <li>• 可在缺口管理中跟踪整改进度</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { Link, router } from '@inertiajs/vue3'
import StatusBadge from '@/Components/StatusBadge.vue'
import SeverityBadge from '@/Components/SeverityBadge.vue'

const props = defineProps({
    record: Object,
})

const passCount = computed(() => {
    return props.record.items?.filter(i => i.result === 'pass').length || 0
})

const failCount = computed(() => {
    return props.record.items?.filter(i => i.result === 'fail' || i.result === 'partial').length || 0
})

const pendingCount = computed(() => {
    return props.record.items?.filter(i => i.result === 'pending').length || 0
})

const gapCount = computed(() => {
    return props.record.gaps?.length || 0
})

const totalCount = computed(() => {
    return props.record.items?.length || 1
})

const passRate = computed(() => {
    return Math.round((passCount.value / totalCount.value) * 100)
})

const isOverdue = computed(() => {
    if (!props.record.due_date) return false
    if (['reviewed', 'closed'].includes(props.record.status)) return false
    return new Date(props.record.due_date) < new Date()
})

function resultLabel(result) {
    const labels = {
        pass: '通过',
        fail: '不符合',
        partial: '部分通过',
        pending: '待检查',
        na: '不适用'
    }
    return labels[result] || result
}

function resultClass(result) {
    const classes = {
        pass: 'bg-green-100 text-green-800',
        fail: 'bg-red-100 text-red-800',
        partial: 'bg-orange-100 text-orange-800',
        pending: 'bg-yellow-100 text-yellow-800',
        na: 'bg-gray-100 text-gray-800'
    }
    return classes[result] || 'bg-gray-100 text-gray-800'
}

function submitRecord() {
    if (confirm('确定要提交审核吗？提交后将不能直接修改。')) {
        router.post(route('checklist-records.submit', props.record.id), {}, {
            onSuccess: () => {}
        })
    }
}

function reviewRecord(status) {
    const comment = prompt(status === 'reviewed' ? '请输入审核意见（可选）：' : '请输入退回原因：')
    if (comment === null) return

    router.post(route('checklist-records.review', props.record.id), {
        status: status,
        comment: comment
    }, {
        onSuccess: () => {}
    })
}
</script>
