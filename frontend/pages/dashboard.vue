<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">工作台</h2>
      <n-tag type="success">{{ currentDate }}</n-tag>
    </div>

    <n-grid :cols="4" :x-gap="20" :y-gap="20" style="margin-bottom: 20px">
      <n-grid-item>
        <div class="stat-card">
          <div class="stat-value" style="color: #18a058">{{ stats.todayBatches }}</div>
          <div class="stat-label">今日烘焙批次</div>
        </div>
      </n-grid-item>
      <n-grid-item>
        <div class="stat-card">
          <div class="stat-value" style="color: #f0a020">{{ stats.pendingRectification }}</div>
          <div class="stat-label">待整改任务</div>
        </div>
      </n-grid-item>
      <n-grid-item>
        <div class="stat-card">
          <div class="stat-value" style="color: #d03050">{{ stats.lowStockItems }}</div>
          <div class="stat-label">库存预警</div>
        </div>
      </n-grid-item>
      <n-grid-item>
        <div class="stat-card">
          <div class="stat-value" style="color: #2080f0">¥{{ stats.todayLoss.toFixed(2) }}</div>
          <div class="stat-label">今日报损金额</div>
        </div>
      </n-grid-item>
    </n-grid>

    <n-grid :cols="2" :x-gap="20">
      <n-grid-item>
        <n-card title="最近烘焙批次" :bordered="false">
          <template #header-extra>
            <n-button text type="primary" @click="router.push('/batch')">查看全部</n-button>
          </template>
          <n-data-table
            :columns="batchColumns"
            :data="recentBatches"
            :pagination="false"
            size="small"
          />
        </n-card>
      </n-grid-item>
      <n-grid-item>
        <n-card title="库存预警" :bordered="false">
          <template #header-extra>
            <n-button text type="primary" @click="router.push('/alerts')">查看全部</n-button>
          </template>
          <n-data-table
            :columns="alertColumns"
            :data="lowStockItems"
            :pagination="false"
            size="small"
          />
        </n-card>
      </n-grid-item>
      <n-grid-item>
        <n-card title="待整改任务" :bordered="false">
          <template #header-extra>
            <n-button text type="primary" @click="router.push('/rectification')">查看全部</n-button>
          </template>
          <n-data-table
            :columns="rectificationColumns"
            :data="pendingRectifications"
            :pagination="false"
            size="small"
          />
        </n-card>
      </n-grid-item>
      <n-grid-item>
        <n-card title="报损趋势(近7天)" :bordered="false">
          <client-only>
            <div style="height: 300px">
              <VChart :option="lossChartOption" autoresize />
            </div>
          </client-only>
        </n-card>
      </n-grid-item>
    </n-grid>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, h } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'

const router = useRouter()
const { getBatches, getLossRecords } = useBatchApi()
const { getLowStock, getAlerts } = useInventoryApi()
const { getRectifications } = useRectificationApi()

const currentDate = dayjs().format('YYYY年MM月DD日 dddd')

const stats = reactive({
  todayBatches: 0,
  pendingRectification: 0,
  lowStockItems: 0,
  todayLoss: 0
})

const recentBatches = ref<BakingBatch[]>([])
const lowStockItems = ref<InventoryItem[]>([])
const pendingRectifications = ref<RectificationTask[]>([])
const lossChartOption = ref<any>({})

const batchColumns = [
  { title: '批次号', key: 'batch_no', width: 140 },
  { title: '产品', key: 'product_name', render: (row: any) => row.product?.name || '-' },
  { title: '计划数量', key: 'planned_quantity' },
  { title: '状态', key: 'status', render: (row: any) => h('span', { class: `status-tag status-${getStatusClass(row.status)}` }, getStatusLabel(row.status)) }
]

const alertColumns = [
  { title: '食材', key: 'ingredient_name', render: (row: any) => row.ingredient?.name || '-' },
  { title: '当前库存', key: 'quantity' },
  { title: '最低库存', key: 'min_stock' },
  { title: '状态', key: 'status', render: (row: any) => h('span', { class: `status-tag status-${row.status === 'out_of_stock' ? 'error' : 'warning'}` }, getStockStatusLabel(row.status)) }
]

const rectificationColumns = [
  { title: '整改单号', key: 'rectification_no', width: 140 },
  { title: '标题', key: 'title', ellipsis: { tooltip: true } },
  { title: '截止日期', key: 'deadline', render: (row: any) => dayjs(row.deadline).format('MM-DD') },
  { title: '状态', key: 'status', render: (row: any) => h('span', { class: `status-tag status-${getRectStatusClass(row.status)}` }, getRectStatusLabel(row.status)) }
]

const getStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    preparing: '准备中', baking: '烘焙中', cooling: '冷却中',
    completed: '已完成', partial_damaged: '部分报损', fully_damaged: '全部报损'
  }
  return map[status] || status
}

const getStatusClass = (status: string) => {
  const map: Record<string, string> = {
    preparing: 'info', baking: 'warning', cooling: 'info',
    completed: 'success', partial_damaged: 'warning', fully_damaged: 'error'
  }
  return map[status] || 'default'
}

const getStockStatusLabel = (status: string) => {
  const map: Record<string, string> = { in_stock: '正常', low_stock: '库存不足', out_of_stock: '缺货', reserved: '已预留' }
  return map[status] || status
}

const getRectStatusLabel = (status: string) => {
  const map: Record<string, string> = { pending: '待处理', in_progress: '进行中', completed: '已完成', rejected: '已驳回', re_inspected: '已复查' }
  return map[status] || status
}

const getRectStatusClass = (status: string) => {
  const map: Record<string, string> = { pending: 'warning', in_progress: 'info', completed: 'success', rejected: 'error', re_inspected: 'info' }
  return map[status] || 'default'
}

const loadData = async () => {
  try {
    const [batches, stock, alerts, rectifications, losses] = await Promise.all([
      getBatches({ limit: 10 }),
      getLowStock(),
      getAlerts({ unhandled_only: true }),
      getRectifications({ status: 'pending', limit: 10 }),
      getLossRecords({ limit: 100 })
    ])

    recentBatches.value = batches
    lowStockItems.value = stock.slice(0, 5)
    pendingRectifications.value = rectifications.slice(0, 5)

    stats.todayBatches = batches.filter(b => dayjs(b.created_at).isSame(dayjs(), 'day')).length
    stats.pendingRectification = rectifications.length
    stats.lowStockItems = alerts.length
    stats.todayLoss = losses.filter(l => dayjs(l.created_at).isSame(dayjs(), 'day')).reduce((sum, l) => sum + l.total_amount, 0)

    const days = Array.from({ length: 7 }, (_, i) => dayjs().subtract(6 - i, 'day').format('MM-DD'))
    const dailyLoss = days.map(d => {
      return losses.filter(l => dayjs(l.created_at).format('MM-DD') === d).reduce((sum, l) => sum + l.total_amount, 0)
    })

    lossChartOption.value = {
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: days },
      yAxis: { type: 'value', name: '金额(元)' },
      series: [{
        type: 'line',
        smooth: true,
        data: dailyLoss,
        areaStyle: { color: 'rgba(24, 160, 88, 0.3)' },
        lineStyle: { color: '#18a058' },
        itemStyle: { color: '#18a058' }
      }]
    }
  } catch (e) {
    console.error('Failed to load dashboard data:', e)
  }
}

onMounted(() => {
  loadData()
})
</script>
