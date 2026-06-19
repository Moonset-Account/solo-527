<template>
  <div class="page-container">
    <div class="card-wrapper">
      <h2 class="page-title">签到核销</h2>
      
      <div class="checkin-section">
        <n-card class="checkin-card" :bordered="false">
          <h3>快捷签到</h3>
          <div class="checkin-form">
            <n-input
              v-model:value="registrationNo"
              placeholder="请输入或扫描报名编号"
              size="large"
              @keyup.enter="handleQuickCheckIn"
            >
              <template #suffix>
                <n-button type="primary" :loading="checkingIn" @click="handleQuickCheckIn">
                  签到
                </n-button>
              </template>
            </n-input>
          </div>
          
          <div v-if="checkinResult" class="checkin-result" :class="resultClass">
            <n-icon size="32">
              <CheckmarkCircleOutline v-if="checkinResult.status === 'success'" />
              <AlertCircleOutline v-else />
            </n-icon>
            <div class="result-info">
              <div class="result-title">{{ resultTitle }}</div>
              <div class="result-detail" v-if="checkinResult.registration_real_name">
                姓名：{{ checkinResult.registration_real_name }}
              </div>
              <div class="result-time">
                签到时间：{{ checkinResult.checkin_time }}
              </div>
            </div>
          </div>
        </n-card>
        
        <n-card :bordered="false">
          <div class="stats-row">
            <div class="stat-box">
              <div class="stat-num">{{ totalCheckins }}</div>
              <div class="stat-label">总签到</div>
            </div>
            <div class="stat-box success">
              <div class="stat-num">{{ successCheckins }}</div>
              <div class="stat-label">成功</div>
            </div>
            <div class="stat-box warning">
              <div class="stat-num">{{ duplicateCheckins }}</div>
              <div class="stat-label">重复</div>
            </div>
          </div>
        </n-card>
      </div>
      
      <n-divider />
      
      <div class="table-toolbar">
        <div class="search-bar">
          <n-select
            v-model:value="selectedEvent"
            :options="eventOptions"
            placeholder="选择活动"
            style="width: 200px"
            @update:value="handleEventChange"
          />
          <n-select
            v-model:value="filterStatus"
            :options="statusOptions"
            placeholder="状态"
            style="width: 120px"
            clearable
          />
        </div>
      </div>
      
      <n-data-table
        :columns="columns"
        :data="data"
        :loading="loading"
        :pagination="pagination"
        :bordered="false"
        @update:page="handlePageChange"
      >
        <template #status="{ row }">
          <n-tag :type="statusTagType(row.status)">
            {{ statusLabel(row.status) }}
          </n-tag>
        </template>
        <template #feedback="{ row }">
          <n-tag :type="feedbackTagType(row.attendance_feedback)">
            {{ feedbackLabel(row.attendance_feedback) }}
          </n-tag>
        </template>
        <template #actions="{ row }">
          <n-button size="small" @click="handleFeedback(row)">
            到场反馈
          </n-button>
        </template>
      </n-data-table>
    </div>
    
    <n-modal v-model:show="showFeedbackDialog" preset="card" title="到场反馈" style="width: 400px">
      <n-form label-placement="top">
        <n-form-item label="反馈结果">
          <n-select v-model:value="feedbackValue" :options="feedbackOptions" />
        </n-form-item>
        <n-form-item label="备注">
          <n-input v-model:value="feedbackRemark" type="textarea" :rows="3" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showFeedbackDialog = false">取消</n-button>
          <n-button type="primary" :loading="submitting" @click="submitFeedback">确认</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import {
  NCard, NInput, NButton, NDivider, NSelect, NDataTable,
  NTag, NIcon, NSpace, NModal, NForm, NFormItem, useMessage
} from 'naive-ui'
import { CheckmarkCircleOutline, AlertCircleOutline } from '@vicons/ionicons5'
import { useApi } from '~/composables/useApi'
import { useAuth } from '~/composables/useAuth'

const message = useMessage()
const api = useApi()

const loading = ref(false)
const checkingIn = ref(false)
const submitting = ref(false)
const data = ref<any[]>([])
const events = ref<any[]>([])
const selectedEvent = ref<number | null>(null)
const filterStatus = ref<string | null>(null)
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)

const registrationNo = ref('')
const checkinResult = ref<any>(null)
const totalCheckins = ref(0)
const successCheckins = ref(0)
const duplicateCheckins = ref(0)

const showFeedbackDialog = ref(false)
const currentCheckin = ref<any>(null)
const feedbackValue = ref('present')
const feedbackRemark = ref('')

const eventOptions = computed(() => 
  events.value.map(e => ({ label: e.name, value: e.id }))
)

const statusOptions = [
  { label: '成功', value: 'success' },
  { label: '重复', value: 'duplicate' },
  { label: '无效', value: 'invalid' },
]

const feedbackOptions = [
  { label: '已到场', value: 'present' },
  { label: '部分到场', value: 'partial' },
  { label: '未到场', value: 'absent' },
  { label: '待确认', value: 'unconfirmed' },
]

const columns = [
  { title: '签到编号', key: 'id', width: 80 },
  { title: '报名编号', key: 'registration_no', width: 140 },
  { title: '姓名', key: 'registration_real_name', width: 100 },
  { title: '签到时间', key: 'checkin_time', width: 160 },
  { title: '状态', key: 'status', width: 100 },
  { title: '到场反馈', key: 'attendance_feedback', width: 100 },
  { title: '设备', key: 'device_name', width: 120 },
  { title: '操作人', key: 'operator_name', width: 100 },
  { title: '操作', key: 'actions', width: 120, fixed: 'right' },
]

