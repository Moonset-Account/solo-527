<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">系统配置</h2>
    </div>

    <el-tabs v-model="activeTab" class="config-tabs">
      <el-tab-pane label="状态字典配置" name="dict">
        <el-alert type="info" :closable="false" show-icon class="tip-alert">
          配置后立即生效，全平台通用
        </el-alert>

        <div class="dict-layout">
          <div class="dict-sidebar">
            <div class="sidebar-title">字典类型</div>
            <el-scrollbar>
              <ul class="dict-type-list">
                <li
                  v-for="type in allDictTypes"
                  :key="type"
                  :class="{ active: currentDictType === type }"
                  @click="selectDictType(type)"
                >
                  <span class="type-name">{{ dictTypeLabels[type] || type }}</span>
                  <span class="type-count">{{ dictStore.getDict(type).length }}</span>
                </li>
              </ul>
            </el-scrollbar>
          </div>

          <div class="dict-content">
            <div class="content-header">
              <div class="content-title">
                <span>{{ dictTypeLabels[currentDictType] || currentDictType }}</span>
                <el-tag size="small" type="info">{{ currentDictType }}</el-tag>
              </div>
              <div class="content-actions">
                <el-button size="small" @click="addDictRow">
                  <el-icon><Plus /></el-icon> 新增
                </el-button>
                <el-button type="primary" size="small" :loading="savingDict" @click="saveDict">
                  保存全部
                </el-button>
              </div>
            </div>

            <div class="table-card" style="box-shadow: none; margin-top: 0;">
              <el-table :data="currentDictRows" v-loading="loadingDict" border stripe>
                <el-table-column label="序号" width="70" align="center" type="index" />
                <el-table-column label="dictKey" min-width="140">
                  <template #default="{ row }">
                    <el-input v-model="row.key" size="small" placeholder="key" />
                  </template>
                </el-table-column>
                <el-table-column label="value" min-width="140">
                  <template #default="{ row }">
                    <el-input v-model="row.value" size="small" placeholder="value" />
                  </template>
                </el-table-column>
                <el-table-column label="显示名" min-width="140">
                  <template #default="{ row }">
                    <el-input v-model="row.label" size="small" placeholder="显示名称" />
                  </template>
                </el-table-column>
                <el-table-column label="颜色" width="160">
                  <template #default="{ row }">
                    <el-color-picker v-model="row.color" size="small" />
                  </template>
                </el-table-column>
                <el-table-column label="排序" width="120">
                  <template #default="{ row }">
                    <el-input-number v-model="row.sort" size="small" :min="0" :max="9999" controls-position="right" />
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="90" align="center" fixed="right">
                  <template #default="{ $index }">
                    <el-button link type="danger" size="small" @click="removeDictRow($index)">删除</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="提醒频率配置" name="reminder">
        <div class="content-header">
          <div class="content-title">提醒频率配置</div>
          <el-button type="primary" size="small" :loading="savingAllReminder" @click="saveAllReminders">
            一键保存全部
          </el-button>
        </div>

        <div class="table-card" style="margin-top: 16px;">
          <el-table :data="reminderRows" v-loading="loadingReminder" border stripe>
            <el-table-column label="提醒类型" width="160">
              <template #default="{ row }">
                <span class="font-medium">{{ row.label }}</span>
                <div class="text-xs text-muted">{{ row.type }}</div>
              </template>
            </el-table-column>
            <el-table-column label="名称" width="160">
              <template #default="{ row }">
                <el-input v-model="row.name" size="small" placeholder="显示名称" />
              </template>
            </el-table-column>
            <el-table-column label="频率(分钟)" width="160">
              <template #default="{ row }">
                <el-input-number v-model="row.frequencyMinutes" size="small" :min="1" :max="10080" controls-position="right" />
              </template>
            </el-table-column>
            <el-table-column label="是否启用" width="100" align="center">
              <template #default="{ row }">
                <el-switch v-model="row.enabled" />
              </template>
            </el-table-column>
            <el-table-column label="邮件通知" width="100" align="center">
              <template #default="{ row }">
                <el-switch v-model="row.emailEnabled" :disabled="!row.enabled" />
              </template>
            </el-table-column>
            <el-table-column label="短信通知" width="100" align="center">
              <template #default="{ row }">
                <el-switch v-model="row.smsEnabled" :disabled="!row.enabled" />
              </template>
            </el-table-column>
            <el-table-column label="站内通知" width="100" align="center">
              <template #default="{ row }">
                <el-switch v-model="row.inAppEnabled" :disabled="!row.enabled" />
              </template>
            </el-table-column>
            <el-table-column label="自定义消息" min-width="260">
              <template #default="{ row }">
                <el-input v-model="row.messageTemplate" type="textarea" :rows="2" size="small" placeholder="自定义消息模板，支持占位符" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="110" align="center" fixed="right">
              <template #default="{ row, $index }">
                <el-button type="primary" link size="small" :loading="row.saving" @click="saveSingleReminder($index)">
                  保存
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { configApi } from '@/api/modules'
import { useDictStore } from '@/stores/dict'

