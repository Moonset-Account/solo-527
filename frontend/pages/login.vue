<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
    <n-card class="w-full max-w-md mx-4" title="IT账号变更审批系统" hoverable>
      <n-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-placement="top"
        @submit="handleLogin"
      >
        <n-form-item label="用户名" path="username">
          <n-input
            v-model:value="formData.username"
            placeholder="请输入用户名"
            size="large"
          >
            <template #prefix>
              <n-icon><UserOutlined /></n-icon>
            </template>
          </n-input>
        </n-form-item>

        <n-form-item label="密码" path="password">
          <n-input
            v-model:value="formData.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            show-password-on="click"
            @keyup.enter="handleLogin"
          >
            <template #prefix>
              <n-icon><LockOutlined /></n-icon>
            </template>
          </n-input>
        </n-form-item>

        <n-button
          type="primary"
          size="large"
          block
          :loading="loading"
          @click="handleLogin"
        >
          登录
        </n-button>
      </n-form>

      <div class="mt-4 text-center text-sm text-gray-500">
        <p>测试账号：</p>
        <p class="mt-1">管理员: admin / admin123</p>
        <p>安全负责人: security / security123</p>
        <p>普通用户: user / user123</p>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import {
  NCard,
  NForm,
  NFormItem,
  NInput,
  NButton,
  NIcon,
  useMessage,
} from 'naive-ui'
import { UserOutlined, LockOutlined } from '@vicons/antd'
import { useAuthStore } from '~/stores/auth'

const router = useRouter()
const message = useMessage()
const authStore = useAuthStore()

const formRef = ref<any>(null)
const loading = ref(false)

const formData = reactive({
  username: '',
  password: '',
})

const rules = {
  username: { required: true, message: '请输入用户名', trigger: 'blur' },
  password: { required: true, message: '请输入密码', trigger: 'blur' },
}

const handleLogin = async () => {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  loading.value = true
  try {
    await authStore.login(formData.username, formData.password)
    message.success('登录成功')
    router.push('/dashboard')
  } catch (error: any) {
    message.error(error.message || '登录失败')
  } finally {
    loading.value = false
  }
}
</script>
