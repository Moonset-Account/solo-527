<script setup>
import { ref, computed } from 'vue';
import { Head, Link, useForm, usePage } from '@inertiajs/vue3';
import GuestLayout from '@/Layouts/GuestLayout.vue';

const page = usePage();

const form = useForm({
    email: '',
    password: '',
    remember: false,
});

const canResetPassword = computed(() => page.props.canResetPassword || false);
const status = computed(() => page.props.status || null);

const submit = () => {
    form.post(route('login'), {
        onFinish: () => form.reset('password'),
    });
};
</script>

<template>
    <GuestLayout title="登录">
        <Head title="登录" />

        <div class="mb-4 text-sm text-gray-600">
            欢迎使用项目尾款对接中心，请登录您的账号。
        </div>

        <div v-if="status" class="mb-4 font-medium text-sm text-green-600">
            {{ status }}
        </div>

        <form @submit.prevent="submit">
            <div>
                <label for="email" class="block font-medium text-sm text-gray-700">
                    邮箱
                </label>
                <input
                    id="email"
                    type="email"
                    v-model="form.email"
                    class="block mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    placeholder="请输入邮箱地址"
                    autofocus
                    autocomplete="username"
                />
                <div v-if="form.errors.email" class="mt-1 text-sm text-red-600">
                    {{ form.errors.email }}
                </div>
            </div>

            <div class="mt-4">
                <label for="password" class="block font-medium text-sm text-gray-700">
                    密码
                </label>
                <input
                    id="password"
                    type="password"
                    v-model="form.password"
                    class="block mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    placeholder="请输入密码"
                    autocomplete="current-password"
                />
                <div v-if="form.errors.password" class="mt-1 text-sm text-red-600">
                    {{ form.errors.password }}
                </div>
            </div>

            <div class="block mt-4">
                <label for="remember" class="inline-flex items-center">
                    <input
                        id="remember"
                        type="checkbox"
                        v-model="form.remember"
                        class="rounded border-gray-300 text-primary-600 shadow-sm focus:ring-primary-500"
                    />
                    <span class="ml-2 text-sm text-gray-600">记住我</span>
                </label>
            </div>

            <div class="flex items-center justify-end mt-4">
                <Link
                    v-if="canResetPassword"
                    :href="route('password.request')"
                    class="underline text-sm text-gray-600 hover:text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                    忘记密码？
                </Link>

                <button
                    type="submit"
                    :disabled="form.processing"
                    class="ml-4 inline-flex items-center px-4 py-2 bg-primary-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-primary-700 focus:bg-primary-700 active:bg-primary-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition ease-in-out duration-150 disabled:opacity-50"
                >
                    <svg
                        v-if="form.processing"
                        class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    登录
                </button>
            </div>
        </form>

        <div class="mt-6 pt-6 border-t border-gray-200">
            <div class="text-sm text-gray-500 mb-3">
                演示账号（点击快速登录）：
            </div>
            <div class="space-y-2">
                <button
                    type="button"
                    @click="form.email = 'admin@example.com'; form.password = 'password'; submit()"
                    class="w-full text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-md text-sm text-gray-700 flex items-center justify-between transition-colors"
                >
                    <span>管理员账号</span>
                    <span class="text-gray-400">admin@example.com</span>
                </button>
                <button
                    type="button"
                    @click="form.email = 'operator@example.com'; form.password = 'password'; submit()"
                    class="w-full text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-md text-sm text-gray-700 flex items-center justify-between transition-colors"
                >
                    <span>操作员账号</span>
                    <span class="text-gray-400">operator@example.com</span>
                </button>
                <button
                    type="button"
                    @click="form.email = 'finance@example.com'; form.password = 'password'; submit()"
                    class="w-full text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-md text-sm text-gray-700 flex items-center justify-between transition-colors"
                >
                    <span>财务账号</span>
                    <span class="text-gray-400">finance@example.com</span>
                </button>
            </div>
            <div class="mt-3 text-xs text-gray-400">
                所有演示账号密码均为：password
            </div>
        </div>
    </GuestLayout>
</template>
