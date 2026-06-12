<template>
  <div class="login-wrapper">
    <div class="login-card">
      <div class="logo-area">
        <div class="logo">青</div>
        <h1>青禾合规清单台</h1>
        <p class="subtitle">数据合规审阅流系统 · 简洁高效</p>
      </div>
      <n-form :model="form" ref="formRef" size="large" label-placement="left" label-width="80">
        <n-form-item label="账号" path="username">
          <n-input v-model:value="form.username" placeholder="请输入用户名" autocomplete="username">
            <template #prefix><n-icon><UserOutline /></n-icon></template>
          </n-input>
        </n-form-item>
        <n-form-item label="密码" path="password">
          <n-input v-model:value="form.password" type="password" show-password-on="click" placeholder="请输入密码" autocomplete="current-password">
            <template #prefix><n-icon><LockOutline /></n-icon></template>
          </n-input>
        </n-form-item>
        <n-button type="primary" block size="large" :loading="loading" @click="submit">登 录</n-button>
      </n-form>
      <n-divider style="margin: 20px 0 12px">演示账号</n-divider>
      <div class="demo-accounts">
        <div v-for="a in demoAccounts" :key="a.user" class="demo-row" @click="useDemo(a)">
          <span class="demo-role">{{ a.role }}</span>
          <span class="demo-user">{{ a.user }} / {{ a.pwd }}</span>
          <n-button size="small" quaternary type="primary">使用</n-button>
        </div>
      </div>
      <p class="tip">本系统已对接 FastAPI + PostgreSQL + Celery</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { UserOutline, LockOutline } from '@vicons/ionicons5'
import { useApi } from '~/composables/useApi'

const form = reactive({ username: 'manager', password: 'manager123' })
const loading = ref(false)
const formRef = ref()

const demoAccounts = [
  { role: '合规经理', user: 'manager', pwd: 'manager123' },
  { role: '系统管理员', user: 'admin', pwd: 'admin123' },
  { role: '律师', user: 'lawyer', pwd: 'lawyer123' },
  { role: '复核人', user: 'reviewer', pwd: 'reviewer123' },
  { role: '业务提交人', user: 'submitter', pwd: 'submitter123' },
]

function useDemo(a: any) {
  form.username = a.user
  form.password = a.pwd
}

const router = useRouter()
const auth = useAuthStore()

async function submit() {
  loading.value = true
  try {
    const api = useApi()
    const data = await api.post('/auth/login', { username: form.username, password: form.password })
    auth.setAuth(data.access_token, data.user)
    const msgs = (window as any).__n_msg
    if (msgs) msgs.success(`欢迎，${data.user.full_name}`)
    router.push('/')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #e8f5ee 0%, #f0f7f3 50%, #e6f3ec 100%);
  padding: 20px;
}
.login-card {
  width: 480px;
  max-width: 100%;
  background: #fff;
  border-radius: 16px;
  padding: 40px 36px;
  box-shadow: 0 20px 60px rgba(45, 138, 94, 0.12);
}
.logo-area {
  text-align: center;
  margin-bottom: 28px;
}
.logo {
  width: 64px;
  height: 64px;
  line-height: 64px;
  margin: 0 auto 12px;
  background: linear-gradient(135deg, #2d8a5e, #52b788);
  color: #fff;
  font-size: 28px;
  font-weight: 700;
  border-radius: 16px;
  box-shadow: 0 8px 20px rgba(45, 138, 94, 0.3);
}
h1 {
  font-size: 24px;
  margin: 0 0 4px;
  color: #1f2937;
}
.subtitle {
  margin: 0;
  color: #6b7280;
  font-size: 13px;
}
.demo-accounts {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.demo-row {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 8px;
  background: #f7f9f8;
  cursor: pointer;
  transition: all .2s;
}
.demo-row:hover { background: #e8f5ee; }
.demo-role {
  width: 110px;
  color: #2d8a5e;
  font-weight: 500;
  font-size: 13px;
}
.demo-user {
  flex: 1;
  font-family: monospace;
  color: #4b5563;
  font-size: 12px;
}
.tip {
  margin-top: 20px;
  font-size: 12px;
  color: #9ca3af;
  text-align: center;
}
</style>
