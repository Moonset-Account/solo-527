<template>
  <div class="dashboard-page">
    <n-spin :show="loading">
      <div class="stats-section">
        <n-grid :cols="4" :x-gap="16" :y-gap="16">
          <n-grid-item>
            <n-card class="stat-card stat-total" hoverable>
              <div class="stat-content">
                <div class="stat-icon">📋</div>
                <div class="stat-info">
                  <div class="stat-label">总工单数</div>
                  <div class="stat-value">{{ stats.total_tickets }}</div>
                </div>
              </div>
            </n-card>
          </n-grid-item>

          <n-grid-item>
            <n-card class="stat-card stat-pending" hoverable>
              <div class="stat-content">
                <div class="stat-icon">⏳</div>
                <div class="stat-info">
                  <div class="stat-label">待处理</div>
                  <div class="stat-value">{{ stats.pending_tickets }}</div>
                </div>
              </div>
            </n-card>
          </n-grid-item>

          <n-grid-item>
            <n-card class="stat-card stat-processing" hoverable>
              <div class="stat-content">
                <div class="stat-icon">🔄</div>
                <div class="stat-info">
                  <div class="stat-label">处理中</div>
                  <div class="stat-value">{{ stats.processing_tickets }}</div>
                </div>
              </div>
            </n-card>
          </n-grid-item>

          <n-grid-item>
            <n-card class="stat-card stat-resolved" hoverable>
              <div class="stat-content">
                <div class="stat-icon">✅</div>
                <div class="stat-info">
                  <div class="stat-label">已解决</div>
                  <div class="stat-value">{{ stats.resolved_tickets }}</div>
                </div>
              </div>
            </n-card>
          </n-grid-item>

          <n-grid-item>
            <n-card class="stat-card stat-response" hoverable>
              <div class="stat-content">
                <div class="stat-icon">⚡</div>
                <div class="stat-info">
                  <div class="stat-label">平均响应时间</div>
                  <div class="stat-value">{{ formatSeconds(stats.avg_response_time) }}</div>
                </div>
              </div>
            </n-card>
          </n-grid-item>

          <n-grid-item>
            <n-card class="stat-card stat-overdue" hoverable>
              <div class="stat-content">
                <div class="stat-icon">⚠️</div>
                <div class="stat-info">
                  <div class="stat-label">超时风险数</div>
                  <div class="stat-value">{{ stats.overdue_count }}</div>
                </div>
              </div>
            </n-card>
          </n-grid-item>

          <n-grid-item>
            <n-card class="stat-card stat-duplicate" hoverable>
              <div class="stat-content">
                <div class="stat-icon">📑</div>
                <div class="stat-info">
                  <div class="stat-label">重复工单数</div>
                  <div class="stat-value">{{ stats.duplicate_count }}</div>
                </div>
              </div>
            </n-card>
          </n-grid-item>

          <n-grid-item>
            <n-card class="stat-card stat-rating" hoverable>
              <div class="stat-content">
                <div class="stat-icon">⭐</div>
                <div class="stat-info">
                  <div class="stat-label">平均满意度</div>
                  <div class="stat-value">{{ formatRating(stats.avg_feedback_rating) }}</div>
                </div>
              </div>
            </n-card>
          </n-grid-item>
        </n-grid>
      </div>

      <n-grid :cols="3" :x-gap="16" :y-gap="16" class="content-section">
        <n-grid-item :span="2">
          <n-card class="tickets-card" title="我的待办工单" :bordered="false">
            <template #header-extra>
              <n-button text type="primary" @click="goToTickets">查看全部</n-button>
            </template>

            <n-data-table
              :columns="ticketColumns"
              :data="ticketList"
              :pagination="false"
              :bordered="false"
              size="small"
              :row-key="(row) => row.id"
            >
              <template #body="{ row }">
                <n-tag
                  :type="getStatusType(row.status)"
                  size="small"
                  round
                >
                  {{ getStatusLabel(row.status) }}
                </n-tag>
              </template>
            </n-data-table>

            <n-empty v-if="ticketList.length === 0" description="暂无待办工单" />
          </n-card>
        </n-grid-item>

        <n-grid-item :span="1">
          <n-card class="timeline-card" title="最近活动" :bordered="false">
            <n-timeline size="medium">
              <n-timeline-item
                v-for="(activity, index) in activityList"
                :key="index"
                :type="activity.type"
                :title="activity.title"
                :time="activity.time"
              >
                {{ activity.content }}
              </n-timeline-item>

              <n-timeline-item
                v-if="activityList.length === 0"
                type="default"
                title="暂无活动"
              >
                近期没有活动记录
              </n-timeline-item>
            </n-timeline>
          </n-card>
        </n-grid-item>
      </n-grid>
    </n-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, h } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import type { DataTableColumns } from 'naive-ui'

