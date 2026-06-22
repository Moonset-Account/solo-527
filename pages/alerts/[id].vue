<template>
  <div class="container" v-if="alert.detail.value">
    <div class="card">
      <div class="header">
        <h1>
          <span style="font-family: monospace; font-size: 16px; color: #6b7280;">{{ alert.detail.value.alertNo }}</span>
          {{ alert.detail.value.title }}
        </h1>
        <div style="display: flex; gap: 8px;">
          <span :class="`badge badge-${alert.detail.value.level}`">{{ alert.detail.value.level }}</span>
          <span :class="`badge badge-${alert.detail.value.status}`">{{ statusLabel(alert.detail.value.status) }}</span>
        </div>
      </div>

      <div class="row" style="margin-bottom: 20px;">
        <div class="col">
          <div style="color: #6b7280; font-size: 13px;">服务器</div>
          <div style="font-weight: 500;">{{ alert.detail.value.serverHost }} ({{ alert.detail.value.serverIp }})</div>
        </div>
        <div class="col">
          <div style="color: #6b7280; font-size: 13px;">监控指标</div>
          <div style="font-weight: 500;">{{ alert.detail.value.metric }}</div>
        </div>
        <div class="col">
          <div style="color: #6b7280; font-size: 13px;">阈值/当前值</div>
          <div style="font-weight: 500;">{{ alert.detail.value.threshold }} / {{ alert.detail.value.currentValue }}</div>
        </div>
        <div class="col">
          <div style="color: #6b7280; font-size: 13px;">门店</div>
          <div style="font-weight: 500;">{{ alert.detail.value.storeCode || '-' }}</div>
        </div>
      </div>

      <div class="row" style="margin-bottom: 20px;">
        <div class="col">
          <div style="color: #6b7280; font-size: 13px;">上报人</div>
          <div>{{ alert.detail.value.reporter?.realName || '-' }}</div>
        </div>
        <div class="col">
          <div style="color: #6b7280; font-size: 13px;">确认人/时间</div>
          <div>{{ alert.detail.value.acknowledger?.realName || '-' }} {{ alert.detail.value.acknowledgedAt ? formatDate(alert.detail.value.acknowledgedAt) : '' }}</div>
        </div>
        <div class="col">
          <div style="color: #6b7280; font-size: 13px;">解决时间</div>
          <div>{{ alert.detail.value.resolvedAt ? formatDate(alert.detail.value.resolvedAt) : '-' }}</div>
        </div>
        <div class="col">
          <div style="color: #6b7280; font-size: 13px;">创建时间</div>
          <div>{{ formatDate(alert.detail.value.createdAt) }}</div>
        </div>
      </div>

      <div v-if="alert.detail.value.description" style="margin-bottom: 20px;">
        <div style="color: #6b7280; font-size: 13px; margin-bottom: 4px;">告警描述</div>
        <div style="padding: 12px; background: #f5f7fa; border-radius: 4px;">{{ alert.detail.value.description }}</div>
      </div>

      <div v-if="alert.detail.value.abnormalReason" style="margin-bottom: 20px;">
        <div style="color: #ff4d4f; font-size: 13px; margin-bottom: 4px;">异常原因</div>
        <div style="padding: 12px; background: #fff1f0; border-radius: 4px; color: #cf1322;">{{ alert.detail.value.abnormalReason }}</div>
      </div>

      <div style="display: flex; gap: 8px; flex-wrap: wrap;">
        <button v-if="alert.detail.value.status === 'PENDING'" class="btn btn-primary" @click="handleAcknowledge">确认告警</button>
        <button v-if="canStartProcess" class="btn btn-primary" @click="handleChangeStatus('IN_PROGRESS')">开始处理</button>
        <button v-if="canCreateChange" class="btn btn-primary" @click="showCreateChange = true">发起变更申请</button>
        <button v-if="canComplete" class="btn btn-success" @click="handleComplete">标记完成</button>
        <button v-if="canAbnormal" class="btn btn-danger" @click="showAbnormal = true">异常结束</button>
      </div>
    </div>

    <div class="card" v-if="alert.detail.value.changeRequests.length > 0">
      <h3 style="margin-bottom: 16px;">关联变更申请</h3>
      <table>
        <thead>
          <tr>
            <th>变更编号</th>
            <th>标题</th>
            <th>状态</th>
            <th>提交人</th>
            <th>时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in alert.detail.value.changeRequests" :key="c.id">
            <td style="font-family: monospace;">{{ c.changeNo }}</td>
            <td>{{ c.title }}</td>
            <td><span :class="`badge badge-${c.status}`">{{ c.status }}</span></td>
            <td>{{ c.submitter?.realName || '-' }}</td>
            <td>{{ formatDate(c.createdAt) }}</td>
            <td><button class="btn btn-sm" @click="navigateTo(`/changes/${c.id}`)">查看</button></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="card">
      <h3 style="margin-bottom: 16px;">操作日志</h3>
      <div class="timeline">
        <div v-for="log in alert.detail.value.operationLogs" :key="log.id" class="timeline-item">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <strong>{{ actionTypeLabel(log.actionType) }}</strong>
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
        <div v-if="alert.detail.value.operationLogs.length === 0" class="empty">暂无日志</div>
      </div>
    </div>

    <div v-if="showCreateChange" class="modal-backdrop" @click.self="showCreateChange = false">
      <div class="modal" style="max-width: 700px;">
        <div class="modal-header"><h3>发起变更申请</h3><button class="btn btn-sm" @click="showCreateChange = false">×</button></div>
        <div class="modal-body">
          <div class="form-group">
            <label>变更标题 *</label>
            <input v-model="changeForm.title" />
          </div>
          <div class="row">
            <div class="col">
              <div class="form-group">
                <label>变更类型 *</label>
                <select v-model="changeForm.type">
                  <option value="配置变更">配置变更</option>
                  <option value="版本升级">版本升级</option>
                  <option value="硬件更换">硬件更换</option>
                  <option value="数据修复">数据修复</option>
                  <option value="其他">其他</option>
                </select>
              </div>
            </div>
            <div class="col">
              <div class="form-group">
                <label>影响范围 *</label>
                <input v-model="changeForm.impactScope" placeholder="如: 所有门店POS系统" />
              </div>
            </div>
          </div>
          <div class="row">
            <div class="col">
              <div class="form-group">
                <label>计划开始时间</label>
                <input v-model="changeForm.windowStart" type="datetime-local" />
              </div>
            </div>
            <div class="col">
              <div class="form-group">
                <label>计划结束时间</label>
                <input v-model="changeForm.windowEnd" type="datetime-local" />
              </div>
            </div>
          </div>
          <div class="form-group">
            <label>变更描述 *</label>
            <textarea v-model="changeForm.description" rows="3"></textarea>
          </div>
          <div class="form-group">
            <label>变更实施方案 *</label>
            <textarea v-model="changeForm.changePlan" rows="4"></textarea>
          </div>
          <div class="form-group">
            <label>回滚方案 *</label>
            <textarea v-model="changeForm.rollbackPlan" rows="4"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" @click="showCreateChange = false">取消</button>
          <button class="btn btn-primary" @click="handleCreateChange">提交申请</button>
        </div>
      </div>
    </div>

    <div v-if="showAbnormal" class="modal-backdrop" @click.self="showAbnormal = false">
      <div class="modal">
        <div class="modal-header"><h3>异常结束</h3><button class="btn btn-sm" @click="showAbnormal = false">×</button></div>
        <div class="modal-body">
          <div class="form-group">
            <label>异常原因 *</label>
            <textarea v-model="abnormalReason" rows="4" placeholder="请详细说明异常原因..." required></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" @click="showAbnormal = false">取消</button>
          <button class="btn btn-danger" @click="confirmAbnormal">确认异常结束</button>
        </div>
      </div>
    </div>

    <div v-if="showComplete" class="modal-backdrop" @click.self="showComplete = false">
      <div class="modal">
        <div class="modal-header"><h3>标记完成</h3><button class="btn btn-sm" @click="showComplete = false">×</button></div>
        <div class="modal-body">
          <div class="form-group">
            <label>处理说明</label>
            <textarea v-model="completeNote" rows="3"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" @click="showComplete = false">取消</button>
          <button class="btn btn-success" @click="confirmComplete">确认完成</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AlertStatus } from '@prisma/client'

