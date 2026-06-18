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
const quotations = computed(() => page.props.quotations?.data || []);
const pagination = computed(() => page.props.quotations || { current_page: 1, last_page: 1, per_page: 15, total: 0 });
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
    reject_reason: '',
    review_comments: '',
});

const columns = [
    { key: 'id', label: 'ID' },
    { key: 'quotation_number', label: '报价单号', slot: 'quotation_number' },
    { key: 'supplier_name', label: '供应商', slot: 'supplier_name' },
    { key: 'total_amount', label: '金额', slot: 'total_amount' },
    { key: 'valid_until', label: '有效期' },
    { key: 'status', label: '状态', slot: 'status' },
    { key: 'actions', label: '操作', slot: 'actions' },
];

const statusOptions = [
    { value: '', label: '全部状态' },
    { value: 'pending', label: '待复核' },
    { value: 'approved', label: '已通过' },
    { value: 'rejected', label: '已驳回' },
];

const getStatusBadge = (status) => {
    const map = {
        pending: { type: 'warning', text: '待复核' },
        approved: { type: 'success', text: '已通过' },
        rejected: { type: 'danger', text: '已驳回' },
    };
    return map[status] || { type: 'default', text: status };
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
    reviewForm.value.reject_reason = '';
    reviewForm.value.review_comments = '';
    showReviewModal.value = true;
};

const approve = () => {
    router.post(route('financial-reviews.approve', currentReview.value.id), {
        review_comments: reviewForm.value.review_comments,
    }, {
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
    if (!reviewForm.value.reject_reason) {
        toast.error('请填写驳回原因');
        return;
    }
    router.post(route('financial-reviews.reject', currentReview.value.id), {
        reject_reason: reviewForm.value.reject_reason,
        review_comments: reviewForm.value.review_comments,
    }, {
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
                                    placeholder="搜索报价单号/供应商..."
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
                        <Table :columns="columns" :data="quotations">
                            <template #quotation_number="{ row }">
                                <Link
                                    :href="route('quotations.show', row.id)"
                                    class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
                                >
                                    {{ row.quotation_number }}
                                </Link>
                            </template>
                            <template #supplier_name="{ row }">
                                {{ row.supplier_name || row.supplier?.name }}
                            </template>
                            <template #total_amount="{ row }">
                                <span class="font-semibold text-gray-900 dark:text-white">
                                    ¥{{ row.total_amount?.toLocaleString() || 0 }}
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
                                        :href="route('quotations.show', row.id)"
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
                                <p class="text-sm text-gray-500 dark:text-gray-400">报价单号</p>
                                <p class="font-medium text-gray-900 dark:text-white">{{ currentReview.quotation_number }}</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-500 dark:text-gray-400">供应商</p>
                                <p class="font-medium text-gray-900 dark:text-white">{{ currentReview.supplier_name || currentReview.supplier?.name }}</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-500 dark:text-gray-400">有效期</p>
                                <p class="font-medium text-gray-900 dark:text-white">{{ currentReview.valid_until }}</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-500 dark:text-gray-400">金额</p>
                                <p class="font-semibold text-indigo-600 dark:text-indigo-400">¥{{ currentReview.total_amount?.toLocaleString() }}</p>
                            </div>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                复核意见
                            </label>
                            <textarea
                                v-model="reviewForm.review_comments"
                                rows="3"
                                class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                placeholder="请输入复核意见..."
                            ></textarea>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                驳回原因 <span class="text-red-500">*驳回时必填</span>
                            </label>
                            <textarea
                                v-model="reviewForm.reject_reason"
                                rows="3"
                                class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                placeholder="请输入驳回原因..."
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
