<script setup>
import { Head, useForm, usePage } from '@inertiajs/vue3';
import AppLayout from '@/Layouts/AppLayout.vue';
import Input from '@/Components/Input.vue';
import Select from '@/Components/Select.vue';
import Button from '@/Components/Button.vue';
import FileUpload from '@/Components/FileUpload.vue';
import { useToast } from '@/Composables/useToast';

const page = usePage();
const toast = useToast();

const categoryOptions = [
    { value: 'laboratory', label: '实验室耗材' },
    { value: 'office', label: '办公用品' },
    { value: 'cleaning', label: '清洁用品' },
    { value: 'medical', label: '医用耗材' },
];

const form = useForm({
    code: '',
    name: '',
    category: '',
    specification: '',
    unit: '',
    safety_stock: 10,
    max_stock: 100,
    description: '',
    spec_attachment: null,
});

const submit = () => {
    form.post(route('supplies.store'), {
        onSuccess: () => {
            toast.success('耗材创建成功');
        },
        onError: () => {
            toast.error('耗材创建失败，请检查表单');
        },
    });
};
</script>

<template>
    <Head title="新增耗材" />

    <AppLayout>
        <div class="py-12">
            <div class="max-w-4xl mx-auto sm:px-6 lg:px-8">
                <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                    <div class="p-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                        <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">新增耗材</h1>

                        <form @submit.prevent="submit" class="space-y-6">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input
                                    v-model="form.data.code"
                                    label="耗材编码"
                                    placeholder="请输入耗材编码"
                                    :error="form.errors.code"
                                    required
                                />

                                <Input
                                    v-model="form.data.name"
                                    label="耗材名称"
                                    placeholder="请输入耗材名称"
                                    :error="form.errors.name"
                                    required
                                />

                                <Select
                                    v-model="form.data.category"
                                    label="耗材分类"
                                    :options="categoryOptions"
                                    :error="form.errors.category"
                                    required
                                />

                                <Input
                                    v-model="form.data.specification"
                                    label="规格型号"
                                    placeholder="请输入规格型号"
                                    :error="form.errors.specification"
                                />

                                <Input
                                    v-model="form.data.unit"
                                    label="单位"
                                    placeholder="例如：个、盒、瓶"
                                    :error="form.errors.unit"
                                    required
                                />

                                <div class="grid grid-cols-2 gap-4">
                                    <Input
                                        v-model="form.data.safety_stock"
                                        type="number"
                                        label="安全库存"
                                        placeholder="安全库存"
                                        :error="form.errors.safety_stock"
                                    />
                                    <Input
                                        v-model="form.data.max_stock"
                                        type="number"
                                        label="最大库存"
                                        placeholder="最大库存"
                                        :error="form.errors.max_stock"
                                    />
                                </div>
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    描述
                                </label>
                                <textarea
                                    v-model="form.data.description"
                                    rows="4"
                                    class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    placeholder="请输入耗材描述..."
                                ></textarea>
                                <p v-if="form.errors.description" class="mt-1 text-sm text-red-600 dark:text-red-400">
                                    {{ form.errors.description }}
                                </p>
                            </div>

                            <div>
                                <FileUpload
                                    v-model="form.data.spec_attachment"
                                    label="规格附件"
                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                                    :error="form.errors.spec_attachment"
                                />
                            </div>

                            <div class="flex justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <Button variant="secondary" type="button" @click="form.reset">
                                    重置
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
