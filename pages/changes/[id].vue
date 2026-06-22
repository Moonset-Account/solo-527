<template>
  <div class="container" v-if="change.detail.value">
    <div class="card">
      <div class="header">
        <h1>
          <span style="font-family: monospace; font-size: 16px; color: #6b7280;">{{ change.detail.value.changeNo }}</span>
          {{ change.detail.value.title }}
        </h1>
        <span :class="`badge badge-${change.detail.value.status}`">{{ statusLabel(change.detail.value.status) }}</span>
      </div>

      <div class="row" style="margin-bottom: 20px;">
        <div class="col">
          <div style="color: #6b7280; font-size: 13px;">变更类型</div>
          <div style="font-weight: 500;">{{ change.detail.value.type }}</div>
        </div>
        <div class="col">
          <div style="color: #6b7280; font-size: 13px;">影响范围</div>
          <div style="font-weight: 500;">{{ change.detail.value.impactScope }}</div>
        </div>
        <div class="col">
          <div style="color: #6b7280; font-size: 13px;">关联告警</div>
          <div>
            <NuxtLink v-if="change.detail.value.alert" :to="`/alerts/${change.detail.value.alert.id}`">
              {{ change.detail.value.alert.alertNo }} - {{ change.detail.value.alert.title }}
            </NuxtLink>
          </div>
        </div>
        <div class="col">
          <div style="color: #6b7280; font-size: 13px;">提交人</div>
          <div style="font-weight: 500;">{{ change.detail.value.submitter?.realName || '-' }}</div>
        </div>
      </div>

      <div class="row" style="margin-bottom: 20px;">
        <div class="col">
          <div style="color: #6b7280; font-size: 13px;">审批人</div>
          <div>{{ change.detail.value.approver?.realName || '-' }}</div>
        </div>
        <div class="col">
          <div style="color: #6b7280; font-size: 13px;">计划窗口</div>
          <div>
            {{ change.detail.value.windowStart ? formatDate(change.detail.value.windowStart) : '-' }}
            ~ {{ change.detail.value.windowEnd ? formatDate(change.detail.value.windowEnd) : '-' }}
          </div>
        </div>
        <div class="col">
          <div style="color: #6b7280; font-size: 13px;">实际窗口</div>
          <div>
            {{ change.detail.value.windowOpenedAt ? formatDate(change.detail.value.windowOpenedAt) : '-' }}
            ~ {{ change.detail.value.windowClosedAt ? formatDate(change.detail.value.windowClosedAt) : '-' }}
          </div>
        </div>
        <div class="col">
          <div style="color: #6b7280; font-size: 13px;">提交时间</div>
          <div>{{ formatDate(change.detail.value.createdAt) }}</div>
        </div>
      </div>

      <div v-if="change.detail.value.abnormalReason" style="margin-bottom: 20px;">
        <div style="color: #ff4d4f; font-size: 13px; margin-bottom: 4px;">异常原因</div>
        <div style="padding: 12px; background: #fff1f0; border-radius: 4px; color: #cf1322;">{{ change.detail.value.abnormalReason }}</div>
      </div>

      <div v-if="change.detail.value.approvalNote" style="margin-bottom: 20px;">
        <div style="color: #6b7280; font-size: 13px; margin-bottom: 4px;">审批意见</div>
        <div style="padding: 12px; background: #f5f7fa; border-radius: 4px;">{{ change.detail.value.approvalNote }}</div>
      </div>

      <div class="row" style="margin-bottom: 20px;">
        <div class="col">
          <div style="color: #6b7280; font-size: 13px; margin-bottom: 4px;">变更描述</div>
          <div style="padding: 12px; background: #f5f7fa; border-radius: 4px; white-space: pre-wrap;">{{ change.detail.value.description }}</div>
        </div>
      </div>
      <div class="row" style="margin-bottom: 20px;">
        <div class="col">
          <div style="color: #6b7280; font-size: 13px; margin-bottom: 4px;">变更实施方案</div>
          <div style="padding: 12px; background: #e6f4ff; border-radius: 4px; white-space: pre-wrap;">{{ change.detail.value.changePlan }}</div>
        </div>
      </div>
      <div class="row" style="margin-bottom: 20px;">
        <div class="col">
          <div style="color: #6b7280; font-size: 13px; margin-bottom: 4px;">回滚方案</div>
          <div style="padding: 12px; background: #fff1f0; border-radius: 4px; white-space: pre-wrap;">{{ change.detail.value.rollbackPlan }}</div>
        </div>
      </div>

      <div style="display: flex; gap: 8px; flex-wrap: wrap;">
        <template v-if="isAdmin">
          <button v-if="canApprove" class="btn btn-success" @click="handleApprove(true)">批准</button>
          <button v-if="canApprove" class="btn btn-danger" @click="handleApprove(false)">驳回</button>
          <button v-if="canOpenWindow" class="btn btn-primary" @click="handleOpenWindow">开启变更窗口</button>
          <button v-if="canAbnormal" class="btn btn-warning" @click="showAbnormal = true">标记异常结束</button>
        </template>
        <button v-if="canCloseWindow" class="btn btn-success" @click="showClose = true">关闭窗口/完成</button>
        <button v-if="canRollback" class="btn btn-warning" @click="showRollback = true">执行回滚</button>
      </div>
    </div>

    <div class="card">
      <h3 style="margin-bottom: 16px;">操作日志</h3>
      <div class="timeline">
        <div v-for="log in change.detail.value.operationLogs" :key="log.id" class="timeline-item">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <strong>{{ actionLabel(log.actionType) }}</strong>
            <span style="color: #9ca3af; font-size: 12px;">{{ formatDate(log.createdAt) }}</span>
          </div>
          <div style="color: #6b7280; font-size: 13px;">
            操作人: {{ log.user?.realName || '系统' }}
            <span v-if="log.note" style="margin-left: 16px;">{{ log.note }}</span>
          </div>
          <div v-if="log.beforeData || log.afterData" style="margin-top: 8px; padding: 8px; background: #f5f7fa; border-radius: 4px; font-size: 12px; font-family: monospace;">
            <div v-if="log.beforeData"><strong style="color: #ff4d4f;">变更前:</strong> {{ JSON.stringify(log.beforeData) }}</div>
            <div v-if="log.afterData" style="margin-top: 4px;"><strong style="color: #52c41a;">变更后:</strong> {{ JSON.stringify(log.afterData) }}</div>
          </div>
        </div>
        <div v-if="change.detail.value.operationLogs.length === 0" class="empty">暂无日志</div>
      </div>
    </div>

    <div v-if="showApprove" class="modal-backdrop" @click.self="showApprove = false">
      <div class="modal">
        <div class="modal-header"><h3>{{ approveType ? '批准变更' : '驳回变更' }}</h3><button class="btn btn-sm" @click="showApprove = false">×</button></div>
        <div class="modal-body">
          <div class="form-group">
            <label>审批意见</label>
            <textarea v-model="approveNote" rows="3"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" @click="showApprove = false">取消</button>
          <button :class="`btn ${approveType ? 'btn-success' : 'btn-danger'}`" @click="confirmApprove">确认</button>
        </div>
      </div>
    </div>

    <div v-if="showClose" class="modal-backdrop" @click.self="showClose = false">
      <div class="modal">
        <div class="modal-header"><h3>关闭变更窗口</h3><button class="btn btn-sm" @click="showClose = false">×</button></div>
        <div class="modal-body">
          <div class="form-group">
            <label>完成说明</label>
            <textarea v-model="closeNote" rows="3"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" @click="showClose = false">取消</button>
          <button class="btn btn-success" @click="confirmClose">确认完成</button>
        </div>
      </div>
    </div>

    <div v-if="showRollback" class="modal-backdrop" @click.self="showRollback = false">
      <div class="modal">
        <div class="modal-header"><h3>执行回滚</h3><button class="btn btn-sm" @click="showRollback = false">×</button></div>
        <div class="modal-body">
          <div style="padding: 12px; background: #fff1f0; border-radius: 4px; margin-bottom: 16px;">
            <strong>回滚方案:</strong><br />
            {{ change.detail.value?.rollbackPlan }}
          </div>
          <div class="form-group">
            <label>回滚说明</label>
            <textarea v-model="rollbackNote" rows="3"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" @click="showRollback = false">取消</button>
          <button class="btn btn-warning" @click="confirmRollback">执行回滚</button>
        </div>
      </div>
    </div>

    <div v-if="showAbnormal" class="modal-backdrop" @click.self="showAbnormal = false">
      <div class="modal">
        <div class="modal-header"><h3>标记异常结束</h3><button class="btn btn-sm" @click="showAbnormal = false">×</button></div>
        <div class="modal-body">
          <div class="form-group">
            <label>异常原因 *</label>
            <textarea v-model="abnormalReason" rows="4" required></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" @click="showAbnormal = false">取消</button>
          <button class="btn btn-danger" @click="confirmAbnormal">确认异常结束</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const change = useChange()
