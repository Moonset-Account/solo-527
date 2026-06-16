<template>
  <div class="todo-page">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>待办事项</span>
          <el-button type="primary" @click="openDialog()">新增待办</el-button>
        </div>
      </template>
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="我的待办" name="mine" />
        <el-tab-pane label="全部待办" name="all" />
      </el-tabs>
      <div class="search-bar">
        <el-input v-model="search.keyword" placeholder="搜索关键词" clearable style="width: 200px" @clear="fetchData" @keyup.enter="fetchData" />
        <el-select v-model="search.status" placeholder="状态筛选" clearable style="width: 140px" @change="fetchData">
          <el-option label="待处理" value="PENDING" />
          <el-option label="已完成" value="COMPLETED" />
        </el-select>
        <el-date-picker v-model="search.dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" @change="fetchData" />
        <el-button type="primary" @click="fetchData">搜索</el-button>
      </div>
      <el-table :data="tableData" stripe style="width: 100%" :row-class-name="rowClassName">
        <el-table-column prop="title" label="标题" min-width="160" />
        <el-table-column label="关联需求" min-width="140">
          <template #default="{ row }">
            <el-button v-if="row.requirementId" type="primary" link @click="goRequirement(row.requirementId)">
              {{ row.requirementTitle || row.requirementId }}
            </el-button>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="assigneeName" label="负责人" width="100" />
        <el-table-column prop="dueDate" label="截止日期" width="120" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'COMPLETED' ? 'success' : 'warning'" size="small">
              {{ row.status === 'COMPLETED' ? '已完成' : '待处理' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="提醒状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.reminderTriggered" type="danger" size="small">已提醒</el-tag>
            <el-tag v-else type="info" size="small">未提醒</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status === 'PENDING'" type="success" link size="small" @click="handleComplete(row)">完成</el-button>
            <el-button type="primary" link size="small" @click="openDialog(row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑待办' : '新增待办'" width="560px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="标题">
          <el-input v-model="form.title" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="关联需求">
          <el-select v-model="form.requirementId" placeholder="请选择关联需求" clearable filterable style="width: 100%">
            <el-option v-for="req in requirements" :key="req.id" :label="req.title" :value="req.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="截止日期">
          <el-date-picker v-model="form.dueDate" type="date" placeholder="选择截止日期" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="关联提醒规则">
          <el-select v-model="form.reminderRuleId" placeholder="请选择提醒规则" clearable style="width: 100%">
            <el-option v-for="rule in reminderRules" :key="rule.id" :label="rule.name" :value="rule.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getTodosByUser, getTodos, createTodo, updateTodo, completeTodo } from '@/api/todo'
import { pageRequirements } from '@/api/requirement'
import { getRules } from '@/api/reminder'

const router = useRouter()

const activeTab = ref('mine')
const tableData = ref([])
const dialogVisible = ref(false)
const editingId = ref(null)
const requirements = ref([])
const reminderRules = ref([])

const search = ref({
  keyword: '',
  status: '',
  dateRange: null
})

const form = ref({
  title: '',
  description: '',
  requirementId: null,
  dueDate: '',
  reminderRuleId: null
})

async function fetchData() {
  try {
    const params = {}
    if (search.value.keyword) params.keyword = search.value.keyword
    if (search.value.status) params.status = search.value.status
    if (search.value.dateRange && search.value.dateRange.length === 2) {
      params.startDate = search.value.dateRange[0]
      params.endDate = search.value.dateRange[1]
    }
    const res = activeTab.value === 'mine'
      ? await getTodosByUser(1)
      : await getTodos(params)
    tableData.value = activeTab.value === 'mine'
      ? (res.data?.records || res.data || [])
      : (res.data || [])
  } catch (e) {
    console.error(e)
  }
}

function handleTabChange() {
  fetchData()
}

function rowClassName({ row }) {
  if (row.status === 'PENDING' && row.dueDate && new Date(row.dueDate) < new Date()) {
    return 'overdue-row'
  }
  return ''
}

function goRequirement(id) {
  router.push(`/requirements/${id}`)
}

function openDialog(row) {
  if (row) {
    editingId.value = row.id
    form.value = {
      title: row.title,
      description: row.description || '',
      requirementId: row.requirementId || null,
      dueDate: row.dueDate || '',
      reminderRuleId: row.reminderRuleId || null
    }
  } else {
    editingId.value = null
    form.value = {
      title: '',
      description: '',
      requirementId: null,
      dueDate: '',
      reminderRuleId: null
    }
  }
  dialogVisible.value = true
}

async function handleSave() {
  try {
    if (editingId.value) {
      await updateTodo(editingId.value, form.value)
      ElMessage.success('更新成功')
    } else {
      await createTodo(form.value)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    fetchData()
  } catch (e) {
    console.error(e)
  }
}

async function handleComplete(row) {
  try {
    await ElMessageBox.confirm('确认将该待办标记为已完成？', '完成确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await completeTodo(row.id)
    ElMessage.success('已完成')
    fetchData()
  } catch (e) {
    if (e !== 'cancel') console.error(e)
  }
}

async function fetchRequirements() {
  try {
    const res = await pageRequirements({ page: 1, size: 200 })
    requirements.value = res.data?.records || res.data || []
  } catch (e) {
    console.error(e)
  }
}

async function fetchReminderRules() {
  try {
    const res = await getRules()
    reminderRules.value = res.data || []
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  fetchData()
  fetchRequirements()
  fetchReminderRules()
})
</script>

<style scoped>
.todo-page {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

:deep(.overdue-row) {
  background-color: #fef0f0 !important;
}

:deep(.overdue-row:hover > td) {
  background-color: #fde2e2 !important;
}
</style>
