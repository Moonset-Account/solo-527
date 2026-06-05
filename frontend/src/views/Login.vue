<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-header">
        <h1 class="title">独立书店管理系统</h1>
        <p class="subtitle">Bookstore Management System</p>
      </div>
      
      <el-form v-if="!isMobile" :model="form" :rules="rules" ref="loginForm" class="login-form">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" prefix-icon="User" size="large" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" prefix-icon="Lock" size="large" show-password />
        </el-form-item>
        <el-button type="primary" size="large" class="login-btn" :loading="loading" @click="handleLogin">
          登 录
        </el-button>
      </el-form>

      <van-form v-else @submit="handleLogin">
        <van-cell-group inset>
          <van-field
            v-model="form.username"
            label="用户名"
            placeholder="请输入用户名"
            :rules="[{ required: true, message: '请填写用户名' }]"
          />
          <van-field
            v-model="form.password"
            type="password"
            label="密码"
            placeholder="请输入密码"
            :rules="[{ required: true, message: '请填写密码' }]"
          />
        </van-cell-group>
        <div style="margin: 16px;">
          <van-button round block type="primary" native-type="submit" :loading="loading">
            登录
          </van-button>
        </div>
      </van-form>

      <div class="login-tips">
        <p>测试账号：</p>
        <p>管理员: admin / admin123</p>
        <p>店长: manager / manager123</p>
        <p>员工: staff / staff123</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { showToast } from 'vant'
import { useUserStore } from '@/stores/user'
import { isMobileDevice } from '@/utils/device'

const router = useRouter()
const userStore = useUserStore()

const isMobile = ref(isMobileDevice())
const loading = ref(false)
const loginForm = ref(null)

const form = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const handleLogin = async () => {
  if (!isMobile.value) {
    await loginForm.value.validate()
  }
  
  if (!form.username || !form.password) {
    if (isMobile.value) {
      showToast('请填写用户名和密码')
    }
    return
  }

  loading.value = true
  try {
    await userStore.login(form)
    if (isMobile.value) {
      showToast('登录成功')
      router.push('/m/home')
    } else {
      ElMessage.success('登录成功')
      router.push('/admin/dashboard')
    }
  } catch (e) {
    const msg = e.response?.data?.detail || e.response?.data?.error || '登录失败'
    if (isMobile.value) {
      showToast(msg)
    } else {
      ElMessage.error(msg)
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  window.addEventListener('resize', () => {
    isMobile.value = isMobileDevice()
  })
})
</script>

<style lang="scss" scoped>
.login-page {
  width: 100%;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-container {
  width: 100%;
  max-width: 400px;
  padding: 40px 30px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
  
  .title {
    font-size: 24px;
    font-weight: 600;
    color: #333;
    margin-bottom: 8px;
  }
  
  .subtitle {
    font-size: 14px;
    color: #999;
  }
}

.login-form {
  .login-btn {
    width: 100%;
    margin-top: 10px;
  }
}

.login-tips {
  margin-top: 20px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 8px;
  font-size: 12px;
  color: #666;
  
  p {
    margin: 4px 0;
  }
}

.is-mobile {
  .login-container {
    margin: 20px;
    padding: 30px 20px;
  }
}
</style>
