<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useApi } from '@/composables/useApi'

const { get } = useApi()

interface Alert {
  id: number
  metricName: string
  oldCaliber: string
  newCaliber: string
  notified: boolean
}

const alerts = ref<Alert[]>([])
const visible = ref(true)

onMounted(async () => {
  const data = await get<any[]>('/api/subscriptions/events?status=new')
  if (data) {
    alerts.value = data
      .filter((e: any) => e.isCaliberRelated)
      .map((e: any) => ({
        id: e.id,
        metricName: e.metricName,
        oldCaliber: '',
        newCaliber: '',
        notified: true,
      }))
    visible.value = alerts.value.length > 0
  }
})

function dismiss() {
  visible.value = false
}
</script>

<template>
  <el-alert
    v-if="visible && alerts.length"
    type="warning"
    :closable="true"
    @close="dismiss"
    show-icon
    class="mb-4"
  >
    <template #title>
      <span>检测到 <strong>{{ alerts.length }}</strong> 项口径变更</span>
    </template>
    <div class="text-sm space-y-1 mt-1">
      <div v-for="alert in alerts" :key="alert.id">
        指标 <strong>{{ alert.metricName }}</strong> 口径已变更
        <span v-if="alert.oldCaliber && alert.newCaliber">
          ：{{ alert.oldCaliber }} → {{ alert.newCaliber }}
        </span>
        <el-tag v-if="alert.notified" size="small" type="success" class="ml-2">已通知供应链管理员</el-tag>
      </div>
    </div>
  </el-alert>
</template>
