<template>
  <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
    <div class="card" style="width: 400px; padding: 32px;">
      <h1 style="text-align: center; margin-bottom: 24px; font-size: 24px;">服务器告警变更审批系统</h1>
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label>用户名</label>
          <input v-model="form.username" placeholder="请输入用户名" required />
        </div>
        <div class="form-group">
          <label>密码</label>
          <input v-model="form.password" type="password" placeholder="请输入密码" required />
        </div>
        <div v-if="error" style="color: #ff4d4f; margin-bottom: 16px; font-size: 14px;">{{ error }}</div>
        <button type="submit" class="btn btn-primary" style="width: 100%;" :disabled="loading">
          {{ loading ? '登录中...' : '登 录' }}
        </button>
      </form>
      <div style="margin-top: 20px; padding: 12px; background: #f5f7fa; border-radius: 4px; font-size: 12px; color: #6b7280;">
        <div><strong>测试账号：</strong></div>
        <div>管理员：admin / 123456</div>
        <div>门店运维：operator01 / 123456</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { login } = useAuth()
const form = reactive({ username: '', password: '' })
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  loading.value = true
  error.value = ''
  try {
    await login(form.username, form.password)
    await navigateTo('/')
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : '登录失败'
  } finally {
    loading.value = false
  }
}
</script>
