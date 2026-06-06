<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-cream py-12 px-4">
    <div class="max-w-md w-full">
      <div class="text-center mb-8">
        <router-link to="/" class="inline-flex items-center space-x-2 mb-6">
          <span class="text-4xl">🏺</span>
          <span class="font-display text-2xl font-bold text-primary-600">匠心手作</span>
        </router-link>
        <h1 class="font-display text-3xl font-bold text-inkBlack mb-2">创建账户</h1>
        <p class="text-warmGray">开启您的手作之旅</p>
      </div>

      <div class="card p-8">
        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          @submit.prevent="handleRegister"
          class="space-y-5"
        >
          <el-form-item prop="name">
            <label class="label-text">姓名</label>
            <el-input
              v-model="form.name"
              placeholder="请输入您的姓名"
              size="large"
              class="input-field"
            />
          </el-form-item>

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
              placeholder="请设置密码（至少6位）"
              size="large"
              show-password
              class="input-field"
            />
          </el-form-item>

          <el-form-item prop="password_confirmation">
            <label class="label-text">确认密码</label>
            <el-input
              v-model="form.password_confirmation"
              type="password"
              placeholder="请再次输入密码"
              size="large"
              show-password
              class="input-field"
              @keyup.enter="handleRegister"
            />
          </el-form-item>

          <el-button
            type="primary"
            size="large"
            class="w-full btn-primary !py-3"
            :loading="loading"
            @click="handleRegister"
          >
            注册
          </el-button>
        </el-form>

        <div class="mt-6 text-center text-sm">
          <span class="text-warmGray">已有账户？</span>
          <router-link to="/login" class="text-primary-600 hover:text-primary-700 font-medium ml-1">
            立即登录
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, FormInstance, FormRules } from 'element-plus'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  name: '',
  email: '',
  password: '',
  password_confirmation: ''
})

const rules: FormRules = {
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ],
  password_confirmation: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== form.password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const handleRegister = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    loading.value = true

    await authStore.register(form)
    ElMessage.success('注册成功，请登录')
    router.push('/login')
  } catch (error: any) {
    console.error('Register error:', error)
    ElMessage.error(error.response?.data?.errors?.full_messages?.[0] || '注册失败，请重试')
  } finally {
    loading.value = false
  }
}
</script>
