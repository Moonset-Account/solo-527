<script setup>
import { Head, Link, useForm, usePage } from '@inertiajs/vue3';
import AppLayout from '@/Layouts/AppLayout.vue';
import { computed } from 'vue';
import Input from '@/Components/Input.vue';
import Button from '@/Components/Button.vue';
import Select from '@/Components/Select.vue';

const page = usePage();
const supplier = computed(() => page.props.supplier || {});

const form = useForm({
    name: supplier.value.name || '',
    contact_person: supplier.value.contact_person || '',
    phone: supplier.value.phone || '',
    email: supplier.value.email || '',
    address: supplier.value.address || '',
    tax_id: supplier.value.tax_id || '',
    bank_account: supplier.value.bank_account || '',
    credit_limit: supplier.value.credit_limit || '',
    is_active: supplier.value.is_active ?? true,
});

const isActiveOptions = [
    { value: true, label: '启用' },
    { value: false, label: '禁用' },
];

const submit = () => {
    form.put(route('suppliers.update', supplier.value.id), {
        preserveScroll: true,
    });
};
</script>

<template>
    <Head :title="`编辑 - ${supplier.name}`" />

    <AppLayout>
        <div class="py-12">
            <div class="max-w-4xl mx-auto sm:px-6 lg:px-8">
                <div class="flex justify-between items-center mb-6">
                    <div>
                        <Link :href="route('suppliers.show', supplier.id)" class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                            ← 返回供应商详情
                        </Link>
                        <h1 class="text-2xl font-bold text-gray-900 dark:text-white mt-2">编辑供应商</h1>
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                    <div class="p-6">
                        <form @submit.prevent="submit" class="space-y-6">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div class="md:col-span-2">
                                    <Input
                                        v-model="form.name"
                                        label="供应商名称"
                                        :error="form.errors.name"
                                        :required="true"
                                    />
                                </div>

                                <Input
                                    v-model="form.contact_person"
                                    label="联系人"
                                    :error="form.errors.contact_person"
                                    :required="true"
                                />

                                <Input
                                    v-model="form.phone"
                                    label="联系电话"
                                    :error="form.errors.phone"
                                    :required="true"
                                />

                                <Input
                                    v-model="form.email"
                                    type="email"
                                    label="电子邮箱"
                                    :error="form.errors.email"
                                />

                                <Input
                                    v-model="form.tax_id"
                                    label="税务登记号"
                                    :error="form.errors.tax_id"
                                />

                                <div class="md:col-span-2">
                                    <Input
                                        v-model="form.address"
                                        label="注册地址"
                                        :error="form.errors.address"
                                    />
                                </div>

                                <Input
                                    v-model="form.bank_account"
                                    label="银行账户"
                                    :error="form.errors.bank_account"
                                />

                                <Input
                                    v-model="form.credit_limit"
                                    type="number"
                                    label="信用额度"
                                    :error="form.errors.credit_limit"
                                />

                                <Select
                                    v-model="form.is_active"
                                    label="状态"
                                    :options="isActiveOptions"
                                    :error="form.errors.is_active"
                                />
                            </div>

                            <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <Link :href="route('suppliers.show', supplier.id)">
                                    <Button variant="secondary" type="button">取消</Button>
                                </Link>
                                <Button variant="primary" type="submit" :loading="form.processing">
                                    保存修改
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </AppLayout>
</template>
