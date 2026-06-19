<template>
  <div class="login-container">
    <div class="login-card">
      <h1 class="login-title">医药批次追溯系统</h1>
      <p class="login-subtitle">采购计划员专用管理平台</p>
      <div class="login-form">
        <n-form ref="formRef" :model="form" :rules="rules">
          <n-form-item label="用户名" path="username">
            <n-input v-model:value="form.username" placeholder="请输入用户名">
              <template #prefix>
                <n-icon><PersonOutline /></n-icon>
              </template>
            </n-input>
          </n-form-item>
          <n-form-item label="密码" path="password">
            <n-input
              v-model:value="form.password"
              type="password"
              show-password-on="click"
              placeholder="请输入密码"
              @keyup.enter="handleLogin"
            >
              <template #prefix>
                <n-icon><LockClosed /></n-icon>
              </template>
            </n-input>
          </n-form-item>
          <n-button
            block
            type="primary"
            size="large"
            :loading="loading"
            @click="handleLogin"
          >
            登 录
          </n-button>
        </n-form>
      </div>
      <div class="login-footer">
        <p>默认账号: admin / purchaser / warehouse / manager</p>
        <p>密码同用户名 + 123</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  NForm,
  NFormItem,
  NInput,
  NButton,
  NIcon,
  useMessage
} from 'naive-ui'
import { PersonOutline, LockClosed } from '@vicons/ionicons5'
import { useAuthStore } from '~/stores/auth'

const router = useRouter()
const message = useMessage()
const auth = useAuthStore()
const formRef = ref()
const loading = ref(false)

const form = ref({
  username: 'purchaser',
  password: 'purchaser123'
})

const rules = {
  username: {
    required: true,
    message: '请输入用户名',
    trigger: 'blur'
  },
  password: {
    required: true,
    message: '请输入密码',
    trigger: 'blur'
  }
}

onMounted(() => {
  auth.init()
  if (auth.isLoggedIn) {
    navigateTo('/')
  }
})

async function handleLogin() {
  try {
    await formRef.value?.validate()
    loading.value = true
    await auth.login(form.value.username, form.value.password)
    message.success('登录成功')
    navigateTo('/')
  } catch (e: any) {
    if (e?.detail) message.error(e.detail)
    else if (e?.message) message.error(e.message)
  } finally {
    loading.value = false
  }
}
</script>
