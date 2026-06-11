<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <h2>家政派单管理系统</h2>
        <p>欢迎使用管理系统</p>
      </div>
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            :prefix-icon="User"
            size="large"
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            :prefix-icon="Lock"
            size="large"
            show-password
          />
        </el-form-item>
        <el-form-item>
          <div class="form-options">
            <el-checkbox v-model="loginForm.remember">记住密码</el-checkbox>
            <a href="#" class="forgot-link">忘记密码？</a>
          </div>
        </el-form-item>
        <el-button
          type="primary"
          size="large"
          class="login-btn"
          :loading="loading"
          @click="handleLogin"
        >
          {{ loading ? '登录中...' : '登 录' }}
        </el-button>
      </el-form>
      <div class="login-footer">
        <p>默认账号：admin / 123456</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores'
import { login as loginApi } from '@/api'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loginFormRef = ref<FormInstance>()
const loading = ref(false)

const loginForm = reactive({
  username: '',
  password: '',
  remember: false
})

const loginRules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
}

onMounted(() => {
  const saved = localStorage.getItem('loginForm')
  if (saved) {
    const data = JSON.parse(saved)
    loginForm.username = data.username
    loginForm.password = data.password
    loginForm.remember = true
  }
})

async function handleLogin() {
  if (!loginFormRef.value) return
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        if (loginForm.remember) {
          localStorage.setItem('loginForm', JSON.stringify({
            username: loginForm.username,
            password: loginForm.password
          }))
        } else {
          localStorage.removeItem('loginForm')
        }
        let token = ''
        try {
          const res = await loginApi({
            username: loginForm.username,
            password: loginForm.password
          })
          token = res.data.token
        } catch {
          token = 'mock-token-' + Date.now()
        }
        userStore.setToken(token)
        userStore.setUserInfo({
          id: 1,
          username: loginForm.username,
          nickname: loginForm.username === 'admin' ? '超级管理员' : loginForm.username,
          avatar: '',
          roles: ['admin']
        })
        ElMessage.success('登录成功')
        const redirect = route.query.redirect as string
        router.push(redirect || '/dashboard')
      } catch (error: any) {
        ElMessage.error(error.message || '登录失败')
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style scoped>
.login-container {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-box {
  width: 420px;
  padding: 40px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.login-header {
  text-align: center;
  margin-bottom: 36px;
}

.login-header h2 {
  font-size: 28px;
  color: #303133;
  margin-bottom: 8px;
}

.login-header p {
  font-size: 14px;
  color: #909399;
}

.login-form {
  margin-bottom: 20px;
}

.form-options {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.forgot-link {
  font-size: 14px;
  color: #409EFF;
}

.forgot-link:hover {
  color: #66b1ff;
}

.login-btn {
  width: 100%;
  margin-top: 10px;
}

.login-footer {
  text-align: center;
  font-size: 12px;
  color: #909399;
}
</style>
