<template>
  <div class="page-container">
    <div class="card-wrapper">
      <h2 class="page-title">数据概览</h2>
      
      <n-grid :cols="4" :x-gap="16" :y-gap="16" class="stats-grid">
        <n-grid-item>
          <n-card>
            <div class="stat-item">
              <div class="stat-label">活动总数</div>
              <div class="stat-value">{{ stats?.events?.total || 0 }}</div>
            </div>
          </n-card>
        </n-grid-item>
        <n-grid-item>
          <n-card>
            <div class="stat-item">
              <div class="stat-label">报名总数</div>
              <div class="stat-value">{{ stats?.registrations?.total || 0 }}</div>
            </div>
          </n-card>
        </n-grid-item>
        <n-grid-item>
          <n-card>
            <div class="stat-item">
              <div class="stat-label">签到总数</div>
              <div class="stat-value">{{ stats?.checkins?.total || 0 }}</div>
            </div>
          </n-card>
        </n-grid-item>
        <n-grid-item>
          <n-card>
            <div class="stat-item">
              <div class="stat-label">待办事项</div>
              <div class="stat-value todo">{{ stats?.todos?.pending || 0 }}</div>
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
    const data: any = await api.get('/statistics/overview')
    stats.value = data
  } catch (e) {
    console.error('获取统计数据失败', e)
  }
}

const fetchEvents = async () => {
  try {
    const data: any = await api.get('/events', { page: 1, page_size: 10 })
    events.value = data.items || []
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
  }
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #333;
}
</style>
