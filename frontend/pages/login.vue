<template>
  <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
    <n-card style="width: 400px; padding: 24px" title="🍞 烘焙门店巡店整改系统">
      <n-form ref="formRef" :model="formData" :rules="rules">
        <n-form-item label="用户名" path="username">
          <n-input v-model:value="formData.username" placeholder="请输入用户名" />
        </n-form-item>
        <n-form-item label="密码" path="password">
          <n-input v-model:value="formData.password" type="password" placeholder="请输入密码" show-password-on="click" />
        </n-form-item>
        <n-form-item>
          <n-button type="primary" block :loading="loading" @click="handleLogin">
            登录
          </n-button>
        </n-form-item>
      </n-form>
      <n-divider />
      <n-text depth="3" style="display: block; text-align: center; font-size: 12px">
        测试账号：admin/admin123 | supervisor/123456 | manager/123456 | baker/123456
      </n-text>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useMessage } from 'naive-ui'

const message = useMessage()
const { login } = useAuth()
const router = useRouter()

const formRef = ref()
const loading = ref(false)
const formData = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const handleLogin = async () => {
  try {
    await formRef.value?.validate()
    loading.value = true
    await login(formData.username, formData.password)
    message.success('登录成功')
    router.push('/')
  } catch (e: any) {
    message.error(e.data?.detail || '登录失败，请检查用户名和密码')
  } finally {
    loading.value = false
  }
}
</script>
