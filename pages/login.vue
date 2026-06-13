<script setup lang="ts">
import { LogIn, Loader2 } from 'lucide-vue-next'

definePageMeta({ layout: false })

const { setAuth } = useAuthState()
const api = useApi()
const router = useRouter()

const form = reactive({ username: '', password: '' })
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
    const res: any = await api.post('/api/auth/login', form)
    setAuth(res.user, res.token)
    router.push('/')
  } catch (e: any) {
    error.value = e?.data?.message || '登录失败'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-[#0F172A]">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-brand-400 mb-2">会话批量生成器</h1>
        <p class="text-slate-400">客服主管工作台</p>
      </div>
      <div class="bg-white rounded-xl p-8 shadow-2xl">
        <h2 class="text-xl font-bold text-slate-800 mb-6">登录</h2>
        <form @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">用户名</label>
            <input v-model="form.username" type="text" class="input-field" placeholder="请输入用户名" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">密码</label>
            <input v-model="form.password" type="password" class="input-field" placeholder="请输入密码" />
          </div>
          <div v-if="error" class="text-red-500 text-sm bg-red-50 p-2 rounded">{{ error }}</div>
          <button type="submit" class="btn-primary w-full flex items-center justify-center gap-2" :disabled="loading">
            <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />
            <LogIn v-else class="w-4 h-4" />
            <span>{{ loading ? '登录中...' : '登录' }}</span>
          </button>
        </form>
        <div class="mt-6 pt-4 border-t border-slate-200">
          <p class="text-xs text-slate-400 text-center">演示账号: admin / admin123</p>
        </div>
      </div>
    </div>
  </div>
</template>
