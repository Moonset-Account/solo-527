<template>
  <div class="todo-list">
    <el-card>
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="按负责人分组" name="group">
          <div class="group-list">
            <el-row :gutter="20">
              <el-col :span="8" v-for="group in groupData" :key="group.assigneeId">
                <el-card class="group-card" shadow="hover">
                  <template #header>
                    <div class="card-header">
                      <span class="assignee-name">{{ group.assigneeName }}</span>
                      <el-tag type="info">共{{ group.totalCount }}项</el-tag>
                    </div>
                  </template>
                  <div class="stat-row">
                    <div class="stat-item">
                      <span class="stat-label">待处理</span>
                      <span class="stat-value warning">{{ group.pendingCount }}</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-label">处理中</span>
                      <span class="stat-value primary">{{ group.processingCount }}</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-label">已完成</span>
                      <span class="stat-value success">{{ group.completedCount }}</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-label">已取消</span>
                      <span class="stat-value danger">{{ group.cancelledCount }}</span>
                    </div>
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </el-tab-pane>

        <el-tab-pane label="我的待办" name="my">
          <div class="search-form">
            <el-form :inline="true" :model="searchForm">
              <el-form-item label="状态">
                <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
                  <el-option label="待处理" :value="0" />
                  <el-option label="处理中" :value="1" />
                  <el-option label="已完成" :value="2" />
                  <el-option label="已取消" :value="3" />
                </el-select>
              </el-form-item>
              <el-form-item label="类型">
                <el-select v-model="searchForm.type" placeholder="请选择类型" clearable>
                  <el-option label="巡检" value="inspection" />
                  <el-option label="维修" value="repair" />
                  <el-option label="其他" value="other" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="handleSearch">查询</el-button>
                <el-button @click="handleReset">重置</el-button>
              </el-form-item>
            </el-form>
          </div>

          <div class="toolbar">
            <el-button type="primary" @click="handleCreate">新建待办</el-button>
          </div>

          <el-table :data="myTaskData" border stripe>
            <el-table-column prop="taskNo" label="任务编号" width="140" />
            <el-table-column prop="title" label="标题" width="180" />
            <el-table-column prop="type" label="类型" width="100">
              <template #default="{ row }">
                {{ getTypeText(row.type) }}
              </template>
            </el-table-column>
            <el-table-column prop="priority" label="优先级" width="80">
              <template #default="{ row }">
                <el-tag :type="getPriorityType(row.priority)">{{ getPriorityText(row.priority) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="dueTime" label="截止时间" width="180">
              <template #default="{ row }">
                {{ formatDate(row.dueTime) }}
              </template>
            </el-table-column>
            <el-table-column prop="content" label="内容" show-overflow-tooltip />
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button v-if="row.status === 0 || row.status === 1" type="success" link @click="handleComplete(row)">完成</el-button>
                <el-button v-if="row.status === 0 || row.status === 1" type="danger" link @click="handleCancel(row)">取消</el-button>
                <el-button type="primary" link @click="handleView(row)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-pagination
            class="pagination"
            v-model:current-page="myPagination.pageNum"
            v-model:page-size="myPagination.pageSize"
            :total="myPagination.total"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="fetchMyTasks"
            @current-change="fetchMyTasks"
          />
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-dialog v-model="createDialogVisible" title="新建待办" width="600px">
      <el-form :model="createForm" :rules="createRules" ref="createFormRef" label-width="100px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="createForm.title" placeholder="请输入标题" />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="createForm.type" placeholder="请选择类型" style="width: 100%">
            <el-option label="巡检" value="inspection" />
            <el-option label="维修" value="repair" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="负责人ID" prop="assigneeId">
          <el-input v-model="createForm.assigneeId" placeholder="请输入负责人ID" />
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-select v-model="createForm.priority" placeholder="请选择优先级" style="width: 100%">
            <el-option label="低" :value="1" />
            <el-option label="中" :value="2" />
            <el-option label="高" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="截止时间" prop="dueTime">
          <el-date-picker
            v-model="createForm.dueTime"
            type="datetime"
            placeholder="选择截止时间"
            style="width: 100%"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input v-model="createForm.content" type="textarea" :rows="3" placeholder="请输入内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleCreateSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="viewDialogVisible" title="待办详情" width="600px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="任务编号">{{ detailData.taskNo }}</el-descriptions-item>
        <el-descriptions-item label="标题">{{ detailData.title }}</el-descriptions-item>
        <el-descriptions-item label="类型">{{ getTypeText(detailData.type) }}</el-descriptions-item>
        <el-descriptions-item label="优先级">
          <el-tag :type="getPriorityType(detailData.priority)">{{ getPriorityText(detailData.priority) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(detailData.status)">{{ getStatusText(detailData.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="业务ID">{{ detailData.bizId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="截止时间" :span="2">{{ formatDate(detailData.dueTime) }}</el-descriptions-item>
        <el-descriptions-item label="完成时间" :span="2">{{ formatDate(detailData.finishTime) }}</el-descriptions-item>
        <el-descriptions-item label="内容" :span="2">{{ detailData.content }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ detailData.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <el-dialog v-model="completeDialogVisible" title="完成任务" width="500px">
      <el-form :model="completeForm" label-width="80px">
        <el-form-item label="备注">
          <el-input v-model="completeForm.remark" type="textarea" :rows="3" placeholder="请输入完成备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="completeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleCompleteSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="cancelDialogVisible" title="取消任务" width="500px">
      <el-form :model="cancelForm" label-width="80px">
        <el-form-item label="原因">
          <el-input v-model="cancelForm.remark" type="textarea" :rows="3" placeholder="请输入取消原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cancelDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="handleCancelSubmit">确定取消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getMyTodoList, getTodoGroupByAssignee, getTodoById, createTodo, completeTodo, cancelTodo } from '@/api/todo'

const activeTab = ref('group')

const searchForm = reactive({
  status: null,
  type: ''
})

const myPagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0
})

const groupData = ref([])
const myTaskData = ref([])
const createDialogVisible = ref(false)
const viewDialogVisible = ref(false)
const completeDialogVisible = ref(false)
const cancelDialogVisible = ref(false)
const createFormRef = ref(null)
const currentId = ref(null)
const detailData = ref({})
const completeForm = reactive({ remark: '' })
const cancelForm = reactive({ remark: '' })

const createForm = reactive({
  title: '',
  type: 'other',
  assigneeId: '',
  priority: 2,
  dueTime: '',
  content: ''
})

const createRules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  assigneeId: [{ required: true, message: '请输入负责人ID', trigger: 'blur' }],
  priority: [{ required: true, message: '请选择优先级', trigger: 'change' }]
}

const getTypeText = (type) => {
  const map = { inspection: '巡检', repair: '维修', other: '其他' }
  return map[type] || type
}

const getStatusType = (status) => {
  const map = { 0: 'warning', 1: 'primary', 2: 'success', 3: 'danger' }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = { 0: '待处理', 1: '处理中', 2: '已完成', 3: '已取消' }
  return map[status] || '未知'
}

const getPriorityType = (priority) => {
  const map = { 1: 'info', 2: 'warning', 3: 'danger' }
  return map[priority] || 'info'
}

const getPriorityText = (priority) => {
  const map = { 1: '低', 2: '中', 3: '高' }
  return map[priority] || '未知'
}

const formatDate = (date) => {
  if (!date) return '-'
  return date
}

const handleTabChange = (tab) => {
  if (tab === 'group') {
    fetchGroupData()
  } else {
    fetchMyTasks()
  }
}

const fetchGroupData = async () => {
  try {
    const res = await getTodoGroupByAssignee()
    groupData.value = res
  } catch (error) {
    console.error('获取分组数据失败:', error)
  }
}

const fetchMyTasks = async () => {
  try {
    const params = {
      pageNum: myPagination.pageNum,
      pageSize: myPagination.pageSize
    }
    if (searchForm.status !== null && searchForm.status !== '') params.status = searchForm.status
    if (searchForm.type) params.type = searchForm.type
    const res = await getMyTodoList(params)
    myTaskData.value = res.records
    myPagination.total = res.total
  } catch (error) {
    console.error('获取我的待办失败:', error)
  }
}

const handleSearch = () => {
  myPagination.pageNum = 1
  fetchMyTasks()
}

const handleReset = () => {
  searchForm.status = null
  searchForm.type = ''
  handleSearch()
}

const handleCreate = () => {
  Object.assign(createForm, {
    title: '',
    type: 'other',
    assigneeId: '',
    priority: 2,
    dueTime: '',
    content: ''
  })
  createDialogVisible.value = true
}

const handleCreateSubmit = async () => {
  if (!createFormRef.value) return
  await createFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await createTodo(createForm)
        ElMessage.success('创建成功')
        createDialogVisible.value = false
        if (activeTab.value === 'group') {
          fetchGroupData()
        } else {
          fetchMyTasks()
        }
      } catch (error) {
        console.error('创建失败:', error)
      }
    }
  })
}

