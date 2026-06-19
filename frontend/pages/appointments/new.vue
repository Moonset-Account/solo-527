<template>
  <n-card title="新建预约" hoverable>
    <n-form
      ref="formRef"
      :model="formValue"
      :rules="rules"
      label-placement="top"
      class="max-w-2xl mx-auto"
    >
      <n-tabs v-model:value="activeTab" type="line" class="mb-6">
        <n-tab-pane name="select" tab="选择档期">
          <n-space vertical size="large">
            <n-form-item label="选择咨询师" path="counselor_id">
              <n-select
                v-model:value="formValue.counselor_id"
                :options="counselorOptions"
                placeholder="请选择咨询师"
                @update:value="loadAvailableSchedules"
              />
            </n-form-item>

            <n-form-item label="选择日期" path="schedule_date">
              <n-date-picker
                v-model:value="formValue.schedule_date"
                type="date"
                placeholder="选择预约日期"
                :disabled-date="disabledDate"
                @update:value="loadAvailableSchedules"
              />
            </n-form-item>

            <n-form-item label="选择时段" path="schedule_id">
              <div v-if="loadingSchedules" class="text-center py-8">
                <n-spin size="large" />
              </div>
              <div v-else-if="availableSchedules.length === 0" class="text-center py-8 text-gray-500">
                暂无可用档期，请先选择咨询师和日期
              </div>
              <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div
                  v-for="sched in availableSchedules"
                  :key="sched.id"
                  class="border-2 rounded-lg p-4 cursor-pointer transition-all"
                  :class="{
                    'border-blue-500 bg-blue-50': formValue.schedule_id === sched.id,
                    'border-gray-200 hover:border-blue-300': formValue.schedule_id !== sched.id
                  }"
                  @click="selectSchedule(sched)"
                >
                  <div class="font-medium">{{ sched.start_time }} - {{ sched.end_time }}</div>
                  <div class="text-sm text-gray-500 mt-1">
                    可约 {{ sched.available_slots }} / {{ sched.max_appointments }}
                  </div>
                  <div class="text-sm text-gray-500">{{ sched.counselor_name }}</div>
                </div>
              </div>
            </n-form-item>
          </n-space>
        </n-tab-pane>

        <n-tab-pane name="info" tab="填写信息" :disabled="!formValue.schedule_id">
          <n-space vertical size="large">
            <n-row :gutter="12">
              <n-col :span="12">
                <n-form-item label="访客姓名" path="visitor_name">
                  <n-input v-model:value="formValue.visitor_name" placeholder="请输入访客姓名" />
                </n-form-item>
              </n-col>
              <n-col :span="12">
                <n-form-item label="联系电话" path="visitor_phone">
                  <n-input v-model:value="formValue.visitor_phone" placeholder="请输入手机号" />
                </n-form-item>
              </n-col>
            </n-row>

            <n-row :gutter="12">
              <n-col :span="12">
                <n-form-item label="性别">
                  <n-radio-group v-model:value="formValue.visitor_gender">
                    <n-radio value="男">男</n-radio>
                    <n-radio value="女">女</n-radio>
                  </n-radio-group>
                </n-form-item>
              </n-col>
              <n-col :span="12">
                <n-form-item label="年龄">
                  <n-input-number v-model:value="formValue.visitor_age" :min="1" :max="120" style="width: 100%" />
                </n-form-item>
              </n-col>
            </n-row>

            <n-form-item label="来访原因" path="visit_reason">
              <n-input
                v-model:value="formValue.visit_reason"
                type="textarea"
                :rows="4"
                placeholder="请详细描述来访原因，便于咨询师提前了解情况"
              />
            </n-form-item>

            <n-form-item label="备注信息">
              <n-input
                v-model:value="formValue.notes"
                type="textarea"
                :rows="3"
                placeholder="其他需要说明的情况"
              />
            </n-form-item>
          </n-space>
        </n-tab-pane>
      </n-tabs>

      <n-space justify="space-between" class="mt-8">
        <n-button @click="activeTab = 'select'" v-if="activeTab === 'info'">
          上一步
        </n-button>
        <div v-else></div>
        <n-space>
          <n-button @click="router.push('/appointments')">取消</n-button>
          <n-button v-if="activeTab === 'select'" type="primary" :disabled="!formValue.schedule_id" @click="activeTab = 'info'">
            下一步
          </n-button>
          <n-button v-if="activeTab === 'info'" type="primary" :loading="submitting" @click="handleSubmit">
            确认预约
          </n-button>
        </n-space>
      </n-space>
    </n-form>
  </n-card>
