<script setup>
import { Head, useForm, usePage, router } from '@inertiajs/vue3';
import AppLayout from '@/Layouts/AppLayout.vue';
import { computed, ref } from 'vue';
import Input from '@/Components/Input.vue';
import Select from '@/Components/Select.vue';
import Button from '@/Components/Button.vue';
import DatePicker from '@/Components/DatePicker.vue';
import { useToast } from '@/Composables/useToast';

const page = usePage();
const toast = useToast();
const supplies = computed(() => page.props.supplies || []);

const form = useForm({
    title: '',
    department: '',
    purpose: '',
    expected_date: '',
    priority: 'normal',
    remarks: '',
    items: [
        { supply_id: '', quantity: 1, unit_price: 0, specification: '', remarks: '' },
    ],
});

const priorityOptions = [
    { value: 'low', label: '低' },
    { value: 'normal', label: '普通' },
    { value: 'high', label: '紧急' },
    { value: 'urgent', label: '特急' },
];

const supplyOptions = computed(() => {
    return supplies.value.map(s => ({
        value: s.id,
        label: `${s.code} - ${s.name}`,
    }));
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
        specification: '',
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
        form.data.items[index].specification = supply.specification || '';
        form.data.items[index].unit_price = supply.last_price || 0;
    }
};

const submit = (status = 'pending') => {
    form.data.status = status;
    form.post(route('purchase-requests.store'), {
        onSuccess: () => {
            toast.success(status === 'pending' ? '采购申请已提交' : '已保存为草稿');
        },
        onError: () => {
            toast.error('提交失败，请检查表单');
        },
    });
};
</script>

<template>
    <Head title="新建采购申请" />

    <AppLayout>
        <div class="py-12">
            <div class="max-w-6xl mx-auto sm:px-6 lg:px-8">
                <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                    <div class="p-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                        <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">新建采购申请</h1>

                        <form class="space-y-6">
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <Input
                                    v-model="form.data.title"
                                    label="申请标题"
                                    placeholder="请输入申请标题"
                                    :error="form.errors.title"
                                    required
                                />
                                <Input
                                    v-model="form.data.department"
                                    label="申请部门"
                                    placeholder="请输入部门"
                                    :error="form.errors.department"
                                    required
                                />
                                <Select
                                    v-model="form.data.priority"
                                    label="优先级"
                                    :options="priorityOptions"
                                    :error="form.errors.priority"
                                />
                                <DatePicker
                                    v-model="form.data.expected_date"
                                    label="期望到货日期"
                                    :error="form.errors.expected_date"
                                />
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    采购用途
                                </label>
                                <textarea
                                    v-model="form.data.purpose"
                                    rows="3"
                                    class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    placeholder="请描述采购用途..."
                                ></textarea>
                                <p v-if="form.errors.purpose" class="mt-1 text-sm text-red-600 dark:text-red-400">
                                    {{ form.errors.purpose }}
                                </p>
                            </div>

                            <div>
                                <div class="flex justify-between items-center mb-4">
                                    <h3 class="text-lg font-medium text-gray-900 dark:text-white">采购明细</h3>
                                    <Button variant="outline" type="button" @click="addItem">
                                        + 添加明细
                                    </Button>
                                </div>

                                <div class="overflow-x-auto">
                                    <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead class="bg-gray-50 dark:bg-gray-800">
                                            <tr>
                                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">耗材</th>
                                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">规格型号</th>
                                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">数量</th>
                                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">单价</th>
                                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">小计</th>
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
                                                </td>
                                                <td class="px-4 py-3">
                                                    <input
                                                        v-model="item.specification"
                                                        type="text"
                                                        class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                        placeholder="规格型号"
                                                    />
                                                </td>
                                                <td class="px-4 py-3 w-24">
                                                    <input
                                                        v-model.number="item.quantity"
                                                        type="number"
                                                        min="1"
                                                        class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                    />
                                                </td>
                                                <td class="px-4 py-3 w-32">
                                                    <input
                                                        v-model.number="item.unit_price"
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                    />
                                                </td>
                                                <td class="px-4 py-3 w-32 font-medium text-gray-900 dark:text-white">
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
                                        <p class="text-sm text-gray-500 dark:text-gray-400">预估总金额</p>
                                        <p class="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                                            ¥{{ totalAmount.toLocaleString() }}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    备注说明
                                </label>
                                <textarea
                                    v-model="form.data.remarks"
                                    rows="2"
                                    class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    placeholder="其他备注说明..."
                                ></textarea>
                            </div>

                            <div class="flex justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <Button variant="secondary" type="button" @click="router.visit(route('purchase-requests.index'))">
                                    取消
                                </Button>
                                <Button variant="secondary" type="button" :loading="form.processing" @click="submit('draft')">
                                    保存草稿
                                </Button>
                                <Button variant="primary" type="button" :loading="form.processing" @click="submit('pending')">
                                    提交审批
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </AppLayout>
</template>
