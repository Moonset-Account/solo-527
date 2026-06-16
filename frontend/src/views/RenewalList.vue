<template>
  <div class="renewal-list">
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-label">总数</div>
          <div class="stat-value primary">{{ stats.total || 0 }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-label">已转化</div>
          <div class="stat-value success">{{ stats.converted || 0 }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-label">跟进中</div>
          <div class="stat-value warning">{{ stats.following || 0 }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-label">转化率</div>
          <div class="stat-value info">{{ stats.conversionRate || '0' }}%</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable>
            <el-option label="待跟进" value="pending" />
            <el-option label="跟进中" value="following" />
            <el-option label="已转化" value="converted" />
            <el-option label="已流失" value="lost" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="searchForm.priority" placeholder="全部" clearable>
            <el-option label="高" value="high" />
            <el-option label="中" value="medium" />
            <el-option label="低" value="low" />
          </el-select>
        </el-form-item>
        <el-form-item label="跟进人">
          <el-select v-model="searchForm.followerId" placeholder="全部" clearable filterable>
            <el-option v-for="user in userOptions" :key="user.id" :label="user.name" :value="user.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <div class="table-header">
        <div class="header-left">
          <el-button type="primary" @click="handleAdd">新增</el-button>
          <el-button @click="showImportDialog = true">批量导入</el-button>
          <el-button @click="handleExport">导出</el-button>
          <el-button
            type="warning"
            :disabled="selectedIds.length === 0"
            @click="showAssignDialog = true"
          >
            分配跟进人
          </el-button>
        </div>
        <div class="header-right">
          <span>共 {{ total }} 条</span>
        </div>
      </div>

      <el-table
        :data="tableData"
        v-loading="loading"
        @selection-change="handleSelectionChange"
        style="width: 100%"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="customerName" label="客户名称" min-width="150" />
        <el-table-column prop="planName" label="套餐" width="120" />
        <el-table-column prop="expireDate" label="到期日" width="120">
          <template #default="{ row }">
            {{ formatDate(row.expireDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="priority" label="优先级" width="100">
          <template #default="{ row }">
            <el-tag :type="getPriorityType(row.priority)">
              {{ getPriorityText(row.priority) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="followerName" label="跟进人" width="100" />
        <el-table-column prop="lastFollowAt" label="最后跟进" width="180">
          <template #default="{ row }">
            {{ formatDate(row.lastFollowAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="openFollowDialog(row)">跟进</el-button>
            <el-button type="warning" link @click="handleEdit(row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <el-dialog v-model="showFormDialog" :title="editMode ? '编辑续费' : '新增续费'" width="500px">
      <el-form :model="form" :rules="formRules" ref="formRef" label-width="100px">
        <el-form-item label="客户名称" prop="customerName">
          <el-input v-model="form.customerName" placeholder="请输入客户名称" />
        </el-form-item>
        <el-form-item label="套餐" prop="planId">
          <el-select v-model="form.planId" placeholder="请选择套餐" style="width: 100%">
            <el-option v-for="plan in planOptions" :key="plan.id" :label="plan.name" :value="plan.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="到期日" prop="expireDate">
          <el-date-picker
            v-model="form.expireDate"
            type="date"
            placeholder="选择日期"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-radio-group v-model="form.priority">
            <el-radio label="high">高</el-radio>
            <el-radio label="medium">中</el-radio>
            <el-radio label="low">低</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="跟进人" prop="followerId">
          <el-select v-model="form.followerId" placeholder="请选择跟进人" style="width: 100%" filterable>
            <el-option v-for="user in userOptions" :key="user.id" :label="user.name" :value="user.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showFormDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showFollowDialogRef" title="跟进记录" width="500px">
      <el-timeline v-if="followRecords.length > 0">
        <el-timeline-item
          v-for="(record, index) in followRecords"
          :key="index"
          :timestamp="formatDate(record.createdAt)"
        >
          <div class="follow-item">
            <div class="follow-user">{{ record.userName || '跟进人' }}</div>
            <div class="follow-content">{{ record.content }}</div>
          </div>
        </el-timeline-item>
      </el-timeline>
      <div v-else class="empty-text">暂无跟进记录</div>
      <el-form :model="followForm" class="add-follow-form">
        <el-form-item>
          <el-input
            v-model="followForm.content"
            type="textarea"
            :rows="3"
            placeholder="添加跟进记录..."
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="followLoading" @click="handleAddFollow">
            添加
          </el-button>
        </el-form-item>
      </el-form>
    </el-dialog>

    <el-dialog v-model="showAssignDialog" title="分配跟进人" width="400px">
      <el-form label-width="80px">
        <el-form-item label="选中数量">
          <span>{{ selectedIds.length }} 条</span>
        </el-form-item>
        <el-form-item label="跟进人">
          <el-select v-model="assignFollowerId" placeholder="请选择" style="width: 100%" filterable>
            <el-option v-for="user in userOptions" :key="user.id" :label="user.name" :value="user.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAssignDialog = false">取消</el-button>
        <el-button type="primary" :loading="assignLoading" @click="handleAssign">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showImportDialog" title="批量导入" width="500px">
      <el-upload
        action="#"
        :auto-upload="false"
        :show-file-list="true"
        :on-change="handleFileChange"
        accept=".xlsx,.xls,.csv"
      >
        <el-button type="primary">选择文件</el-button>
        <template #tip>
          <div class="el-upload__tip">支持 xlsx、xls、csv 格式</div>
        </template>
      </el-upload>
      <template #footer>
        <el-button @click="showImportDialog = false">取消</el-button>
        <el-button type="primary" :loading="importLoading" @click="handleImport">
          导入
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getRenewalList, getRenewalStats, createRenewal, updateRenewal, followUpRenewal, assignRenewal, batchImportRenewals, exportRenewals } from '../api/renewal'
import { getPlanList } from '../api/plans'
import { getUserList } from '../api/users'

const loading = ref(false)
const submitLoading = ref(false)
const followLoading = ref(false)
const assignLoading = ref(false)
const importLoading = ref(false)
const showFormDialog = ref(false)
const showFollowDialogRef = ref(false)
const showAssignDialog = ref(false)
const showImportDialog = ref(false)
const editMode = ref(false)
const formRef = ref(null)
const currentRenewalId = ref(null)
const assignFollowerId = ref('')
const importFile = ref(null)

const tableData = ref([])
const total = ref(0)
const selectedIds = ref([])
const followRecords = ref([])
const userOptions = ref([])
const planOptions = ref([])

const stats = reactive({
  total: 0,
  converted: 0,
  following: 0,
  conversionRate: 0
})

const searchForm = reactive({
  status: '',
  priority: '',
  followerId: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10
})

const form = reactive({
  id: null,
  customerName: '',
  planId: '',
  expireDate: '',
  priority: 'medium',
  followerId: ''
})

const formRules = {
  customerName: [{ required: true, message: '请输入客户名称', trigger: 'blur' }],
  planId: [{ required: true, message: '请选择套餐', trigger: 'change' }],
  expireDate: [{ required: true, message: '请选择到期日', trigger: 'change' }],
  priority: [{ required: true, message: '请选择优先级', trigger: 'change' }]
}

const followForm = reactive({
  content: ''
})

const loadStats = async () => {
  try {
    const res = await getRenewalStats()
    const data = res.data || res
    Object.assign(stats, data)
  } catch (e) {
    console.error(e)
  }
}

const loadData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...searchForm
    }
    const res = await getRenewalList(params)
    const data = res.data || res
    tableData.value = data.list || data.data || []
    total.value = data.total || 0
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const loadUsers = async () => {
  try {
    const res = await getUserList({ pageSize: 100 })
    userOptions.value = res.data?.list || res.list || res.data || []
  } catch (e) {
    console.error(e)
  }
}

const loadPlans = async () => {
  try {
    const res = await getPlanList({ pageSize: 100 })
    planOptions.value = res.data?.list || res.list || res.data || []
  } catch (e) {
    console.error(e)
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadData()
  loadStats()
}

const handleReset = () => {
  searchForm.status = ''
  searchForm.priority = ''
  searchForm.followerId = ''
  pagination.page = 1
  loadData()
  loadStats()
}

const handlePageChange = (page) => {
  pagination.page = page
  loadData()
}

const handleSizeChange = (size) => {
  pagination.pageSize = size
  pagination.page = 1
  loadData()
}

const handleSelectionChange = (selection) => {
  selectedIds.value = selection.map(item => item.id)
}

const handleAdd = () => {
  editMode.value = false
  form.id = null
  form.customerName = ''
  form.planId = ''
  form.expireDate = ''
  form.priority = 'medium'
  form.followerId = ''
  showFormDialog.value = true
}

const handleEdit = (row) => {
  editMode.value = true
  form.id = row.id
  form.customerName = row.customerName
  form.planId = row.planId
  form.expireDate = row.expireDate
  form.priority = row.priority
  form.followerId = row.followerId
  showFormDialog.value = true
}

const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    submitLoading.value = true
    if (editMode.value) {
      await updateRenewal(form.id, form)
      ElMessage.success('编辑成功')
    } else {
      await createRenewal(form)
      ElMessage.success('新增成功')
    }
    showFormDialog.value = false
    loadData()
    loadStats()
  } catch (e) {
    if (e !== false) {
      console.error(e)
    }
  } finally {
    submitLoading.value = false
  }
}

const openFollowDialog = (row) => {
  currentRenewalId.value = row.id
  followRecords.value = row.followRecords || []
  followForm.content = ''
  showFollowDialogRef.value = true
}

const handleAddFollow = async () => {
  if (!followForm.content.trim()) {
    ElMessage.warning('请输入跟进内容')
    return
  }
  followLoading.value = true
  try {
    await followUpRenewal(currentRenewalId.value, followForm)
    ElMessage.success('添加成功')
    followForm.content = ''
    loadData()
  } catch (e) {
    console.error(e)
  } finally {
    followLoading.value = false
  }
}

const handleAssign = async () => {
  if (!assignFollowerId.value) {
    ElMessage.warning('请选择跟进人')
    return
  }
  assignLoading.value = true
  try {
    await Promise.all(
      selectedIds.value.map(id => assignRenewal(id, { followerId: assignFollowerId.value }))
    )
    ElMessage.success('分配成功')
    showAssignDialog.value = false
    loadData()
  } catch (e) {
    console.error(e)
  } finally {
    assignLoading.value = false
  }
}

const handleFileChange = (file) => {
  importFile.value = file.raw
}

const handleImport = async () => {
  if (!importFile.value) {
    ElMessage.warning('请选择文件')
    return
  }
  importLoading.value = true
  try {
    const formData = new FormData()
    formData.append('file', importFile.value)
    await batchImportRenewals(formData)
    ElMessage.success('导入成功')
    showImportDialog.value = false
    loadData()
    loadStats()
  } catch (e) {
    console.error(e)
  } finally {
    importLoading.value = false
  }
}

const handleExport = async () => {
  try {
    const res = await exportRenewals(searchForm)
    const blob = new Blob([res])
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `renewals_${Date.now()}.xlsx`
    link.click()
    URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (e) {
    console.error(e)
  }
}

const getStatusType = (status) => {
  const map = {
    pending: 'info',
    following: 'warning',
    converted: 'success',
    lost: 'danger'
  }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = {
    pending: '待跟进',
    following: '跟进中',
    converted: '已转化',
    lost: '已流失'
  }
  return map[status] || status || '-'
}

const getPriorityType = (priority) => {
  const map = {
    high: 'danger',
    medium: 'warning',
    low: 'info'
  }
  return map[priority] || 'info'
}

const getPriorityText = (priority) => {
  const map = {
    high: '高',
    medium: '中',
    low: '低'
  }
  return map[priority] || priority || '-'
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('zh-CN')
}

onMounted(() => {
  loadUsers()
  loadPlans()
  loadStats()
  loadData()
})
</script>

<style scoped>
.renewal-list {
  padding: 20px;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card .stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 10px;
}

.stat-card .stat-value {
  font-size: 28px;
  font-weight: bold;
}

.stat-value.primary {
  color: #409eff;
}

.stat-value.success {
  color: #67c23a;
}

.stat-value.warning {
  color: '#e6a23c';
}

.stat-value.info {
  color: #909399;
}

.search-card {
  margin-bottom: 20px;
}

.table-card .table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.table-card .header-left {
  display: flex;
  gap: 10px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.follow-item {
  padding: 5px 0;
}

.follow-user {
  font-weight: 500;
  color: #303133;
}

.follow-content {
  font-size: 13px;
  color: #606266;
  margin-top: 5px;
}

.empty-text {
  text-align: center;
  color: #909399;
  padding: 20px 0;
}

.add-follow-form {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}
</style>
