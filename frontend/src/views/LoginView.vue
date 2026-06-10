<template>
  <div class="login-page">
    <div class="login-bg">
      <div class="shape shape-1"></div>
      <div class="shape shape-2"></div>
      <div class="shape shape-3"></div>
    </div>
    <div class="login-container">
      <div class="login-left">
        <div class="logo-area">
          <div class="logo-badge">
            <el-icon :size="36" color="#fff"><FirstAidKit /></el-icon>
          </div>
          <h1 class="brand-title">青禾预约候补台</h1>
          <p class="brand-subtitle">专业口腔洁牙预约管理系统</p>
        </div>
        <div class="features">
          <div class="feature-item">
            <el-icon :size="20" color="#2ab99f"><Calendar /></el-icon>
            <span>智能排班 & 预约调度</span>
          </div>
          <div class="feature-item">
            <el-icon :size="20" color="#2ab99f"><DataAnalysis /></el-icon>
            <span>预约转化 & 爽约率分析</span>
          </div>
          <div class="feature-item">
            <el-icon :size="20" color="#2ab99f"><BellFilled /></el-icon>
            <span>异常待办 & 风险预警</span>
          </div>
        </div>
      </div>
      <div class="login-right">
        <el-card class="login-card" shadow="hover">
          <h2 class="login-title">欢迎登录</h2>
          <p class="login-desc">请输入您的账号信息进入系统</p>
          <el-form
            ref="loginFormRef"
            :model="loginForm"
            :rules="loginRules"
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
                @keyup.enter="handleLogin"
              />
            </el-form-item>
            <el-button
              type="primary"
              size="large"
              class="login-btn"
              :loading="loading"
              @click="handleLogin"
            >
              登 录
            </el-button>
          </el-form>
          <div class="demo-tip">
            <el-icon><InfoFilled /></el-icon>
            <span>演示账号：admin / admin123</span>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { User, Lock, Calendar, DataAnalysis, BellFilled, FirstAidKit, InfoFilled } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const loginFormRef = ref<FormInstance>()
const loading = ref(false)

const loginForm = reactive({
  username: 'admin',
  password: 'admin123',
})

const loginRules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

const handleLogin = async () => {
  if (!loginFormRef.value) return
  await loginFormRef.value.validate(async (valid) => {
    if (!valid) return
    loading.value = true
    try {
      await userStore.login(loginForm.username, loginForm.password)
      ElMessage.success('登录成功')
      const redirect = (route.query.redirect as string) || '/dashboard'
      router.replace(redirect)
    } catch (err: any) {
      ElMessage.error(err.message || '登录失败，请重试')
    } finally {
      loading.value = false
    }
  })
}

onMounted(() => {
  userStore.restoreFromStorage()
  if (userStore.isLoggedIn) {
    router.replace('/dashboard')
  }
})
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #1f9580 0%, #2ab99f 50%, #53d2bb 100%);
}

.login-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.shape {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.5;
}
.shape-1 {
  width: 400px; height: 400px;
  background: #6c7ae0;
  top: -100px; left: -100px;
}
.shape-2 {
  width: 350px; height: 350px;
  background: #ffd89b;
  bottom: -80px; right: -80px;
}
.shape-3 {
  width: 250px; height: 250px;
  background: #53d2bb;
  top: 40%; right: 20%;
  opacity: 0.4;
}

.login-container {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  min-height: 100vh;
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px;
  gap: 40px;
}

@media (max-width: 960px) {
  .login-container {
    grid-template-columns: 1fr;
    padding: 20px;
  }
  .login-left { display: none; }
}

.login-left {
  color: #fff;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 40px;
}

.logo-area {
  margin-bottom: 60px;
}
.logo-badge {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  border: 1px solid rgba(255,255,255,0.3);
}
.brand-title {
  font-size: 44px;
  font-weight: 700;
  margin: 0 0 12px 0;
  letter-spacing: 2px;
}
.brand-subtitle {
  font-size: 18px;
  margin: 0;
  opacity: 0.9;
}

.features {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 16px;
  background: rgba(255,255,255,0.12);
  backdrop-filter: blur(10px);
  padding: 14px 20px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.18);
  width: fit-content;
  min-width: 280px;
}

.login-right {
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-card {
  width: 100%;
  max-width: 420px;
  padding: 20px 8px;
  border-radius: 16px !important;
  border: none;
}
:deep(.el-card__body) {
  padding: 40px 36px;
}

.login-title {
  margin: 0 0 8px;
  font-size: 28px;
  font-weight: 600;
  color: #303133;
}
.login-desc {
  margin: 0 0 32px;
  color: #909399;
  font-size: 14px;
}

.login-btn {
  width: 100%;
  margin-top: 12px;
  background: #2ab99f !important;
  border-color: #2ab99f !important;
  height: 44px !important;
  font-size: 16px;
  border-radius: 8px;
}
.login-btn:hover {
  background: #1f9580 !important;
}

.demo-tip {
  margin-top: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #909399;
  font-size: 13px;
  background: #f5f7fa;
  padding: 10px;
  border-radius: 8px;
}
</style>
