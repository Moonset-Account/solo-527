<template>
  <div class="space-y-4">
    <n-card>
      <template #header>
        <div class="flex items-center justify-between">
          <span>排班列表</span>
          <n-space>
            <n-select
              v-model:value="filterCounselor"
              :options="counselorOptions"
              placeholder="筛选咨询师"
              style="width: 180px"
              clearable
            />
            <n-date-picker
              v-model:value="dateRange"
              type="daterange"
              placeholder="选择日期范围"
              clearable
            />
            <n-button @click="showBatchModal = true">
              批量排班
            </n-button>
            <n-button type="primary" @click="showCreateModal = true">
              <template #icon>
                <AddCircleOutline />
              </template>
              新增排班
            </n-button>
          </n-space>
        </div>
      </template>

      <n-table
        :data="schedules"
        :columns="columns"
        bordered
        :pagination="{
          page: page,
          pageSize: pageSize,
          itemCount: total,
          onUpdatePage: (p) => { page = p; loadData() },
          onUpdatePageSize: (ps) => { pageSize = ps; page = 1; loadData() }
        }"
      >
        <template #counselor="{ row }">
          {{ row.counselor_info?.name || '-' }}
        </template>
        <template #time_slot="{ row }">
          <div v-if="row.time_slot_info">
            {{ row.time_slot_info.start_time }} - {{ row.time_slot_info.end_time }}
          </div>
        </template>
        <template #is_available="{ row }">
          <n-tag :type="row.is_available ? 'success' : 'default'">
            {{ row.is_available ? '可用' : '停用' }}
          </n-tag>
        </template>
        <template #actions="{ row }">
          <n-space>
            <n-button size="small" text @click="editSchedule(row)">
              编辑
            </n-button>
            <n-popconfirm
              positive-text="删除"
              negative-text="取消"
              @positive-click="deleteSchedule(row)"
            >
              <template #trigger>
                <n-button size="small" text type="error">
                  删除
                </n-button>
              </template>
              确定要删除该排班吗？
            </n-popconfirm>
          </n-space>
        </template>
      </n-table>
    </n-card>

    <n-modal v-model:show="showCreateModal" preset="card" :title="editingSchedule ? '编辑排班' : '新增排班'" style="width: 500px">
      <n-form
        ref="formRef"
        :model="formValue"
        :rules="rules"
        label-placement="top"
      >
        <n-form-item label="咨询师" path="counselor_id">
          <n-select
            v-model:value="formValue.counselor_id"
            :options="counselorOptions"
            placeholder="请选择咨询师"
          />
        </n-form-item>
        <n-form-item label="时段" path="time_slot_id">
          <n-select
            v-model:value="formValue.time_slot_id"
            :options="timeSlotOptions"
            placeholder="请选择时段"
          />
        </n-form-item>
        <n-form-item label="日期" path="schedule_date">
          <n-date-picker
            v-model:value="formValue.schedule_date"
            type="date"
            placeholder="选择日期"
            style="width: 100%"
          />
        </n-form-item>
        <n-form-item label="最大预约数">
          <n-input-number v-model:value="formValue.max_appointments" :min="1" style="width: 100%" />
        </n-form-item>
        <n-form-item label="是否可用">
          <n-switch v-model:value="formValue.is_available" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showCreateModal = false">取消</n-button>
          <n-button type="primary" :loading="submitting" @click="handleSubmit">
            确认
          </n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal v-model:show="showBatchModal" preset="card" title="批量排班" style="width: 550px">
      <n-form
        ref="batchFormRef"
        :model="batchFormValue"
        label-placement="top"
      >
        <n-form-item label="选择咨询师">
          <n-select
            v-model:value="batchFormValue.counselor_ids"
            :options="counselorOptions"
            multiple
            placeholder="请选择咨询师"
          />
        </n-form-item>
        <n-form-item label="选择时段">
          <n-select
            v-model:value="batchFormValue.time_slot_ids"
            :options="timeSlotOptions"
            multiple
            placeholder="请选择时段"
          />
        </n-form-item>
        <n-form-item label="日期范围">
          <n-date-picker
            v-model:value="batchFormValue.date_range"
            type="daterange"
            placeholder="选择日期范围"
            style="width: 100%"
          />
        </n-form-item>
        <n-form-item label="最大预约数">
          <n-input-number v-model:value="batchFormValue.max_appointments" :min="1" style="width: 100%" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showBatchModal = false">取消</n-button>
          <n-button type="primary" :loading="submitting" @click="handleBatchSubmit">
            批量创建
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  NCard,
  NTable,
  NButton,
  NSelect,
  NDatePicker,
  NSpace,
  NModal,
  NForm,
  NFormItem,
  NInputNumber,
  NSwitch,
  NTag,
  NPopconfirm,
  useMessage,
  TableColumns,
  SelectOption,
  FormInst,
  FormRules
} from 'naive-ui'
import { AddCircleOutline } from '@vicons/ionicons5'
import { useAuth } from '~/composables/useAuth'

const message = useMessage()
const { apiRequest } = useAuth()

