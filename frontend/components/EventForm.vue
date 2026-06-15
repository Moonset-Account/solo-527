<template>
  <NModal :show="show" preset="card" title="上报新事件" style="width: 680px" :mask-closable="false" @update:show="$emit('update:show', $event)">
    <NForm ref="formRef" :model="formData" :rules="rules" label-placement="left" label-width="80">
      <NFormItem label="事件标题" path="title">
        <NInput v-model:value="formData.title" placeholder="请输入事件标题" />
      </NFormItem>
      <NFormItem label="事件类型" path="event_type">
        <NSelect v-model:value="formData.event_type" :options="eventTypeOptions" placeholder="请选择事件类型" />
      </NFormItem>
      <NFormItem label="事件描述" path="description">
        <NInput v-model:value="formData.description" type="textarea" :rows="3" placeholder="请详细描述事件情况" />
      </NFormItem>
      <NFormItem label="上报人" path="reporter">
        <NInput v-model:value="formData.reporter" placeholder="请输入上报人姓名" />
      </NFormItem>
      <NFormItem label="联系电话" path="reporter_phone">
        <NInput v-model:value="formData.reporter_phone" placeholder="请输入联系电话" />
      </NFormItem>
      <NFormItem label="定位">
        <MapPicker v-model:lng="formData.lng" v-model:lat="formData.lat" v-model:location="formData.location" />
      </NFormItem>
      <NFormItem label="现场照片">
        <NUpload
          :max="5"
          accept="image/*"
          :custom-request="handleUpload"
          list-type="image-card"
          @remove="handleRemove"
        >
          点击上传
        </NUpload>
      </NFormItem>
    </NForm>
    <template #footer>
      <div style="display: flex; justify-content: flex-end; gap: 12px">
        <NButton @click="$emit('update:show', false)">取消</NButton>
        <NButton type="primary" @click="handleSubmit" :loading="submitting">提交</NButton>
      </div>
    </template>
  </NModal>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { NModal, NForm, NFormItem, NInput, NSelect, NButton, NUpload, useMessage } from 'naive-ui'
import MapPicker from './MapPicker.vue'

const props = defineProps<{ show: boolean }>()
const emit = defineEmits(['update:show', 'submitted'])

const message = useMessage()
const formRef = ref()
const submitting = ref(false)

const formData = ref({
  title: '',
  event_type: null as string | null,
  description: '',
  reporter: '',
  reporter_phone: '',
  location: '',
  lng: null as number | null,
  lat: null as number | null,
  photos: [] as string[]
})

const rules = {
  title: { required: true, message: '请输入事件标题', trigger: 'blur' },
  event_type: { required: true, message: '请选择事件类型', trigger: 'change' },
  description: { required: true, message: '请输入事件描述', trigger: 'blur' },
  reporter: { required: true, message: '请输入上报人', trigger: 'blur' }
}

const eventTypeOptions = ref<{ label: string; value: string }[]>([])

onMounted(async () => {
  const api = useApi()
  const items = await api.getDictItems('event_type')
  eventTypeOptions.value = items.map((i: any) => ({ label: i.label, value: i.key }))
})

const handleUpload = async ({ file, onFinish, onError }: any) => {
  try {
    const api = useApi()
    const result = await api.uploadFile(file.file)
    formData.value.photos.push(result.url || result.name)
    onFinish()
  } catch {
    onError()
  }
}

const handleRemove = ({ file }: any) => {
  const idx = formData.value.photos.findIndex(p => p.includes(file.name))
  if (idx >= 0) formData.value.photos.splice(idx, 1)
}

const handleSubmit = async () => {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }
  submitting.value = true
  try {
    const api = useApi()
    await api.createEvent(formData.value)
    message.success('事件上报成功')
    emit('update:show', false)
    emit('submitted')
    formData.value = { title: '', event_type: null, description: '', reporter: '', reporter_phone: '', location: '', lng: null, lat: null, photos: [] }
  } catch {
    message.error('提交失败，请重试')
  } finally {
    submitting.value = false
  }
}
</script>
