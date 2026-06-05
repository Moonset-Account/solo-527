<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
      <div class="text-center mb-8">
        <div class="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <el-icon :size="32" color="white"><Experiment /></el-icon>
        </div>
        <h1 class="text-2xl font-bold text-gray-800">实验室试剂库存管理系统</h1>
        <p class="text-gray-500 mt-2">Reagent Inventory Management System</p>
      </div>
      
      <el-form :model="loginForm" ref="loginFormRef" @submit.prevent="handleLogin">
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="用户名"
            size="large"
            :prefix-icon="User"
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="密码"
            size="large"
            :prefix-icon="Lock"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            class="w-full"
            :loading="loading"
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="mt-6 text-center text-sm text-gray-500">
        <p>测试账号：</p>
        <p>管理员：admin / admin123</p>
        <p>研究员：researcher1 / research123</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance } from 'element-plus'
import { User, Lock, Experiment } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const loginFormRef = ref<FormInstance>()
const loading = ref(false)

const loginForm = reactive({
  username: '',
  password: ''
})

async function handleLogin() {
  if (!loginForm.username || !loginForm.password) {
    ElMessage.warning('请输入用户名和密码')
    return
  }
  
  loading.value = true
  try {
    await userStore.login(loginForm)
    ElMessage.success('登录成功')
    if (userStore.isAdmin) {
      router.push('/dashboard')
    } else {
      router.push('/m/home')
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}
</script>
