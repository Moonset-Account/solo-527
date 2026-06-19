<template>
  <div class="login-container">
    <div class="login-wrapper">
      <div class="login-brand">
        <div class="brand-logo">
          <el-icon :size="48" color="#fff"><HomeFilled /></el-icon>
        </div>
        <h1 class="brand-title">装修线索报价协同系统</h1>
        <p class="brand-subtitle">Decoration Lead Quotation Collaboration System</p>
      </div>
      <el-card class="login-card" shadow="hover">
        <h2 class="login-title">用户登录</h2>
        <el-form :model="loginForm" :rules="loginRules" ref="loginFormRef" label-position="top">
          <el-form-item label="用户名" prop="username">
            <el-input v-model="loginForm.username" placeholder="请输入用户名" :prefix-icon="User" size="large" />
          </el-form-item>
          <el-form-item label="密码" prop="password">
            <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" :prefix-icon="Lock" size="large" show-password @keyup.enter="handleLogin" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" size="large" class="login-btn" :loading="loading" @click="handleLogin">登录</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, HomeFilled } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const loginFormRef = ref(null)

const loginForm = reactive({
  username: '',
  password: ''
})

const loginRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const handleLogin = async () => {
  if (!loginFormRef.value) return
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        await userStore.login(loginForm)
        ElMessage.success('登录成功')
        router.push('/dashboard')
      } catch (e) {
        console.error(e)
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style lang="scss" scoped>
.login-container {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
}

.login-wrapper {
  display: flex;
  align-items: center;
  gap: 80px;
}

.login-brand {
  text-align: center;
  color: #fff;

  .brand-logo {
    width: 80px;
    height: 80px;
    margin: 0 auto 24px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .brand-title {
    font-size: 32px;
    font-weight: 700;
    margin: 0 0 12px;
  }

  .brand-subtitle {
    font-size: 14px;
    opacity: 0.8;
    margin: 0;
  }
}

.login-card {
  width: 400px;
  padding: 16px;

  .login-title {
    font-size: 24px;
    font-weight: 600;
    margin: 0 0 24px;
    text-align: center;
    color: var(--text-primary);
  }

  .login-btn {
    width: 100%;
  }
}
</style>
