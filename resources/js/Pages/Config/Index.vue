<script setup>
import { Head, usePage, router } from '@inertiajs/vue3';
import AdminLayout from '@/Layouts/AdminLayout.vue';
import { computed, ref, watch } from 'vue';
import Button from '@/Components/Button.vue';
import Input from '@/Components/Input.vue';
import Table from '@/Components/Table.vue';
import Pagination from '@/Components/Pagination.vue';
import Badge from '@/Components/Badge.vue';
import { useToast } from '@/Composables/useToast';
import { useConfigStore } from '@/Stores/config';

const page = usePage();
const toast = useToast();
const configStore = useConfigStore();

const logs = computed(() => page.props.logs?.data || []);
const logsPagination = computed(() => page.props.logs || { current_page: 1, last_page: 1, per_page: 15, total: 0 });
const activeTab = ref('general');

const tabs = [
    { key: 'general', label: '通用设置' },
    { key: 'features', label: '功能开关' },
    { key: 'prices', label: '历史价格' },
    { key: 'logs', label: '操作日志' },
];

const saveSettings = () => {
    router.post(route('config.update'), {
        settings: configStore.settings,
    }, {
        onSuccess: () => {
            toast.success('设置保存成功');
        },
        onError: () => {
            toast.error('保存失败');
        },
    });
};

const logColumns = [
    { key: 'action', label: '操作' },
    { key: 'user_name', label: '操作人' },
    { key: 'module', label: '模块', slot: 'module' },
    { key: 'ip', label: 'IP地址' },
    { key: 'created_at', label: '操作时间' },
];

const priceColumns = [
    { key: 'supply_name', label: '耗材名称' },
    { key: 'supplier_name', label: '供应商' },
    { key: 'price', label: '价格', slot: 'price' },
    { key: 'effective_date', label: '生效日期' },
    { key: 'source', label: '来源', slot: 'source' },
];

const historyPrices = ref([
    { supply_name: '离心管 15ml', supplier_name: '供应商A', price: 0.85, effective_date: '2024-01-15', source: '报价单' },
    { supply_name: '离心管 15ml', supplier_name: '供应商B', price: 0.90, effective_date: '2024-01-10', source: '报价单' },
    { supply_name: '离心管 15ml', supplier_name: '供应商A', price: 0.88, effective_date: '2023-12-01', source: '采购单' },
    { supply_name: '移液枪头 200ul', supplier_name: '供应商C', price: 0.12, effective_date: '2024-01-20', source: '报价单' },
]);
</script>