definePageMeta({
  layout: 'default'
})

interface StatsData {
  total_tickets: number
  pending_tickets: number
  processing_tickets: number
  resolved_tickets: number
  avg_response_time: number | null
  avg_resolution_time: number | null
  overdue_count: number
  duplicate_count: number
  avg_feedback_rating: number | null
  high_risk_count: number
}

interface TicketData {
  id: number
  title: string
  status: string
  priority: string
  created_at: string
  has_overdue_risk: boolean
  is_duplicate: boolean
}

interface ActivityItem {
  type: 'default' | 'info' | 'success' | 'warning' | 'error'
  title: string
  content: string
  time: string
}

const router = useRouter()
const { get } = useApi()
const auth = useAuthStore()
const message = useMessage()

const loading = ref(false)

const stats = reactive<StatsData>({
  total_tickets: 0,
  pending_tickets: 0,
  processing_tickets: 0,
  resolved_tickets: 0,
  avg_response_time: null,
  avg_resolution_time: null,
  overdue_count: 0,
  duplicate_count: 0,
  avg_feedback_rating: null,
  high_risk_count: 0
})

const ticketList = ref<TicketData[]>([])

const ticketColumns: DataTableColumns<TicketData> = [
  {
    title: 'ID',
    key: 'id',
    width: 80,
    render: (row) => h('span', { style: { color: '#18a058', fontWeight: 500 } }, `#${row.id}`)
  },
  {
    title: '标题',
    key: 'title',
    ellipsis: { tooltip: true },
    render: (row) => h(
      'a',
      {
        style: { color: '#2080f0', cursor: 'pointer', textDecoration: 'none' },
        onClick: () => router.push(`/tickets/${row.id}`)
      },
      row.title
    )
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render: (row) => h(
      'n-tag',
      { type: getStatusType(row.status), size: 'small', round: '' },
      () => getStatusLabel(row.status)
    )
  },
  {
    title: '优先级',
    key: 'priority',
    width: 100,
    render: (row) => h(
      'n-tag',
      { type: getPriorityType(row.priority), size: 'small' },
      () => getPriorityLabel(row.priority)
    )
  },
  {
    title: '创建时间',
    key: 'created_at',
    width: 180,
    render: (row) => h(
      'span',
      { style: { color: '#86909c' } },
      dayjs(row.created_at).format('YYYY-MM-DD HH:mm')
    )
  }
]

const activityList = computed<ActivityItem[]>(() => {
  const activities: ActivityItem[] = []

  ticketList.value.forEach((ticket) => {
    let type: ActivityItem['type'] = 'default'
    let title = ''
    let content = ''

    if (ticket.has_overdue_risk) {
      type = 'warning'
      title = `工单 #${ticket.id} 存在超时风险`
      content = `请尽快处理：${ticket.title}`
    } else if (ticket.status === 'pending') {
      type = 'info'
      title = `新工单待处理 #${ticket.id}`
      content = ticket.title
    } else if (ticket.status === 'processing') {
      type = 'success'
      title = `工单处理中 #${ticket.id}`
      content = ticket.title
    } else if (ticket.is_duplicate) {
      type = 'error'
      title = `重复工单 #${ticket.id}`
      content = ticket.title
    }

    if (title) {
      activities.push({
        type,
        title,
        content,
        time: dayjs(ticket.created_at).format('MM-DD HH:mm')
      })
    }
  })

  return activities.slice(0, 8)
})

const getStatusType = (status: string) => {
  const map: Record<string, string> = {
    pending: 'warning',
    processing: 'info',
    resolved: 'success',
    closed: 'default'
  }
  return map[status] || 'default'
}

const getStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    pending: '待处理',
    processing: '处理中',
    resolved: '已解决',
    closed: '已关闭'
  }
  return map[status] || status
}

const getPriorityType = (priority: string) => {
  const map: Record<string, string> = {
    urgent: 'error',
    high: 'warning',
    medium: 'info',
    low: 'default'
  }
  return map[priority] || 'default'
}

