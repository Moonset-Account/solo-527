<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-amber-50 p-4">
    <div class="w-full max-w-md">
      <div class="card">
        <div class="card-body">
          <div class="text-center mb-8">
            <div class="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span class="text-3xl">🎨</span>
            </div>
            <h1 class="text-2xl font-bold text-gray-800">手作工作室</h1>
            <p class="text-gray-500 mt-2">陶艺 · 银饰 · 皮具</p>
          </div>

          <form @submit.prevent="handleLogin">
            <div class="form-group">
              <label class="form-label">手机号</label>
              <input
                v-model="form.phone"
                type="tel"
                class="form-input"
                placeholder="请输入手机号"
                maxlength="11"
              />
            </div>

            <div class="form-group">
              <label class="form-label">密码</label>
              <input
                v-model="form.password"
                type="password"
                class="form-input"
                placeholder="请输入密码"
              />
            </div>

            <div v-if="error" class="text-red-500 text-sm mb-4">
              {{ error }}
            </div>

            <button
              type="submit"
              class="btn btn-primary btn-lg btn-block"
              :disabled="loading"
            >
              <span v-if="loading" class="loading-spinner inline-block w-4 h-4 mr-2"></span>
              {{ loading ? '登录中...' : '登录' }}
            </button>
          </form>

          <div class="mt-6 text-center">
            <p class="text-gray-500 text-sm">
              还没有账号？
              <router-link to="/register" class="text-purple-600 font-medium">立即注册</router-link>
            </p>
          </div>

          <div class="mt-6 pt-6 border-t border-gray-100">
            <p class="text-xs text-gray-400 text-center mb-3">测试账号</p>
            <div class="grid grid-cols-3 gap-2 text-xs">
              <button @click="fillTestData('student')" class="btn btn-secondary btn-sm">
                学员
              </button>
              <button @click="fillTestData('teacher')" class="btn btn-secondary btn-sm">
                老师
              </button>
              <button @click="fillTestData('admin')" class="btn btn-secondary btn-sm">
                管理员
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const form = reactive({
  phone: '',
  password: ''
})

const loading = ref(false)
const error = ref('')

const handleLogin = async () => {
  if (!form.phone || !form.password) {
    error.value = '请输入手机号和密码'
    return
  }

  loading.value = true
  error.value = ''

  try {
    await authStore.login(form.phone, form.password)
    const redirect = (route.query.redirect as string) || '/courses'
    router.push(redirect)
  } catch (e: any) {
    error.value = e.response?.data?.error || '登录失败，请重试'
  } finally {
    loading.value = false
  }
}

const fillTestData = (role: string) => {
  const accounts: Record<string, { phone: string; password: string }> = {
    student: { phone: '13800138001', password: '123456' },
    teacher: { phone: '13800138002', password: '123456' },
    admin: { phone: '13800138000', password: 'admin123' }
  }
  form.phone = accounts[role].phone
  form.password = accounts[role].password
}
</script>
