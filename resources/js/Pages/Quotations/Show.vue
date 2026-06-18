<script setup>
import { Head, usePage, Link, router, ref, useForm } from '@inertiajs/vue3';
import AppLayout from '@/Layouts/AppLayout.vue';
import { computed } from 'vue';
import Badge from '@/Components/Badge.vue';
import Button from '@/Components/Button.vue';
import Modal from '@/Components/Modal.vue';
import { useToast } from '@/Composables/useToast';

const page = usePage();
const toast = useToast();
const quotation = computed(() => page.props.quotation || {});
const approvalHistory = computed(() => page.props.approvalHistory || []);

const showApproveModal = ref(false);
const showRejectModal = ref(false);
const showDisableModal = ref(false);

const approveForm = useForm({
    remarks: '',
});

const rejectForm = useForm({
    reason: '',
});

const getDaysRemaining = (validUntil) => {
    if (!validUntil) return 0;
    const now = new Date();
    const end = new Date(validUntil);
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return diff;
};

const getStatusBadge = (quotation) => {
    const days = getDaysRemaining(quotation.valid_until);
    if (quotation.status === 'disabled') {
        return { type: 'default', text: '已停用' };
    }
    if (quotation.status === 'rejected') {
        return { type: 'danger', text: '已拒绝' };
    }
    if (quotation.status === 'approved') {
        if (days < 0) {
            return { type: 'danger', text: '已过期' };
        }
        if (days <= 7) {
            return { type: 'warning', text: `即将过期(${days}天)` };
        }
        return { type: 'success', text: '有效' };
    }
    if (quotation.status === 'pending') {
        return { type: 'warning', text: '审核中' };
    }
    if (quotation.status === 'draft') {
        return { type: 'default', text: '草稿' };
    }
    return { type: 'default', text: quotation.status };
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
    return quotation.value.items?.reduce((sum, item) => {
        return sum + (item.quantity || 0) * (item.unit_price || 0);
    }, 0) || 0;
});

const canApprove = computed(() => {
    return quotation.value.status === 'pending' && quotation.value.can_approve;
});

const canReject = computed(() => {
    return quotation.value.status === 'pending' && quotation.value.can_approve;
});

const canDisable = computed(() => {
    return quotation.value.status === 'approved';
});

const submitApprove = () => {
    router.post(route('quotations.approve', quotation.value.id), approveForm.data, {
        onSuccess: () => {
            toast.success('审核通过');
            showApproveModal.value = false;
            approveForm.reset();
        },
        onError: () => {
            toast.error('操作失败');
        },
    });
};