const { isAdmin } = useAuth()

const showApprove = ref(false)
const showClose = ref(false)
const showRollback = ref(false)
const showAbnormal = ref(false)
const approveType = ref(true)
const approveNote = ref('')
const closeNote = ref('')
const rollbackNote = ref('')
const abnormalReason = ref('')

const statusLabels: Record<string, string> = {
  PENDING: '待审批', APPROVED: '已批准', REJECTED: '已驳回',
  IMPLEMENTING: '执行中', COMPLETED: '已完成', ROLLED_BACK: '已回滚',
  ABNORMAL_ENDED: '异常结束', CANCELLED: '已取消'
}
const actionLabels: Record<string, string> = {
  ALERT_ACKNOWLEDGE: '告警确认', ALERT_STATUS_CHANGE: '告警状态变更',
  CHANGE_REQUEST_SUBMIT: '变更申请提交', CHANGE_REQUEST_APPROVE: '变更申请批准',
  CHANGE_REQUEST_REJECT: '变更申请驳回', CHANGE_WINDOW_OPEN: '变更窗口开启',
  CHANGE_WINDOW_CLOSE: '变更窗口关闭', ROLLBACK_EXECUTE: '执行回滚',
  ACCOUNT_APPLY: '账号申请', DEVICE_INSPECT: '设备巡检',
  ABNORMAL_END: '异常结束', USER_LOGIN: '用户登录', USER_LOGOUT: '用户登出'
}
function statusLabel(s: string) { return statusLabels[s] || s }
function actionLabel(s: string) { return actionLabels[s] || s }
function formatDate(s: string) { return new Date(s).toLocaleString() }

