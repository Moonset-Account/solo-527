<template>
  <NSpace vertical :size="16">
    <NCard title="处理效率">
      <NGrid :cols="4" :x-gap="16" :y-gap="16">
        <NGridItem>
          <NStatistic label="平均处理时间" :value="stats.avg_time || 0">
            <template #suffix>小时</template>
          </NStatistic>
        </NGridItem>
        <NGridItem>
          <NStatistic label="完成率" :value="stats.completion_rate || 0">
            <template #suffix>%</template>
          </NStatistic>
        </NGridItem>
        <NGridItem>
          <NStatistic label="总工单数" :value="stats.total || 0">
            <template #suffix>件</template>
          </NStatistic>
        </NGridItem>
        <NGridItem>
          <NStatistic label="待处理工单" :value="stats.pending || 0">
            <template #suffix>件</template>
          </NStatistic>
        </NGridItem>
      </NGrid>
    </NCard>

    <NCard title="状态分布">
      <NGrid :cols="7" :x-gap="12">
        <NGridItem v-for="item in statusDistribution" :key="item.status">
          <NCard size="small" embedded>
            <NStatistic :label="item.label" :value="item.count">
              <template #suffix>件</template>
            </NStatistic>
          </NCard>
        </NGridItem>
      </NGrid>
    </NCard>

    <NCard title="近期活动">
      <NDataTable
        v-if="recentActivities.length"
        :columns="activityColumns"
        :data="recentActivities"
        :bordered="false"
        size="small"
      />
      <NEmpty v-else description="暂无近期活动" />
    </NCard>
  </NSpace>
</template>

<script setup lang="ts">
import { NCard, NGrid, NGridItem, NStatistic, NDataTable, NEmpty, NSpace } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'

const api = useApi()

const stats = reactive({
  avg_time: 0,
  completion_rate: 0,
  total: 0,
  pending: 0
})

const statusDistribution = ref<Array<{ status: string; label: string; count: number }>>([
  { status: 'pending', label: '待审核', count: 0 },
  { status: 'in_review', label: '审核中', count: 0 },
  { status: 'approved', label: '已通过', count: 0 },
  { status: 'rejected', label: '已驳回', count: 0 },
  { status: 'in_progress', label: '处理中', count: 0 },
  { status: 'completed', label: '已完成', count: 0 },
  { status: 'closed', label: '已关闭', count: 0 }
])

const recentActivities = ref<any[]>([])

const activityColumns: DataTableColumns = [
  { title: '工单号', key: 'id', width: 80 },
  { title: '标题', key: 'title', ellipsis: { tooltip: true } },
  { title: '操作', key: 'action', width: 100 },
  { title: '操作人', key: 'operator', width: 100 },
  { title: '时间', key: 'created_at', width: 160 }
]

onMounted(async () => {
  try {
    const res = await api.getStatistics() as any
    stats.avg_time = res.avg_time ?? 0
    stats.completion_rate = res.completion_rate ?? 0
    stats.total = res.total ?? 0
    stats.pending = res.pending ?? 0
    if (res.status_distribution) {
      statusDistribution.value = statusDistribution.value.map(item => ({
        ...item,
        count: res.status_distribution[item.status] ?? 0
      }))
    }
    recentActivities.value = res.recent_activities || []
  } catch {}
})
</script>
