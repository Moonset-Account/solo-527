<template>
  <div class="animate-[fadeIn_0.6s_ease]">
    <NCard
      class="shadow-2xl !rounded-2xl overflow-hidden border-0"
      content-style="padding: 0"
    >
      <div class="relative bg-gradient-to-br from-deep-blue-700 via-deep-blue-800 to-deep-blue-900 p-8 text-center overflow-hidden">
        <div class="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-amber-gold-500/20 blur-2xl"></div>
        <div class="absolute -bottom-20 -left-20 w-56 h-56 rounded-full bg-deep-blue-400/20 blur-2xl"></div>
        <div class="relative z-10">
          <div class="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-amber-gold-400 to-amber-gold-600 flex items-center justify-center shadow-xl mb-4">
            <NIcon size={32} color="#0B4F8C"><MailOutlined /></NIcon>
          </div>
          <h1 class="font-charter text-2xl font-bold text-white tracking-wide">
            销售邮件知识检索助手
          </h1>
          <p class="mt-2 text-deep-blue-200 text-sm">
            智能生成 · 合规审核 · 版本管理
          </p>
        </div>
      </div>

      <div class="p-8">
        <NForm
          ref="formRef"
          :model="form"
          :rules="rules"
          label-placement="top"
          size="large"
          @submit="handleSubmit"
        >
          <NFormItem path="username" label="用户名">
            <NInput
              v-model:value="form.username"
              placeholder="请输入用户名"
              :input-props="{ autocomplete: 'username' }"
            >
              <template #prefix><NIcon><UserOutlined /></NIcon></template>
            </NInput>
          </NFormItem>
          <NFormItem path="password" label="密码">
            <NInput
              v-model:value="form.password"
              type="password"
              show-password-on="click"
              placeholder="请输入密码"
              :input-props="{ autocomplete: 'current-password' }"
              @keydown.enter="handleSubmit"
            >
              <template #prefix><NIcon><LockOutlined /></NIcon></template>
            </NInput>
          </NFormItem>
        </NForm>

        <div class="mb-5">
          <p class="text-xs text-slate-400 mb-2.5 flex items-center">
            <NIcon size={12} class="mr-1"><InfoCircleOutlined /></NIcon>
            选择测试账号快速登录：
          </p>
          <NRadioGroup v-model:value="selectedPreset" @update:value="applyPreset">
            <div class="grid grid-cols-1 gap-2">
              <NRadio
                v-for="account in presetAccounts"
                :key="account.key"
                :value="account.key"
                class="!m-0 !flex !items-center !px-3 !py-2.5 !rounded-xl !border !border-slate-200 hover:!border-deep-blue-400 transition-all"
              >
                <div class="flex items-center w-full ml-2">
                  <div
                    class="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm mr-3"
                    :class="account.bgClass"
                  >
                    {{ account.label.charAt(0) }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-slate-800">{{ account.label }}</p>
                    <p class="text-xs text-slate-400">{{ account.desc }}</p>
                  </div>
                </div>
              </NRadio>
            </div>
          </NRadioGroup>
        </div>

        <NButton
          type="primary"
          size="large"
          block
          :loading="loading"
          loading-text="正在登录..."
          class="!h-11 !font-medium shadow-lg shadow-deep-blue-500/25"
          style="background: linear-gradient(135deg, #0B4F8C 0%, #1469B9 50%, #0B4F8C 100%); border: none;"
          @click="handleSubmit"
        >
          <span class="flex items-center justify-center">
            <NIcon size={16} class="mr-2"><LoginOutlined /></NIcon>
            登 录
          </span>
        </NButton>

        <p class="mt-6 text-center text-xs text-slate-400">
          © 2026 邮件智能审核系统 · 内部使用
        </p>
      </div>
    </NCard>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRoute } from 'vue-router'
import {
  NCard, NForm, NFormItem, NInput, NButton, NIcon, NRadioGroup, NRadio, useMessage, type FormRules, type FormInst
} from 'naive-ui'
import {
  UserOutlined, LockOutlined, MailOutlined, LoginOutlined, InfoCircleOutlined
} from '@vicons/antd'
import { useAuth } from '@/composables/useAuth'
import { usePageTitle } from '@/composables/usePageTitle'

usePageTitle('登录')

const route = useRoute()
const message = useMessage()
const auth = useAuth()
const formRef = ref<FormInst | null>(null)
const loading = ref(false)
const selectedPreset = ref<string | null>(null)

const form = reactive({
  username: '',
  password: ''
})

const presetAccounts = [
  { key: 'admin', label: '系统管理员', username: 'admin', password: 'admin123', desc: 'admin / admin123', bgClass: 'bg-gradient-to-br from-deep-blue-500 to-deep-blue-700' },
  { key: 'reviewer', label: '复核员', username: 'reviewer', password: 'review123', desc: 'reviewer / review123', bgClass: 'bg-gradient-to-br from-amber-gold-500 to-amber-gold-700' },
  { key: 'operator', label: '运营人员', username: 'operator', password: 'operate123', desc: 'operator / operate123', bgClass: 'bg-gradient-to-br from-emerald-500 to-emerald-700' }
]

const rules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: ['blur', 'input'] }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: ['blur', 'input'] },
    { min: 6, message: '密码至少6位', trigger: ['input'] }
  ]
}

function applyPreset(key: string | null) {
  const account = presetAccounts.find(a => a.key === key)
  if (account) {
    form.username = account.username
    form.password = account.password
  }
}

async function handleSubmit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  loading.value = true
  try {
    const redirect = (route.query.redirect as string) || undefined
    await auth.login({ username: form.username, password: form.password }, redirect)
  } finally {
    loading.value = false
  }
}
</script>

<style>
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