const canApprove = computed(() => change.detail.value?.status === 'PENDING')
const canOpenWindow = computed(() => change.detail.value?.status === 'APPROVED')
const canCloseWindow = computed(() => change.detail.value?.status === 'IMPLEMENTING')
const canRollback = computed(() => ['IMPLEMENTING', 'COMPLETED'].includes(change.detail.value?.status || ''))
const canAbnormal = computed(() => !['COMPLETED', 'ROLLED_BACK', 'ABNORMAL_ENDED', 'REJECTED', 'CANCELLED'].includes(change.detail.value?.status || ''))

function handleApprove(approved: boolean) {
  approveType.value = approved
  approveNote.value = ''
  showApprove.value = true
}
async function confirmApprove() {
  if (!change.detail.value) return
  try {
    await change.approve(change.detail.value.id, approveType.value, approveNote.value)
    showApprove.value = false
    await loadDetail()
  } catch (e: unknown) {
    alert(e instanceof Error ? e.message : '操作失败')
  }
}

async function handleOpenWindow() {
  if (!change.detail.value) return
  try {
    await change.openWindow(change.detail.value.id)
    await loadDetail()
  } catch (e: unknown) {
    alert(e instanceof Error ? e.message : '操作失败')
  }
}
async function confirmClose() {
  if (!change.detail.value) return
  try {
    await change.closeWindow(change.detail.value.id, closeNote.value)
    showClose.value = false
    closeNote.value = ''
    await loadDetail()
  } catch (e: unknown) {
    alert(e instanceof Error ? e.message : '操作失败')
  }
}
async function confirmRollback() {
  if (!change.detail.value) return
  try {
    await change.rollback(change.detail.value.id, rollbackNote.value)
    showRollback.value = false
    rollbackNote.value = ''
    await loadDetail()
  } catch (e: unknown) {
    alert(e instanceof Error ? e.message : '操作失败')
  }
}
async function confirmAbnormal() {
  if (!change.detail.value || !abnormalReason.value) return
  try {
    await change.markAbnormal(change.detail.value.id, abnormalReason.value)
    showAbnormal.value = false
    abnormalReason.value = ''
    await loadDetail()
  } catch (e: unknown) {
    alert(e instanceof Error ? e.message : '操作失败')
  }
}

async function loadDetail() {
  const id = parseInt(route.params.id as string)
  await change.fetchDetail(id)
}

onMounted(loadDetail)
</script>
