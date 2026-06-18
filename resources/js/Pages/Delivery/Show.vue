<script setup>
import { Head, usePage, Link, router } from '@inertiajs/vue3';
import AppLayout from '@/Layouts/AppLayout.vue';
import { computed, ref, onMounted } from 'vue';
import Badge from '@/Components/Badge.vue';
import Button from '@/Components/Button.vue';
import Input from '@/Components/Input.vue';
import Select from '@/Components/Select.vue';
import Modal from '@/Components/Modal.vue';
import { useToast } from '@/Composables/useToast';

const page = usePage();
const toast = useToast();
const delivery = computed(() => page.props.delivery || null);
const purchaseRequest = computed(() => page.props.purchaseRequest || null);

const isCreateMode = computed(() => !!purchaseRequest.value && !delivery.value);

const form = ref({
    delivery_time: '',
    supplier_id: '',
    supplier_name: '',
    delivery_no: '',
    logistics_company: '',
    tracking_no: '',
    delivery_address: '',
    inspector_name: '',
    remark: '',
    items: [],
});

const errors = ref({});

const showConfirmModal = ref(false);
const confirmItems = ref([]);

const supplierOptions = computed(() => {
    if (purchaseRequest.value?.quotations) {
        return purchaseRequest.value.quotations
            .filter(q => q.supplier)
            .map(q => ({
                value: q.supplier.id,
                label: q.supplier.name,
            }));
    }
    return [];
});

onMounted(() => {
    if (isCreateMode.value && purchaseRequest.value) {
        form.value.delivery_time = new Date().toISOString().slice(0, 16);
        form.value.items = (purchaseRequest.value.items || []).map(item => ({
            supply_id: item.supply_id,
            supply_name: item.supply_name,
            specification: item.specification || '',
            unit: item.unit || '',
            expected_quantity: item.quantity || 0,
            received_quantity: item.quantity || 0,
            unit_price: item.estimated_price || 0,
            batch_no: '',
            remark: '',
        }));

        if (supplierOptions.value.length > 0) {
            form.value.supplier_id = supplierOptions.value[0].value;
            form.value.supplier_name = supplierOptions.value[0].label;
        }
    }
});

const getStatusBadge = (status) => {
    const map = {
        pending: { type: 'warning', text: '待确认' },
        partial: { type: 'info', text: '部分确认' },
        confirmed: { type: 'success', text: '已确认' },
        returned: { type: 'danger', text: '已退货' },
    };
    return map[status] || { type: 'default', text: status };
};

const canConfirm = computed(() => {
    return delivery.value && (delivery.value.status === 'pending' || delivery.value.status === 'partial');
});

const items = computed(() => delivery.value?.items || []);

const totalOrderedQty = computed(() => {
    return items.value.reduce((sum, item) => sum + (item.expected_qty || item.expected_quantity || 0), 0);
});

const totalConfirmedQty = computed(() => {
    return items.value.reduce((sum, item) => sum + (item.confirmed_qty || item.received_quantity || 0), 0);
});

const totalReceivedQty = computed(() => {
    return form.value.items.reduce((sum, item) => sum + (item.received_quantity || 0), 0);
});

const totalAmount = computed(() => {
    return form.value.items.reduce((sum, item) => {
        return sum + (item.received_quantity || 0) * (item.unit_price || 0);
    }, 0).toFixed(2);
});

const onSupplierChange = () => {
    const selected = supplierOptions.value.find(opt => opt.value == form.value.supplier_id);
    if (selected) {
        form.value.supplier_name = selected.label;
    }
};

const confirmDelivery = () => {
    errors.value = {};

    if (!form.value.delivery_time) {
        errors.value.delivery_time = '到货时间不能为空';
        return;
    }
    if (!form.value.supplier_id) {
        errors.value.supplier_id = '供应商不能为空';
        return;
    }
    if (!form.value.supplier_name) {
        errors.value.supplier_name = '供应商名称不能为空';
        return;
    }
    if (form.value.items.length === 0) {
        toast.error('明细不能为空');
        return;
    }

    const hasInvalidItem = form.value.items.some(item => {
        if (!item.supply_id || !item.supply_name) return true;
        if (item.expected_quantity === null || item.expected_quantity === undefined || item.expected_quantity < 0) return true;
        if (item.received_quantity === null || item.received_quantity === undefined || item.received_quantity < 0) return true;
        return false;
    });

    if (hasInvalidItem) {
        toast.error('请完善明细信息');
        return;
    }

    const requestId = isCreateMode.value ? purchaseRequest.value.id : delivery.value.request_id;

    router.post(route('delivery.confirm', requestId), {
        delivery_time: form.value.delivery_time,
        supplier_id: form.value.supplier_id,
        supplier_name: form.value.supplier_name,
        delivery_no: form.value.delivery_no,
        logistics_company: form.value.logistics_company,
        tracking_no: form.value.tracking_no,
        delivery_address: form.value.delivery_address,
        inspector_name: form.value.inspector_name,
        remark: form.value.remark,
        items: form.value.items,
    }, {
        onSuccess: () => {
            toast.success('到货确认成功');
        },
        onError: (err) => {
            errors.value = err || {};
            toast.error('确认失败，请检查表单');
        },
    });
};

