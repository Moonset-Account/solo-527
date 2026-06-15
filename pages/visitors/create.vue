<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">新增访客预约</h1>
      <button class="btn" @click="navigateTo('/visitors')">返回列表</button>
    </div>

    <div class="card">
      <form @submit.prevent="handleSubmit">
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">访客姓名 <span class="text-error">*</span></label>
            <input v-model="form.visitorName" class="form-input" placeholder="请输入访客姓名" required />
          </div>
          <div class="form-group">
            <label class="form-label">身份证号</label>
            <input v-model="form.visitorIdCard" class="form-input" placeholder="请输入身份证号" maxlength="18" />
          </div>
          <div class="form-group">
            <label class="form-label">手机号 <span class="text-error">*</span></label>
            <input v-model="form.visitorPhone" class="form-input" placeholder="请输入手机号" maxlength="11" required />
          </div>
          <div class="form-group">
            <label class="form-label">访客单位</label>
            <input v-model="form.visitorCompany" class="form-input" placeholder="请输入访客单位" />
          </div>
          <div class="form-group">
            <label class="form-label">来访日期 <span class="text-error">*</span></label>
            <input v-model="form.visitDate" type="date" class="form-input" required />
          </div>
          <div class="form-group">
            <label class="form-label">来访结束日期</label>
            <input v-model="form.visitEndDate" type="date" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">来访人数 <span class="text-error">*</span></label>
            <input v-model.number="form.visitorCount" type="number" min="1" class="form-input" placeholder="请输入来访人数" required />
          </div>
          <div class="form-group">
            <label class="form-label">被访租户 <span class="text-error">*</span></label>
            <select v-model="form.tenantId" class="form-select" required>
              <option value="">请选择被访租户</option>
              <option v-for="t in tenants" :key="t.id" :value="t.id">{{ t.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">被访人姓名 <span class="text-error">*</span></label>
            <input v-model="form.hostName" class="form-input" placeholder="请输入被访人姓名" required />
          </div>
          <div class="form-group">
            <label class="form-label">被访人电话 <span class="text-error">*</span></label>
            <input v-model="form.hostPhone" class="form-input" placeholder="请输入被访人电话" required />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">来访事由 <span class="text-error">*</span></label>
          <textarea
            v-model="form.purpose"
            class="form-textarea"
            placeholder="请详细描述来访事由，包括来访目的、业务背景等"
            rows="4"
            required
          ></textarea>
        </div>
        <div v-if="error" class="alert alert-error">
          {{ error }}
        </div>
        <div class="flex gap-8">
          <button type="submit" class="btn btn-primary" :disabled="loading">
            {{ loading ? '提交中...' : '提交预约' }}
          </button>
          <button type="button" class="btn" @click="navigateTo('/visitors')">取消</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'

const { user, initAuth, isLoggedIn } = useAuth()

const form = reactive({
  visitorName: '',
  visitorIdCard: '',
  visitorPhone: '',
  visitDate: '',
  visitEndDate: '',
  purpose: '',
  visitorCompany: '',
  tenantId: '',
  hostName: '',
  hostPhone: '',
  visitorCount: 1
})

const tenants = ref<any[]>([])
const error = ref('')
const loading = ref(false)

onMounted(async () => {
  initAuth()
  if (!isLoggedIn.value) {
    navigateTo('/login')
    return
  }
  await loadTenants()
  
  if (user.value?.role === 'tenant' && user.value.tenantId) {
    form.tenantId = user.value.tenantId.toString()
  }
})

async function loadTenants() {
  try {
    const res: any = await useApiFetch('/tenants')
    if (res.code === 200) {
      tenants.value = res.data
    }
  } catch (e) {
  }
}

async function handleSubmit() {
  error.value = ''
  
  if (form.visitorIdCard && !validateIdCard(form.visitorIdCard)) {
    error.value = '请输入正确的身份证号'
    return
  }
  
  if (!validatePhone(form.visitorPhone)) {
    error.value = '请输入正确的手机号'
    return
  }
  
  if (!validatePhone(form.hostPhone)) {
    error.value = '请输入正确的被访人电话'
    return
  }
  
  if (form.visitEndDate && new Date(form.visitEndDate) < new Date(form.visitDate)) {
    error.value = '来访结束日期不能早于来访日期'
    return
  }
  
  loading.value = true
  try {
    const submitData = {
      ...form,
      tenantId: parseInt(form.tenantId)
    }
    const res: any = await useApiFetch('/visitors', {
      method: 'POST',
      body: submitData
    })
    if (res.code === 200) {
      navigateTo(`/visitors/${res.data.id}`)
    }
  } catch (e: any) {
    error.value = e.data?.message || '提交失败'
  } finally {
    loading.value = false
  }
}

function validateIdCard(idCard: string): boolean {
  const reg = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/
  return reg.test(idCard)
}

function validatePhone(phone: string): boolean {
  const reg = /^1[3-9]\d{9}$/
  return reg.test(phone)
}
</script>
