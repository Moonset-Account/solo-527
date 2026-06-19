<template>
  <div class="space-y-4">
    <n-card>
      <template #header>
        <div class="flex items-center justify-between">
          <span>可约时段设置</span>
          <n-button type="primary" @click="showCreateModal = true">
            <template #icon>
              <AddCircleOutline />
            </template>
            新增时段
          </n-button>
        </div>
      </template>

      <n-table :data="timeSlots" :columns="columns" bordered>
        <template #day_of_week="{ row }">
          {{ getDayText(row.day_of_week) }}
        </template>
        <template #is_active="{ row }">
          <n-tag :type="row.is_active ? 'success' : 'default'">
            {{ row.is_active ? '启用' : '停用' }}
          </n-tag>
        </template>
        <template #actions="{ row }">
          <n-space>
            <n-button size="small" text @click="editTimeSlot(row)">
              编辑
            </n-button>
            <n-button
              size="small"
              text
              :type="row.is_active ? 'warning' : 'success'"
              @click="toggleStatus(row)"
            >
              {{ row.is_active ? '停用' : '启用' }}
            </n-button>
          </n-space>
        </template>
      </n-table>
    </n-card>

    <n-modal v-model:show="showCreateModal" preset="card" :title="editingSlot ? '编辑时段' : '新增时段'" style="width: 450px">
      <n-form
        ref="formRef"
        :model="formValue"
        :rules="rules"
        label-placement="top"
      >
        <n-form-item label="开始时间" path="start_time">
          <n-time-picker
            v-model:value="formValue.start_time"
            format="HH:mm"
            placeholder="选择开始时间"
            style="width: 100%"
          />
        </n-form-item>
        <n-form-item label="结束时间" path="end_time">
          <n-time-picker
            v-model:value="formValue.end_time"
            format="HH:mm"
            placeholder="选择结束时间"
            style="width: 100%"
          />
        </n-form-item>
        <n-form-item label="适用星期">
          <n-select
            v-model:value="formValue.day_of_week"
            :options="dayOptions"
            placeholder="选择适用星期（不选则为全部）"
            clearable
          />
        </n-form-item>
        <n-form-item label="是否启用">
          <n-switch v-model:value="formValue.is_active" />
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  NCard,
  NTable,
  NButton,
  NSpace,
  NModal,
  NForm,
  NFormItem,
  NTimePicker,
  NSelect,
  NSwitch,
  NTag,
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

const timeSlots = ref<any[]>([])
const showCreateModal = ref(false)
const editingSlot = ref<any>(null)
const submitting = ref(false)

const dayOptions: SelectOption[] = [
  { label: '周一', value: 1 },
  { label: '周二', value: 2 },
  { label: '周三', value: 3 },
  { label: '周四', value: 4 },
  { label: '周五', value: 5 },
  { label: '周六', value: 6 },
  { label: '周日', value: 0 }
]

const formRef = ref<FormInst | null>(null)
const formValue = ref({
  start_time: null as number | null,
  end_time: null as number | null,
  day_of_week: null as number | null,
  is_active: true
})

const rules: FormRules = {
  start_time: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  end_time: [{ required: true, message: '请选择结束时间', trigger: 'change' }]
}

const columns: TableColumns = [
  { title: 'ID', key: 'id', width: 60 },
  { title: '开始时间', key: 'start_time' },
  { title: '结束时间', key: 'end_time' },
  { title: '适用星期', key: 'day_of_week' },
  { title: '状态', key: 'is_active' },
  { title: '创建时间', key: 'created_at' },
  { title: '操作', key: 'actions', width: 150 }
]

function getDayText(day: number | null) {
  if (day === null) return '全部'
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return days[day] || '-'
}

async function loadData() {
  try {
    const data = await apiRequest<any[]>('/api/time-slots')
    timeSlots.value = data
  } catch (error) {
    message.error('加载数据失败')
  }
}

function editTimeSlot(row: any) {
  editingSlot.value = row
  const startTime = row.start_time.split(':')
  const endTime = row.end_time.split(':')
  
  const startDate = new Date()
  startDate.setHours(parseInt(startTime[0]), parseInt(startTime[1]), 0, 0)
  
  const endDate = new Date()
  endDate.setHours(parseInt(endTime[0]), parseInt(endTime[1]), 0, 0)
  
  formValue.value = {
    start_time: startDate.getTime(),
    end_time: endDate.getTime(),
    day_of_week: row.day_of_week,
    is_active: row.is_active
  }
  showCreateModal.value = true
}

function formatTime(ts: number | null) {
  if (!ts) return null
  const d = new Date(ts)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

async function handleSubmit() {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    submitting.value = true
    
    const body = {
      start_time: formatTime(formValue.value.start_time),
      end_time: formatTime(formValue.value.end_time),
      day_of_week: formValue.value.day_of_week,
      is_active: formValue.value.is_active
    }
    
    if (editingSlot.value) {
      await apiRequest(`/api/time-slots/${editingSlot.value.id}`, {
        method: 'PUT',
        body
      })
      message.success('更新成功')
    } else {
      await apiRequest('/api/time-slots', {
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
    editingSlot.value = null
  }
}

async function toggleStatus(row: any) {
  try {
    await apiRequest(`/api/time-slots/${row.id}`, {
      method: 'PUT',
      body: { is_active: !row.is_active }
    })
    message.success('状态更新成功')
    loadData()
  } catch (error) {
    message.error('操作失败')
  }
}

onMounted(() => {
  loadData()
})
</script>
