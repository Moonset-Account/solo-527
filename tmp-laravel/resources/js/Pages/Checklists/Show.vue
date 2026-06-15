<template>
    <div class="space-y-6">
        <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
                <Link :href="route('checklists.index')" class="text-gray-400 hover:text-gray-600">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                    </svg>
                </Link>
                <div>
                    <h1 class="text-2xl font-bold text-gray-900">{{ checklist.title }}</h1>
                    <p class="text-sm text-gray-500 mt-1">{{ checklist.category || '未分类' }} · 版本 {{ checklist.version || '1.0' }}</p>
                </div>
            </div>
            <div class="flex items-center space-x-3">
                <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    :class="checklist.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
                >
                    {{ checklist.is_active ? '启用' : '禁用' }}
                </span>
                <Link
                    :href="route('checklist-records.create', checklist.id)"
                    class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                >
                    填写检查
                </Link>
                <Link
                    :href="route('checklists.edit', checklist.id)"
                    class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                >
                    编辑模板
                </Link>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="lg:col-span-2 space-y-6">
                <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                    <h3 class="text-lg font-medium text-gray-900 mb-4">模板说明</h3>
                    <p class="text-sm text-gray-600 whitespace-pre-wrap">
                        {{ checklist.description || '暂无描述' }}
                    </p>
                </div>

                <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-medium text-gray-900">检查项列表</h3>
                        <span class="text-sm text-gray-500">
                            共 {{ checklist.items?.length || 0 }} 项
                        </span>
                    </div>

                    <div class="space-y-3">
                        <div
                            v-for="(item, index) in checklist.items"
                            :key="item.id"
                            class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                        >
                            <div class="flex items-start justify-between">
                                <div class="flex-1">
                                    <div class="flex items-center space-x-2">
                                        <span class="text-sm font-medium text-gray-900">
                                            {{ index + 1 }}. {{ item.title }}
                                        </span>
                                        <span
                                            v-if="item.is_required"
                                            class="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded"
                                        >
                                            必填
                                        </span>
                                        <SeverityBadge v-if="item.risk_level" :severity="item.risk_level" />
                                    </div>
                                    <p class="text-sm text-gray-500 mt-1" v-if="item.description">
                                        {{ item.description }}
                                    </p>
                                    <p class="text-xs text-gray-400 mt-1" v-if="item.criteria">
                                        判定标准: {{ item.criteria }}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <p v-if="!checklist.items?.length" class="text-sm text-gray-500 text-center py-8">
                        暂无检查项
                    </p>
                </div>
            </div>

            <div class="space-y-6">
                <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                    <h3 class="text-lg font-medium text-gray-900 mb-4">模板信息</h3>
                    <div class="space-y-3 text-sm">
                        <div class="flex justify-between">
                            <span class="text-gray-500">创建人</span>
                            <span class="font-medium">{{ checklist.created_by?.name || '-' }}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-500">创建时间</span>
                            <span class="font-medium">{{ formatDate(checklist.created_at) }}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-500">更新时间</span>
                            <span class="font-medium">{{ formatDate(checklist.updated_at) }}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-500">检查项数</span>
                            <span class="font-medium">{{ checklist.items?.length || 0 }} 项</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-500">高风险项</span>
                            <span class="font-medium text-red-600">{{ highRiskCount }} 项</span>
                        </div>
                    </div>
                </div>

                <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                    <h3 class="text-lg font-medium text-gray-900 mb-4">风险分布</h3>
                    <div class="space-y-3">
                        <div>
                            <div class="flex justify-between text-sm mb-1">
                                <span class="text-gray-600">高风险</span>
                                <span class="font-medium text-red-600">{{ riskDistribution.high }}</span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    class="bg-red-500 h-2 rounded-full"
                                    :style="{ width: riskPercent('high') + '%' }"
                                ></div>
                            </div>
                        </div>
                        <div>
                            <div class="flex justify-between text-sm mb-1">
                                <span class="text-gray-600">中风险</span>
                                <span class="font-medium text-yellow-600">{{ riskDistribution.medium }}</span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    class="bg-yellow-500 h-2 rounded-full"
                                    :style="{ width: riskPercent('medium') + '%' }"
                                ></div>
                            </div>
                        </div>
                        <div>
                            <div class="flex justify-between text-sm mb-1">
                                <span class="text-gray-600">低风险</span>
                                <span class="font-medium text-green-600">{{ riskDistribution.low }}</span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    class="bg-green-500 h-2 rounded-full"
                                    :style="{ width: riskPercent('low') + '%' }"
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="bg-indigo-50 rounded-lg border border-indigo-200 p-5">
                    <h3 class="text-sm font-medium text-indigo-900 mb-2">使用说明</h3>
                    <ul class="text-sm text-indigo-700 space-y-1">
                        <li>• 点击「填写检查」开始合规检查</li>
                        <li>• 逐项检查并填写检查结果</li>
                        <li>• 不符合项自动生成合规缺口</li>
                        <li>• 可保存草稿稍后继续</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { Link } from '@inertiajs/vue3'
import SeverityBadge from '@/Components/SeverityBadge.vue'

const props = defineProps({
    checklist: Object,
})

const highRiskCount = computed(() => {
    return props.checklist.items?.filter(i => i.risk_level === 'high' || i.risk_level === 'critical').length || 0
})

const riskDistribution = computed(() => {
    const items = props.checklist.items || []
    return {
        high: items.filter(i => i.risk_level === 'high').length,
        medium: items.filter(i => i.risk_level === 'medium').length,
        low: items.filter(i => i.risk_level === 'low').length,
    }
})

const totalItems = computed(() => {
    return props.checklist.items?.length || 1
})

function riskPercent(level) {
    return Math.round((riskDistribution.value[level] / totalItems.value) * 100)
}

function formatDate(date) {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    })
}
</script>
