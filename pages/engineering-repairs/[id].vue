<template>
  <div v-if="repair">
    <div class="page-header">
      <h1 class="page-title">工程维修详情 - {{ repair.repairNo }}</h1>
      <div class="flex gap-8">
        <button class="btn" @click="navigateTo('/engineering-repairs')">返回列表</button>
      </div>
    </div>

    <div class="grid-2 mb-24">
      <div class="card">
        <h3 class="mb-16">基本信息</h3>
        <div class="form-group">
          <label class="form-label">报修标题</label>
          <div>{{ repair.title }}</div>
        </div>
        <div class="form-group">
          <label class="form-label">报修描述</label>
          <div>{{ repair.description }}</div>
        </div>
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">设备名称</label>
            <div>{{ repair.equipmentName || '-' }}</div>
          </div>
          <div class="form-group">
            <label class="form-label">设备型号</label>
            <div>{{ repair.equipmentModel || '-' }}</div>
          </div>
          <div class="form-group">
            <label class="form-label">位置</label>
            <div>{{ repair.location }}</div>
          </div>
          <div class="form-group">
            <label class="form-label">优先级</label>
            <div><span :class="['tag', getPriorityClass(repair.priority)]">{{ getPriorityLabel(repair.priority) }}</span></div>
          </div>
          <div class="form-group">
            <label class="form-label">状态</label>
            <div><span :class="['status-tag', getStatusClass(repair.status)]">{{ getStatusLabel(repair.status) }}</span></div>
          </div>
          <div class="form-group">
            <label class="form-label">报修人</label>
            <div>{{ repair.reporterName || repair.creator?.name }}</div>
          </div>
          <div class="form-group">
            <label class="form-label">联系电话</label>
            <div>{{ repair.reporterPhone || '-' }}</div>
          </div>
          <div class="form-group">
            <label class="form-label">截止时间</label>
            <div :class="{ 'text-error': isOverdue }">{{ repair.deadline ? formatTime(repair.deadline) : '-' }}</div>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">故障描述</label>
          <div>{{ repair.faultDescription || '-' }}</div>
        </div>
        <div v-if="repair.status === 'COMPLETED'" class="grid-2">
          <div class="form-group">
            <label class="form-label">实际费用</label>
            <div>{{ repair.actualCost ? '¥' + repair.actualCost : '-' }}</div>
          </div>
          <div class="form-group">
            <label class="form-label">维修工时</label>
            <div>{{ repair.maintenanceHours ? repair.maintenanceHours + ' 小时' : '-' }}</div>
          </div>
          <div class="form-group">
            <label class="form-label">完成时间</label>
            <div>{{ repair.actualDate ? formatTime(repair.actualDate) : '-' }}</div>
          </div>
        </div>
        <div v-if="repair.result" class="form-group">
          <label class="form-label">维修结果</label>
          <div>{{ repair.result }}</div>
        </div>
        <div v-if="repair.remark" class="form-group">
          <label class="form-label">备注</label>
          <div>{{ repair.remark }}</div>
        </div>
        <div class="form-group">
          <label class="form-label">创建人</label>
          <div>{{ repair.creator?.name }}</div>
        </div>
        <div class="form-group">
          <label class="form-label">创建时间</label>
          <div>{{ formatTime(repair.createdAt) }}</div>
        </div>
      </div>

      <div class="card">
        <h3 class="mb-16">处理进度</h3>
        <div v-if="timeline.length" class="timeline">
          <div v-for="log in timeline" :key="log.id" class="timeline-item">
            <div class="timeline-time">{{ formatTime(log.createdAt) }}</div>
            <div class="timeline-content">
              <div class="flex-between mb-8">
                <strong>{{ log.status }}</strong>
                <span class="text-secondary">{{ log.operatorName }}</span>
              </div>
              <div>{{ log.description }}</div>
            </div>
          </div>
        </div>
        <div v-else class="empty">暂无进度记录</div>
      </div>
    </div>

    <div v-if="repair.satisfactionSurvey" class="card mb-24">
      <div class="flex-between mb-16">
        <h3>满意度评价</h3>
      </div>
      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">总体评分</label>
          <div class="rating">
            <span
              v-for="i in 5"
              :key="i"
              :class="['rating-star', { active: i <= repair.satisfactionSurvey.overallScore }]"
            >★</span>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">响应速度</label>
          <div class="rating">
            <span
              v-for="i in 5"
              :key="i"
              :class="['rating-star', { active: i <= repair.satisfactionSurvey.responseSpeed }]"
            >★</span>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">服务态度</label>
          <div class="rating">
            <span
              v-for="i in 5"
              :key="i"
              :class="['rating-star', { active: i <= repair.satisfactionSurvey.serviceAttitude }]"
            >★</span>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">维修质量</label>
          <div class="rating">
            <span
              v-for="i in 5"
              :key="i"
              :class="['rating-star', { active: i <= repair.satisfactionSurvey.repairQuality }]"
            >★</span>
          </div>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">费用合理性</label>
        <div class="rating">
          <span
            v-for="i in 5"
            :key="i"
            :class="['rating-star', { active: i <= repair.satisfactionSurvey.costReasonable }]"
          >★</span>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">评价内容</label>
        <div>{{ repair.satisfactionSurvey.comment || '-' }}</div>
      </div>
      <div class="form-group">
        <label class="form-label">改进建议</label>
        <div>{{ repair.satisfactionSurvey.improvement || '-' }}</div>
      </div>
      <div class="form-group">
        <label class="form-label">评价时间</label>
        <div>{{ formatTime(repair.satisfactionSurvey.surveyDate) }}</div>
      </div>
    </div>

    <div v-if="canComplete || (canSubmitSatisfaction && !repair.satisfactionSurvey)" class="card">
      <div class="flex-between">
        <div>
          <h3>操作</h3>
          <p class="text-secondary">
            <template v-if="canComplete">确认维修完成后，填写维修结果并提交</template>
            <template v-else-if="canSubmitSatisfaction && !repair.satisfactionSurvey">请对本次维修服务进行满意度评价</template>
          </p>
        </div>
        <div class="flex gap-8">
          <button
            v-if="canComplete"
            class="btn btn-success"
            @click="showCompleteModal = true"
          >
            完成维修
          </button>
          <button
            v-if="canSubmitSatisfaction && !repair.satisfactionSurvey"
            class="btn btn-primary"
            @click="showSatisfactionModal = true"
          >
            满意度评价
          </button>
        </div>
      </div>
    </div>

    <div v-if="showCompleteModal" class="modal-mask" @click.self="showCompleteModal = false">
      <div class="modal">
        <div class="modal-header">
          <span class="modal-title">完成维修</span>
          <button class="btn" @click="showCompleteModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">维修结果 <span class="text-error">*</span></label>
            <textarea v-model="completeForm.result" class="form-textarea" placeholder="请详细描述维修结果，包括故障原因、解决方法等" rows="4" required></textarea>
          </div>
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">实际费用 (元)</label>
              <input v-model.number="completeForm.actualCost" type="number" class="form-input" placeholder="0.00" />
            </div>
            <div class="form-group">
              <label class="form-label">维修工时 (小时)</label>
              <input v-model.number="completeForm.maintenanceHours" type="number" class="form-input" placeholder="0.0" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">备注</label>
            <textarea v-model="completeForm.remark" class="form-textarea" placeholder="其他说明"></textarea>
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
            <label class="form-label">维修质量</label>
            <div class="rating">
              <span
                v-for="i in 5"
                :key="i"
                :class="['rating-star', { active: i <= satisfactionForm.repairQuality }]"
                @click="satisfactionForm.repairQuality = i"
              >★</span>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">费用合理性</label>
            <div class="rating">
              <span
                v-for="i in 5"
                :key="i"
                :class="['rating-star', { active: i <= satisfactionForm.costReasonable }]"
                @click="satisfactionForm.costReasonable = i"
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