const schedules = ref<any[]>([])
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const filterCounselor = ref<number | null>(null)
const dateRange = ref<[number, number] | null>(null)
const showCreateModal = ref(false)
const showBatchModal = ref(false)
const editingSchedule = ref<any>(null)
const submitting = ref(false)

const counselorOptions = ref<SelectOption[]>([])
const timeSlotOptions = ref<SelectOption[]>([])

const formRef = ref<FormInst | null>(null)
const batchFormRef = ref<FormInst | null>(null)

const formValue = ref({
  counselor_id: null as number | null,
  time_slot_id: null as number | null,
  schedule_date: null as number | null,
  max_appointments: 1,
  is_available: true
})

const batchFormValue = ref({
  counselor_ids: [] as number[],
  time_slot_ids: [] as number[],
  date_range: null as [number, number] | null,
  max_appointments: 1
})

const rules: FormRules = {
  counselor_id: [{ required: true, message: '请选择咨询师', trigger: 'change' }],
  time_slot_id: [{ required: true, message: '请选择时段', trigger: 'change' }],
  schedule_date: [{ required: true, message: '请选择日期', trigger: 'change' }]
}

const columns: TableColumns = [
  { title: 'ID', key: 'id', width: 60 },
  { title: '咨询师', key: 'counselor' },
  { title: '日期', key: 'schedule_date' },
  { title: '时段', key: 'time_slot' },
  { title: '最大预约数', key: 'max_appointments' },
  { title: '状态', key: 'is_available' },
  { title: '创建时间', key: 'created_at' },
  { title: '操作', key: 'actions', width: 150 }
]

async function loadCounselors() {
  try {
    const data = await apiRequest<any[]>('/api/counselors?is_active=true')
    counselorOptions.value = data.map(c => ({ label: c.name, value: c.id }))
  } catch (error) {
    message.error('加载咨询师列表失败')
  }
}

async function loadTimeSlots() {
  try {
    const data = await apiRequest<any[]>('/api/time-slots?is_active=true')
    timeSlotOptions.value = data.map(t => ({
      label: `${t.start_time} - ${t.end_time}`,
      value: t.id
    }))
  } catch (error) {
    message.error('加载时段列表失败')
  }
}

async function loadData() {
  try {
    const params: any = {
      skip: (page.value - 1) * pageSize.value,
      limit: pageSize.value
    }
    if (filterCounselor.value) {
      params.counselor_id = filterCounselor.value
    }
    if (dateRange.value) {
      params.start_date = new Date(dateRange.value[0]).toISOString().split('T')[0]
      params.end_date = new Date(dateRange.value[1]).toISOString().split('T')[0]
    }
    
    const data = await apiRequest<any[]>('/api/schedules', { params })
    schedules.value = data
    total.value = data.length
  } catch (error) {
    message.error('加载数据失败')
  }
}

function editSchedule(row: any) {
  editingSchedule.value = row
  formValue.value = {
    counselor_id: row.counselor_id,
    time_slot_id: row.time_slot_id,
    schedule_date: new Date(row.schedule_date).getTime(),
    max_appointments: row.max_appointments,
    is_available: row.is_available
  }
  showCreateModal.value = true
}

async function handleSubmit() {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    submitting.value = true
    
    const body = {
      counselor_id: formValue.value.counselor_id,
      time_slot_id: formValue.value.time_slot_id,
      schedule_date: new Date(formValue.value.schedule_date!).toISOString().split('T')[0],
      max_appointments: formValue.value.max_appointments,
      is_available: formValue.value.is_available
    }
    
    if (editingSchedule.value) {
      await apiRequest(`/api/schedules/${editingSchedule.value.id}`, {
        method: 'PUT',
        body
      })
      message.success('更新成功')
    } else {
      await apiRequest('/api/schedules', {
        method: 'POST',
        body
      })
      message.success('创建成功')
    }
    
    showCreateModal.value = false
    loadData()
  } catch (error: any) {
    message.error(error.data?.detail || '操作失败')
  } finally {
    submitting.value = false
    editingSchedule.value = null
  }
}

async function handleBatchSubmit() {
  try {
    submitting.value = true
    
    const body = {
      counselor_ids: batchFormValue.value.counselor_ids,
      time_slot_ids: batchFormValue.value.time_slot_ids,
      start_date: new Date(batchFormValue.value.date_range![0]).toISOString().split('T')[0],
      end_date: new Date(batchFormValue.value.date_range![1]).toISOString().split('T')[0],
      max_appointments: batchFormValue.value.max_appointments
    }
    
    const result = await apiRequest('/api/schedules/batch-create', {
      method: 'POST',
      body
    })
    
    message.success(result.message || '批量创建成功')
    showBatchModal.value = false
    loadData()
  } catch (error: any) {
    message.error(error.data?.detail || '操作失败')
  } finally {
    submitting.value = false
  }
}

async function deleteSchedule(row: any) {
  try {
    await apiRequest(`/api/schedules/${row.id}`, {
      method: 'DELETE'
    })
    message.success('删除成功')
    loadData()
  } catch (error: any) {
    message.error(error.data?.detail || '删除失败')
  }
}

onMounted(() => {
  loadCounselors()
  loadTimeSlots()
  loadData()
})
</script>
