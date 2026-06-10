<template>
  <div class="reminders-page">
    <el-tabs v-model="activeTab" @tab-change="loadRules">
      <el-tab-pane label="日常提示" name="daily" />
      <el-tab-pane label="阻断告警" name="alert" />
    </el-tabs>

    <el-card>
      <template #header>
        <div class="card-header">
          <span>提醒规则列表</span>
          <el-button type="primary" @click="handleAdd">新增规则</el-button>
        </div>
      </template>

      <el-table :data="rules" v-loading="loading" stripe>
        <el-table-column prop="name" label="规则名称" min-width="150" />
        <el-table-column prop="type" label="类型" width="140">
          <template #default="{ row }">
            <el-tag size="small">{{ typeText(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="level" label="级别" width="100">
          <template #default="{ row }">
            <el-tag :type="levelType(row.level)" size="small">
              {{ levelText(row.level) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="阈值" width="120">
          <template #default="{ row }">
            {{ row.threshold ? row.threshold + (row.thresholdUnit || '') : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-switch
              v-model="row.enabled"
              size="small"
              @change="handleToggle(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" text @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" size="small" text @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
      <el-form :model="ruleForm" label-width="100px">
        <el-form-item label="规则名称" required>
          <el-input v-model="ruleForm.name" placeholder="请输入规则名称" />
        </el-form-item>
        <el-form-item label="类型" required>
          <el-select v-model="ruleForm.type" style="width: 100%">
            <el-option label="预约冲突" value="appointment_conflict" />
            <el-option label="预约提醒" value="appointment_remind" />
            <el-option label="会员卡到期" value="membership_expire" />
            <el-option label="库存不足" value="low_stock" />
            <el-option label="每日报表" value="daily_report" />
            <el-option label="自定义" value="custom" />
          </el-select>
        </el-form-item>
        <el-form-item label="级别">
          <el-radio-group v-model="ruleForm.level">
            <el-radio value="info">信息</el-radio>
            <el-radio value="warning">警告</el-radio>
            <el-radio value="error">错误</el-radio>
            <el-radio value="blocking">阻断</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="分类">
          <el-radio-group v-model="ruleForm.category">
            <el-radio value="daily">日常提示</el-radio>
            <el-radio value="alert">阻断告警</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="阈值">
          <el-input-number v-model="ruleForm.threshold" :min="0" style="width: 150px" />
          <el-select v-model="ruleForm.thresholdUnit" style="width: 100px; margin-left: 10px">
            <el-option label="分钟" value="分钟" />
            <el-option label="小时" value="小时" />
            <el-option label="天" value="天" />
            <el-option label="次" value="次" />
            <el-option label="元" value="元" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="ruleForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入描述"
          />
        </el-form-item>
        <el-form-item label="启用状态">
          <el-switch v-model="ruleForm.enabled" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="ruleForm.sort" :min="0" style="width: 100%" />
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
  getReminderRules,
  createReminderRule,
  updateReminderRule,
  deleteReminderRule,
  toggleReminderRule,
} from '@/api/reminders'

const loading = ref(false)
const rules = ref([])
const activeTab = ref('daily')
const dialogVisible = ref(false)
const dialogTitle = ref('新增规则')
const submitting = ref(false)
const editingId = ref('')

const ruleForm = reactive({
  name: '',
  type: 'appointment_remind',
  level: 'info',
  category: 'daily',
  description: '',
  threshold: 30,
  thresholdUnit: '分钟',
  enabled: true,
  sort: 0,
})

function typeText(type) {
  const map = {
    appointment_conflict: '预约冲突',
    appointment_remind: '预约提醒',
    membership_expire: '会员卡到期',
    low_stock: '库存不足',
    daily_report: '每日报表',
    custom: '自定义',
  }
  return map[type] || type
}

function levelText(level) {
  const map = {
    info: '信息',
    warning: '警告',
    error: '错误',
    blocking: '阻断',
  }
  return map[level] || level
}

function levelType(level) {
  const map = {
    info: 'info',
    warning: 'warning',
    error: 'danger',
    blocking: 'danger',
  }
  return map[level] || 'info'
}

async function loadRules() {
  loading.value = true
  try {
    const data = await getReminderRules({ category: activeTab.value })
    rules.value = data
  } catch (e) {
    // 错误已处理
  } finally {
    loading.value = false
  }
}

function handleAdd() {
  dialogTitle.value = '新增规则'
  editingId.value = ''
  ruleForm.name = ''
  ruleForm.type = 'appointment_remind'
  ruleForm.level = 'info'
  ruleForm.category = activeTab.value
  ruleForm.description = ''
  ruleForm.threshold = 30
  ruleForm.thresholdUnit = '分钟'
  ruleForm.enabled = true
  ruleForm.sort = 0
  dialogVisible.value = true
}

function handleEdit(row) {
  dialogTitle.value = '编辑规则'
  editingId.value = row._id
  ruleForm.name = row.name
  ruleForm.type = row.type
  ruleForm.level = row.level
  ruleForm.category = row.category
  ruleForm.description = row.description || ''
  ruleForm.threshold = row.threshold || 0
  ruleForm.thresholdUnit = row.thresholdUnit || ''
  ruleForm.enabled = row.enabled
  ruleForm.sort = row.sort || 0
  dialogVisible.value = true
}

async function handleSubmit() {
  if (!ruleForm.name) {
    ElMessage.warning('请输入规则名称')
    return
  }

  submitting.value = true
  try {
    if (editingId.value) {
      await updateReminderRule(editingId.value, ruleForm)
      ElMessage.success('更新成功')
    } else {
      await createReminderRule(ruleForm)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadRules()
  } catch (e) {
    // 错误已处理
  } finally {
    submitting.value = false
  }
}

async function handleToggle(row) {
  try {
    await toggleReminderRule(row._id, row.enabled)
    ElMessage.success(row.enabled ? '已启用' : '已禁用')
  } catch (e) {
    row.enabled = !row.enabled
  }
}

function handleDelete(row) {
  ElMessageBox.confirm(`确定要删除「${row.name}」吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    try {
      await deleteReminderRule(row._id)
      ElMessage.success('删除成功')
      loadRules()
    } catch (e) {}
  }).catch(() => {})
}

onMounted(() => {
  loadRules()
})
</script>

<style scoped lang="scss">
.reminders-page {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}
</style>
