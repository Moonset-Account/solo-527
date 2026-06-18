<script setup>
import { Head, usePage, Link, useForm, router } from '@inertiajs/vue3';
import AppLayout from '@/Layouts/AppLayout.vue';
import { computed, ref } from 'vue';
import Badge from '@/Components/Badge.vue';
import Button from '@/Components/Button.vue';
import Modal from '@/Components/Modal.vue';
import { useToast } from '@/Composables/useToast';

const page = usePage();
const toast = useToast();
const request = computed(() => page.props.request || {});
const approvalHistory = computed(() => page.props.approvalHistory || []);
const quotations = computed(() => page.props.quotations || []);

const showRejectModal = ref(false);
const rejectForm = useForm({
    reason: '',
});

const getStatusBadge = (status) => {
    const map = {
        draft: { type: 'default', text: '草稿' },
        pending: { type: 'warning', text: '审批中' },
        approved: { type: 'success', text: '已通过' },
        rejected: { type: 'danger', text: '已拒绝' },
        cancelled: { type: 'default', text: '已取消' },
    };
    return map[status] || { type: 'default', text: status };
};

const getApprovalStatusBadge = (status) => {
    const map = {
        pending: { type: 'warning', text: '待审批' },
        approved: { type: 'success', text: '已通过' },
        rejected: { type: 'danger', text: '已拒绝' },
        skipped: { type: 'default', text: '已跳过' },
    };
    return map[status] || { type: 'default', text: status };
};

const totalAmount = computed(() => {
    return request.value.items?.reduce((sum, item) => {
        return sum + (item.quantity || 0) * (item.unit_price || 0);
    }, 0) || 0;
});

const canApprove = computed(() => {
    return request.value.status === 'pending' && request.value.can_approve;
});

const canReject = computed(() => {
    return request.value.status === 'pending' && request.value.can_approve;
});

const approve = () => {
    router.post(route('purchase-requests.approve', request.value.id), {}, {
        onSuccess: () => {
            toast.success('审批通过');
        },
        onError: () => {
            toast.error('操作失败');
        },
    });
};

const submitReject = () => {
    router.post(route('purchase-requests.reject', request.value.id), rejectForm.data, {
        onSuccess: () => {
            toast.success('已拒绝');
            showRejectModal.value = false;
            rejectForm.reset();
        },
        onError: () => {
            toast.error('操作失败');
        },
    });
};
</script>

