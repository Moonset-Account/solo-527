<template>
  <div v-if="loading">
    <n-spin size="large" class="flex justify-center py-20" />
  </div>

  <div v-else>
    <n-page-header :title="requestDetail?.title || '申请详情'" @back="handleBack">
      返回
    </n-page-header>

    <n-descriptions bordered :column="2" class="mt-4">
      <n-descriptions-item label="申请ID">{{ requestDetail?.id }}</n-descriptions-item>
      <n-descriptions-item label="申请类型">
        <n-tag>{{ requestTypeLabel }}</n-tag>
      </n-descriptions-item>
      <n-descriptions-item label="申请人">{{ requestDetail?.requester_name }}</n-descriptions-item>
      <n-descriptions-item label="当前状态">
        <n-tag :type="statusTagType">{{ statusLabel }}</n-tag>
      </n-descriptions-item>
      <n-descriptions-item label="当前阶段">{{ stageLabel }}</n-descriptions-item>
      <n-descriptions-item label="创建时间">{{ formatDate(requestDetail?.created_at) }}</n-descriptions-item>
    </n-descriptions>

    <n-card v-if="requestDetail?.request_type === 'account_change'" class="mt-4" title="变更信息">
      <n-descriptions :column="2" bordered size="small">
        <n-descriptions-item label="目标账号">{{ requestDetail?.target_account }}</n-descriptions-item>
        <n-descriptions-item label="变更类型">{{ requestDetail?.change_type }}</n-descriptions-item>
        <n-descriptions-item label="变更说明" :span="2">
          {{ requestDetail?.description }}
        </n-descriptions-item>
      </n-descriptions>
    </n-card>

    <n-card v-if="requestDetail?.request_type === 'fault_report'" class="mt-4" title="故障信息">
      <n-descriptions :column="2" bordered size="small">
        <n-descriptions-item label="故障级别">{{ requestDetail?.fault_level }}</n-descriptions-item>
        <n-descriptions-item label="故障设备">{{ requestDetail?.fault_device }}</n-descriptions-item>
        <n-descriptions-item label="故障详情" :span="2">
          {{ requestDetail?.description }}
        </n-descriptions-item>
      </n-descriptions>
    </n-card>

    <n-card class="mt-4" title="变更窗口" v-if="authStore.isAdmin || canEditChangeWindow">
      <template #header-extra>
        <n-button
          v-if="canEditChangeWindow"
          size="small"
          @click="showChangeWindowModal = true"
        >
          设置变更窗口
        </n-button>
      </template>

      <n-descriptions :column="2" bordered size="small">
        <n-descriptions-item label="开始时间">
          {{ requestDetail?.change_window_start ? formatDate(requestDetail.change_window_start) : '-' }}
        </n-descriptions-item>
        <n-descriptions-item label="结束时间">
          {{ requestDetail?.change_window_end ? formatDate(requestDetail.change_window_end) : '-' }}
        </n-descriptions-item>
        <n-descriptions-item label="审批状态">
          <n-tag :type="requestDetail?.change_window_approved ? 'success' : 'warning'">
            {{ requestDetail?.change_window_approved ? '已通过' : '待审批' }}
          </n-tag>
        </n-descriptions-item>
        <n-descriptions-item label="审批意见">
          {{ requestDetail?.change_window_comment || '-' }}
        </n-descriptions-item>
      </n-descriptions>

      <n-space v-if="authStore.isAdmin && !requestDetail?.change_window_approved" class="mt-4">
        <n-button type="success" @click="approveChangeWindow(true)">通过</n-button>
        <n-button type="error" @click="approveChangeWindow(false)">拒绝</n-button>
      </n-space>
    </n-card>

    <n-card class="mt-4" title="回滚方案" v-if="authStore.isAdmin || canEditRollbackPlan">
      <template #header-extra>
        <n-button
          v-if="canEditRollbackPlan"
          size="small"
          @click="showRollbackPlanModal = true"
        >
          编辑回滚方案
        </n-button>
      </template>

      <div class="whitespace-pre-wrap text-gray-700">
        {{ requestDetail?.rollback_plan || '暂无回滚方案' }}
      </div>

      <n-descriptions v-if="requestDetail?.rollback_plan_approved" :column="2" bordered size="small" class="mt-4">
        <n-descriptions-item label="审批状态">
          <n-tag :type="requestDetail?.rollback_plan_approved ? 'success' : 'warning'">
            {{ requestDetail?.rollback_plan_approved ? '已通过' : '待审批' }}
          </n-tag>
        </n-descriptions-item>
        <n-descriptions-item label="审批意见">
          {{ requestDetail?.rollback_plan_comment || '-' }}
        </n-descriptions-item>
      </n-descriptions>

      <n-space v-if="authStore.isAdmin && requestDetail?.change_window_approved && !requestDetail?.rollback_plan_approved" class="mt-4">
        <n-button type="success" @click="approveRollbackPlan(true)">通过</n-button>
        <n-button type="error" @click="approveRollbackPlan(false)">拒绝</n-button>
      </n-space>
    </n-card>

    <n-card class="mt-4" title="实施结果" v-if="authStore.isAdmin && requestDetail?.rollback_plan_approved">
      <template #header-extra>
        <n-button
          v-if="requestDetail?.current_stage === 'implementation'"
          size="small"
          type="primary"
          @click="showImplementationModal = true"
        >
          提交实施结果
        </n-button>
      </template>

      <div v-if="requestDetail?.implementation_result" class="whitespace-pre-wrap text-gray-700">
        {{ requestDetail.implementation_result }}
      </div>
      <div v-else class="text-gray-400">
        暂无实施结果
      </div>

      <n-descriptions v-if="requestDetail?.is_rolled_back" :column="2" bordered size="small" class="mt-4">
        <n-descriptions-item label="回滚状态">
          <n-tag type="warning">已回滚</n-tag>
        </n-descriptions-item>
        <n-descriptions-item label="回滚原因">
          {{ requestDetail?.rollback_reason || '-' }}
        </n-descriptions-item>
      </n-descriptions>
    </n-card>

    <n-card class="mt-4" title="审批记录">
      <n-timeline>
        <n-timeline-item
          v-for="record in approvalRecords"
          :key="record.id"
          :type="record.action === 'approve' ? 'success' : 'error'"
          :title="record.approver_name"
          :time="formatDate(record.created_at)"
        >
          <p>阶段：{{ getStageLabel(record.stage) }}</p>
          <p>操作：{{ record.action === 'approve' ? '通过' : '拒绝' }}</p>
          <p v-if="record.comment">意见：{{ record.comment }}</p>
        </n-timeline-item>
      </n-timeline>
    </n-card>

    <n-modal v-model:show="showChangeWindowModal" preset="card" title="设置变更窗口" style="width: 500px">
      <n-form :model="changeWindowForm" label-placement="top">
        <n-form-item label="开始时间">
          <n-date-picker
            v-model:value="changeWindowForm.change_window_start"
            type="datetime"
            clearable
            style="width: 100%"
          />
        </n-form-item>
        <n-form-item label="结束时间">
          <n-date-picker
            v-model:value="changeWindowForm.change_window_end"
            type="datetime"
            clearable
            style="width: 100%"
          />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showChangeWindowModal = false">取消</n-button>
          <n-button type="primary" :loading="submitting" @click="saveChangeWindow">保存</n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal v-model:show="showRollbackPlanModal" preset="card" title="编辑回滚方案" style="width: 600px">
      <n-input
        v-model:value="rollbackPlanForm.rollback_plan"
        type="textarea"
        :rows="8"
        placeholder="请输入详细的回滚方案"
      />
      <template #footer>
        <n-space justify="end">
          <n-button @click="showRollbackPlanModal = false">取消</n-button>
          <n-button type="primary" :loading="submitting" @click="saveRollbackPlan">保存</n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal v-model:show="showImplementationModal" preset="card" title="提交实施结果" style="width: 600px">
      <n-form :model="implementationForm" label-placement="top">
        <n-form-item label="实施结果">
          <n-input
            v-model:value="implementationForm.implementation_result"
            type="textarea"
            :rows="5"
            placeholder="请描述实施结果"
          />
        </n-form-item>
        <n-form-item label="是否回滚">
          <n-switch v-model:value="implementationForm.is_rolled_back" />
        </n-form-item>
        <n-form-item v-if="implementationForm.is_rolled_back" label="回滚原因">
          <n-input
            v-model:value="implementationForm.rollback_reason"
            type="textarea"
            :rows="3"
            placeholder="请说明回滚原因"
          />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showImplementationModal = false">取消</n-button>
          <n-button type="primary" :loading="submitting" @click="saveImplementation">提交</n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal v-model:show="showApproveModal" preset="card" title="审批意见" style="width: 400px">
      <n-input
        v-model:value="approveComment"
        type="textarea"
        :rows="3"
        placeholder="请输入审批意见（可选）"
      />
      <template #footer>
        <n-space justify="end">
          <n-button @click="showApproveModal = false">取消</n-button>
          <n-button :type="approveAction ? 'success' : 'error'" :loading="submitting" @click="doApprove">
            {{ approveAction ? '通过' : '拒绝' }}
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  NPageHeader,
  NDescriptions,
  NDescriptionsItem,
  NCard,
  NSpace,
  NButton,
  NTag,
  NSpin,
  NTimeline,
  NTimelineItem,
  NModal,
  NForm,
  NFormItem,
  NInput,
  NDatePicker,
  NSwitch,
  useMessage,
  useDialog,
} from 'naive-ui'
import { useApiClient } from '~/composables/useApiClient'
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: 'admin',
  requiresAuth: true,
})

