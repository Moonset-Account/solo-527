<script setup>
import { Link } from '@inertiajs/vue3'
import AppLayout from '../../Layouts/AppLayout.vue'

defineProps({
    report: Object,
})

const scoreColor = (score) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
}

const scoreBg = (score) => {
    if (score >= 90) return 'bg-green-50 border-green-200'
    if (score >= 70) return 'bg-yellow-50 border-yellow-200'
    return 'bg-red-50 border-red-200'
}
</script>

<template>
    <AppLayout title="质量报告详情">
        <div class="space-y-6">
            <div class="flex items-center gap-3">
                <Link href="/quality-reports" class="text-gray-500 hover:text-gray-700 text-sm">质量报告</Link>
                <span class="text-gray-400">/</span>
                <h2 class="text-2xl font-bold text-gray-900">报告详情</h2>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div class="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">基本信息</h3>
                    <dl class="space-y-3">
                        <div class="flex justify-between">
                            <dt class="text-sm text-gray-500">报告日期</dt>
                            <dd class="text-sm font-medium text-gray-900">{{ report.report_date }}</dd>
                        </div>
                        <div class="flex justify-between">
                            <dt class="text-sm text-gray-500">工单号</dt>
                            <dd class="text-sm">
                                <Link v-if="report.work_order" :href="`/work-orders/${report.work_order.id}`" class="text-blue-600">{{ report.work_order.order_no }}</Link>
                                <span v-else>-</span>
                            </dd>
                        </div>
                        <div class="flex justify-between">
                            <dt class="text-sm text-gray-500">车牌号</dt>
                            <dd class="text-sm text-gray-900">{{ report.vehicle?.plate_number || '-' }}</dd>
                        </div>
                        <div class="flex justify-between">
                            <dt class="text-sm text-gray-500">技师</dt>
                            <dd class="text-sm text-gray-900">{{ report.technician?.name || '-' }}</dd>
                        </div>
                        <div class="flex justify-between">
                            <dt class="text-sm text-gray-500">服务项目</dt>
                            <dd class="text-sm text-gray-900">{{ report.service_item || '-' }}</dd>
                        </div>
                    </dl>
                </div>

                <div class="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">检测指标</h3>
                    <dl class="space-y-3">
                        <div class="flex justify-between">
                            <dt class="text-sm text-gray-500">合格项</dt>
                            <dd class="text-sm font-medium text-green-600">{{ report.inspection_pass_count || 0 }}</dd>
                        </div>
                        <div class="flex justify-between">
                            <dt class="text-sm text-gray-500">不合格项</dt>
                            <dd class="text-sm font-medium text-red-600">{{ report.inspection_fail_count || 0 }}</dd>
                        </div>
                        <div class="flex justify-between">
                            <dt class="text-sm text-gray-500">警告项</dt>
                            <dd class="text-sm font-medium text-yellow-600">{{ report.inspection_warning_count || 0 }}</dd>
                        </div>
                        <div class="flex justify-between">
                            <dt class="text-sm text-gray-500">是否爽约</dt>
                            <dd class="text-sm">
                                <span v-if="report.no_show" class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">是</span>
                                <span v-else class="text-gray-500">否</span>
                            </dd>
                        </div>
                    </dl>
                </div>

                <div class="rounded-xl border p-6" :class="scoreBg(report.overall_score)">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">综合评分</h3>
                    <div class="text-center">
                        <div class="text-6xl font-bold" :class="scoreColor(report.overall_score)">{{ report.overall_score }}</div>
                        <p class="mt-2 text-sm text-gray-600">满分 100</p>
                    </div>
                    <div v-if="report.no_show_reason" class="mt-4 p-3 bg-white/60 rounded-lg">
                        <p class="text-xs text-gray-500">爽约原因</p>
                        <p class="text-sm text-gray-900">{{ report.no_show_reason }}</p>
                    </div>
                    <div v-if="report.remarks" class="mt-4 p-3 bg-white/60 rounded-lg">
                        <p class="text-xs text-gray-500">备注</p>
                        <p class="text-sm text-gray-900">{{ report.remarks }}</p>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-xl border border-gray-200 p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">生成信息</h3>
                <dl class="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div>
                        <dt class="text-sm text-gray-500">生成人</dt>
                        <dd class="text-sm text-gray-900">{{ report.generated_by?.name || report.generator?.name || '-' }}</dd>
                    </div>
                    <div>
                        <dt class="text-sm text-gray-500">创建时间</dt>
                        <dd class="text-sm text-gray-900">{{ report.created_at ? new Date(report.created_at).toLocaleString('zh-CN') : '-' }}</dd>
                    </div>
                </dl>
            </div>
        </div>
    </AppLayout>
</template>
