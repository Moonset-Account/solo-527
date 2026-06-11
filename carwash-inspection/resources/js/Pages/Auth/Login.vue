<script setup>
import { useForm, Link } from '@inertiajs/vue3'

const form = useForm({
    email: '',
    password: '',
    remember: false,
})

const submit = () => {
    form.post('/login')
}
</script>

<template>
    <div class="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center px-4 py-12">
        <div class="w-full max-w-md">
            <div class="text-center mb-8">
                <div class="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <svg class="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                    </svg>
                </div>
                <h1 class="text-2xl font-bold text-gray-900">洗车门店管理系统</h1>
                <p class="mt-2 text-gray-600">登录您的账户</p>
            </div>

            <div class="bg-white rounded-2xl shadow-xl p-8">
                <form @submit.prevent="submit" class="space-y-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1.5">邮箱地址</label>
                        <input
                            v-model="form.email"
                            type="email"
                            placeholder="请输入邮箱"
                            class="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                        />
                        <p v-if="form.errors.email" class="mt-1.5 text-sm text-red-600">{{ form.errors.email }}</p>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1.5">密码</label>
                        <input
                            v-model="form.password"
                            type="password"
                            placeholder="请输入密码"
                            class="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                        />
                        <p v-if="form.errors.password" class="mt-1.5 text-sm text-red-600">{{ form.errors.password }}</p>
                    </div>

                    <div class="flex items-center">
                        <input
                            v-model="form.remember"
                            id="remember"
                            type="checkbox"
                            class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label for="remember" class="ml-2 text-sm text-gray-600">记住我</label>
                    </div>

                    <button
                        type="submit"
                        :disabled="form.processing"
                        class="w-full py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md hover:shadow-lg"
                    >
                        <span v-if="form.processing">登录中...</span>
                        <span v-else>登 录</span>
                    </button>
                </form>

                <div class="mt-6 pt-6 border-t border-gray-100">
                    <p class="text-center text-sm text-gray-600">
                        我是车主，
                        <Link href="/booking/create" class="text-blue-600 hover:text-blue-700 font-medium">
                            去预约洗车
                        </Link>
                    </p>
                </div>
            </div>

            <p class="mt-8 text-center text-xs text-gray-500">
                &copy; 2024 洗车门店工单检测系统. 保留所有权利.
            </p>
        </div>
    </div>
</template>
