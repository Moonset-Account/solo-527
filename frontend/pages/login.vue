<template>
  <div style="display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f5f5f5">
    <NCard title="登录" style="width: 400px">
      <NForm ref="formRef" :model="formData" :rules="rules">
        <NFormItem label="用户名" path="username">
          <NInput v-model:value="formData.username" placeholder="请输入用户名" @keyup.enter="handleLogin" />
        </NFormItem>
        <NFormItem label="密码" path="password">
          <NInput v-model:value="formData.password" type="password" show-password-on="click" placeholder="请输入密码" @keyup.enter="handleLogin" />
        </NFormItem>
        <NFormItem>
          <NSpace vertical style="width: 100%">
            <NButton type="primary" block :loading="loading" @click="handleLogin">登录</NButton>
            <NButton block @click="navigateTo('/register')">注册账号</NButton>
          </NSpace>
        </NFormItem>
      </NForm>
    </NCard>
  </div>
</template>

<script setup lang="ts">
import { NCard, NForm, NFormItem, NInput, NButton, NSpace, useMessage } from 'naive-ui'
import type { FormInst, FormRules } from 'naive-ui'

definePageMeta({ layout: false })

const auth = useAuth()
const message = useMessage()
const formRef = ref<FormInst | null>(null)
const loading = ref(false)

const formData = reactive({
  username: '',
  password: ''
})

const rules: FormRules = {
  username: { required: true, message: '请输入用户名', trigger: 'blur' },
  password: { required: true, message: '请输入密码', trigger: 'blur' }
}

async function handleLogin() {
  await formRef.value?.validate()
  loading.value = true
  try {
    await auth.login(formData.username, formData.password)
    message.success('登录成功')
    navigateTo('/')
  } catch (e: any) {
    message.error(e?.data?.detail || '登录失败')
  } finally {
    loading.value = false
  }
}
</script>
