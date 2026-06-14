<template>
  <div style="height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #1B2A4A 0%, #2d4a7a 100%)">
    <n-card style="width: 400px" title="装修巡检系统">
      <n-form ref="formRef" :model="form" :rules="rules" @submit.prevent="handleLogin">
        <n-form-item path="username" label="用户名">
          <n-input v-model:value="form.username" placeholder="请输入用户名" />
        </n-form-item>
        <n-form-item path="password" label="密码">
          <n-input v-model:value="form.password" type="password" show-password-on="click" placeholder="请输入密码" />
        </n-form-item>
        <n-space vertical :size="16">
          <n-button type="primary" block :loading="loading" attr-type="submit">登录</n-button>
        </n-space>
      </n-form>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { navigateTo } from '#imports'
import { useMessage, type FormInst, type FormRules } from 'naive-ui'
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: false,
})

const authStore = useAuthStore()
const message = useMessage()
const formRef = ref<FormInst | null>(null)
const loading = ref(false)

const form = reactive({
  username: '',
  password: '',
})

const rules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

async function handleLogin() {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }
  loading.value = true
  try {
    await authStore.login({ username: form.username, password: form.password })
    message.success('登录成功')
    navigateTo('/', { replace: true })
  } catch (e: any) {
    message.error(e?.data?.detail || '登录失败，请检查用户名和密码')
  } finally {
    loading.value = false
  }
}
</script>
