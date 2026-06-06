<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-teal-100">
    <div class="max-w-md w-full mx-4">
      <div class="bg-white rounded-xl shadow-xl p-8">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-green-600 mb-2">🌱 垃圾分类督导整改系统</h1>
          <p class="text-gray-500">请登录您的账户</p>
        </div>
        
        <form @submit.prevent="handleLogin" class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">用户名</label>
            <input
              v-model="username"
              type="text"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
              placeholder="请输入用户名"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">密码</label>
            <input
              v-model="password"
              type="password"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
              placeholder="请输入密码"
              @keyup.enter="handleLogin"
            />
          </div>
          
          <div v-if="error" class="text-red-500 text-sm text-center">
            {{ error }}
          </div>
          
          <button
            type="submit"
            :disabled="loading"
            class="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ loading ? '登录中...' : '登录' }}
          </button>
        </form>
        
        <div class="mt-6 pt-6 border-t border-gray-200">
          <p class="text-sm text-gray-500 text-center mb-3">演示账号</p>
          <div class="grid grid-cols-1 gap-2 text-xs text-gray-600">
            <div class="flex justify-between bg-gray-50 px-3 py-2 rounded">
              <span>街道管理员</span>
              <span class="font-mono">admin / 123456</span>
            </div>
            <div class="flex justify-between bg-gray-50 px-3 py-2 rounded">
              <span>网格员</span>
              <span class="font-mono">grid1 / 123456</span>
            </div>
            <div class="flex justify-between bg-gray-50 px-3 py-2 rounded">
              <span>物业</span>
              <span class="font-mono">property1 / 123456</span>
            </div>
          </div>
        </div>
        
        <div class="mt-4 text-center">
          <button
            @click="initSeedData"
            class="text-sm text-blue-600 hover:text-blue-800"
          >
            初始化演示数据
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

const { login } = useAuth()

const handleLogin = async () => {
  if (!username.value || !password.value) {
    error.value = '请输入用户名和密码'
    return
  }
  
  error.value = ''
  loading.value = true
  
  try {
    await login(username.value, password.value)
    await navigateTo('/')
  } catch (e: any) {
    error.value = e.data?.message || '登录失败，请重试'
  } finally {
    loading.value = false
  }
}

const initSeedData = async () => {
  try {
    const result = await $fetch('/api/seed', { method: 'POST' })
    alert(result.message + '\n\n账号信息已显示在下方，请使用对应账号登录')
  } catch (e: any) {
    alert('初始化失败：' + (e.data?.message || e.message))
  }
}
</script>
