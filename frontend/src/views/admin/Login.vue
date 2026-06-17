<template>
  <div class="admin-login-page">
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <div class="logo">
            <el-icon :size="40" color="#409eff"><Tools /></el-icon>
          </div>
          <h1 class="title">管理后台</h1>
          <p class="subtitle">家电维修服务平台</p>
          <span v-if="isDemoMode" class="demo-tag">演示模式</span>
        </div>
        <el-form
          ref="formRef"
          :model="loginForm"
          :rules="rules"
          class="login-form"
          @keyup.enter="handleLogin"
        >
          <el-form-item prop="username">
            <el-input
              v-model="loginForm.username"
              placeholder="请输入用户名"
              size="large"
              :prefix-icon="User"
            />
          </el-form-item>
          <el-form-item prop="password">
            <el-input
              v-model="loginForm.password"
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
        <div class="login-footer">
          <router-link to="/">返回首页</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { Tools, User, Lock } from '@element-plus/icons-vue'
import { useAdminStore } from '@/stores/admin'
import { useAppStore } from '@/stores/app'
import { adminLogin } from '@/api/admin'

const router = useRouter()
const adminStore = useAdminStore()
const appStore = useAppStore()

const isDemoMode = computed(() => appStore.isDemoMode)

const formRef = ref<FormInstance>()
const loading = ref(false)

const loginForm = reactive({
  username: 'admin',
  password: '123456'
})

const rules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

async function handleLogin() {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  loading.value = true

  if (isDemoMode.value) {
    setTimeout(() => {
      adminStore.setAdmin(
        {
          id: 1,
          username: 'admin',
          nickname: '管理员',
          role: 'admin'
        },
        'demo-admin-token'
      )
      loading.value = false
      ElMessage.success('登录成功')
      router.push('/admin/dashboard')
    }, 1000)
    return
  }

  try {
    const res = await adminLogin(loginForm)
    adminStore.setAdmin(res.data.admin, res.data.token)
    ElMessage.success('登录成功')
    router.push('/admin/dashboard')
  } catch (error) {
    // error handled by interceptor
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.admin-login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;

  .login-container {
    width: 100%;
    max-width: 420px;
  }

  .login-card {
    background: #fff;
    border-radius: 16px;
    padding: 40px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  }

  .login-header {
    text-align: center;
    margin-bottom: 30px;
    position: relative;

    .logo {
      display: flex;
      justify-content: center;
      margin-bottom: 16px;
    }

    .title {
      font-size: 28px;
      font-weight: 700;
      color: #303133;
      margin: 0 0 8px 0;
    }

    .subtitle {
      color: #909399;
      margin: 0;
    }

    .demo-tag {
      position: absolute;
      top: 0;
      right: 0;
      background: linear-gradient(135deg, #ff6b6b, #feca57);
      color: #fff;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
    }
  }

  .login-form {
    .login-btn {
      width: 100%;
      font-size: 16px;
    }
  }

  .login-footer {
    text-align: center;
    margin-top: 20px;

    a {
      color: #909399;
      font-size: 14px;

      &:hover {
        color: #409eff;
      }
    }
  }
}
</style>