const router = useRouter()
const route = useRoute()
const message = useMessage()
const dialog = useDialog()
const api = useApiClient()
const authStore = useAuthStore()

const requestId = computed(() => Number(route.params.id))
const loading = ref(false)
const submitting = ref(false)
const requestDetail = ref<any>(null)
const approvalRecords = ref<any[]>([])

const showChangeWindowModal = ref(false)
const showRollbackPlanModal = ref(false)
const showImplementationModal = ref(false)
const showApproveModal = ref(false)
const approveStage = ref('')
const approveAction = ref(true)
const approveComment = ref('')

const changeWindowForm = reactive({
  change_window_start: null,
  change_window_end: null,
})

const rollbackPlanForm = reactive({
  rollback_plan: '',
})

const implementationForm = reactive({
  implementation_result: '',
  is_rolled_back: false,
  rollback_reason: '',
})

const requestTypeLabel = computed(() => {
  const labels: Record<string, string> = {
    account_change: '账号变更',
    fault_report: '故障上报',
  }
  return labels[requestDetail.value?.request_type] || requestDetail.value?.request_type
})

const statusLabel = computed(() => {
  const labels: Record<string, string> = {
    pending: '待处理',
    approved: '已通过',
    rejected: '已拒绝',
    in_progress: '进行中',
    completed: '已完成',
    rolled_back: '已回滚',
  }
  return labels[requestDetail.value?.status] || requestDetail.value?.status
})

