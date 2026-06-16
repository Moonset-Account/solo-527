<template>
  <div class="register-container">
    <n-card class="register-card" title="用户注册" hoverable>
      <n-form ref="formRef" :model="formData" :rules="rules" label-placement="left" label-width="80">
        <n-form-item label="用户名" path="username">
          <n-input v-model:value="formData.username" placeholder="请输入用户名" />
        </n-form-item>
        <n-form-item label="姓名" path="full_name">
          <n-input v-model:value="formData.full_name" placeholder="请输入真实姓名" />
        </n-form-item>
        <n-form-item label="邮箱" path="email">
          <n-input v-model:value="formData.email" placeholder="请输入邮箱" />
        </n-form-item>
        <n-form-item label="密码" path="password">
          <n-input v-model:value="formData.password" type="password" placeholder="请输入密码" show-password-on="click" />
        </n-form-item>
        <n-form-item label="角色" path="role">
          <n-select v-model:value="formData.role" :options="roleOptions" placeholder="选择角色" />
        </n-form-item>
        <n-form-item label="部门" path="department">
          <n-input v-model:value="formData.department" placeholder="请输入部门" />
        </n-form-item>
        <n-form-item>
          <n-button type="primary" block :loading="loading" @click="handleRegister">
            注 册
          </n-button>
        </n-form-item>
        <n-form-item>
          <n-button block @click="goLogin">
            返回登录
          </n-button>
        </n-form-item>
      </n-form>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { register } from '~/api'

const router = useRouter()
const message = useMessage()
const formRef = ref()
const loading = ref(false)

const formData = reactive({
  username: '',
  full_name: '',
  email: '',
  password: '',
  role: 'frontline',
  department: ''
})

const roleOptions = [
  { label: '一线员工', value: 'frontline' },
  { label: '采购专员', value: 'procurement' },
  { label: '采购经理', value: 'manager' },
  { label: '项目负责人', value: 'project_owner' },
  { label: '管理员', value: 'admin' }
]

const rules = {
  username: { required: true, message: '请输入用户名', trigger: 'blur' },
  full_name: { required: true, message: '请输入姓名', trigger: 'blur' },
  email: { required: true, message: '请输入邮箱', trigger: 'blur' },
  password: { required: true, message: '请输入密码', trigger: 'blur' },
  role: { required: true, message: '请选择角色', trigger: 'change' }
}

async function handleRegister() {
  try {
    await formRef.value?.validate()
    loading.value = true
    await register(formData)
    message.success('注册成功，请登录')
    router.push('/login')
  } catch (e: any) {
    message.error(e.message || '注册失败')
  } finally {
    loading.value = false
  }
}

function goLogin() {
  router.push('/login')
}
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.register-card {
  width: 480px;
  padding: 20px;
}
</style>
