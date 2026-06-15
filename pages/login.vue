<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <h1>产业园租户报修工单中心</h1>
        <p class="text-secondary">请登录您的账户</p>
      </div>
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label class="form-label">用户名</label>
          <input
            v-model="form.username"
            type="text"
            class="form-input"
            placeholder="请输入用户名"
            required
          />
        </div>
        <div class="form-group">
          <label class="form-label">密码</label>
          <input
            v-model="form.password"
            type="password"
            class="form-input"
            placeholder="请输入密码"
            required
          />
        </div>
        <div v-if="error" class="alert alert-error">
          {{ error }}
        </div>
        <button type="submit" class="btn btn-primary" style="width: 100%" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>
      <div class="mt-16 text-secondary text-sm">
        <p>测试账号：</p>
        <p>管理员：admin / 123456</p>
        <p>运营专员：operator / 123456</p>
        <p>工程师：engineer / 123456</p>
        <p>租户：tenant1 / 123456</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'

definePageMeta({
  layout: false
})

const { login, initAuth, isLoggedIn } = useAuth()

const form = reactive({
  username: '',
  password: ''
})

const error = ref('')
const loading = ref(false)

onMounted(() => {
  initAuth()
  if (isLoggedIn.value) {
    navigateTo('/')
  }
})

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    await login(form.username, form.password)
    navigateTo('/')
  } catch (e: any) {
    error.value = e.data?.message || '登录失败'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-box {
  background: #fff;
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 400px;
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-header h1 {
  font-size: 24px;
  margin-bottom: 8px;
  color: #262626;
}

.text-sm {
  font-size: 12px;
}
</style>
