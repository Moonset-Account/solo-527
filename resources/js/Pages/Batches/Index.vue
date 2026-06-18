<script setup>
import { Head, usePage, router } from '@inertiajs/vue3';
import AdminLayout from '@/Layouts/AdminLayout.vue';
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
const batches = computed(() => page.props.batches?.data || []);
const pagination = computed(() => page.props.batches || { current_page: 1, last_page: 1, per_page: 15, total: 0 });
const retryLogs = computed(() => page.props.retryLogs || []);
const stats = computed(() => page.props.stats || { failed: 0, retried: 0, success: 0, total: 0 });
const filters = ref({
    search: '',
    status: '',
    type: '',
});
const activeTab = ref('failed');
const showRetryModal = ref(false);
const currentBatch = ref(null);
const showLogModal = ref(false);
const currentLogs = ref([]);

const batchColumns = [
    { key: 'batch_no', label: '批次号', slot: 'batch_no' },
    { key: 'type', label: '批次类型', slot: 'type' },
    { key: 'total_count', label: '总条数' },
    { key: 'success_count', label: '成功数' },
    { key: 'failed_count', label: '失败数', slot: 'failed_count' },
    { key: 'status', label: '状态', slot: 'status' },
    { key: 'created_at', label: '创建时间' },
    { key: 'actions', label: '操作', slot: 'actions' },
];

const logColumns = [
    { key: 'row_number', label: '行号' },
    { key: 'field', label: '字段' },
    { key: 'error_message', label: '错误信息', slot: 'error_message' },
    { key: 'retry_count', label: '重试次数' },
    { key: 'last_retry_at', label: '最后重试时间' },
    { key: 'status', label: '状态', slot: 'status' },
];

const statusOptions = [
    { value: '', label: '全部状态' },
    { value: 'processing', label: '处理中' },
    { value: 'partial', label: '部分成功' },
    { value: 'completed', label: '已完成' },
    { value: 'failed', label: '全部失败' },
];

const typeOptions = [
    { value: '', label: '全部类型' },
    { value: 'import_supplies', label: '耗材导入' },
    { value: 'import_suppliers', label: '供应商导入' },
    { value: 'import_quotations', label: '报价单导入' },
    { value: 'sync_inventory', label: '库存同步' },
];

const getStatusBadge = (status) => {
    const map = {
        processing: { type: 'warning', text: '处理中' },
        partial: { type: 'info', text: '部分成功' },
        completed: { type: 'success', text: '已完成' },
        failed: { type: 'danger', text: '全部失败' },
        retried: { type: 'warning', text: '已重试' },
        success: { type: 'success', text: '成功' },
    };
    return map[status] || { type: 'default', text: status };
};

const getTypeBadge = (type) => {
    const map = {
        import_supplies: { type: 'primary', text: '耗材导入' },
        import_suppliers: { type: 'info', text: '供应商导入' },
        import_quotations: { type: 'success', text: '报价单导入' },
        sync_inventory: { type: 'warning', text: '库存同步' },
    };
    return map[type] || { type: 'default', text: type };
};

const applyFilters = () => {
    router.get(route('batches.index'), { ...filters.value, tab: activeTab.value }, { preserveState: true });
};

const resetFilters = () => {
    filters.value = { search: '', status: '', type: '' };
    applyFilters();
};

const openRetryModal = (batch) => {
    currentBatch.value = batch;
    showRetryModal.value = true;
};

