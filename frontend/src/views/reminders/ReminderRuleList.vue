<template>
  <div>
    <div class="filter-bar">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="规则类型">
          <el-select v-model="searchForm.type" placeholder="全部" clearable style="width: 140px">
            <el-option label="司机延误" value="driver_delay" />
            <el-option label="订单提醒" value="order_reminder" />
            <el-option label="清洁提醒" value="cleaning_reminder" />
            <el-option label="库存告警" value="inventory_alert" />
          </el-select>
        </el-form-item>
        <el-form-item label="级别">
          <el-select v-model="searchForm.level" placeholder="全部" clearable style="width: 120px">
            <el-option label="普通消息" value="normal" />
            <el-option label="临期提醒" value="imminent" />
            <el-option label="紧急告警" value="urgent" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.enabled" placeholder="全部" clearable style="width: 120px">
            <el-option label="启用" :value="true" />
            <el-option label="禁用" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="table-container">
      <div class="flex-between mb-16">
        <div class="section-title" style="margin-bottom: 0">提醒规则列表</div>
        <el-button type="primary" @click="handleCreate">
          <el-icon><Plus /></el-icon>
          新建规则
        </el-button>
      </div>

      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="name" label="规则名称" min-width="180" />
        <el-table-column label="类型" width="120">
          <template #default="{ row }">
            {{ formatType(row.type) }}
          </template>
        </el-table-column>
        <el-table-column label="级别" width="100">
          <template #default="{ row }">
            <el-tag :type="getLevelType(row.level)" size="small">
              {{ formatLevel(row.level) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="触发条件" min-width="200">
          <template #default="{ row }">
            {{ formatCondition(row.triggerCondition) }}
          </template>
        </el-table-column>
        <el-table-column label="通知渠道" width="140">
          <template #default="{ row }">
            <el-tag
              v-for="channel in row.notificationChannels"
              :key="channel"
              size="small"
              style="margin-right: 4px"
            >
              {{ formatChannel(channel) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="接收角色" width="140">
          <template #default="{ row }">
            <el-tag
              v-for="role in row.recipientRoles"
              :key="role"
              type="info"
              size="small"
              style="margin-right: 4px"
            >
              {{ formatRole(role) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-switch
              v-model="row.enabled"
              @change="(val) => handleToggle(row, val)"
              :loading="togglingId === row.id"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button text type="danger" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑规则' : '新建规则'" width="600px">
      <el-form :model="form" label-width="120px">
        <el-form-item label="规则名称">
          <el-input v-model="form.name" placeholder="请输入规则名称" />
        </el-form-item>
        <el-form-item label="规则类型">
          <el-select v-model="form.type" style="width: 100%">
            <el-option label="司机延误" value="driver_delay" />
            <el-option label="订单提醒" value="order_reminder" />
            <el-option label="清洁提醒" value="cleaning_reminder" />
            <el-option label="库存告警" value="inventory_alert" />
          </el-select>
        </el-form-item>
        <el-form-item label="提醒级别">
          <el-radio-group v-model="form.level">
            <el-radio value="normal">普通消息</el-radio>
            <el-radio value="imminent">临期提醒</el-radio>
            <el-radio value="urgent">紧急告警</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="触发条件">
          <el-input
            v-model="form.triggerConditionStr"
            type="textarea"
            :rows="2"
            placeholder="JSON格式，如：{\"delayMinutes\": 15}"
          />
        </el-form-item>
        <el-form-item label="消息模板">
          <el-input v-model="form.template" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="是否启用">
          <el-switch v-model="form.enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getReminderRules, createReminderRule, updateReminderRule, deleteReminderRule } from '@/api/reminders'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const tableData = ref([])
const togglingId = ref(null)

const searchForm = reactive({
  type: '',
  level: '',
  enabled: ''
})

const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const form = reactive({
  id: null,
  name: '',
  type: 'driver_delay',
  level: 'normal',
  triggerConditionStr: '{}',
  template: '',
  enabled: true,
  notificationChannels: ['system'],
  recipientRoles: ['operator']
})

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getReminderRules({
      type: searchForm.type || undefined,
      level: searchForm.level || undefined,
      enabled: searchForm.enabled !== '' ? searchForm.enabled : undefined
    })
    tableData.value = res
  } catch (e) {
    // handled
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  fetchData()
}

const handleReset = () => {
  searchForm.type = ''
  searchForm.level = ''
  searchForm.enabled = ''
  fetchData()
}

const handleToggle = async (row, val) => {
  togglingId.value = row.id
  try {
    await updateReminderRule(row.id, { enabled: val })
    ElMessage.success(val ? '已启用' : '已禁用')
  } catch (e) {
    row.enabled = !val
  } finally {
    togglingId.value = null
  }
}

const handleCreate = () => {
  isEdit.value = false
  Object.assign(form, {
    id: null,
    name: '',
    type: 'driver_delay',
    level: 'normal',
    triggerConditionStr: '{}',
    template: '',
    enabled: true,
    notificationChannels: ['system'],
    recipientRoles: ['operator']
  })
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  Object.assign(form, {
    id: row.id,
    name: row.name,
    type: row.type,
    level: row.level,
    triggerConditionStr: JSON.stringify(row.triggerCondition || {}),
    template: row.template || '',
    enabled: row.enabled,
    notificationChannels: row.notificationChannels || ['system'],
    recipientRoles: row.recipientRoles || ['operator']
  })
  dialogVisible.value = true
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定删除规则"${row.name}"吗？`, '提示', { type: 'warning' })
    await deleteReminderRule(row.id)
    ElMessage.success('删除成功')
    fetchData()
  } catch (e) {
    // cancelled
  }
}

const handleSubmit = async () => {
  submitting.value = true
  try {
    let triggerCondition
    try {
      triggerCondition = JSON.parse(form.triggerConditionStr)
    } catch (e) {
      ElMessage.error('触发条件格式错误，请输入正确的JSON')
      return
    }

    const data = {
      name: form.name,
      type: form.type,
      level: form.level,
      triggerCondition,
      template: form.template,
      enabled: form.enabled,
      notificationChannels: form.notificationChannels,
      recipientRoles: form.recipientRoles
    }

    if (isEdit.value) {
      await updateReminderRule(form.id, data)
      ElMessage.success('更新成功')
    } else {
      await createReminderRule(data)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    fetchData()
  } catch (e) {
    // handled
  } finally {
    submitting.value = false
  }
}

const formatType = (type) => {
  const map = {
    driver_delay: '司机延误',
    order_reminder: '订单提醒',
    cleaning_reminder: '清洁提醒',
    inventory_alert: '库存告警'
  }
  return map[type] || type
}

const formatLevel = (level) => {
  const map = { normal: '普通', imminent: '临期', urgent: '紧急' }
  return map[level] || level
}

const getLevelType = (level) => {
  const map = { normal: 'info', imminent: 'warning', urgent: 'danger' }
  return map[level] || 'info'
}

const formatCondition = (condition) => {
  if (!condition) return '-'
  return JSON.stringify(condition)
}

const formatChannel = (channel) => {
  const map = { system: '系统', sms: '短信', email: '邮件', wechat: '微信' }
  return map[channel] || channel
}

const formatRole = (role) => {
  const map = { admin: '管理员', operator: '运营人员', viewer: '查看员' }
  return map[role] || role
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
</style>
