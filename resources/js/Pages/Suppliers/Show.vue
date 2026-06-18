<script setup>
import { Head, usePage, Link } from '@inertiajs/vue3';
import AppLayout from '@/Layouts/AppLayout.vue';
import { computed } from 'vue';
import Badge from '@/Components/Badge.vue';
import Button from '@/Components/Button.vue';
import Table from '@/Components/Table.vue';

const page = usePage();
const supplier = computed(() => page.props.supplier || {});
const quotations = computed(() => page.props.quotations || []);
const riskFactors = computed(() => page.props.riskFactors || []);
const cooperationHistory = computed(() => page.props.cooperationHistory || []);

const columns = [
    { key: 'date', label: '日期' },
    { key: 'type', label: '类型', slot: 'type' },
    { key: 'description', label: '描述' },
    { key: 'amount', label: '金额', slot: 'amount' },
];

const getRiskBadge = (level) => {
    const map = {
        high: { type: 'danger', text: '高风险' },
        medium: { type: 'warning', text: '中风险' },
        low: { type: 'success', text: '低风险' },
    };
    return map[level] || { type: 'default', text: level };
};

const getRiskScoreColor = (score) => {
    if (score >= 80) return 'bg-red-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-green-500';
};
</script>

<template>
    <Head :title="supplier.name || '供应商详情'" />

    <AppLayout>
        <div class="py-12">
            <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
                <div class="flex justify-between items-center mb-6">
                    <div>
                        <Link :href="route('suppliers.index')" class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                            ← 返回供应商列表
                        </Link>
                        <h1 class="text-2xl font-bold text-gray-900 dark:text-white mt-2">{{ supplier.name }}</h1>
                    </div>
                    <div class="flex space-x-3">
                        <Link :href="route('suppliers.edit', supplier.id)">
                            <Button variant="secondary">编辑</Button>
                        </Link>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div class="lg:col-span-2 space-y-6">
                        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                            <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                <h3 class="text-lg font-medium text-gray-900 dark:text-white">基本信息</h3>
                            </div>
                            <div class="p-6">
                                <dl class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">供应商编码</dt>
                                        <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ supplier.code }}</dd>
                                    </div>
                                    <div>
                                        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">统一社会信用代码</dt>
                                        <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ supplier.tax_number || '-' }}</dd>
                                    </div>
                                    <div>
                                        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">联系人</dt>
                                        <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ supplier.contact_person }}</dd>
                                    </div>
                                    <div>
                                        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">联系电话</dt>
                                        <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ supplier.phone }}</dd>
                                    </div>
                                    <div>
                                        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">电子邮箱</dt>
                                        <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ supplier.email || '-' }}</dd>
                                    </div>
                                    <div>
                                        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">注册地址</dt>
                                        <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ supplier.address || '-' }}</dd>
                                    </div>
                                </dl>
                            </div>
                        </div>

                        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                            <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                <h3 class="text-lg font-medium text-gray-900 dark:text-white">合作历史</h3>
                            </div>
                            <div class="overflow-x-auto">
                                <Table :columns="columns" :data="cooperationHistory">
                                    <template #type="{ row }">
                                        <Badge type="info">{{ row.type }}</Badge>
                                    </template>
                                    <template #amount="{ row }">
                                        <span class="font-medium text-gray-900 dark:text-white">¥{{ row.amount?.toLocaleString() || 0 }}</span>
                                    </template>
                                </Table>
                            </div>
                        </div>
                    </div>

                    <div class="space-y-6">
                        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                            <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                <h3 class="text-lg font-medium text-gray-900 dark:text-white">风险评估</h3>
                            </div>
                            <div class="p-6">
                                <div class="text-center mb-6">
                                    <div class="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-700">
                                        <span class="text-3xl font-bold text-gray-900 dark:text-white">{{ supplier.risk_score || 0 }}</span>
                                    </div>
                                    <div class="mt-3">
                                        <Badge :type="getRiskBadge(supplier.risk_level).type">
                                            {{ getRiskBadge(supplier.risk_level).text }}
                                        </Badge>
                                    </div>
                                </div>

                                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-6">
                                    <div
                                        :class="['h-2.5 rounded-full transition-all duration-500', getRiskScoreColor(supplier.risk_score)]"
                                        :style="{ width: `${supplier.risk_score || 0}%` }"
                                    ></div>
                                </div>

                                <div v-if="riskFactors.length > 0" class="space-y-3">
                                    <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">风险因素</h4>
                                    <div v-for="factor in riskFactors" :key="factor.id" class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                        <div class="flex items-center justify-between">
                                            <span class="text-sm font-medium text-gray-900 dark:text-white">{{ factor.name }}</span>
                                            <Badge :type="factor.level === 'high' ? 'danger' : factor.level === 'medium' ? 'warning' : 'success'">
                                                {{ factor.score }}分
                                            </Badge>
                                        </div>
                                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ factor.description }}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                            <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                <h3 class="text-lg font-medium text-gray-900 dark:text-white">最近报价</h3>
                            </div>
                            <div class="p-6">
                                <div v-if="quotations.length > 0" class="space-y-3">
                                    <div v-for="quotation in quotations.slice(0, 5)" :key="quotation.id" class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                        <div>
                                            <p class="text-sm font-medium text-gray-900 dark:text-white">{{ quotation.supply_name }}</p>
                                            <p class="text-xs text-gray-500 dark:text-gray-400">{{ quotation.valid_until }}</p>
                                        </div>
                                        <div class="text-right">
                                            <p class="text-sm font-semibold text-indigo-600 dark:text-indigo-400">¥{{ quotation.price?.toLocaleString() }}</p>
                                        </div>
                                    </div>
                                </div>
                                <div v-else class="text-center py-8 text-gray-500 dark:text-gray-400">
                                    暂无报价记录
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </AppLayout>
</template>
