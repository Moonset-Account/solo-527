<script setup>
import { Head, useForm, usePage, router } from '@inertiajs/vue3';
import AppLayout from '@/Layouts/AppLayout.vue';
import { computed } from 'vue';
import Input from '@/Components/Input.vue';
import Select from '@/Components/Select.vue';
import Button from '@/Components/Button.vue';
import DatePicker from '@/Components/DatePicker.vue';
import { useToast } from '@/Composables/useToast';

const page = usePage();
const toast = useToast();

const purchaseRequests = computed(() => page.props.purchaseRequests || []);
const suppliers = computed(() => page.props.suppliers || []);
const supplies = computed(() => page.props.supplies || []);

const purchaseRequestOptions = computed(() => {
    return purchaseRequests.value.map(pr => ({
        value: pr.id,
        label: `${pr.code} - ${pr.title}`,
    }));
});

const supplierOptions = computed(() => {
    return suppliers.value.map(s => ({
        value: s.id,
        label: s.name,
    }));
});

const supplyOptions = computed(() => {
    return supplies.value.map(s => ({
        value: s.id,
        label: `${s.code} - ${s.name}`,
    }));
});

const form = useForm({
    purchase_request_id: '',
    supplier_id: '',
    quotation_date: '',
    valid_from: '',
    valid_until: '',
    items: [
        { supply_id: '', quantity: 1, unit_price: 0, remarks: '' },
    ],
});

const totalAmount = computed(() => {
    return form.data.items.reduce((sum, item) => {
        return sum + (item.quantity || 0) * (item.unit_price || 0);
    }, 0);
});

const addItem = () => {
    form.data.items.push({
        supply_id: '',
        quantity: 1,
        unit_price: 0,
        remarks: '',
    });
};

const removeItem = (index) => {
    if (form.data.items.length > 1) {
        form.data.items.splice(index, 1);
    }
};

const onSupplyChange = (index, supplyId) => {
    const supply = supplies.value.find(s => s.id === supplyId);
    if (supply) {
        form.data.items[index].unit_price = supply.last_price || 0;
    }
};

const onPurchaseRequestChange = (prId) => {
    const pr = purchaseRequests.value.find(p => p.id === prId);
    if (pr && pr.items && pr.items.length > 0) {
        form.data.items = pr.items.map(item => ({
            supply_id: item.supply_id || '',
            quantity: item.quantity || 1,
            unit_price: item.unit_price || 0,
            remarks: '',
        }));
    }
};

const submit = () => {
    form.post(route('quotations.store'), {
        onSuccess: () => {
            toast.success('报价单创建成功');
            router.visit(route('quotations.index'));
        },
        onError: () => {
            toast.error('创建失败，请检查表单');
        },
    });
};
</script>

<template>
    <Head title="创建报价单" />

    <AppLayout>
        <div class="py-12">
            <div class="max-w-6xl mx-auto sm:px-6 lg:px-8">
                <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                    <div class="p-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                        <div class="flex items-center justify-between mb-6">
                            <div>
                                <router-link :href="route('quotations.index')" class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                                    ← 返回列表
                                </router-link>
                                <h1 class="text-2xl font-bold text-gray-900 dark:text-white mt-2">创建报价单</h1>
                            </div>
                        </div>

                        <form @submit.prevent="submit" class="space-y-6">
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <Select
                                    v-model="form.data.purchase_request_id"
                                    label="关联采购申请"
                                    :options="purchaseRequestOptions"
                                    placeholder="请选择采购申请"
                                    :error="form.errors.purchase_request_id"
                                    @change="onPurchaseRequestChange(form.data.purchase_request_id)"
                                />
                                <Select
                                    v-model="form.data.supplier_id"
                                    label="供应商"
                                    :options="supplierOptions"
                                    :error="form.errors.supplier_id"
                                    required
                                />
                                <DatePicker
                                    v-model="form.data.quotation_date"
                                    label="报价日期"
                                    :error="form.errors.quotation_date"
                                    required
                                />
                                <div></div>
                                <DatePicker
                                    v-model="form.data.valid_from"
                                    label="有效期开始"
                                    :error="form.errors.valid_from"
                                    required
                                />
                                <DatePicker
                                    v-model="form.data.valid_until"
                                    label="有效期结束"
                                    :error="form.errors.valid_until"
                                    required
                                />
                            </div>

                            <div>
                                <div class="flex justify-between items-center mb-4">
                                    <h3 class="text-lg font-medium text-gray-900 dark:text-white">报价明细</h3>
                                    <Button variant="outline" type="button" @click="addItem">
                                        + 添加明细
                                    </Button>
                                </div>

                                <div class="overflow-x-auto">
                                    <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead class="bg-gray-50 dark:bg-gray-800">
                                            <tr>
                                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">耗材</th>
                                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">数量</th>
                                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">单价(元)</th>
                                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">小计(元)</th>
                                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">备注</th>
                                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">操作</th>
                                            </tr>
                                        </thead>
                                        <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                            <tr v-for="(item, index) in form.data.items" :key="index">
                                                <td class="px-4 py-3">
                                                    <select
                                                        v-model="item.supply_id"
                                                        @change="onSupplyChange(index, item.supply_id)"
                                                        class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                    >
                                                        <option value="">请选择耗材</option>
                                                        <option v-for="supply in supplyOptions" :key="supply.value" :value="supply.value">
                                                            {{ supply.label }}
                                                        </option>
                                                    </select>
                                                    <p v-if="form.errors[`items.${index}.supply_id`]" class="mt-1 text-sm text-red-600 dark:text-red-400">
                                                        {{ form.errors[`items.${index}.supply_id`] }}
                                                    </p>
                                                </td>
                                                <td class="px-4 py-3 w-28">
                                                    <input
                                                        v-model.number="item.quantity"
                                                        type="number"
                                                        min="1"
                                                        class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                    />
                                                    <p v-if="form.errors[`items.${index}.quantity`]" class="mt-1 text-sm text-red-600 dark:text-red-400">
                                                        {{ form.errors[`items.${index}.quantity`] }}
                                                    </p>
                                                </td>
                                                <td class="px-4 py-3 w-36">
                                                    <input
                                                        v-model.number="item.unit_price"
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                    />
                                                    <p v-if="form.errors[`items.${index}.unit_price`]" class="mt-1 text-sm text-red-600 dark:text-red-400">
                                                        {{ form.errors[`items.${index}.unit_price`] }}
                                                    </p>
                                                </td>
                                                <td class="px-4 py-3 w-36 font-medium text-gray-900 dark:text-white">
                                                    ¥{{ (item.quantity * item.unit_price).toLocaleString() }}
                                                </td>
                                                <td class="px-4 py-3">
                                                    <input
                                                        v-model="item.remarks"
                                                        type="text"
                                                        class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                        placeholder="备注"
                                                    />
                                                </td>
                                                <td class="px-4 py-3">
                                                    <button
                                                        v-if="form.data.items.length > 1"
                                                        type="button"
                                                        class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                        @click="removeItem(index)"
                                                    >
                                                        删除
                                                    </button>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                <div class="mt-4 flex justify-end">
                                    <div class="text-right">
                                        <p class="text-sm text-gray-500 dark:text-gray-400">报价总金额</p>
                                        <p class="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                                            ¥{{ totalAmount.toLocaleString() }}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div class="flex justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <Button variant="secondary" type="button" @click="router.visit(route('quotations.index'))">
                                    取消
                                </Button>
                                <Button variant="primary" type="submit" :loading="form.processing">
                                    保存
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </AppLayout>
</template>
