<template>
  <div v-if="visitor">
    <div class="page-header">
      <h1 class="page-title">访客详情 - {{ visitor.visitNo }}</h1>
      <div class="flex gap-8">
        <button class="btn" @click="navigateTo('/visitors')">返回列表</button>
      </div>
    </div>

    <div class="grid-2 mb-24">
      <div class="card">
        <h3 class="mb-16">基本信息</h3>
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">访客编号</label>
            <div>{{ visitor.visitNo }}</div>
          </div>
          <div class="form-group">
            <label class="form-label">状态</label>
            <div><span :class="['status-tag', getStatusClass(visitor.status)]">{{ getStatusLabel(visitor.status) }}</span></div>
          </div>
          <div class="form-group">
            <label class="form-label">访客姓名</label>
            <div>{{ visitor.visitorName }}</div>
          </div>
          <div class="form-group">
            <label class="form-label">身份证号</label>
            <div>{{ visitor.visitorIdCard || '-' }}</div>
          </div>
          <div class="form-group">
            <label class="form-label">手机号</label>
            <div>{{ visitor.visitorPhone }}</div>
          </div>
          <div class="form-group">
            <label class="form-label">访客单位</label>
            <div>{{ visitor.visitorCompany || '-' }}</div>
          </div>
          <div class="form-group">
            <label class="form-label">来访日期</label>
            <div>{{ formatDate(visitor.visitDate) }}</div>
          </div>
          <div class="form-group">
            <label class="form-label">来访结束日期</label>
            <div>{{ visitor.visitEndDate ? formatDate(visitor.visitEndDate) : '-' }}</div>
          </div>
          <div class="form-group">
            <label class="form-label">来访人数</label>
            <div>{{ visitor.visitorCount }} 人</div>
          </div>
          <div class="form-group">
            <label class="form-label">被访人</label>
            <div>{{ visitor.hostName }}</div>
          </div>
        </div>
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">被访人电话</label>
            <div>{{ visitor.hostPhone }}</div>
          </div>
          <div class="form-group">
            <label class="form-label">签到时间</label>
            <div>{{ visitor.checkInTime ? formatTime(visitor.checkInTime) : '-' }}</div>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">来访事由</label>
          <div>{{ visitor.purpose }}</div>
        </div>
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">被访租户</label>
            <div>{{ visitor.tenant?.name }}</div>
          </div>
          <div class="form-group">
            <label class="form-label">创建时间</label>
            <div>{{ formatTime(visitor.createdAt) }}</div>
          </div>
        </div>
      </div>

      <div class="card">
        <h3 class="mb-16">审核历史</h3>
        <div class="timeline">
          <div class="timeline-item">
            <div class="timeline-time">{{ formatTime(visitor.createdAt) }}</div>
            <div class="timeline-content">
              <div class="flex-between mb-8">
                <strong><span class="status-tag status-pending">待审核</span></strong>
                <span class="text-secondary">{{ visitor.creator?.name }}</span>
              </div>
              <div>创建访客预约申请</div>
            </div>
          </div>
          <div v-if="visitor.status !== 'PENDING' && visitor.handler" class="timeline-item">
            <div class="timeline-time">{{ formatTime(visitor.updatedAt) }}</div>
            <div class="timeline-content">
              <div class="flex-between mb-8">
                <strong><span :class="['status-tag', getStatusClass(visitor.status)]">{{ getStatusLabel(visitor.status) }}</span></strong>
                <span class="text-secondary">{{ visitor.handler?.name }}</span>
              </div>
              <div>{{ visitor.rejectReason || (visitor.status === 'APPROVED' ? '审核通过' : visitor.status === 'REJECTED' ? '审核拒绝' : '状态变更') }}</div>
            </div>
          </div>
          <div v-if="visitor.checkInTime" class="timeline-item">
            <div class="timeline-time">{{ formatTime(visitor.checkInTime) }}</div>
            <div class="timeline-content">
              <div class="flex-between mb-8">
                <strong><span class="status-tag status-processing">已签到</span></strong>
              </div>
              <div>访客签到进入园区</div>
            </div>
          </div>
          <div v-if="visitor.checkOutTime" class="timeline-item">
            <div class="timeline-time">{{ formatTime(visitor.checkOutTime) }}</div>
            <div class="timeline-content">
              <div class="flex-between mb-8">
                <strong><span class="status-tag status-closed">已签退</span></strong>
              </div>
              <div>访客签退离开园区</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="visitor.status === 'REJECTED' || visitor.exceptions?.length" class="card mb-24">
      <h3 class="mb-16" style="color: #f5222d;">
        ⚠️ 异常详情
        <span class="text-secondary" style="font-size: 14px; font-weight: normal;">（仅供处理人参考）</span>
      </h3>
      
      <div v-if="visitor.exceptions?.length">
        <div v-for="(exception, index) in visitor.exceptions" :key="exception.id" class="exception-item" :class="{ 'mb-16': index < visitor.exceptions.length - 1 }">
          <div class="exception-header">
            <span class="exception-title">异常 #{{ index + 1 }}</span>
            <span class="text-secondary">{{ formatTime(exception.createdAt) }}</span>
          </div>
          
          <div class="grid-2 mt-12">
            <div class="form-group">
              <label class="form-label">异常类型</label>
              <div><span class="tag tag-red">审核拒绝</span></div>
            </div>
            <div class="form-group">
              <label class="form-label">处理顺序号</label>
              <div><span class="tag tag-orange">第 {{ exception.processOrder }} 顺位</span></div>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">异常原因</label>
            <div class="exception-reason">{{ exception.detail }}</div>
          </div>
          
          <div class="form-group">
            <label class="form-label">影响范围 (impactScope)</label>
            <div class="exception-scope">
              <div class="scope-item">
                <span class="scope-label">🔴 直接影响</span>
                <span>{{ parseImpactScope(exception.impactScope).direct }}</span>
              </div>
              <div class="scope-item">
                <span class="scope-label">🟡 间接影响</span>
                <span>{{ parseImpactScope(exception.impactScope).indirect }}</span>
              </div>
              <div class="scope-item">
                <span class="scope-label">🔵 关联范围</span>
                <span>{{ parseImpactScope(exception.impactScope).related }}</span>
              </div>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">处理顺序 (handlingOrder)</label>
            <div class="handling-order">
              <div v-for="(step, stepIndex) in getHandlingSteps(exception)" :key="stepIndex" class="order-step">
                <div :class="['step-number', getStepStatusClass(step.status)]">{{ step.step || stepIndex + 1 }}</div>
                <div class="step-content">
                  <div class="flex-between mb-4">
                    <div class="step-title">{{ step.action }}</div>
                    <span :class="['tag', getStepTagClass(step.status)]">{{ getStepStatusLabel(step.status) }}</span>
                  </div>
                  <div class="step-desc">{{ step.description }}</div>
                  <div class="step-responsible">责任方：{{ step.responsible }}</div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">处理建议 (suggestion)</label>
            <div class="suggested-actions">
              <div class="action-item">
                <span class="action-icon">✅</span>
                <div>
                  <div class="action-title">处理建议</div>
                  <div class="action-desc">{{ exception.suggestion || getSuggestedActions(exception) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div v-else class="empty">
        <p style="color: #faad14;">该访客预约已被拒绝，但系统尚未生成异常详情记录。</p>
        <p class="text-secondary mt-8">请联系管理员检查自动生成异常记录的配置。</p>
      </div>
    </div>

    <div class="tabs">
      <div
        v-for="tab in tabs"
        :key="tab.key"
        :class="['tab-item', { active: activeTab === tab.key }]"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
        <span v-if="tab.badge" class="badge" style="margin-left: 8px;">{{ tab.badge }}</span>
      </div>
    </div>

    <div v-if="activeTab === 'checkin'">
      <div class="card">
        <h3 class="mb-16">签到签退记录</h3>
        <div v-if="visitor.checkInTime || visitor.checkOutTime" class="timeline">
          <div v-if="visitor.checkInTime" class="timeline-item">
            <div class="timeline-time">{{ formatTime(visitor.checkInTime) }}</div>
            <div class="timeline-content">
              <div class="flex-between mb-8">
                <strong><span class="tag tag-blue">签到</span></strong>
              </div>
              <div>访客已签到进入园区</div>
            </div>
          </div>
          <div v-if="visitor.checkOutTime" class="timeline-item">
            <div class="timeline-time">{{ formatTime(visitor.checkOutTime) }}</div>
            <div class="timeline-content">
              <div class="flex-between mb-8">
                <strong><span class="tag tag-green">签退</span></strong>
              </div>
              <div>访客已签退离开园区</div>
            </div>
          </div>
        </div>
        <div v-else class="empty">暂无签到签退记录</div>
      </div>
    </div>

    <div v-if="activeTab === 'exceptions'">
      <div class="card">
        <h3 class="mb-16">异常记录</h3>
        <table v-if="visitor.exceptions?.length" class="table">
          <thead>
            <tr>
              <th>异常类型</th>
              <th>标题</th>
              <th>详情</th>
              <th>影响级别</th>
              <th>创建时间</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="exception in visitor.exceptions" :key="exception.id">
              <td><span class="tag tag-red">审核拒绝</span></td>
              <td>{{ exception.title }}</td>
              <td style="max-width: 300px;">{{ exception.detail }}</td>
              <td><span :class="['tag', exception.impactLevel === 'HIGH' ? 'tag-red' : exception.impactLevel === 'MEDIUM' ? 'tag-orange' : 'tag-blue']">{{ exception.impactLevel === 'HIGH' ? '高' : exception.impactLevel === 'MEDIUM' ? '中' : '低' }}</span></td>
              <td>{{ formatTime(exception.createdAt) }}</td>
              <td><span :class="['tag', exception.isHandled ? 'tag-green' : 'tag-orange']">{{ exception.isHandled ? '已处理' : '待处理' }}</span></td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty">暂无异常记录</div>
      </div>
    </div>

    <div v-if="canAudit && visitor.status === 'PENDING'" class="card">
      <div class="flex-between">
        <div>
          <h3>审核处理</h3>
          <p class="text-secondary">请核对访客信息后进行审核操作</p>
        </div>
        <div class="flex gap-8">
          <button class="btn btn-success" @click="handleApprove">批准</button>
          <button class="btn btn-danger" @click="showRejectModal = true">拒绝</button>
        </div>
      </div>
    </div>

    <div v-if="showRejectModal" class="modal-mask" @click.self="showRejectModal = false">
      <div class="modal">
        <div class="modal-header">
          <span class="modal-title">拒绝预约</span>
          <button class="btn" @click="showRejectModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">拒绝原因 <span class="text-error">*</span></label>
            <textarea
              v-model="rejectForm.reason"
              class="form-textarea"
              placeholder="请详细说明拒绝原因，该原因将作为审核异常记录保存"
              rows="4"
              required
            ></textarea>
          </div>
          <div class="alert alert-warning">
            <strong>系统提示：</strong>
            <ul class="mt-8" style="padding-left: 20px;">
              <li>拒绝后系统将<strong>自动创建审核异常记录</strong></li>
              <li>异常记录将包含<strong>影响范围、处理顺序、建议措施</strong>供后续处理人参考</li>
              <li>请确保拒绝原因清晰明确，便于后续跟进处理</li>
            </ul>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" @click="showRejectModal = false">取消</button>
          <button class="btn btn-danger" @click="handleReject" :disabled="!rejectForm.reason">确认拒绝</button>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="empty">加载中...</div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import dayjs from 'dayjs'

const route = useRoute()
const { user, initAuth, isLoggedIn } = useAuth()

const visitor = ref<any>(null)
const activeTab = ref('checkin')
const showRejectModal = ref(false)

const rejectForm = reactive({
  reason: ''
})

const id = computed(() => parseInt(route.params.id as string))

const tabs = computed(() => {
  return [
    { key: 'checkin', label: '签到签退' },
    { key: 'exceptions', label: '异常记录', badge: visitor.value?.exceptions?.length || 0 }
  ]
})

const canAudit = computed(() => {
  return user.value && ['OPERATOR', 'ADMIN'].includes(user.value.role)
})

onMounted(async () => {
  initAuth()
  if (!isLoggedIn.value) {
    navigateTo('/login')
    return
  }
  await loadDetail()
})

async function loadDetail() {
  try {
    const res: any = await useApiFetch(`/visitors/${id.value}`)
    if (res.code === 200) {
      visitor.value = res.data
    }
  } catch (e) {
  }
}

async function handleApprove() {
  if (!confirm(`确定要批准访客「${visitor.value.visitorName}」的预约吗？`)) return
  try {
    const res: any = await useApiFetch(`/visitors/${id.value}/approve`, {
      method: 'POST'
    })
    if (res.code === 200) {
      loadDetail()
    }
  } catch (e: any) {
    alert(e.data?.message || '操作失败')
  }
}

async function handleReject() {
  if (!rejectForm.reason) return
  if (!confirm(`确定要拒绝访客「${visitor.value.visitorName}」的预约吗？拒绝后将生成异常记录。`)) return
  try {
    const res: any = await useApiFetch(`/visitors/${id.value}/reject`, {
      method: 'POST',
      body: {
        reason: rejectForm.reason
      }
    })
    if (res.code === 200) {
      showRejectModal.value = false
      rejectForm.reason = ''
      loadDetail()
    }
  } catch (e: any) {
    alert(e.data?.message || '操作失败')
  }
}

function parseImpactScope(impactScope: string) {
  const defaultScope = {
    direct: '访客本人无法进入园区',
    indirect: '被访租户接待计划受阻，可能影响业务洽谈',
    related: '前台登记、安保检查流程需调整'
  }
  if (!impactScope) return defaultScope
  try {
    const parsed = JSON.parse(impactScope)
    const formatValue = (val: any) => {
      if (Array.isArray(val)) return val.join('；')
      return typeof val === 'string' ? val : JSON.stringify(val)
    }
    return {
      direct: formatValue(parsed.direct || defaultScope.direct),
      indirect: formatValue(parsed.indirect || defaultScope.indirect),
      related: formatValue(parsed.related || defaultScope.related)
    }
  } catch (e) {
    return defaultScope
  }
}

function getHandlingSteps(exception: any) {
  const defaultSteps = [
    {
      action: '通知被访租户',
      description: '第一时间联系被访租户，告知访客预约被拒情况，协商是否需要重新预约或其他安排',
      responsible: '前台接待',
      status: 'PENDING'
    },
    {
      action: '联系访客说明原因',
      description: '向访客详细说明拒绝原因，提供后续申请的指导和建议',
      responsible: '运营人员',
      status: 'PENDING'
    },
    {
      action: '更新系统记录',
      description: '确保异常记录完整，包括原因、影响范围和处理措施',
      responsible: '运营人员',
      status: 'PENDING'
    },
    {
      action: '跟进后续处理',
      description: '如访客需要重新申请，提供协助；如租户有异议，进行协调处理',
      responsible: '运营主管',
      status: 'PENDING'
    }
  ]
  if (!exception.processOrder) return defaultSteps
  try {
    const parsed = JSON.parse(exception.processOrder)
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((p: any) => ({
        action: p.action || p.title || '未命名步骤',
        description: p.description || p.desc || '',
        responsible: p.responsible || p.handler || '未指定',
        status: p.status || 'PENDING',
        step: p.step
      }))
    }
    return defaultSteps
  } catch (e) {
    return defaultSteps
  }
}

function getSuggestedActions(exception: any) {
  return exception.suggestion || '请联系租户核实情况，如访客需要重新申请，指导其补充完整材料后再次提交。如有特殊紧急情况，可联系上级主管进行特殊审批。'
}

function getStepStatusClass(status: string) {
  const map: any = {
    DONE: 'step-done',
    COMPLETED: 'step-done',
    IN_PROGRESS: 'step-progress',
    PROCESSING: 'step-progress',
    PENDING: ''
  }
  return map[status] || ''
}

function getStepTagClass(status: string) {
  const map: any = {
    DONE: 'tag-green',
    COMPLETED: 'tag-green',
    IN_PROGRESS: 'tag-blue',
    PROCESSING: 'tag-blue',
    PENDING: 'tag-orange'
  }
  return map[status] || 'tag-orange'
}

function getStepStatusLabel(status: string) {
  const map: any = {
    DONE: '已完成',
    COMPLETED: '已完成',
    IN_PROGRESS: '进行中',
    PROCESSING: '进行中',
    PENDING: '待处理'
  }
  return map[status] || '待处理'
}

function getStatusLabel(status: string) {
  const map: any = {
    PENDING: '待审核',
    APPROVED: '已通过',
    REJECTED: '已拒绝',
    CHECKED_IN: '已签到',
    CHECKED_OUT: '已签退',
    CANCELLED: '已取消'
  }
  return map[status] || status
}

function getStatusClass(status: string) {
  const map: any = {
    PENDING: 'status-pending',
    APPROVED: 'status-completed',
    REJECTED: 'status-overdue',
    CHECKED_IN: 'status-processing',
    CHECKED_OUT: 'status-closed',
    CANCELLED: 'status-closed'
  }
  return map[status] || ''
}

function formatDate(date: string) {
  return dayjs(date).format('YYYY-MM-DD')
}

function formatTime(date: string) {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}
</script>

<style scoped>
.text-right {
  text-align: right;
}

.mb-24 {
  margin-bottom: 24px;
}

.mt-12 {
  margin-top: 12px;
}

.mt-8 {
  margin-top: 8px;
}

.exception-item {
  border: 1px solid #ffa39e;
  border-radius: 8px;
  padding: 16px;
  background: #fff1f0;
}

.exception-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px dashed #ffa39e;
}

