<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-left">
        <div class="brand-info">
          <el-icon :size="48" color="#fff"><Mail /></el-icon>
          <h1 class="brand-title">销售邮件智能处理台</h1>
          <p class="brand-desc">AI 驱动的高效邮件撰写与管理平台</p>
        </div>
        <ul class="feature-list">
          <li>
            <el-icon><Check /></el-icon>
            <span>智能邮件生成，提升写作效率</span>
          </li>
          <li>
            <el-icon><Check /></el-icon>
            <span>版本历史管理，轻松回溯修改</span>
          </li>
          <li>
            <el-icon><Check /></el-icon>
            <span>复核流程管控，确保内容质量</span>
          </li>
          <li>
            <el-icon><Check /></el-icon>
            <span>多维度数据分析，洞察业务表现</span>
          </li>
        </ul>
      </div>
      <div class="login-right">
        <h2 class="login-title">用户登录</h2>
        <p class="login-subtitle">欢迎回来，请登录您的账号</p>

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
          <el-form-item v-if="showCaptcha" prop="captcha">
            <div class="captcha-wrapper">
              <el-input
                v-model="loginForm.captcha"
                placeholder="请输入验证码"
                size="large"
                style="flex: 1"
              />
              <div class="captcha-img" @click="refreshCaptcha">
                <span>{{ captchaCode }}</span>
              </div>
            </div>
          </el-form-item>
          <el-form-item>
            <div class="login-options">
              <el-checkbox v-model="loginForm.remember">记住我</el-checkbox>
              <el-link type="primary" :underline="false">忘记密码？</el-link>
            </div>
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

        <div class="demo-accounts">
          <el-divider content-position="center">演示账号</el-divider>
          <div class="demo-buttons">
            <el-button size="small" @click="fillDemoAccount('sales')">
              <el-icon><User /></el-icon>
              销售账号
            </el-button>
            <el-button size="small" type="primary" @click="fillDemoAccount('admin')">
              <el-icon><Setting /></el-icon>
              管理账号
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const router = useRouter()
const route = useRoute()

const loginFormRef = ref(null)
const loading = ref(false)
const showCaptcha = ref(false)
const captchaCode = ref('')

const loginForm = reactive({
  username: '',
  password: '',
  captcha: '',
  remember: false
})

const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
}

function generateCaptcha() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let code = ''
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  captchaCode.value = code
}

function refreshCaptcha() {
  generateCaptcha()
}

function fillDemoAccount(type) {
  if (type === 'sales') {
    loginForm.username = 'demo_sales'
    loginForm.password = 'demo123456'
  } else {
    loginForm.username = 'demo_admin'
    loginForm.password = 'demo123456'
  }
  generateCaptcha()
  loginForm.captcha = captchaCode.value
}

async function handleLogin() {
  if (!loginFormRef.value) return
  try {
    await loginFormRef.value.validate()
    loading.value = true

    const mockResponse = {
      data: {
        token: 'demo-token-' + Date.now(),
        isDemo: true,
        user: {
          id: 1,
          username: loginForm.username,
          role: loginForm.username.includes('admin') ? 'admin' : 'sales',
          email: loginForm.username + '@example.com',
          name: loginForm.username.includes('admin') ? '演示管理员' : '演示销售'
        }
      }
    }

    setTimeout(async () => {
      userStore.token = mockResponse.data.token
      userStore.userInfo = mockResponse.data.user
      userStore.role = mockResponse.data.user.role
      userStore.isDemoAccount = true

      ElMessage.success('登录成功')
      const redirect = route.query.redirect || (userStore.role === 'admin' ? '/admin' : '/')
      router.push(redirect)
      loading.value = false
    }, 500)
  } catch (e) {
    loading.value = false
  }
}

onMounted(() => {
  generateCaptcha()
})
</script>

<style lang="scss" scoped>
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 900px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  overflow: hidden;
  min-height: 560px;
}

.login-left {
  flex: 1;
  background: linear-gradient(135deg, #409eff 0%, #667eea 100%);
  padding: 48px 40px;
  color: #fff;
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  .brand-info {
    .brand-title {
      font-size: 28px;
      font-weight: 700;
      margin: 16px 0 8px;
    }

    .brand-desc {
      font-size: 14px;
      opacity: 0.9;
    }
  }

  .feature-list {
    list-style: none;
    padding: 0;

    li {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 16px;
      font-size: 14px;

      .el-icon {
        font-size: 18px;
      }
    }
  }
}

.login-right {
  flex: 1;
  padding: 48px 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;

  .login-title {
    font-size: 24px;
    font-weight: 600;
    color: #303133;
    margin: 0;
  }

  .login-subtitle {
    font-size: 14px;
    color: #909399;
    margin: 8px 0 32px;
  }

  .login-form {
    .captcha-wrapper {
      display: flex;
      gap: 12px;
      width: 100%;

      .captcha-img {
        width: 110px;
        height: 40px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        user-select: none;

        span {
          color: #fff;
          font-size: 20px;
          font-weight: bold;
          letter-spacing: 4px;
          font-style: italic;
        }
      }
    }

    .login-options {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .login-btn {
      width: 100%;
    }
  }

  .demo-accounts {
    margin-top: 8px;

    .demo-buttons {
      display: flex;
      gap: 12px;
      justify-content: center;
    }
  }
}

@media (max-width: 768px) {
  .login-card {
    flex-direction: column;
    min-height: auto;
  }

  .login-left {
    padding: 32px 24px;
  }

  .login-right {
    padding: 32px 24px;
  }
}
</style>
