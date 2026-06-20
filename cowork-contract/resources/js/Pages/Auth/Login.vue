<script setup>
import { reactive, computed } from 'vue'
import { router, usePage } from '@inertiajs/vue3'

defineOptions({ layout: false })

const page = usePage()

const form = reactive({
  email: '',
  password: '',
  remember: false,
})

const errors = computed(() => page.props.errors)

function submit() {
  router.post(route('login'), form)
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-100">
    <div class="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
      <div class="mb-6 text-center">
        <h1 class="text-2xl font-bold text-gray-900">联合办公合同管理系统</h1>
        <p class="mt-2 text-sm text-gray-600">请登录以继续</p>
      </div>

      <div v-if="errors.email" class="mb-4 rounded-md bg-red-50 p-3">
        <p class="text-sm text-red-700">{{ errors.email }}</p>
      </div>

      <form @submit.prevent="submit" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
          <input
            v-model="form.email"
            type="email"
            required
            autofocus
            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="admin@cowork.com"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">密码</label>
          <input
            v-model="form.password"
            type="password"
            required
            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="请输入密码"
          />
        </div>

        <div class="flex items-center">
          <input v-model="form.remember" type="checkbox" id="remember" class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
          <label for="remember" class="ml-2 block text-sm text-gray-700">记住我</label>
        </div>

        <button type="submit" class="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors">
          登录
        </button>
      </form>

      <div class="mt-6 rounded-md bg-gray-50 p-4">
        <p class="text-xs font-medium text-gray-500 mb-2">测试账号：</p>
        <div class="space-y-1 text-xs text-gray-600">
          <p>管理员：admin@cowork.com / password</p>
          <p>财务专员：finance@cowork.com / password</p>
          <p>招商顾问：consultant@cowork.com / password</p>
        </div>
      </div>
    </div>
  </div>
</template>