const handleView = async (row) => {
  try {
    const res = await getTodoById(row.id)
    detailData.value = res
    viewDialogVisible.value = true
  } catch (error) {
    console.error('获取详情失败:', error)
  }
}

const handleComplete = (row) => {
  currentId.value = row.id
  completeForm.remark = ''
  completeDialogVisible.value = true
}

const handleCompleteSubmit = async () => {
  try {
    await completeTodo(currentId.value, completeForm.remark)
    ElMessage.success('任务已完成')
    completeDialogVisible.value = false
    fetchMyTasks()
  } catch (error) {
    console.error('完成任务失败:', error)
  }
}

const handleCancel = (row) => {
  currentId.value = row.id
  cancelForm.remark = ''
  cancelDialogVisible.value = true
}

const handleCancelSubmit = async () => {
  try {
    await cancelTodo(currentId.value, cancelForm.remark)
    ElMessage.success('任务已取消')
    cancelDialogVisible.value = false
    fetchMyTasks()
  } catch (error) {
    console.error('取消任务失败:', error)
  }
}

onMounted(() => {
  fetchGroupData()
})
</script>

<style scoped>
.todo-list {
  padding: 20px;
}

.group-list {
  margin-top: 20px;
}

.group-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.assignee-name {
  font-size: 16px;
  font-weight: bold;
}

.stat-row {
  display: flex;
  justify-content: space-between;
}

.stat-item {
  text-align: center;
  flex: 1;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #909399;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
}

.stat-value.warning {
  color: #e6a23c;
}

.stat-value.primary {
  color: #409eff;
}

.stat-value.success {
  color: #67c23a;
}

.stat-value.danger {
  color: #f56c6c;
}

.search-form {
  margin-bottom: 20px;
}

.toolbar {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
