<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-card card">
        <div class="login-header">
          <div class="login-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="logo-icon">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="9" y1="13" x2="15" y2="13"/>
              <line x1="9" y1="17" x2="15" y2="17"/>
            </svg>
          </div>
          <h1 class="login-title">合同审查审阅流系统</h1>
          <p class="login-subtitle">面向法务负责人的专业合同管理平台</p>
        </div>

        <form class="login-form" @submit.prevent="handleLogin">
          <div class="form-group">
            <label class="form-label">用户名</label>
            <input
              v-model="username"
              type="text"
              class="form-input"
              placeholder="请输入用户名"
              required
              autocomplete="username"
            />
          </div>
          <div class="form-group">
            <label class="form-label">密码</label>
            <input
              v-model="password"
              type="password"
              class="form-input"
              placeholder="请输入密码"
              required
              autocomplete="current-password"
            />
          </div>

          <div v-if="error" class="error-message">
            {{ error }}
          </div>

          <button type="submit" class="btn btn-primary btn-lg w-full" :disabled="loading">
            {{ loading ? '登录中...' : '登 录' }}
          </button>
        </form>

        <div class="login-footer">
          <div class="demo-accounts card">
            <div class="font-semibold mb-2 text-gray-700">演示账户</div>
            <div class="demo-row" v-for="acc in demoAccounts" :key="acc.username">
              <span class="badge" :class="acc.badgeClass">{{ acc.roleLabel }}</span>
              <span class="text-gray-600">{{ acc.username }} / {{ acc.password }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const auth = useAuthStore()
const ui = useUiStore()
const router = useRouter()

const username = ref('admin')
const password = ref('admin123')
const loading = ref(false)
const error = ref('')

const demoAccounts = [
  { username: 'admin', password: 'admin123', roleLabel: '系统管理员', badgeClass: 'badge-info' },
  { username: 'manager', password: '123456', roleLabel: '法务负责人', badgeClass: 'badge-warning' },
  { username: 'lawyer1', password: '123456', roleLabel: '律师', badgeClass: 'badge-lawyer' },
  { username: 'reviewer1', password: '123456', roleLabel: '复核人', badgeClass: 'badge-reviewer' }
]

async function handleLogin() {
  loading.value = true
  error.value = ''
  try {
    ui.showLoading('登录中...')
    await auth.login(username.value, password.value)
    await router.push('/')
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || '登录失败，请检查用户名和密码'
  } finally {
    loading.value = false
    ui.hideLoading()
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #2563eb 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-container {
  width: 100%;
  max-width: 440px;
}

.login-card {
  padding: 40px 36px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-logo {
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  background: linear-gradient(135deg, #2563eb, #1e40af);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.logo-icon {
  width: 36px;
  height: 36px;
}

.login-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--gray-900);
  margin-bottom: 8px;
}

.login-subtitle {
  color: var(--gray-500);
  font-size: 14px;
}

.login-form {
  margin-bottom: 24px;
}

.w-full {
  width: 100%;
}

.error-message {
  background: #fee2e2;
  color: #991b1b;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 16px;
}

.login-footer {
  border-top: 1px solid var(--gray-200);
  padding-top: 20px;
}

.demo-accounts {
  padding: 16px;
  background: var(--gray-50);
}

.demo-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 0;
  font-size: 13px;
}
</style>
