<template>
  <div v-if="exception">
    <div class="page-header">
      <h1 class="page-title">异常详情 - {{ exception.exceptionNo }}</h1>
      <div class="flex gap-8">
        <button class="btn" @click="navigateTo('/exceptions')">返回列表</button>
      </div>
    </div>

    <div class="grid-2 mb-24">
      <div class="card">
        <h3 class="mb-16">基本信息</h3>
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">异常编号</label>
            <div><strong>{{ exception.exceptionNo }}</strong></div>
          </div>
          <div class="form-group">
            <label class="form-label">异常类型</label>
            <div><span :class="['tag', getTypeClass(exception.type)]">{{ getTypeLabel(exception.type) }}</span></div>
          </div>
          <div class="form-group">
            <label class="form-label">当前状态</label>
            <div><span :class="['status-tag', getStatusClass(exception.status)]">{{ getStatusLabel(exception.status) }}</span></div>
          </div>
          <div class="form-group">
            <label class="form-label">优先级</label>
            <div><span :class="['tag', getPriorityClass(exception.priority)]">{{ getPriorityLabel(exception.priority) }}</span></div>
          </div>
          <div class="form-group">
            <label class="form-label">关联模块</label>
            <div>
              <a v-if="relatedLink" :href="relatedLink" class="text-primary">{{ exception.relatedNo }}</a>
              <span v-else class="text-secondary">-</span>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">影响级别</label>
            <div>{{ exception.impactLevel }}</div>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">异常标题</label>
          <div>{{ exception.title }}</div>
        </div>
        <div class="form-group">
          <label class="form-label">详细描述</label>
          <div>{{ exception.detail }}</div>
        </div>
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">创建人</label>
            <div>{{ exception.creator?.name }}</div>
          </div>
          <div class="form-group">
            <label class="form-label">创建时间</label>
            <div>{{ formatTime(exception.createdAt) }}</div>
          </div>
          <div class="form-group">
            <label class="form-label">处理人</label>
            <div>
              <span v-if="exception.handler">{{ exception.handler.name }} ({{ exception.handler.phone }})</span>
              <span v-else class="text-secondary">未分配</span>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">处理时间</label>
            <div>{{ exception.handledAt ? formatTime(exception.handledAt) : '-' }}</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="flex-between mb-16">
          <h3>处理时间线</h3>
        </div>
        <div v-if="historyList.length" class="timeline">
          <div v-for="(item, index) in historyList" :key="index" class="timeline-item">
            <div class="timeline-time">{{ formatTime(item.timestamp) }}</div>
            <div class="timeline-content">
              <div class="flex-between mb-8">
                <strong>{{ getActionLabel(item.action) }}</strong>
                <span class="text-secondary">{{ item.operatorName }}</span>
              </div>
              <div v-if="item.remark">{{ item.remark }}</div>
              <div v-if="item.stepStatus" class="mt-8">
                <span class="tag tag-blue">步骤 {{ item.stepIndex + 1 }}: {{ item.stepStatus }}</span>
              </div>
              <div v-if="item.handlerName" class="mt-8">
                <span class="text-secondary">处理人: {{ item.handlerName }}</span>
              </div>
              <div v-if="item.content" class="mt-8">
                <span class="text-secondary">备注: {{ item.content }}</span>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="empty">暂无处理记录</div>
      </div>
    </div>

    <div class="card mb-24">
      <h3 class="mb-16">⚠️ 影响分析</h3>
      <div class="impact-analysis">
        <div class="impact-section direct-impact">
          <div class="impact-header">
            <span class="impact-icon">🔴</span>
            <span class="impact-title">直接影响</span>
            <span class="impact-count">{{ impactScopeItems.direct.length }} 项</span>
          </div>
          <div v-if="impactScopeItems.direct.length" class="impact-list">
            <div v-for="(item, index) in impactScopeItems.direct" :key="index" class="impact-item">
              <div class="impact-item-text">{{ item }}</div>
            </div>
          </div>
          <div v-else class="empty">无直接影响</div>
        </div>

        <div class="impact-section indirect-impact">
          <div class="impact-header">
            <span class="impact-icon">🟡</span>
            <span class="impact-title">间接影响</span>
            <span class="impact-count">{{ impactScopeItems.indirect.length }} 项</span>
          </div>
          <div v-if="impactScopeItems.indirect.length" class="impact-list">
            <div v-for="(item, index) in impactScopeItems.indirect" :key="index" class="impact-item">
              <div class="impact-item-text">{{ item }}</div>
            </div>
          </div>
          <div v-else class="empty">无间接影响</div>
        </div>

        <div class="impact-section related-impact">
          <div class="impact-header">
            <span class="impact-icon">🔵</span>
            <span class="impact-title">关联范围</span>
            <span class="impact-count">{{ impactScopeItems.related.length }} 项</span>
          </div>
          <div v-if="impactScopeItems.related.length" class="impact-list">
            <div v-for="(item, index) in impactScopeItems.related" :key="index" class="impact-item">
              <div class="impact-item-text">{{ item }}</div>
            </div>
          </div>
          <div v-else class="empty">无关联范围</div>
        </div>
      </div>
    </div>

    <div class="card mb-24">
      <div class="flex-between mb-16">
        <h3>📋 处理步骤</h3>
        <button
          v-if="canUpdateStep"
          class="btn btn-primary btn-sm"
          @click="showStepModal = true"
        >
          + 更新步骤状态
        </button>
      </div>
      <div v-if="processOrder.length" class="process-steps">
        <div
          v-for="(step, index) in processOrder"
          :key="step.step || index"
          :class="['step-card', getStepCardClass(step.status)]"
        >
          <div class="step-number">
            <span :class="['step-number-badge', getStepNumberClass(step.status)]">{{ step.step || index + 1 }}</span>
          </div>
          <div class="step-content">
            <div class="step-header">
              <span class="step-name">{{ step.action || step.name || '未命名步骤' }}</span>
              <span :class="['step-status', getStepStatusClass(step.status)]">
                {{ getStepStatusLabel(step.status) }}
              </span>
            </div>
            <div class="step-description">{{ step.description || step.desc || '' }}</div>
            <div class="step-meta">
              <span class="step-responsible">
                👤 负责人: <strong>{{ step.responsible || step.handler || '未指定' }}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="empty">暂无处理步骤</div>
    </div>

    <div class="card mb-24">
      <h3 class="mb-16">💡 处理建议</h3>
      <div class="suggestion-box">
        <div class="suggestion-icon">💡</div>
        <div class="suggestion-content">
          <div class="suggestion-text">{{ exception.suggestion || '暂无建议' }}</div>
          <div class="suggestion-tips">
            <p>📌 提示：请按照上述处理步骤依次执行，每完成一个步骤请及时更新状态。如有疑问，请联系管理员。
          </div>
        </div>
      </div>
    </div>

    <div v-if="remarksList.length" class="card mb-24">
      <div class="flex-between mb-16">
        <h3>📝 备注记录</h3>
        <button
          v-if="canAddRemark"
          class="btn btn-primary btn-sm"
          @click="showRemarkModal = true"
        >
          + 添加备注
        </button>
      </div>
      <div class="remarks-list">
        <div v-for="remark in remarksList" :key="remark.id" class="remark-item">
          <div class="remark-header">
            <strong>{{ remark.operatorName }}</strong>
            <span class="text-secondary">{{ formatTime(remark.timestamp) }}</span>
          </div>
          <div class="remark-content">{{ remark.content }}</div>
        </div>
      </div>
    </div>
    <div v-else class="card mb-24">
      <div class="flex-between">
        <h3>📝 备注记录</h3>
        <button
          v-if="canAddRemark"
          class="btn btn-primary btn-sm"
          @click="showRemarkModal = true"
        >
          + 添加备注
        </button>
      </div>
      <div class="empty">暂无备注</div>
    </div>

    <div class="card action-bar">
      <div class="flex gap-8">
        <button
          v-if="canAssign"
          class="btn btn-primary"
          @click="showAssignModal = true"
        >
          🎯 分配处理人
        </button>
        <button
          v-if="canUpdateStep"
          class="btn"
          @click="showStepModal = true"
        >
          ✅ 更新步骤状态
        </button>
        <button
          v-if="canAddRemark"
          class="btn"
          @click="showRemarkModal = true"
        >
          📝 添加备注
        </button>
        <button
          v-if="canClose"
          class="btn btn-success"
          @click="handleClose"
        >
          🔒 关闭异常
        </button>
      </div>
    </div>

    <div v-if="showAssignModal" class="modal-mask" @click.self="showAssignModal = false">
      <div class="modal">
        <div class="modal-header">
          <span class="modal-title">分配处理人</span>
          <button class="btn" @click="showAssignModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">选择处理人</label>
            <select v-model="assignForm.handlerId" class="form-select">
              <option value="">请选择</option>
              <option v-for="u in handlers" :key="u.id" :value="u.id">{{ u.name }} ({{ u.role }})</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">备注</label>
            <textarea v-model="assignForm.remark" class="form-textarea" placeholder="请输入分配备注"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" @click="showAssignModal = false">取消</button>
          <button class="btn btn-primary" @click="handleAssign" :disabled="!assignForm.handlerId">确认分配</button>
        </div>
      </div>
    </div>

    <div v-if="showStepModal" class="modal-mask" @click.self="showStepModal = false">
      <div class="modal">
        <div class="modal-header">
          <span class="modal-title">更新步骤状态</span>
          <button class="btn" @click="showStepModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">选择步骤</label>
            <select v-model="stepForm.stepIndex" class="form-select">
              <option :value="index" v-for="(step, index) in processOrder" :key="step.step || index">
              步骤 {{ step.step || index + 1 }}: {{ step.action || step.name || '未命名' }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">更新状态</label>
            <select v-model="stepForm.stepStatus" class="form-select">
              <option value="PENDING">待处理</option>
              <option value="IN_PROGRESS">进行中</option>
              <option value="DONE">已完成</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">备注</label>
            <textarea v-model="stepForm.remark" class="form-textarea" placeholder="请输入处理备注"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" @click="showStepModal = false">取消</button>
          <button class="btn btn-primary" @click="handleUpdateStep">确认更新</button>
        </div>
      </div>
    </div>

    <div v-if="showRemarkModal" class="modal-mask" @click.self="showRemarkModal = false">
      <div class="modal">
        <div class="modal-header">
          <span class="modal-title">添加备注</span>
          <button class="btn" @click="showRemarkModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">备注内容</label>
            <textarea v-model="remarkForm.content" class="form-textarea" placeholder="请输入备注内容"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" @click="showRemarkModal = false">取消</button>
          <button class="btn btn-primary" @click="handleAddRemark" :disabled="!remarkForm.content.trim()">确认提交</button>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="empty">加载中...</div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import dayjs from 'dayjs'

const route = useRoute()
const { user, initAuth, isLoggedIn } = useAuth()

const exception = ref<any>(null)
const handlers = ref<any[]>([])
const showAssignModal = ref(false)
const showStepModal = ref(false)
const showRemarkModal = ref(false)

const assignForm = reactive({
  handlerId: '',
  remark: ''
})

const stepForm = reactive({
  stepIndex: 0,
  stepStatus: 'IN_PROGRESS',
  remark: ''
})

const remarkForm = reactive({
  content: ''
})

const id = computed(() => parseInt(route.params.id as string))

const impactScope = computed(() => {
  if (!exception.value?.impactScope) return { direct: [], indirect: [], related: [] }
  try {
    return JSON.parse(exception.value.impactScope)
  } catch (e) {
    return { direct: [], indirect: [], related: [] }
  }
})

function normalizeImpactList(val: any): string[] {
  if (!val) return []
  if (Array.isArray(val)) {
    return val.map(v => {
      if (typeof v === 'string') return v
      if (typeof v === 'object') return v.title || v.name || v.description || JSON.stringify(v)
      return String(v)
    })
  }
  if (typeof val === 'string') {
    if (val.includes('\n')) return val.split('\n').filter(Boolean)
    return [val]
  }
  if (typeof val === 'object') {
    return [val.title || val.description || JSON.stringify(val)]
  }
  return [String(val)]
}

const impactScopeItems = computed(() => {
  const scope = impactScope.value
  const raw = exception.value?.impactScope

  // 优先使用解析后的 JSON 对象
  if (scope && (Array.isArray(scope.direct) || scope.direct || scope.indirect || scope.related)) {
    return {
      direct: normalizeImpactList(scope.direct),
      indirect: normalizeImpactList(scope.indirect),
      related: normalizeImpactList(scope.related)
    }
  }

  // 如果是纯文本字符串，按影响层级尝试提取
  if (typeof raw === 'string' && raw) {
    if (raw.startsWith('{') || raw.startsWith('[')) {
      try {
        const parsed = JSON.parse(raw)
        return {
          direct: normalizeImpactList(parsed.direct || []),
          indirect: normalizeImpactList(parsed.indirect || []),
          related: normalizeImpactList(parsed.related || [])
        }
      } catch (e) {
        // ignore
      }
    }
    const lines = raw.split('\n').filter(Boolean)
    return {
      direct: lines.slice(0, 1),
      indirect: lines.slice(1, 3),
      related: lines.slice(3)
    }
  }

  return { direct: [], indirect: [], related: [] }
})

const processOrder = computed(() => {
  const raw = exception.value?.processOrder
  if (!raw) return []

  // 数字类型
  if (typeof raw === 'number') {
    return Array.from({ length: raw }).map((_, i) => ({
      step: i + 1,
      action: `处理步骤 ${i + 1}`,
      description: '',
      responsible: '',
      status: 'PENDING'
    }))
  }

  // JSON 字符串
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        return parsed.map((item, index) => ({
          step: item.step || item.sort || index + 1,
          action: item.action || item.name || item.title || `步骤 ${index + 1}`,
          description: item.description || item.desc || item.detail || '',
          responsible: item.responsible || item.handler || item.owner || '',
          status: item.status || 'PENDING'
        }))
      }
      if (typeof parsed === 'object') {
        return [{
          step: 1,
          action: parsed.action || parsed.name || '处理步骤',
          description: parsed.description || '',
          responsible: parsed.responsible || '',
          status: parsed.status || 'PENDING'
        }]
      }
    } catch (e) {
      // 非 JSON，当文本按行拆分
      const lines = raw.split('\n').filter(Boolean)
      if (lines.length > 0) {
        return lines.map((line, i) => ({
          step: i + 1,
          action: line.replace(/^\d+[.、\s]*/, ''),
          description: '',
          responsible: '',
          status: 'PENDING'
        }))
      }
    }
  }

  // 数组类型
  if (Array.isArray(raw)) {
    return raw.map((item, index) => ({
      step: item.step || index + 1,
      action: item.action || item.name || `步骤 ${index + 1}`,
      description: item.description || '',
      responsible: item.responsible || '',
      status: item.status || 'PENDING'
    }))
  }

  return []
})

