<template>
  <div class="user-layout">
    <header class="header">
      <div class="header-content">
        <div class="logo" @click="goHome">
          <el-icon :size="28" color="#409eff"><Tools /></el-icon>
          <span class="logo-text">家电维修服务</span>
          <span v-if="isDemoMode" class="demo-tag">演示</span>
        </div>
        <nav class="nav">
          <router-link to="/" class="nav-item">首页</router-link>
          <router-link to="/order/create" class="nav-item">快速下单</router-link>
          <router-link to="/orders" class="nav-item">我的订单</router-link>
        </nav>
        <div class="user-actions">
          <template v-if="userStore.isLoggedIn">
            <el-dropdown @command="handleCommand">
              <span class="user-info">
                <el-avatar :size="32">
                  {{ userStore.userInfo?.nickname?.charAt(0) || '用' }}
                </el-avatar>
                <span class="username">{{ userStore.userInfo?.nickname || '用户' }}</span>
                <el-icon><ArrowDown /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                  <el-dropdown-item command="orders">我的订单</el-dropdown-item>
                  <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
          <template v-else>
            <el-button type="primary" @click="showLogin = true">登录</el-button>
          </template>
        </div>
      </div>
    </header>
    <main class="main-content">
      <router-view />
    </main>
    <footer class="footer">
      <div class="footer-content">
        <div class="footer-section">
          <h4>关于我们</h4>
          <p>专业家电维修服务平台</p>
          <p>服务热线：{{ appStore.config.servicePhone }}</p>
        </div>
        <div class="footer-section">
          <h4>服务时间</h4>
          <p>{{ appStore.config.serviceTime }}</p>
        </div>
        <div class="footer-section">
          <h4>服务区域</h4>
          <p>{{ appStore.config.serviceAreas.join('、') }}</p>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2024 家电维修服务平台 版权所有</p>
      </div>
    </footer>

    <el-dialog v-model="showLogin" title="用户登录" width="400px" :close-on-click-modal="false">
      <el-form :model="loginForm" label-width="80px">
        <el-form-item label="手机号">
          <el-input v-model="loginForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="验证码">
          <div class="code-input">
            <el-input v-model="loginForm.code" placeholder="请输入验证码" />
            <el-button :disabled="codeCountdown > 0" @click="sendCode">
              {{ codeCountdown > 0 ? `${codeCountdown}s后重试` : '获取验证码' }}
            </el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showLogin = false">取消</el-button>
        <el-button type="primary" @click="handleLogin">登录</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Tools, ArrowDown } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { useAppStore } from '@/stores/app'
import { login, sendSmsCode } from '@/api/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const appStore = useAppStore()

const isDemoMode = computed(() => appStore.isDemoMode)

const showLogin = ref(false)
const loginForm = ref({
  phone: '',
  code: ''
})
const codeCountdown = ref(0)

function goHome() {
  router.push('/')
}

function handleCommand(command: string) {
  switch (command) {
    case 'profile':
      router.push('/profile')
      break
    case 'orders':
      router.push('/orders')
      break
    case 'logout':
      userStore.logout()
      ElMessage.success('已退出登录')
      break
  }
}

async function sendCode() {
  if (!loginForm.value.phone) {
    ElMessage.warning('请先输入手机号')
    return
  }
  
  if (isDemoMode.value) {
    ElMessage.success('演示模式：验证码已发送（默认 123456）')
    codeCountdown.value = 60
    startCountdown()
    return
  }
  
  try {
    await sendSmsCode(loginForm.value.phone)
    ElMessage.success('验证码已发送')
    codeCountdown.value = 60
    startCountdown()
  } catch (error) {
    // error handled by interceptor
  }
}

function startCountdown() {
  const timer = setInterval(() => {
    codeCountdown.value--
    if (codeCountdown.value <= 0) {
      clearInterval(timer)
    }
  }, 1000)
}

async function handleLogin() {
  if (isDemoMode.value) {
    userStore.setUser(
      {
        id: 1,
        phone: loginForm.value.phone || '13800138000',
        nickname: '演示用户'
      },
      'demo-token'
    )
    showLogin.value = false
    ElMessage.success('登录成功')
    return
  }
  
  try {
    const res = await login(loginForm.value)
    userStore.setUser(res.data.user, res.data.token)
    showLogin.value = false
    ElMessage.success('登录成功')
  } catch (error) {
    // error handled by interceptor
  }
}
</script>

<style lang="scss" scoped>
.user-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;

  .header-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .logo {
    display: flex;
    align-items: center;
    cursor: pointer;

    .logo-text {
      margin-left: 10px;
      font-size: 20px;
      font-weight: 700;
      color: #303133;
    }
  }

  .nav {
    display: flex;
    gap: 32px;

    .nav-item {
      color: #606266;
      font-size: 15px;
      transition: color 0.3s;

      &:hover, &.router-link-active {
        color: #409eff;
      }
    }
  }

  .user-actions {
    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;

      .username {
        color: #606266;
      }
    }
  }
}

.main-content {
  flex: 1;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 24px 20px;
}

.footer {
  background: #2c3e50;
  color: #ecf0f1;
  padding: 40px 20px 20px;

  .footer-content {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    justify-content: space-around;
    gap: 40px;

    .footer-section {
      h4 {
        margin-bottom: 12px;
        font-size: 16px;
      }

      p {
        margin: 6px 0;
        color: #bdc3c7;
        font-size: 14px;
      }
    }
  }

  .footer-bottom {
    text-align: center;
    padding-top: 20px;
    margin-top: 20px;
    border-top: 1px solid #34495e;
    color: #95a5a6;
    font-size: 13px;
  }
}

.code-input {
  display: flex;
  gap: 10px;
  flex: 1;
}

@media (max-width: 768px) {
  .header .nav {
    display: none;
  }

  .footer .footer-content {
    flex-direction: column;
    gap: 24px;
  }
}
</style>
