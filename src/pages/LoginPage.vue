<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Bell, Mail, Lock } from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const errorMsg = ref('')

async function handleLogin() {
  errorMsg.value = ''
  try {
    await authStore.login(email.value, password.value)
    router.push('/requirements')
  } catch {
    errorMsg.value = '登录失败，请检查邮箱和密码'
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 px-4">
    <div
      class="w-full max-w-md bg-white/5 backdrop-blur-sm border border-slate-700 rounded-2xl shadow-2xl p-8 animate-fade-in"
    >
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-amber-500/10 mb-4">
          <Bell class="w-7 h-7 text-amber-500" />
        </div>
        <h1 class="text-2xl font-bold text-amber-500 mb-1">提醒中心</h1>
        <p class="text-sm text-slate-400">跨部门需求提醒中心</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-5">
        <div>
          <div class="relative">
            <Mail class="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400" />
            <input
              v-model="email"
              type="email"
              placeholder="邮箱地址"
              required
              class="input pl-10 bg-slate-800/50 border-slate-600 text-white placeholder-slate-500 focus:ring-amber-500/30 focus:border-amber-500"
            />
          </div>
        </div>

        <div>
          <div class="relative">
            <Lock class="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400" />
            <input
              v-model="password"
              type="password"
              placeholder="密码"
              required
              class="input pl-10 bg-slate-800/50 border-slate-600 text-white placeholder-slate-500 focus:ring-amber-500/30 focus:border-amber-500"
            />
          </div>
        </div>

        <div v-if="errorMsg" class="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">
          {{ errorMsg }}
        </div>

        <button
          type="submit"
          :disabled="authStore.isLoading"
          class="btn-accent w-full py-2.5 text-base font-semibold disabled:opacity-60"
        >
          {{ authStore.isLoading ? '登录中...' : '登 录' }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-fade-in {
  animation: fade-in 0.5s ease-out;
}
</style>