const dictStore = useDictStore()
const activeTab = ref('dict')

const dictTypeLabels: Record<string, string> = {
  partnership_stage: '合作阶段',
  partnership_status: '合作状态',
  benefit_type: '权益类型',
  order_status: '订单状态',
  payment_status: '支付状态',
  subscription_status: '订阅状态',
  refund_status: '退款状态',
  refund_type: '退款类型',
  priority: '优先级',
  warning_level: '警告级别'
}

const defaultDictTypes = [
  'partnership_stage',
  'partnership_status',
  'benefit_type',
  'order_status',
  'payment_status',
  'subscription_status',
  'refund_status',
  'refund_type',
  'priority',
  'warning_level'
]

const allDictTypes = computed(() => {
  const fromStore = dictStore.dictTypes || []
  const merged = new Set([...fromStore, ...defaultDictTypes])
  return Array.from(merged)
})

const defaultReminderTypes = [
  { type: 'unpaid_order', label: '未支付订单提醒', name: '未支付订单提醒' },
  { type: 'refund_exception', label: '退款异常提醒', name: '退款异常提醒' },
  { type: 'stage_timeout', label: '合作阶段超时提醒', name: '合作阶段超时提醒' },
  { type: 'subscription_expire', label: '会员到期提醒', name: '会员到期提醒' },
  { type: 'delivery_delay', label: '交付延期提醒', name: '交付延期提醒' }
]

const currentDictType = ref('')
const currentDictRows = ref<any[]>([])
const loadingDict = ref(false)
const savingDict = ref(false)

const reminderRows = ref<any[]>([])
const loadingReminder = ref(false)
const savingAllReminder = ref(false)

const selectDictType = async (type: string) => {
  currentDictType.value = type
  loadingDict.value = true
  try {
    const res: any = await configApi.getStatusDict({ type })
    const items = res.data || []
    currentDictRows.value = items.length > 0 ? items.map((i: any) => ({
      key: i.key || i.dictKey || '',
      value: i.value || i.dictValue || '',
      label: i.label || '',
      color: i.color || '#409EFF',
      sort: i.sort ?? 0
    })) : []
  } catch {
    const fromStore = dictStore.getDict(type)
    currentDictRows.value = fromStore.map((i: any) => ({
      key: i.key || '',
      value: i.value || '',
      label: i.label || '',
      color: i.color || '#409EFF',
      sort: i.sort ?? 0
    }))
  } finally {
    loadingDict.value = false
  }
}

const addDictRow = () => {
  currentDictRows.value.push({
    key: '',
    value: '',
    label: '',
    color: '#409EFF',
    sort: currentDictRows.value.length
  })
}

const removeDictRow = (index: number) => {
  currentDictRows.value.splice(index, 1)
}

const saveDict = async () => {
  if (!currentDictType.value) return
  const rows = currentDictRows.value.filter(r => r.key && r.label)
  if (rows.length === 0) {
    ElMessage.warning('请至少填写一条有效数据')
    return
  }
  savingDict.value = true
  try {
    await configApi.updateStatusDict({
      type: currentDictType.value,
      items: rows
    })
    await dictStore.refresh()
    ElMessage.success('保存成功')
  } finally {
    savingDict.value = false
  }
}

