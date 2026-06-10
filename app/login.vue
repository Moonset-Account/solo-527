<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <div class="logo">🚚</div>
        <h1>青禾配送时效台</h1>
        <p class="subtitle">同城骑手调度管理平台</p>
      </div>

      <form class="login-form" @submit.prevent="handleLogin">
        <div class="form-item">
          <label>用户名</label>
          <input
            v-model="form.username"
            type="text"
            placeholder="请输入用户名"
            autocomplete="username"
          />
        </div>

        <div class="form-item">
          <label>密码</label>
          <input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            autocomplete="current-password"
          />
        </div>

        <button
          type="submit"
          class="btn btn-primary btn-lg btn-block"
          :disabled="loading"
        >
          {{ loading ? '登录中...' : '登 录' }}
        </button>

        <div v-if="error" class="login-error">
          {{ error }}
        </div>
      </form>

      <div class="login-tips">
        <p>测试账号（密码均为 123456）：</p>
        <div class="account-list">
          <span class="tag tag-primary">admin</span>
          <span class="tag tag-info">dispatcher</span>
          <span class="tag tag-success">supervisor</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'

const { login, isLoggedIn, initAuth } = useAuth()

const form = reactive({
  username: '',
  password: '',
})

const loading = ref(false)
const error = ref('')

onMounted(() => {
  initAuth()
  if (isLoggedIn.value) {
    navigateTo('/')
  }
})

const handleLogin = async () => {
  if (!form.username || !form.password) {
    error.value = '请输入用户名和密码'
    return
  }

  error.value = ''
  loading.value = true

  try {
    await login(form.username, form.password)
    navigateTo('/')
  } catch (e: any) {
    error.value = e.message || '登录失败，请重试'
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-box {
  width: 400px;
  background: #fff;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;

  .logo {
    font-size: 48px;
    margin-bottom: 12px;
  }

  h1 {
    font-size: 24px;
    color: #262626;
    margin-bottom: 8px;
    font-weight: 600;
  }

  .subtitle {
    font-size: 14px;
    color: #8c8c8c;
  }
}

.login-form {
  margin-bottom: 24px;
}

.login-error {
  margin-top: 16px;
  padding: 10px 12px;
  background: #fff1f0;
  border: 1px solid #ffa39e;
  border-radius: 4px;
  color: #ff4d4f;
  font-size: 13px;
  text-align: center;
}

.login-tips {
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
  font-size: 12px;
  color: #8c8c8c;

  p {
    margin-bottom: 8px;
  }

  .account-list {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
}
</style>
