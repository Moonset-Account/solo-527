<template>
  <n-form :model="form" label-width="100">
    <div class="grid-cols-2">
      <n-form-item label="用户名" required>
        <n-input v-model:value="form.username" :disabled="!!userId" placeholder="登录用户名" />
      </n-form-item>
      <n-form-item label="姓名" required>
        <n-input v-model:value="form.full_name" placeholder="真实姓名" />
      </n-form-item>
      <n-form-item label="邮箱" required>
        <n-input v-model:value="form.email" placeholder="name@example.com" />
      </n-form-item>
      <n-form-item label="角色" required>
        <n-select v-model:value="form.role" :options="roleOpts" />
      </n-form-item>
      <n-form-item v-if="!userId" label="密码" required>
        <n-input v-model:value="form.password" type="password" show-password-on="click" placeholder="至少6位" />
      </n-form-item>
      <n-form-item v-else label="重置密码">
        <n-input v-model:value="form.password" type="password" show-password-on="click" placeholder="留空表示不修改" />
      </n-form-item>
      <n-form-item label="部门">
        <n-input v-model:value="form.department" placeholder="部门名称" />
      </n-form-item>
      <n-form-item label="电话">
        <n-input v-model:value="form.phone" placeholder="手机号码" />
      </n-form-item>
      <n-form-item label="账号状态" v-if="userId">
        <n-switch v-model:value="form.is_active" />
      </n-form-item>
    </div>
    <div class="flex justify-end gap-sm mt-md">
      <n-button @click="$emit('cancel')">取消</n-button>
      <n-button type="primary" :loading="saving" @click="submit">{{ userId ? '保存修改' : '创建用户' }}</n-button>
    </div>
  </n-form>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'

const props = defineProps<{ userId?: number | null }>()
const emit = defineEmits(['success', 'cancel'])

const saving = ref(false)
const form = reactive<any>({
  username: '', full_name: '', email: '', role: 'submitter',
  password: '', department: '', phone: '', is_active: true,
})
const roleOpts = [
  { value: 'admin', label: '系统管理员' },
  { value: 'compliance_manager', label: '合规经理' },
  { value: 'lawyer', label: '律师' },
  { value: 'reviewer', label: '复核人' },
  { value: 'submitter', label: '业务提交人' },
]

onMounted(async () => {
  if (props.userId) {
    try {
      const api = useApi()
      const u = await api.get(`/users/${props.userId}`)
      Object.assign(form, u, { password: '' })
    } catch (_) {}
  }
})
watch(() => props.userId, (v) => {
  if (!v) Object.assign(form, { username: '', full_name: '', email: '', role: 'submitter', password: '', department: '', phone: '', is_active: true })
})

async function submit() {
  saving.value = true
  try {
    const api = useApi()
    const payload = { ...form }
    Object.keys(payload).forEach((k) => { if (payload[k] === '' || payload[k] === null || payload[k] === undefined) delete payload[k] })
    if (props.userId) {
      await api.patch(`/users/${props.userId}`, payload)
    } else {
      await api.post('/users', payload)
    }
    (window as any).__n_msg?.success('操作成功')
    emit('success')
  } finally { saving.value = false }
}
</script>

<style scoped>
.grid-cols-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
.flex { display: flex; }
.gap-sm { gap: 8px; }
.justify-end { justify-content: flex-end; }
.mt-md { margin-top: 16px; }
</style>
