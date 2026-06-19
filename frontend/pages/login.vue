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

definePageMeta({ layout: false })

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

<style lang="scss" scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}
.login-card {
  width: 100%;
  max-width: 420px;
  background: #fff;
  border-radius: 12px;
  padding: 40px 36px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
}
.login-title {
  font-size: 24px;
  font-weight: 700;
  color: #1d2129;
  margin: 0 0 8px;
  text-align: center;
}
.login-subtitle {
  color: #86909c;
  font-size: 14px;
  margin: 0 0 32px;
  text-align: center;
}
.login-form {
  margin-bottom: 24px;
}
.login-footer {
  text-align: center;
  color: #86909c;
  font-size: 12px;
  line-height: 1.8;
  border-top: 1px solid #f2f3f5;
  padding-top: 16px;
  p { margin: 0; }
}
</style>