const pagination = computed(() => ({
  page: page.value,
  pageSize: pageSize.value,
  itemCount: total.value,
}))

const resultClass = computed(() => ({
  success: checkinResult.value?.status === 'success',
  error: checkinResult.value?.status !== 'success',
}))

const resultTitle = computed(() => {
  if (!checkinResult.value) return ''
  const map: Record<string, string> = {
    success: '签到成功',
    duplicate: '重复签到',
    invalid: '签到无效',
  }
  return map[checkinResult.value.status] || checkinResult.value.status
})

const statusLabel = (status: string) => {
  const map: Record<string, string> = {
    success: '成功',
    duplicate: '重复',
    invalid: '无效',
    cancelled: '已取消',
  }
  return map[status] || status
}

const statusTagType = (status: string) => {
  const map: Record<string, any> = {
    success: 'success',
    duplicate: 'warning',
    invalid: 'error',
    cancelled: 'default',
  }
  return map[status] || 'default'
}

const feedbackLabel = (fb: string) => {
  const map: Record<string, string> = {
    present: '已到场',
    partial: '部分到场',
    absent: '未到场',
    unconfirmed: '待确认',
  }
  return map[fb] || fb
}

const feedbackTagType = (fb: string) => {
  const map: Record<string, any> = {
    present: 'success',
    partial: 'warning',
    absent: 'error',
    unconfirmed: 'default',
  }
  return map[fb] || 'default'
}

const fetchEvents = async () => {
  try {
    const resp: any = await api.get('/events', { is_active: true, page_size: 100 })
    events.value = resp.items || []
    if (events.value.length > 0) {
      selectedEvent.value = events.value[0].id
      fetchCheckins()
    }
  } catch (e) {
    console.error('获取活动列表失败', e)
  }
}

const fetchCheckins = async () => {
  if (!selectedEvent.value) return
  
  loading.value = true
  try {
    const params: any = {
      event_id: selectedEvent.value,
      page: page.value,
      page_size: pageSize.value,
    }
    if (filterStatus.value) params.status = filterStatus.value
    
    const resp: any = await api.get('/checkins', params)
    data.value = resp.items || []
    total.value = resp.total || 0
    
    successCheckins.value = data.value.filter((c: any) => c.status === 'success').length
    duplicateCheckins.value = data.value.filter((c: any) => c.status === 'duplicate').length
    totalCheckins.value = data.value.length
  } catch (e: any) {
    message.error(e.message || '获取数据失败')
  } finally {
    loading.value = false
  }
}

const handleEventChange = () => {
  page.value = 1
  fetchCheckins()
}

const handlePageChange = (p: number) => {
  page.value = p
  fetchCheckins()
}

const handleQuickCheckIn = async () => {
  if (!registrationNo.value) {
    message.warning('请输入报名编号')
    return
  }
  
  checkingIn.value = true
  checkinResult.value = null
  
  try {
    const result: any = await api.post('/checkins/by-code', {
      registration_no: registrationNo.value.trim(),
      checkin_method: 'manual',
    })
    checkinResult.value = result
    message.success(result.status === 'success' ? '签到成功' : '重复签到')
    registrationNo.value = ''
    fetchCheckins()
  } catch (e: any) {
    message.error(e.message || '签到失败')
  } finally {
    checkingIn.value = false
  }
}

const handleFeedback = (row: any) => {
  currentCheckin.value = row
  feedbackValue.value = row.attendance_feedback || 'present'
  feedbackRemark.value = ''
  showFeedbackDialog.value = true
}

const submitFeedback = async () => {
  if (!currentCheckin.value) return
  
  submitting.value = true
  try {
    await api.put(`/checkins/${currentCheckin.value.id}/feedback`, {
      feedback: feedbackValue.value,
      remark: feedbackRemark.value,
    })
    message.success('反馈提交成功')
    showFeedbackDialog.value = false
    fetchCheckins()
  } catch (e: any) {
    message.error(e.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchEvents()
})
</script>

<style scoped lang="scss">
.checkin-section {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
}

.checkin-card {
  h3 {
    margin-bottom: 16px;
    font-size: 16px;
  }
}

.checkin-form {
  margin-bottom: 20px;
}

.checkin-result {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-radius: 8px;
  
  &.success {
    background: #e8fff3;
    color: #18a058;
  }
  
  &.error {
    background: #fff3f0;
    color: #d03050;
  }
  
  .result-title {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 4px;
  }
  
  .result-detail {
    font-size: 14px;
    margin-bottom: 2px;
  }
  
  .result-time {
    font-size: 13px;
    opacity: 0.8;
  }
}

.stats-row {
  display: flex;
  justify-content: space-around;
  padding: 20px 0;
}

.stat-box {
  text-align: center;
  
  .stat-num {
    font-size: 28px;
    font-weight: 600;
    color: #333;
    margin-bottom: 4px;
  }
  
  .stat-label {
    font-size: 13px;
    color: #999;
  }
  
  &.success .stat-num {
    color: #18a058;
  }
  
  &.warning .stat-num {
    color: #f0a020;
  }
}
</style>
