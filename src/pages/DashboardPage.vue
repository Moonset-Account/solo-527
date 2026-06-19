<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useApi } from '@/composables/useApi'
import { TrendCharts, FolderOpened, Download } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()
const { get, post } = useApi()

interface MetricCard {
  label: string
  value: string
  trend: number
  icon: string
  color: string
}

const metricCards = ref<MetricCard[]>([
  { label: '日活用户 DAU', value: '128,456', trend: 5.2, icon: 'user', color: '#10B981' },
  { label: '新增用户', value: '3,892', trend: 12.1, icon: 'plus', color: '#38BDF8' },
  { label: '7日留存率', value: '67.3%', trend: -1.8, icon: 'retention', color: '#F59E0B' },
  { label: '报表使用量', value: '2,341', trend: 8.7, icon: 'chart', color: '#8B5CF6' },
])

interface AnomalyEvent {
  id: number
  metricName: string
  deviation: number
  severity: string
  status: string
  detectedAt: string
}

interface ApprovalItem {
  id: number
  requesterName: string
  targetName: string
  accessLevel: string
  createdAt: string
  status: string
}

const anomalyEvents = ref<AnomalyEvent[]>([])
const approvalItems = ref<ApprovalItem[]>([])
const drawerVisible = ref(false)
const selectedEvent = ref<any>(null)

onMounted(async () => {
  const eventsData = await get<any[]>('/api/subscriptions/events')
  if (eventsData) {
    anomalyEvents.value = eventsData.slice(0, 5).map(e => ({
      id: e.id,
      metricName: e.metricName,
      deviation: e.deviation,
      severity: e.severity,
      status: e.status,
      detectedAt: e.detectedAt,
    }))
  }

  const approvalsData = await get<any[]>('/api/approvals?status=pending')
  if (approvalsData) {
    approvalItems.value = approvalsData.slice(0, 5).map(a => ({
      id: a.id,
      requesterName: a.requesterName,
      targetName: a.targetName,
      accessLevel: a.accessLevel,
      createdAt: a.createdAt,
      status: a.status,
    }))
  }
})

function severityType(s: string) {
  return s === 'high' ? 'danger' : s === 'medium' ? 'primary' : 'warning'
}

function statusType(s: string) {
  return s === 'new' ? 'primary' : s === 'acknowledged' ? 'warning' : 'success'
}

function severityLabel(s: string) {
  return s === 'high' ? '高' : s === 'medium' ? '中' : '低'
}

function statusLabel(s: string) {
  return s === 'new' ? '新建' : s === 'acknowledged' ? '已确认' : '已解决'
}

async function openEventDetail(row: AnomalyEvent) {
  const data = await get<any>(`/api/subscriptions/events/${row.id}`)
  if (data) {
    selectedEvent.value = data
    drawerVisible.value = true
  }
}

async function handleApprove(id: number) {
  const ok = await post(`/api/approvals/${id}/approve`, { reviewComment: '快速审批通过' })
  if (ok !== null) {
    ElMessage.success('审批通过')
    approvalItems.value = approvalItems.value.filter(a => a.id !== id)
  }
}

