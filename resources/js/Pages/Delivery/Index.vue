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
const deliveries = computed(() => page.props.deliveries?.data || []);
const pagination = computed(() => page.props.deliveries || { current_page: 1, last_page: 1, per_page: 15, total: 0 });
const stats = computed(() => page.props.stats || { pending: 0, confirmed: 0, partial: 0, total: 0 });
const filters = ref({
    search: '',
    status: '',
    date_from: '',
    date_to: '',
});
const showConfirmModal = ref(false);
const currentDelivery = ref(null);
const confirmItems = ref([]);

const columns = [
    { key: 'code', label: '到货单号', slot: 'code' },
    { key: 'purchase_request_code', label: '采购申请' },
    { key: 'supplier_name', label: '供应商' },
    { key: 'delivery_date', label: '到货日期' },
    { key: 'total_quantity', label: '到货数量', slot: 'total_quantity' },
    { key: 'confirmed_quantity', label: '已确认数量', slot: 'confirmed_quantity' },
    { key: 'status', label: '状态', slot: 'status' },
    { key: 'actions', label: '操作', slot: 'actions' },
];

const statusOptions = [
    { value: '', label: '全部状态' },
    { value: 'pending', label: '待确认' },
    { value: 'partial', label: '部分确认' },
    { value: 'confirmed', label: '已确认' },
    { value: 'returned', label: '已退货' },
];

const getStatusBadge = (status) => {
    const map = {
        pending: { type: 'warning', text: '待确认' },
        partial: { type: 'info', text: '部分确认' },
        confirmed: { type: 'success', text: '已确认' },
        returned: { type: 'danger', text: '已退货' },
    };
    return map[status] || { type: 'default', text: status };
};

const applyFilters = () => {
    router.get(route('delivery.index'), filters.value, { preserveState: true });
};

const resetFilters = () => {
    filters.value = { search: '', status: '', date_from: '', date_to: '' };
    applyFilters();
};

const openConfirmModal = (delivery) => {
    currentDelivery.value = delivery;
    confirmItems.value = (delivery.items || []).map(item => ({
        ...item,
        confirmed_qty: item.confirmed_qty || 0,
        batch_number: item.batch_number || '',
        expiry_date: item.expiry_date || '',
        remark: '',
    }));
    showConfirmModal.value = true;
};

const confirmDelivery = () => {
    router.post(route('delivery.confirm', currentDelivery.value.id), {
        items: confirmItems.value,
    }, {
        onSuccess: () => {
            toast.success('到货确认成功');
            showConfirmModal.value = false;
        },
        onError: () => {
            toast.error('确认失败');
        },
    });
};
</script>

