<script setup lang="ts">
import {
  NGrid,
  NGi,
  NCard,
  NStatistic,
  NButton,
  NTag,
  NSpin,
  NProgress,
  NSpace,
  NIcon,
} from 'naive-ui'
import {
  WalletOutline,
  AlertCircleOutline,
  CheckmarkCircleOutline,
  ReturnDownBackOutline,
} from '@vicons/ionicons5'
import type { Reminder, ReminderListResponse } from '~/types'

definePageMeta({ layout: 'default' })

const dashboardStore = useDashboardStore()
const api = useApi()

const recentReminders = ref<Reminder[]>([])
const loadingReminders = ref(false)

onMounted(async () => {
  await dashboardStore.fetchSummary()
  loadingReminders.value = true
  try {
    const res = await api.reminder.list({ page: 1, page_size: 5 })
    recentReminders.value = res.items
  } catch {
    recentReminders.value = []
  } finally {
    loadingReminders.value = false
  }
})

function formatAmount(val: number) {
  return val.toLocaleString('zh-CN', { style: 'currency', currency: 'CNY' })
}

const cashGapPercent = computed(() => {
  if (!dashboardStore.summary) return 0
  const total = dashboardStore.totalAR
  if (total === 0) return 0
  const paid = dashboardStore.totalPaid
  return Math.round((paid / total) * 100)
})

const router = useRouter()
</script>

<template>
  <NSpin :show="dashboardStore.loading">
    <NGrid :cols="4" :x-gap="16" :y-gap="16">
      <NGi>
        <NCard>
          <template #header>
            <NSpace align="center">
              <NIcon :size="24" color="#2080f0"><WalletOutline /></NIcon>
              总应收金额
            </NSpace>
          </template>
          <NStatistic :value="formatAmount(dashboardStore.totalAR)" />
        </NCard>
      </NGi>
      <NGi>
        <NCard>
          <template #header>
            <NSpace align="center">
              <NIcon :size="24" color="#d03050"><AlertCircleOutline /></NIcon>
              逾期金额
            </NSpace>
          </template>
          <NStatistic :value="formatAmount(dashboardStore.overdueAmount)">
            <template #suffix>
              <NTag v-if="dashboardStore.overdueAmount > 0" type="error" size="small">需关注</NTag>
            </template>
          </NStatistic>
        </NCard>
      </NGi>
      <NGi>
        <NCard>
          <template #header>
            <NSpace align="center">
              <NIcon :size="24" color="#18a058"><CheckmarkCircleOutline /></NIcon>
              本月回款
            </NSpace>
          </template>
          <NStatistic :value="formatAmount(dashboardStore.totalPaid)" />
        </NCard>
      </NGi>
      <NGi>
        <NCard>
          <template #header>
            <NSpace align="center">
              <NIcon :size="24" color="#f0a020"><ReturnDownBackOutline /></NIcon>
              待处理退款
            </NSpace>
          </template>
          <NStatistic :value="formatAmount(dashboardStore.pendingRefunds)" />
        </NCard>
      </NGi>
    </NGrid>

    <NGrid :cols="2" :x-gap="16" :y-gap="16" style="margin-top: 16px">
      <NGi>
        <NCard title="回款进度">
          <NSpace vertical>
            <NStatistic label="已回款比例" :value="cashGapPercent">
              <template #suffix>%</template>
            </NStatistic>
            <NProgress
              type="line"
              :percentage="cashGapPercent"
              :color="cashGapPercent >= 80 ? '#18a058' : cashGapPercent >= 50 ? '#f0a020' : '#d03050'"
              :height="24"
              :border-radius="4"
            />
          </NSpace>
        </NCard>
      </NGi>
      <NGi>
        <NCard title="最近提醒">
          <NSpin :show="loadingReminders" style="min-height: 120px">
            <NSpace vertical v-if="recentReminders.length">
              <NSpace
                v-for="r in recentReminders"
                :key="r.id"
                justify="space-between"
                align="center"
              >
                <span>{{ r.title }}</span>
                <NTag :type="r.status === 'active' ? 'warning' : r.status === 'resolved' ? 'success' : 'info'" size="small">
                  {{ r.status }}
                </NTag>
              </NSpace>
            </NSpace>
            <div v-else style="color: #999">暂无提醒</div>
          </NSpin>
        </NCard>
      </NGi>
    </NGrid>

    <NCard title="快捷操作" style="margin-top: 16px">
      <NSpace>
        <NButton type="primary" @click="router.push('/ar')">应收管理</NButton>
        <NButton type="info" @click="router.push('/payments')">收款记录</NButton>
        <NButton type="warning" @click="router.push('/cash-gap')">资金缺口</NButton>
        <NButton @click="router.push('/refunds')">退款管理</NButton>
        <NButton @click="router.push('/writeoffs')">冲销记录</NButton>
        <NButton @click="router.push('/reminders')">提醒中心</NButton>
      </NSpace>
    </NCard>
  </NSpin>
</template>
