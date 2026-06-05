<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-amber-50 p-4">
    <div class="w-full max-w-md">
      <div class="card">
        <div class="card-body">
          <div class="text-center mb-8">
            <h1 class="text-2xl font-bold text-gray-800">注册账号</h1>
            <p class="text-gray-500 mt-2">开启您的手作之旅</p>
          </div>

          <form @submit.prevent="handleRegister">
            <div class="form-group">
              <label class="form-label">姓名</label>
              <input v-model="form.name" type="text" class="form-input" placeholder="请输入您的姓名" />
            </div>

            <div class="form-group">
              <label class="form-label">手机号</label>
              <input v-model="form.phone" type="tel" class="form-input" placeholder="请输入手机号" maxlength="11" />
            </div>

            <div class="form-group">
              <label class="form-label">邮箱（选填）</label>
              <input v-model="form.email" type="email" class="form-input" placeholder="请输入邮箱" />
            </div>

            <div class="form-group">
              <label class="form-label">密码</label>
              <input v-model="form.password" type="password" class="form-input" placeholder="请设置密码（至少6位）" />
            </div>

            <div class="form-group">
              <label class="form-label">确认密码</label>
              <input v-model="form.password_confirmation" type="password" class="form-input" placeholder="请再次输入密码" />
            </div>

            <div v-if="error" class="text-red-500 text-sm mb-4">{{ error }}</div>

            <button type="submit" class="btn btn-primary btn-lg btn-block" :disabled="loading">
              <span v-if="loading" class="loading-spinner inline-block w-4 h-4 mr-2"></span>
              {{ loading ? '注册中...' : '注册' }}
            </button>
          </form>

          <div class="mt-6 text-center">
            <p class="text-gray-500 text-sm">
              已有账号？
              <router-link to="/login" class="text-purple-600 font-medium">立即登录</router-link>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { UserRole } from '../../types'

const router = useRouter()
const authStore = useAuthStore()

const form = reactive({
  name: '',
  phone: '',
  email: '',
  password: '',
  password_confirmation: ''
})

const loading = ref(false)
const error = ref('')

const handleRegister = async () => {
  if (!form.name || !form.phone || !form.password) {
    error.value = '请填写完整信息'
    return
  }
  if (form.password.length < 6) {
    error.value = '密码至少6位'
    return
  }
  if (form.password !== form.password_confirmation) {
    error.value = '两次密码不一致'
    return
  }

  loading.value = true
  error.value = ''

  try {
    await authStore.register(form.name, form.phone, form.password, UserRole.STUDENT)
    router.push('/courses')
  } catch (e: any) {
    error.value = e.response?.data?.error || '注册失败，请重试'
  } finally {
    loading.value = false
  }
}
</script>
