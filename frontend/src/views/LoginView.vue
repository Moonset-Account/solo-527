<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <el-icon :size="40" color="#67c23a"><Aim /></el-icon>
        <h1>青禾收入结算台</h1>
        <p class="subtitle">播客品牌合作与会员收入管理平台</p>
      </div>
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        size="large"
        @submit.prevent="handleLogin"
      >
        <el-form-item prop="email">
          <el-input v-model="form.email" placeholder="请输入邮箱" :prefix-icon="User" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            :prefix-icon="Lock"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" class="login-btn" native-type="submit">
            登 录
          </el-button>
        </el-form-item>
      </el-form>
      <div class="login-footer">
        <el-button link type="primary" @click="goSubscribe">
          <el-icon><Vip /></el-icon> 开通会员
        </el-button>
        <span class="divider">|</span>
        <span class="tips">默认账户：admin@qinghe.com / admin123</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useDictStore } from '@/stores/dict'

const router = useRouter()
const userStore = useUserStore()
const dictStore = useDictStore()

const formRef = ref<FormInstance>()
const loading = ref(false)
const form = reactive({
  email: 'admin@qinghe.com',
  password: 'admin123'
})

const rules: FormRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const handleLogin = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        await userStore.login(form.email, form.password)
        await dictStore.loadAll()
        ElMessage.success('登录成功')
        router.push('/dashboard')
      } finally {
        loading.value = false
      }
    }
  })
}

const goSubscribe = () => {
  router.push('/subscribe')
}
</script>

<style lang="scss" scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

  .login-card {
    width: 420px;
    background: #fff;
    padding: 40px;
    border-radius: 12px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);

    .login-header {
      text-align: center;
      margin-bottom: 32px;

      h1 {
        margin: 12px 0 8px;
        font-size: 24px;
        color: #303133;
      }

      .subtitle {
        color: #909399;
        font-size: 14px;
      }
    }

    .login-btn {
      width: 100%;
      height: 44px;
      font-size: 16px;
    }

    .login-footer {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin-top: 16px;
      font-size: 13px;

      .divider {
        color: #dcdfe6;
      }

      .tips {
        color: #909399;
      }
    }
  }
}
</style>
