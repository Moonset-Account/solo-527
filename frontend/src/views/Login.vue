<template>
  <div class="login-container">
    <el-card class="login-card" shadow="hover">
      <h2 class="login-title">职场课程会员学习站</h2>
      <p class="login-subtitle">提升职场竞争力，从这里开始</p>
      <el-form :model="form" :rules="rules" ref="formRef" label-position="top" @submit.prevent="handleLogin">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" :prefix-icon="User" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" :prefix-icon="Lock" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" class="login-btn" :loading="loading" native-type="submit">登 录</el-button>
        </el-form-item>
      </el-form>
      <div class="login-footer">
        <span>还没有账号？</span>
        <router-link to="/register">立即注册</router-link>
      </div>
      <el-divider>测试账号</el-divider>
      <div class="test-accounts">
        <el-tag type="danger" effect="plain">管理员 admin / 123456</el-tag>
        <el-tag type="warning" effect="plain">讲师 teacher01 / 123456</el-tag>
        <el-tag type="success" effect="plain">会员 member01 / 123456</el-tag>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const formRef = ref(null)
const loading = ref(false)
const form = reactive({ username: '', password: '' })
const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const handleLogin = async () => {
  await formRef.value.validate()
  loading.value = true
  try {
    await userStore.login(form)
    ElMessage.success('登录成功')
    const redirect = route.query.redirect || '/'
    router.push(redirect)
  } catch (e) {
    const msg = e?.response?.data?.message || e?.message || '用户名或密码错误'
    ElMessage.error(msg)
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
.login-card {
  width: 100%;
  max-width: 420px;
  border-radius: 16px;
}
.login-title {
  text-align: center;
  margin: 10px 0 6px;
  color: #303133;
  font-size: 24px;
}
.login-subtitle {
  text-align: center;
  color: #909399;
  margin-bottom: 30px;
  font-size: 14px;
}
.login-btn {
  width: 100%;
  height: 44px;
}
.login-footer {
  text-align: center;
  margin-top: 16px;
  color: #909399;
  font-size: 14px;
}
.login-footer a {
  color: #409eff;
  margin-left: 6px;
}
.test-accounts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}
</style>