const openLogModal = (batch) => {
    currentLogs.value = batch.failed_logs || retryLogs.filter(log => log.batch_id === batch.id);
    showLogModal.value = true;
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

const retrySingle = (log) => {
    router.post(route('batches.retry-single', log.id), {}, {
        onSuccess: () => {
            toast.success('单条重试已提交');
        },
        onError: () => {
            toast.error('重试失败');
        },
    });
};
</script>

<template>
    <Head title="批次管理" />

    <AdminLayout>
        <div class="py-6">
            <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
                <div class="flex justify-between items-center mb-6">
                    <h1 class="text-2xl font-bold text-gray-900 dark:text-white">批次管理</h1>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <p class="text-sm font-medium text-gray-500 dark:text-gray-400">总批次</p>
                        <p class="text-2xl font-semibold text-gray-900 dark:text-white mt-1">{{ stats.total }}</p>
                    </div>
                    <div class="bg-red-50 dark:bg-red-900/20 rounded-lg shadow p-6 border border-red-200 dark:border-red-700">
                        <p class="text-sm font-medium text-red-600 dark:text-red-400">全部失败</p>
                        <p class="text-2xl font-semibold text-red-700 dark:text-red-300 mt-1">{{ stats.failed }}</p>
                    </div>
                    <div class="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg shadow p-6 border border-yellow-200 dark:border-yellow-700">
                        <p class="text-sm font-medium text-yellow-600 dark:text-yellow-400">已重试</p>
                        <p class="text-2xl font-semibold text-yellow-700 dark:text-yellow-300 mt-1">{{ stats.retried }}</p>
                    </div>
                    <div class="bg-green-50 dark:bg-green-900/20 rounded-lg shadow p-6 border border-green-200 dark:border-green-700">
                        <p class="text-sm font-medium text-green-600 dark:text-green-400">全部成功</p>
                        <p class="text-2xl font-semibold text-green-700 dark:text-green-300 mt-1">{{ stats.success }}</p>
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg mb-6">
                    <div class="border-b border-gray-200 dark:border-gray-700">
                        <nav class="flex space-x-8 px-6" aria-label="Tabs">
                            <button
                                :class="[
                                    'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                                    activeTab === 'failed'
                                        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                                ]"
                                @click="activeTab = 'failed'; applyFilters()"
                            >
                                失败批次
                            </button>
                            <button
                                :class="[
                                    'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                                    activeTab === 'all'
                                        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                                ]"
                                @click="activeTab = 'all'; applyFilters()"
                            >
                                全部批次
                            </button>
                        </nav>
                    </div>

                    <div class="p-6">
                        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div class="md:col-span-2">
                                <Input
                                    v-model="filters.search"
                                    placeholder="搜索批次号..."
                                    @change="applyFilters"
                                />
                            </div>
                            <Select
                                v-model="filters.status"
                                :options="statusOptions"
                                @change="applyFilters"
                            />
                            <Select
                                v-model="filters.type"
                                :options="typeOptions"
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
                        <Table :columns="batchColumns" :data="batches">
                            <template #batch_no="{ row }">
                                <span class="font-mono text-sm text-gray-900 dark:text-white">{{ row.batch_no }}</span>
                            </template>
                            <template #type="{ row }">
                                <Badge :type="getTypeBadge(row.type).type">
                                    {{ getTypeBadge(row.type).text }}
                                </Badge>
                            </template>
                            <template #failed_count="{ row }">
                                <span v-if="row.failed_count > 0" class="font-semibold text-red-600 dark:text-red-400">
                                    {{ row.failed_count }}
                                </span>
                                <span v-else class="text-gray-500 dark:text-gray-400">0</span>
                            </template>
                            <template #status="{ row }">
                                <Badge :type="getStatusBadge(row.status).type">
                                    {{ getStatusBadge(row.status).text }}
                                </Badge>
                            </template>
                            <template #actions="{ row }">
                                <div class="flex space-x-2">
                                    <button
                                        v-if="row.failed_count > 0"
                                        class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                        @click="openRetryModal(row)"
                                    >
                                        重试
                                    </button>
                                    <button
                                        class="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                                        @click="openLogModal(row)"
                                    >
                                        日志
                                    </button>
                                </div>
                            </template>
                        </Table>
                    </div>
                    <Pagination
                        v-model:currentPage="pagination.current_page"
                        :lastPage="pagination.last_page"
                        v-model:perPage="pagination.per_page"
                        :total="pagination.total"
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
                            <p class="text-sm text-gray-500 dark:text-gray-400">批次号</p>
                            <p class="font-mono font-medium text-gray-900 dark:text-white">{{ currentBatch.batch_no }}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-500 dark:text-gray-400">失败条数</p>
                            <p class="font-semibold text-red-600 dark:text-red-400">{{ currentBatch.failed_count }}</p>
                        </div>
                    </div>
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-300">
                    确定要重试该批次中的所有失败项吗？系统将重新处理失败的记录。
                </p>
            </div>

            <template #footer>
                <div class="flex space-x-3">
                    <Button variant="secondary" @click="showRetryModal = false">取消</Button>
                    <Button variant="primary" @click="retryBatch">确认重试</Button>
                </div>
            </template>
        </Modal>

        <Modal
            v-model:show="showLogModal"
            title="重试日志"
            size="xl"
        >
            <div class="overflow-x-auto">
                <Table :columns="logColumns" :data="currentLogs">
                    <template #error_message="{ row }">
                        <span class="text-red-600 dark:text-red-400 text-sm">{{ row.error_message }}</span>
                    </template>
                    <template #status="{ row }">
                        <div class="flex items-center space-x-2">
                            <Badge :type="getStatusBadge(row.status).type">
                                {{ getStatusBadge(row.status).text }}
                            </Badge>
                            <button
                                v-if="row.status !== 'success'"
                                class="text-xs text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                @click="retrySingle(row)"
                            >
                                单条重试
                            </button>
                        </div>
                    </template>
                </Table>
            </div>

            <template #footer>
                <div class="flex justify-end">
                    <Button variant="secondary" @click="showLogModal = false">关闭</Button>
                </div>
            </template>
        </Modal>
    </AdminLayout>
</template>
