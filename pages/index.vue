<template>
  <div class="container">
    <div class="grid-4" style="margin-bottom: 20px;">
      <div class="stat-card">
        <div class="label">待处理告警</div>
        <div class="value" style="color: #faad14;">{{ stats.pending }}</div>
      </div>
      <div class="stat-card">
        <div class="label">处理中告警</div>
        <div class="value" style="color: #1677ff;">{{ stats.processing }}</div>
      </div>
      <div class="stat-card">
        <div class="label">已完成告警</div>
        <div class="value" style="color: #52c41a;">{{ stats.completed }}</div>
      </div>
      <div class="stat-card">
        <div class="label">异常结束</div>
        <div class="value" style="color: #ff4d4f;">{{ stats.abnormal }}</div>
      </div>
    </div>

    <div class="card">
      <div class="header">
        <h1>告警中心</h1>
        <div style="display: flex; gap: 8px;">
          <button class="btn" @click="handleExport">导出CSV</button>
          <button class="btn btn-primary" @click="showCreate = true">+ 新建告警</button>
        </div>
      </div>

      <div class="filters">
        <div class="filter-item">
          <label>状态</label>
          <select v-model="filters.status" @change="handleSearch">
            <option value="">全部</option>
            <option value="PENDING">待处理</option>
            <option value="ACKNOWLEDGED">已确认</option>
            <option value="IN_PROGRESS">处理中</option>
            <option value="CHANGING">变更中</option>
            <option value="ROLLING_BACK">回滚中</option>
            <option value="COMPLETED">已完成</option>
            <option value="ABNORMAL_ENDED">异常结束</option>
          </select>
        </div>
        <div class="filter-item">
          <label>级别</label>
          <select v-model="filters.level" @change="handleSearch">
            <option value="">全部</option>
            <option value="INFO">INFO</option>
            <option value="WARNING">WARNING</option>
            <option value="ERROR">ERROR</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
        </div>
        <div class="filter-item">
          <label>关键字</label>
          <input v-model="filters.keyword" placeholder="告警编号/标题/主机" @keyup.enter="handleSearch" />
        </div>
        <div class="filter-item">
          <label>开始日期</label>
          <input v-model="filters.startDate" type="date" @change="handleSearch" />
        </div>
        <div class="filter-item">
          <label>结束日期</label>
          <input v-model="filters.endDate" type="date" @change="handleSearch" />
        </div>
        <div class="filter-item">
          <button class="btn btn-primary" @click="handleSearch">搜索</button>
        </div>
        <div class="filter-item">
          <button class="btn" @click="handleReset">重置</button>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>告警编号</th>
            <th>标题</th>
            <th>级别</th>
            <th>状态</th>
            <th>服务器</th>
            <th>指标</th>
            <th>上报人</th>
            <th>确认人</th>
            <th>门店</th>
            <th>时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in alert.list.value" :key="item.id">
            <td><NuxtLink :to="`/alerts/${item.id}`" style="font-family: monospace;">{{ item.alertNo }}</NuxtLink></td>
            <td>{{ item.title }}</td>
            <td><span :class="`badge badge-${item.level}`">{{ item.level }}</span></td>
            <td><span :class="`badge badge-${item.status}`">{{ statusLabel(item.status) }}</span></td>
            <td>{{ item.serverHost }}<br /><span style="color: #999; font-size: 12px;">{{ item.serverIp }}</span></td>
            <td>{{ item.metric }}<br /><span style="color: #999; font-size: 12px;">{{ item.currentValue }}/{{ item.threshold }}</span></td>
            <td>{{ item.reporter?.realName || '-' }}</td>
            <td>{{ item.acknowledger?.realName || '-' }}</td>
            <td>{{ item.storeCode || '-' }}</td>
            <td>{{ formatDate(item.createdAt) }}</td>
            <td>
              <button v-if="item.status === 'PENDING'" class="btn btn-sm btn-primary" @click="handleAcknowledge(item)">确认</button>
              <button class="btn btn-sm" @click="navigateTo(`/alerts/${item.id}`)">详情</button>
            </td>
          </tr>
          <tr v-if="alert.list.value.length === 0">
            <td colspan="11" class="empty">暂无数据</td>
          </tr>
        </tbody>
      </table>

      <div class="pagination">
        <button :disabled="alert.page.value <= 1" @click="changePage(alert.page.value - 1)">上一页</button>
        <span>第 {{ alert.page.value }} / {{ Math.ceil(alert.total.value / alert.pageSize.value) || 1 }} 页，共 {{ alert.total.value }} 条</span>
        <button :disabled="alert.page.value >= Math.ceil(alert.total.value / alert.pageSize.value)" @click="changePage(alert.page.value + 1)">下一页</button>
      </div>
    </div>

    <div v-if="showCreate" class="modal-backdrop" @click.self="showCreate = false">
      <div class="modal">
        <div class="modal-header">
          <h3>新建告警</h3>
          <button class="btn btn-sm" @click="showCreate = false">×</button>
        </div>
        <div class="modal-body">
          <div class="row">
            <div class="col">
              <div class="form-group">
                <label>标题 *</label>
                <input v-model="createForm.title" />
              </div>
            </div>
            <div class="col">
              <div class="form-group">
                <label>级别 *</label>
                <select v-model="createForm.level">
                  <option value="INFO">INFO</option>
                  <option value="WARNING">WARNING</option>
                  <option value="ERROR">ERROR</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>
            </div>
          </div>
          <div class="row">
            <div class="col">
              <div class="form-group">
                <label>服务器主机名 *</label>
                <input v-model="createForm.serverHost" />
              </div>
            </div>
            <div class="col">
              <div class="form-group">
                <label>服务器IP *</label>
                <input v-model="createForm.serverIp" />
              </div>
            </div>
          </div>
          <div class="row">
            <div class="col">
              <div class="form-group">
                <label>监控指标 *</label>
                <input v-model="createForm.metric" placeholder="如: CPU使用率" />
              </div>
            </div>
            <div class="col">
              <div class="form-group">
                <label>阈值 *</label>
                <input v-model="createForm.threshold" placeholder="如: 80%" />
              </div>
            </div>
            <div class="col">
              <div class="form-group">
                <label>当前值 *</label>
                <input v-model="createForm.currentValue" placeholder="如: 95%" />
              </div>
            </div>
          </div>
          <div class="form-group">
            <label>描述</label>
            <textarea v-model="createForm.description" rows="3"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" @click="showCreate = false">取消</button>
          <button class="btn btn-primary" @click="handleCreate">提交</button>
        </div>
      </div>
    </div>

    <div v-if="showAck" class="modal-backdrop" @click.self="showAck = false">
      <div class="modal">
        <div class="modal-header">
          <h3>确认告警</h3>
          <button class="btn btn-sm" @click="showAck = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>确认备注</label>
            <textarea v-model="ackNote" rows="3" placeholder="请输入处理说明..."></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" @click="showAck = false">取消</button>
          <button class="btn btn-primary" @click="confirmAcknowledge">确认</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AlertItem } from '~/composables/useAlert'

