<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const password = ref('')
const error = ref('')
const isLoading = ref(false)

async function handleLogin() {
  error.value = ''
  if (!username.value || !password.value) {
    error.value = '请输入用户名和密码'
    return
  }
  isLoading.value = true
  try {
    await authStore.login(username.value, password.value)
    router.push('/')
  } catch (e: any) {
    error.value = e.message || '登录失败'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#051E24] flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <h1 class="text-2xl font-bold text-gray-100 mb-2">水产养殖水质监控系统</h1>
        <p class="text-sm text-gray-500">请登录以继续</p>
      </div>

      <div class="bg-[#0A2E36] rounded-xl border border-[#0D3B47] p-8">
        <form @submit.prevent="handleLogin" class="space-y-5">
          <div>
            <label class="block text-xs text-gray-400 mb-1.5">用户名</label>
            <input
              v-model="username"
              type="text"
              autocomplete="username"
              class="w-full bg-[#0D3B47] border border-[#0D3B47] rounded-lg px-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#00B4D8]/50"
              placeholder="请输入用户名"
            />
          </div>

          <div>
            <label class="block text-xs text-gray-400 mb-1.5">密码</label>
            <input
              v-model="password"
              type="password"
              autocomplete="current-password"
              class="w-full bg-[#0D3B47] border border-[#0D3B47] rounded-lg px-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#00B4D8]/50"
              placeholder="请输入密码"
            />
          </div>

          <div v-if="error" class="px-3 py-2 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/20 text-sm text-[#EF4444]">
            {{ error }}
          </div>

          <button
            type="submit"
            :disabled="isLoading"
            class="w-full px-4 py-2.5 text-sm font-medium rounded-lg bg-[#00B4D8] text-white hover:bg-[#00B4D8]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isLoading ? '登录中...' : '登录' }}
          </button>
        </form>

        <div class="mt-6 pt-5 border-t border-[#0D3B47]">
          <p class="text-xs text-gray-600 mb-2">演示账号：</p>
          <div class="space-y-1 text-xs text-gray-500">
            <p>技术员：zhangsan / 123456</p>
            <p>场长：wangcz / 123456</p>
            <p>管理员：admin / admin123</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
