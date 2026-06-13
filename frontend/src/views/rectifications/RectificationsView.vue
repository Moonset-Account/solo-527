<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">整改管理</h2>
      <el-button type="primary" :icon="Plus" @click="openCreateDialog">新增整改</el-button>
    </div>

    <el-row :gutter="16" style="margin-bottom: 20px">
      <el-col :span="4">
        <div class="stat-card">
          <div class="label">全部</div>
          <div class="value">{{ stats.total || 0 }}</div>
        </div>
      </el-col>
      <el-col :span="4">
        <div class="stat-card">
          <div class="label">待处理</div>
          <div class="value" style="color: #e6a23c">{{ stats.byStatus?.pending || 0 }}</div>
        </div>
      </el-col>
      <el-col :span="4">
        <div class="stat-card">
          <div class="label">处理中</div>
          <div class="value" style="color: #409eff">{{ stats.byStatus?.inProgress || 0 }}</div>
        </div>
      </el-col>
      <el-col :span="4">
        <div class="stat-card">
          <div class="label">已解决</div>
          <div class="value" style="color: #67c23a">{{ stats.byStatus?.resolved || 0 }}</div>
        </div>
      </el-col>
      <el-col :span="4">
        <div class="stat-card">
          <div class="label">已关闭</div>
          <div class="value" style="color: #909399">{{ stats.byStatus?.closed || 0 }}</div>
        </div>
      </el-col>
      <el-col :span="4">
        <div class="stat-card">
          <div class="label">已逾期</div>
          <div class="value" style="color: #f56c6c">{{ stats.overdue?.unclosed || 0 }}</div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-bottom: 20px">
      <el-col :span="12">
        <div class="stat-card">
          <div class="label">闭环完成率</div>
          <div class="value" style="color: #67c23a">{{ stats.closedLoop?.rate || 0 }}%</div>
          <div class="sub-info">
            闭环: {{ stats.closedLoop?.total || 0 }} / 未闭环: {{ stats.closedLoop?.notClosed || 0 }}
          </div>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="stat-card">
          <div class="label">逾期未闭环</div>
          <div class="value" style="color: #f56c6c">{{ stats.overdue?.unclosed || 0 }} 项</div>
          <div class="sub-info">需重点关注</div>
        </div>
      </el-col>
    </el-row>

    <div class="filter-bar">
      <el-select v-model="filters.status" placeholder="状态" clearable style="width: 140px" @change="loadData">
        <el-option label="待处理" value="pending" />
        <el-option label="处理中" value="in_progress" />
        <el-option label="已解决" value="resolved" />
        <el-option label="已关闭" value="closed" />
        <el-option label="已逾期" value="overdue" />
      </el-select>
      <el-select v-model="filters.level" placeholder="级别" clearable style="width: 140px" @change="loadData">
        <el-option label="低" value="low" />
        <el-option label="中" value="medium" />
        <el-option label="高" value="high" />
        <el-option label="紧急" value="critical" />
      </el-select>
      <el-button type="primary" @click="loadData">查询</el-button>
      <el-button @click="resetFilters">重置</el-button>
    </div>

    <el-card>
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="title" label="标题" min-width="180" show-overflow-tooltip />
        <el-table-column prop="level" label="级别" width="90">
          <template #default="{ row }">
            <el-tag size="small" :type="levelTagMap[row.level]">{{ levelMap[row.level] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="getStatusTag(row)">{{ statusMap[row.status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="deadline" label="截止日期" width="120">
          <template #default="{ row }">
            <span :style="{ color: isOverdue(row) ? '#f56c6c' : '' }">
              {{ formatDate(row.deadline) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="assignee.fullName" label="负责人" width="100">
          <template #default="{ row }">{{ row.assignee?.fullName || '-' }}</template>
        </el-table-column>
        <el-table-column prop="creator.fullName" label="创建人" width="100" />
        <el-table-column prop="isClosedLoop" label="闭环" width="80">
          <template #default="{ row }">
            <el-tag v-if="row.isClosedLoop" type="success" size="small">是</el-tag>
            <el-tag v-else type="info" size="small">否</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewDetail(row)">详情</el-button>
            <el-button type="success" link size="small" v-if="row.status !== 'closed'" @click="handleClose(row)">闭环</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div style="margin-top: 16px; text-align: right">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :total="pagination.total"
          layout="total, prev, pager, next, jumper"
          @current-change="loadData"
        />
      </div>
    </el-card>

    <el-dialog v-model="detailVisible" title="整改详情" width="700px">
      <el-descriptions :column="2" border v-if="currentRecord">
        <el-descriptions-item label="标题" :span="2">{{ currentRecord.title }}</el-descriptions-item>
        <el-descriptions-item label="级别">
          <el-tag size="small" :type="levelTagMap[currentRecord.level]">
            {{ levelMap[currentRecord.level] }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag size="small" :type="statusTagMap[currentRecord.status]">
            {{ statusMap[currentRecord.status] }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="门店">{{ currentRecord.store?.name }}</el-descriptions-item>
        <el-descriptions-item label="截止日期">
          <span :style="{ color: isOverdue(currentRecord) ? '#f56c6c' : '' }">
            {{ formatDate(currentRecord.deadline) }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="创建人">{{ currentRecord.creator?.fullName }}</el-descriptions-item>
        <el-descriptions-item label="负责人">{{ currentRecord.assignee?.fullName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="是否闭环">
          <el-tag v-if="currentRecord.isClosedLoop" type="success" size="small">是</el-tag>
          <el-tag v-else type="info" size="small">否</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="描述" :span="2">{{ currentRecord.description }}</el-descriptions-item>
        <el-descriptions-item label="处理结果" :span="2">
          {{ currentRecord.handlingResult || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">
          {{ currentRecord.remark || '-' }}
        </el-descriptions-item>
      </el-descriptions>

      <el-divider content-position="left">处理备注</el-divider>
      <div class="notes-section">
        <div v-for="note in currentRecord?.notes || []" :key="note.id" class="note-item">
          <div class="note-header">
            <span class="note-user">{{ note.creator?.fullName }}</span>
            <span class="note-time">{{ formatDateTime(note.createdAt) }}</span>
          </div>
          <div class="note-content">{{ note.content }}</div>
        </div>
        <div v-if="!currentRecord?.notes?.length" style="color: #909399; text-align: center; padding: 20px">
          暂无备注
        </div>
      </div>

      <div style="margin-top: 16px">
        <el-input
          v-model="newNote"
          type="textarea"
          :rows="2"
          placeholder="添加备注..."
          maxlength="500"
          show-word-limit
        />
        <div style="text-align: right; margin-top: 8px">
          <el-button type="primary" size="small" @click="addNote">添加备注</el-button>
        </div>
      </div>
    </el-dialog>

    <el-dialog v-model="closeDialogVisible" title="整改闭环" width="500px">
      <el-form :model="closeForm" label-width="100px">
        <el-form-item label="处理结果" required>
          <el-input v-model="closeForm.handlingResult" type="textarea" :rows="4" placeholder="请描述处理结果" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="closeForm.remark" type="textarea" :rows="2" placeholder="可选" />
        </el-form-item>
        <el-form-item label="确认闭环">
          <el-switch v-model="closeForm.isClosedLoop" active-text="是" inactive-text="否" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitClose">确认闭环</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import api from '@/utils/api'
import dayjs from 'dayjs'

const loading = ref(false)
const detailVisible = ref(false)
const closeDialogVisible = ref(false)
const currentRecord = ref(null)
const currentCloseId = ref(null)
const newNote = ref('')

const list = ref([])
const stats = ref({})

const filters = reactive({
  status: '',
  level: ''
})

const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0
})

const closeForm = reactive({
  handlingResult: '',
  remark: '',
  isClosedLoop: true
})

const levelMap = {
  low: '低',
  medium: '中',
  high: '高',
  critical: '紧急'
}

const levelTagMap = {
  low: 'info',
  medium: 'warning',
  high: 'danger',
  critical: 'danger'
}

const statusMap = {
  pending: '待处理',
  in_progress: '处理中',
  resolved: '已解决',
  closed: '已关闭',
  overdue: '已逾期'
}

const statusTagMap = {
  pending: 'warning',
  in_progress: 'primary',
  resolved: 'success',
  closed: 'info',
  overdue: 'danger'
}

const formatDate = (d) => d ? dayjs(d).format('YYYY-MM-DD') : '-'
const formatDateTime = (dt) => dt ? dayjs(dt).format('YYYY-MM-DD HH:mm') : '-'

const isOverdue = (row) => {
  if (!row.deadline) return false
  if (row.status === 'closed') return false
  return dayjs(row.deadline).isBefore(dayjs())
}

const getStatusTag = (row) => {
  if (isOverdue(row) && row.status !== 'closed') return 'danger'
  return statusTagMap[row.status] || 'info'
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await api.get('/rectifications', {
      params: {
        page: pagination.page,
        limit: pagination.limit,
        status: filters.status || undefined,
        level: filters.level || undefined
      }
    })
    list.value = res.data || []
    pagination.total = res.meta?.total || 0
  } finally {
    loading.value = false
  }
}

const loadStats = async () => {
  try {
    const res = await api.get('/rectifications/statistics/summary')
    stats.value = res
  } catch (e) {}
}

const viewDetail = async (row) => {
  try {
    const res = await api.get(`/rectifications/${row.id}`)
    currentRecord.value = res
    detailVisible.value = true
  } catch (e) {}
}

const handleClose = (row) => {
  currentCloseId.value = row.id
  closeForm.handlingResult = ''
  closeForm.remark = ''
  closeForm.isClosedLoop = true
  closeDialogVisible.value = true
}

const submitClose = async () => {
  if (!closeForm.handlingResult) {
    ElMessage.warning('请填写处理结果')
    return
  }
  try {
    await api.post(`/rectifications/${currentCloseId.value}/close`, closeForm)
    ElMessage.success('闭环成功')
    closeDialogVisible.value = false
    loadData()
    loadStats()
  } catch (e) {}
}

const addNote = async () => {
  if (!newNote.value.trim()) {
    ElMessage.warning('请输入备注内容')
    return
  }
  try {
    await api.put(`/rectifications/${currentRecord.value.id}`, {
      note: newNote.value
    })
    ElMessage.success('备注添加成功')
    newNote.value = ''
    viewDetail({ id: currentRecord.value.id })
    loadStats()
  } catch (e) {}
}

const resetFilters = () => {
  filters.status = ''
  filters.level = ''
  pagination.page = 1
  loadData()
}

const openCreateDialog = () => {
  ElMessage.info('请在详情页操作')
}

onMounted(() => {
  loadData()
  loadStats()
})
</script>

<style scoped>
.stat-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.06);
}

.stat-card .label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-card .value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
}

.stat-card .sub-info {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.notes-section {
  max-height: 300px;
  overflow-y: auto;
}

.note-item {
  padding: 12px;
  background: #f5f7fa;
  border-radius: 6px;
  margin-bottom: 8px;
}

.note-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}

.note-user {
  font-weight: 500;
  color: #303133;
}

.note-time {
  font-size: 12px;
  color: #909399;
}

.note-content {
  color: #606266;
  line-height: 1.5;
}
</style>