const historyList = computed(() => {
  if (!exception.value?.history) return []
  try {
    const list = JSON.parse(exception.value.history)
    return list.reverse()
  } catch (e) {
    return []
  }
})

const remarksList = computed(() => {
  if (!exception.value?.remarks) return []
  try {
    const list = JSON.parse(exception.value.remarks)
    return list.reverse()
  } catch (e) {
    return []
  }
})

const relatedLink = computed(() => {
  if (!exception.value) return ''
  const sourceType = exception.value.sourceType
  const sourceId = exception.value.sourceId
  if (sourceType === 'VISITOR') return `/visitors/${sourceId}`
  if (sourceType === 'WORKORDER') return `/workorders/${sourceId}`
  if (sourceType === 'INSPECTION') return `/inspections/${sourceId}`
  return ''
})

const canAssign = computed(() => {
  return user.value && ['OPERATOR', 'ADMIN'].includes(user.value.role) &&
    exception.value?.status !== 'CLOSED'
})

const canUpdateStep = computed(() => {
  if (!exception.value || exception.value.status === 'CLOSED') return false
  if (!user.value) return false
  if (['OPERATOR', 'ADMIN'].includes(user.value.role)) return true
  if (exception.value.handlerId && exception.value.handlerId === user.value.id) return true
  return false
})

