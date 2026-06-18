<script setup>
import { useForm, usePage } from '@inertiajs/vue3'
import { ref } from 'vue'
import { EyeIcon, EyeSlashIcon } from '@heroicons/vue/24/outline'
import Input from '../../Components/Input.vue'
import Button from '../../Components/Button.vue'

const page = usePage()
const showPassword = ref(false)

const form = useForm({
    email: '',
    password: '',
    remember: false,
})

const togglePassword = () => {
    showPassword.value = !showPassword.value
}

const submit = () => {
    form.post(route('login'), {
        onFinish: () => form.reset('password'),
    })
}
</script>

<template>
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 py-12 px-4 sm:px-6 lg:px-8">
        <div class="max-w-md w-full space-y-8">
            <div class="text-center">
                <h1 class="text-3xl font-bold text-gray-900">农事溯源台</h1>
                <p class="mt-2 text-sm text-gray-600">智慧农业 · 全程可追溯</p>
            </div>

            <div class="bg-white py-8 px-4 shadow-xl rounded-xl sm:px-10 border border-gray-100">
                <h2 class="text-xl font-semibold text-gray-900 mb-6">账号登录</h2>

                <form @submit.prevent="submit" class="space-y-5">
                    <Input
                        v-model="form.email"
                        type="email"
                        label="邮箱地址"
                        placeholder="请输入邮箱"
                        :error="form.errors.email"
                        required
                    />

                    <div class="relative">
                        <Input
                            v-model="form.password"
                            :type="showPassword ? 'text' : 'password'"
                            label="密码"
                            placeholder="请输入密码"
                            :error="form.errors.password"
                            required
                        />
                        <button
                            type="button"
                            @click="togglePassword"
                            class="absolute right-3 top-9 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <EyeIcon v-if="!showPassword" class="w-5 h-5" />
                            <EyeSlashIcon v-else class="w-5 h-5" />
                        </button>
                    </div>

                    <div v-if="page.props.errors && Object.keys(page.props.errors).length > 0" class="bg-danger/10 border border-danger/20 rounded-lg p-3">
                        <p class="text-sm text-danger">
                            {{ Object.values(page.props.errors)[0] }}
                        </p>
                    </div>

                    <div class="flex items-center justify-between">
                        <label class="flex items-center">
                            <input
                                v-model="form.remember"
                                type="checkbox"
                                class="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                            />
                            <span class="ml-2 text-sm text-gray-600">记住我</span>
                        </label>
                        <a href="#" class="text-sm text-primary hover:text-primary-dark transition-colors">
                            忘记密码？
                        </a>
                    </div>

                    <Button type="submit" class="w-full" :loading="form.processing" size="lg">
                        登录
                    </Button>
                </form>
            </div>
        </div>
    </div>
</template>
