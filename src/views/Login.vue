<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-left">
        <div class="brand-info">
          <h1>社区菜园认领管理平台</h1>
          <p>让每一片土地都充满生机</p>
        </div>
      </div>
      <div class="login-right">
        <div class="login-form-wrapper">
          <h2>欢迎登录</h2>
          <el-form :model="form" :rules="rules" ref="formRef" @submit.prevent="handleLogin">
            <el-form-item prop="email">
              <el-input v-model="form.email" placeholder="邮箱地址" size="large" prefix-icon="User" />
            </el-form-item>
            <el-form-item prop="password">
              <el-input v-model="form.password" type="password" placeholder="密码" size="large" prefix-icon="Lock" show-password />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" size="large" class="login-btn" :loading="loading" native-type="submit">
                登录
              </el-button>
            </el-form-item>
          </el-form>
          <div class="demo-accounts">
            <p>演示账号：</p>
            <p>管理员：admin@demo.com / admin123</p>
            <p>居民：resident@demo.com / resident123</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const formRef = ref(null)
const loading = ref(false)

const form = ref({
  email: '',
  password: ''
})

const rules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
}

async function handleLogin() {
  try {
    await formRef.value.validate()
  } catch (e) {
    return
  }

  loading.value = true
  const result = await authStore.login(form.value.email, form.value.password)
  
  if (result.success) {
    ElMessage.success('登录成功')
    const redirect = route.query.redirect || '/'
    router.push(redirect)
  } else {
    ElMessage.error(result.error || '登录失败')
  }
  
  loading.value = false
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
.login-container {
  width: 900px;
  height: 500px;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}
.login-left {
  width: 50%;
  background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}
.brand-info {
  color: #fff;
  text-align: center;
}
.brand-info h1 {
  font-size: 28px;
  margin-bottom: 16px;
}
.brand-info p {
  font-size: 16px;
  opacity: 0.9;
}
.login-right {
  width: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}
.login-form-wrapper {
  width: 100%;
}
.login-form-wrapper h2 {
  text-align: center;
  margin-bottom: 32px;
  color: #303133;
}
.login-btn {
  width: 100%;
}
.demo-accounts {
  margin-top: 24px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  font-size: 12px;
  color: #606266;
}
.demo-accounts p {
  margin: 4px 0;
}
</style>
