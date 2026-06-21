<template>
  <n-config-provider :theme-overrides="themeOverrides">
    <n-message-provider>
      <div class="login-page min-h-screen w-full flex items-center justify-center relative overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50"></div>

        <div class="absolute top-10 left-10 opacity-20">
          <n-icon :size="120" color="#1A8A7D">
            <PawSharp />
          </n-icon>
        </div>
        <div class="absolute bottom-10 right-10 opacity-20">
          <n-icon :size="100" color="#FF8C42">
            <PawSharp />
          </n-icon>
        </div>
        <div class="absolute top-1/4 right-1/4 opacity-10">
          <n-icon :size="80" color="#1A8A7D">
            <HeartSharp />
          </n-icon>
        </div>
        <div class="absolute bottom-1/3 left-1/4 opacity-10">
          <n-icon :size="60" color="#FF8C42">
            <HeartSharp />
          </n-icon>
        </div>

        <div class="login-container relative z-10 w-full max-w-md mx-4">
          <n-card class="!rounded-3xl !shadow-2xl overflow-hidden" content-style="padding: 0;">
            <div class="bg-gradient-to-r from-[#1A8A7D] to-[#2AA89A] px-8 pt-10 pb-8 text-center">
              <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm mb-4">
                <n-icon :size="44" color="#FFFFFF">
                  <PawSharp />
                </n-icon>
              </div>
              <h1 class="text-2xl font-bold text-white mb-1">宠物洗护订单管理</h1>
              <p class="text-teal-100 text-sm">Pet Care Management System</p>
            </div>

            <div class="px-8 py-8">
              <n-form
                ref="formRef"
                :model="formData"
                :rules="rules"
                label-placement="left"
                size="large"
                class="space-y-5"
              >
                <n-form-item label="用户名" path="username">
                  <n-input
                    v-model:value="formData.username"
                    placeholder="请输入用户名"
                    :bordered="false"
                    class="!bg-gray-50 !rounded-xl"
                  >
                    <template #prefix>
                      <n-icon size="18" color="#999">
                        <PersonCircleSharp />
                      </n-icon>
                    </template>
                  </n-input>
                </n-form-item>

                <n-form-item label="密码" path="password">
                  <n-input
                    v-model:value="formData.password"
                    type="password"
                    placeholder="请输入密码"
                    show-password-on="click"
                    :bordered="false"
                    class="!bg-gray-50 !rounded-xl"
                    @keyup.enter="handleLogin"
                  >
                    <template #prefix>
                      <n-icon size="18" color="#999">
                        <LockClosedSharp />
                      </n-icon>
                    </template>
                  </n-input>
                </n-form-item>

                <div class="flex items-center justify-between text-sm pt-2">
                  <n-checkbox v-model:checked="rememberMe">记住我</n-checkbox>
                  <a href="#" class="text-[#1A8A7D] hover:underline">忘记密码?</a>
                </div>

                <n-button
                  type="primary"
                  size="large"
                  block
                  class="!h-12 !rounded-xl !mt-6 !text-base font-medium"
                  :loading="loading"
                  @click="handleLogin"
                >
                  <template #icon>
                    <n-icon>
                      <LogInSharp />
                    </n-icon>
                  </template>
                  登 录
                </n-button>
              </n-form>

              <div class="mt-6 flex items-center gap-4 text-xs text-gray-400">
                <div class="flex-1 h-px bg-gray-200"></div>
                <span>欢迎使用宠物管理系统</span>
                <div class="flex-1 h-px bg-gray-200"></div>
              </div>

              <div class="mt-5 flex justify-center gap-6">
                <div class="text-center">
                  <div class="w-10 h-10 mx-auto rounded-full bg-rose-50 flex items-center justify-center mb-1">
                    <n-icon size="18" color="#FF5A5F">
                      <HeartSharp />
                    </n-icon>
                  </div>
                  <span class="text-xs text-gray-500">领养中心</span>
                </div>
                <div class="text-center">
                  <div class="w-10 h-10 mx-auto rounded-full bg-orange-50 flex items-center justify-center mb-1">
                    <n-icon size="18" color="#FF8C42">
                      <SparklesSharp />
                    </n-icon>
                  </div>
                  <span class="text-xs text-gray-500">洗护服务</span>
                </div>
                <div class="text-center">
                  <div class="w-10 h-10 mx-auto rounded-full bg-indigo-50 flex items-center justify-center mb-1">
                    <n-icon size="18" color="#6366F1">
                      <CalendarSharp />
                    </n-icon>
                  </div>
                  <span class="text-xs text-gray-500">预约寄养</span>
                </div>
              </div>
            </div>
          </n-card>

          <p class="text-center text-xs text-gray-400 mt-6">
            © 2024 宠物洗护订单售后管理系统 - 让每一个毛孩子都被温柔以待
          </p>
        </div>
      </div>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import type { FormInst, FormRules } from 'naive-ui'
import {
  PawSharp,
  HeartSharp,
  PersonCircleSharp,
  LockClosedSharp,
  LogInSharp,
  SparklesSharp,
  CalendarSharp,
} from '@vicons/ionicons5'

definePageMeta({
  layout: false,
})

const router = useRouter()
const authStore = useAuthStore()
const formRef = ref<FormInst | null>(null)
const loading = ref(false)
const rememberMe = ref(false)

const formData = reactive({
  username: '',
  password: '',
})

const rules: FormRules = {
  username: [
    {
      required: true,
      message: '请输入用户名',
      trigger: 'blur',
    },
    {
      min: 2,
      max: 20,
      message: '用户名长度为2-20个字符',
      trigger: 'blur',
    },
  ],
  password: [
    {
      required: true,
      message: '请输入密码',
      trigger: 'blur',
    },
    {
      min: 6,
      message: '密码至少6个字符',
      trigger: 'blur',
    },
  ],
}

const themeOverrides = computed(() => ({
  common: {
    primaryColor: '#1A8A7D',
    primaryColorHover: '#2AA89A',
    primaryColorPressed: '#126B60',
    borderRadius: '8px',
  },
  Button: {
    colorPrimary: '#1A8A7D',
    colorHoverPrimary: '#2AA89A',
    colorPressedPrimary: '#126B60',
  },
  Checkbox: {
    colorPrimary: '#1A8A7D',
    colorHoverPrimary: '#2AA89A',
  },
  Input: {
    colorFocus: '#1A8A7D',
    borderFocus: '#1A8A7D',
  },
}))

async function handleLogin() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch (e) {
    return
  }

  loading.value = true

  setTimeout(() => {
    loading.value = false
    authStore.setToken('mock-token-' + Date.now())
    authStore.setUserInfo({
      id: 1,
      username: formData.username,
      realName: '系统管理员',
      role: '超级管理员',
      email: 'admin@petcare.com',
      department: '运营部',
    })
    const ms = (window as any).$message
    if (ms) {
      ms.success('登录成功！欢迎回来')
    }
    router.push('/')
  }, 1000)
}
</script>

<style scoped>
.login-page {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.login-container :deep(.n-card) {
  border: none;
}

.login-container :deep(.n-input) {
  background: transparent;
}

.login-container :deep(.n-input__border) {
  border: none;
}

.login-container :deep(.n-input__state-border) {
  border: none;
}
</style>
