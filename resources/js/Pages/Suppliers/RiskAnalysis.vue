<script setup>
import { Head, Link, usePage } from '@inertiajs/vue3';
import AppLayout from '@/Layouts/AppLayout.vue';
import { computed } from 'vue';
import Badge from '@/Components/Badge.vue';
import Button from '@/Components/Button.vue';

const page = usePage();
const supplier = computed(() => page.props.supplier || {});
const riskFactors = computed(() => page.props.riskFactors || []);
const riskHistory = computed(() => page.props.riskHistory || []);

const getRiskBadge = (level) => {
    const map = {
        high: { type: 'danger', text: '高风险' },
        medium: { type: 'warning', text: '中风险' },
        low: { type: 'success', text: '低风险' },
    };
    return map[level] || { type: 'default', text: level };
};

const getRiskScoreColor = (score) => {
    if (score >= 80) return 'text-red-600 dark:text-red-400';
    if (score >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
};

const getRiskScoreBgColor = (score) => {
    if (score >= 80) return 'bg-red-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-green-500';
};

const getRiskFactorBadgeType = (level) => {
    if (level === 'high') return 'danger';
    if (level === 'medium') return 'warning';
    return 'success';
};
</script>

<template>
    <Head :title="`风险分析 - ${supplier.name}`" />

    <AppLayout>
        <div class="py-12">
            <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
                <div class="flex justify-between items-center mb-6">
                    <div>
                        <Link :href="route('suppliers.show', supplier.id)" class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                            ← 返回供应商详情
                        </Link>
                        <h1 class="text-2xl font-bold text-gray-900 dark:text-white mt-2">风险分析报告</h1>
                        <p class="text-gray-500 dark:text-gray-400 mt-1">{{ supplier.name }}</p>
                    </div>
                    <div class="flex space-x-3">
                        <Link :href="route('suppliers.edit', supplier.id)">
                            <Button variant="secondary">编辑供应商</Button>
                        </Link>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div class="lg:col-span-1">
                        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                            <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                <h3 class="text-lg font-medium text-gray-900 dark:text-white">风险概览</h3>
                            </div>
                            <div class="p-6">
                                <div class="text-center mb-6">
                                    <div class="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gray-100 dark:bg-gray-700">
                                        <span :class="['text-5xl font-bold', getRiskScoreColor(supplier.risk_score)]">
                                            {{ supplier.risk_score || 0 }}
                                        </span>
                                    </div>
                                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">风险评分</p>
                                    <div class="mt-3">
                                        <Badge :type="getRiskBadge(supplier.risk_level).type" size="lg">
                                            {{ getRiskBadge(supplier.risk_level).text }}
                                        </Badge>
                                    </div>
                                </div>

                                <div class="mb-6">
                                    <div class="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                                        <span>0</span>
                                        <span>50</span>
                                        <span>100</span>
                                    </div>
                                    <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                                        <div
                                            :class="['h-3 rounded-full transition-all duration-500', getRiskScoreBgColor(supplier.risk_score)]"
                                            :style="{ width: `${supplier.risk_score || 0}%` }"
                                        ></div>
                                    </div>
                                    <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                                        <span class="text-green-600 dark:text-green-400">低风险</span>
                                        <span class="text-yellow-600 dark:text-yellow-400">中风险</span>
                                        <span class="text-red-600 dark:text-red-400">高风险</span>
                                    </div>
                                </div>

                                <div class="space-y-3 text-sm">
                                    <div class="flex justify-between">
                                        <span class="text-gray-500 dark:text-gray-400">评估日期</span>
                                        <span class="text-gray-900 dark:text-white font-medium">{{ supplier.risk_updated_at || '-' }}</span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span class="text-gray-500 dark:text-gray-400">评估次数</span>
                                        <span class="text-gray-900 dark:text-white font-medium">{{ riskHistory.length }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="lg:col-span-2 space-y-6">
                        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                            <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                <h3 class="text-lg font-medium text-gray-900 dark:text-white">风险因素分析</h3>
                            </div>
                            <div class="p-6">
                                <div v-if="riskFactors.length > 0" class="space-y-4">
                                    <div v-for="factor in riskFactors" :key="factor.id" class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                        <div class="flex items-start justify-between">
                                            <div class="flex-1">
                                                <div class="flex items-center space-x-3">
                                                    <span class="text-base font-medium text-gray-900 dark:text-white">{{ factor.name }}</span>
                                                    <Badge :type="getRiskFactorBadgeType(factor.level)">
                                                        {{ factor.score }}分
                                                    </Badge>
                                                </div>
                                                <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">{{ factor.description }}</p>
                                                <div class="mt-3">
                                                    <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                                        <div
                                                            :class="['h-2 rounded-full', getRiskScoreBgColor(factor.score)]"
                                                            :style="{ width: `${factor.score}%` }"
                                                        ></div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="ml-4">
                                                <span :class="['text-lg font-bold', getRiskScoreColor(factor.score)]">
                                                    {{ factor.score }}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div v-else class="text-center py-8 text-gray-500 dark:text-gray-400">
                                    暂无风险因素数据
                                </div>
                            </div>
                        </div>

                        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                            <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                <h3 class="text-lg font-medium text-gray-900 dark:text-white">历史风险变更日志</h3>
                            </div>
                            <div class="p-6">
                                <div v-if="riskHistory.length > 0" class="relative">
                                    <div class="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
                                    <div class="space-y-6">
                                        <div v-for="(log, index) in riskHistory" :key="log.id" class="relative pl-10">
                                            <div
                                                :class="[
                                                    'absolute left-0 w-8 h-8 rounded-full flex items-center justify-center',
                                                    getRiskScoreBgColor(log.risk_score),
                                                    index === 0 ? 'ring-4 ring-gray-100 dark:ring-gray-700' : ''
                                                ]"
                                            >
                                                <span class="text-xs font-bold text-white">{{ log.risk_score }}</span>
                                            </div>
                                            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                                <div class="flex items-center justify-between mb-2">
                                                    <div class="flex items-center space-x-3">
                                                        <Badge :type="getRiskBadge(log.risk_level).type">
                                                            {{ getRiskBadge(log.risk_level).text }}
                                                        </Badge>
                                                        <span class="text-sm text-gray-500 dark:text-gray-400">
                                                            {{ log.updated_at }}
                                                        </span>
                                                    </div>
                                                    <span v-if="index === 0" class="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                                                        当前状态
                                                    </span>
                                                </div>
                                                <p class="text-sm text-gray-900 dark:text-white font-medium mb-1">
                                                    {{ log.change_reason || '风险评估更新' }}
                                                </p>
                                                <p v-if="log.notes" class="text-sm text-gray-500 dark:text-gray-400">
                                                    {{ log.notes }}
                                                </p>
                                                <div v-if="log.changed_by" class="mt-2 text-xs text-gray-400 dark:text-gray-500">
                                                    操作人：{{ log.changed_by }}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div v-else class="text-center py-8 text-gray-500 dark:text-gray-400">
                                    暂无历史变更记录
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </AppLayout>
</template>
