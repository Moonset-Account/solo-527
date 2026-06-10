<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-left">
        <div class="brand">
          <h1>美甲店预约系统</h1>
          <p>专业的美甲预约与收银管理平台</p>
        </div>
      </div>
      <div class="login-right">
        <div class="login-form-wrapper">
          <h2 class="login-title">登录</h2>
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
                size="large"
                prefix-icon="User"
              />
            </el-form-item>
            <el-form-item prop="password">
              <el-input
                v-model="loginForm.password"
                type="password"
                placeholder="请输入密码"
                size="large"
                prefix-icon="Lock"
                show-password
              />
            </el-form-item>
            <el-button
              type="primary"
              size="large"
              class="login-btn"
              :loading="loading"
              @click="handleLogin"
            >
              登录
            </el-button>
          </el-form>
          <div class="login-tips">
            <p>测试账号：admin / admin123</p>
          </div>
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

const router = useRouter()
const userStore = useUserStore()
const loginFormRef = ref(null)
const loading = ref(false)

const loginForm = reactive({
  username: '',
  password: '',
})

const loginRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

async function handleLogin() {
  if (!loginFormRef.value) return
  
  try {
    await loginFormRef.value.validate()
    loading.value = true
    
    await userStore.login(loginForm)
    ElMessage.success('登录成功')
    
    if (userStore.userInfo?.role === 'customer') {
      router.push('/customer/appointment')
    } else {
      router.push('/admin/dashboard')
    }
  } catch (e) {
    // 错误已在拦截器处理
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.login-page {
  height: 100vh;
  background: linear-gradient(135deg, #e91e63 0%, #ff6090 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-container {
  width: 900px;
  height: 500px;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: flex;
}

.login-left {
  width: 50%;
  background: linear-gradient(135deg, #e91e63 0%, #ff6090 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;

  .brand {
    text-align: center;

    h1 {
      font-size: 32px;
      margin: 0 0 16px 0;
    }

    p {
      font-size: 14px;
      opacity: 0.9;
      margin: 0;
    }
  }
}

.login-right {
  width: 50%;
  display: flex;
  align-items: center;
  justify-content: center;

  .login-form-wrapper {
    width: 320px;
  }

  .login-title {
    font-size: 24px;
    text-align: center;
    margin: 0 0 32px 0;
    color: #333;
  }

  .login-form {
    .login-btn {
      width: 100%;
      margin-top: 8px;
    }
  }

  .login-tips {
    margin-top: 20px;
    text-align: center;
    font-size: 12px;
    color: #999;

    p {
      margin: 4px 0;
    }
  }
}
</style>
