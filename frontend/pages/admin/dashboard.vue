<template>
  <div class="page-container">
    <div class="card-wrapper">
      <h2 class="page-title">数据概览</h2>
      
      <n-grid :cols="3" :x-gap="16" :y-gap="16" class="stats-grid">
        <n-grid-item>
          <n-card>
            <div class="stat-item">
              <div class="stat-label">活动总数 / 进行中</div>
              <div class="stat-value">
                {{ stats?.events?.total || 0 }}
                <span class="stat-sub"> / {{ stats?.events?.active || 0 }}</span>
              </div>
            </div>
          </n-card>
        </n-grid-item>
        <n-grid-item>
          <n-card>
            <div class="stat-item">
              <div class="stat-label">报名总数 / 已确认</div>
              <div class="stat-value">
                {{ stats?.registrations?.total || 0 }}
                <span class="stat-sub"> / {{ stats?.registrations?.confirmed || 0 }}</span>
              </div>
            </div>
          </n-card>
        </n-grid-item>
        <n-grid-item>
          <n-card>
            <div class="stat-item">
              <div class="stat-label">签到总数 / 成功</div>
              <div class="stat-value">
                {{ stats?.checkins?.total || 0 }}
                <span class="stat-sub"> / {{ stats?.checkins?.success || 0 }}</span>
              </div>
            </div>
          </n-card>
        </n-grid-item>
        <n-grid-item>
          <n-card>
            <div class="stat-item">
              <div class="stat-label">待办 / 处理中</div>
              <div class="stat-value todo">
                {{ stats?.todos?.pending || 0 }}
                <span class="stat-sub"> / {{ stats?.todos?.processing || 0 }}</span>
              </div>
            </div>
          </n-card>
        </n-grid-item>
        <n-grid-item>
          <n-card>
            <div class="stat-item">
              <div class="stat-label">待处理退票异常</div>
              <div class="stat-value refund">{{ stats?.refund_exceptions?.pending || 0 }}</div>
            </div>
          </n-card>
        </n-grid-item>
        <n-grid-item>
          <n-card>
            <div class="stat-item">
              <div class="stat-label">已退款 / 退票异常报名</div>
              <div class="stat-value">
                {{ stats?.registrations?.refunded || 0 }}
                <span class="stat-sub refund"> / {{ stats?.registrations?.refund_exception || 0 }}</span>
              </div>
            </div>
          </n-card>
        </n-grid-item>
      </n-grid>
      
      <n-divider />
      
      <div class="section-title">活动列表</div>
      <n-data-table
        :columns="eventColumns"
        :data="events"
        :pagination="false"
        :bordered="false"
      >
        <template #body="{ row }">
          <n-button size="small" type="primary" @click="goToEvent(row.id)">
            查看详情
          </n-button>
        </template>
      </n-data-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { NCard, NGrid, NGridItem, NDivider, NDataTable, NButton } from 'naive-ui'
import { useApi } from '~/composables/useApi'

const router = useRouter()
const api = useApi()

const stats = ref<any>(null)
const events = ref<any[]>([])

const eventColumns = [
  { title: '活动名称', key: 'name' },
  { title: '地点', key: 'location' },
  { title: '开始日期', key: 'start_date' },
  { title: '状态', key: 'is_active', render: (row: any) => row.is_active ? '进行中' : '已结束' },
  { title: '操作', key: 'actions' },
]

const fetchStats = async () => {
  try {
    const resp: any = await api.get('/statistics/overview')
    stats.value = resp
  } catch (e) {
    console.error('获取统计数据失败', e)
  }
}

const fetchEvents = async () => {
  try {
    const resp: any = await api.get('/events', { page: 1, page_size: 10 })
    events.value = resp.items || []
  } catch (e) {
    console.error('获取活动列表失败', e)
  }
}

const goToEvent = (id: number) => {
  router.push(`/admin/registrations?event_id=${id}`)
}

onMounted(() => {
  fetchStats()
  fetchEvents()
})
</script>

<style scoped lang="scss">
.stats-grid {
  margin-bottom: 24px;
}

.stat-item {
  text-align: center;
  
  .stat-label {
    font-size: 14px;
    color: #999;
    margin-bottom: 8px;
  }
  
  .stat-value {
    font-size: 28px;
    font-weight: 600;
    color: #333;
    
    &.todo {
      color: #f0a020;
    }
    
    &.refund {
      color: #d03050;
    }
    
    .stat-sub {
      font-size: 16px;
      color: #999;
      font-weight: 400;
      
      &.refund {
        color: #d03050;
      }
    }
  }
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #333;
}
</style>
