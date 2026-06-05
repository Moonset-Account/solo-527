<template>
  <div class="admin-events">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>活动管理</span>
          <div class="header-actions">
            <el-input
              v-model="keyword"
              placeholder="搜索活动名称"
              style="width: 250px; margin-right: 12px;"
              clearable
              @keyup.enter="loadEvents"
            >
              <template #append>
                <el-button icon="Search" @click="loadEvents" />
              </template>
            </el-input>
            <el-select v-model="filterType" placeholder="类型" style="width: 120px; margin-right: 12px;" clearable @change="loadEvents">
              <el-option v-for="t in types" :key="t.id" :label="t.name" :value="t.id" />
            </el-select>
            <el-button type="primary" icon="Plus" @click="openDialog()">新增活动</el-button>
          </div>
        </div>
      </template>

      <el-table :data="events" v-loading="loading" stripe border>
        <el-table-column label="封面" width="100" align="center">
          <template #default="{ row }">
            <el-image v-if="row.cover" :src="row.cover" fit="cover" style="width: 60px; height: 80px; border-radius: 4px;" />
            <span v-else style="color: #ccc;">无封面</span>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="活动名称" min-width="200" show-overflow-tooltip />
        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ row.event_type?.name || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="时间" width="220">
          <template #default="{ row }">
            <div>{{ row.start_date }}</div>
            <div style="color: #999; font-size: 12px;">{{ row.start_time }} - {{ row.end_time }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="location" label="地点" width="120" />
        <el-table-column label="报名情况" width="140" align="center">
          <template #default="{ row }">
            <span :style="{ color: row.current_participants >= row.max_participants ? '#ff4d4f' : '' }">
              {{ row.current_participants || 0 }} / {{ row.max_participants }}
            </span>
            <el-progress
              :percentage="Math.min(100, Math.round(((row.current_participants || 0) / row.max_participants) * 100))"
              :stroke-width="4"
              style="width: 80px; margin-top: 4px;"
            />
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small">
              {{ row.status_display }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openDialog(row)">编辑</el-button>
            <el-button type="success" link size="small" @click="viewRegistrations(row)">报名管理</el-button>
            <el-button type="danger" link size="small" @click="deleteEvent(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.page_size"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadEvents"
          @current-change="loadEvents"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑活动' : '新增活动'" width="700px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="活动标题" prop="title">
              <el-input v-model="form.title" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="活动类型" prop="event_type_id">
              <el-select v-model="form.event_type_id" style="width: 100%;">
                <el-option v-for="t in types" :key="t.id" :label="t.name" :value="t.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="地点" prop="location">
              <el-input v-model="form.location" placeholder="如：二楼活动室" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="开始日期" prop="start_date">
              <el-date-picker v-model="form.start_date" type="date" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="开始时间" prop="start_time">
              <el-time-picker v-model="form.start_time" format="HH:mm" value-format="HH:mm" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="结束时间" prop="end_time">
              <el-time-picker v-model="form.end_time" format="HH:mm" value-format="HH:mm" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="最大人数" prop="max_participants">
              <el-input-number v-model="form.max_participants" :min="1" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="费用(元)">
              <el-input-number v-model="form.fee" :min="0" :precision="2" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="需要签到">
              <el-switch v-model="form.need_checkin" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="活动简介">
              <el-input v-model="form.description" type="textarea" :rows="4" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveEvent">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="registDialogVisible" title="活动报名管理" width="800px">
      <div v-if="currentEvent">
        <div style="margin-bottom: 16px;">
          <h4 style="margin: 0;">{{ currentEvent.title }}</h4>
          <p style="color: #999; margin: 4px 0;">
            时间：{{ currentEvent.start_date }} {{ currentEvent.start_time }}-{{ currentEvent.end_time }} |
            地点：{{ currentEvent.location }} |
            报名：{{ currentEvent.current_participants || 0 }}/{{ currentEvent.max_participants }}
          </p>
        </div>
        <el-table :data="registrations" v-loading="regLoading" stripe size="small" border>
          <el-table-column prop="member.name" label="姓名" width="100" />
          <el-table-column label="联系方式" width="140">
            <template #default="{ row }">
              <div>{{ row.member.phone_display || row.member.phone }}</div>
              <div style="color: #999; font-size: 12px;">{{ row.member.email || '' }}</div>
            </template>
          </el-table-column>
          <el-table-column prop="registered_at" label="报名时间" width="180" />
          <el-table-column label="签到状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.is_checked_in" type="success" size="small">已签到</el-tag>
              <el-tag v-else type="info" size="small">未签到</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="checked_in_at" label="签到时间" width="180" />
          <el-table-column label="操作" width="140" align="center">
            <template #default="{ row }">
              <el-button
                v-if="!row.is_checked_in"
                type="success"
                link
                size="small"
                @click="checkIn(row)"
              >
                签到
              </el-button>
              <el-button v-else type="info" link size="small" disabled>已签到</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api } from '@/utils/request'

const loading = ref(false)
const regLoading = ref(false)
const events = ref([])
const types = ref([])
const keyword = ref('')
const filterType = ref('')
const dialogVisible = ref(false)
const registDialogVisible = ref(false)
const currentEvent = ref(null)
const registrations = ref([])
const formRef = ref(null)

const pagination = reactive({
  page: 1,
  page_size: 20,
  total: 0
})

const form = reactive({
  id: null, title: '', event_type_id: null, location: '',
  start_date: '', start_time: '19:00', end_time: '21:00',
  max_participants: 30, fee: 0, need_checkin: true, description: ''
})

const rules = {
  title: [{ required: true, message: '请输入活动标题', trigger: 'blur' }],
  event_type_id: [{ required: true, message: '请选择活动类型', trigger: 'change' }],
  location: [{ required: true, message: '请输入地点', trigger: 'blur' }],
  start_date: [{ required: true, message: '请选择开始日期', trigger: 'change' }],
  max_participants: [{ required: true, message: '请输入最大人数', trigger: 'blur' }],
}

const statusTagType = (status) => {
  const types = { draft: 'info', published: 'success', ongoing: 'warning', ended: 'danger', cancelled: 'info' }
  return types[status] || 'info'
}

const loadEvents = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/events/events/', {
      params: {
        page: pagination.page,
        page_size: pagination.page_size,
        search: keyword.value,
        event_type: filterType.value
      }
    })
    events.value = data.results
    pagination.total = data.count
  } finally {
    loading.value = false
  }
}

