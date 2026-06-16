<template>
  <div>
    <n-page-header title="新建申请" @back="handleBack">
      返回
    </n-page-header>

    <n-card class="mt-4">
      <n-tabs v-model:value="tabValue" type="segment" size="large" class="mb-6">
        <n-tab-pane name="account_change" tab="账号变更申请">
          <AccountChangeForm @submit="handleSubmit" />
        </n-tab-pane>
        <n-tab-pane name="fault_report" tab="故障上报">
          <FaultReportForm @submit="handleSubmit" />
        </n-tab-pane>
      </n-tabs>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { NPageHeader, NCard, NTabs, NTabPane, useMessage } from 'naive-ui'
import { useApiClient } from '~/composables/useApiClient'
import AccountChangeForm from '~/components/AccountChangeForm.vue'
import FaultReportForm from '~/components/FaultReportForm.vue'

definePageMeta({
  layout: 'admin',
  requiresAuth: true,
})

const router = useRouter()
const message = useMessage()
const api = useApiClient()

const tabValue = ref('account_change')

const handleBack = () => {
  router.back()
}

const handleSubmit = async (data: any) => {
  try {
    await api.requests.create(data)
    message.success('提交成功')
    router.push('/requests/my')
  } catch (error: any) {
    message.error(error.message || '提交失败')
  }
}
</script>