<template>
    <Head title="到货确认" />

    <AppLayout>
        <div class="py-12">
            <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
                <div class="flex justify-between items-center mb-6">
                    <h1 class="text-2xl font-bold text-gray-900 dark:text-white">到货确认</h1>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <p class="text-sm font-medium text-gray-500 dark:text-gray-400">全部到货</p>
                        <p class="text-2xl font-semibold text-gray-900 dark:text-white mt-1">{{ stats.total }}</p>
                    </div>
                    <div class="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg shadow p-6 border border-yellow-200 dark:border-yellow-700">
                        <p class="text-sm font-medium text-yellow-600 dark:text-yellow-400">待确认</p>
                        <p class="text-2xl font-semibold text-yellow-700 dark:text-yellow-300 mt-1">{{ stats.pending }}</p>
                    </div>
                    <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg shadow p-6 border border-blue-200 dark:border-blue-700">
                        <p class="text-sm font-medium text-blue-600 dark:text-blue-400">部分确认</p>
                        <p class="text-2xl font-semibold text-blue-700 dark:text-blue-300 mt-1">{{ stats.partial }}</p>
                    </div>
                    <div class="bg-green-50 dark:bg-green-900/20 rounded-lg shadow p-6 border border-green-200 dark:border-green-700">
                        <p class="text-sm font-medium text-green-600 dark:text-green-400">已确认</p>
                        <p class="text-2xl font-semibold text-green-700 dark:text-green-300 mt-1">{{ stats.confirmed }}</p>
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg mb-6">
                    <div class="p-6">
                        <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
                            <div class="md:col-span-2">
                                <Input
                                    v-model="filters.search"
                                    placeholder="搜索到货单号/供应商..."
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
                        <Table :columns="columns" :data="deliveries">
                            <template #code="{ row }">
                                <Link
                                    :href="route('delivery.show', row.id)"
                                    class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
                                >
                                    {{ row.code }}
                                </Link>
                            </template>
                            <template #total_quantity="{ row }">
                                <span class="font-medium text-gray-900 dark:text-white">{{ row.total_quantity }}</span>
                            </template>
                            <template #confirmed_quantity="{ row }">
                                <span :class="['font-medium', row.confirmed_quantity < row.total_quantity ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400']">
                                    {{ row.confirmed_quantity }}
                                </span>
                            </template>
                            <template #status="{ row }">
                                <Badge :type="getStatusBadge(row.status).type">
                                    {{ getStatusBadge(row.status).text }}
                                </Badge>
                            </template>
                            <template #actions="{ row }">
                                <div class="flex space-x-2">
                                    <Link
                                        :href="route('delivery.show', row.id)"
                                        class="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                                    >
                                        查看
                                    </Link>
                                    <button
                                        v-if="row.status === 'pending' || row.status === 'partial'"
                                        class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                        @click="openConfirmModal(row)"
                                    >
                                        确认
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
                        @change="({ page, perPage }) => router.get(route('delivery.index'), { page, per_page: perPage }, { preserveState: true })"
                    />
                </div>
            </div>
        </div>

        <Modal
            v-if="currentDelivery"
            v-model:show="showConfirmModal"
            title="到货确认"
            size="xl"
        >
            <div class="space-y-4">
                <div class="grid grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                        <p class="text-sm text-gray-500 dark:text-gray-400">到货单号</p>
                        <p class="font-medium text-gray-900 dark:text-white">{{ currentDelivery.code }}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500 dark:text-gray-400">供应商</p>
                        <p class="font-medium text-gray-900 dark:text-white">{{ currentDelivery.supplier_name }}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500 dark:text-gray-400">到货日期</p>
                        <p class="font-medium text-gray-900 dark:text-white">{{ currentDelivery.delivery_date }}</p>
                    </div>
                </div>

                <div>
                    <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">确认明细</h4>
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead class="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">耗材名称</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">规格</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">到货数量</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">确认数量</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">批号</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">有效期</th>
                                </tr>
                            </thead>
                            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                <tr v-for="(item, index) in confirmItems" :key="index">
                                    <td class="px-4 py-3 text-sm text-gray-900 dark:text-white">{{ item.supply_name }}</td>
                                    <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{{ item.specification }}</td>
                                    <td class="px-4 py-3 text-sm text-gray-900 dark:text-white">{{ item.expected_qty }}</td>
                                    <td class="px-4 py-3 w-28">
                                        <input
                                            v-model.number="item.confirmed_qty"
                                            type="number"
                                            min="0"
                                            :max="item.expected_qty"
                                            class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        />
                                    </td>
                                    <td class="px-4 py-3">
                                        <input
                                            v-model="item.batch_number"
                                            type="text"
                                            class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                            placeholder="批号"
                                        />
                                    </td>
                                    <td class="px-4 py-3">
                                        <input
                                            v-model="item.expiry_date"
                                            type="date"
                                            class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        />
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <template #footer>
                <div class="flex space-x-3">
                    <Button variant="secondary" @click="showConfirmModal = false">取消</Button>
                    <Button variant="primary" @click="confirmDelivery">确认到货</Button>
                </div>
            </template>
        </Modal>
    </AppLayout>
</template>
