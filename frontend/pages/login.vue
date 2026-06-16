<template>
  <div class="login-container">
    <n-card class="login-card" title="办公耗材询价比价平台" hoverable>
      <n-form ref="formRef" :model="formData" :rules="rules" label-placement="left" label-width="80">
        <n-form-item label="用户名" path="username">
          <n-input v-model:value="formData.username" placeholder="请输入用户名" />
        </n-form-item>
        <n-form-item label="密码" path="password">
          <n-input v-model:value="formData.password" type="password" placeholder="请输入密码" show-password-on="click" />
        </n-form-item>
        <n-form-item>
          <n-button type="primary" block :loading="loading" @click="handleLogin">
            登 录
          </n-button>
        </n-form-item>
        <n-form-item>
          <n-button block @click="goRegister">
            注册账号
          </n-button>
        </n-form-item>
      </n-form>
      <n-divider />
      <n-text depth="3">默认测试账号:</n-text>
      <n-list size="small" style="margin-top: 8px;">
        <n-list-item>admin / admin123 (管理员)</n-list-item>
        <n-list-item>procurement / proc123 (采购)</n-list-item>
        <n-list-item>frontline / front123 (一线)</n-list-item>
      </n-list>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { useUserStore } from '~/stores/user'
import { login } from '~/api'

const router = useRouter()
const message = useMessage()
const userStore = useUserStore()
const formRef = ref()
const loading = ref(false)

const formData = reactive({
  username: '',
  password: ''
})

const rules = {
  username: { required: true, message: '请输入用户名', trigger: 'blur' },
  password: { required: true, message: '请输入密码', trigger: 'blur' }
}

async function handleLogin() {
  try {
    await formRef.value?.validate()
    loading.value = true
    const res = await login(formData)
    if (res.code === 200) {
      userStore.setToken(res.data.access_token)
      userStore.setUserInfo(res.data.user)
      message.success('登录成功')
      router.push('/dashboard')
    }
  } catch (e: any) {
    message.error(e.message || '登录失败')
  } finally {
    loading.value = false
  }
}

function goRegister() {
  router.push('/register')
}

onMounted(() => {
  if (userStore.isLoggedIn) {
    router.push('/dashboard')
  }
})
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.login-card {
  width: 420px;
  padding: 20px;
}
</style>
