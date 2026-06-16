<template>
  <div class="requirement-detail" v-loading="loading">
    <el-card shadow="never" class="info-card">
      <template #header>
        <div class="info-header">
          <span>需求详情</span>
          <el-button
            v-if="requirement.status !== 'COMPLETED'"
            type="success"
            @click="completeVisible = true"
          >完成需求</el-button>
        </div>
      </template>
      <el-descriptions :column="3" border>
        <el-descriptions-item label="标题" :span="3">{{ requirement.title }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusTagType" size="small">{{ statusLabel[requirement.status] || requirement.status }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="优先级">
          <el-tag :type="priorityTagType" size="small">{{ priorityLabel[requirement.priority] || requirement.priority }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="负责人">{{ requirement.assigneeId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="提交人">{{ requirement.submitterId }}</el-descriptions-item>
        <el-descriptions-item label="所属部门">{{ requirement.department || '-' }}</el-descriptions-item>
        <el-descriptions-item label="截止日期">{{ formatDate(requirement.deadline) }}</el-descriptions-item>
        <el-descriptions-item label="描述" :span="3">{{ requirement.description || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-row :gutter="20" class="middle-row">
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>评论</template>
          <CommentSection :requirement-id="requirementId" />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>
            <div class="section-header">
              <span>待办事项</span>
              <el-button type="primary" size="small" @click="todoDialogVisible = true">新增</el-button>
            </div>
          </template>
          <el-table :data="todos" stripe style="width: 100%">
            <el-table-column prop="title" label="标题" min-width="160" show-overflow-tooltip />
            <el-table-column prop="dueDate" label="截止日期" width="120">
              <template #default="{ row }">{{ formatDate(row.dueDate) }}</template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="row.status === 'COMPLETED' ? 'success' : 'warning'" size="small">
                  {{ row.status === 'COMPLETED' ? '已完成' : '待处理' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80">
              <template #default="{ row }">
                <el-button
                  v-if="row.status !== 'COMPLETED'"
                  link
                  type="success"
                  size="small"
                  @click="handleCompleteTodo(row)"
                >完成</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="bottom-row">
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>会议纪要</template>
          <el-table :data="meetings" stripe style="width: 100%">
            <el-table-column prop="title" label="标题" min-width="160" show-overflow-tooltip />
            <el-table-column prop="meetingDate" label="会议日期" width="120">
              <template #default="{ row }">{{ formatDate(row.meetingDate) }}</template>
            </el-table-column>
            <el-table-column prop="content" label="内容" min-width="200" show-overflow-tooltip />
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>流程进度</template>
          <el-steps :active="activeStep" align-center>
            <el-step
              v-for="(node, idx) in processNodes"
              :key="idx"
              :title="node.name || '节点' + (idx + 1)"
              :status="node.stepStatus"
              :description="node.description"
            />
          </el-steps>
          <el-empty v-if="!processNodes.length" description="暂无流程信息" />
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="completeVisible" title="完成需求" width="400px">
      <el-form label-width="80px">
        <el-form-item label="完成结论">
          <el-select v-model="completeConclusion" placeholder="请选择结论">
            <el-option label="按时完成" value="ON_TIME" />
            <el-option label="延期完成" value="DELAYED" />
            <el-option label="已取消" value="CANCELLED" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="completeVisible = false">取消</el-button>
        <el-button type="primary" @click="handleComplete">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="todoDialogVisible" title="新增待办" width="480px">
      <el-form ref="todoFormRef" :model="todoForm" :rules="todoRules" label-width="80px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="todoForm.title" placeholder="请输入待办标题" />
        </el-form-item>
        <el-form-item label="截止日期" prop="dueDate">
          <el-date-picker
            v-model="todoForm.dueDate"
            type="date"
            placeholder="请选择截止日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="todoDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAddTodo">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getRequirement, completeRequirement } from '@/api/requirement'
import { getTodosByRequirement, createTodo, completeTodo } from '@/api/todo'
import { getMinutesByRequirement } from '@/api/meeting'
import { getNodes } from '@/api/process'
import { formatDate, getPriorityTag, getStatusTag } from '@/utils'
import CommentSection from '@/components/comment/CommentSection.vue'

const route = useRoute()
const requirementId = computed(() => Number(route.params.id))

const loading = ref(false)
const requirement = ref({})
const todos = ref([])
const meetings = ref([])
const processNodes = ref([])
const completeVisible = ref(false)
const completeConclusion = ref('ON_TIME')
const todoDialogVisible = ref(false)
const todoFormRef = ref(null)
const todoForm = ref({ title: '', dueDate: '' })
const todoRules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }]
}

const statusLabel = {
  DRAFT: '草稿', SUBMITTED: '已提交', IN_PROGRESS: '进行中',
  COMPLETED: '已完成', DELAYED: '延期', CLOSED: '已关闭'
}

const priorityLabel = {
  URGENT: '紧急', HIGH: '高', MEDIUM: '中', LOW: '低'
}

const statusTagType = computed(() => getStatusTag(requirement.value.status))
const priorityTagType = computed(() => getPriorityTag(requirement.value.priority))
const activeStep = computed(() => {
  let idx = processNodes.value.findIndex(n => n.stepStatus === 'process')
  if (idx === -1) idx = processNodes.value.filter(n => n.stepStatus === 'finish').length
  return idx
})

async function fetchData() {
  loading.value = true
  try {
    const [reqRes, todoRes, meetingRes] = await Promise.all([
      getRequirement(requirementId.value),
      getTodosByRequirement(requirementId.value),
      getMinutesByRequirement(requirementId.value)
    ])
    requirement.value = reqRes.data || {}
    todos.value = todoRes.data || []
    meetings.value = meetingRes.data || []
    processNodes.value = []
  } finally {
    loading.value = false
  }
}

async function handleComplete() {
  if (!completeConclusion.value) {
    ElMessage.warning('请选择完成结论')
    return
  }
  await completeRequirement(requirementId.value, completeConclusion.value)
  completeVisible.value = false
  ElMessage.success('操作成功')
  fetchData()
}

async function handleAddTodo() {
  const valid = await todoFormRef.value.validate().catch(() => false)
  if (!valid) return
  await createTodo({
    requirementId: requirementId.value,
    title: todoForm.value.title,
    dueDate: todoForm.value.dueDate
  })
  todoDialogVisible.value = false
  todoForm.value = { title: '', dueDate: '' }
  ElMessage.success('添加成功')
  const res = await getTodosByRequirement(requirementId.value)
  todos.value = res.data || []
}

async function handleCompleteTodo(row) {
  await completeTodo(row.id)
  ElMessage.success('待办已完成')
  const res = await getTodosByRequirement(requirementId.value)
  todos.value = res.data || []
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.requirement-detail {
  padding: 20px;
}

.info-card {
  margin-bottom: 20px;
}

.info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.middle-row {
  margin-bottom: 20px;
}

.bottom-row {
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
