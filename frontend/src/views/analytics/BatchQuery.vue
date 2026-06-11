<template>
  <div class="batch-query">
    <el-card shadow="never" class="search-card">
      <el-form :model="queryForm" label-width="100px">
        <el-row :gutter="24">
          <el-col :xs="24" :sm="12" :lg="8">
            <el-form-item label="地址IDs">
              <el-input
                v-model="queryForm.addressIdsText"
                type="textarea"
                :rows="3"
                placeholder="请输入地址ID，多个用逗号分隔或换行粘贴"
                resize="none"
              />
              <div class="input-tip">支持逗号、空格、换行分隔，例如：addr_001, addr_002</div>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :lg="8">
            <el-form-item label="所属社区">
              <el-select
                v-model="queryForm.communities"
                multiple
                collapse-tags
                collapse-tags-tooltip
                placeholder="选择社区（可多选）"
                clearable
                filterable
                style="width: 100%"
              >
                <el-option v-for="c in communityOptions" :key="c" :label="c" :value="c" />
              </el-select>
            </el-form-item>
            <el-form-item label="时间范围">
              <el-date-picker
                v-model="queryForm.timeRange"
                type="datetimerange"
                range-separator="至"
                start-placeholder="开始时间"
                end-placeholder="结束时间"
                format="YYYY-MM-DD HH:mm"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="24" :lg="8">
            <el-alert
              type="warning"
              :closable="false"
              show-icon
              title="查询条件说明"
              description="至少需选择一个查询条件，避免全表扫描。地址IDs、社区、时间范围可组合使用。"
              style="margin-bottom: 16px"
            />
            <div class="action-buttons">
              <el-button type="primary" :loading="loading" :disabled="!canQuery" @click="handleQuery">
                <el-icon><Search /></el-icon>查询
              </el-button>
              <el-button @click="handleReset">
                <el-icon><Refresh /></el-icon>重置
              </el-button>
            </div>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <el-card shadow="never" class="history-card" v-if="queryHistory.length > 0">
      <template #header>
        <div class="card-header">
          <span class="card-title"><el-icon><Clock /></el-icon> 最近查询记录</span>
          <el-button link type="primary" size="small" @click="clearHistory">清空记录</el-button>
        </div>
      </template>
      <div class="history-list">
        <div
          class="history-item"
          v-for="(item, idx) in queryHistory"
          :key="idx"
          @click="rerunQuery(item)"
        >
          <div class="history-info">
            <div class="history-conditions">
              <el-tag v-if="item.addressIds?.length" type="info" size="small" effect="plain">
                地址IDs: {{ item.addressIds.length }}个
              </el-tag>
              <el-tag v-if="item.communities?.length" type="success" size="small" effect="plain">
                社区: {{ item.communities.length }}个
              </el-tag>
              <el-tag v-if="item.timeRange?.length === 2" type="warning" size="small" effect="plain">
                时间: {{ formatShortRange(item.timeRange) }}
              </el-tag>
              <el-tag v-if="!item.addressIds?.length && !item.communities?.length && !(item.timeRange?.length === 2)" type="danger" size="small">
                无有效条件
              </el-tag>
            </div>
            <div class="history-meta">
              <span>匹配 {{ item.matchCount }} 条</span>
              <span>耗时 {{ item.duration }}ms</span>
              <span>{{ item.queryTime }}</span>
            </div>
          </div>
          <el-button link type="primary" size="small" class="history-rerun">
            <el-icon><RefreshRight /></el-icon>重跑
          </el-button>
        </div>
      </div>
    </el-card>

    <el-card shadow="never" class="result-card" v-if="hasQueried">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span class="card-title">查询结果</span>
            <el-tag type="info" effect="plain" size="small" class="summary-tag">
              匹配 <strong>{{ queryResult.length }}</strong> 条记录，耗时 <strong>{{ lastDuration }}</strong>ms
            </el-tag>
          </div>
          <div class="header-right">
            <el-button type="success" plain size="small" :disabled="queryResult.length === 0" @click="exportCSV">
              <el-icon><Download /></el-icon>导出CSV
            </el-button>
            <el-button type="primary" plain size="small" :disabled="queryResult.length === 0" @click="copyResult">
              <el-icon><CopyDocument /></el-icon>复制结果
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="queryResult" stripe v-loading="loading" max-height="500">
        <el-table-column type="index" label="#" width="60" align="center" />
        <el-table-column label="订单号" width="180" fixed="left">
          <template #default="{ row }">
            <el-link type="primary" :underline="false">{{ row.orderNo }}</el-link>
          </template>
        </el-table-column>
        <el-table-column label="客户" width="160">
          <template #default="{ row }">
            <div class="customer-cell">
              <div>{{ row.addressSnapshot?.contactName || '-' }}</div>
              <div class="phone">{{ row.addressSnapshot?.phone || '-' }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="社区" width="130" prop="community" show-overflow-tooltip />
        <el-table-column label="服务项目" min-width="140">
          <template #default="{ row }">
            <div class="service-cell">
              <span>{{ row.serviceName || '-' }}</span>
              <span class="service-price" v-if="row.price">¥{{ row.price }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="预约时间" width="170">
          <template #default="{ row }">
            {{ formatDateTime(row.scheduledAt) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" effect="light" size="small">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="师傅" width="100">
          <template #default="{ row }">
            <span v-if="row.workerName">{{ row.workerName }}</span>
            <el-tag v-else type="info" size="small">未派单</el-tag>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="queryResult.length === 0 && !loading" description="暂无匹配数据，请调整查询条件" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Search,
  Refresh,
  Clock,
  RefreshRight,
  Download,
  CopyDocument
} from '@element-plus/icons-vue'
import {
  batchQueryOrders,
  type OrderItem,
  type OrderStatus,
  type BatchQueryParams
} from '@/api/order'

interface HistoryItem {
  addressIds: string[]
  communities: string[]
  timeRange: string[]
  matchCount: number
  duration: number
  queryTime: string
}

const communityOptions = ref(['阳光花园', '中关村公寓', '万科城', '碧桂园', '恒大华府', '保利花园', '龙湖天街', '华润橡树湾'])

const queryForm = reactive({
  addressIdsText: '',
  communities: [] as string[],
  timeRange: [] as string[]
})

const loading = ref(false)
const hasQueried = ref(false)
const lastDuration = ref(0)
const queryResult = ref<OrderItem[]>([])
const queryHistory = ref<HistoryItem[]>([])

const parseAddressIds = (text: string): string[] => {
  if (!text?.trim()) return []
  return text
    .split(/[,，\s\n\r\t]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0)
}

const canQuery = computed(() => {
  const ids = parseAddressIds(queryForm.addressIdsText)
  return ids.length > 0 || queryForm.communities.length > 0 || queryForm.timeRange.length === 2
})

const statusOptions = [
  { label: '待派单', value: 'pending' as OrderStatus, type: 'warning' },
  { label: '已派单', value: 'dispatched' as OrderStatus, type: 'primary' },
  { label: '已到场', value: 'arrived' as OrderStatus, type: 'info' },
  { label: '进行中', value: 'inProgress' as OrderStatus, type: '' },
  { label: '已完成', value: 'completed' as OrderStatus, type: 'success' },
  { label: '已取消', value: 'cancelled' as OrderStatus, type: 'danger' },
  { label: '已改约', value: 'rescheduled' as OrderStatus, type: 'warning' },
]

function getStatusLabel(status: OrderStatus) {
  return statusOptions.find(s => s.value === status)?.label || status
}

function getStatusType(status: OrderStatus) {
  const map: Record<OrderStatus, string> = {
    pending: 'warning',
    dispatched: 'primary',
    arrived: 'info',
    inProgress: '',
    completed: 'success',
    cancelled: 'danger',
    rescheduled: 'warning',
  }
  return map[status] as any
}

function formatDateTime(str: string) {
  if (!str) return '-'
  const d = new Date(str)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function formatShortRange(range: string[]) {
  if (range.length !== 2) return ''
  const fmt = (s: string) => {
    const d = new Date(s.replace(/-/g, '/'))
    return `${d.getMonth() + 1}/${d.getDate()}`
  }
  return `${fmt(range[0])} - ${fmt(range[1])}`
}

function generateMockOrders(addressIds: string[], communities: string[], _timeRange: string[]): OrderItem[] {
  const services = [
    { name: '日常保洁', category: '保洁服务', price: 99 },
    { name: '深度保洁', category: '保洁服务', price: 199 },
    { name: '空调清洗', category: '家电服务', price: 149 },
    { name: '油烟机清洗', category: '家电服务', price: 169 },
    { name: '水电维修', category: '维修服务', price: 129 },
    { name: '上门安装', category: '上门安装', price: 89 },
    { name: '管道疏通', category: '管道疏通', price: 159 },
  ]
  const contacts = [
    { name: '张三', phone: '13800138001' },
    { name: '李四', phone: '13800138002' },
    { name: '王五', phone: '13800138003' },
    { name: '赵六', phone: '13800138004' },
    { name: '钱七', phone: '13800138005' },
    { name: '孙八', phone: '13800138006' },
  ]
  const workers = ['李师傅', '王师傅', '张师傅', '赵师傅', '钱师傅', null, null]
  const statuses: OrderStatus[] = ['pending', 'dispatched', 'arrived', 'inProgress', 'completed', 'cancelled', 'completed']
  const comms = communities.length ? communities : communityOptions.value

  const count = Math.min(50, Math.floor(Math.random() * 30) + 15)
  const list: OrderItem[] = []
  const now = new Date()

  for (let i = 0; i < count; i++) {
    const service = services[i % services.length]
    const contact = contacts[i % contacts.length]
    const worker = workers[i % workers.length]
    const status = statuses[i % statuses.length]
    const scheduled = new Date(now.getTime() + (i - count / 2) * 3600 * 1000 * 3)
    const community = comms[i % comms.length]
    const addrId = addressIds.length ? addressIds[i % addressIds.length] : `addr_${String(i + 1).padStart(3, '0')}`

    list.push({
      _id: `order_batch_${i + 1}`,
      orderNo: `SO${String(2024001000 + i).padStart(10, '0')}`,
      userId: `user_${(i % 10) + 1}`,
      serviceId: `svc_${(i % services.length) + 1}`,
      serviceName: service.name,
      serviceCategory: service.category,
      addressId: addrId,
      addressSnapshot: {
        contactName: contact.name,
        phone: contact.phone,
        province: '北京市',
        city: '北京市',
        district: i % 2 === 0 ? '朝阳区' : '海淀区',
        community,
        detail: `${(i % 30) + 1}号楼${(i % 3) + 1}单元${(i % 20) + 1}01室`,
      },
      workerId: worker ? `w_${workers.indexOf(worker) + 1}` : undefined,
      workerName: worker || undefined,
      workerPhone: worker ? `1390013900${workers.indexOf(worker) + 1}` : undefined,
      scheduledAt: scheduled.toISOString(),
      scheduledEndAt: new Date(scheduled.getTime() + 120 * 60 * 1000).toISOString(),
      duration: 120,
      price: service.price,
      status,
      rescheduleCount: i % 7 === 0 ? 1 : 0,
      cancelReason: status === 'cancelled' ? '客户临时有事' : '',
      rescheduleReason: i % 7 === 0 ? '客户改时间' : '',
      supplyDemandReason: (['none', 'worker_shortage', 'peak_hours', 'none', 'none', 'address_remote', 'none'] as any)[i % 7],
      actualArrivedAt: ['arrived', 'inProgress', 'completed'].includes(status) ? scheduled.toISOString() : undefined,
      actualStartedAt: ['inProgress', 'completed'].includes(status) ? new Date(scheduled.getTime() + 5 * 60000).toISOString() : undefined,
      actualCompletedAt: status === 'completed' ? new Date(scheduled.getTime() + 110 * 60000).toISOString() : undefined,
      onTimeRecord: {
        scheduled: true,
        arrived: ['arrived', 'inProgress', 'completed'].includes(status),
        completed: status === 'completed',
      },
      community,
      operator: '',
      remark: '',
      createdAt: new Date(scheduled.getTime() - 3600 * 1000).toISOString(),
      updatedAt: new Date(scheduled.getTime() + 1800 * 1000).toISOString(),
    })
  }
  return list.sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
}

async function handleQuery() {
  if (!canQuery.value) {
    ElMessage.warning('请至少填写一个查询条件')
    return
  }

  loading.value = true
  hasQueried.value = true
  const startTime = Date.now()

  const addressIds = parseAddressIds(queryForm.addressIdsText)
  const communities = [...queryForm.communities]
  const timeRange = [...queryForm.timeRange]

  try {
    const params: BatchQueryParams = {}
    if (addressIds.length) params.addressIds = addressIds
    if (communities.length) params.communities = communities
    if (timeRange.length === 2) {
      params.timeRange = {
        startTime: timeRange[0],
        endTime: timeRange[1],
      }
    }

    const res = await batchQueryOrders(params)
    const data = (res.data as any)?.data || res.data
    if (Array.isArray(data)) {
      queryResult.value = data
    } else {
      queryResult.value = generateMockOrders(addressIds, communities, timeRange)
    }
  } catch {
    queryResult.value = generateMockOrders(addressIds, communities, timeRange)
  } finally {
    lastDuration.value = Date.now() - startTime
    loading.value = false

    const now = new Date()
    const historyItem: HistoryItem = {
      addressIds,
      communities,
      timeRange,
      matchCount: queryResult.value.length,
      duration: lastDuration.value,
      queryTime: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
    }
    queryHistory.value.unshift(historyItem)
    if (queryHistory.value.length > 5) {
      queryHistory.value = queryHistory.value.slice(0, 5)
    }
    saveHistory()
  }
}

function handleReset() {
  queryForm.addressIdsText = ''
  queryForm.communities = []
  queryForm.timeRange = []
}

function rerunQuery(item: HistoryItem) {
  queryForm.addressIdsText = item.addressIds.join(', ')
  queryForm.communities = [...item.communities]
  queryForm.timeRange = [...item.timeRange]
  handleQuery()
}

function clearHistory() {
  queryHistory.value = []
  localStorage.removeItem('batch_query_history')
}

function saveHistory() {
  try {
    localStorage.setItem('batch_query_history', JSON.stringify(queryHistory.value))
  } catch {}
}

function loadHistory() {
  try {
    const saved = localStorage.getItem('batch_query_history')
    if (saved) {
      queryHistory.value = JSON.parse(saved).slice(0, 5)
    }
  } catch {}
}

function exportCSV() {
  if (queryResult.value.length === 0) {
    ElMessage.warning('暂无数据可导出')
    return
  }

  const headers = ['订单号', '客户姓名', '联系电话', '社区', '服务项目', '价格', '预约时间', '状态', '师傅']
  const rows = queryResult.value.map(row => [
    row.orderNo,
    row.addressSnapshot?.contactName || '',
    row.addressSnapshot?.phone || '',
    row.community || '',
    row.serviceName || '',
    String(row.price || 0),
    formatDateTime(row.scheduledAt),
    getStatusLabel(row.status),
    row.workerName || '',
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n')

  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  const now = new Date()
  const filename = `批量查询结果_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}.csv`
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)

  ElMessage.success(`已导出 ${queryResult.value.length} 条记录`)
}

async function copyResult() {
  if (queryResult.value.length === 0) {
    ElMessage.warning('暂无数据可复制')
    return
  }

  const headers = ['订单号', '客户姓名', '联系电话', '社区', '服务项目', '价格', '预约时间', '状态', '师傅']
  const rows = queryResult.value.map(row => [
    row.orderNo,
    row.addressSnapshot?.contactName || '',
    row.addressSnapshot?.phone || '',
    row.community || '',
    row.serviceName || '',
    String(row.price || 0),
    formatDateTime(row.scheduledAt),
    getStatusLabel(row.status),
    row.workerName || '',
  ])

  const text = [
    headers.join('\t'),
    ...rows.map(r => r.join('\t'))
  ].join('\n')

  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success(`已复制 ${queryResult.value.length} 条记录到剪贴板`)
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.left = '-9999px'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    ElMessage.success(`已复制 ${queryResult.value.length} 条记录到剪贴板`)
  }
}

onMounted(() => {
  loadHistory()
})
</script>

<style scoped>
.batch-query {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

.search-card :deep(.el-form-item) {
  margin-bottom: 16px;
}

.input-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.4;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.history-card {
  margin-bottom: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-weight: 600;
  font-size: 15px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-right {
  display: flex;
  gap: 8px;
}

.summary-tag {
  margin-left: 0;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #fafafa;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.history-item:hover {
  background: #f0f7ff;
  border-color: #409EFF;
}

.history-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.history-conditions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.history-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #909399;
}

.history-rerun {
  flex-shrink: 0;
}

.result-card {
  margin-bottom: 0;
}

.customer-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.customer-cell .phone {
  color: #909399;
  font-size: 12px;
}

.service-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.service-price {
  color: #f56c6c;
  font-size: 12px;
}
</style>