async function handleReject(id: number) {
  const ok = await post(`/api/approvals/${id}/reject`, { reviewComment: '审批拒绝' })
  if (ok !== null) {
    ElMessage.success('已拒绝')
    approvalItems.value = approvalItems.value.filter(a => a.id !== id)
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="grid grid-cols-4 gap-4">
      <div
        v-for="card in metricCards"
        :key="card.label"
        class="p-5 rounded-lg"
        style="background: var(--color-bg-card); border: 1px solid var(--color-border)"
      >
        <div class="text-sm mb-2" style="color: var(--color-text-secondary)">{{ card.label }}</div>
        <div class="font-mono text-2xl font-bold mb-1" style="color: var(--color-text)">{{ card.value }}</div>
        <div class="flex items-center gap-1 text-sm">
          <span :class="card.trend >= 0 ? 'text-emerald-500' : 'text-rose-500'">
            {{ card.trend >= 0 ? '↑' : '↓' }} {{ Math.abs(card.trend) }}%
          </span>
          <span style="color: var(--color-text-muted)">较昨日</span>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-3 gap-4">
      <div class="col-span-2 p-5 rounded-lg" style="background: var(--color-bg-card); border: 1px solid var(--color-border)">
        <h3 class="text-base font-semibold mb-4" style="color: var(--color-text)">异常告警</h3>
        <el-table :data="anomalyEvents" stripe @row-click="openEventDetail" class="cursor-pointer">
          <el-table-column prop="metricName" label="指标名称" />
          <el-table-column prop="deviation" label="偏差">
            <template #default="{ row }">
              <span class="font-mono">{{ row.deviation?.toFixed(1) }}%</span>
            </template>
          </el-table-column>
          <el-table-column prop="severity" label="严重程度">
            <template #default="{ row }">
              <el-tag :type="severityType(row.severity)" size="small">{{ severityLabel(row.severity) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态">
            <template #default="{ row }">
              <el-tag :type="statusType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="detectedAt" label="检测时间" width="170">
            <template #default="{ row }">
              <span class="text-xs" style="color: var(--color-text-muted)">{{ row.detectedAt }}</span>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="p-5 rounded-lg" style="background: var(--color-bg-card); border: 1px solid var(--color-border)">
        <h3 class="text-base font-semibold mb-4" style="color: var(--color-text)">快捷操作</h3>
        <div class="space-y-3">
          <el-button class="w-full" @click="router.push('/datasets')" :icon="FolderOpened">新建数据集</el-button>
          <el-button class="w-full" @click="router.push('/metrics')" :icon="TrendCharts">创建指标</el-button>
          <el-button class="w-full" @click="router.push('/exports')" :icon="Download">导出报表</el-button>
        </div>
      </div>
    </div>

    <div class="p-5 rounded-lg" style="background: var(--color-bg-card); border: 1px solid var(--color-border)">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-base font-semibold" style="color: var(--color-text)">待审批</h3>
        <el-button text type="primary" @click="router.push('/approvals')">查看全部</el-button>
      </div>
      <el-table :data="approvalItems" stripe>
        <el-table-column prop="requesterName" label="申请人" />
        <el-table-column prop="targetName" label="申请资源" />
        <el-table-column prop="accessLevel" label="访问级别" />
        <el-table-column prop="createdAt" label="申请时间" width="170">
          <template #default="{ row }">
            <span class="text-xs" style="color: var(--color-text-muted)">{{ row.createdAt }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180">
          <template #default="{ row }">
            <el-button type="success" size="small" @click="handleApprove(row.id)">通过</el-button>
            <el-button type="danger" size="small" @click="handleReject(row.id)">拒绝</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-drawer v-model="drawerVisible" title="异常事件详情" size="400px">
      <div v-if="selectedEvent" class="p-4 space-y-4">
        <div>
          <div class="text-sm mb-1" style="color: var(--color-text-secondary)">指标名称</div>
          <div class="font-medium">{{ selectedEvent.metricName }}</div>
        </div>
        <div>
          <div class="text-sm mb-1" style="color: var(--color-text-secondary)">偏差</div>
          <div class="font-mono font-medium">{{ selectedEvent.deviation?.toFixed(1) }}%</div>
        </div>
        <div>
          <div class="text-sm mb-1" style="color: var(--color-text-secondary)">严重程度</div>
          <el-tag :type="severityType(selectedEvent.severity)">{{ severityLabel(selectedEvent.severity) }}</el-tag>
        </div>
        <div>
          <div class="text-sm mb-1" style="color: var(--color-text-secondary)">根本原因</div>
          <div>{{ selectedEvent.rootCause || '暂无分析' }}</div>
        </div>
        <div>
          <div class="text-sm mb-1" style="color: var(--color-text-secondary)">是否口径相关</div>
          <el-tag :type="selectedEvent.isCaliberRelated ? 'warning' : 'info'">
            {{ selectedEvent.isCaliberRelated ? '是' : '否' }}
          </el-tag>
        </div>
      </div>
    </el-drawer>
  </div>
</template>
