<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 p-4">
    <div class="w-full max-w-md">
      <div class="bg-white rounded-2xl shadow-2xl p-8">
        <div class="text-center mb-8">
          <div class="w-16 h-16 mx-auto bg-primary-100 rounded-2xl flex items-center justify-center text-3xl mb-3">🏸</div>
          <h1 class="text-2xl font-bold text-gray-800">羽毛球馆管理系统</h1>
          <p class="text-gray-500 mt-1 text-sm">Badminton Court Management System</p>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label class="label">用户名 / 手机号</label>
            <input v-model="form.username" class="input" placeholder="请输入用户名或手机号" autocomplete="username" />
          </div>
          <div>
            <label class="label">密码</label>
            <input v-model="form.password" type="password" class="input" placeholder="请输入密码" autocomplete="current-password" />
          </div>
          <div v-if="errorMsg" class="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{{ errorMsg }}</div>
          <button :disabled="loading" class="btn-primary w-full py-3">
            {{ loading ? '登录中...' : '登 录' }}
          </button>
        </form>

        <div class="mt-6 pt-6 border-t border-gray-100">
          <p class="text-xs text-gray-400 mb-2 text-center">演示账号</p>
          <div class="grid grid-cols-2 gap-2 text-xs">
            <button v-for="a in demoAccounts" :key="a[0]" class="bg-gray-50 hover:bg-gray-100 rounded-lg p-2 text-left transition"
              @click="fillForm(a)">
              <div class="font-medium text-gray-700">{{ a[2] }}</div>
              <div class="text-gray-400">{{ a[0] }} / {{ a[1] }}</div>
            </button>
          </div>
        </div>
      </div>
      <p class="text-center text-white/60 text-xs mt-4">© 2024 Badminton Court Management System</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useAuthStore } from '~/stores/auth'

const auth = useAuthStore()
const router = useRouter()

const form = reactive({ username: 'superadmin', password: 'admin123' })
const loading = ref(false)
const errorMsg = ref('')

const demoAccounts = [
  ['superadmin', 'admin123', '超级管理员'],
  ['admin', 'admin123', '管理员'],
  ['manager', 'admin123', '运营经理'],
  ['coach01', 'admin123', '教练'],
  ['staff01', 'admin123', '前台'],
  ['user001', 'user123', '客户']
]

function fillForm(a: string[]) {
  form.username = a[0]
  form.password = a[1]
}

async function handleLogin() {
  if (!form.username || !form.password) {
    errorMsg.value = '请输入用户名和密码'
    return
  }
  loading.value = true
  errorMsg.value = ''
  try {
    await auth.login(form.username, form.password)
    router.push('/dashboard')
  } catch (e: any) {
    errorMsg.value = e.message || '登录失败'
  } finally {
    loading.value = false
  }
}
</script>
