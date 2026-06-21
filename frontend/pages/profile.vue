<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">个人中心</h2>
    </div>

    <n-card style="max-width: 600px">
      <n-descriptions :column="1" bordered title="基本信息">
        <n-descriptions-item label="用户名">{{ user?.username }}</n-descriptions-item>
        <n-descriptions-item label="姓名">{{ user?.full_name }}</n-descriptions-item>
        <n-descriptions-item label="邮箱">{{ user?.email || '-' }}</n-descriptions-item>
        <n-descriptions-item label="角色">
          <n-tag :type="getRoleTagType(user?.role)">{{ getRoleLabel(user?.role) }}</n-tag>
        </n-descriptions-item>
        <n-descriptions-item label="所属门店">{{ currentStore?.name || '-' }}</n-descriptions-item>
        <n-descriptions-item label="注册时间">{{ user?.created_at ? dayjs(user.created_at).format('YYYY-MM-DD') : '-' }}</n-descriptions-item>
      </n-descriptions>

      <n-divider />

      <h3 style="margin-bottom: 20px">修改密码</h3>
      <n-form :model="passwordForm" :rules="passwordRules" label-width="100px">
        <n-form-item label="原密码" path="old_password">
          <n-input v-model:value="passwordForm.old_password" type="password" show-password-on="click" />
        </n-form-item>
        <n-form-item label="新密码" path="new_password">
          <n-input v-model:value="passwordForm.new_password" type="password" show-password-on="click" />
        </n-form-item>
        <n-form-item label="确认密码" path="confirm_password">
          <n-input v-model:value="passwordForm.confirm_password" type="password" show-password-on="click" />
        </n-form-item>
        <n-form-item>
          <n-button type="primary" :loading="changingPassword" @click="changePassword">
            确认修改
          </n-button>
        </n-form-item>
      </n-form>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useMessage } from 'naive-ui'
import dayjs from 'dayjs'

const message = useMessage()
const { user, checkAuth } = useAuth()
const { getStores } = useMasterApi()

const currentStore = ref<Store | null>(null)
const changingPassword = ref(false)

const passwordForm = reactive({
  old_password: '',
  new_password: '',
  confirm_password: ''
})

const validateConfirmPassword = (rule: any, value: string) => {
  if (value !== passwordForm.new_password) {
    return new Error('两次输入的密码不一致')
  }
  return true
}

const passwordRules = {
  old_password: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  new_password: [{ required: true, message: '请输入新密码', trigger: 'blur' }, { min: 6, message: '密码至少6位', trigger: 'blur' }],
  confirm_password: [{ required: true, validator: validateConfirmPassword, trigger: 'blur' }]
}

const getRoleLabel = (role?: string) => {
  const map: Record<string, string> = {
    admin: '系统管理员',
    supervisor: '区域督导',
    store_manager: '店长',
    baker: '烘焙师',
    cashier: '收银员'
  }
  return map[role || ''] || role
}

const getRoleTagType = (role?: string) => {
  const map: Record<string, string> = {
    admin: 'error',
    supervisor: 'warning',
    store_manager: 'info',
    baker: 'success',
    cashier: 'default'
  }
  return map[role || ''] as any || 'default'
}

const changePassword = async () => {
  try {
    changingPassword.value = true
    await $fetch('/api/auth/change-password', {
      method: 'POST',
      query: {
        old_password: passwordForm.old_password,
        new_password: passwordForm.new_password
      },
      headers: {
        'Authorization': `Bearer ${useAuth().token.value}`
      }
    })
    message.success('密码修改成功')
    Object.assign(passwordForm, { old_password: '', new_password: '', confirm_password: '' })
  } catch (e: any) {
    message.error(e.data?.detail || '修改失败')
  } finally {
    changingPassword.value = false
  }
}

onMounted(async () => {
  checkAuth()
  if (user.value?.store_id) {
    const stores = await getStores()
    currentStore.value = stores.find(s => s.id === user.value?.store_id) || null
  }
})
</script>
