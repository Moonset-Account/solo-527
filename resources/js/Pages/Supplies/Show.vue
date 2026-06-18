<script setup>
import { Head, usePage, Link, router, useForm } from '@inertiajs/vue3';
import AppLayout from '@/Layouts/AppLayout.vue';
import { computed, ref } from 'vue';
import Badge from '@/Components/Badge.vue';
import Button from '@/Components/Button.vue';
import Table from '@/Components/Table.vue';
import FileUpload from '@/Components/FileUpload.vue';
import { useToast } from '@/Composables/useToast';

const page = usePage();
const toast = useToast();
const supply = computed(() => page.props.supply || {});
const monthlyUsage = computed(() => page.props.monthlyUsage || []);
const specAttachments = computed(() => page.props.specAttachments || []);
const showDeleteModal = ref(false);

const uploadForm = useForm({
    attachment: null,
});

const monthlyUsageColumns = [
    { key: 'month', label: '月份' },
    { key: 'quantity', label: '用量' },
    { key: 'unit', label: '单位' },
];

const attachmentColumns = [
    { key: 'name', label: '文件名', slot: 'name' },
    { key: 'size', label: '大小', slot: 'size' },
    { key: 'uploaded_at', label: '上传时间' },
    { key: 'actions', label: '操作', slot: 'actions' },
];

const getStatusBadge = (status) => {
    const map = {
        normal: { type: 'success', text: '正常' },
        low: { type: 'warning', text: '库存不足' },
        out: { type: 'danger', text: '已缺货' },
    };
    return map[status] || { type: 'default', text: status };
};