const route = useRoute()
const alert = useAlert()
const change = useChange()

const showCreateChange = ref(false)
const showAbnormal = ref(false)
const showComplete = ref(false)
const abnormalReason = ref('')
const completeNote = ref('')

const changeForm = reactive({
  title: '',
  type: '配置变更',
  description: '',
  impactScope: '',
  changePlan: '',
  rollbackPlan: '',
  windowStart: '',
  windowEnd: ''
})

const statusLabels: Record<string, string> = {
  PENDING: '待处理', ACKNOWLEDGED: '已确认', IN_PROGRESS: '处理中',
  CHANGING: '变更中', ROLLING_BACK: '回滚中', COMPLETED: '已完成', ABNORMAL_ENDED: '异常结束'
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
function actionTypeLabel(t: string) { return actionLabels[t] || t }
function formatDate(s: string) { return new Date(s).toLocaleString() }

const canStartProcess = computed(() => ['ACKNOWLEDGED'].includes(alert.detail.value?.status || ''))
const canCreateChange = computed(() => ['ACKNOWLEDGED', 'IN_PROGRESS'].includes(alert.detail.value?.status || ''))
const canComplete = computed(() => ['ACKNOWLEDGED', 'IN_PROGRESS', 'CHANGING', 'ROLLING_BACK'].includes(alert.detail.value?.status || ''))
const canAbnormal = computed(() => !['COMPLETED', 'ABNORMAL_ENDED'].includes(alert.detail.value?.status || ''))

async function handleAcknowledge() {
  if (!alert.detail.value) return
  const note = prompt('请输入确认备注:')
  await alert.acknowledge(alert.detail.value.id, note || undefined)
  await loadDetail()
}

async function handleChangeStatus(status: AlertStatus) {
  if (!alert.detail.value) return
  await alert.changeStatus(alert.detail.value.id, status)
  await loadDetail()
}

function handleComplete() { showComplete.value = true }
async function confirmComplete() {
  if (!alert.detail.value) return
  await alert.changeStatus(alert.detail.value.id, 'COMPLETED', completeNote.value)
  showComplete.value = false
  completeNote.value = ''
  await loadDetail()
}

function showAbnormalFn() { showAbnormal.value = true }
async function confirmAbnormal() {
  if (!alert.detail.value || !abnormalReason.value) return
  await alert.changeStatus(alert.detail.value.id, 'ABNORMAL_ENDED', undefined, abnormalReason.value)
  showAbnormal.value = false
  abnormalReason.value = ''
  await loadDetail()
}

async function handleCreateChange() {
  if (!alert.detail.value) return
  try {
    await change.createChange({
      alertId: alert.detail.value.id,
      ...changeForm,
      windowStart: changeForm.windowStart || undefined,
      windowEnd: changeForm.windowEnd || undefined
    })
    showCreateChange.value = false
    Object.assign(changeForm, { title: '', type: '配置变更', description: '', impactScope: '', changePlan: '', rollbackPlan: '', windowStart: '', windowEnd: '' })
    await loadDetail()
  } catch (e: unknown) {
    alert(e instanceof Error ? e.message : '提交失败')
  }
}

async function loadDetail() {
  const id = parseInt(route.params.id as string)
  await alert.fetchDetail(id)
}

onMounted(loadDetail)
</script>
