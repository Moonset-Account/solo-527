<template>
  <div class="reminder-page">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>提醒规则配置</span>
          <el-button type="primary" @click="openDialog()">新增规则</el-button>
        </div>
      </template>
      <el-table :data="tableData" stripe style="width: 100%">
        <el-table-column prop="name" label="规则名称" min-width="140" />
        <el-table-column label="规则类型" width="160">
          <template #default="{ row }">
            <el-tag :type="ruleTypeTagMap[row.ruleType] || 'info'" size="small">
              {{ ruleTypeLabelMap[row.ruleType] || row.ruleType }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="触发条件" min-width="160">
          <template #default="{ row }">
            <pre class="trigger-json">{{ formatTrigger(row) }}</pre>
          </template>
        </el-table-column>
        <el-table-column label="提醒方式" width="160">
          <template #default="{ row }">
            <el-tag v-for="method in (row.notifyMethods || [])" :key="method" :type="methodTagMap[method] || 'info'" size="small" class="method-tag">
              {{ methodLabelMap[method] || method }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="advanceHours" label="提前提醒时长(小时)" width="160" />
        <el-table-column label="启用状态" width="100">
          <template #default="{ row }">
            <el-switch v-model="row.enabled" @change="handleToggle(row)" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openDialog(row)">编辑</el-button>
            <el-popconfirm title="确认删除该规则？" @confirm="handleDelete(row.id)">
              <template #reference>
                <el-button type="danger" link size="small">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑规则' : '新增规则'" width="560px">
      <el-form :model="form" label-width="120px">
        <el-form-item label="规则名称">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="规则类型">
          <el-select v-model="form.ruleType" placeholder="请选择规则类型" style="width: 100%" @change="handleRuleTypeChange">
            <el-option label="评论无回复" value="COMMENT_NO_REPLY" />
            <el-option label="待办到期" value="TODO_DUE" />
            <el-option label="会议即将开始" value="MEETING_UPCOMING" />
            <el-option label="流程超时" value="PROCESS_TIMEOUT" />
          </el-select>
        </el-form-item>
        <el-form-item label="触发条件(小时)">
          <el-input-number v-model="form.triggerHours" :min="1" :max="720" />
        </el-form-item>
        <el-form-item label="提醒方式">
          <el-checkbox-group v-model="form.notifyMethods">
            <el-checkbox value="EMAIL">邮件</el-checkbox>
            <el-checkbox value="SMS">短信</el-checkbox>
            <el-checkbox value="IN_APP">站内信</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="提前提醒时长">
          <div style="display: flex; align-items: center; gap: 8px">
            <el-input-number v-model="form.advanceHours" :min="0" :max="720" />
            <span>小时</span>
          </div>
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="form.enabled" />
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
import { ElMessage } from 'element-plus'
import { getRules, createRule, updateRule, deleteRule } from '@/api/reminder'

const tableData = ref([])
const dialogVisible = ref(false)
const editingId = ref(null)

const ruleTypeLabelMap = {
  COMMENT_NO_REPLY: '评论无回复',
  TODO_DUE: '待办到期',
  MEETING_UPCOMING: '会议即将开始',
  PROCESS_TIMEOUT: '流程超时'
}

const ruleTypeTagMap = {
  COMMENT_NO_REPLY: 'warning',
  TODO_DUE: 'danger',
  MEETING_UPCOMING: 'primary',
  PROCESS_TIMEOUT: 'error'
}

const methodLabelMap = {
  EMAIL: '邮件',
  SMS: '短信',
  IN_APP: '站内信'
}

const methodTagMap = {
  EMAIL: 'primary',
  SMS: 'success',
  IN_APP: 'warning'
}

const form = ref({
  name: '',
  ruleType: '',
  triggerHours: 24,
  notifyMethods: [],
  advanceHours: 0,
  enabled: true
})

function formatTrigger(row) {
  const label = ruleTypeLabelMap[row.ruleType] || row.ruleType
  const hours = row.triggerCondition?.hours ?? row.triggerHours ?? '-'
  if (row.ruleType === 'COMMENT_NO_REPLY' || row.ruleType === 'PROCESS_TIMEOUT') {
    return JSON.stringify({ 超时小时数: hours })
  }
  if (row.ruleType === 'TODO_DUE') {
    return JSON.stringify({ 到期前小时数: hours })
  }
  if (row.ruleType === 'MEETING_UPCOMING') {
    return JSON.stringify({ 会议前小时数: hours })
  }
  return JSON.stringify(row.triggerCondition || {})
}

function handleRuleTypeChange() {
  form.value.triggerHours = 24
}

async function fetchData() {
  try {
    const res = await getRules()
    tableData.value = res.data || []
  } catch (e) {
    console.error(e)
  }
}

function openDialog(row) {
  if (row) {
    editingId.value = row.id
    form.value = {
      name: row.name,
      ruleType: row.ruleType,
      triggerHours: row.triggerCondition?.hours ?? row.triggerHours ?? 24,
      notifyMethods: row.notifyMethods ? [...row.notifyMethods] : [],
      advanceHours: row.advanceHours ?? 0,
      enabled: row.enabled ?? true
    }
  } else {
    editingId.value = null
    form.value = {
      name: '',
      ruleType: '',
      triggerHours: 24,
      notifyMethods: [],
      advanceHours: 0,
      enabled: true
    }
  }
  dialogVisible.value = true
}

async function handleSave() {
  try {
    const payload = {
      ...form.value,
      triggerCondition: { hours: form.value.triggerHours }
    }
    delete payload.triggerHours
    if (editingId.value) {
      await updateRule(editingId.value, payload)
      ElMessage.success('更新成功')
    } else {
      await createRule(payload)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    fetchData()
  } catch (e) {
    console.error(e)
  }
}

async function handleDelete(id) {
  try {
    await deleteRule(id)
    ElMessage.success('删除成功')
    fetchData()
  } catch (e) {
    console.error(e)
  }
}

async function handleToggle(row) {
  try {
    await updateRule(row.id, { enabled: row.enabled })
    ElMessage.success(row.enabled ? '已启用' : '已停用')
  } catch (e) {
    row.enabled = !row.enabled
    console.error(e)
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.reminder-page {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.trigger-json {
  margin: 0;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-word;
}

.method-tag {
  margin: 2px 4px;
}
</style>
