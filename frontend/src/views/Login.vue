<template>
  <div class="login-container">
    <div class="login-box">
      <h2 class="login-title">物业报修和巡检管理系统</h2>
      <el-form :model="loginForm" :rules="rules" ref="loginFormRef" @submit.prevent="handleLogin">
        <el-form-item prop="username">
          <el-input v-model="loginForm.username" placeholder="请输入用户名" prefix-icon="User" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" prefix-icon="Lock" show-password />
        </el-form-item>
        <el-button type="primary" class="login-btn" @click="handleLogin" :loading="loading">登录</el-button>
      </el-form>
      <div class="test-accounts">
        <p>测试账号（密码均为 123456）：</p>
        <div class="accounts-list">
          <span @click="fillAccount('admin')">物业主管</span>
          <span @click="fillAccount('property01')">物业人员</span>
          <span @click="fillAccount('maint01')">维修人员</span>
          <span @click="fillAccount('inspector01')">巡检人员</span>
          <span @click="fillAccount('owner01')">业主</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { login } from '@/api/auth'

const router = useRouter()
const userStore = useUserStore()
const loginFormRef = ref(null)
const loading = ref(false)

const loginForm = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

function fillAccount(username) {
  loginForm.username = username
  loginForm.password = '123456'
}

async function handleLogin() {
  if (!loginForm.username || !loginForm.password) {
    ElMessage.warning('请输入用户名和密码')
    return
  }

  loading.value = true
  try {
    const res = await login(loginForm.username, loginForm.password)
    userStore.setToken(res.data.token)
    userStore.setUserInfo({
      userId: res.data.userId,
      username: res.data.username,
      realName: res.data.realName,
      role: res.data.role,
      avatar: res.data.avatar
    })
    ElMessage.success('登录成功')
    router.push('/')
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-box {
  width: 400px;
  padding: 40px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.login-title {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
  font-size: 22px;
}

.login-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
}

.test-accounts {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.test-accounts p {
  color: #999;
  font-size: 13px;
  margin-bottom: 10px;
}

.accounts-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.accounts-list span {
  padding: 4px 12px;
  background: #f0f2f5;
  border-radius: 4px;
  font-size: 12px;
  color: #666;
  cursor: pointer;
  transition: all 0.3s;
}

.accounts-list span:hover {
  background: #409eff;
  color: #fff;
}
</style>
