<template>
  <div style="display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f5f5f5">
    <NCard title="注册" style="width: 480px">
      <NForm ref="formRef" :model="formData" :rules="rules">
        <NFormItem label="用户名" path="username">
          <NInput v-model:value="formData.username" placeholder="请输入用户名" />
        </NFormItem>
        <NFormItem label="密码" path="password">
          <NInput v-model:value="formData.password" type="password" show-password-on="click" placeholder="请输入密码" />
        </NFormItem>
        <NFormItem label="真实姓名" path="real_name">
          <NInput v-model:value="formData.real_name" placeholder="请输入真实姓名" />
        </NFormItem>
        <NFormItem label="学号" path="student_id">
          <NInput v-model:value="formData.student_id" placeholder="请输入学号" />
        </NFormItem>
        <NFormItem label="宿舍房间" path="dorm_room">
          <NInput v-model:value="formData.dorm_room" placeholder="如：A栋301" />
        </NFormItem>
        <NFormItem label="手机号" path="phone">
          <NInput v-model:value="formData.phone" placeholder="请输入手机号" />
        </NFormItem>
        <NFormItem>
          <NSpace vertical style="width: 100%">
            <NButton type="primary" block :loading="loading" @click="handleRegister">注册</NButton>
            <NButton block @click="navigateTo('/login')">返回登录</NButton>
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

const api = useApi()
const message = useMessage()
const formRef = ref<FormInst | null>(null)
const loading = ref(false)

const formData = reactive({
  username: '',
  password: '',
  real_name: '',
  student_id: '',
  dorm_room: '',
  phone: ''
})

const rules: FormRules = {
  username: { required: true, message: '请输入用户名', trigger: 'blur' },
  password: { required: true, message: '请输入密码', trigger: 'blur' },
  real_name: { required: true, message: '请输入真实姓名', trigger: 'blur' },
  student_id: { required: true, message: '请输入学号', trigger: 'blur' },
  dorm_room: { required: true, message: '请输入宿舍房间', trigger: 'blur' }
}

async function handleRegister() {
  await formRef.value?.validate()
  loading.value = true
  try {
    await api.register(formData)
    message.success('注册成功，请登录')
    navigateTo('/login')
  } catch (e: any) {
    message.error(e?.data?.detail || '注册失败')
  } finally {
    loading.value = false
  }
}
</script>
