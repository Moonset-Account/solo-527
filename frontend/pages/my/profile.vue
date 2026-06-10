<template>
  <n-card :bordered="false">
    <template #header>个人资料</template>
    <n-form :model="form" label-placement="left" label-width="100px">
      <n-grid :cols="2" :x-gap="20">
        <n-grid-item>
          <n-form-item label="用户名">
            <n-input v-model:value="form.username" disabled />
          </n-form-item>
        </n-grid-item>
        <n-grid-item>
          <n-form-item label="邮箱">
            <n-input v-model:value="form.email" />
          </n-form-item>
        </n-grid-item>
        <n-grid-item>
          <n-form-item label="姓名">
            <n-input v-model:value="form.full_name" />
          </n-form-item>
        </n-grid-item>
        <n-grid-item>
          <n-form-item label="手机号">
            <n-input v-model:value="form.phone" />
          </n-form-item>
        </n-grid-item>
      </n-grid>

      <n-divider v-if="isCandidate">教育经历</n-divider>

      <template v-if="isCandidate">
        <n-grid :cols="2" :x-gap="20">
          <n-grid-item>
            <n-form-item label="学校">
              <n-input v-model:value="candidateForm.university" />
            </n-form-item>
          </n-grid-item>
          <n-grid-item>
            <n-form-item label="专业">
              <n-input v-model:value="candidateForm.major" />
            </n-form-item>
          </n-grid-item>
          <n-grid-item>
            <n-form-item label="学历">
              <n-select v-model:value="candidateForm.degree" :options="degreeOptions" />
            </n-form-item>
          </n-grid-item>
          <n-grid-item>
            <n-form-item label="毕业年份">
              <n-input-number v-model:value="candidateForm.graduation_year" :min="2020" :max="2030" style="width: 100%" />
            </n-form-item>
          </n-grid-item>
        </n-grid>
        <n-form-item label="个人简介">
          <n-input v-model:value="candidateForm.introduction" type="textarea" :rows="4" />
        </n-form-item>
      </template>

      <n-form-item>
        <n-space>
          <n-button type="primary" :loading="saving" @click="saveProfile">保存修改</n-button>
          <n-button @click="cancelEdit">取消</n-button>
        </n-space>
      </n-form-item>
    </n-form>
  </n-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { useMessage } from 'naive-ui'
import api from '~/utils/api'
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

const message = useMessage()
const authStore = useAuthStore()

const isCandidate = computed(() => authStore.user?.role === 'candidate')

const form = reactive({
  username: '',
  email: '',
  full_name: '',
  phone: '',
})

const candidateForm = reactive({
  university: '',
  major: '',
  degree: '',
  graduation_year: null as number | null,
  introduction: '',
})

const saving = ref(false)

const degreeOptions = [
  { label: '大专', value: 'college' },
  { label: '本科', value: 'bachelor' },
  { label: '硕士', value: 'master' },
  { label: '博士', value: 'doctor' },
]

async function loadProfile() {
  if (authStore.user) {
    form.username = authStore.user.username
    form.email = authStore.user.email
    form.full_name = authStore.user.full_name || ''
    form.phone = authStore.user.phone || ''
  }

  if (isCandidate.value) {
    try {
      const res = await api.get('/candidates/me')
      const data = res.data
      candidateForm.university = data.university || ''
      candidateForm.major = data.major || ''
      candidateForm.degree = data.degree || ''
      candidateForm.graduation_year = data.graduation_year
      candidateForm.introduction = data.introduction || ''
    } catch (e) {
      // ignore
    }
  }
}

async function saveProfile() {
  saving.value = true
  try {
    await api.put('/users/me', {
      full_name: form.full_name,
      phone: form.phone,
    })

    if (isCandidate.value) {
      await api.put('/candidates/me', candidateForm)
    }

    await authStore.fetchCurrentUser()
    message.success('保存成功')
  } catch (err: any) {
    message.error(err.response?.data?.detail || '保存失败')
  } finally {
    saving.value = false
  }
}

function cancelEdit() {
  loadProfile()
}

onMounted(() => {
  loadProfile()
})
</script>
