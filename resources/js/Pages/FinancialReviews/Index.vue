<script setup>
import { Head, usePage, Link, router } from '@inertiajs/vue3';
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
const reviews = computed(() => page.props.reviews?.data || []);
const pagination = computed(() => page.props.reviews || { current_page: 1, last_page: 1, per_page: 15, total: 0 });
const stats = computed(() => page.props.stats || { pending: 0, approved: 0, rejected: 0, total: 0 });
const filters = ref({
    search: '',
    status: '',
    date_from: '',
    date_to: '',
});
const showReviewModal = ref(false);
const currentReview = ref(null);
const reviewForm = ref({
    comment: '',
});

const columns = [
    { key: 'code', label: '单据编号', slot: 'code' },
    { key: 'type', label: '类型', slot: 'type' },
    { key: 'applicant', label: '申请人' },
    { key: 'amount', label: '金额', slot: 'amount' },
    { key: 'submitted_at', label: '提交时间' },
    { key: 'status', label: '状态', slot: 'status' },
    { key: 'actions', label: '操作', slot: 'actions' },
];

const statusOptions = [
    { value: '', label: '全部状态' },
    { value: 'pending', label: '待复核' },
    { value: 'approved', label: '已通过' },
    { value: 'rejected', label: '已驳回' },
];

const typeOptions = [
    { value: 'purchase', label: '采购单' },
    { value: 'payment', label: '付款单' },
    { value: 'reimbursement', label: '报销单' },
];

const getStatusBadge = (status) => {
    const map = {
        pending: { type: 'warning', text: '待复核' },
        approved: { type: 'success', text: '已通过' },
        rejected: { type: 'danger', text: '已驳回' },
    };
    return map[status] || { type: 'default', text: status };
};

const getTypeBadge = (type) => {
    const map = {
        purchase: { type: 'primary', text: '采购单' },
        payment: { type: 'info', text: '付款单' },
        reimbursement: { type: 'default', text: '报销单' },
    };
    return map[type] || { type: 'default', text: type };
};

const applyFilters = () => {
    router.get(route('financial-reviews.index'), filters.value, { preserveState: true });
};

const resetFilters = () => {
    filters.value = { search: '', status: '', date_from: '', date_to: '' };
    applyFilters();
};

const openReviewModal = (review) => {
    currentReview.value = review;
    reviewForm.value.comment = '';
    showReviewModal.value = true;
};

const approve = () => {
    router.post(route('financial-reviews.approve', currentReview.value.id), reviewForm.value, {
        onSuccess: () => {
            toast.success('复核通过');
            showReviewModal.value = false;
        },
        onError: () => {
            toast.error('操作失败');
        },
    });
};

const reject = () => {
    if (!reviewForm.value.comment) {
        toast.error('请填写驳回原因');
        return;
    }
    router.post(route('financial-reviews.reject', currentReview.value.id), reviewForm.value, {
        onSuccess: () => {
            toast.success('已驳回');
            showReviewModal.value = false;
        },
        onError: () => {
            toast.error('操作失败');
        },
    });
};
</script>