const alert = useAlert()
const { user } = useAuth()

const filters = reactive({
  status: '',
  level: '',
  keyword: '',
  startDate: '',
  endDate: ''
})

const stats = reactive({ pending: 0, processing: 0, completed: 0, abnormal: 0 })
const showCreate = ref(false)
const showAck = ref(false)
const ackNote = ref('')
const currentAlert = ref<AlertItem | null>(null)

const createForm = reactive({
  title: '',
  level: 'WARNING',
  serverHost: '',
  serverIp: '',
  metric: '',
  threshold: '',
  currentValue: '',
  description: '',
  storeCode: ''
})

const statusLabels: Record<string, string> = {
  PENDING: '待处理',
  ACKNOWLEDGED: '已确认',
  IN_PROGRESS: '处理中',
  CHANGING: '变更中',
  ROLLING_BACK: '回滚中',
  COMPLETED: '已完成',
  ABNORMAL_ENDED: '异常结束'
}

function statusLabel(s: string) { return statusLabels[s] || s }
function formatDate(s: string) { return new Date(s).toLocaleString() }

async function handleSearch() {
  alert.page.value = 1
  await loadData()
}

function handleReset() {
  Object.assign(filters, { status: '', level: '', keyword: '', startDate: '', endDate: '' })
  handleSearch()
}

async function changePage(p: number) {
  alert.page.value = p
  await loadData()
}

async function loadData() {
  await alert.fetchList(filters)
  stats.pending = alert.list.value.filter(a => a.status === 'PENDING').length
  stats.processing = alert.list.value.filter(a => ['ACKNOWLEDGED', 'IN_PROGRESS', 'CHANGING', 'ROLLING_BACK'].includes(a.status)).length
  stats.completed = alert.list.value.filter(a => a.status === 'COMPLETED').length
  stats.abnormal = alert.list.value.filter(a => a.status === 'ABNORMAL_ENDED').length
}

function handleAcknowledge(item: AlertItem) {
  currentAlert.value = item
  ackNote.value = ''
  showAck.value = true
}

async function confirmAcknowledge() {
  if (!currentAlert.value) return
  try {
    await alert.acknowledge(currentAlert.value.id, ackNote.value)
    showAck.value = false
    await loadData()
  } catch (e: unknown) {
    alert(e instanceof Error ? e.message : '操作失败')
  }
}

async function handleCreate() {
  if (user.value?.storeCode) createForm.storeCode = user.value.storeCode
  try {
    await alert.createAlert(createForm)
    showCreate.value = false
    Object.assign(createForm, { title: '', level: 'WARNING', serverHost: '', serverIp: '', metric: '', threshold: '', currentValue: '', description: '', storeCode: '' })
    await loadData()
  } catch (e: unknown) {
    alert(e instanceof Error ? e.message : '创建失败')
  }
}

function handleExport() {
  const query = new URLSearchParams()
  if (filters.status) query.set('status', filters.status)
  if (filters.level) query.set('level', filters.level)
  if (filters.keyword) query.set('keyword', filters.keyword)
  if (filters.startDate) query.set('startDate', filters.startDate)
  if (filters.endDate) query.set('endDate', filters.endDate)
  window.open(`/api/alerts/export?${query.toString()}`, '_blank')
}

onMounted(loadData)
</script>
