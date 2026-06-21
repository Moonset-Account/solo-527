<script setup>
import { useForm } from '@inertiajs/vue3'
import { computed } from 'vue'

const form = useForm({
    email: 'admin@summit.local',
    password: 'password',
    remember: true,
})

const canSubmit = computed(() => !form.processing && form.email && form.password)
</script>

<template>
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div class="w-full max-w-md">
            <div class="text-center mb-8">
                <div class="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg">
                    <i class="fas fa-chart-line text-white text-2xl"></i>
                </div>
                <h1 class="text-2xl font-bold text-gray-900">行业峰会复盘看板</h1>
                <p class="text-gray-500 mt-2 text-sm">Summit Review Dashboard</p>
            </div>

            <div class="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                <h2 class="text-lg font-semibold text-gray-900 mb-6">登录您的账户</h2>

                <form @submit.prevent="form.post(route('login'))" class="space-y-5">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">邮箱地址</label>
                        <input
                            v-model="form.email"
                            type="email"
                            placeholder="name@company.com"
                            class="input-field py-3 px-4"
                        />
                        <div v-if="form.errors.email" class="mt-1 text-xs text-red-600">{{ form.errors.email }}</div>
                    </div>

                    <div>
                        <div class="flex items-center justify-between mb-2">
                            <label class="block text-sm font-medium text-gray-700">密码</label>
                        </div>
                        <input
                            v-model="form.password"
                            type="password"
                            placeholder="请输入密码"
                            class="input-field py-3 px-4"
                        />
                        <div v-if="form.errors.password" class="mt-1 text-xs text-red-600">{{ form.errors.password }}</div>
                    </div>

                    <div class="flex items-center">
                        <label class="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                            <input v-model="form.remember" type="checkbox" class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500">
                            记住我
                        </label>
                    </div>

                    <button
                        type="submit"
                        :disabled="!canSubmit"
                        class="w-full btn-primary py-3 justify-center text-base"
                    >
                        <i v-if="form.processing" class="fas fa-spinner fa-spin mr-2"></i>
                        登 录
                    </button>
                </form>

                <div class="mt-6 pt-6 border-t border-gray-100">
                    <p class="text-xs text-gray-500 mb-3">默认测试账号（所有账号密码均为 <code class="bg-gray-100 px-1 py-0.5 rounded">password</code>）：</p>
                    <div class="grid grid-cols-2 gap-2 text-xs">
                        <div class="bg-gray-50 rounded-md px-3 py-2">
                            <div class="font-medium text-gray-700">系统管理员</div>
                            <div class="text-gray-500 mt-1">admin@summit.local</div>
                        </div>
                        <div class="bg-gray-50 rounded-md px-3 py-2">
                            <div class="font-medium text-gray-700">运营经理</div>
                            <div class="text-gray-500 mt-1">manager@summit.local</div>
                        </div>
                        <div class="bg-gray-50 rounded-md px-3 py-2">
                            <div class="font-medium text-gray-700">票务运营</div>
                            <div class="text-gray-500 mt-1">ticket1@summit.local</div>
                        </div>
                        <div class="bg-gray-50 rounded-md px-3 py-2">
                            <div class="font-medium text-gray-700">报名录入</div>
                            <div class="text-gray-500 mt-1">ticket2@summit.local</div>
                        </div>
                    </div>
                </div>
            </div>

            <p class="text-center text-xs text-gray-400 mt-6">
                © 2026 行业峰会复盘看板 · Summit Review System
            </p>
        </div>
    </div>
</template>
