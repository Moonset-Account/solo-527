<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <h1 class="title">青禾会员触达台</h1>
        <p class="subtitle">美妆会员权益中心</p>
      </div>
      <el-form
        ref="loginForm"
        :model="form"
        :rules="rules"
        class="login-form"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="请输入用户名"
            size="large"
            :prefix-icon="User"
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            class="login-btn"
            :loading="loading"
            @click="handleLogin"
          >
            登 录
          </el-button>
        </el-form-item>
      </el-form>
      <div class="login-tips">
        <p>测试账号：</p>
        <p>管理员: admin / 123456</p>
        <p>品牌运营: brand / 123456</p>
        <p>门店导购: guide / 123456</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const loginForm = ref(null)
const loading = ref(false)

const form = reactive({
  username: 'guide',
  password: '123456'
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

async function handleLogin() {
  if (!loginForm.value) return
  try {
    await loginForm.value.validate()
    loading.value = true
    await userStore.login(form.username, form.password)
    ElMessage.success('登录成功')
    const redirect = route.query.redirect || '/dashboard'
    router.push(redirect)
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.login-page {
  height: 100vh;
  width: 100%;
  background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-card {
  width: 400px;
  background: #fff;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.title {
  font-size: 24px;
  color: #1f2937;
  margin: 0 0 8px;
  font-weight: 600;
}

.subtitle {
  color: #6b7280;
  margin: 0;
  font-size: 14px;
}

.login-form {
  margin-bottom: 24px;
}

.login-btn {
  width: 100%;
  background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%);
  border: none;
}

.login-tips {
  background: #f9fafb;
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 12px;
  color: #6b7280;
  line-height: 1.8;
}

.login-tips p {
  margin: 0;
}
</style>