const statusTagType = computed(() => {
  const types: Record<string, string> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'error',
    in_progress: 'info',
    completed: 'success',
    rolled_back: 'default',
  }
  return types[requestDetail.value?.status] || 'default'
})

const stageLabel = computed(() => {
  const labels: Record<string, string> = {
    change_window: '变更窗口阶段',
    rollback_plan: '回滚方案阶段',
    implementation: '实施阶段',
  }
  return labels[requestDetail.value?.current_stage] || requestDetail.value?.current_stage
})

const canEditChangeWindow = computed(() => {
  return (
    !authStore.isAdmin &&
    requestDetail.value?.requester_id === authStore.user?.id &&
    requestDetail.value?.current_stage === 'change_window'
  )
})

const canEditRollbackPlan = computed(() => {
  return (
    !authStore.isAdmin &&
    requestDetail.value?.requester_id === authStore.user?.id &&
    requestDetail.value?.change_window_approved &&
    requestDetail.value?.current_stage === 'rollback_plan'
  )
})

const handleBack = () => {
  router.back()
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

const getStageLabel = (stage: string) => {
  const labels: Record<string, string> = {
    change_window: '变更窗口审批',
    rollback_plan: '回滚方案审批',
    implementation: '实施',
  }
  return labels[stage] || stage
}

const loadData = async () => {
  loading.value = true
  try {
    const [detail, records] = await Promise.all([
      api.requests.get(requestId.value),
      api.requests.getApprovals(requestId.value),
    ])
    requestDetail.value = detail
    approvalRecords.value = records as any[]
  } catch (error: any) {
    message.error('加载失败')
  } finally {
    loading.value = false
  }
}

const saveChangeWindow = async () => {
  if (!changeWindowForm.change_window_start || !changeWindowForm.change_window_end) {
    message.error('请选择开始和结束时间')
    return
  }
  submitting.value = true
  try {
    await api.requests.updateChangeWindow(requestId.value, {
      change_window_start: new Date(changeWindowForm.change_window_start!).toISOString(),
      change_window_end: new Date(changeWindowForm.change_window_end!).toISOString(),
    })
    message.success('保存成功')
    showChangeWindowModal.value = false
    loadData()
  } catch (error: any) {
    message.error(error.message || '保存失败')
  } finally {
    submitting.value = false
  }
}

const saveRollbackPlan = async () => {
  if (!rollbackPlanForm.rollback_plan) {
    message.error('请输入回滚方案')
    return
  }
  submitting.value = true
  try {
    await api.requests.updateRollbackPlan(requestId.value, rollbackPlanForm)
    message.success('保存成功')
    showRollbackPlanModal.value = false
    loadData()
  } catch (error: any) {
    message.error(error.message || '保存失败')
  } finally {
    submitting.value = false
  }
}

const saveImplementation = async () => {
  if (!implementationForm.implementation_result) {
    message.error('请输入实施结果')
    return
  }
  submitting.value = true
  try {
    await api.requests.submitImplementation(requestId.value, implementationForm)
    message.success('提交成功')
    showImplementationModal.value = false
    loadData()
  } catch (error: any) {
    message.error(error.message || '提交失败')
  } finally {
    submitting.value = false
  }
}

const approveChangeWindow = (approved: boolean) => {
  approveStage.value = 'change_window'
  approveAction.value = approved
  approveComment.value = ''
  showApproveModal.value = true
}

const approveRollbackPlan = (approved: boolean) => {
  approveStage.value = 'rollback_plan'
  approveAction.value = approved
  approveComment.value = ''
  showApproveModal.value = true
}

const doApprove = async () => {
  submitting.value = true
  try {
    let result
    if (approveStage.value === 'change_window') {
      result = await api.requests.approveChangeWindow(requestId.value, {
        approved: approveAction.value,
        comment: approveComment.value,
      })
    } else {
      result = await api.requests.approveRollbackPlan(requestId.value, {
        approved: approveAction.value,
        comment: approveComment.value,
      })
    }
    message.success('审批已提交')
    showApproveModal.value = false
    loadData()
  } catch (error: any) {
    message.error(error.message || '审批失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>