const repair = ref<any>(null)
const showCompleteModal = ref(false)
const showSatisfactionModal = ref(false)

const completeForm = reactive({
  result: '',
  actualCost: null as number | null,
  maintenanceHours: null as number | null,
  remark: ''
})

const satisfactionForm = reactive({
  overallScore: 5,
  responseSpeed: 5,
  serviceAttitude: 5,
  repairQuality: 5,
  costReasonable: 5,
  comment: '',
  improvement: ''
})

const id = computed(() => parseInt(route.params.id as string))

const timeline = computed(() => {
  if (!repair.value) return []
  const logs: { id: string; status: string; description: string; operatorName: string; createdAt: any }[] = []
  logs.push({
    id: 'created',
    status: '已创建',
    description: '报修单已创建',
    operatorName: repair.value.creator?.name || '',
    createdAt: repair.value.createdAt
  })
  if (repair.value.status === 'IN_PROGRESS') {
    logs.push({
      id: 'in_progress',
      status: '处理中',
      description: '维修人员正在处理',
      operatorName: repair.value.handler?.name || '',
      createdAt: repair.value.updatedAt
    })
  }
  if (repair.value.status === 'COMPLETED') {
    logs.push({
      id: 'completed',
      status: '已完成',
      description: repair.value.result || '维修已完成',
      operatorName: repair.value.handler?.name || '',
      createdAt: repair.value.actualDate || repair.value.updatedAt
    })
  }
  if (repair.value.status === 'CANCELLED') {
    logs.push({
      id: 'cancelled',
      status: '已取消',
      description: '报修已取消',
      operatorName: '',
      createdAt: repair.value.updatedAt
    })
  }
  return logs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
})

const canComplete = computed(() => {
  if (!user.value || !repair.value) return false
  if (!['ENGINEER', 'OPERATOR', 'ADMIN'].includes(user.value.role)) return false
  return ['PENDING', 'IN_PROGRESS'].includes(repair.value.status)
})

const canSubmitSatisfaction = computed(() => {
  if (!user.value || !repair.value) return false
  return repair.value.status === 'COMPLETED' && !repair.value.satisfactionSurvey
})

const isOverdue = computed(() => {
  if (!repair.value?.deadline) return false
  if (repair.value?.status === 'COMPLETED' || repair.value?.status === 'CANCELLED') return false
  return new Date() > new Date(repair.value.deadline)
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
    const res: any = await useApiFetch(`/engineering-repairs/${id.value}`)
    if (res.code === 200) {
      repair.value = res.data
    }
  } catch (e) {
    // ignore
  }
}

async function handleComplete() {
  if (!completeForm.result) return
  try {
    const res: any = await useApiFetch(`/engineering-repairs/${id.value}/complete`, {
      method: 'POST',
      body: completeForm
    })
    if (res.code === 200) {
      showCompleteModal.value = false
      Object.assign(completeForm, {
        result: '',
        actualCost: null,
        maintenanceHours: null,
        remark: ''
      })
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
        engineeringRepairId: id.value,
        tenantId: user.value?.tenantId || 1,
        respondentId: user.value?.id,
        sourceType: 'ENGINEERING_REPAIR',
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
    IN_PROGRESS: '处理中',
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

function formatTime(date: string) {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}
</script>
