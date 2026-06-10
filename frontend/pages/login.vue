<template>
  <div class="login-page">
    <n-card class="login-card" title="青禾候选人管道台" :bordered="false">
      <n-form ref="formRef" :model="form" :rules="rules" size="large">
        <n-form-item label="用户名" path="username">
          <n-input
            v-model:value="form.username"
            placeholder="请输入用户名"
            @keyup.enter="handleLogin"
          >
            <template #prefix>
              <n-icon><UserOutlined /></n-icon>
            </template>
          </n-input>
        </n-form-item>
        <n-form-item label="密码" path="password">
          <n-input
            v-model:value="form.password"
            type="password"
            placeholder="请输入密码"
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
          block
          :loading="loading"
          @click="handleLogin"
        >
          登录
        </n-button>
      </n-form>
      <div class="quick-login">
        <p>快速登录测试账号：</p>
        <n-space>
          <n-tag class="clickable" @click="quickLogin('admin', 'admin123')">管理员</n-tag>
          <n-tag class="clickable" @click="quickLogin('recruiter', 'recruiter123')">招聘员</n-tag>
          <n-tag class="clickable" @click="quickLogin('candidate1', 'candidate123')">候选人</n-tag>
        </n-space>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { UserOutlined, LockOutlined } from '@vicons/antd'
import { useAuthStore } from '~/stores/auth'
import { useMessage, FormRules } from 'naive-ui'

const router = useRouter()
const message = useMessage()
const authStore = useAuthStore()

const formRef = ref()
const loading = ref(false)

const form = reactive({
  username: '',
  password: '',
})

const rules: FormRules = {
  username: {
    required: true,
    message: '请输入用户名',
    trigger: 'blur',
  },
  password: {
    required: true,
    message: '请输入密码',
    trigger: 'blur',
  },
}

async function handleLogin() {
  if (!form.username || !form.password) {
    message.warning('请填写用户名和密码')
    return
  }
  loading.value = true
  try {
    await authStore.login(form.username, form.password)
    message.success('登录成功')
    if (authStore.isCandidate) {
      navigateTo('/')
    } else {
      navigateTo('/dashboard')
    }
  } catch (err: any) {
    message.error(err.response?.data?.detail || '登录失败')
  } finally {
    loading.value = false
  }
}

function quickLogin(username: string, password: string) {
  form.username = username
  form.password = password
  handleLogin()
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.login-card {
  width: 400px;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
}
.quick-login {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #eee;
}
.quick-login p {
  margin: 0 0 8px 0;
  color: #999;
  font-size: 12px;
}
.clickable {
  cursor: pointer;
}
</style>
