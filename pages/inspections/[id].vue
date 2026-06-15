<template>
  <div v-if="inspection">
    <div class="page-header">
      <h1 class="page-title">巡检详情 - {{ inspection.taskNo }}</h1>
      <div class="flex gap-8">
        <button class="btn" @click="navigateTo('/inspections')">返回列表</button>
      </div>
    </div>

    <div class="grid-2 mb-24">
      <div class="card">
        <h3 class="mb-16">巡检信息</h3>
        <div class="form-group">
          <label class="form-label">巡检标题</label>
          <div>{{ inspection.title }}</div>
        </div>
        <div class="form-group">
          <label class="form-label">巡检描述</label>
          <div>{{ inspection.description }}</div>
        </div>
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">区域</label>
            <div>{{ inspection.area }}</div>
          </div>
          <div class="form-group">
            <label class="form-label">优先级</label>
            <div><span :class="['tag', getPriorityClass(inspection.priority)]">{{ getPriorityLabel(inspection.priority) }}</span></div>
          </div>
          <div class="form-group">
            <label class="form-label">状态</label>
            <div><span :class="['status-tag', getStatusClass(inspection.status)]">{{ getStatusLabel(inspection.status) }}</span></div>
          </div>
          <div class="form-group">
            <label class="form-label">处理人</label>
            <div>{{ inspection.assignee?.name || '-' }}</div>
          </div>
        </div>
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">预计时长</label>
            <div>{{ inspection.expectedDuration ? inspection.expectedDuration + ' 分钟' : '-' }}</div>
          </div>
          <div class="form-group">
            <label class="form-label">截止时间</label>
            <div :class="{ 'text-error': isOverdue }">{{ inspection.deadline ? formatTime(inspection.deadline) : '-' }}</div>
          </div>
          <div class="form-group">
            <label class="form-label">创建时间</label>
            <div>{{ formatTime(inspection.createdAt) }}</div>
          </div>
          <div class="form-group">
            <label class="form-label">创建人</label>
            <div>{{ inspection.creator?.name || '-' }}</div>
          </div>
        </div>
        <div v-if="inspection.result" class="form-group">
          <label class="form-label">巡检结果</label>
          <div><span :class="['tag', getResultClass(inspection.result)]">{{ getResultLabel(inspection.result) }}</span></div>
        </div>
        <div v-if="inspection.remark" class="form-group">
          <label class="form-label">巡检备注</label>
          <div>{{ inspection.remark }}</div>
        </div>
      </div>

      <div class="card">
        <h3 class="mb-16">处理进度</h3>
        <div v-if="inspection.progressLogs?.length" class="timeline">
          <div v-for="log in inspection.progressLogs" :key="log.id" class="timeline-item">
            <div class="timeline-time">{{ formatTime(log.createdAt) }}</div>
            <div class="timeline-content">
              <div class="flex-between mb-8">
                <strong>{{ log.status }}</strong>
                <span class="text-secondary">{{ log.operatorName }}</span>
              </div>
              <div>{{ log.description }}</div>
              <div class="mt-8">
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: log.progressPercent + '%' }"></div>
                </div>
                <div class="text-secondary text-xs mt-4">进度: {{ log.progressPercent }}%</div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="empty">暂无进度记录</div>
      </div>
    </div>

    <div v-if="inspection.satisfactionSurvey" class="card mb-24">
      <div class="flex-between mb-16">
        <h3>满意度评价</h3>
      </div>
      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">总体评分</label>
          <div class="rating">
            <span v-for="i in 5" :key="i" :class="['rating-star', { active: i <= inspection.satisfactionSurvey.overallScore }]">★</span>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">响应速度</label>
          <div class="rating">
            <span v-for="i in 5" :key="i" :class="['rating-star', { active: i <= inspection.satisfactionSurvey.responseSpeed }]">★</span>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">服务态度</label>
          <div class="rating">
            <span v-for="i in 5" :key="i" :class="['rating-star', { active: i <= inspection.satisfactionSurvey.serviceAttitude }]">★</span>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">巡检质量</label>
          <div class="rating">
            <span v-for="i in 5" :key="i" :class="['rating-star', { active: i <= inspection.satisfactionSurvey.inspectionQuality }]">★</span>
          </div>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">评价内容</label>
        <div>{{ inspection.satisfactionSurvey.comment || '-' }}</div>
      </div>
      <div class="form-group">
        <label class="form-label">改进建议</label>
        <div>{{ inspection.satisfactionSurvey.improvement || '-' }}</div>
      </div>
      <div class="form-group">
        <label class="form-label">评价时间</label>
        <div>{{ formatTime(inspection.satisfactionSurvey.surveyDate) }}</div>
      </div>
    </div>

    <div v-if="canComplete && inspection.status !== 'COMPLETED'" class="card mb-24">
      <div class="flex-between">
        <div>
          <h3>完成巡检</h3>
          <p class="text-secondary">确认巡检完成后，可提交巡检结果</p>
        </div>
        <button class="btn btn-success" @click="showCompleteModal = true">完成巡检</button>
      </div>
    </div>

    <div v-if="canSubmitSatisfaction && !inspection.satisfactionSurvey" class="card mb-24">
      <div class="flex-between">
        <div>
          <h3>满意度评价</h3>
          <p class="text-secondary">请对本次巡检服务进行评价</p>
        </div>
        <button class="btn btn-primary" @click="showSatisfactionModal = true">提交评价</button>
      </div>
    </div>

    <div v-if="showCompleteModal" class="modal-mask" @click.self="showCompleteModal = false">
      <div class="modal">
        <div class="modal-header">
          <span class="modal-title">完成巡检</span>
          <button class="btn" @click="showCompleteModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">巡检结果 <span class="text-error">*</span></label>
            <select v-model="completeForm.result" class="form-select" required>
              <option value="">请选择结果</option>
              <option value="NORMAL">正常</option>
              <option value="MINOR_ISSUES">轻微问题</option>
              <option value="MAJOR_ISSUES">严重问题</option>
              <option value="REPAIR_NEEDED">需维修</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">备注</label>
            <textarea v-model="completeForm.remark" class="form-textarea" placeholder="请输入巡检备注，如发现的问题、处理建议等" rows="4"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" @click="showCompleteModal = false">取消</button>
          <button class="btn btn-primary" @click="handleComplete" :disabled="!completeForm.result">确认完成</button>
        </div>
      </div>
    </div>

    <div v-if="showSatisfactionModal" class="modal-mask" @click.self="showSatisfactionModal = false">
      <div class="modal">
        <div class="modal-header">
          <span class="modal-title">满意度评价</span>
          <button class="btn" @click="showSatisfactionModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">总体评分</label>
            <div class="rating">
              <span
                v-for="i in 5"
                :key="i"
                :class="['rating-star', { active: i <= satisfactionForm.overallScore }]"
                @click="satisfactionForm.overallScore = i"
              >★</span>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">响应速度</label>
            <div class="rating">
              <span
                v-for="i in 5"
                :key="i"
                :class="['rating-star', { active: i <= satisfactionForm.responseSpeed }]"
                @click="satisfactionForm.responseSpeed = i"
              >★</span>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">服务态度</label>
            <div class="rating">
              <span
                v-for="i in 5"
                :key="i"
                :class="['rating-star', { active: i <= satisfactionForm.serviceAttitude }]"
                @click="satisfactionForm.serviceAttitude = i"
              >★</span>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">巡检质量</label>
            <div class="rating">
              <span
                v-for="i in 5"
                :key="i"
                :class="['rating-star', { active: i <= satisfactionForm.inspectionQuality }]"
                @click="satisfactionForm.inspectionQuality = i"
              >★</span>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">评价内容</label>
            <textarea v-model="satisfactionForm.comment" class="form-textarea" placeholder="请输入您的评价"></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">改进建议</label>
            <textarea v-model="satisfactionForm.improvement" class="form-textarea" placeholder="请输入改进建议"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" @click="showSatisfactionModal = false">取消</button>
          <button class="btn btn-primary" @click="handleSatisfaction">提交评价</button>
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

