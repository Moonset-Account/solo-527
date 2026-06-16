<template>
  <n-form
    ref="formRef"
    :model="formData"
    :rules="rules"
    label-placement="top"
    label-width="auto"
  >
    <n-form-item label="申请标题" path="title">
      <n-input v-model:value="formData.title" placeholder="请输入申请标题" />
    </n-form-item>

    <n-form-item label="目标账号" path="target_account">
      <n-input v-model:value="formData.target_account" placeholder="请输入目标账号" />
    </n-form-item>

    <n-form-item label="变更类型" path="change_type">
      <n-select
        v-model:value="formData.change_type"
        placeholder="请选择变更类型"
        :options="changeTypeOptions"
      />
    </n-form-item>

    <n-form-item label="变更说明" path="description">
      <n-input
        v-model:value="formData.description"
        type="textarea"
        :rows="4"
        placeholder="请详细描述变更内容和原因"
      />
    </n-form-item>

    <n-space justify="end">
      <n-button type="primary" :loading="loading" @click="handleSubmit">
        提交申请
      </n-button>
    </n-space>
  </n-form>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import {
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NSpace,
  NButton,
} from 'naive-ui'

const emit = defineEmits<{
  submit: [data: any]
}>()

const formRef = ref<any>(null)
const loading = ref(false)

const formData = reactive({
  request_type: 'account_change',
  title: '',
  target_account: '',
  change_type: '',
  description: '',
  change_details: {},
})

const changeTypeOptions = [
  { label: '账号创建', value: 'create' },
  { label: '账号删除', value: 'delete' },
  { label: '权限变更', value: 'permission_change' },
  { label: '密码重置', value: 'password_reset' },
  { label: '角色调整', value: 'role_change' },
  { label: '其他', value: 'other' },
]

const rules = {
  title: { required: true, message: '请输入申请标题', trigger: 'blur' },
  target_account: { required: true, message: '请输入目标账号', trigger: 'blur' },
  change_type: { required: true, message: '请选择变更类型', trigger: 'change' },
  description: { required: true, message: '请输入变更说明', trigger: 'blur', min: 10 },
}

const handleSubmit = async () => {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  loading.value = true
  try {
    emit('submit', { ...formData })
  } finally {
    loading.value = false
  }
}
</script>
