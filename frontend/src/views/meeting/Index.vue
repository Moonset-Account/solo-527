<template>
  <div class="meeting-page">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>会议纪要</span>
          <el-button type="primary" @click="openFormDialog()">新增会议纪要</el-button>
        </div>
      </template>
      <div class="search-bar">
        <el-input v-model="search.keyword" placeholder="搜索关键词" clearable style="width: 200px" @clear="fetchData" @keyup.enter="fetchData" />
        <el-date-picker v-model="search.dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" @change="fetchData" />
        <el-button type="primary" @click="fetchData">搜索</el-button>
      </div>
      <el-table :data="tableData" stripe style="width: 100%">
        <el-table-column prop="title" label="标题" min-width="160" />
        <el-table-column label="关联需求" min-width="140">
          <template #default="{ row }">
            <span v-if="row.requirementId">{{ row.requirementTitle || row.requirementId }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="meetingDate" label="会议日期" width="120" />
        <el-table-column prop="recorderName" label="记录人" width="100" />
        <el-table-column label="参会人数" width="100">
          <template #default="{ row }">
            {{ row.participants ? row.participants.length : 0 }}
          </template>
        </el-table-column>
        <el-table-column label="关联提醒规则" width="140">
          <template #default="{ row }">
            <span v-if="row.reminderRuleId">{{ row.reminderRuleName || row.reminderRuleId }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openDetailDialog(row)">查看</el-button>
            <el-button type="warning" link size="small" @click="openFormDialog(row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="formDialogVisible" :title="editingId ? '编辑会议纪要' : '新增会议纪要'" width="680px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="标题">
          <el-input v-model="form.title" />
        </el-form-item>
        <el-form-item label="内容">
          <el-input v-model="form.content" type="textarea" :rows="6" />
        </el-form-item>
        <el-form-item label="关联需求">
          <el-select v-model="form.requirementId" placeholder="请选择关联需求" clearable filterable style="width: 100%">
            <el-option v-for="req in requirements" :key="req.id" :label="req.title" :value="req.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="会议日期">
          <el-date-picker v-model="form.meetingDate" type="date" placeholder="选择会议日期" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="参会人员">
          <el-select v-model="form.participants" placeholder="请选择参会人员" multiple style="width: 100%">
            <el-option v-for="user in users" :key="user.id" :label="user.name" :value="user.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="关联提醒规则">
          <el-select v-model="form.reminderRuleId" placeholder="请选择提醒规则" clearable style="width: 100%">
            <el-option v-for="rule in reminderRules" :key="rule.id" :label="rule.name" :value="rule.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailDialogVisible" title="会议纪要详情" width="680px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="标题" :span="2">{{ detailData.title }}</el-descriptions-item>
        <el-descriptions-item label="会议日期">{{ detailData.meetingDate }}</el-descriptions-item>
        <el-descriptions-item label="记录人">{{ detailData.recorderName }}</el-descriptions-item>
        <el-descriptions-item label="关联需求" :span="2">{{ detailData.requirementTitle || detailData.requirementId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="参会人员" :span="2">{{ detailData.participantNames || '-' }}</el-descriptions-item>
        <el-descriptions-item label="关联提醒规则" :span="2">{{ detailData.reminderRuleName || detailData.reminderRuleId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="纪要内容" :span="2">
          <div class="detail-content">{{ detailData.content }}</div>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getMinutes, createMinutes, updateMinutes } from '@/api/meeting'
import { pageRequirements } from '@/api/requirement'
import { getUsers } from '@/api/process'
import { getRules } from '@/api/reminder'

const tableData = ref([])
const formDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const editingId = ref(null)
const requirements = ref([])
const users = ref([])
const reminderRules = ref([])
const detailData = ref({})

const search = ref({
  keyword: '',
  dateRange: null
})

const form = ref({
  title: '',
  content: '',
  requirementId: null,
  meetingDate: '',
  participants: [],
  reminderRuleId: null
})

async function fetchData() {
  try {
    const params = {}
    if (search.value.keyword) params.keyword = search.value.keyword
    if (search.value.dateRange && search.value.dateRange.length === 2) {
      params.startDate = search.value.dateRange[0]
      params.endDate = search.value.dateRange[1]
    }
    const res = await getMinutes(params)
    tableData.value = res.data || []
  } catch (e) {
    console.error(e)
  }
}

function openFormDialog(row) {
  if (row) {
    editingId.value = row.id
    form.value = {
      title: row.title,
      content: row.content || '',
      requirementId: row.requirementId || null,
      meetingDate: row.meetingDate || '',
      participants: row.participants ? [...row.participants] : [],
      reminderRuleId: row.reminderRuleId || null
    }
  } else {
    editingId.value = null
    form.value = {
      title: '',
      content: '',
      requirementId: null,
      meetingDate: '',
      participants: [],
      reminderRuleId: null
    }
  }
  formDialogVisible.value = true
}

function openDetailDialog(row) {
  detailData.value = { ...row }
  detailDialogVisible.value = true
}

async function handleSave() {
  try {
    if (editingId.value) {
      await updateMinutes(editingId.value, form.value)
      ElMessage.success('更新成功')
    } else {
      await createMinutes(form.value)
      ElMessage.success('创建成功')
    }
    formDialogVisible.value = false
    fetchData()
  } catch (e) {
    console.error(e)
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

async function fetchUsers() {
  try {
    const res = await getUsers()
    users.value = res.data || []
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
  fetchUsers()
  fetchReminderRules()
})
</script>

<style scoped>
.meeting-page {
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

.detail-content {
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 400px;
  overflow-y: auto;
}
</style>