<template>
    <Head :title="request.code || '采购申请详情'" />

    <AppLayout>
        <div class="py-12">
            <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
                <div class="flex justify-between items-center mb-6">
                    <div>
                        <Link :href="route('purchase-requests.index')" class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                            ← 返回列表
                        </Link>
                        <div class="flex items-center space-x-3 mt-2">
                            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ request.code }}</h1>
                            <Badge :type="getStatusBadge(request.status).type">
                                {{ getStatusBadge(request.status).text }}
                            </Badge>
                        </div>
                    </div>
                    <div class="flex space-x-3">
                        <Button v-if="canReject" variant="danger" @click="showRejectModal = true">
                            拒绝
                        </Button>
                        <Button v-if="canApprove" variant="success" @click="approve">
                            通过
                        </Button>
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
                                        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">申请标题</dt>
                                        <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ request.title }}</dd>
                                    </div>
                                    <div>
                                        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">申请部门</dt>
                                        <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ request.department }}</dd>
                                    </div>
                                    <div>
                                        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">申请人</dt>
                                        <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ request.requester_name }}</dd>
                                    </div>
                                    <div>
                                        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">申请时间</dt>
                                        <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ request.request_date }}</dd>
                                    </div>
                                    <div>
                                        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">优先级</dt>
                                        <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ request.priority }}</dd>
                                    </div>
                                    <div>
                                        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">期望到货日期</dt>
                                        <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ request.expected_date || '-' }}</dd>
                                    </div>
                                </dl>
                                <div class="mt-4">
                                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">采购用途</dt>
                                    <dd class="mt-1 text-sm text-gray-900 dark:text-white whitespace-pre-line">{{ request.purpose }}</dd>
                                </div>
                            </div>
                        </div>

                        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                            <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                <h3 class="text-lg font-medium text-gray-900 dark:text-white">采购明细</h3>
                            </div>
                            <div class="overflow-x-auto">
                                <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead class="bg-gray-50 dark:bg-gray-800">
                                        <tr>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">耗材</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">规格</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">数量</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">单价</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">小计</th>
                                        </tr>
                                    </thead>
                                    <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        <tr v-for="(item, index) in request.items || []" :key="index">
                                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{{ item.supply_name }}</td>
                                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{{ item.specification }}</td>
                                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{{ item.quantity }}</td>
                                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">¥{{ item.unit_price?.toLocaleString() }}</td>
                                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">¥{{ (item.quantity * item.unit_price).toLocaleString() }}</td>
                                        </tr>
                                    </tbody>
                                    <tfoot class="bg-gray-50 dark:bg-gray-800">
                                        <tr>
                                            <td colspan="4" class="px-6 py-4 text-right text-sm font-medium text-gray-900 dark:text-white">总计</td>
                                            <td class="px-6 py-4 whitespace-nowrap text-lg font-bold text-indigo-600 dark:text-indigo-400">¥{{ totalAmount.toLocaleString() }}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>

                        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                            <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                <h3 class="text-lg font-medium text-gray-900 dark:text-white">关联报价单</h3>
                            </div>
                            <div class="p-6">
                                <div v-if="quotations.length > 0" class="space-y-3">
                                    <Link
                                        v-for="quotation in quotations"
                                        :key="quotation.id"
                                        :href="route('quotations.show', quotation.id)"
                                        class="block p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                                    >
                                        <div class="flex justify-between items-center">
                                            <div>
                                                <p class="font-medium text-gray-900 dark:text-white">{{ quotation.code }}</p>
                                                <p class="text-sm text-gray-500 dark:text-gray-400">{{ quotation.supplier_name }}</p>
                                            </div>
                                            <div class="text-right">
                                                <p class="font-semibold text-indigo-600 dark:text-indigo-400">¥{{ quotation.total_amount?.toLocaleString() }}</p>
                                                <p class="text-xs text-gray-500 dark:text-gray-400">有效期至 {{ quotation.valid_until }}</p>
                                            </div>
                                        </div>
                                    </Link>
                                </div>
                                <div v-else class="text-center py-8 text-gray-500 dark:text-gray-400">
                                    暂无关联报价单
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="space-y-6">
                        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                            <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                <h3 class="text-lg font-medium text-gray-900 dark:text-white">审批流程</h3>
                            </div>
                            <div class="p-6">
                                <div class="space-y-4">
                                    <div v-for="(approval, index) in approvalHistory" :key="approval.id" class="relative">
                                        <div v-if="index < approvalHistory.length - 1" class="absolute left-3 top-8 h-full w-0.5 bg-gray-200 dark:bg-gray-700"></div>
                                        <div class="flex items-start">
                                            <div :class="[
                                                'flex items-center justify-center w-6 h-6 rounded-full flex-shrink-0',
                                                approval.status === 'approved' ? 'bg-green-500' : approval.status === 'rejected' ? 'bg-red-500' : approval.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-300 dark:bg-gray-600'
                                            ]">
                                                <svg v-if="approval.status === 'approved'" class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                                </svg>
                                                <svg v-else-if="approval.status === 'rejected'" class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                                <span v-else class="w-2 h-2 bg-white rounded-full"></span>
                                            </div>
                                            <div class="ml-4 flex-1">
                                                <div class="flex items-center justify-between">
                                                    <p class="text-sm font-medium text-gray-900 dark:text-white">{{ approval.role }}</p>
                                                    <Badge :type="getApprovalStatusBadge(approval.status).type">
                                                        {{ getApprovalStatusBadge(approval.status).text }}
                                                    </Badge>
                                                </div>
                                                <p class="text-sm text-gray-500 dark:text-gray-400">{{ approval.approver_name || '待指定' }}</p>
                                                <p v-if="approval.remark" class="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                                    备注: {{ approval.remark }}
                                                </p>
                                                <p v-if="approval.approved_at" class="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                                    {{ approval.approved_at }}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <Modal
            v-model:show="showRejectModal"
            title="拒绝申请"
            size="md"
        >
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    拒绝原因
                </label>
                <textarea
                    v-model="rejectForm.data.reason"
                    rows="4"
                    class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                    placeholder="请输入拒绝原因..."
                ></textarea>
                <p v-if="rejectForm.errors.reason" class="mt-1 text-sm text-red-600 dark:text-red-400">
                    {{ rejectForm.errors.reason }}
                </p>
            </div>

            <template #footer>
                <div class="flex space-x-3">
                    <Button variant="secondary" @click="showRejectModal = false">取消</Button>
                    <Button variant="danger" :loading="rejectForm.processing" @click="submitReject">确认拒绝</Button>
                </div>
            </template>
        </Modal>
    </AppLayout>
</template>
