<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">创建工程报修</h1>
      <button class="btn" @click="navigateTo('/engineering-repairs')">返回列表</button>
    </div>

    <div class="card">
      <form @submit.prevent="handleSubmit">
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">报修标题 <span class="text-error">*</span></label>
            <input v-model="form.title" class="form-input" placeholder="请输入报修标题" required />
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
            <label class="form-label">设备名称</label>
            <input v-model="form.equipmentName" class="form-input" placeholder="如：电梯、空调、消防水泵" />
          </div>
          <div class="form-group">
            <label class="form-label">设备型号</label>
            <input v-model="form.equipmentModel" class="form-input" placeholder="请输入设备型号" />
          </div>
          <div class="form-group">
            <label class="form-label">位置 <span class="text-error">*</span></label>
            <input v-model="form.location" class="form-input" placeholder="如：A座5层501室、地下车库" required />
          </div>
          <div class="form-group">
            <label class="form-label">截止时间</label>
            <input v-model="form.deadline" type="datetime-local" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">报修人 <span class="text-error">*</span></label>
            <input v-model="form.reporterName" class="form-input" placeholder="请输入报修人姓名" required />
          </div>
          <div class="form-group">
            <label class="form-label">联系电话 <span class="text-error">*</span></label>
            <input v-model="form.reporterPhone" class="form-input" placeholder="请输入联系电话" required />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">故障描述 <span class="text-error">*</span></label>
          <textarea
            v-model="form.faultDescription"
            class="form-textarea"
            placeholder="请详细描述故障情况，包括故障发生时间、现象、影响范围等"
            rows="3"
            required
          ></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">详细说明</label>
          <textarea
            v-model="form.description"
            class="form-textarea"
            placeholder="请补充其他说明信息"
            rows="3"
          ></textarea>
        </div>
        <div v-if="error" class="alert alert-error">
          {{ error }}
        </div>
        <div class="flex gap-8">
          <button type="submit" class="btn btn-primary" :disabled="loading">
            {{ loading ? '提交中...' : '提交报修' }}
          </button>
          <button type="button" class="btn" @click="navigateTo('/engineering-repairs')">取消</button>
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
  equipmentName: '',
  equipmentModel: '',
  location: '',
  faultDescription: '',
  priority: 'MEDIUM',
  reporterName: '',
  reporterPhone: '',
  deadline: ''
})

const error = ref('')
const loading = ref(false)

onMounted(() => {
  initAuth()
  if (!isLoggedIn.value) {
    navigateTo('/login')
    return
  }
  if (user.value) {
    form.reporterName = user.value.name
    form.reporterPhone = user.value.phone || ''
  }
})

async function handleSubmit() {
  error.value = ''
  loading.value = true
  try {
    const res: any = await useApiFetch('/engineering-repairs', {
      method: 'POST',
      body: form
    })
    if (res.code === 200) {
      navigateTo(`/engineering-repairs/${res.data.id}`)
    }
  } catch (e: any) {
    error.value = e.data?.message || '提交失败'
  } finally {
    loading.value = false
  }
}
</script>
