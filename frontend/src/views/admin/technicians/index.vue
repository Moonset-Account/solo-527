<template>
  <div class="technicians-page">
    <el-card class="filter-card">
      <el-form :inline="true" :model="filterForm">
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="在职" value="active" />
            <el-option label="离职" value="inactive" />
            <el-option label="休息" value="rest" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadTechnicians">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card>
      <template #header>
        <div class="card-header">
          <span>技师列表</span>
          <el-button type="primary" @click="handleAdd">新增技师</el-button>
        </div>
      </template>

      <el-table :data="technicians" v-loading="loading" stripe>
        <el-table-column label="头像" width="80">
          <template #default="{ row }">
            <el-avatar :size="48" :src="row.avatar">
              {{ row.name?.charAt(0) }}
            </el-avatar>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column prop="position" label="职位" width="100" />
        <el-table-column label="擅长技能" min-width="200">
          <template #default="{ row }">
            <el-tag v-for="skill in row.skills" :key="skill" size="small" style="margin-right: 4px">
              {{ skill }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="工作时间" width="140">
          <template #default="{ row }">
            {{ row.workStartTime || '09:00' }} - {{ row.workEndTime || '18:00' }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
              {{ statusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" text @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" size="small" text @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
      <el-form :model="techForm" label-width="100px">
        <el-form-item label="姓名" required>
          <el-input v-model="techForm.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="techForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="头像">
          <el-upload
            :auto-upload="false"
            :show-file-list="false"
            :on-change="handleAvatarChange"
          >
            <el-avatar :size="80" :src="techForm.avatar">
              {{ techForm.name?.charAt(0) || '?' }}
            </el-avatar>
          </el-upload>
        </el-form-item>
        <el-form-item label="职位">
          <el-input v-model="techForm.position" placeholder="请输入职位" />
        </el-form-item>
        <el-form-item label="简介">
          <el-input
            v-model="techForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入简介"
          />
        </el-form-item>
        <el-form-item label="擅长技能">
          <el-select
            v-model="techForm.skills"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="输入技能名称回车添加"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="服务项目">
          <el-select
            v-model="techForm.serviceIds"
            multiple
            placeholder="请选择服务项目"
            style="width: 100%"
          >
            <el-option
              v-for="service in services"
              :key="service._id"
              :label="service.name"
              :value="service._id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="工作时间">
          <el-time-picker
            v-model="techForm.workStartTime"
            format="HH:mm"
            value-format="HH:mm"
            placeholder="上班时间"
            style="width: 140px"
          />
          <span style="margin: 0 8px">-</span>
          <el-time-picker
            v-model="techForm.workEndTime"
            format="HH:mm"
            value-format="HH:mm"
            placeholder="下班时间"
            style="width: 140px"
          />
        </el-form-item>
        <el-form-item label="工作日">
          <el-checkbox-group v-model="techForm.workDays">
            <el-checkbox :value="1">周一</el-checkbox>
            <el-checkbox :value="2">周二</el-checkbox>
            <el-checkbox :value="3">周三</el-checkbox>
            <el-checkbox :value="4">周四</el-checkbox>
            <el-checkbox :value="5">周五</el-checkbox>
            <el-checkbox :value="6">周六</el-checkbox>
            <el-checkbox :value="0">周日</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="techForm.status">
            <el-radio value="active">在职</el-radio>
            <el-radio value="inactive">离职</el-radio>
            <el-radio value="rest">休息</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="techForm.sort" :min="0" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getTechnicians,
  createTechnician,
  updateTechnician,
  deleteTechnician,
} from '@/api/technicians'
import { getActiveServices } from '@/api/services'

const loading = ref(false)
const technicians = ref([])
const services = ref([])
const dialogVisible = ref(false)
const dialogTitle = ref('新增技师')
const submitting = ref(false)
const editingId = ref('')

const filterForm = reactive({
  status: '',
})

const techForm = reactive({
  name: '',
  phone: '',
  avatar: '',
  position: '',
  description: '',
  skills: [],
  serviceIds: [],
  workStartTime: '09:00',
  workEndTime: '18:00',
  workDays: [1, 2, 3, 4, 5],
  status: 'active',
  sort: 0,
})

function statusText(status) {
  const map = {
    active: '在职',
    inactive: '离职',
    rest: '休息',
  }
  return map[status] || status
}

async function loadTechnicians() {
  loading.value = true
  try {
    const params = {}
    if (filterForm.status) params.status = filterForm.status
    const data = await getTechnicians(params)
    technicians.value = data
  } catch (e) {
    // 错误已处理
  } finally {
    loading.value = false
  }
}

async function loadServices() {
  try {
    const data = await getActiveServices()
    services.value = data
  } catch (e) {}
}

function resetFilter() {
  filterForm.status = ''
  loadTechnicians()
}

function handleAdd() {
  dialogTitle.value = '新增技师'
  editingId.value = ''
  techForm.name = ''
  techForm.phone = ''
  techForm.avatar = ''
  techForm.position = ''
  techForm.description = ''
  techForm.skills = []
  techForm.serviceIds = []
  techForm.workStartTime = '09:00'
  techForm.workEndTime = '18:00'
  techForm.workDays = [1, 2, 3, 4, 5]
  techForm.status = 'active'
  techForm.sort = 0
  dialogVisible.value = true
}

function handleEdit(row) {
  dialogTitle.value = '编辑技师'
  editingId.value = row._id
  techForm.name = row.name
  techForm.phone = row.phone || ''
  techForm.avatar = row.avatar || ''
  techForm.position = row.position || ''
  techForm.description = row.description || ''
  techForm.skills = row.skills || []
  techForm.serviceIds = row.serviceIds || []
  techForm.workStartTime = row.workStartTime || '09:00'
  techForm.workEndTime = row.workEndTime || '18:00'
  techForm.workDays = row.workDays || [1, 2, 3, 4, 5]
  techForm.status = row.status
  techForm.sort = row.sort || 0
  dialogVisible.value = true
}

async function handleSubmit() {
  if (!techForm.name) {
    ElMessage.warning('请输入姓名')
    return
  }

  submitting.value = true
  try {
    const data = { ...techForm }
    if (editingId.value) {
      await updateTechnician(editingId.value, data)
      ElMessage.success('更新成功')
    } else {
      await createTechnician(data)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadTechnicians()
  } catch (e) {
    // 错误已处理
  } finally {
    submitting.value = false
  }
}

function handleDelete(row) {
  ElMessageBox.confirm(`确定要删除「${row.name}」吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    try {
      await deleteTechnician(row._id)
      ElMessage.success('删除成功')
      loadTechnicians()
    } catch (e) {}
  }).catch(() => {})
}

function handleAvatarChange(file) {
  // 头像上传处理
  techForm.avatar = URL.createObjectURL(file.raw)
}

onMounted(() => {
  loadTechnicians()
  loadServices()
})
</script>

<style scoped lang="scss">
.technicians-page {
  .filter-card {
    margin-bottom: 20px;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}
</style>