const submitReject = () => {
    router.post(route('quotations.reject', quotation.value.id), rejectForm.data, {
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

const submitDisable = () => {
    router.post(route('quotations.disable', quotation.value.id), {}, {
        onSuccess: () => {
            toast.success('已停用');
            showDisableModal.value = false;
        },
        onError: () => {
            toast.error('操作失败');
        },
    });
};
</script>

<template>
    <Head :title="quotation.code || '报价单详情'" />

    <AppLayout>
        <div class="py-12">
            <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
                <div class="flex justify-between items-center mb-6">
                    <div>
                        <Link :href="route('quotations.index')" class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                            ← 返回列表
                        </Link>
                        <div class="flex items-center space-x-3 mt-2">
                            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ quotation.code }}</h1>
                            <Badge :type="getStatusBadge(quotation).type">
                                {{ getStatusBadge(quotation).text }}
                            </Badge>
                        </div>
                    </div>
                    <div class="flex space-x-3">
                        <Button v-if="canDisable" variant="secondary" @click="showDisableModal = true">
                            停用
                        </Button>
                        <Button v-if="canReject" variant="danger" @click="showRejectModal = true">
                            拒绝
                        </Button>
                        <Button v-if="canApprove" variant="success" @click="showApproveModal = true">
                            通过
                        </Button>
                        <Link v-if="quotation.status === 'draft'" :href="route('quotations.edit', quotation.id)">
                            <Button variant="primary">编辑</Button>
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
                                        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">报价单号</dt>
                                        <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ quotation.code }}</dd>
                                    </div>
                                    <div>
                                        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">供应商</dt>
                                        <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ quotation.supplier_name }}</dd>
                                    </div>
                                    <div>
                                        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">关联采购申请</dt>
                                        <dd class="mt-1 text-sm">
                                            <Link
                                                v-if="quotation.purchase_request_id"
                                                :href="route('purchase-requests.show', quotation.purchase_request_id)"
                                                class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                            >
                                                {{ quotation.purchase_request_code || '查看详情' }}
                                            </Link>
                                            <span v-else class="text-gray-900 dark:text-white">-</span>
                                        </dd>
                                    </div>
                                    <div>
                                        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">报价日期</dt>
                                        <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ quotation.quotation_date }}</dd>
                                    </div>
                                    <div>
                                        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">有效期开始</dt>
                                        <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ quotation.valid_from }}</dd>
                                    </div>
                                    <div>
                                        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">有效期结束</dt>
                                        <dd class="mt-1">
                                            <span class="text-sm text-gray-900 dark:text-white">{{ quotation.valid_until }}</span>
                                            <span :class="[
                                                'ml-2 text-xs',
                                                getDaysRemaining(quotation.valid_until) < 0 ? 'text-red-600 dark:text-red-400' :
                                                getDaysRemaining(quotation.valid_until) <= 7 ? 'text-yellow-600 dark:text-yellow-400' :
                                                'text-gray-500 dark:text-gray-400'
                                            ]">
                                                {{ getDaysRemaining(quotation.valid_until) < 0 ? `已过期${Math.abs(getDaysRemaining(quotation.valid_until))}天` : `剩余${getDaysRemaining(quotation.valid_until)}天` }}
                                            </span>
                                        </dd>
                                    </div>
                                    <div>
                                        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">创建人</dt>
                                        <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ quotation.creator_name }}</dd>
                                    </div>
                                    <div>
                                        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">创建时间</dt>
                                        <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ quotation.created_at }}</dd>
                                    </div>
                                </dl>
                            </div>
                        </div>

                        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                            <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                <h3 class="text-lg font-medium text-gray-900 dark:text-white">报价明细</h3>
                            </div>
                            <div class="overflow-x-auto">
                                <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead class="bg-gray-50 dark:bg-gray-800">
                                        <tr>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">耗材编码</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">耗材名称</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">数量</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">单价</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">小计</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">备注</th>
                                        </tr>
                                    </thead>
                                    <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        <tr v-for="(item, index) in quotation.items || []" :key="index">
                                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{{ item.supply_code }}</td>
                                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{{ item.supply_name }}</td>
                                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{{ item.quantity }}</td>
                                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">¥{{ item.unit_price?.toLocaleString() }}</td>
                                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">¥{{ (item.quantity * item.unit_price).toLocaleString() }}</td>
                                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{{ item.remarks || '-' }}</td>
                                        </tr>
                                    </tbody>
                                    <tfoot class="bg-gray-50 dark:bg-gray-800">
                                        <tr>
                                            <td colspan="4" class="px-6 py-4 text-right text-sm font-medium text-gray-900 dark:text-white">总计</td>
                                            <td class="px-6 py-4 whitespace-nowrap text-lg font-bold text-indigo-600 dark:text-indigo-400">¥{{ totalAmount.toLocaleString() }}</td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div class="space-y-6">
                        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                            <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                <h3 class="text-lg font-medium text-gray-900 dark:text-white">审核流程</h3>
                            </div>
                            <div class="p-6">
                                <div v-if="approvalHistory.length > 0" class="space-y-4">
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
                                <div v-else class="text-center py-8 text-gray-500 dark:text-gray-400">
                                    暂无审核记录
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <Modal
            v-model:show="showApproveModal"
            title="审核通过"
            size="md"
        >
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    审核备注
                </label>
                <textarea
                    v-model="approveForm.data.remarks"
                    rows="3"
                    class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="请输入备注（可选）..."
                ></textarea>
            </div>

            <template #footer>
                <div class="flex space-x-3">
                    <Button variant="secondary" @click="showApproveModal = false">取消</Button>
                    <Button variant="success" :loading="approveForm.processing" @click="submitApprove">确认通过</Button>
                </div>
            </template>
        </Modal>

        <Modal
            v-model:show="showRejectModal"
            title="拒绝报价单"
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

        <Modal
            v-model:show="showDisableModal"
            title="停用报价单"
            size="sm"
        >
            <p class="text-gray-600 dark:text-gray-300">
                确定要停用报价单「{{ quotation.code }}」吗？停用后该报价单将不再生效。
            </p>

            <template #footer>
                <div class="flex space-x-3">
                    <Button variant="secondary" @click="showDisableModal = false">取消</Button>
                    <Button variant="danger" @click="submitDisable">确认停用</Button>
                </div>
            </template>
        </Modal>
    </AppLayout>
</template>