const loadReminders = async () => {
  loadingReminder.value = true
  try {
    const res: any = await configApi.getReminderFrequency()
    const list = res.data || []
    reminderRows.value = defaultReminderTypes.map(def => {
      const found = list.find((r: any) => r.type === def.type)
      return {
        ...def,
        frequencyMinutes: found?.frequencyMinutes ?? 60,
        enabled: found?.enabled ?? true,
        emailEnabled: found?.emailEnabled ?? false,
        smsEnabled: found?.smsEnabled ?? false,
        inAppEnabled: found?.inAppEnabled ?? true,
        messageTemplate: found?.messageTemplate || '',
        saving: false,
        ...(found || {})
      }
    })
  } finally {
    loadingReminder.value = false
  }
}

const saveSingleReminder = async (index: number) => {
  const row = reminderRows.value[index]
  if (!row) return
  row.saving = true
  try {
    await configApi.updateReminderFrequency({
      type: row.type,
      name: row.name,
      frequencyMinutes: row.frequencyMinutes,
      enabled: row.enabled,
      emailEnabled: row.emailEnabled,
      smsEnabled: row.smsEnabled,
      inAppEnabled: row.inAppEnabled,
      messageTemplate: row.messageTemplate
    })
    await dictStore.refresh()
    ElMessage.success('保存成功')
  } finally {
    row.saving = false
  }
}

const saveAllReminders = async () => {
  const validRows = reminderRows.value.filter(r => r.name)
  if (validRows.length === 0) {
    ElMessage.warning('请填写有效的提醒配置')
    return
  }
  savingAllReminder.value = true
  try {
    for (const row of validRows) {
      await configApi.updateReminderFrequency({
        type: row.type,
        name: row.name,
        frequencyMinutes: row.frequencyMinutes,
        enabled: row.enabled,
        emailEnabled: row.emailEnabled,
        smsEnabled: row.smsEnabled,
        inAppEnabled: row.inAppEnabled,
        messageTemplate: row.messageTemplate
      })
    }
    await dictStore.refresh()
    ElMessage.success('全部保存成功')
  } finally {
    savingAllReminder.value = false
  }
}

watch(activeTab, (val) => {
  if (val === 'reminder' && reminderRows.value.length === 0) {
    loadReminders()
  }
  if (val === 'dict' && !currentDictType.value && allDictTypes.value.length > 0) {
    selectDictType(allDictTypes.value[0])
  }
})

onMounted(async () => {
  if (!dictStore.loaded) {
    await dictStore.loadAll()
  }
  if (allDictTypes.value.length > 0) {
    selectDictType(allDictTypes.value[0])
  }
})
</script>

<style lang="scss" scoped>
.page-container {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-title {
  font-size: 22px;
  font-weight: 600;
  margin: 0;
  color: #303133;
}

.config-tabs {
  background: #fff;
  border-radius: 8px;
  padding: 4px 20px 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.tip-alert {
  margin-bottom: 16px;
}

.dict-layout {
  display: flex;
  gap: 16px;
  min-height: 520px;
}

.dict-sidebar {
  width: 240px;
  background: #fafbfc;
  border-radius: 8px;
  border: 1px solid #ebeef5;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .sidebar-title {
    padding: 14px 16px;
    font-weight: 600;
    color: #303133;
    border-bottom: 1px solid #ebeef5;
    background: #fff;
  }

  :deep(.el-scrollbar) {
    flex: 1;
  }
}

.dict-type-list {
  list-style: none;
  padding: 8px;
  margin: 0;

  li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    margin-bottom: 2px;

    &:hover {
      background: #ecf5ff;
    }

    &.active {
      background: #409eff;
      color: #fff;

      .type-count {
        background: rgba(255, 255, 255, 0.25);
        color: #fff;
      }
    }
  }

  .type-name {
    font-size: 14px;
  }

  .type-count {
    min-width: 24px;
    padding: 0 8px;
    height: 20px;
    line-height: 20px;
    text-align: center;
    border-radius: 10px;
    font-size: 12px;
    background: #e4e7ed;
    color: #909399;
  }
}

.dict-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.content-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;

  .content-title {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 16px;
    font-weight: 600;
    color: #303133;
  }

  .content-actions {
    display: flex;
    gap: 8px;
  }
}

.table-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  padding: 16px;
  flex: 1;
}

.font-medium {
  font-weight: 500;
}

.text-xs {
  font-size: 12px;
}

.text-muted {
  color: #909399;
}
</style>
