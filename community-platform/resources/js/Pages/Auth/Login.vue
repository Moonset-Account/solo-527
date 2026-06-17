<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="max-w-md w-full mx-auto">
      <div class="text-center mb-8">
        <h1 class="text-2xl font-bold text-gray-900">社区治理平台</h1>
        <p class="mt-2 text-gray-600">请登录您的账号</p>
      </div>

      <div v-if="$page.props.flash.error"
        class="mb-6 p-4 border border-red-300 bg-red-50 text-red-800 rounded-md">
        {{ $page.props.flash.error }}
      </div>

      <div class="bg-white p-6 shadow rounded-lg">
        <form @submit.prevent="form.post('/login')">
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
            <input v-model="form.email" type="email"
              class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="name@example.com">
            <div v-if="form.errors.email" class="mt-1 text-sm text-red-600">{{ form.errors.email }}</div>
          </div>

          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">密码</label>
            <input v-model="form.password" type="password"
              class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="请输入密码">
            <div v-if="form.errors.password" class="mt-1 text-sm text-red-600">{{ form.errors.password }}</div>
          </div>

          <div class="mb-6 flex items-center">
            <input v-model="form.remember" type="checkbox" id="remember"
              class="h-4 w-4 text-indigo-600 border-gray-300 rounded">
            <label for="remember" class="ml-2 text-sm text-gray-600">记住我</label>
          </div>

          <button type="submit" :disabled="form.processing"
            class="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50">
            登录
          </button>
        </form>

        <div class="mt-6 pt-4 border-t border-gray-200">
          <p class="text-xs text-gray-500 mb-2">演示账号（密码统一 123456）：</p>
          <div class="text-xs text-gray-600 space-y-1">
            <div>管理员：admin@community.com</div>
            <div>部门人员：staff1@community.com</div>
            <div>居民代表：rep@community.com</div>
            <div>居民：chen@community.com</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useForm } from '@inertiajs/vue3'

const form = useForm({
  email: '',
  password: '',
  remember: false,
})
</script>
