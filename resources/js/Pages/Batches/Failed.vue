<script setup>
import { Head, usePage, Link, router } from '@inertiajs/vue3';
import AppLayout from '@/Layouts/AppLayout.vue';
import { computed, ref } from 'vue';
import Table from '@/Components/Table.vue';
import Pagination from '@/Components/Pagination.vue';
import Badge from '@/Components/Badge.vue';
import Input from '@/Components/Input.vue';
import Button from '@/Components/Button.vue';
import Select from '@/Components/Select.vue';
import Modal from '@/Components/Modal.vue';
import { useToast } from '@/Composables/useToast';

const page = usePage();
const toast = useToast();
const failedBatches = computed(() => page.props.failedBatches?.data || []);
const pagination = computed(() => page.props.failedBatches || { current_page: 1, last_page: 1, per_page: 15, total: 0 });
const stats = computed(() => page.props.stats || { total: 0, retried: 0, max_retries_exceeded: 0 });
const filters = ref({
    search: '',
    type: '',
    channel: '',
});
const showRetryModal = ref(false);
const currentBatch = ref(null);

const columns = [
    { key: 'type', label: '类型', slot: 'type' },
    { key: 'channel', label: '通道', slot: 'channel' },
    { key: 'error_message', label: '错误信息', slot: 'error_message' },
    { key: 'failed_at', label: '失败时间' },
    { key: 'retry_count', label: '已重试次数', slot: 'retry_count' },
    { key: 'actions', label: '操作', slot: 'actions' },
];

const typeOptions = [
    { value: '', label: '全部类型' },
    { value: 'import_supplies', label: '耗材导入' },
    { value: 'import_suppliers', label: '供应商导入' },
    { value: 'import_quotations', label: '报价单导入' },
    { value: 'sync_inventory', label: '库存同步' },
    { value: 'sync_orders', label: '订单同步' },
];

const channelOptions = [
    { value: '', label: '全部通道' },
    { value: 'manual', label: '手动导入' },
    { value: 'api', label: 'API接口' },
    { value: 'scheduled', label: '定时任务' },
    { value: 'email', label: '邮件' },
];

const getTypeBadge = (type) => {
    const map = {
        import_supplies: { type: 'primary', text: '耗材导入' },
        import_suppliers: { type: 'info', text: '供应商导入' },
        import_quotations: { type: 'success', text: '报价单导入' },
        sync_inventory: { type: 'warning', text: '库存同步' },
        sync_orders: { type: 'default', text: '订单同步' },
    };
    return map[type] || { type: 'default', text: type };
};

const getChannelBadge = (channel) => {
    const map = {
        manual: { type: 'primary', text: '手动导入' },
        api: { type: 'info', text: 'API接口' },
        scheduled: { type: 'warning', text: '定时任务' },
        email: { type: 'success', text: '邮件' },
    };
    return map[channel] || { type: 'default', text: channel };
};

const applyFilters = () => {
    router.get(route('batches.failed'), filters.value, { preserveState: true });
};

const resetFilters = () => {
    filters.value = { search: '', type: '', channel: '' };
    applyFilters();
};

const openRetryModal = (batch) => {
    currentBatch.value = batch;
    showRetryModal.value = true;
};

const retryBatch = () => {
    router.post(route('batches.retry', currentBatch.value.id), {}, {
        onSuccess: () => {
            toast.success('重试任务已提交');
            showRetryModal.value = false;
        },
        onError: () => {
            toast.error('重试失败');
        },
    });
};
</script>

