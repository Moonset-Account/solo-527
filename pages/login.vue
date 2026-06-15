<script setup lang="ts">
import { User, Lock, LogIn, Sparkles } from 'lucide-vue-next'

const router = useRouter()
const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  if (!username.value || !password.value) {
    error.value = '请输入用户名和密码'
    return
  }
  loading.value = true
  error.value = ''
  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: { username: username.value, password: password.value },
    })
    router.push('/')
  } catch (e: any) {
    error.value = e?.data?.message || '登录失败，请重试'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-100">
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-40 -right-40 w-80 h-80 bg-primary-200/40 rounded-full blur-3xl"></div>
      <div class="absolute -bottom-40 -left-40 w-96 h-96 bg-primary-300/30 rounded-full blur-3xl"></div>
    </div>

    <UCard class="w-full max-w-md shadow-cardHover border-0 relative z-10 p-2">
      <template #body>
        <div class="flex flex-col items-center mb-8 pt-4">
          <div class="w-16 h-16 rounded-2xl bg-primary-500 flex items-center justify-center mb-4 shadow-lg shadow-primary-500/30">
            <Sparkles class="w-8 h-8 text-white" />
          </div>
          <h1 class="text-2xl font-bold text-gray-800">牙科诊所 CRM</h1>
          <p class="text-gray-500 mt-1">客户画像管理系统</p>
        </div>

        <UForm @submit.prevent="handleLogin" class="space-y-5">
          <UFormGroup label="用户名" required>
            <UInput v-model="username" placeholder="请输入用户名" size="lg">
              <template #leading>
                <User class="w-5 h-5 text-gray-400" />
              </template>
            </UInput>
          </UFormGroup>

          <UFormGroup label="密码" required>
            <UInput v-model="password" type="password" placeholder="请输入密码" size="lg" @keyup.enter="handleLogin">
              <template #leading>
                <Lock class="w-5 h-5 text-gray-400" />
              </template>
            </UInput>
          </UFormGroup>

          <div v-if="error" class="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">
            {{ error }}
          </div>

          <UButton
            type="submit"
            color="primary"
            size="lg"
            class="w-full font-medium"
            :loading="loading"
          >
            <template #leading>
              <LogIn class="w-5 h-5" />
            </template>
            登录系统
          </UButton>
        </UForm>

        <p class="text-center text-xs text-gray-400 mt-8 pb-2">
          © 2026 牙科诊所客户画像管理系统
        </p>
      </template>
    </UCard>
  </div>
</template>
