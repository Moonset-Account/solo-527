<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-cream py-12 px-4">
    <div class="max-w-md w-full">
      <div class="text-center mb-8">
        <router-link to="/" class="inline-flex items-center space-x-2 mb-6">
          <span class="text-4xl">🏺</span>
          <span class="font-display text-2xl font-bold text-primary-600">匠心手作</span>
        </router-link>
        <h1 class="font-display text-3xl font-bold text-inkBlack mb-2">欢迎回来</h1>
        <p class="text-warmGray">登录您的账户，继续手作之旅</p>
      </div>

      <div class="card p-8">
        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          @submit.prevent="handleLogin"
          class="space-y-6"
        >
          <el-form-item prop="email">
            <label class="label-text">邮箱</label>
            <el-input
              v-model="form.email"
              type="email"
              placeholder="请输入邮箱地址"
              size="large"
              class="input-field"
            />
          </el-form-item>

          <el-form-item prop="password">
            <label class="label-text">密码</label>
            <el-input
              v-model="form.password"
              type="password"
              placeholder="请输入密码"
              size="large"
              show-password
              class="input-field"
              @keyup.enter="handleLogin"
            />
          </el-form-item>

          <div class="flex items-center justify-between text-sm">
            <label class="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" v-model="form.remember" class="rounded text-primary-600" />
              <span class="text-wood-600">记住我</span>
            </label>
            <a href="#" class="text-primary-600 hover:text-primary-700">忘记密码？</a>
          </div>

          <el-button
            type="primary"
            size="large"
            class="w-full btn-primary !py-3"
            :loading="loading"
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form>

        <div class="mt-6 text-center text-sm">
          <span class="text-warmGray">还没有账户？</span>
          <router-link to="/register" class="text-primary-600 hover:text-primary-700 font-medium ml-1">
            立即注册
          </router-link>
        </div>

        <div class="mt-6 pt-6 border-t border-wood-100">
          <p class="text-center text-sm text-warmGray mb-4">测试账号</p>
          <div class="grid grid-cols-2 gap-3 text-xs">
            <div class="bg-wood-50 p-3 rounded-lg">
              <p class="font-medium text-wood-700">管理员</p>
              <p class="text-warmGray">admin@example.com</p>
              <p class="text-warmGray">password123</p>
            </div>
            <div class="bg-wood-50 p-3 rounded-lg">
              <p class="font-medium text-wood-700">学员</p>
              <p class="text-warmGray">student1@example.com</p>
              <p class="text-warmGray">password123</p>
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
import { ElMessage, FormInstance, FormRules } from 'element-plus'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  email: '',
  password: '',
  remember: true
})

const rules: FormRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    loading.value = true

    const response: any = await authStore.login(form.email, form.password)

    const headers = response.headers || response
    if (headers['access-token']) {
      authStore.setAuthInfo({
        token: headers['access-token'],
        client: headers['client'] || '',
        uid: headers['uid'] || ''
      })
    }

    ElMessage.success('登录成功')
    const redirect = route.query.redirect as string || '/'
    router.push(redirect)
  } catch (error: any) {
    console.error('Login error:', error)
  } finally {
    loading.value = false
  }
}
</script>