<template>
    <Head title="失败批次" />

    <AppLayout>
        <div class="py-12">
            <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
                <div class="flex justify-between items-center mb-6">
                    <div>
                        <Link :href="route('batches.index')" class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                            ← 返回批次管理
                        </Link>
                        <h1 class="text-2xl font-bold text-gray-900 dark:text-white mt-2">失败批次</h1>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div class="bg-red-50 dark:bg-red-900/20 rounded-lg shadow p-6 border border-red-200 dark:border-red-700">
                        <p class="text-sm font-medium text-red-600 dark:text-red-400">失败总数</p>
                        <p class="text-2xl font-semibold text-red-700 dark:text-red-300 mt-1">{{ stats.total }}</p>
                    </div>
                    <div class="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg shadow p-6 border border-yellow-200 dark:border-yellow-700">
                        <p class="text-sm font-medium text-yellow-600 dark:text-yellow-400">已重试</p>
                        <p class="text-2xl font-semibold text-yellow-700 dark:text-yellow-300 mt-1">{{ stats.retried }}</p>
                    </div>
                    <div class="bg-gray-50 dark:bg-gray-700 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-600">
                        <p class="text-sm font-medium text-gray-600 dark:text-gray-400">超过最大重试</p>
                        <p class="text-2xl font-semibold text-gray-700 dark:text-gray-300 mt-1">{{ stats.max_retries_exceeded }}</p>
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg mb-6">
                    <div class="p-6">
                        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div class="md:col-span-2">
                                <Input
                                    v-model="filters.search"
                                    placeholder="搜索错误信息/批次号..."
                                    @change="applyFilters"
                                />
                            </div>
                            <Select
                                v-model="filters.type"
                                :options="typeOptions"
                                @change="applyFilters"
                            />
                            <Select
                                v-model="filters.channel"
                                :options="channelOptions"
                                @change="applyFilters"
                            />
                        </div>
                        <div class="mt-4 flex justify-end space-x-2">
                            <Button variant="secondary" @click="resetFilters">重置</Button>
                            <Button variant="primary" @click="applyFilters">筛选</Button>
                        </div>
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                    <div class="overflow-x-auto">
                        <Table :columns="columns" :data="failedBatches">
                            <template #type="{ row }">
                                <Badge :type="getTypeBadge(row.type).type">
                                    {{ getTypeBadge(row.type).text }}
                                </Badge>
                            </template>
                            <template #channel="{ row }">
                                <Badge :type="getChannelBadge(row.channel).type">
                                    {{ getChannelBadge(row.channel).text }}
                                </Badge>
                            </template>
                            <template #error_message="{ row }">
                                <span class="text-red-600 dark:text-red-400 text-sm max-w-xs truncate block" :title="row.error_message">
                                    {{ row.error_message }}
                                </span>
                            </template>
                            <template #retry_count="{ row }">
                                <span :class="[
                                    'font-medium',
                                    row.retry_count >= 3 ? 'text-red-600 dark:text-red-400' : row.retry_count > 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-600 dark:text-gray-400'
                                ]">
                                    {{ row.retry_count }} / {{ row.max_retries || 3 }}
                                </span>
                            </template>
                            <template #actions="{ row }">
                                <div class="flex space-x-2">
                                    <button
                                        v-if="row.retry_count < (row.max_retries || 3)"
                                        class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                        @click="openRetryModal(row)"
                                    >
                                        重试
                                    </button>
                                    <Link
                                        :href="route('batches.logs', row.id)"
                                        class="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                                    >
                                        日志
                                    </Link>
                                </div>
                            </template>
                        </Table>
                    </div>
                    <Pagination
                        v-model:currentPage="pagination.current_page"
                        :lastPage="pagination.last_page"
                        v-model:perPage="pagination.per_page"
                        :total="pagination.total"
                        @change="({ page, perPage }) => router.get(route('batches.failed'), { page, per_page: perPage }, { preserveState: true })"
                    />
                </div>
            </div>
        </div>

        <Modal
            v-if="currentBatch"
            v-model:show="showRetryModal"
            title="重试批次"
            size="md"
        >
            <div class="space-y-4">
                <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <p class="text-sm text-gray-500 dark:text-gray-400">类型</p>
                            <p class="font-medium text-gray-900 dark:text-white">{{ getTypeBadge(currentBatch.type).text }}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-500 dark:text-gray-400">已重试次数</p>
                            <p class="font-semibold text-yellow-600 dark:text-yellow-400">{{ currentBatch.retry_count }} / {{ currentBatch.max_retries || 3 }}</p>
                        </div>
                    </div>
                </div>
                <div class="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700">
                    <p class="text-sm font-medium text-red-600 dark:text-red-400 mb-1">错误信息</p>
                    <p class="text-sm text-red-700 dark:text-red-300">{{ currentBatch.error_message }}</p>
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-300">
                    确定要重试该批次吗？系统将重新处理失败的记录。
                </p>
            </div>

            <template #footer>
                <div class="flex space-x-3">
                    <Button variant="secondary" @click="showRetryModal = false">取消</Button>
                    <Button variant="primary" @click="retryBatch">确认重试</Button>
                </div>
            </template>
        </Modal>
    </AppLayout>
</template>
