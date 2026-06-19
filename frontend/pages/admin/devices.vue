<template>
  <div class="page-container">
    <div class="card-wrapper">
      <h2 class="page-title">设备管理</h2>
      
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
            placeholder="设备状态"
            style="width: 120px"
            clearable
          />
          <n-select
            v-model:value="filterType"
            :options="typeOptions"
            placeholder="设备类型"
            style="width: 120px"
            clearable
          />
        </div>
        <div class="action-bar">
          <n-button type="primary" @click="handleAdd">
            <template #icon><AddOutline /></template>
            添加设备
          </n-button>
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
          <n-tag :type="statusTagType(row.device_status)">
            {{ statusLabel(row.device_status) }}
          </n-tag>
        </template>
        <template #type="{ row }">
          {{ typeLabel(row.device_type) }}
        </template>
        <template #actions="{ row }">
          <n-space>
            <n-button size="small" @click="handleEdit(row)">编辑</n-button>
            <n-button size="small" type="error" @click="handleDelete(row)">删除</n-button>
          </n-space>
        </template>
      </n-data-table>
    </div>
    
    <n-modal v-model:show="showDialog" preset="card" :title="isEdit ? '编辑设备' : '添加设备'" style="width: 500px">
      <n-form ref="formRef" :model="form" :rules="rules" label-placement="top">
        <n-grid :cols="2" :x-gap="16">
          <n-form-item-gi label="设备编号" path="device_code">
            <n-input v-model:value="form.device_code" placeholder="唯一设备编号" :disabled="isEdit" />
          </n-form-item-gi>
          <n-form-item-gi label="设备名称" path="device_name">
            <n-input v-model:value="form.device_name" placeholder="设备名称" />
          </n-form-item-gi>
          <n-form-item-gi label="设备类型" path="device_type">
            <n-select v-model:value="form.device_type" :options="typeOptions" />
          </n-form-item-gi>
          <n-form-item-gi label="设备状态" path="device_status">
            <n-select v-model:value="form.device_status" :options="statusOptions" />
          </n-form-item-gi>
          <n-form-item-gi label="所属活动" path="event_id">
            <n-select v-model:value="form.event_id" :options="eventOptions" />
          </n-form-item-gi>
          <n-form-item-gi label="安装位置">
            <n-input v-model:value="form.location" placeholder="设备安装位置" />
          </n-form-item-gi>
        </n-grid>
        <n-form-item label="备注">
          <n-input v-model:value="form.remark" type="textarea" :rows="3" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showDialog = false">取消</n-button>
          <n-button type="primary" :loading="submitting" @click="handleSubmit">确认</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import {
  NCard, NInput, NSelect, NButton, NSpace, NDataTable,
  NModal, NTag, NForm, NFormItem, NFormItemGi, NGrid,
  NIcon, useMessage, useDialog
} from 'naive-ui'
import { AddOutline } from '@vicons/ionicons5'
import { useApi } from '~/composables/useApi'

const message = useMessage()
const dialog = useDialog()
const api = useApi()

const loading = ref(false)
const submitting = ref(false)
const data = ref<any[]>([])
const events = ref<any[]>([])
const selectedEvent = ref<number | null>(null)
const filterStatus = ref<string | null>(null)
const filterType = ref<string | null>(null)
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)

const showDialog = ref(false)
const isEdit = ref(false)
const editId = ref<number | null>(null)
const formRef = ref()

const form = reactive({
  device_code: '',
  device_name: '',
  device_type: 'desktop',
  device_status: 'active',
  event_id: null as number | null,
  location: '',
  remark: '',
})

const rules = {
  device_code: [{ required: true, message: '请输入设备编号', trigger: 'blur' }],
  device_name: [{ required: true, message: '请输入设备名称', trigger: 'blur' }],
  event_id: [{ required: true, message: '请选择活动', trigger: 'change' }],
}

const eventOptions = computed(() => 
  events.value.map(e => ({ label: e.name, value: e.id }))
)