const canAddRemark = computed(() => {
  return user.value && exception.value?.status !== 'CLOSED'
})

const canClose = computed(() => {
  return user.value && ['OPERATOR', 'ADMIN'].includes(user.value.role) &&
    ['RESOLVED', 'PROCESSING', 'ASSIGNED'].includes(exception.value?.status)
})

onMounted(async () => {
  initAuth()
  if (!isLoggedIn.value) {
    navigateTo('/login')
    return
  }
  await Promise.all([
    loadDetail(),
    loadHandlers()
  ])
})

async function loadDetail() {
  try {
    const res: any = await useApiFetch(`/exceptions/${id.value}`)
    if (res.code === 200) {
      exception.value = res.data
      if (processOrder.value.length > 0) {
        stepForm.stepIndex = 0
      }
    }
  } catch (e) {
    // ignore
  }
}

async function loadHandlers() {
  try {
    const res: any = await useApiFetch('/users/engineers')
    if (res.code === 200) {
      handlers.value = res.data
    }
  } catch (e) {
    // ignore
  }
}

async function handleAssign() {
  if (!assignForm.handlerId) return
  try {
    const res: any = await useApiFetch(`/exceptions/${id.value}/assign`, {
      method: 'POST',
      body: assignForm
    })
    if (res.code === 200) {
      showAssignModal.value = false
      loadDetail()
    }
  } catch (e: any) {
    alert(e.data?.message || '操作失败')
  }
}