const loadTypes = async () => {
  const { data } = await api.get('/events/event_types/')
  types.value = data.results
  if (types.value.length > 0 && !form.event_type_id) {
    form.event_type_id = types.value[0].id
  }
}

const openDialog = (row = null) => {
  if (row) {
    Object.assign(form, {
      id: row.id, title: row.title,
      event_type_id: row.event_type?.id || row.event_type_id,
      location: row.location,
      start_date: row.start_date, start_time: row.start_time, end_time: row.end_time,
      max_participants: row.max_participants, fee: row.fee || 0,
      need_checkin: row.need_checkin, description: row.description || ''
    })
  } else {
    Object.assign(form, {
      id: null, title: '', event_type_id: types.value[0]?.id,
      location: '', start_date: '', start_time: '19:00', end_time: '21:00',
      max_participants: 30, fee: 0, need_checkin: true, description: ''
    })
  }
  dialogVisible.value = true
}

const saveEvent = async () => {
  await formRef.value.validate()
  try {
    if (form.id) {
      await api.put(`/events/events/${form.id}/`, form)
      ElMessage.success('更新成功')
    } else {
      await api.post('/events/events/', form)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadEvents()
  } catch (e) {
    ElMessage.error('保存失败')
  }
}

const deleteEvent = async (row) => {
  await ElMessageBox.confirm('确定要删除这个活动吗？', '提示', { type: 'warning' })
  try {
    await api.delete(`/events/events/${row.id}/`)
    ElMessage.success('删除成功')
    loadEvents()
  } catch (e) {
    ElMessage.error('删除失败')
  }
}

const viewRegistrations = async (row) => {
  currentEvent.value = row
  regLoading.value = true
  try {
    const { data } = await api.get(`/events/events/${row.id}/registrations/`)
    registrations.value = data.results || data
    registDialogVisible.value = true
  } finally {
    regLoading.value = false
  }
}

const checkIn = async (row) => {
  try {
    await api.post(`/events/registrations/${row.id}/check_in/`)
    ElMessage.success('签到成功')
    viewRegistrations(currentEvent.value)
  } catch (e) {
    ElMessage.error('签到失败')
  }
}

onMounted(() => {
  loadEvents()
  loadTypes()
})
</script>

<style lang="scss" scoped>
.admin-events {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    
    .header-actions {
      display: flex;
      align-items: center;
    }
  }
  
  .pagination {
    margin-top: 20px;
    text-align: right;
  }
}
</style>
