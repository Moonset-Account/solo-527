<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
    <n-card class="w-full max-w-md" title="心理咨询排班管理系统" bordered>
      <n-form
        ref="formRef"
        :model="formValue"
        :rules="rules"
        label-placement="top"
        class="mt-6"
      >
        <n-form-item label="用户名" path="username">
          <n-input
            v-model:value="formValue.username"
            placeholder="请输入用户名"
            :prefix="renderIcon(PeopleOutline)"
          />
        </n-form-item>
        <n-form-item label="密码" path="password">
          <n-input
            v-model:value="formValue.password"
            type="password"
            show-password-on="click"
            placeholder="请输入密码"
            :prefix="renderIcon(LockClosedOutline)"
            @keyup.enter="handleLogin"
          />
        </n-form-item>
        <n-button
          type="primary"
          block
          size="large"
          :loading="loading"
          @click="handleLogin"
        >
          登 录
        </n-button>
      </n-form>
      <n-divider>默认账号</n-divider>
      <div class="text-sm text-gray-500 space-y-1">
        <p>管理员：admin / admin123</p>
        <p>调度员：dispatcher / dispatcher123</p>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  NCard,
  NForm,
  NFormItem,
  NInput,
  NButton,
  NDivider,
  useMessage,
  FormInst,
  FormRules
} from 'naive-ui'
import { PeopleOutline, LockClosedOutline } from '@vicons/ionicons5'
import { h } from 'vue'
import { useAuth } from '~/composables/useAuth'

const router = useRouter()
const message = useMessage()
const { login } = useAuth()

const formRef = ref<FormInst | null>(null)
const loading = ref(false)

const formValue = ref({
  username: '',
  password: ''
})

const rules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur', min: 6 }
  ]
}

function renderIcon(icon: any) {
  return () => h(icon)
}

async function handleLogin() {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    loading.value = true
    
    await login(formValue.value.username, formValue.value.password)
    message.success('登录成功')
    router.push('/')
  } catch (error: any) {
    message.error(error.message || '登录失败')
  } finally {
    loading.value = false
  }
}
</script>
