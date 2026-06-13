<template>
  <div class="login-container">
    <n-card class="login-card">
      <div class="login-header">
        <h1 class="title">青禾客服质检台</h1>
        <p class="subtitle">SaaS 客服知识库门户</p>
      </div>

      <n-form ref="formRef" :model="formData" :rules="rules" label-placement="top">
        <n-form-item label="用户名" path="username">
          <n-input v-model:value="formData.username" placeholder="请输入用户名" size="large" />
        </n-form-item>

        <n-form-item label="密码" path="password">
          <n-input
            v-model:value="formData.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            show-password-on="click"
            @keyup.enter="handleLogin"
          />
        </n-form-item>

        <n-button type="primary" block size="large" :loading="loading" @click="handleLogin">
          登 录
        </n-button>
      </n-form>

      <n-divider>或</n-divider>

      <n-space justify="center">
        <n-button text size="small" @click="quickLogin('admin')">管理员登录</n-button>
        <n-button text size="small" @click="quickLogin('supervisor')">主管登录</n-button>
        <n-button text size="small" @click="quickLogin('agent')">客服登录</n-button>
        <n-button text size="small" @click="quickLogin('customer')">客户登录</n-button>
      </n-space>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const { post } = useApi()
const auth = useAuthStore()
const message = useMessage()

const formRef = ref()
const loading = ref(false)

const formData = reactive({
  username: '',
  password: ''
})

const rules = {
  username: { required: true, message: '请输入用户名', trigger: 'blur' },
  password: { required: true, message: '请输入密码', trigger: 'blur' }
}

const handleLogin = async () => {
  try {
    await formRef.value?.validate()
    loading.value = true

    const res = await post<any>('/auth/login', formData)
    auth.setAuth(res.access_token, res.user)
    message.success('登录成功')
    router.push('/')
  } catch (e: any) {
    message.error(e.message || '登录失败')
  } finally {
    loading.value = false
  }
}

const quickLogin = (role: string) => {
  const demoUsers: Record<string, { username: string; password: string }> = {
    admin: { username: 'admin', password: 'admin123' },
    supervisor: { username: 'supervisor', password: 'super123' },
    agent: { username: 'agent01', password: 'agent123' },
    customer: { username: 'customer01', password: 'cust123' }
  }
  const user = demoUsers[role]
  if (user) {
    formData.username = user.username
    formData.password = user.password
    handleLogin()
  }
}
</script>

<style scoped lang="scss">
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%);
}

.login-card {
  width: 420px;
  padding: 20px;
}

.login-header {
  text-align: center;
  margin-bottom: 32px;

  .title {
    font-size: 28px;
    font-weight: 600;
    color: #18a058;
    margin: 0 0 8px 0;
  }

  .subtitle {
    color: #86909c;
    margin: 0;
  }
}
</style>