const getPriorityLabel = (priority: string) => {
  const map: Record<string, string> = {
    urgent: '紧急',
    high: '高',
    medium: '中',
    low: '低'
  }
  return map[priority] || priority
}

const formatSeconds = (seconds: number | null) => {
  if (!seconds || seconds <= 0) return '--'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) {
    return `${hours}小时${minutes}分`
  }
  return `${minutes}分钟`
}

const formatRating = (rating: number | null) => {
  if (!rating) return '--'
  return `${rating.toFixed(1)} 分`
}

const fetchStats = async () => {
  try {
    const res = await get<StatsData>('/stats/overview')
    Object.assign(stats, res)
  } catch (e: any) {
    if (e.message !== 'Unauthorized' && auth.isCustomer) {
      Object.assign(stats, {
        total_tickets: 0,
        pending_tickets: 0,
        processing_tickets: 0,
        resolved_tickets: 0,
        avg_response_time: null,
        avg_resolution_time: null,
        overdue_count: 0,
        duplicate_count: 0,
        avg_feedback_rating: null,
        high_risk_count: 0
      })
    }
  }
}

const fetchTickets = async () => {
  try {
    const params = new URLSearchParams({
      page: '1',
      page_size: '10'
    })

    if (!auth.isCustomer && !auth.isAgent) {
      params.append('status', 'pending')
      params.append('status', 'processing')
    }

    const res = await get<any>(`/tickets?${params.toString()}`)
    ticketList.value = res.items || []

    if (auth.isCustomer) {
      stats.total_tickets = res.total || 0
      stats.pending_tickets = ticketList.value.filter((t) => t.status === 'pending').length
      stats.processing_tickets = ticketList.value.filter((t) => t.status === 'processing').length
      stats.resolved_tickets = ticketList.value.filter((t) => ['resolved', 'closed'].includes(t.status)).length
      stats.overdue_count = ticketList.value.filter((t) => t.has_overdue_risk).length
      stats.duplicate_count = ticketList.value.filter((t) => t.is_duplicate).length
    }
  } catch (e: any) {
    if (e.message !== 'Unauthorized') {
      message.error(e.message || '获取工单列表失败')
    }
  }
}

const loadData = async () => {
  loading.value = true
  try {
    const promises: Promise<any>[] = [fetchTickets()]
    if (auth.canViewStats) {
      promises.push(fetchStats())
    }
    await Promise.all(promises)
  } finally {
    loading.value = false
  }
}

const goToTickets = () => {
  router.push('/tickets')
}

onMounted(() => {
  auth.restoreAuth()
  loadData()
})
</script>

<style scoped lang="scss">
.dashboard-page {
  padding: 20px;
}

.stats-section {
  margin-bottom: 20px;
}

.stat-card {
  :deep(.n-card__content) {
    padding: 16px;
  }

  .stat-content {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    background: #f2f3f5;
    flex-shrink: 0;
  }

  .stat-info {
    flex: 1;
    min-width: 0;
  }

  .stat-label {
    font-size: 13px;
    color: #86909c;
    margin-bottom: 4px;
  }

  .stat-value {
    font-size: 24px;
    font-weight: 600;
    color: #1d2129;
    line-height: 1.2;
  }
}

.stat-total .stat-icon {
  background: #e8f3ff;
}

.stat-pending .stat-icon {
  background: #fff7e8;
}

.stat-processing .stat-icon {
  background: #e8fffb;
}

.stat-resolved .stat-icon {
  background: #e8ffea;
}

.stat-response .stat-icon {
  background: #fff0f0;
}

.stat-overdue .stat-icon {
  background: #fff3e8;
}

.stat-duplicate .stat-icon {
  background: #f3e8ff;
}

.stat-rating .stat-icon {
  background: #fffbe8;
}

.content-section {
  .tickets-card,
  .timeline-card {
    height: 100%;

    :deep(.n-card__content) {
      padding: 0;
    }
  }

  .tickets-card {
    :deep(.n-data-table) {
      font-size: 13px;
    }
  }

  .timeline-card {
    :deep(.n-timeline) {
      padding: 20px 4px 4px 4px;
    }

    :deep(.n-timeline-item-content) {
      font-size: 13px;
      color: #4e5969;
    }

    :deep(.n-timeline-item-title) {
      font-size: 13px;
      font-weight: 500;
    }

    :deep(.n-timeline-item-time) {
      font-size: 12px;
      color: #86909c;
    }
  }
}
</style>
