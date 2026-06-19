<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-700 via-primary-800 to-slate-900 p-4">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl mb-4">
          <ClipboardCheck class="w-8 h-8 text-white" />
        </div>
        <h1 class="text-2xl font-bold text-white mb-2">施工验收台</h1>
        <p class="text-primary-200">设计图纸现场巡检管理系统</p>
      </div>

      <div class="bg-white rounded-2xl shadow-xl p-8">
        <h2 class="text-xl font-bold text-slate-800 mb-6">登录账号</h2>

        <form @submit.prevent="handleLogin" class="space-y-5">
          <div>
            <label class="input-label">手机号</label>
            <input
              v-model="form.phone"
              type="tel"
              class="input"
              placeholder="请输入手机号"
              :disabled="loading"
            />
          </div>

          <div>
            <label class="input-label">密码</label>
            <input
              v-model="form.password"
              type="password"
              class="input"
              placeholder="请输入密码"
              :disabled="loading"
              @keyup.enter="handleLogin"
            />
          </div>

          <div v-if="error" class="p-3 bg-danger-50 border border-danger-200 rounded-lg text-danger-700 text-sm">
            {{ error }}
          </div>

          <button
            type="submit"
            class="btn-primary w-full py-2.5"
            :disabled="loading"
          >
            <span v-if="loading">登录中...</span>
            <span v-else>登 录</span>
          </button>
        </form>

        <div class="mt-6 pt-6 border-t border-slate-100">
          <p class="text-xs text-slate-500 mb-3">演示账号</p>
          <div class="grid grid-cols-2 gap-2 text-xs">
            <button
              v-for="account in demoAccounts"
              :key="account.role"
              class="text-left p-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
              @click="quickLogin(account)"
            >
              <p class="font-medium text-slate-700">{{ account.name }}</p>
              <p class="text-slate-500 mt-0.5">{{ account.phone }}</p>
            </button>
          </div>
        </div>
      </div>

      <p class="text-center text-primary-200/60 text-sm mt-6">
        © 2024 施工验收台 · 让每一次巡检都有迹可循
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ClipboardCheck } from 'lucide-vue-next'

const authStore = useAuthStore()
const router = useRouter()

const loading = ref(false)
const error = ref('')

const form = reactive({
  phone: '',
  password: '',
})

const demoAccounts = [
  { role: 'manager', name: '项目经理', phone: '13800000001', password: '123456' },
  { role: 'owner', name: '业主', phone: '13800000002', password: '123456' },
  { role: 'inspector', name: '巡检人员', phone: '13800000003', password: '123456' },
  { role: 'customer_service', name: '客服', phone: '13800000004', password: '123456' },
]

const handleLogin = async () => {
  if (!form.phone || !form.password) {
    error.value = '请输入手机号和密码'
    return
  }

  loading.value = true
  error.value = ''

  const result = await authStore.login(form.phone, form.password)

  if (result.success) {
    await router.push('/dashboard')
  } else {
    error.value = result.error || '登录失败'
  }

  loading.value = false
}

const quickLogin = (account: any) => {
  form.phone = account.phone
  form.password = account.password
  handleLogin()
}
</script>
