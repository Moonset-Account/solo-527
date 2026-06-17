<template>
  <div style="min-height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; padding: 20px;">
    <n-card style="width: 420px; box-shadow: 0 20px 60px rgba(0,0,0,0.3);" hoverable>
      <div style="text-align: center; margin-bottom: 28px;">
        <n-icon size="56" style="color: #2080f0;">
          <SchoolOutline />
        </n-icon>
        <n-h2 style="margin: 12px 0 6px 0; color: #1f2937;">艺考培训家校沟通站</n-h2>
        <n-text depth="3">服务于校区校长 · 教师 · 家长</n-text>
      </div>
      <n-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-placement="left"
        label-width="70"
        @submit="handleLogin"
      >
        <n-form-item label="账号" path="username">
          <n-input v-model:value="form.username" placeholder="请输入用户名" size="large">
            <template #prefix><n-icon><PersonCircleOutline /></n-icon></template>
          </n-input>
        </n-form-item>
        <n-form-item label="密码" path="password">
          <n-input v-model:value="form.password" type="password" show-password-on="click" placeholder="请输入密码" size="large">
            <template #prefix><n-icon><LockClosedOutline /></n-icon></template>
          </n-input>
        </n-form-item>
        <n-space justify="space-between" style="margin-bottom: 8px;">
          <n-checkbox v-model:checked="remember">记住我</n-checkbox>
          <n-button text type="primary">忘记密码？</n-button>
        </n-space>
        <n-form-item>
          <n-button type="primary" block size="large" :loading="loading" @click="handleLogin">
            登 录
          </n-button>
        </n-form-item>
      </n-form>
      <n-divider style="margin: 16px 0;" />
      <n-alert type="info" :show-icon="true" style="margin-bottom: 12px;">
        <template #header>演示账号</template>
        <n-space vertical size="small" style="font-size: 12px;">
          <n-tag size="small" round>校长: principal / admin123</n-tag>
          <n-tag size="small" round>教师: teacher1 / admin123</n-tag>
          <n-tag size="small" round>家长: parent1 / admin123</n-tag>
          <n-tag size="small" round>运营: operator / admin123</n-tag>
        </n-space>
      </n-alert>
      <n-button block dashed size="small" @click="initDemo">
        <template #icon><n-icon><SparklesOutline /></n-icon></template>
        初始化演示数据（首次使用请点击）
      </n-button>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import type { FormInst, FormRules } from 'naive-ui'
import { useUserStore } from '~/stores/user'
import { SchoolOutline, PersonCircleOutline, LockClosedOutline, SparklesOutline } from '@vicons/ionicons5'
import { apiPost } from '~/composables/useApi'

const userStore = useUserStore()
const formRef = ref<FormInst>()
const loading = ref(false)
const remember = ref(true)

const form = reactive({
  username: 'principal',
  password: 'admin123',
})

const rules: FormRules = {
  username: { required: true, message: '请输入用户名', trigger: 'blur' },
  password: { required: true, message: '请输入密码', trigger: 'blur', min: 6 },
}

const message = useMessage()

async function handleLogin() {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }
  loading.value = true
  try {
    const fd = new FormData()
    fd.append('username', form.username)
    fd.append('password', form.password)
    const res: any = await apiPost('/auth/login', undefined)
    const config = useRuntimeConfig()
    const resp = await $fetch(`${config.public.apiBase}/auth/login`, {
      method: 'POST',
      body: fd,
      headers: { Accept: 'application/json' },
    }) as any
    if (resp?.access_token) {
      userStore.setToken(resp.access_token)
      if (resp.user) userStore.setUser(resp.user)
      message.success('登录成功，欢迎回来！')
      navigateTo('/dashboard')
    }
  } catch (e: any) {
    message.error(e?.data?.detail || e?.message || '登录失败，请检查账号密码')
  } finally {
    loading.value = false
  }
}

async function initDemo() {
  loading.value = true
  try {
    const res: any = await apiPost('/auth/init-demo')
    message.success(res?.message || '演示数据初始化成功')
    form.username = 'principal'
    form.password = 'admin123'
  } catch (e: any) {
    message.warning(e?.data?.message || '演示数据可能已存在，可直接登录')
  } finally {
    loading.value = false
  }
}

import { useMessage } from 'naive-ui'
</script>
