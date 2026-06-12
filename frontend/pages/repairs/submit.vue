<template>
  <NCard title="提交报修">
    <NForm ref="formRef" :model="formData" :rules="rules" label-placement="left" label-width="80">
      <NFormItem label="标题" path="title">
        <NInput v-model:value="formData.title" placeholder="请输入报修标题" />
      </NFormItem>
      <NFormItem label="类别" path="category">
        <NSelect v-model:value="formData.category" :options="categoryOptions" placeholder="请选择类别" />
      </NFormItem>
      <NFormItem label="描述" path="description">
        <NInput v-model:value="formData.description" type="textarea" :rows="4" placeholder="请详细描述报修问题" />
      </NFormItem>
      <NFormItem label="位置" path="location">
        <NInput v-model:value="formData.location" placeholder="如：A栋3楼" />
      </NFormItem>
      <NFormItem label="宿舍房间" path="dorm_room">
        <NInput v-model:value="formData.dorm_room" placeholder="如：A栋301" />
      </NFormItem>
      <NFormItem label="紧急程度" path="urgency">
        <NSelect v-model:value="formData.urgency" :options="urgencyOptions" placeholder="请选择紧急程度" />
      </NFormItem>
      <NFormItem label="照片">
        <NUpload
          v-model:file-list="fileList"
          :max="5"
          accept="image/*"
          list-type="image-card"
          :default-upload="false"
        >
          点击上传
        </NUpload>
      </NFormItem>
      <NFormItem>
        <NSpace>
          <NButton type="primary" :loading="loading" @click="handleSubmit">提交报修</NButton>
          <NButton @click="navigateTo('/repairs')">取消</NButton>
        </NSpace>
      </NFormItem>
    </NForm>
  </NCard>
</template>

<script setup lang="ts">
import { NCard, NForm, NFormItem, NInput, NSelect, NUpload, NButton, NSpace, useMessage } from 'naive-ui'
import type { FormInst, FormRules, UploadFileInfo } from 'naive-ui'

const api = useApi()
const message = useMessage()
const formRef = ref<FormInst | null>(null)
const loading = ref(false)
const fileList = ref<UploadFileInfo[]>([])

const formData = reactive({
  title: '',
  category: null as string | null,
  description: '',
  location: '',
  dorm_room: '',
  urgency: 'medium' as string
})

const categoryOptions = [
  { label: '水管', value: 'plumbing' },
  { label: '电路', value: 'electrical' },
  { label: '家具', value: 'furniture' },
  { label: '门窗', value: 'door_window' },
  { label: '其他', value: 'other' }
]

const urgencyOptions = [
  { label: '低', value: 'low' },
  { label: '中', value: 'medium' },
  { label: '高', value: 'high' }
]

const rules: FormRules = {
  title: { required: true, message: '请输入标题', trigger: 'blur' },
  category: { required: true, message: '请选择类别', trigger: 'change' },
  description: { required: true, message: '请输入描述', trigger: 'blur' },
  dorm_room: { required: true, message: '请输入宿舍房间', trigger: 'blur' },
  urgency: { required: true, message: '请选择紧急程度', trigger: 'change' }
}

async function handleSubmit() {
  await formRef.value?.validate()
  loading.value = true
  try {
    const form = new FormData()
    form.append('title', formData.title)
    form.append('category', formData.category!)
    form.append('description', formData.description)
    if (formData.location) form.append('location', formData.location)
    if (formData.dorm_room) form.append('dorm_room', formData.dorm_room)
    form.append('urgency', formData.urgency)
    for (const file of fileList.value) {
      if (file.file) {
        form.append('files', file.file)
      }
    }
    await api.createRepair(form)
    message.success('报修提交成功')
    navigateTo('/repairs')
  } catch (e: any) {
    message.error(e?.data?.detail || '提交失败')
  } finally {
    loading.value = false
  }
}
</script>