async function handleUpdateStep() {
  try {
    const res: any = await useApiFetch(`/exceptions/${id.value}/process`, {
      method: 'POST',
      body: stepForm
    })
    if (res.code === 200) {
      showStepModal.value = false
      loadDetail()
    }
  } catch (e: any) {
    alert(e.data?.message || '操作失败')
  }
}

async function handleAddRemark() {
  if (!remarkForm.content.trim()) return
  try {
    const res: any = await useApiFetch(`/exceptions/${id.value}/remark`, {
      method: 'POST',
      body: remarkForm
    })
    if (res.code === 200) {
      showRemarkModal.value = false
      remarkForm.content = ''
      loadDetail()
    }
  } catch (e: any) {
    alert(e.data?.message || '操作失败')
  }
}

async function handleClose() {
  if (!confirm('确定要关闭此异常吗？关闭后将无法修改。')) return
  try {
    const res: any = await useApiFetch(`/exceptions/${id.value}/close`, {
      method: 'POST'
    })
    if (res.code === 200) {
      loadDetail()
    }
  } catch (e: any) {
    alert(e.data?.message || '操作失败')
  }
}

function getStatusLabel(status: string) {
  const map: any = {
    PENDING: '待处理',
    ASSIGNED: '已分配',
    PROCESSING: '处理中',
    RESOLVED: '已解决',
    CLOSED: '已关闭'
  }
  return map[status] || status
}

