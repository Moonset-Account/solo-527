<template>
  <div class="page-container">
    <div class="card-wrapper">
      <h2 class="page-title">活动管理</h2>
      
      <div class="table-toolbar">
        <div class="search-bar">
          <n-select
            v-model:value="filterStatus"
            :options="statusOptions"
            placeholder="状态"
            style="width: 120px"
            clearable
          />
        </div>
        <div class="action-bar">
          <n-button type="primary" @click="handleAdd">
            新建活动
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
          <n-tag :type="row.is_active ? 'success' : 'default'">
            {{ row.is_active ? '进行中' : '已结束' }}
          </n-tag>
        </template>
        <template #actions="{ row }">
          <n-space>
            <n-button size="small" @click="handleEdit(row)">编辑</n-button>
            <n-button size="small" @click="goToDetail(row)">报名详情</n-button>
          </n-space>
        </template>
      </n-data-table>
    </div>
    
    <n-modal v-model:show="showDialog" preset="card" :title="isEdit ? '编辑活动' : '新建活动'" style="width: 600px">
      <n-form ref="formRef" :model="form" :rules="rules" label-placement="top">
        <n-form-item label="活动名称" path="name">
          <n-input v-model:value="form.name" placeholder="请输入活动名称" />
        </n-form-item>
        <n-grid :cols="2" :x-gap="16">
          <n-form-item-gi label="开始日期" path="start_date">
            <n-date-picker v-model:value="form.start_date" type="date" style="width: 100%" />
          </n-form-item-gi>
          <n-form-item-gi label="结束日期">
            <n-date-picker v-model:value="form.end_date" type="date" style="width: 100%" />
          </n-form-item-gi>
        </n-grid>
        <n-grid :cols="2" :x-gap="16">
          <n-form-item-gi label="开始时间">
            <n-time-picker v-model:value="form.start_time" style="width: 100%" />
          </n-form-item-gi>
          <n-form-item-gi label="结束时间">
            <n-time-picker v-model:value="form.end_time" style="width: 100%" />
          </n-form-item-gi>
        </n-grid>
        <n-form-item label="地点">
          <n-input v-model:value="form.location" placeholder="活动地点" />
        </n-form-item>
        <n-form-item label="人数上限">
          <n-input-number v-model:value="form.max_participants" :min="0" style="width: 100%" />
        </n-form-item>
        <n-form-item label="活动描述">
          <n-input v-model:value="form.description" type="textarea" :rows="3" />
        </n-form-item>
        <n-form-item label="是否启用">
          <n-switch v-model:value="form.is_active" />
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
import { useRouter } from 'vue-router'
import {
  NCard, NInput, NSelect, NButton, NSpace, NDataTable,
  NModal, NTag, NForm, NFormItem, NFormItemGi, NGrid,
  NSwitch, NDatePicker, NTimePicker, NInputNumber, useMessage
} from 'naive-ui'
import { useApi } from '~/composables/useApi'

const router = useRouter()
const message = useMessage()
const api = useApi()

const loading = ref(false)
const submitting = ref(false)
const data = ref<any[]>([])
const filterStatus = ref<string | null>(null)
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)

const showDialog = ref(false)
const isEdit = ref(false)
const editId = ref<number | null>(null)
const formRef = ref()

const form = reactive({
  name: '',
  description: '',
  location: '',
  start_date: null as number | null,
  end_date: null as number | null,
  start_time: null as number | null,
  end_time: null as number | null,
  max_participants: null as number | null,
  is_active: true,
})

const rules = {
  name: [{ required: true, message: '请输入活动名称', trigger: 'blur' }],
  start_date: [{ required: true, message: '请选择开始日期', trigger: 'change' }],
}

const statusOptions = [
  { label: '进行中', value: 'active' },
  { label: '已结束', value: 'inactive' },
]

const columns = [
  { title: 'ID', key: 'id', width: 60 },
  { title: '活动名称', key: 'name' },
  { title: '地点', key: 'location' },
  { title: '开始日期', key: 'start_date', width: 120 },
  { title: '结束日期', key: 'end_date', width: 120 },
  { title: '人数上限', key: 'max_participants', width: 100 },
  { title: '状态', key: 'status', width: 100 },
  { title: '操作', key: 'actions', width: 180, fixed: 'right' },
]

const pagination = computed(() => ({
  page: page.value,
  pageSize: pageSize.value,
  itemCount: total.value,
}))

const fetchEvents = async () => {
  loading.value = true
  try {
    const params: any = {
      page: page.value,
      page_size: pageSize.value,
    }
    if (filterStatus.value) {
      params.is_active = filterStatus.value === 'active'
    }
    
    const data: any = await api.get('/events', params)
    data.value = data.items || []
    total.value = data.total || 0
  } catch (e: any) {
    message.error(e.message || '获取数据失败')
  } finally {
    loading.value = false
  }
}

const handlePageChange = (p: number) => {
  page.value = p
  fetchEvents()
}

const handleAdd = () => {
  isEdit.value = false
  Object.assign(form, {
    name: '',
    description: '',
    location: '',
    start_date: null,
    end_date: null,
    start_time: null,
    end_time: null,
    max_participants: null,
    is_active: true,
  })
  showDialog.value = true
}

const handleEdit = (row: any) => {
  isEdit.value = true
  editId.value = row.id
  Object.assign(form, {
    name: row.name,
    description: row.description,
    location: row.location,
    start_date: row.start_date ? new Date(row.start_date).getTime() : null,
    end_date: row.end_date ? new Date(row.end_date).getTime() : null,
    start_time: row.start_time ? new Date(`2000-01-01 ${row.start_time}`).getTime() : null,
    end_time: row.end_time ? new Date(`2000-01-01 ${row.end_time}`).getTime() : null,
    max_participants: row.max_participants,
    is_active: row.is_active,
  })
  showDialog.value = true
}

const handleSubmit = async () => {
  try {
    await formRef.value.validate()
  } catch (e) {
    return
  }
  
  submitting.value = true
  try {
    const submitData: any = {
      ...form,
      start_date: form.start_date ? new Date(form.start_date).toISOString().split('T')[0] : null,
      end_date: form.end_date ? new Date(form.end_date).toISOString().split('T')[0] : null,
      start_time: form.start_time ? new Date(form.start_time).toTimeString().split(' ')[0] : null,
      end_time: form.end_time ? new Date(form.end_time).toTimeString().split(' ')[0] : null,
    }
    
    if (isEdit.value && editId.value) {
      await api.put(`/events/${editId.value}`, submitData)
      message.success('更新成功')
    } else {
      await api.post('/events', submitData)
      message.success('创建成功')
    }
    showDialog.value = false
    fetchEvents()
  } catch (e: any) {
    message.error(e.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

const goToDetail = (row: any) => {
  router.push(`/admin/registrations?event_id=${row.id}`)
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