<template>
    <Head title="财务复核" />

    <AdminLayout>
        <div class="py-6">
            <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
                <div class="flex justify-between items-center mb-6">
                    <h1 class="text-2xl font-bold text-gray-900 dark:text-white">财务复核</h1>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <p class="text-sm font-medium text-gray-500 dark:text-gray-400">全部单据</p>
                        <p class="text-2xl font-semibold text-gray-900 dark:text-white mt-1">{{ stats.total }}</p>
                    </div>
                    <div class="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg shadow p-6 border border-yellow-200 dark:border-yellow-700">
                        <p class="text-sm font-medium text-yellow-600 dark:text-yellow-400">待复核</p>
                        <p class="text-2xl font-semibold text-yellow-700 dark:text-yellow-300 mt-1">{{ stats.pending }}</p>
                    </div>
                    <div class="bg-green-50 dark:bg-green-900/20 rounded-lg shadow p-6 border border-green-200 dark:border-green-700">
                        <p class="text-sm font-medium text-green-600 dark:text-green-400">已通过</p>
                        <p class="text-2xl font-semibold text-green-700 dark:text-green-300 mt-1">{{ stats.approved }}</p>
                    </div>
                    <div class="bg-red-50 dark:bg-red-900/20 rounded-lg shadow p-6 border border-red-200 dark:border-red-700">
                        <p class="text-sm font-medium text-red-600 dark:text-red-400">已驳回</p>
                        <p class="text-2xl font-semibold text-red-700 dark:text-red-300 mt-1">{{ stats.rejected }}</p>
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg mb-6">
                    <div class="p-6">
                        <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
                            <div class="md:col-span-2">
                                <Input
                                    v-model="filters.search"
                                    placeholder="搜索单据编号/申请人..."
                                    @change="applyFilters"
                                />
                            </div>
                            <Select
                                v-model="filters.status"
                                :options="statusOptions"
                                @change="applyFilters"
                            />
                            <Input
                                v-model="filters.date_from"
                                type="date"
                                label=""
                                placeholder="开始日期"
                                @change="applyFilters"
                            />
                            <Input
                                v-model="filters.date_to"
                                type="date"
                                label=""
                                placeholder="结束日期"
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
                        <Table :columns="columns" :data="reviews">
                            <template #code="{ row }">
                                <Link
                                    :href="row.link || '#'"
                                    class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
                                >
                                    {{ row.code }}
                                </Link>
                            </template>
                            <template #type="{ row }">
                                <Badge :type="getTypeBadge(row.type).type">
                                    {{ getTypeBadge(row.type).text }}
                                </Badge>
                            </template>
                            <template #amount="{ row }">
                                <span class="font-semibold text-gray-900 dark:text-white">
                                    ¥{{ row.amount?.toLocaleString() || 0 }}
                                </span>
                            </template>
                            <template #status="{ row }">
                                <Badge :type="getStatusBadge(row.status).type">
                                    {{ getStatusBadge(row.status).text }}
                                </Badge>
                            </template>
                            <template #actions="{ row }">
                                <div class="flex space-x-2">
                                    <button
                                        v-if="row.status === 'pending'"
                                        class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                        @click="openReviewModal(row)"
                                    >
                                        复核
                                    </button>
                                    <Link
                                        :href="row.link || '#'"
                                        class="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                                    >
                                        详情
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
                    />
                </div>

                <Modal
                    v-if="currentReview"
                    v-model:show="showReviewModal"
                    title="财务复核"
                    size="lg"
                >
                    <div class="space-y-4">
                        <div class="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div>
                                <p class="text-sm text-gray-500 dark:text-gray-400">单据编号</p>
                                <p class="font-medium text-gray-900 dark:text-white">{{ currentReview.code }}</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-500 dark:text-gray-400">单据类型</p>
                                <p class="font-medium text-gray-900 dark:text-white">{{ currentReview.type }}</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-500 dark:text-gray-400">申请人</p>
                                <p class="font-medium text-gray-900 dark:text-white">{{ currentReview.applicant }}</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-500 dark:text-gray-400">金额</p>
                                <p class="font-semibold text-indigo-600 dark:text-indigo-400">¥{{ currentReview.amount?.toLocaleString() }}</p>
                            </div>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                复核意见
                            </label>
                            <textarea
                                v-model="reviewForm.comment"
                                rows="3"
                                class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                placeholder="请输入复核意见（驳回时必填）..."
                            ></textarea>
                        </div>
                    </div>

                    <template #footer>
                        <div class="flex space-x-3">
                            <Button variant="secondary" @click="showReviewModal = false">取消</Button>
                            <Button variant="danger" @click="reject">驳回</Button>
                            <Button variant="success" @click="approve">通过</Button>
                        </div>
                    </template>
                </Modal>
            </div>
        </div>
    </AdminLayout>
</template>