const inspection = ref<any>(null)
const showCompleteModal = ref(false)
const showSatisfactionModal = ref(false)

const completeForm = reactive({
  result: '',
  remark: ''
})

const satisfactionForm = reactive({
  overallScore: 5,
  responseSpeed: 5,
  serviceAttitude: 5,
  inspectionQuality: 5,
  comment: '',
  improvement: ''
})

const id = computed(() => parseInt(route.params.id as string))

const canComplete = computed(() => {
  return user.value && ['ENGINEER', 'OPERATOR', 'ADMIN'].includes(user.value.role) &&
    ['PENDING', 'IN_PROGRESS'].includes(inspection.value?.status)
})

const canSubmitSatisfaction = computed(() => {
  return user.value?.role === 'TENANT' &&
    ['COMPLETED'].includes(inspection.value?.status)
})

const isOverdue = computed(() => {
  if (!inspection.value?.deadline) return false
  if (['COMPLETED', 'CANCELLED'].includes(inspection.value.status)) return false
  return new Date() > new Date(inspection.value.deadline)
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
    const res: any = await useApiFetch(`/inspections/${id.value}`)
    if (res.code === 200) {
      inspection.value = res.data
    }
  } catch (e) {
    // ignore
  }
}

async function handleComplete() {
  if (!completeForm.result) return
  try {
    const res: any = await useApiFetch(`/inspections/${id.value}/complete`, {
      method: 'POST',
      body: completeForm
    })
    if (res.code === 200) {
      showCompleteModal.value = false
      loadDetail()
    }
  } catch (e: any) {
    alert(e.data?.message || '操作失败')
  }
}

async function handleSatisfaction() {
  try {
    const res: any = await useApiFetch('/satisfaction', {
      method: 'POST',
      body: {
        ...satisfactionForm,
        inspectionId: id.value,
        sourceType: 'INSPECTION',
        sourceId: id.value
      }
    })
    if (res.code === 200) {
      showSatisfactionModal.value = false
      loadDetail()
    }
  } catch (e: any) {
    alert(e.data?.message || '操作失败')
  }
}

function getStatusLabel(status: string) {
  const map: any = {
    PENDING: '待处理',
    IN_PROGRESS: '进行中',
    COMPLETED: '已完成',
    CANCELLED: '已取消'
  }
  return map[status] || status
}

function getStatusClass(status: string) {
  const map: any = {
    PENDING: 'status-pending',
    IN_PROGRESS: 'status-processing',
    COMPLETED: 'status-completed',
    CANCELLED: 'status-closed'
  }
  return map[status] || ''
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

function getResultLabel(result: string) {
  const map: any = {
    NORMAL: '正常',
    MINOR_ISSUES: '轻微问题',
    MAJOR_ISSUES: '严重问题',
    REPAIR_NEEDED: '需维修'
  }
  return map[result] || result
}

function getResultClass(result: string) {
  const map: any = {
    NORMAL: 'tag-green',
    MINOR_ISSUES: 'tag-orange',
    MAJOR_ISSUES: 'tag-red',
    REPAIR_NEEDED: 'tag-red'
  }
  return map[result] || ''
}

function formatTime(date: string) {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}
</script>

<style scoped>
.text-right {
  text-align: right;
}
</style>