function getStatusClass(status: string) {
  const map: any = {
    PENDING: 'status-pending',
    ASSIGNED: 'status-pending',
    PROCESSING: 'status-processing',
    RESOLVED: 'status-completed',
    CLOSED: 'status-closed'
  }
  return map[status] || ''
}

function getTypeLabel(type: string) {
  const map: any = {
    VISITOR_REJECT: '访客拒绝',
    WORKORDER_OVERDUE: '工单逾期',
    INSPECTION_ISSUE: '巡检问题',
    SYSTEM_ERROR: '系统错误'
  }
  return map[type] || type
}

function getTypeClass(type: string) {
  const map: any = {
    VISITOR_REJECT: 'tag-orange',
    WORKORDER_OVERDUE: 'tag-red',
    INSPECTION_ISSUE: 'tag-orange',
    SYSTEM_ERROR: 'tag-red'
  }
  return map[type] || 'tag-blue'
}

function getPriorityLabel(priority: string) {
  const map: any = {
    LOW: '低',
    MEDIUM: '中',
    HIGH: '高',
    URGENT: '紧急'
  }
  return map[priority] || priority
}

function getPriorityClass(priority: string) {
  const map: any = {
    LOW: 'tag-blue',
    MEDIUM: 'tag-orange',
    HIGH: 'tag-red',
    URGENT: 'tag-red'
  }
  return map[priority] || ''
}

function getActionLabel(action: string) {
  const map: any = {
    ASSIGN: '分配处理人',
    PROCESS: '更新处理步骤',
    REMARK: '添加备注',
    CLOSE: '关闭异常'
  }
  return map[action] || action
}

function getStepStatusLabel(status: string) {
  const map: any = {
    PENDING: '待处理',
    IN_PROGRESS: '进行中',
    DONE: '已完成'
  }
  return map[status] || status
}

function getStepStatusClass(status: string) {
  const map: any = {
    PENDING: 'step-status-pending',
    IN_PROGRESS: 'step-status-progress',
    DONE: 'step-status-done'
  }
  return map[status] || ''
}

