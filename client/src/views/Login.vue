<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1>品牌短视频审稿发布系统</h1>
        <p>Brand Video Review & Publish Platform</p>
      </div>
      <el-form ref="formRef" :model="form" label-width="80px" class="login-form">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleLogin" style="width: 100%">登 录</el-button>
        </el-form-item>
      </el-form>
      <div class="login-tip">
        <el-alert type="info" :closable="false" show-icon>
          <template #title>演示账号：任意用户名密码即可登录</template>
        </el-alert>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store'

const router = useRouter()
const userStore = useUserStore()
const formRef = ref()
const form = reactive({
  username: 'admin',
  password: '123456'
})

function handleLogin() {
  if (!form.username || !form.password) {
    ElMessage.warning('请输入用户名和密码')
    return
  }
  userStore.setUser({
    id: 'u001',
    name: form.username === 'admin' ? '管理员' : form.username,
    role: form.username === 'admin' ? 'admin' : 'user'
  })
  ElMessage.success('登录成功')
  router.push('/')
}
</script>

<style scoped lang="scss">
.login-container {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.login-card {
  width: 420px;
  padding: 40px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}
.login-header {
  text-align: center;
  margin-bottom: 30px;
  h1 {
    margin: 0 0 8px 0;
    font-size: 22px;
    color: #303133;
  }
  p {
    margin: 0;
    color: #909399;
    font-size: 13px;
  }
}
.login-form {
  margin-bottom: 20px;
}
.login-tip {
  font-size: 12px;
}
</style>
