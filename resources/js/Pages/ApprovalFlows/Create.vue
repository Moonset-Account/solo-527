<script setup>
import { Head, useForm, usePage, router } from '@inertiajs/vue3';
import AppLayout from '@/Layouts/AppLayout.vue';
import { computed } from 'vue';
import Input from '@/Components/Input.vue';
import Select from '@/Components/Select.vue';
import Button from '@/Components/Button.vue';
import { useToast } from '@/Composables/useToast';

const page = usePage();
const toast = useToast();

const entityTypeOptions = [
    { value: 'purchase_request', label: '采购申请' },
    { value: 'quotation', label: '报价单' },
    { value: 'payment', label: '付款申请' },
    { value: 'delivery', label: '到货确认' },
];

const departments = computed(() => page.props.departments || []);
const roles = computed(() => page.props.roles || []);
const users = computed(() => page.props.users || []);

const departmentOptions = computed(() => {
    return departments.value.map(d => ({
        value: d.id,
        label: d.name,
    }));
});

const roleOptions = computed(() => {
    return roles.value.map(r => ({
        value: r.id,
        label: r.name,
    }));
});

const userOptions = computed(() => {
    return users.value.map(u => ({
        value: u.id,
        label: u.name,
    }));
});

const form = useForm({
    name: '',
    entity_type: '',
    min_amount: '',
    max_amount: '',
    department_id: '',
    steps: [
        {
            name: '',
            type: 'role',
            role_id: '',
            user_id: '',
            order: 1,
            can_delegate: false,
            timeout_hours: 24,
        },
    ],
});

const addStep = () => {
    const nextOrder = form.data.steps.length + 1;
    form.data.steps.push({
        name: '',
        type: 'role',
        role_id: '',
        user_id: '',
        order: nextOrder,
        can_delegate: false,
        timeout_hours: 24,
    });
};

const removeStep = (index) => {
    if (form.data.steps.length > 1) {
        form.data.steps.splice(index, 1);
        form.data.steps.forEach((step, i) => {
            step.order = i + 1;
        });
    }
};

const submit = () => {
    form.post(route('approval-flows.store'), {
        onSuccess: () => {
            toast.success('审批流程创建成功');
            router.visit(route('approval-flows.index'));
        },
        onError: () => {
            toast.error('创建失败，请检查表单');
        },
    });
};
</script>

<template>
    <Head title="创建审批流程" />

    <AppLayout>
        <div class="py-12">
            <div class="max-w-5xl mx-auto sm:px-6 lg:px-8">
                <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                    <div class="p-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                        <div class="flex items-center justify-between mb-6">
                            <div>
                                <router-link :href="route('approval-flows.index')" class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                                    ← 返回列表
                                </router-link>
                                <h1 class="text-2xl font-bold text-gray-900 dark:text-white mt-2">创建审批流程</h1>
                            </div>
                        </div>

                        <form @submit.prevent="submit" class="space-y-6">
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <Input
                                    v-model="form.data.name"
                                    label="流程名称"
                                    placeholder="请输入流程名称"
                                    :error="form.errors.name"
                                    required
                                />
                                <Select
                                    v-model="form.data.entity_type"
                                    label="适用类型"
                                    :options="entityTypeOptions"
                                    :error="form.errors.entity_type"
                                    required
                                />
                                <Select
                                    v-model="form.data.department_id"
                                    label="适用部门"
                                    :options="departmentOptions"
                                    placeholder="全部部门"
                                    :error="form.errors.department_id"
                                />
                                <Input
                                    v-model.number="form.data.min_amount"
                                    type="number"
                                    label="最小金额(元)"
                                    placeholder="0"
                                    :error="form.errors.min_amount"
                                />
                                <Input
                                    v-model.number="form.data.max_amount"
                                    type="number"
                                    label="最大金额(元)"
                                    placeholder="不限请留空"
                                    :error="form.errors.max_amount"
                                />
                            </div>

                            <div>
                                <div class="flex justify-between items-center mb-4">
                                    <h3 class="text-lg font-medium text-gray-900 dark:text-white">审批步骤</h3>
                                    <Button variant="outline" type="button" @click="addStep">
                                        + 添加步骤
                                    </Button>
                                </div>

                                <div class="space-y-4">
                                    <div
                                        v-for="(step, index) in form.data.steps"
                                        :key="index"
                                        class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                                    >
                                        <div class="flex items-center justify-between mb-4">
                                            <div class="flex items-center space-x-2">
                                                <span class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-sm">
                                                    {{ step.order }}
                                                </span>
                                                <span class="font-medium text-gray-900 dark:text-white">第 {{ step.order }} 步</span>
                                            </div>
                                            <button
                                                v-if="form.data.steps.length > 1"
                                                type="button"
                                                class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                @click="removeStep(index)"
                                            >
                                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>

                                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                            <Input
                                                v-model="step.name"
                                                label="步骤名称"
                                                placeholder="如：部门经理审批"
                                                :error="form.errors[`steps.${index}.name`]"
                                            />
                                            <div>
                                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    审批人类型
                                                </label>
                                                <select
                                                    v-model="step.type"
                                                    class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                >
                                                    <option value="role">按角色</option>
                                                    <option value="user">指定人员</option>
                                                </select>
                                            </div>
                                            <Select
                                                v-if="step.type === 'role'"
                                                v-model="step.role_id"
                                                label="审批角色"
                                                :options="roleOptions"
                                                :error="form.errors[`steps.${index}.role_id`]"
                                            />
                                            <Select
                                                v-else
                                                v-model="step.user_id"
                                                label="指定审批人"
                                                :options="userOptions"
                                                :error="form.errors[`steps.${index}.user_id`]"
                                            />
                                            <Input
                                                v-model.number="step.timeout_hours"
                                                type="number"
                                                label="超时时间(小时)"
                                                :error="form.errors[`steps.${index}.timeout_hours`]"
                                            />
                                        </div>

                                        <div class="mt-4">
                                            <label class="flex items-center text-sm text-gray-700 dark:text-gray-300">
                                                <input
                                                    v-model="step.can_delegate"
                                                    type="checkbox"
                                                    class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                                />
                                                <span class="ml-2">允许委派审批</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="flex justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <Button variant="secondary" type="button" @click="router.visit(route('approval-flows.index'))">
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
