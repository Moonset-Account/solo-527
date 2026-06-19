<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useApi } from '@/composables/useApi'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

const { get, post, put } = useApi()

const activeTab = ref('rules')

interface Subscription {
  id: number
  metricId: number
  metricName: string
  conditionType: string
  conditionValue: number
  direction: string
  notifyChannels: string
  isActive: boolean
}

interface AnomalyEvent {
  id: number
  metricId: number
  metricName: string
  detectedAt: string
  actualValue: number
  expectedValue: number
  deviation: number
  severity: string
  isCaliberRelated: boolean
  status: string
}

const subscriptions = ref<Subscription[]>([])
const events = ref<AnomalyEvent[]>([])
const createDialogVisible = ref(false)
const drawerVisible = ref(false)
const selectedEvent = ref<any>(null)

const subForm = ref({
  metricId: null as number | null,
  conditionType: 'threshold',
  conditionValue: 0,
  direction: 'both',
  channels: ['in_app'] as string[],
})

const metrics = ref<Array<{ id: number; name: string }>>([])

onMounted(async () => {
  await fetchSubscriptions()
  await fetchEvents()
  const mData = await get<any>('/api/metrics?pageSize=100')
  if (mData) {
    metrics.value = mData.items.map((m: any) => ({ id: m.id, name: m.name }))
  }
})

async function fetchSubscriptions() {
  const data = await get<any[]>('/api/subscriptions')
  if (data) subscriptions.value = data
}

async function fetchEvents() {
  const data = await get<any[]>('/api/subscriptions/events')
  if (data) events.value = data
}

function conditionLabel(t: string) {
  return t === 'threshold' ? '阈值' : t === 'percentage' ? '百分比' : '趋势'
}

function directionLabel(d: string) {
  return d === 'up' ? '上升' : d === 'down' ? '下降' : '双向'
}

function severityType(s: string) {
  return s === 'high' ? 'danger' : s === 'medium' ? 'warning' : 'info'
}

function severityLabel(s: string) {
  return s === 'high' ? '高' : s === 'medium' ? '中' : '低'
}

async function handleToggleSub(row: Subscription) {
  await put(`/api/subscriptions/${row.id}`, { isActive: row.isActive })
}

async function handleCreateSub() {
  if (!subForm.value.metricId) {
    ElMessage.warning('请选择指标')
    return
  }
  const ok = await post('/api/subscriptions', {
    metricId: subForm.value.metricId,
    conditionType: subForm.value.conditionType,
    conditionValue: subForm.value.conditionValue,
    direction: subForm.value.direction,
    notifyChannels: subForm.value.channels.join(','),
  })
  if (ok !== null) {
    ElMessage.success('创建成功')
    createDialogVisible.value = false
    fetchSubscriptions()
  }
}

async function openEventDetail(row: AnomalyEvent) {
  const data = await get<any>(`/api/subscriptions/events/${row.id}`)
  if (data) {
    selectedEvent.value = data
    drawerVisible.value = true
  }
}

async function handleAcknowledge(row: AnomalyEvent) {
  await put(`/api/subscriptions/events/${row.id}/acknowledge`)
  ElMessage.success('已确认')
  fetchEvents()
}
</script>

<template>
  <div class="space-y-4">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="订阅规则" name="rules" />
      <el-tab-pane label="异常事件" name="events" />
    </el-tabs>

    <div v-if="activeTab === 'rules'">
      <div class="flex justify-end mb-4">
        <el-button type="primary" :icon="Plus" @click="createDialogVisible = true">新建订阅</el-button>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <el-card v-for="sub in subscriptions" :key="sub.id" shadow="hover">
          <div class="flex items-center justify-between">
            <div>
              <div class="font-medium" style="color: var(--color-text)">{{ sub.metricName }}</div>
              <div class="text-sm mt-1" style="color: var(--color-text-secondary)">
                {{ conditionLabel(sub.conditionType) }}: {{ sub.conditionValue }} | {{ directionLabel(sub.direction) }}
              </div>
              <div class="text-xs mt-1" style="color: var(--color-text-muted)">渠道: {{ sub.notifyChannels }}</div>
            </div>
            <el-switch v-model="sub.isActive" @change="handleToggleSub(sub)" />
          </div>
        </el-card>
      </div>
    </div>

    <div v-if="activeTab === 'events'">
      <el-table :data="events" stripe @row-click="openEventDetail" class="cursor-pointer">
        <el-table-column prop="metricName" label="指标名称" min-width="140" />
        <el-table-column prop="detectedAt" label="检测时间" width="170" />
        <el-table-column prop="actualValue" label="实际值" width="100">
          <template #default="{ row }">
            <span class="font-mono">{{ row.actualValue }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="expectedValue" label="期望值" width="100">
          <template #default="{ row }">
            <span class="font-mono">{{ row.expectedValue }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="deviation" label="偏差" width="100">
          <template #default="{ row }">
            <span class="font-mono">{{ row.deviation?.toFixed(1) }}%</span>
          </template>
        </el-table-column>
        <el-table-column prop="severity" label="严重程度" width="100">
          <template #default="{ row }">
            <el-tag :type="severityType(row.severity)" size="small">{{ severityLabel(row.severity) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="口径相关" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isCaliberRelated ? 'warning' : 'info'" size="small">
              {{ row.isCaliberRelated ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'new' ? 'primary' : row.status === 'acknowledged' ? 'warning' : 'success'" size="small">
              {{ row.status === 'new' ? '新建' : row.status === 'acknowledged' ? '已确认' : '已解决' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button v-if="row.status === 'new'" text type="primary" size="small" @click.stop="handleAcknowledge(row)">确认</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="createDialogVisible" title="新建订阅" width="500px">
      <el-form :model="subForm" label-width="100px">
        <el-form-item label="指标">
          <el-select v-model="subForm.metricId" placeholder="选择指标" filterable style="width: 100%">
            <el-option v-for="m in metrics" :key="m.id" :label="m.name" :value="m.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="条件类型">
          <el-select v-model="subForm.conditionType" style="width: 100%">
            <el-option label="阈值" value="threshold" />
            <el-option label="百分比" value="percentage" />
            <el-option label="趋势" value="trend" />
          </el-select>
        </el-form-item>
        <el-form-item label="条件值">
          <el-input-number v-model="subForm.conditionValue" style="width: 100%" />
        </el-form-item>
        <el-form-item label="方向">
          <el-select v-model="subForm.direction" style="width: 100%">
            <el-option label="上升" value="up" />
            <el-option label="下降" value="down" />
            <el-option label="双向" value="both" />
          </el-select>
        </el-form-item>
        <el-form-item label="通知渠道">
          <el-checkbox-group v-model="subForm.channels">
            <el-checkbox label="站内通知" value="in_app" />
            <el-checkbox label="邮件" value="email" />
            <el-checkbox label="钉钉" value="dingtalk" />
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleCreateSub">创建</el-button>
      </template>
    </el-dialog>

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