.exception-title {
  font-weight: 600;
  color: #f5222d;
  font-size: 16px;
}

.exception-reason {
  background: #fff;
  padding: 12px;
  border-radius: 4px;
  border-left: 3px solid #f5222d;
}

.exception-scope {
  background: #fff;
  border-radius: 4px;
  overflow: hidden;
}

.scope-item {
  display: flex;
  padding: 10px 12px;
  border-bottom: 1px solid #f0f0f0;
}

.scope-item:last-child {
  border-bottom: none;
}

.scope-label {
  min-width: 100px;
  font-weight: 500;
  margin-right: 12px;
}

.handling-order {
  background: #fff;
  border-radius: 4px;
  padding: 8px 0;
}

.order-step {
  display: flex;
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.order-step:last-child {
  border-bottom: none;
}

.step-number {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #1890ff;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  margin-right: 12px;
  flex-shrink: 0;
}
.step-done {
  background: #52c41a;
}
.step-progress {
  background: #1890ff;
  animation: pulse-blue 2s infinite;
}
@keyframes pulse-blue {
  0%, 100% { box-shadow: 0 0 0 0 rgba(24, 144, 255, 0.6); }
  50% { box-shadow: 0 0 0 6px rgba(24, 144, 255, 0); }
}

.mb-4 {
  margin-bottom: 4px;
}

.step-content {
  flex: 1;
}

.step-title {
  font-weight: 500;
  color: #262626;
  margin-bottom: 4px;
}

.step-desc {
  color: #595959;
  font-size: 14px;
  margin-bottom: 4px;
}

.step-responsible {
  color: #8c8c8c;
  font-size: 12px;
}

.suggested-actions {
  background: #fff;
  border-radius: 4px;
  padding: 8px 0;
}

.action-item {
  display: flex;
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.action-item:last-child {
  border-bottom: none;
}

.action-icon {
  margin-right: 12px;
  flex-shrink: 0;
}

.action-title {
  font-weight: 500;
  color: #262626;
  margin-bottom: 4px;
}

.action-desc {
  color: #595959;
  font-size: 14px;
}
</style>
