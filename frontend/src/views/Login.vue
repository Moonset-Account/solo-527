<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <el-icon :size="44" color="#4CAF50"><Collection /></el-icon>
        <h1>青禾选题协作台</h1>
        <p class="subtitle">品牌短视频数据复盘看板</p>
      </div>

      <el-form :model="form" :rules="rules" ref="formRef" class="login-form">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="请输入账号" size="large" :prefix-icon="User" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" size="large" :prefix-icon="Lock" show-password @keyup.enter="handleLogin" />
        </el-form-item>
        <el-button type="primary" size="large" class="login-btn" :loading="loading" @click="handleLogin">
          登 录
        </el-button>
      </el-form>

      <div class="tip-box">
        <p class="tip-title">测试账号（密码均为 123456）：</p>
        <div class="tip-accounts">
          <el-tag size="small" @click="fillAccount('creator01')" style="cursor:pointer;">创作者 creator01</el-tag>
          <el-tag size="small" type="warning" @click="fillAccount('reviewer01')" style="cursor:pointer;">审核员 reviewer01</el-tag>
          <el-tag size="small" type="primary" @click="fillAccount('operator01')" style="cursor:pointer;">运营 operator01</el-tag>
          <el-tag size="small" type="danger" @click="fillAccount('admin01')" style="cursor:pointer;">负责人 admin01</el-tag>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { login } from '../api/user'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()
const formRef = ref(null)
const loading = ref(false)

const form = reactive({
  username: 'admin01',
  password: '123456'
})

const rules = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

function fillAccount(username) {
  form.username = username
  form.password = '123456'
}

async function handleLogin() {
  try {
    await formRef.value.validate()
    loading.value = true
    const res = await login(form)
    if (res.code === 200) {
      userStore.setLogin(res.data)
      ElMessage.success('登录成功')
      router.push('/dashboard')
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.login-container {
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #4CAF50 100%);
  display: flex;
  align-items: center;
  justify-content: center;

  .login-box {
    width: 420px;
    background: #fff;
    border-radius: 12px;
    padding: 40px 40px 30px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);

    .login-header {
      text-align: center;
      margin-bottom: 30px;

      h1 {
        margin: 12px 0 4px;
        font-size: 24px;
        color: #303133;
      }

      .subtitle {
        color: #909399;
        font-size: 14px;
        margin: 0;
      }
    }

    .login-btn {
      width: 100%;
      margin-top: 10px;
      background: linear-gradient(135deg, #4CAF50, #45a049);
      border: none;
    }

    .tip-box {
      margin-top: 24px;
      padding: 14px;
      background: #f5f7fa;
      border-radius: 6px;

      .tip-title {
        margin: 0 0 10px;
        font-size: 13px;
        color: #606266;
      }

      .tip-accounts {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
    }
  }
}
</style>