</template>

<script setup lang="ts">
import { ref, onMounted, h } from 'vue'
import { useRouter } from 'vue-router'
import {
  NCard,
  NForm,
  NFormItem,
  NInput,
  NButton,
  NSelect,
  NDatePicker,
  NTabs,
  NTabPane,
  NSpace,
  NRow,
  NCol,
  NRadioGroup,
  NRadio,
  NInputNumber,
  NSpin,
  useMessage,
  FormInst,
  FormRules,
  SelectOption
} from 'naive-ui'
import { useAuth } from '~/composables/useAuth'

const router = useRouter()
const message = useMessage()
const { apiRequest } = useAuth()

const formRef = ref<FormInst | null>(null)
const activeTab = ref('select')
const submitting = ref(false)
const loadingSchedules = ref(false)

const formValue = ref({
  counselor_id: null as number | null,
  schedule_date: null as number | null,
  schedule_id: null as number | null,
  visitor_name: '',
  visitor_phone: '',
  visitor_gender: '' as string | null,
  visitor_age: null as number | null,
  visit_reason: '',
  notes: ''
})

const rules: FormRules = {
  schedule_id: [
    { required: true, message: '请选择档期', trigger: 'change' }
  ],
  visitor_name: [
    { required: true, message: '请输入访客姓名', trigger: 'blur' }
  ],
  visitor_phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  visit_reason: [
    { required: true, message: '请填写来访原因', trigger: 'blur' }
  ]
}

const counselorOptions = ref<SelectOption[]>([])
const availableSchedules = ref<any[]>([])

function disabledDate(date: any) {
  return date.getTime() < Date.now() - 86400000
}

async function loadCounselors() {
  try {
    const counselors = await apiRequest<any[]>('/api/counselors?is_active=true')
    counselorOptions.value = counselors.map(c => ({
      label: `${c.name} - ${c.title || '咨询师'}`,
      value: c.id
    }))
  } catch (error) {
    message.error('加载咨询师列表失败')
  }
}

async function loadAvailableSchedules() {
  if (!formValue.value.counselor_id || !formValue.value.schedule_date) return
  
  loadingSchedules.value = true
  try {
    const dateStr = new Date(formValue.value.schedule_date).toISOString().split('T')[0]
    const schedules = await apiRequest<any[]>('/api/schedules/available', {
      params: {
        counselor_id: formValue.value.counselor_id,
        schedule_date: dateStr
      }
    })
    availableSchedules.value = schedules
  } catch (error) {
    message.error('加载可用档期失败')
  } finally {
    loadingSchedules.value = false
  }
}

function selectSchedule(sched: any) {
  formValue.value.schedule_id = sched.id
}

async function handleSubmit() {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    submitting.value = true
    
    await apiRequest('/api/appointments', {
      method: 'POST',
      body: {
        schedule_id: formValue.value.schedule_id,
        visitor_name: formValue.value.visitor_name,
        visitor_phone: formValue.value.visitor_phone,
        visitor_gender: formValue.value.visitor_gender,
        visitor_age: formValue.value.visitor_age,
        visit_reason: formValue.value.visit_reason,
        notes: formValue.value.notes
      }
    })
    
    message.success('预约创建成功')
    router.push('/appointments')
  } catch (error: any) {
    message.error(error.data?.detail || '创建预约失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadCounselors()
})
</script>
