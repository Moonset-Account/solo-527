<template>
  <div class="login-page">
    <div class="login-bg"></div>
    <div class="login-box">
      <div class="login-header">
        <div class="brand">
          <el-icon :size="32" color="#409eff"><DataAnalysis /></el-icon>
          <div class="brand-text">
            <h1>用户增长异常监控台</h1>
            <p>快速发现 · 精准定位 · 高效复盘</p>
          </div>
        </div>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        size="large"
        class="login-form"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="请输入用户名"
            :prefix-icon="User"
            autocomplete="username"
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            :prefix-icon="Lock"
            show-password
            autocomplete="current-password"
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        <el-button
          type="primary"
          class="login-btn"
          :loading="loading"
          @click="handleLogin"
        >
          登 录
        </el-button>
      </el-form>

      <div class="login-tips">
        <el-alert
          title="演示账号"
          type="info"
          :closable="false"
          show-icon
        >
          <div class="account-list">
            <div>管理员 admin / admin123</div>
            <div>运营经理 manager / manager123</div>
            <div>运营专员 operator / operator123</div>
            <div>查看员 viewer / viewer123</div>
          </div>
        </el-alert>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { DataAnalysis, User, Lock } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  username: 'manager',
  password: 'manager123'
})

const rules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, min: 6, message: '密码长度至少 6 位', trigger: 'blur' }]
}

async function handleLogin() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    loading.value = true
    await userStore.doLogin(form.username, form.password)
    ElMessage.success('登录成功')
    const redirect = route.query.redirect as string || '/dashboard'
    router.replace(redirect)
  } catch (e: any) {
    if (e?.message) ElMessage.error(e.message)
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.login-page {
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;

  .login-bg {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at 20% 30%, rgba(64, 158, 255, 0.15), transparent 50%),
      radial-gradient(circle at 80% 70%, rgba(103, 194, 58, 0.12), transparent 50%),
      linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    opacity: 0.95;
  }
}

.login-box {
  position: relative;
  width: 440px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.18);
  padding: 44px 40px 32px;

  .login-header {
    text-align: center;
    margin-bottom: 32px;

    .brand {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 14px;

      .brand-text h1 {
        font-size: 22px;
        font-weight: 700;
        color: $text-primary;
        margin: 0;
        line-height: 1.3;
      }

      .brand-text p {
        font-size: 13px;
        color: $text-secondary;
        margin: 4px 0 0;
      }
    }
  }

  .login-form {
    margin-bottom: 24px;

    :deep(.el-form-item) {
      margin-bottom: 20px;
    }
  }

  .login-btn {
    width: 100%;
    height: 44px;
    font-size: 16px;
    font-weight: 500;
    border-radius: 8px;
  }

  .login-tips {
    .account-list {
      margin-top: 4px;
      font-size: 12px;
      line-height: 1.8;
      color: $text-regular;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2px 12px;
    }
  }
}
</style>
