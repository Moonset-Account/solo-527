<script setup>
import { ref } from 'vue'
import { useForm } from '@inertiajs/vue3'

const form = useForm({
    email: '',
    password: '',
    remember: false,
})

const submit = () => {
    form.post(route('login.authenticate'))
}
</script>

<template>
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div class="max-w-md w-full space-y-8">
            <div>
                <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    服务器告警值班响应系统
                </h2>
                <p class="mt-2 text-center text-sm text-gray-600">
                    请登录您的账号
                </p>
            </div>
            <form @submit.prevent="submit" class="mt-8 space-y-6">
                <div class="rounded-md shadow-sm -space-y-px">
                    <div>
                        <label class="sr-only">邮箱地址</label>
                        <input
                            v-model="form.email"
                            type="email"
                            required
                            class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                            placeholder="邮箱地址"
                        />
                    </div>
                    <div>
                        <label class="sr-only">密码</label>
                        <input
                            v-model="form.password"
                            type="password"
                            required
                            class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                            placeholder="密码"
                        />
                    </div>
                </div>

                <div class="flex items-center justify-between">
                    <div class="flex items-center">
                        <input
                            v-model="form.remember"
                            type="checkbox"
                            class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label class="ml-2 block text-sm text-gray-900">
                            记住我
                        </label>
                    </div>
                </div>

                <div v-if="form.errors.email || form.errors.password" class="text-sm text-red-600">
                    {{ form.errors.email || form.errors.password }}
                </div>

                <div>
                    <button
                        type="submit"
                        :disabled="form.processing"
                        class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                        <span v-if="form.processing">登录中...</span>
                        <span v-else>登录</span>
                    </button>
                </div>
            </form>
        </div>
    </div>
</template>
