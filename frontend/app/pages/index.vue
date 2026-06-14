<template>
  <div>
    <n-grid :cols="4" :x-gap="16" :y-gap="16">
      <n-gi>
        <n-card size="small" :style="{ background: 'linear-gradient(135deg, #1B2A4A, #2d4a7a)', color: '#fff' }">
          <n-statistic label="合同总数" :value="stats.contracts">
            <template #prefix>
              <n-icon :size="20"><BriefcaseOutline /></n-icon>
            </template>
          </n-statistic>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card size="small" :style="{ background: 'linear-gradient(135deg, #E8A838, #f0c060)', color: '#fff' }">
          <n-statistic label="进行中巡检" :value="stats.inProgress">
            <template #prefix>
              <n-icon :size="20"><ClipboardOutline /></n-icon>
            </template>
          </n-statistic>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card size="small" :style="{ background: 'linear-gradient(135deg, #FF4D4F, #ff7875)', color: '#fff' }">
          <n-statistic label="待处理延期" :value="stats.delayed">
            <template #prefix>
              <n-icon :size="20"><NotificationsOutline /></n-icon>
            </template>
          </n-statistic>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card size="small" :style="{ background: 'linear-gradient(135deg, #36B37E, #57d9a3)', color: '#fff' }">
          <n-statistic label="本月质量评分" :value="stats.qualityScore">
            <template #prefix>
              <n-icon :size="20"><BarChartOutline /></n-icon>
            </template>
          </n-statistic>
        </n-card>
      </n-gi>
    </n-grid>

    <n-grid :cols="2" :x-gap="16" :y-gap="16" style="margin-top: 16px">
      <n-gi>
        <n-card title="待办事项" size="small">
          <n-data-table :columns="todoColumns" :data="todoItems" :bordered="false" size="small" />
        </n-card>
      </n-gi>
      <n-gi>
        <n-card title="延期预警" size="small">
          <n-data-table :columns="delayColumns" :data="delayedItems" :bordered="false" size="small" />
        </n-card>
      </n-gi>
    </n-grid>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, h } from 'vue'
import { useRouter } from '#imports'
import { useMessage, NTag, NButton } from 'naive-ui'
import {
  BriefcaseOutline,
  ClipboardOutline,
  NotificationsOutline,
  BarChartOutline,
} from '@vicons/ionicons5'
import { contractApi, inspectionApi, reportApi } from '~/utils/api'

definePageMeta({
  layout: 'default',
})

const router = useRouter()
const message = useMessage()

const stats = reactive({
  contracts: 0,
  inProgress: 0,
  delayed: 0,
  qualityScore: 0,
})

const todoItems = ref<any[]>([])
const delayedItems = ref<any[]>([])

const todoColumns = [
  { title: '类型', key: 'type', width: 100, render: (row: any) => h(NTag, { size: 'small', type: row.type === '巡检' ? 'warning' : row.type === '验收' ? 'info' : 'success' }, { default: () => row.type }) },
  { title: '任务名称', key: 'name' },
  { title: '状态', key: 'status', width: 80 },
  { title: '操作', key: 'action', width: 60, render: (row: any) => h(NButton, { size: 'tiny', text: true, onClick: () => router.push(row.link) }, { default: () => '查看' }) },
]

const delayColumns = [
  { title: '任务', key: 'name' },
  { title: '合同', key: 'contract_name' },
  { title: '延期天数', key: 'days', width: 80, render: (row: any) => h(NTag, { size: 'small', type: 'error' }, { default: () => `${row.days}天` }) },
  {
    title: '操作', key: 'action', width: 120,
    render: (row: any) => h(NButton, { size: 'tiny', type: 'warning', onClick: () => handleNotify(row) }, { default: () => '通知材料员' }),
  },
]

async function handleNotify(row: any) {
  message.success(`已通知材料员: ${row.name}`)
}

async function loadDashboard() {
  try {
    const [contractRes, inspectionRes, qualityRes] = await Promise.allSettled([
      contractApi.list({ page: 1, size: 1 }),
      inspectionApi.list({ status: 'in_progress' }),
      reportApi.quality({ year: new Date().getFullYear(), month: new Date().getMonth() + 1 }),
    ])
    if (contractRes.status === 'fulfilled') {
      stats.contracts = contractRes.value.total
    }
    if (inspectionRes.status === 'fulfilled') {
      stats.inProgress = inspectionRes.value.total
    }
    if (qualityRes.status === 'fulfilled') {
      stats.qualityScore = qualityRes.value.avg_score ?? 0
      stats.delayed = qualityRes.value.delay_count ?? 0
    }
  } catch {}
  try {
    const pendingRes = await inspectionApi.list({ status: 'pending' })
    todoItems.value = pendingRes.items.map((i: any) => ({
      type: '巡检',
      name: i.node_name,
      status: '待分派',
      link: `/inspections/${i.id}`,
    }))
  } catch {}
}

onMounted(() => {
  loadDashboard()
})
</script>
