<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">{{ user?.role === 'TENANT' ? '提交报修' : '创建工单' }}</h1>
      <button class="btn" @click="navigateTo('/workorders')">返回列表</button>
    </div>

    <div class="card">
      <form @submit.prevent="handleSubmit">
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">工单标题 <span class="text-error">*</span></label>
            <input v-model="form.title" class="form-input" placeholder="请输入工单标题" required />
          </div>
          <div class="form-group">
            <label class="form-label">工单类型 <span class="text-error">*</span></label>
            <select v-model="form.type" class="form-select" required>
              <option value="">请选择类型</option>
              <option value="REPAIR">维修</option>
              <option value="MAINTENANCE">维护</option>
              <option value="INSTALLATION">安装</option>
              <option value="CONSULTING">咨询</option>
              <option value="OTHER">其他</option>
            </select>
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
            <label class="form-label">位置 <span class="text-error">*</span></label>
            <input v-model="form.location" class="form-input" placeholder="如：A座5层501室" required />
          </div>
          <div class="form-group">
            <label class="form-label">联系人 <span class="text-error">*</span></label>
            <input v-model="form.contactName" class="form-input" placeholder="请输入联系人姓名" required />
          </div>
          <div class="form-group">
            <label class="form-label">联系电话 <span class="text-error">*</span></label>
            <input v-model="form.contactPhone" class="form-input" placeholder="请输入联系电话" required />
          </div>
          <div class="form-group">
            <label class="form-label">期望完成时间</label>
            <input v-model="form.expectedDate" type="datetime-local" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">截止时间</label>
            <input v-model="form.deadline" type="datetime-local" class="form-input" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">问题描述 <span class="text-error">*</span></label>
          <textarea
            v-model="form.description"
            class="form-textarea"
            placeholder="请详细描述问题情况，包括问题发生时间、现象、影响范围等"
            rows="5"
            required
          ></textarea>
        </div>
        <div v-if="error" class="alert alert-error">
          {{ error }}
        </div>
        <div class="flex gap-8">
          <button type="submit" class="btn btn-primary" :disabled="loading">
            {{ loading ? '提交中...' : '提交工单' }}
          </button>
          <button type="button" class="btn" @click="navigateTo('/workorders')">取消</button>
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
  type: '',
  priority: 'MEDIUM',
  location: '',
  contactName: '',
  contactPhone: '',
  expectedDate: '',
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
    form.contactName = user.value.name
    form.contactPhone = user.value.phone || ''
  }
})

async function handleSubmit() {
  error.value = ''
  loading.value = true
  try {
    const res: any = await useApiFetch('/workorders', {
      method: 'POST',
      body: form
    })
    if (res.code === 200) {
      navigateTo(`/workorders/${res.data.id}`)
    }
  } catch (e: any) {
    error.value = e.data?.message || '提交失败'
  } finally {
    loading.value = false
  }
}
</script>
