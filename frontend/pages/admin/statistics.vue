<template>
  <NSpace vertical :size="16">
    <NCard title="处理效率">
      <NGrid :cols="4" :x-gap="16" :y-gap="16">
        <NGridItem>
          <NCard>
            <NStatistic label="平均处理时间" :value="stats.avg_processing_days || 0">
              <template #suffix>天</template>
            </NStatistic>
          </NCard>
        </NGridItem>
        <NGridItem>
          <NCard>
            <NStatistic label="总工单数" :value="stats.total_orders || 0">
              <template #suffix>件</template>
            </NStatistic>
          </NCard>
        </NGridItem>
        <NGridItem>
          <NCard>
            <NStatistic label="待处理工单" :value="stats.pending_orders || 0">
              <template #suffix>件</template>
            </NStatistic>
          </NCard>
        </NGridItem>
        <NGridItem>
          <NCard>
            <NStatistic label="已完成工单" :value="stats.completed_orders || 0">
              <template #suffix>件</template>
            </NStatistic>
          </NCard>
        </NGridItem>
      </NGrid>
    </NCard>

    <NCard title="类别分布">
      <NGrid :cols="5" :x-gap="12">
        <NGridItem v-for="item in categoryList" :key="item.key">
          <NCard size="small" embedded>
            <NStatistic :label="item.label" :value="item.count" />
          </NCard>
        </NGridItem>
      </NGrid>
    </NCard>

    <NCard title="紧急程度分布">
      <NGrid :cols="3" :x-gap="12">
        <NGridItem v-for="item in urgencyList" :key="item.key">
          <NCard size="small" embedded>
            <NStatistic :label="item.label" :value="item.count" />
          </NCard>
        </NGridItem>
      </NGrid>
    </NCard>

    <NCard title="状态分布">
      <NGrid :cols="7" :x-gap="12">
        <NGridItem v-for="item in statusList" :key="item.key">
          <NCard size="small" embedded>
            <NStatistic :label="item.label" :value="item.count" />
          </NCard>
        </NGridItem>
      </NGrid>
    </NCard>
  </NSpace>
</template>

<script setup lang="ts">
import { NCard, NGrid, NGridItem, NStatistic, NSpace } from 'naive-ui'

const api = useApi()

const stats = reactive({
  total_orders: 0,
  pending_orders: 0,
  in_progress_orders: 0,
  completed_orders: 0,
  avg_processing_days: 0,
  category_distribution: {} as Record<string, number>,
  urgency_distribution: {} as Record<string, number>,
})

const categoryLabels: Record<string, string> = {
  plumbing: '水管',
  electrical: '电路',
  furniture: '家具',
  door_window: '门窗',
  other: '其他',
}

const urgencyLabels: Record<string, string> = {
  low: '低',
  medium: '中',
  high: '高',
}

const statusLabels: Record<string, string> = {
  pending: '待审核',
  in_review: '审核中',
  approved: '已通过',
  rejected: '已驳回',
  in_progress: '处理中',
  completed: '已完成',
  closed: '已关闭',
}

const categoryList = computed(() =>
  Object.keys(categoryLabels).map(key => ({
    key,
    label: categoryLabels[key],
    count: stats.category_distribution?.[key] || 0,
  }))
)

const urgencyList = computed(() =>
  Object.keys(urgencyLabels).map(key => ({
    key,
    label: urgencyLabels[key],
    count: stats.urgency_distribution?.[key] || 0,
  }))
)

const statusList = computed(() =>
  Object.keys(statusLabels).map(key => ({
    key,
    label: statusLabels[key],
    count: 0,
  }))
)

onMounted(async () => {
  try {
    const res = await api.getStatistics() as any
    if (res) {
      stats.total_orders = res.total_orders || 0
      stats.pending_orders = res.pending_orders || 0
      stats.in_progress_orders = res.in_progress_orders || 0
      stats.completed_orders = res.completed_orders || 0
      stats.avg_processing_days = res.avg_processing_days || 0
      stats.category_distribution = res.category_distribution || {}
      stats.urgency_distribution = res.urgency_distribution || {}
    }
  } catch {}
})
</script>
