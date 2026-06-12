<template>
  <NSpace vertical :size="24">
    <NCard title="欢迎回来">
      <template v-if="auth.user.value">
        <NText style="font-size: 18px">你好，{{ auth.user.value.real_name || auth.user.value.username }}！</NText>
      </template>
    </NCard>

    <NGrid :cols="4" :x-gap="16" :y-gap="16">
      <NGridItem>
        <NCard>
          <NStatistic label="待处理报修" :value="stats.pending">
            <template #suffix>
              <NText type="info" style="font-size: 14px">件</NText>
            </template>
          </NStatistic>
        </NCard>
      </NGridItem>
      <NGridItem>
        <NCard>
          <NStatistic label="处理中报修" :value="stats.inProgress">
            <template #suffix>
              <NText type="warning" style="font-size: 14px">件</NText>
            </template>
          </NStatistic>
        </NCard>
      </NGridItem>
      <NGridItem>
        <NCard>
          <NStatistic label="已完成报修" :value="stats.completed">
            <template #suffix>
              <NText type="success" style="font-size: 14px">件</NText>
            </template>
          </NStatistic>
        </NCard>
      </NGridItem>
      <NGridItem>
        <NCard>
          <NStatistic label="已驳回报修" :value="stats.rejected">
            <template #suffix>
              <NText type="error" style="font-size: 14px">件</NText>
            </template>
          </NStatistic>
        </NCard>
      </NGridItem>
    </NGrid>

    <NGrid :cols="2" :x-gap="16" :y-gap="16">
      <NGridItem>
        <NCard title="快捷操作">
          <NSpace vertical>
            <NButton type="primary" block @click="navigateTo('/repairs/submit')">
              提交报修
            </NButton>
            <NButton block @click="navigateTo('/repairs')">
              查看我的报修
            </NButton>
            <NButton block @click="navigateTo('/activities')">
              社团活动
            </NButton>
            <NButton block @click="navigateTo('/trades')">
              二手交易
            </NButton>
          </NSpace>
        </NCard>
      </NGridItem>
      <NGridItem>
        <NCard title="最近通知">
          <NSpace vertical v-if="notifications.length">
            <NCard v-for="n in notifications" :key="n.id" size="small" embedded>
              <NText>{{ n.content || '通知' }}</NText>
              <template #header-extra>
                <NText depth="3" style="font-size: 12px">{{ n.sent_at }}</NText>
              </template>
            </NCard>
          </NSpace>
          <NEmpty v-else description="暂无通知" />
        </NCard>
      </NGridItem>
    </NGrid>
  </NSpace>
</template>

<script setup lang="ts">
import { NCard, NGrid, NGridItem, NStatistic, NButton, NSpace, NText, NEmpty } from 'naive-ui'

const auth = useAuth()
const api = useApi()

const stats = reactive({
  pending: 0,
  inProgress: 0,
  completed: 0,
  rejected: 0
})

const notifications = ref<any[]>([])

onMounted(async () => {
  try {
    const repairs = await api.getRepairs() as any[]
    const items = Array.isArray(repairs) ? repairs : []
    stats.pending = items.filter((r: any) => r.status === 'pending').length
    stats.inProgress = items.filter((r: any) => r.status === 'in_progress' || r.status === 'in_review').length
    stats.completed = items.filter((r: any) => r.status === 'completed').length
    stats.rejected = items.filter((r: any) => r.status === 'rejected').length
  } catch {}

  try {
    const notifs = await api.getMyNotifications({ limit: 5 }) as any[]
    notifications.value = Array.isArray(notifs) ? notifs : []
  } catch {}
})
</script>
