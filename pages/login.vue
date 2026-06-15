<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <div class="text-center mb-8 animate-fade-in">
        <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/30">
          <BarChart3 class="w-8 h-8 text-white" />
        </div>
        <h1 class="text-2xl font-bold text-slate-800 mb-1">销售经营数据门户</h1>
        <p class="text-slate-500">实时洞察经营数据，驱动业务增长</p>
      </div>

      <div class="card p-8 animate-slide-up">
        <h2 class="text-lg font-semibold text-slate-800 mb-6">账号登录</h2>

        <form @submit.prevent="handleLogin" class="space-y-5">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">用户名</label>
            <div class="relative">
              <User class="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                v-model="form.username"
                type="text"
                placeholder="请输入用户名"
                class="input pl-10"
                autocomplete="username"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">密码</label>
            <div class="relative">
              <Lock class="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="请输入密码"
                class="input pl-10 pr-10"
                autocomplete="current-password"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                @click="showPassword = !showPassword"
              >
                <Eye v-if="!showPassword" class="w-5 h-5" />
                <EyeOff v-else class="w-5 h-5" />
              </button>
            </div>
          </div>

          <div class="flex items-center justify-between">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="form.remember" class="w-4 h-4 text-primary-500 rounded border-slate-300 focus:ring-primary-500" />
              <span class="text-sm text-slate-600">记住我</span>
            </label>
            <a href="#" class="text-sm text-primary-500 hover:text-primary-600 font-medium">忘记密码？</a>
          </div>

          <button
            type="submit"
            class="w-full btn-primary py-2.5 text-base font-medium shadow-md shadow-primary-500/30 hover:shadow-lg hover:shadow-primary-500/40"
            :disabled="loading"
          >
            <span v-if="loading" class="flex items-center justify-center gap-2">
              <Loader2 class="w-5 h-5 animate-spin" />
              登录中...
            </span>
            <span v-else>登 录</span>
          </button>
        </form>

        <div class="mt-6 pt-6 border-t border-slate-100">
          <p class="text-xs text-slate-400 text-center mb-3">演示账号</p>
          <div class="grid grid-cols-2 gap-2 text-xs">
            <div class="p-2 bg-slate-50 rounded-lg">
              <p class="font-medium text-slate-700">销售总监</p>
              <p class="text-slate-500">director / 123456</p>
            </div>
            <div class="p-2 bg-slate-50 rounded-lg">
              <p class="font-medium text-slate-700">业务负责人</p>
              <p class="text-slate-500">business / 123456</p>
            </div>
          </div>
        </div>
      </div>

      <p class="text-center text-xs text-slate-400 mt-6">
        © 2024 销售经营数据门户 · 数据安全合规
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { BarChart3, User, Lock, Eye, EyeOff, Loader2 } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()

const form = reactive({
  username: 'director',
  password: '123456',
  remember: true
})

const showPassword = ref(false)
const loading = ref(false)
const error = ref('')

const handleLogin = async () => {
  if (!form.username || !form.password) {
    error.value = '请输入用户名和密码'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const res = await $fetch('/api/auth', {
      method: 'POST',
      body: {
        username: form.username,
        password: form.password
      }
    })

    const redirect = route.query.redirect as string || '/'
    router.push(redirect)
  } catch (e: any) {
    error.value = e?.data?.statusMessage || '登录失败，请重试'
  } finally {
    loading.value = false
  }
}
</script>
