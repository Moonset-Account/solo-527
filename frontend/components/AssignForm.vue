<template>
  <n-form :model="form" label-width="120">
    <div class="grid-cols-2">
      <n-form-item label="分派律师" required>
        <n-select v-model:value="form.lawyer_id" :options="lawyerOpts" placeholder="选择律师" filterable />
      </n-form-item>
      <n-form-item label="律师截止">
        <n-date-picker v-model:value="form.lawyer_deadline" type="date" style="width:100%" value-format="yyyy-MM-dd" />
      </n-form-item>
      <n-form-item label="分派复核人" required>
        <n-select v-model:value="form.reviewer_id" :options="reviewerOpts" placeholder="选择复核人" filterable />
      </n-form-item>
      <n-form-item label="复核截止">
        <n-date-picker v-model:value="form.reviewer_deadline" type="date" style="width:100%" value-format="yyyy-MM-dd" />
      </n-form-item>
    </div>
    <div class="flex justify-end gap-sm mt-md">
      <n-button @click="$emit('cancel')">取消</n-button>
      <n-button type="primary" :loading="loading" @click="submit">确认分派</n-button>
    </div>
  </n-form>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'

const props = defineProps<{ submissionId: number }>()
const emit = defineEmits(['success', 'cancel'])

const loading = ref(false)
const form = reactive<any>({ lawyer_id: null, reviewer_id: null, lawyer_deadline: null, reviewer_deadline: null })
const lawyerOpts = ref<any[]>([])
const reviewerOpts = ref<any[]>([])

onMounted(async () => {
  try {
    const api = useApi()
    const [law, rev] = await Promise.all([
      api.get('/users/by-role', { role: 'lawyer' }),
      api.get('/users/by-role', { role: 'reviewer' }),
    ])
    lawyerOpts.value = law.map((u: any) => ({ value: u.id, label: `${u.full_name}（${u.department || ''}）` }))
    reviewerOpts.value = rev.map((u: any) => ({ value: u.id, label: `${u.full_name}（${u.department || ''}）` }))
  } catch (_) {}
})

async function submit() {
  if (!form.lawyer_id || !form.reviewer_id) {
    (window as any).__n_msg?.warning('请同时选择律师和复核人')
    return
  }
  loading.value = true
  try {
    const api = useApi()
    const payload: any = { submission_id: props.submissionId, ...form }
    Object.keys(payload).forEach((k) => { if (payload[k] === '' || payload[k] === null || payload[k] === undefined) delete payload[k] })
    await api.post('/assignments', payload)
    (window as any).__n_msg?.success('分派成功，已发送提醒通知')
    emit('success')
  } finally { loading.value = false }
}
</script>

<style scoped>
.grid-cols-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
.flex { display: flex; }
.gap-sm { gap: 8px; }
.justify-end { justify-content: flex-end; }
.mt-md { margin-top: 16px; }
</style>
