<script setup>
import { ref, computed } from 'vue';
import { usePage, router, useForm } from '@inertiajs/vue3';
import DataTable from '@/Components/DataTable.vue';
import StatusBadge from '@/Components/StatusBadge.vue';

const page = usePage();

const writeOffs = computed(() => page.props.writeOffs?.data || []);
const pagination = computed(() => page.props.writeOffs);

const showCreateModal = ref(false);
const showReviewModal = ref(false);
const currentWriteOff = ref(null);
const reviewAction = ref('');

const form = useForm({
    difference_id: '',
    amount: '',
    reason: '',
    supporting_documents: [],
    remark: '',
});

const reviewForm = useForm({
    approval_result: '',
    approval_remark: '',
});

const filters = ref({
    status: page.props.filters?.status || '',
    project_id: page.props.filters?.project_id || '',
    date_from: page.props.filters?.date_from || '',
    date_to: page.props.filters?.date_to || '',
});

const columns = [
    { key: 'id', label: '申请单号', sortable: false },
    { key: 'project_name', label: '项目名称' },
    {
        key: 'write_off_amount',
        label: '冲销金额',
        render: (row) => formatCurrency(row.write_off_amount),
    },
    { key: 'reason', label: '冲销原因' },
    { key: 'applicant_name', label: '申请人' },
    { key: 'created_at', label: '申请时间' },
    { key: 'approver_name', label: '审批人' },
    { key: 'status', label: '状态' },
];

const rowActions = [
    { key: 'approve', label: '审批', variant: 'primary' },
    { key: 'view', label: '查看', variant: 'secondary' },
];

const pendingWriteOffs = computed(() => {
    return page.props.pendingWriteOffs || [];
});

const formatCurrency = (value) => {
    if (!value) return '-';
    return new Intl.NumberFormat('zh-CN', {
        style: 'currency',
        currency: 'CNY',
    }).format(value);
};

const handleFilter = (newFilters) => {
    filters.value = { ...filters.value, ...newFilters };
    loadData();
};

const handleReset = () => {
    filters.value = {
        status: '',
        project_id: '',
        date_from: '',
        date_to: '',
    };
    loadData();
};

const handlePageChange = (page) => {
    loadData({ page });
};

const loadData = (params = {}) => {
    router.get(route('admin.write-off.index'), {
        ...filters.value,
        ...params,
    }, { preserveState: true });
};

const handleRowAction = (action, row) => {
    currentWriteOff.value = row;

    if (action === 'approve') {
        reviewAction.value = 'approve';
        reviewForm.reset();
        showReviewModal.value = true;
    } else if (action === 'view') {
        reviewAction.value = 'view';
        showReviewModal.value = true;
    }
};

const openCreateModal = () => {
    form.reset();
    showCreateModal.value = true;
};

const submitApplication = () => {
    form.post(route('admin.write-off.store'), {
        preserveScroll: true,
        onSuccess: () => {
            showCreateModal.value = false;
            form.reset();
        },
    });
};

const submitReview = (result) => {
    reviewForm.approval_result = result;

    router.post(route('admin.write-off.review', currentWriteOff.value.id), {
        ...reviewForm,
    }, {
        preserveScroll: true,
        onSuccess: () => {
            showReviewModal.value = false;
            reviewForm.reset();
        },
    });
};

const stats = computed(() => {
    return page.props.stats || {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        total_amount: 0,
    };
});
</script>

