<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">创建巡检任务</h1>
      <button class="btn" @click="navigateTo('/inspections')">返回列表</button>
    </div>

    <div class="card">
      <form @submit.prevent="handleSubmit">
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">巡检标题 <span class="text-error">*</span></label>
            <input v-model="form.title" class="form-input" placeholder="请输入巡检标题" required />
          </div>
          <div class="form-group">
            <label class="form-label">区域 <span class="text-error">*</span></label>
            <input v-model="form.area" class="form-input" placeholder="如：A座5层、B栋公共区域" required />
          </div>
          <div class="form-group">
            <label class="form-label">优先级</label>
            <select v-model="form.priority" class="form-select">
              <option value="LOW">低</option>
              <option value="MEDIUM">中</option>
              <option value="HIGH">高</option>
              <option value="URGENT">紧急</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">处理人 <span class="text-error">*</span></label>
            <select v-model="form.assigneeId" class="form-select" required>
              <option value="">请选择工程师</option>
              <option v-for="e in engineers" :key="e.id" :value="e.id">{{ e.name }} ({{ e.phone }})</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">截止时间 <span class="text-error">*</span></label>
            <input v-model="form.deadline" type="datetime-local" class="form-input" required />
          </div>
          <div class="form-group">
            <label class="form-label">预计时长（分钟）</label>
            <input v-model.number="form.expectedDuration" type="number" class="form-input" placeholder="如：60" min="1" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">巡检描述 <span class="text-error">*</span></label>
          <textarea
            v-model="form.description"
            class="form-textarea"
            placeholder="请详细描述巡检内容、巡检要点、注意事项等"
            rows="5"
            required
          ></textarea>
        </div>
        <div v-if="error" class="alert alert-error">
          {{ error }}
        </div>
        <div class="flex gap-8">
          <button type="submit" class="btn btn-primary" :disabled="loading">
            {{ loading ? '提交中...' : '创建巡检' }}
          </button>
          <button type="button" class="btn" @click="navigateTo('/inspections')">取消</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'

const { user, initAuth, isLoggedIn } = useAuth()

const form = reactive({
  title: '',
  description: '',
  area: '',
  priority: 'MEDIUM',
  assigneeId: '',
  deadline: '',
  expectedDuration: null as number | null
})

const engineers = ref<any[]>([])
const error = ref('')
const loading = ref(false)

onMounted(async () => {
  initAuth()
  if (!isLoggedIn.value) {
    navigateTo('/login')
    return
  }
  if (user.value?.role === 'TENANT') {
    navigateTo('/inspections')
    return
  }
  await loadEngineers()
})

async function loadEngineers() {
  try {
    const res: any = await useApiFetch('/users/engineers')
    if (res.code === 200) {
      engineers.value = res.data
    }
  } catch (e) {
    // ignore
  }
}

async function handleSubmit() {
  error.value = ''
  loading.value = true
  try {
    const res: any = await useApiFetch('/inspections', {
      method: 'POST',
      body: form
    })
    if (res.code === 200) {
      navigateTo(`/inspections/${res.data.id}`)
    }
  } catch (e: any) {
    error.value = e.data?.message || '提交失败'
  } finally {
    loading.value = false
  }
}
</script>
