<script setup>
import { Head, usePage, Link, router } from '@inertiajs/vue3';
import AppLayout from '@/Layouts/AppLayout.vue';
import { computed, ref } from 'vue';
import Table from '@/Components/Table.vue';
import Pagination from '@/Components/Pagination.vue';
import Badge from '@/Components/Badge.vue';
import Button from '@/Components/Button.vue';
import Modal from '@/Components/Modal.vue';
import { useToast } from '@/Composables/useToast';

const page = usePage();
const toast = useToast();
const batch = computed(() => page.props.batch || {});
const logs = computed(() => page.props.logs?.data || []);
const pagination = computed(() => page.props.logs || { current_page: 1, last_page: 1, per_page: 15, total: 0 });
const showDetailModal = ref(false);
const currentLog = ref(null);

const columns = [
    { key: 'attempted_at', label: '时间' },
    { key: 'status', label: '状态', slot: 'status' },
    { key: 'result', label: '结果', slot: 'result' },
    { key: 'operator_name', label: '操作人' },
    { key: 'actions', label: '操作', slot: 'actions' },
];

const getStatusBadge = (status) => {
    const map = {
        success: { type: 'success', text: '成功' },
        failed: { type: 'danger', text: '失败' },
        pending: { type: 'warning', text: '处理中' },
        retrying: { type: 'info', text: '重试中' },
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

const openDetailModal = (log) => {
    currentLog.value = log;
    showDetailModal.value = true;
};

const retryBatch = () => {
    router.post(route('batches.retry', batch.value.id), {}, {
        onSuccess: () => {
            toast.success('重试任务已提交');
        },
        onError: () => {
            toast.error('重试失败');
        },
    });
};
</script>

<template>
    <Head :title="`重试日志 - ${batch.batch_no || '批次详情'}`" />

    <AppLayout>
        <div class="py-12">
            <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
                <div class="flex justify-between items-center mb-6">
                    <div>
                        <Link :href="route('batches.failed')" class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                            ← 返回失败批次
                        </Link>
                        <div class="flex items-center space-x-3 mt-2">
                            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">重试日志</h1>
                            <Badge :type="getTypeBadge(batch.type).type">
                                {{ getTypeBadge(batch.type).text }}
                            </Badge>
                        </div>
                    </div>
                    <div class="flex space-x-3">
                        <Button variant="primary" @click="retryBatch">
                            再次重试
                        </Button>
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg mb-6">
                    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 class="text-lg font-medium text-gray-900 dark:text-white">批次信息</h3>
                    </div>
                    <div class="p-6">
                        <dl class="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">批次号</dt>
                                <dd class="mt-1 text-sm font-mono text-gray-900 dark:text-white">{{ batch.batch_no }}</dd>
                            </div>
                            <div>
                                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">类型</dt>
                                <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ getTypeBadge(batch.type).text }}</dd>
                            </div>
                            <div>
                                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">总条数</dt>
                                <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ batch.total_count }}</dd>
                            </div>
                            <div>
                                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">失败条数</dt>
                                <dd class="mt-1 text-sm font-semibold text-red-600 dark:text-red-400">{{ batch.failed_count }}</dd>
                            </div>
                            <div>
                                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">已重试次数</dt>
                                <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ batch.retry_count || 0 }} / {{ batch.max_retries || 3 }}</dd>
                            </div>
                            <div>
                                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">首次失败时间</dt>
                                <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ batch.first_failed_at || '-' }}</dd>
                            </div>
                            <div>
                                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">最后重试时间</dt>
                                <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ batch.last_retry_at || '-' }}</dd>
                            </div>
                            <div>
                                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">创建人</dt>
                                <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ batch.creator_name || '-' }}</dd>
                            </div>
                        </dl>
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 class="text-lg font-medium text-gray-900 dark:text-white">重试历史</h3>
                    </div>
                    <div class="overflow-x-auto">
                        <Table :columns="columns" :data="logs">
                            <template #status="{ row }">
                                <Badge :type="getStatusBadge(row.status).type">
                                    {{ getStatusBadge(row.status).text }}
                                </Badge>
                            </template>
                            <template #result="{ row }">
                                <span v-if="row.status === 'success'" class="text-green-600 dark:text-green-400 text-sm">
                                    处理成功，共 {{ row.success_count || 0 }} 条
                                </span>
                                <span v-else-if="row.status === 'failed'" class="text-red-600 dark:text-red-400 text-sm max-w-xs truncate block" :title="row.error_message">
                                    {{ row.error_message || '处理失败' }}
                                </span>
                                <span v-else class="text-gray-500 dark:text-gray-400 text-sm">
                                    {{ row.result || '-' }}
                                </span>
                            </template>
                            <template #actions="{ row }">
                                <button
                                    class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                    @click="openDetailModal(row)"
                                >
                                    详情
                                </button>
                            </template>
                        </Table>
                    </div>
                    <Pagination
                        v-model:currentPage="pagination.current_page"
                        :lastPage="pagination.last_page"
                        v-model:perPage="pagination.per_page"
                        :total="pagination.total"
                        @change="({ page, perPage }) => router.get(route('batches.logs', batch.id), { page, per_page: perPage }, { preserveState: true })"
                    />
                </div>
            </div>
        </div>

        <Modal
            v-if="currentLog"
            v-model:show="showDetailModal"
            title="重试详情"
            size="lg"
        >
            <div class="space-y-4">
                <div class="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                        <p class="text-sm text-gray-500 dark:text-gray-400">重试时间</p>
                        <p class="font-medium text-gray-900 dark:text-white">{{ currentLog.attempted_at }}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500 dark:text-gray-400">状态</p>
                        <Badge :type="getStatusBadge(currentLog.status).type">
                            {{ getStatusBadge(currentLog.status).text }}
                        </Badge>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500 dark:text-gray-400">操作人</p>
                        <p class="font-medium text-gray-900 dark:text-white">{{ currentLog.operator_name }}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500 dark:text-gray-400">耗时</p>
                        <p class="font-medium text-gray-900 dark:text-white">{{ currentLog.duration ? currentLog.duration + ' 秒' : '-' }}</p>
                    </div>
                </div>

                <div v-if="currentLog.status === 'success'">
                    <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">处理结果</p>
                    <div class="grid grid-cols-3 gap-4">
                        <div class="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                            <p class="text-2xl font-bold text-green-600 dark:text-green-400">{{ currentLog.success_count || 0 }}</p>
                            <p class="text-sm text-green-600 dark:text-green-400 mt-1">成功</p>
                        </div>
                        <div class="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
                            <p class="text-2xl font-bold text-red-600 dark:text-red-400">{{ currentLog.failed_count || 0 }}</p>
                            <p class="text-sm text-red-600 dark:text-red-400 mt-1">失败</p>
                        </div>
                        <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
                            <p class="text-2xl font-bold text-gray-600 dark:text-gray-400">{{ currentLog.skipped_count || 0 }}</p>
                            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">跳过</p>
                        </div>
                    </div>
                </div>

                <div v-if="currentLog.status === 'failed'">
                    <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">错误信息</p>
                    <div class="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700">
                        <p class="text-sm text-red-700 dark:text-red-300 whitespace-pre-wrap">{{ currentLog.error_message }}</p>
                    </div>
                </div>

                <div v-if="currentLog.details && currentLog.details.length > 0">
                    <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">明细</p>
                    <div class="overflow-x-auto max-h-60 overflow-y-auto">
                        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead class="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">行号</th>
                                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">状态</th>
                                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">信息</th>
                                </tr>
                            </thead>
                            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                <tr v-for="(detail, index) in currentLog.details" :key="index">
                                    <td class="px-4 py-2 text-sm text-gray-900 dark:text-white">{{ detail.row_number }}</td>
                                    <td class="px-4 py-2">
                                        <Badge :type="detail.status === 'success' ? 'success' : 'danger'" size="sm">
                                            {{ detail.status === 'success' ? '成功' : '失败' }}
                                        </Badge>
                                    </td>
                                    <td class="px-4 py-2 text-sm" :class="detail.status === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                                        {{ detail.message || '-' }}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <template #footer>
                <div class="flex justify-end">
                    <Button variant="secondary" @click="showDetailModal = false">关闭</Button>
                </div>
            </template>
        </Modal>
    </AppLayout>
</template>