<template>
    <div class="py-12">
        <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div class="flex items-center justify-between mb-8">
                <div>
                    <h1 class="text-2xl font-bold text-gray-900">冲销管理</h1>
                    <p class="mt-1 text-sm text-gray-600">管理坏账差异的冲销申请与审批流程</p>
                </div>
                <button
                    @click="openCreateModal"
                    class="inline-flex items-center px-4 py-2 bg-primary-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-primary-700 focus:bg-primary-700 active:bg-primary-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition ease-in-out duration-150"
                >
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                    新建冲销申请
                </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg p-4">
                    <p class="text-sm text-gray-500">申请总数</p>
                    <p class="text-2xl font-bold text-gray-900 mt-1">{{ stats.total }}</p>
                </div>
                <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg p-4">
                    <p class="text-sm text-gray-500">待审批</p>
                    <p class="text-2xl font-bold text-yellow-600 mt-1">{{ stats.pending }}</p>
                </div>
                <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg p-4">
                    <p class="text-sm text-gray-500">已通过</p>
                    <p class="text-2xl font-bold text-green-600 mt-1">{{ stats.approved }}</p>
                </div>
                <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg p-4">
                    <p class="text-sm text-gray-500">已拒绝</p>
                    <p class="text-2xl font-bold text-red-600 mt-1">{{ stats.rejected }}</p>
                </div>
                <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg p-4">
                    <p class="text-sm text-gray-500">累计冲销金额</p>
                    <p class="text-2xl font-bold text-primary-600 mt-1">{{ formatCurrency(stats.total_amount) }}</p>
                </div>
            </div>

            <div class="bg-white rounded-lg shadow p-4 mb-4">
                <div class="flex flex-wrap gap-4 items-end">
                    <div class="flex-1 min-w-[200px]">
                        <label class="block text-sm font-medium text-gray-700 mb-1">状态</label>
                        <select
                            v-model="filters.status"
                            @change="handleFilter({ status: filters.status })"
                            class="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        >
                            <option value="">全部状态</option>
                            <option value="waiting_approval">待审批</option>
                            <option value="approved">已通过</option>
                            <option value="rejected">已拒绝</option>
                        </select>
                    </div>
                    <div class="flex-1 min-w-[200px]">
                        <label class="block text-sm font-medium text-gray-700 mb-1">项目</label>
                        <select
                            v-model="filters.project_id"
                            @change="handleFilter({ project_id: filters.project_id })"
                            class="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        >
                            <option value="">全部项目</option>
                            <option v-for="project in page.props.projects" :key="project.id" :value="project.id">
                                {{ project.name }}
                            </option>
                        </select>
                    </div>
                    <div class="flex-1 min-w-[200px]">
                        <label class="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
                        <input
                            v-model="filters.date_from"
                            type="date"
                            @change="handleFilter({ date_from: filters.date_from })"
                            class="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                    </div>
                    <div class="flex-1 min-w-[200px]">
                        <label class="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
                        <input
                            v-model="filters.date_to"
                            type="date"
                            @change="handleFilter({ date_to: filters.date_to })"
                            class="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                    </div>
                    <div class="flex gap-2">
                        <button
                            @click="handleReset"
                            class="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md font-semibold text-xs text-gray-700 uppercase tracking-widest shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition ease-in-out duration-150"
                        >
                            重置
                        </button>
                    </div>
                </div>
            </div>

            <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                <DataTable
                    :columns="columns"
                    :data="writeOffs"
                    :pagination="pagination"
                    :row-actions="rowActions"
                    @page-change="handlePageChange"
                    @row-action="handleRowAction"
                >
                    <template #cell-status="{ row }">
                        <StatusBadge :status="row.status" size="sm" />
                    </template>
                    <template #cell-write_off_amount="{ row }">
                        <span class="font-medium text-gray-900">
                            {{ formatCurrency(row.write_off_amount) }}
                        </span>
                    </template>
                </DataTable>
            </div>

            <div v-if="showCreateModal" class="fixed inset-0 overflow-y-auto z-50">
                <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
                    <div class="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" @click="showCreateModal = false"></div>

                    <div class="relative inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
                        <div class="mb-6">
                            <h3 class="text-lg font-semibold text-gray-900">新建冲销申请</h3>
                        </div>

                        <form @submit.prevent="submitApplication" class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">
                                    选择差异记录 <span class="text-red-500">*</span>
                                </label>
                                <select
                                    v-model="form.difference_id"
                                    class="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                    required
                                >
                                    <option value="">请选择需要冲销的差异记录</option>
                                    <option v-for="diff in pendingWriteOffs" :key="diff.id" :value="diff.id">
                                        {{ diff.project_name }} - {{ formatCurrency(diff.difference_amount) }}
                                    </option>
                                </select>
                                <p v-if="form.errors.difference_id" class="mt-1 text-sm text-red-600">
                                    {{ form.errors.difference_id }}
                                </p>
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">
                                    冲销金额 <span class="text-red-500">*</span>
                                </label>
                                <div class="relative">
                                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">¥</span>
                                    <input
                                        v-model="form.amount"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="0.00"
                                        class="w-full pl-8 pr-4 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                        required
                                    />
                                </div>
                                <p v-if="form.errors.amount" class="mt-1 text-sm text-red-600">
                                    {{ form.errors.amount }}
                                </p>
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">
                                    冲销原因 <span class="text-red-500">*</span>
                                </label>
                                <select
                                    v-model="form.reason"
                                    class="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                    required
                                >
                                    <option value="">请选择冲销原因</option>
                                    <option value="bad_debt">坏账损失</option>
                                    <option value="discount">折扣减免</option>
                                    <option value="compensation">赔偿抵扣</option>
                                    <option value="other">其他原因</option>
                                </select>
                                <p v-if="form.errors.reason" class="mt-1 text-sm text-red-600">
                                    {{ form.errors.reason }}
                                </p>
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">
                                    佐证文件
                                </label>
                                <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors cursor-pointer">
                                    <input type="file" multiple class="hidden" id="supporting-docs" />
                                    <label for="supporting-docs" class="cursor-pointer">
                                        <svg class="mx-auto h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                        <p class="mt-2 text-sm text-gray-600">点击上传佐证文件</p>
                                        <p class="text-xs text-gray-500">支持 PDF、图片格式</p>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">
                                    备注说明
                                </label>
                                <textarea
                                    v-model="form.remark"
                                    rows="3"
                                    class="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                    placeholder="请详细说明冲销原因和背景"
                                ></textarea>
                            </div>

                            <div class="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    @click="showCreateModal = false"
                                    class="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md font-semibold text-xs text-gray-700 uppercase tracking-widest shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition ease-in-out duration-150"
                                >
                                    取消
                                </button>
                                <button
                                    type="submit"
                                    :disabled="form.processing"
                                    class="inline-flex items-center px-4 py-2 bg-primary-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-primary-700 focus:bg-primary-700 active:bg-primary-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition ease-in-out duration-150 disabled:opacity-50"
                                >
                                    <svg v-if="form.processing" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    提交申请
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <div v-if="showReviewModal" class="fixed inset-0 overflow-y-auto z-50">
                <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
                    <div class="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" @click="showReviewModal = false"></div>

                    <div class="relative inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
                        <div class="mb-6">
                            <h3 class="text-lg font-semibold text-gray-900">
                                {{ reviewAction === 'view' ? '查看冲销详情' : '审批冲销申请' }}
                            </h3>
                            <p class="mt-1 text-sm text-gray-500">
                                申请单号: {{ currentWriteOff?.id }}
                            </p>
                        </div>

                        <div class="space-y-4 mb-6">
                            <div class="grid grid-cols-2 gap-4">
                                <div class="p-3 bg-gray-50 rounded-lg">
                                    <p class="text-sm text-gray-500">项目名称</p>
                                    <p class="font-medium text-gray-900 mt-1">{{ currentWriteOff?.project_name }}</p>
                                </div>
                                <div class="p-3 bg-gray-50 rounded-lg">
                                    <p class="text-sm text-gray-500">冲销金额</p>
                                    <p class="font-medium text-gray-900 mt-1">{{ formatCurrency(currentWriteOff?.write_off_amount) }}</p>
                                </div>
                                <div class="p-3 bg-gray-50 rounded-lg">
                                    <p class="text-sm text-gray-500">冲销原因</p>
                                    <p class="font-medium text-gray-900 mt-1">{{ currentWriteOff?.reason }}</p>
                                </div>
                                <div class="p-3 bg-gray-50 rounded-lg">
                                    <p class="text-sm text-gray-500">申请人</p>
                                    <p class="font-medium text-gray-900 mt-1">{{ currentWriteOff?.applicant_name }}</p>
                                </div>
                            </div>

                            <div class="p-3 bg-gray-50 rounded-lg">
                                <p class="text-sm text-gray-500">申请备注</p>
                                <p class="font-medium text-gray-900 mt-1">{{ currentWriteOff?.remark || '-' }}</p>
                            </div>

                            <div v-if="currentWriteOff?.approval_remark" class="p-3 bg-gray-50 rounded-lg">
                                <p class="text-sm text-gray-500">审批意见</p>
                                <p class="font-medium text-gray-900 mt-1">{{ currentWriteOff.approval_remark }}</p>
                            </div>
                        </div>

                        <div v-if="reviewAction === 'approve'">
                            <div class="mb-4">
                                <label class="block text-sm font-medium text-gray-700 mb-2">
                                    审批意见
                                </label>
                                <textarea
                                    v-model="reviewForm.approval_remark"
                                    rows="3"
                                    class="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                    placeholder="请输入审批意见（可选）"
                                ></textarea>
                            </div>

                            <div class="flex justify-end gap-3">
                                <button
                                    type="button"
                                    @click="showReviewModal = false"
                                    class="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md font-semibold text-xs text-gray-700 uppercase tracking-widest shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition ease-in-out duration-150"
                                >
                                    取消
                                </button>
                                <button
                                    type="button"
                                    @click="submitReview('rejected')"
                                    class="inline-flex items-center px-4 py-2 bg-red-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-red-700 focus:bg-red-700 active:bg-red-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition ease-in-out duration-150"
                                >
                                    拒绝
                                </button>
                                <button
                                    type="button"
                                    @click="submitReview('approved')"
                                    class="inline-flex items-center px-4 py-2 bg-green-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-green-700 focus:bg-green-700 active:bg-green-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition ease-in-out duration-150"
                                >
                                    通过
                                </button>
                            </div>
                        </div>

                        <div v-else class="flex justify-end">
                            <button
                                type="button"
                                @click="showReviewModal = false"
                                class="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md font-semibold text-xs text-gray-700 uppercase tracking-widest shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition ease-in-out duration-150"
                            >
                                关闭
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
