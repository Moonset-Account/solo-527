<template>
  <n-form
    ref="formRef"
    :model="formData"
    :rules="rules"
    label-placement="top"
    label-width="auto"
  >
    <n-form-item label="故障标题" path="title">
      <n-input v-model:value="formData.title" placeholder="请简要描述故障" />
    </n-form-item>

    <n-form-item label="故障级别" path="fault_level">
      <n-select
        v-model:value="formData.fault_level"
        placeholder="请选择故障级别"
        :options="levelOptions"
      />
    </n-form-item>

    <n-form-item label="故障设备" path="fault_device">
      <n-input v-model:value="formData.fault_device" placeholder="请输入故障设备名称或IP" />
    </n-form-item>

    <n-form-item label="故障详情" path="description">
      <n-input
        v-model:value="formData.description"
        type="textarea"
        :rows="5"
        placeholder="请详细描述故障现象、影响范围等"
      />
    </n-form-item>

    <n-space justify="end">
      <n-button type="primary" :loading="loading" @click="handleSubmit">
        提交上报
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
  request_type: 'fault_report',
  title: '',
  fault_level: '',
  fault_device: '',
  description: '',
})

const levelOptions = [
  { label: '一级（紧急）', value: 'critical' },
  { label: '二级（严重）', value: 'high' },
  { label: '三级（一般）', value: 'medium' },
  { label: '四级（轻微）', value: 'low' },
]

const rules = {
  title: { required: true, message: '请输入故障标题', trigger: 'blur' },
  fault_level: { required: true, message: '请选择故障级别', trigger: 'change' },
  fault_device: { required: true, message: '请输入故障设备', trigger: 'blur' },
  description: { required: true, message: '请输入故障详情', trigger: 'blur', min: 10 },
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