const formatFileSize = (bytes) => {
    if (!bytes) return '-';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const uploadAttachment = () => {
    if (!uploadForm.data.attachment) {
        toast.error('请先选择文件');
        return;
    }
    uploadForm.post(route('supplies.attachments.store', supply.value.id), {
        onSuccess: () => {
            toast.success('附件上传成功');
            uploadForm.reset();
        },
        onError: () => {
            toast.error('附件上传失败');
        },
    });
};

const deleteAttachment = (attachmentId) => {
    router.delete(route('supplies.attachments.destroy', { supply: supply.value.id, attachment: attachmentId }), {
        onSuccess: () => {
            toast.success('附件已删除');
        },
        onError: () => {
            toast.error('删除失败');
        },
    });
};

const confirmDelete = () => {
    router.delete(route('supplies.destroy', supply.value.id), {
        onSuccess: () => {
            toast.success('耗材已删除');
        },
        onError: () => {
            toast.error('删除失败');
        },
    });
};
</script>

<template>
    <Head :title="supply.name || '耗材详情'" />

    <AppLayout>
        <div class="py-12">
            <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
                <div class="flex justify-between items-center mb-6">
                    <div>
                        <Link :href="route('supplies.index')" class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                            ← 返回耗材列表
                        </Link>
                        <div class="flex items-center space-x-3 mt-2">
                            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ supply.name }}</h1>
                            <Badge :type="getStatusBadge(supply.status).type">
                                {{ getStatusBadge(supply.status).text }}
                            </Badge>
                        </div>
                    </div>
                    <div class="flex space-x-3">
                        <Link :href="route('supplies.price-history', supply.id)">
                            <Button variant="outline">历史价格</Button>
                        </Link>
                        <Link :href="route('supplies.edit', supply.id)">
                            <Button variant="secondary">编辑</Button>
                        </Link>
                        <Button variant="danger" @click="showDeleteModal = true">删除</Button>
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
                                        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">耗材编码</dt>
                                        <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ supply.code }}</dd>
                                    </div>
                                    <div>
                                        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">耗材分类</dt>
                                        <dd class="mt-1 text-sm text-gray-900 dark:text-white">
                                            <Badge type="info">{{ supply.category }}</Badge>
                                        </dd>
                                    </div>
                                    <div>
                                        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">规格型号</dt>
                                        <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ supply.specification || '-' }}</dd>
                                    </div>
                                    <div>
                                        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">单位</dt>
                                        <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ supply.unit }}</dd>
                                    </div>
                                    <div>
                                        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">当前库存</dt>
                                        <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ supply.stock || 0 }}</dd>
                                    </div>
                                    <div>
                                        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">安全库存</dt>
                                        <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ supply.safety_stock || 0 }}</dd>
                                    </div>
                                    <div>
                                        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">最大库存</dt>
                                        <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ supply.max_stock || 0 }}</dd>
                                    </div>
                                    <div>
                                        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">创建时间</dt>
                                        <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ supply.created_at }}</dd>
                                    </div>
                                </dl>
                                <div v-if="supply.description" class="mt-4">
                                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">描述</dt>
                                    <dd class="mt-1 text-sm text-gray-900 dark:text-white whitespace-pre-line">{{ supply.description }}</dd>
                                </div>
                            </div>
                        </div>

                        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                            <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                <h3 class="text-lg font-medium text-gray-900 dark:text-white">月度用量</h3>
                            </div>
                            <div class="overflow-x-auto">
                                <Table :columns="monthlyUsageColumns" :data="monthlyUsage">
                                    <template #quantity="{ row }">
                                        <span class="font-medium text-gray-900 dark:text-white">{{ row.quantity || 0 }}</span>
                                    </template>
                                </Table>
                            </div>
                        </div>

                        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                            <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                <h3 class="text-lg font-medium text-gray-900 dark:text-white">规格附件</h3>
                            </div>
                            <div class="p-6">
                                <div class="mb-6">
                                    <FileUpload
                                        v-model="uploadForm.data.attachment"
                                        label="上传附件"
                                        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                                        :error="uploadForm.errors.attachment"
                                    />
                                    <div class="mt-3">
                                        <Button variant="primary" :loading="uploadForm.processing" @click="uploadAttachment">
                                            上传
                                        </Button>
                                    </div>
                                </div>
                                <div class="overflow-x-auto">
                                    <Table :columns="attachmentColumns" :data="specAttachments">
                                        <template #name="{ row }">
                                            <a :href="row.url" target="_blank" class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                                                {{ row.name }}
                                            </a>
                                        </template>
                                        <template #size="{ row }">
                                            <span class="text-gray-500 dark:text-gray-400">{{ formatFileSize(row.size) }}</span>
                                        </template>
                                        <template #actions="{ row }">
                                            <div class="flex space-x-2">
                                                <a :href="row.url" target="_blank" class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                                                    下载
                                                </a>
                                                <button @click="deleteAttachment(row.id)" class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                                                    删除
                                                </button>
                                            </div>
                                        </template>
                                    </Table>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="space-y-6">
                        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                            <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                <h3 class="text-lg font-medium text-gray-900 dark:text-white">库存状态</h3>
                            </div>
                            <div class="p-6">
                                <div class="text-center mb-6">
                                    <div class="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-700">
                                        <span class="text-3xl font-bold text-gray-900 dark:text-white">{{ supply.stock || 0 }}</span>
                                    </div>
                                    <div class="mt-3">
                                        <Badge :type="getStatusBadge(supply.status).type">
                                            {{ getStatusBadge(supply.status).text }}
                                        </Badge>
                                    </div>
                                </div>

                                <div class="space-y-3">
                                    <div class="flex justify-between items-center">
                                        <span class="text-sm text-gray-500 dark:text-gray-400">安全库存</span>
                                        <span class="text-sm font-medium text-gray-900 dark:text-white">{{ supply.safety_stock || 0 }}</span>
                                    </div>
                                    <div class="flex justify-between items-center">
                                        <span class="text-sm text-gray-500 dark:text-gray-400">最大库存</span>
                                        <span class="text-sm font-medium text-gray-900 dark:text-white">{{ supply.max_stock || 0 }}</span>
                                    </div>
                                    <div class="flex justify-between items-center">
                                        <span class="text-sm text-gray-500 dark:text-gray-400">月度用量</span>
                                        <span class="text-sm font-medium text-gray-900 dark:text-white">{{ supply.monthly_usage || 0 }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                            <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                <h3 class="text-lg font-medium text-gray-900 dark:text-white">价格信息</h3>
                            </div>
                            <div class="p-6">
                                <div class="space-y-4">
                                    <div>
                                        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">当前单价</dt>
                                        <dd class="mt-1 text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                                            ¥{{ supply.current_price?.toLocaleString() || '0.00' }}
                                        </dd>
                                    </div>
                                    <Link :href="route('supplies.price-history', supply.id)" class="block text-center">
                                        <Button variant="outline" class="w-full">查看历史价格 →</Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="showDeleteModal" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity dark:bg-gray-900 dark:bg-opacity-75" aria-hidden="true"></div>
                <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                <div class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                    <div class="sm:flex sm:items-start">
                        <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 sm:mx-0 sm:h-10 sm:w-10">
                            <svg class="h-6 w-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                            <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                                删除耗材
                            </h3>
                            <div class="mt-2">
                                <p class="text-sm text-gray-500 dark:text-gray-400">
                                    确定要删除耗材「{{ supply.name }}」吗？此操作不可撤销。
                                </p>
                            </div>
                        </div>
                    </div>
                    <div class="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <Button variant="danger" @click="confirmDelete">
                            确认删除
                        </Button>
                        <Button variant="secondary" class="mt-3 sm:mt-0 sm:mr-3" @click="showDeleteModal = false">
                            取消
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    </AppLayout>
</template>