function getStepCardClass(status: string) {
  const map: any = {
    PENDING: 'step-card-pending',
    IN_PROGRESS: 'step-card-progress',
    DONE: 'step-card-done'
  }
  return map[status] || ''
}

function getStepNumberClass(status: string) {
  const map: any = {
    PENDING: 'step-number-pending',
    IN_PROGRESS: 'step-number-progress',
    DONE: 'step-number-done'
  }
  return map[status] || ''
}

function formatTime(date: string) {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}
</script>

<style scoped>
.btn-sm {
  padding: 4px 12px;
  font-size: 12px;
}

.impact-analysis {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.impact-section {
  border-radius: 8px;
  padding: 16px;
  min-height: 200px;
}

.direct-impact {
  background: linear-gradient(135deg, #fff1f0 0%, #fff 100%);
  border: 1px solid #ffccc7;
}

.indirect-impact {
  background: linear-gradient(135deg, #fffbe6 0%, #fff 100%);
  border: 1px solid #ffe58f;
}

.related-impact {
  background: linear-gradient(135deg, #e6f7ff 0%, #fff 100%);
  border: 1px solid #91d5ff;
}

.impact-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px dashed rgba(0, 0, 0, 0.1);
}

.impact-icon {
  font-size: 20px;
}

.impact-title {
  font-weight: 600;
  flex: 1;
}

.impact-count {
  background: rgba(0, 0, 0, 0.1);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.impact-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.impact-item {
  background: rgba(255, 255, 255, 0.8);
  padding: 10px 12px;
  border-radius: 6px;
  border-left: 3px solid;
  font-size: 13px;
  line-height: 1.6;
}

.direct-impact .impact-item {
  border-left-color: #f5222d;
}

.indirect-impact .impact-item {
  border-left-color: #faad14;
}

.related-impact .impact-item {
  border-left-color: #1890ff;
}

.impact-item-text {
  color: var(--text-primary);
  line-height: 1.6;
  word-break: break-all;
}

.process-steps {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.step-card {
  display: flex;
  gap: 16px;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  transition: all 0.3s;
}

.step-card-pending {
  background: #fafafa;
  border-left: 4px solid #d9d9d9;
}

.step-card-progress {
  background: #e6f7ff;
  border-left: 4px solid #1890ff;
}

.step-card-done {
  background: #f6ffed;
  border-left: 4px solid #52c41a;
}

.step-number {
  flex-shrink: 0;
}

.step-number-badge {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 16px;
  color: #fff;
}

.step-number-pending {
  background: #d9d9d9;
}

.step-number-progress {
  background: #1890ff;
  animation: pulse 2s infinite;
}

.step-number-done {
  background: #52c41a;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(24, 144, 255, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(24, 144, 255, 0);
  }
}

.step-content {
  flex: 1;
}

.step-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.step-name {
  font-weight: 600;
  font-size: 15px;
}

.step-status {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.step-status-pending {
  background: #f5f5f5;
  color: #8c8c8c;
}

.step-status-progress {
  background: #e6f7ff;
  color: #1890ff;
}

.step-status-done {
  background: #f6ffed;
  color: #52c41a;
}

.step-description {
  color: var(--text-secondary);
  margin-bottom: 8px;
  line-height: 1.6;
}

.step-meta {
  font-size: 13px;
}

.step-responsible {
  color: var(--text-secondary);
}

.suggestion-box {
  display: flex;
  gap: 16px;
  padding: 20px;
  background: linear-gradient(135deg, #fffbe6 0%, #fff7e6 100%);
  border: 1px solid #ffe58f;
  border-radius: 8px;
}

.suggestion-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.suggestion-content {
  flex: 1;
}

.suggestion-text {
  font-size: 15px;
  line-height: 1.8;
  margin-bottom: 12px;
}

.suggestion-tips {
  padding: 12px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 6px;
  font-size: 13px;
  color: var(--text-secondary);
}

.remarks-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.remark-item {
  padding: 12px 16px;
  background: #fafafa;
  border-radius: 6px;
  border-left: 3px solid var(--primary-color);
}

.remark-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
}

.remark-content {
  line-height: 1.6;
}

.action-bar {
  display: flex;
  justify-content: flex-end;
  padding: 20px;
  background: #fafafa;
  border-radius: 8px;
}

@media (max-width: 900px) {
  .impact-analysis {
    grid-template-columns: 1fr;
  }
}
</style>