const openConfirmModal = () => {
    confirmItems.value = items.value.map(item => ({
        ...item,
        confirmed_qty: item.confirmed_qty || 0,
        batch_number: item.batch_number || '',
        expiry_date: item.expiry_date || '',
        remark: '',
    }));
    showConfirmModal.value = true;
};

const confirmExistingDelivery = () => {
    router.post(route('delivery.confirm', delivery.value.id), {
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
    <Head :title="isCreateMode ? '新建到货确认' : (delivery.code || '到货确认详情')" />

    <AppLayout>
        <div class="py-12">
            <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
                <div class="flex justify-between items-center mb-6">
                    <div>
                        <Link :href="route('delivery.index')" class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                            ← 返回到货确认列表
                        </Link>
                        <div class="flex items-center space-x-3 mt-2">
                            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                                {{ isCreateMode ? '新建到货确认' : delivery.code }}
                            </h1>
                            <Badge v-if="!isCreateMode" :type="getStatusBadge(delivery.status).type">
                                {{ getStatusBadge(delivery.status).text }}
                            </Badge>
                            <Badge v-else type="info">
                                新建
                            </Badge>
                        </div>
                        <div v-if="isCreateMode && purchaseRequest" class="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            采购申请: {{ purchaseRequest.pr_number }} - {{ purchaseRequest.title }}
                        </div>
                    </div>
                    <div class="flex space-x-3">
                        <Button v-if="canConfirm" variant="primary" @click="openConfirmModal">
                            确认到货
                        </Button>
                    </div>
                </div>

                <div v-if="isCreateMode" class="space-y-6">
                    <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <h3 class="text-lg font-medium text-gray-900 dark:text-white">到货信息</h3>
                        </div>
                        <div class="p-6">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        到货时间 <span class="text-red-500">*</span>
                                    </label>
                                    <Input
                                        v-model="form.delivery_time"
                                        type="datetime-local"
                                        :class="{ 'border-red-500': errors.delivery_time }"
                                    />
                                    <p v-if="errors.delivery_time" class="mt-1 text-sm text-red-500">{{ errors.delivery_time }}</p>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        供应商 <span class="text-red-500">*</span>
                                    </label>
                                    <Select
                                        v-model="form.supplier_id"
                                        :options="supplierOptions"
                                        placeholder="请选择供应商"
                                        :class="{ 'border-red-500': errors.supplier_id }"
                                        @change="onSupplierChange"
                                    />
                                    <p v-if="errors.supplier_id" class="mt-1 text-sm text-red-500">{{ errors.supplier_id }}</p>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        送货单号
                                    </label>
                                    <Input
                                        v-model="form.delivery_no"
                                        placeholder="请输入送货单号"
                                    />
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        物流公司
                                    </label>
                                    <Input
                                        v-model="form.logistics_company"
                                        placeholder="请输入物流公司"
                                    />
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        物流单号
                                    </label>
                                    <Input
                                        v-model="form.tracking_no"
                                        placeholder="请输入物流单号"
                                    />
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        验收人
                                    </label>
                                    <Input
                                        v-model="form.inspector_name"
                                        placeholder="请输入验收人姓名"
                                    />
                                </div>
                                <div class="md:col-span-2">
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        到货地址
                                    </label>
                                    <Input
                                        v-model="form.delivery_address"
                                        placeholder="请输入到货地址"
                                    />
                                </div>
                                <div class="md:col-span-2">
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        备注
                                    </label>
                                    <textarea
                                        v-model="form.remark"
                                        rows="3"
                                        placeholder="请输入备注信息"
                                        class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    ></textarea>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <div class="flex justify-between items-center">
                                <h3 class="text-lg font-medium text-gray-900 dark:text-white">到货明细</h3>
                                <div class="text-sm text-gray-500 dark:text-gray-400">
                                    合计: <span class="font-semibold text-gray-900 dark:text-white">{{ totalReceivedQty }}</span> 件
                                    金额: <span class="font-semibold text-gray-900 dark:text-white">¥{{ totalAmount }}</span>
                                </div>
                            </div>
                        </div>
                        <div class="overflow-x-auto">
                            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead class="bg-gray-50 dark:bg-gray-800">
                                    <tr>
                                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">耗材名称</th>
                                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">规格</th>
                                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">单位</th>
                                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">应到数量</th>
                                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">实收数量</th>
                                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">单价</th>
                                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">批号</th>
                                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">备注</th>
                                    </tr>
                                </thead>
                                <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    <tr v-for="(item, index) in form.items" :key="index">
                                        <td class="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                            {{ item.supply_name }}
                                        </td>
                                        <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                            {{ item.specification || '-' }}
                                        </td>
                                        <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                            {{ item.unit || '-' }}
                                        </td>
                                        <td class="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                            {{ item.expected_quantity }}
                                        </td>
                                        <td class="px-4 py-3 w-28">
                                            <input
                                                v-model.number="item.received_quantity"
                                                type="number"
                                                min="0"
                                                class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                            />
                                        </td>
                                        <td class="px-4 py-3 w-28">
                                            <input
                                                v-model.number="item.unit_price"
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                            />
                                        </td>
                                        <td class="px-4 py-3">
                                            <input
                                                v-model="item.batch_no"
                                                type="text"
                                                placeholder="批号"
                                                class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                            />
                                        </td>
                                        <td class="px-4 py-3">
                                            <input
                                                v-model="item.remark"
                                                type="text"
                                                placeholder="备注"
                                                class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                            />
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div class="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-700">
                            <div class="flex justify-end space-x-3">
                                <Button variant="secondary" :href="route('delivery.index')">取消</Button>
                                <Button variant="primary" @click="confirmDelivery">确认到货</Button>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div class="lg:col-span-2 space-y-6">
                        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                            <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                <h3 class="text-lg font-medium text-gray-900 dark:text-white">到货单信息</h3>
                            </div>
                            <div class="p-6">
                                <dl class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">到货单号</dt>
                                        <dd class="mt-1 text-sm font-medium text-gray-900 dark:text-white">{{ delivery.code }}</dd>
                                    </div>
                                    <div>
                                        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">关联采购申请</dt>
                                        <dd class="mt-1 text-sm">
                                            <Link
                                                :href="delivery.purchase_request_link || '#'"
                                                class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                            >
                                                {{ delivery.purchase_request_code }}
                                            </Link>
                                        </dd>
                                    </div>
                                    <div>
                                        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">供应商</dt>
                                        <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ delivery.supplier_name }}</dd>
                                    </div>
                                    <div>
                                        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">到货日期</dt>
                                        <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ delivery.delivery_date }}</dd>
                                    </div>
                                    <div>
                                        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">运输方式</dt>
                                        <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ delivery.shipping_method || '-' }}</dd>
                                    </div>
                                    <div>
                                        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">运单号</dt>
                                        <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ delivery.tracking_number || '-' }}</dd>
                                    </div>
                                    <div>
                                        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">收货人</dt>
                                        <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ delivery.receiver_name || '-' }}</dd>
                                    </div>
                                    <div>
                                        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">创建时间</dt>
                                        <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ delivery.created_at }}</dd>
                                    </div>
                                </dl>
                                <div v-if="delivery.remark" class="mt-4">
                                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">备注</dt>
                                    <dd class="mt-1 text-sm text-gray-900 dark:text-white whitespace-pre-line">{{ delivery.remark }}</dd>
                                </div>
                            </div>
                        </div>

                        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                            <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                <div class="flex justify-between items-center">
                                    <h3 class="text-lg font-medium text-gray-900 dark:text-white">到货明细</h3>
                                    <div class="text-sm text-gray-500 dark:text-gray-400">
                                        已确认 <span class="font-semibold text-green-600 dark:text-green-400">{{ totalConfirmedQty }}</span>
                                        / 订购 <span class="font-semibold text-gray-900 dark:text-white">{{ totalOrderedQty }}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="overflow-x-auto">
                                <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead class="bg-gray-50 dark:bg-gray-800">
                                        <tr>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">耗材</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">规格</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">订购数量</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">已确认数量</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">批号</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">有效期</th>
                                        </tr>
                                    </thead>
                                    <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        <tr v-for="(item, index) in items" :key="index">
                                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{{ item.supply_name }}</td>
                                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{{ item.specification }}</td>
                                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{{ item.expected_qty || item.expected_quantity }}</td>
                                            <td class="px-6 py-4 whitespace-nowrap">
                                                <span :class="[
                                                    'font-medium',
                                                    (item.confirmed_qty || item.received_quantity || 0) < (item.expected_qty || item.expected_quantity || 0)
                                                        ? 'text-yellow-600 dark:text-yellow-400'
                                                        : 'text-green-600 dark:text-green-400'
                                                ]">
                                                    {{ item.confirmed_qty || item.received_quantity || 0 }}
                                                </span>
                                            </td>
                                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{{ item.batch_no || item.batch_number || '-' }}</td>
                                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{{ item.expiry_date || '-' }}</td>
                                        </tr>
                                    </tbody>
                                    <tfoot class="bg-gray-50 dark:bg-gray-800">
                                        <tr>
                                            <td colspan="2" class="px-6 py-4 text-right text-sm font-medium text-gray-900 dark:text-white">合计</td>
                                            <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">{{ totalOrderedQty }}</td>
                                            <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold" :class="totalConfirmedQty < totalOrderedQty ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'">
                                                {{ totalConfirmedQty }}
                                            </td>
                                            <td colspan="2"></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div class="space-y-6">
                        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                            <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                <h3 class="text-lg font-medium text-gray-900 dark:text-white">确认进度</h3>
                            </div>
                            <div class="p-6">
                                <div class="space-y-4">
                                    <div class="flex justify-between text-sm">
                                        <span class="text-gray-500 dark:text-gray-400">完成进度</span>
                                        <span class="font-medium text-gray-900 dark:text-white">
                                            {{ totalOrderedQty > 0 ? Math.round((totalConfirmedQty / totalOrderedQty) * 100) : 0 }}%
                                        </span>
                                    </div>
                                    <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                        <div
                                            class="h-2.5 rounded-full transition-all"
                                            :class="totalConfirmedQty < totalOrderedQty ? 'bg-yellow-500' : 'bg-green-500'"
                                            :style="{ width: (totalOrderedQty > 0 ? (totalConfirmedQty / totalOrderedQty) * 100 : 0) + '%' }"
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div v-if="delivery.confirm_history && delivery.confirm_history.length > 0" class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                            <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                <h3 class="text-lg font-medium text-gray-900 dark:text-white">确认历史</h3>
                            </div>
                            <div class="p-6">
                                <div class="space-y-4">
                                    <div v-for="(record, index) in delivery.confirm_history" :key="index" class="relative">
                                        <div v-if="index < delivery.confirm_history.length - 1" class="absolute left-3 top-8 h-full w-0.5 bg-gray-200 dark:bg-gray-700"></div>
                                        <div class="flex items-start">
                                            <div class="flex items-center justify-center w-6 h-6 rounded-full bg-green-500 flex-shrink-0">
                                                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                            <div class="ml-4 flex-1">
                                                <p class="text-sm font-medium text-gray-900 dark:text-white">{{ record.user_name }}</p>
                                                <p class="text-sm text-gray-500 dark:text-gray-400">确认数量: {{ record.quantity }}</p>
                                                <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">{{ record.created_at }}</p>
                                                <p v-if="record.remark" class="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                                    备注: {{ record.remark }}
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
            v-if="!isCreateMode"
            v-model:show="showConfirmModal"
            title="确认到货"
            size="xl"
        >
            <div class="space-y-4">
                <div class="grid grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                        <p class="text-sm text-gray-500 dark:text-gray-400">到货单号</p>
                        <p class="font-medium text-gray-900 dark:text-white">{{ delivery.code }}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500 dark:text-gray-400">供应商</p>
                        <p class="font-medium text-gray-900 dark:text-white">{{ delivery.supplier_name }}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500 dark:text-gray-400">到货日期</p>
                        <p class="font-medium text-gray-900 dark:text-white">{{ delivery.delivery_date }}</p>
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
                                    <td class="px-4 py-3 text-sm text-gray-900 dark:text-white">{{ item.expected_qty || item.expected_quantity }}</td>
                                    <td class="px-4 py-3 w-28">
                                        <input
                                            v-model.number="item.confirmed_qty"
                                            type="number"
                                            min="0"
                                            :max="item.expected_qty || item.expected_quantity"
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
                    <Button variant="primary" @click="confirmExistingDelivery">确认到货</Button>
                </div>
            </template>
        </Modal>
    </AppLayout>
</template>
