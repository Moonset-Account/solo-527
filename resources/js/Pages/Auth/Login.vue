<script setup>
import { Head, useForm, Link } from '@inertiajs/vue3';
import AuthLayout from '@/Layouts/AuthLayout.vue';
import Input from '@/Components/Input.vue';
import Button from '@/Components/Button.vue';
import { useToast } from '@/Composables/useToast';

const toast = useToast();

const form = useForm({
    email: '',
    password: '',
    remember: false,
});

const submit = () => {
    form.post(route('login'), {
        onSuccess: () => {
            toast.success('登录成功');
        },
        onError: () => {
            toast.error('登录失败，请检查邮箱和密码');
        },
    });
};
</script>

<template>
    <Head title="登录" />

    <AuthLayout>
        <form @submit.prevent="submit">
            <div class="space-y-6">
                <div>
                    <Input
                        v-model="form.email"
                        type="email"
                        label="邮箱"
                        placeholder="请输入邮箱"
                        :error="form.errors.email"
                        required
                    />
                </div>

                <div>
                    <Input
                        v-model="form.password"
                        type="password"
                        label="密码"
                        placeholder="请输入密码"
                        :error="form.errors.password"
                        required
                    />
                </div>

                <div class="flex items-center justify-between">
                    <label class="flex items-center">
                        <input
                            v-model="form.remember"
                            type="checkbox"
                            class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                        />
                        <span class="ml-2 text-sm text-gray-600 dark:text-gray-400">记住我</span>
                    </label>

                    <Link
                        :href="route('password.request')"
                        class="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 underline"
                    >
                        忘记密码？
                    </Link>
                </div>

                <div>
                    <Button
                        type="submit"
                        variant="primary"
                        class="w-full justify-center"
                        :loading="form.processing"
                    >
                        登录
                    </Button>
                </div>
            </div>
        </form>
    </AuthLayout>
</template>
