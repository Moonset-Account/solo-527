<template>
  <div class="dashboard">
    <div class="board-header">
      <h2>今日待办事项</h2>
      <el-button type="primary" @click="loadBoardData" :loading="loading">
        <el-icon><Refresh /></el-icon>
        刷新
      </el-button>
    </div>
    
    <div class="kanban-board">
      <div class="kanban-column" v-for="column in columns" :key="column.key">
        <div class="column-header" :class="column.key">
          <span class="column-title">{{ column.title }}</span>
          <el-tag :type="column.tagType" size="small" class="count-badge">
            {{ boardData[column.key]?.length || 0 }}
          </el-tag>
        </div>
        <div class="column-content">
          <div
            class="task-card"
            v-for="task in boardData[column.key]"
            :key="task.id"
            @click="handleTaskClick(task)"
          >
            <div class="task-priority" :class="`priority-${task.priority}`"></div>
            <div class="task-content">
              <div class="task-title">{{ task.title }}</div>
              <div class="task-meta">
                <el-tag size="mini" :type="getTaskTypeTag(task.task_type)">
                  {{ getTaskTypeText(task.task_type) }}
                </el-tag>
                <span class="task-time">{{ formatTime(task.created_at) }}</span>
              </div>
              <div class="task-notes" v-if="task.notes">
                <el-icon size="12"><ChatDotRound /></el-icon>
                {{ task.notes }}
              </div>
            </div>
          </div>
          <el-empty v-if="!boardData[column.key]?.length" :description="'暂无任务'" :image-size="60" />
        </div>
      </div>
    </div>

    <el-dialog v-model="taskDetailVisible" title="任务详情" width="500px">
      <el-descriptions :column="1" border v-if="currentTask">
        <el-descriptions-item label="任务标题">{{ currentTask.title }}</el-descriptions-item>
        <el-descriptions-item label="任务类型">
          <el-tag :type="getTaskTypeTag(currentTask.task_type)">
            {{ getTaskTypeText(currentTask.task_type) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="当前状态">
          <el-tag :type="getStatusTag(currentTask.status)">
            {{ getStatusText(currentTask.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="优先级">
          <el-tag :type="getPriorityTag(currentTask.priority)">
            {{ getPriorityText(currentTask.priority) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatTime(currentTask.created_at) }}</el-descriptions-item>
        <el-descriptions-item label="备注" v-if="currentTask.notes">
          {{ currentTask.notes }}
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="taskDetailVisible = false">关闭</el-button>
          <template v-if="userStore.isCoach">
            <el-select
              v-model="newStatus"
              placeholder="更改状态"
              size="small"
              style="width: 140px"
            >
              <el-option label="新建" value="new" />
              <el-option label="待确认" value="pending_confirm" />
              <el-option label="执行中" value="in_progress" />
              <el-option label="异常复核" value="exception_review" />
              <el-option label="已归档" value="archived" />
            </el-select>
            <el-button type="primary" @click="updateTaskStatus" :loading="updating">
              更新状态
            </el-button>
          </template>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import request from '@/utils/request'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

const userStore = useUserStore()
const loading = ref(false)
const boardData = reactive({
  new: [],
  pending_confirm: [],
  in_progress: [],
  exception_review: [],
  archived: []
})

const columns = [
  { key: 'new', title: '新建', tagType: 'info' },
  { key: 'pending_confirm', title: '待确认', tagType: 'warning' },
  { key: 'in_progress', title: '执行中', tagType: 'primary' },
  { key: 'exception_review', title: '异常复核', tagType: 'danger' },
  { key: 'archived', title: '已归档', tagType: 'success' }
]

const taskDetailVisible = ref(false)
const currentTask = ref(null)
const newStatus = ref('')
const updating = ref(false)

const loadBoardData = async () => {
  loading.value = true
  try {
    const data = await request.get('/tasks/board')
    boardData.new = data.new
    boardData.pending_confirm = data.pending_confirm
    boardData.in_progress = data.in_progress
    boardData.exception_review = data.exception_review
    boardData.archived = data.archived
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const handleTaskClick = (task) => {
  currentTask.value = task
  newStatus.value = task.status
  taskDetailVisible.value = true
}

const updateTaskStatus = async () => {
  if (!newStatus.value || !currentTask.value) return
  updating.value = true
  try {
    await request.patch(`/tasks/${currentTask.value.id}`, {
      status: newStatus.value
    })
    ElMessage.success('状态更新成功')
    taskDetailVisible.value = false
    loadBoardData()
  } catch (error) {
    console.error(error)
  } finally {
    updating.value = false
  }
}

const getTaskTypeText = (type) => {
  const map = {
    training_plan: '训练计划',
    checkin: '打卡审核',
    activity_signup: '活动报名',
    pace_feedback: '配速反馈',
    injury_report: '伤病报告'
  }
  return map[type] || type
}

const getTaskTypeTag = (type) => {
  const map = {
    training_plan: '',
    checkin: 'success',
    activity_signup: 'warning',
    pace_feedback: 'info',
    injury_report: 'danger'
  }
  return map[type] || 'info'
}

const getStatusText = (status) => {
  const map = {
    new: '新建',
    pending_confirm: '待确认',
    in_progress: '执行中',
    exception_review: '异常复核',
    archived: '已归档'
  }
  return map[status] || status
}

const getStatusTag = (status) => {
  const map = {
    new: 'info',
    pending_confirm: 'warning',
    in_progress: 'primary',
    exception_review: 'danger',
    archived: 'success'
  }
  return map[status] || 'info'
}

const getPriorityText = (priority) => {
  const map = {
    0: '普通',
    1: '中等',
    2: '重要',
    3: '紧急'
  }
  return map[priority] || '普通'
}

const getPriorityTag = (priority) => {
  const map = {
    0: 'info',
    1: '',
    2: 'warning',
    3: 'danger'
  }
  return map[priority] || 'info'
}

const formatTime = (time) => {
  return dayjs(time).format('MM-DD HH:mm')
}

onMounted(() => {
  loadBoardData()
})
</script>

<style scoped>
.dashboard {
  height: 100%;
}

.board-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.board-header h2 {
  font-size: 20px;
  color: #303133;
  margin: 0;
}

.kanban-board {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
  height: calc(100vh - 180px);
}

.kanban-column {
  background: #fff;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.column-header {
  padding: 16px;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #303133;
}

.column-header.new {
  background: #f4f4f5;
}

.column-header.pending_confirm {
  background: #fdf6ec;
}

.column-header.in_progress {
  background: #ecf5ff;
}

.column-header.exception_review {
  background: #fef0f0;
}

.column-header.archived {
  background: #f0f9eb;
}

.column-content {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
}

.task-card {
  background: #fafafa;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  gap: 10px;
}

.task-card:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.task-priority {
  width: 4px;
  border-radius: 2px;
  flex-shrink: 0;
}

.priority-0 {
  background: #909399;
}

.priority-1 {
  background: #409eff;
}

.priority-2 {
  background: #e6a23c;
}

.priority-3 {
  background: #f56c6c;
}

.task-content {
  flex: 1;
  min-width: 0;
}

.task-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 8px;
  line-height: 1.4;
  word-break: break-all;
}

.task-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #909399;
  margin-bottom: 6px;
}

.task-time {
  font-size: 11px;
}

.task-notes {
  font-size: 12px;
  color: #606266;
  display: flex;
  align-items: center;
  gap: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.count-badge {
  font-weight: normal;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
}
</style>