const statusOptions = [
  { label: '激活', value: 'active' },
  { label: '停用', value: 'inactive' },
  { label: '维护中', value: 'maintenance' },
]

const typeOptions = [
  { label: '桌面端', value: 'desktop' },
  { label: '移动端', value: 'mobile' },
  { label: '闸机', value: 'gate' },
]

const columns = [
  { title: '设备编号', key: 'device_code', width: 140 },
  { title: '设备名称', key: 'device_name', width: 140 },
  { title: '类型', key: 'type', width: 100 },
  { title: '状态', key: 'status', width: 100 },
  { title: '位置', key: 'location' },
  { title: '签到次数', key: 'checkin_count', width: 100 },
  { title: '最后签到', key: 'last_checkin_time', width: 160 },
  { title: '操作', key: 'actions', width: 140, fixed: 'right' },
]

const pagination = computed(() => ({
  page: page.value,
  pageSize: pageSize.value,
  itemCount: total.value,
}))

const statusLabel = (status: string) => {
  const map: Record<string, string> = {
    active: '激活',
    inactive: '停用',
    maintenance: '维护中',
  }
  return map[status] || status
}

const statusTagType = (status: string) => {
  const map: Record<string, any> = {
    active: 'success',
    inactive: 'default',
    maintenance: 'warning',
  }
  return map[status] || 'default'
}

const typeLabel = (type: string) => {
  const map: Record<string, string> = {
    desktop: '桌面端',
    mobile: '移动端',
    gate: '闸机',
  }
  return map[type] || type
}

const fetchEvents = async () => {
  try {
    const resp: any = await api.get('/events', { page_size: 100 })
    events.value = resp.items || []
    if (events.value.length > 0) {
      selectedEvent.value = events.value[0].id
      fetchDevices()
    }
  } catch (e) {
    console.error('获取活动列表失败', e)
  }
}

const fetchDevices = async () => {
  if (!selectedEvent.value) return
  
  loading.value = true
  try {
    const params: any = {
      event_id: selectedEvent.value,
      page: page.value,
      page_size: pageSize.value,
    }
    if (filterStatus.value) params.device_status = filterStatus.value
    if (filterType.value) params.device_type = filterType.value
    
    const resp: any = await api.get('/devices', params)
    data.value = resp.items || []
    total.value = resp.total || 0
  } catch (e: any) {
    message.error(e.message || '获取数据失败')
  } finally {
    loading.value = false
  }
}

const handleEventChange = () => {
  page.value = 1
  fetchDevices()
}

const handlePageChange = (p: number) => {
  page.value = p
  fetchDevices()
}

const handleAdd = () => {
  isEdit.value = false
  Object.assign(form, {
    device_code: '',
    device_name: '',
    device_type: 'desktop',
    device_status: 'active',
    event_id: selectedEvent.value,
    location: '',
    remark: '',
  })
  showDialog.value = true
}

const handleEdit = (row: any) => {
  isEdit.value = true
  editId.value = row.id
  Object.assign(form, {
    device_code: row.device_code,
    device_name: row.device_name,
    device_type: row.device_type,
    device_status: row.device_status,
    event_id: row.event_id,
    location: row.location,
    remark: row.remark,
  })
  showDialog.value = true
}

const handleDelete = (row: any) => {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除设备「${row.device_name}」吗？`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await api.del(`/devices/${row.id}`)
        message.success('删除成功')
        fetchDevices()
      } catch (e: any) {
        message.error(e.message || '删除失败')
      }
    },
  })
}

const handleSubmit = async () => {
  try {
    await formRef.value.validate()
  } catch (e) {
    return
  }
  
  submitting.value = true
  try {
    if (isEdit.value && editId.value) {
      await api.put(`/devices/${editId.value}`, form)
      message.success('更新成功')
    } else {
      await api.post('/devices', form)
      message.success('添加成功')
    }
    showDialog.value = false
    fetchDevices()
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
.action-bar {
  display: flex;
  gap: 12px;
}
</style>