<template>
    <Head title="系统配置" />

    <AdminLayout>
        <div class="py-6">
            <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
                <div class="flex justify-between items-center mb-6">
                    <h1 class="text-2xl font-bold text-gray-900 dark:text-white">系统配置</h1>
                    <Button variant="primary" @click="saveSettings">保存设置</Button>
                </div>

                <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                    <div class="border-b border-gray-200 dark:border-gray-700">
                        <nav class="flex space-x-8 px-6" aria-label="Tabs">
                            <button
                                v-for="tab in tabs"
                                :key="tab.key"
                                :class="[
                                    'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                                    activeTab === tab.key
                                        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                                ]"
                                @click="activeTab = tab.key"
                            >
                                {{ tab.label }}
                            </button>
                        </nav>
                    </div>

                    <div class="p-6">
                        <div v-show="activeTab === 'general'" class="space-y-6 max-w-2xl">
                            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">通用设置</h3>

                            <Input
                                v-model="configStore.settings.systemName"
                                label="系统名称"
                                placeholder="请输入系统名称"
                            />

                            <Input
                                v-model="configStore.settings.quotationValidDays"
                                type="number"
                                label="报价单默认有效天数"
                                placeholder="30"
                            />

                            <Input
                                v-model="configStore.settings.lowStockThreshold"
                                type="number"
                                label="低库存预警阈值"
                                placeholder="10"
                            />

                            <div class="grid grid-cols-2 gap-4">
                                <Select
                                    v-model="configStore.settings.defaultCurrency"
                                    label="默认货币"
                                    :options="[
                                        { value: 'CNY', label: '人民币 (CNY)' },
                                        { value: 'USD', label: '美元 (USD)' },
                                        { value: 'EUR', label: '欧元 (EUR)' },
                                    ]"
                                />
                            </div>
                        </div>

                        <div v-show="activeTab === 'features'" class="space-y-6 max-w-2xl">
                            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">功能开关</h3>

                            <div class="space-y-4">
                                <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <div>
                                        <p class="font-medium text-gray-900 dark:text-white">启用审批流程</p>
                                        <p class="text-sm text-gray-500 dark:text-gray-400">采购申请等单据需要经过审批流程</p>
                                    </div>
                                    <label class="relative inline-flex items-center cursor-pointer">
                                        <input
                                            v-model="configStore.settings.enableApprovalFlow"
                                            type="checkbox"
                                            class="sr-only peer"
                                        />
                                        <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-indigo-600"></div>
                                    </label>
                                </div>

                                <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <div>
                                        <p class="font-medium text-gray-900 dark:text-white">启用到货确认</p>
                                        <p class="text-sm text-gray-500 dark:text-gray-400">采购到货后需要进行到货确认流程</p>
                                    </div>
                                    <label class="relative inline-flex items-center cursor-pointer">
                                        <input
                                            v-model="configStore.settings.enableDeliveryConfirmation"
                                            type="checkbox"
                                            class="sr-only peer"
                                        />
                                        <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-indigo-600"></div>
                                    </label>
                                </div>

                                <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <div>
                                        <p class="font-medium text-gray-900 dark:text-white">启用规格附件</p>
                                        <p class="text-sm text-gray-500 dark:text-gray-400">允许上传耗材规格说明书等附件</p>
                                    </div>
                                    <label class="relative inline-flex items-center cursor-pointer">
                                        <input
                                            v-model="configStore.settings.enableSpecAttachment"
                                            type="checkbox"
                                            class="sr-only peer"
                                        />
                                        <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-indigo-600"></div>
                                    </label>
                                </div>

                                <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <div>
                                        <p class="font-medium text-gray-900 dark:text-white">启用历史价格查询</p>
                                        <p class="text-sm text-gray-500 dark:text-gray-400">显示耗材的历史采购价格</p>
                                    </div>
                                    <label class="relative inline-flex items-center cursor-pointer">
                                        <input
                                            v-model="configStore.settings.enableHistoryPrice"
                                            type="checkbox"
                                            class="sr-only peer"
                                        />
                                        <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-indigo-600"></div>
                                    </label>
                                </div>

                                <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <div>
                                        <p class="font-medium text-gray-900 dark:text-white">启用操作日志</p>
                                        <p class="text-sm text-gray-500 dark:text-gray-400">记录所有用户的系统操作</p>
                                    </div>
                                    <label class="relative inline-flex items-center cursor-pointer">
                                        <input
                                            v-model="configStore.settings.enableOperationLog"
                                            type="checkbox"
                                            class="sr-only peer"
                                        />
                                        <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-indigo-600"></div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div v-show="activeTab === 'prices'">
                            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">历史价格</h3>
                            <div class="overflow-x-auto">
                                <Table :columns="priceColumns" :data="historyPrices">
                                    <template #price="{ row }">
                                        <span class="font-semibold text-gray-900 dark:text-white">¥{{ row.price?.toFixed(2) }}</span>
                                    </template>
                                    <template #source="{ row }">
                                        <Badge :type="row.source === '报价单' ? 'primary' : 'info'">{{ row.source }}</Badge>
                                    </template>
                                </Table>
                            </div>
                        </div>

                        <div v-show="activeTab === 'logs'">
                            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">操作日志</h3>
                            <div class="overflow-x-auto">
                                <Table :columns="logColumns" :data="logs">
                                    <template #module="{ row }">
                                        <Badge type="info">{{ row.module }}</Badge>
                                    </template>
                                </Table>
                            </div>
                            <Pagination
                                v-model:currentPage="logsPagination.current_page"
                                :lastPage="logsPagination.last_page"
                                v-model:perPage="logsPagination.per_page"
                                :total="logsPagination.total"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </AdminLayout>
</template>
