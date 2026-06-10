<template>
  <n-card :bordered="false">
    <template #header>系统设置 - 阈值与提醒配置</template>

    <n-tabs type="line">
      <n-tab-pane name="reminder" tab="提醒设置">
        <n-descriptions bordered :column="2">
          <n-descriptions-item
            v-for="config in reminderConfigs"
            :key="config.config_key"
            :label="config.config_label || config.config_key"
          >
            <n-input-number
              v-if="config.config_type === 'number'"
              :value="Number(config.config_value)"
              size="small"
              @update:value="(val: number) => updateConfig(config, String(val))"
            />
            <n-input
              v-else
              :value="config.config_value"
              size="small"
              @update:value="(val: string) => updateConfig(config, val)"
            />
            <template v-if="config.description">
              <br />
              <span style="color: #999; font-size: 12px">{{ config.description }}</span>
            </template>
          </n-descriptions-item>
        </n-descriptions>
      </n-tab-pane>

      <n-tab-pane name="interview" tab="面试设置">
        <n-descriptions bordered :column="2">
          <n-descriptions-item
            v-for="config in interviewConfigs"
            :key="config.config_key"
            :label="config.config_label || config.config_key"
          >
            <n-input-number
              v-if="config.config_type === 'number'"
              :value="Number(config.config_value)"
              size="small"
              @update:value="(val: number) => updateConfig(config, String(val))"
            />
          </n-descriptions-item>
        </n-descriptions>
      </n-tab-pane>

      <n-tab-pane name="offer" tab="Offer设置">
        <n-descriptions bordered :column="1">
          <n-descriptions-item
            v-for="config in offerConfigs"
            :key="config.config_key"
            :label="config.config_label || config.config_key"
          >
            <n-input-number
              v-if="config.config_type === 'number'"
              :value="Number(config.config_value)"
              size="small"
              @update:value="(val: number) => updateConfig(config, String(val))"
            />
          </n-descriptions-item>
        </n-descriptions>
      </n-tab-pane>

      <n-tab-pane name="rules" tab="提醒规则">
        <div style="margin-bottom: 12px">
          <n-button type="primary" @click="showCreateRule = true">新增规则</n-button>
        </div>
        <n-data-table
          :columns="ruleColumns"
          :data="reminderRules"
          :row-key="(row: any) => row.id"
        />
      </n-tab-pane>
    </n-tabs>
  </n-card>

  <n-modal v-model:show="showCreateRule" preset="dialog" title="新增提醒规则" :style="{ width: '560px' }">
    <n-form :model="ruleForm" label-placement="top">
      <n-form-item label="规则名称">
        <n-input v-model:value="ruleForm.rule_name" placeholder="如：面试冲突提醒" />
      </n-form-item>
      <n-grid :cols="2" :x-gap="12">
        <n-grid-item>
          <n-form-item label="规则类型">
            <n-select v-model:value="ruleForm.rule_type" :options="ruleTypeOptions" />
          </n-form-item>
        </n-grid-item>
        <n-grid-item>
          <n-form-item label="是否启用">
            <n-switch v-model:value="ruleForm.is_active" />
          </n-form-item>
        </n-grid-item>
      </n-grid>
      <n-form-item label="触发条件">
        <n-input v-model:value="ruleForm.trigger_condition" placeholder="如：检测到面试官时间冲突时触发" type="textarea" :rows="2" />
      </n-form-item>
      <n-grid :cols="2" :x-gap="12">
        <n-grid-item>
          <n-form-item label="提醒频率(分钟)">
            <n-input-number v-model:value="ruleForm.reminder_frequency_minutes" :min="1" style="width: 100%" />
          </n-form-item>
        </n-grid-item>
        <n-grid-item>
          <n-form-item label="最大提醒次数">
            <n-input-number v-model:value="ruleForm.max_reminders" :min="1" style="width: 100%" />
          </n-form-item>
        </n-grid-item>
      </n-grid>
      <n-form-item label="升级催办(分钟)">
        <n-input-number v-model:value="ruleForm.escalation_minutes" :min="1" style="width: 100%" placeholder="超过该时间未处理则升级催办" />
      </n-form-item>
      <n-form-item label="通知渠道">
        <n-input v-model:value="ruleForm.notify_channels" placeholder="如：email, sms, in_app" />
      </n-form-item>
      <n-form-item label="描述">
        <n-input v-model:value="ruleForm.description" type="textarea" :rows="2" />
      </n-form-item>
    </n-form>
    <template #action>
      <n-button @click="showCreateRule = false">取消</n-button>
      <n-button type="primary" :loading="creatingRule" @click="createRule">创建</n-button>
    </template>
  </n-modal>

  <n-modal v-model:show="showEditRule" preset="dialog" title="编辑提醒规则" :style="{ width: '560px' }">
    <n-form :model="editRuleForm" label-placement="top">
      <n-form-item label="规则名称">
        <n-input v-model:value="editRuleForm.rule_name" />
      </n-form-item>
      <n-grid :cols="2" :x-gap="12">
        <n-grid-item>
          <n-form-item label="规则类型">
            <n-select v-model:value="editRuleForm.rule_type" :options="ruleTypeOptions" />
          </n-form-item>
        </n-grid-item>
        <n-grid-item>
          <n-form-item label="是否启用">
            <n-switch v-model:value="editRuleForm.is_active" />
          </n-form-item>
        </n-grid-item>
      </n-grid>
      <n-form-item label="触发条件">
        <n-input v-model:value="editRuleForm.trigger_condition" type="textarea" :rows="2" />
      </n-form-item>
      <n-grid :cols="2" :x-gap="12">
        <n-grid-item>
          <n-form-item label="提醒频率(分钟)">
            <n-input-number v-model:value="editRuleForm.reminder_frequency_minutes" :min="1" style="width: 100%" />
          </n-form-item>
        </n-grid-item>
        <n-grid-item>
          <n-form-item label="最大提醒次数">
            <n-input-number v-model:value="editRuleForm.max_reminders" :min="1" style="width: 100%" />
          </n-form-item>
        </n-grid-item>
      </n-grid>
      <n-form-item label="升级催办(分钟)">
        <n-input-number v-model:value="editRuleForm.escalation_minutes" :min="1" style="width: 100%" />
      </n-form-item>
      <n-form-item label="通知渠道">
        <n-input v-model:value="editRuleForm.notify_channels" />
      </n-form-item>
      <n-form-item label="描述">
        <n-input v-model:value="editRuleForm.description" type="textarea" :rows="2" />
      </n-form-item>
    </n-form>
    <template #action>
      <n-button @click="showEditRule = false">取消</n-button>
      <n-button type="primary" :loading="editingRule" @click="updateRule">保存</n-button>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, h } from 'vue'
import { useMessage } from 'naive-ui'
import api from '~/utils/api'
import type { SystemConfig, ReminderRule } from '~/types'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

const message = useMessage()

const configs = ref<SystemConfig[]>([])
const reminderRules = ref<ReminderRule[]>([])

const showCreateRule = ref(false)
const showEditRule = ref(false)
const creatingRule = ref(false)
const editingRule = ref(false)
const deletingRuleId = ref<number | null>(null)
const editingRuleId = ref<number | null>(null)

const ruleTypeOptions = [
  { label: '面试冲突', value: 'interview_conflict' },
  { label: '状态过期', value: 'status_expired' },
  { label: '跟进提醒', value: 'follow_up' },
  { label: '升级催办', value: 'escalation' },
  { label: '待办提醒', value: 'todo_reminder' },
]

const ruleForm = ref({
  rule_name: '',
  rule_type: 'interview_conflict',
  trigger_condition: '',
  reminder_frequency_minutes: 60,
  max_reminders: 3,
  is_active: true,
  notify_channels: '',
  escalation_minutes: null as number | null,
  description: '',
})

const editRuleForm = ref({
  rule_name: '',
  rule_type: 'interview_conflict',
  trigger_condition: '',
  reminder_frequency_minutes: 60,
  max_reminders: 3,
  is_active: true,
  notify_channels: '',
  escalation_minutes: null as number | null,
  description: '',
})

const reminderConfigs = computed(() =>
  configs.value.filter(c => c.group_name === 'reminder')
)
const interviewConfigs = computed(() =>
  configs.value.filter(c => c.group_name === 'interview')
)
const offerConfigs = computed(() =>
  configs.value.filter(c => c.group_name === 'offer')
)

const ruleColumns = [
  { title: '规则名称', key: 'rule_name' },
  {
    title: '规则类型',
    key: 'rule_type',
    render(row: any) {
      const opt = ruleTypeOptions.find(o => o.value === row.rule_type)
      return opt?.label || row.rule_type
    },
  },
  { title: '提醒频率(分钟)', key: 'reminder_frequency_minutes', width: 140 },
  { title: '最大提醒次数', key: 'max_reminders', width: 120 },
  {
    title: '状态',
    key: 'is_active',
    width: 100,
    render(row: any) {
      return h('n-tag', { type: row.is_active ? 'success' : 'default' }, () => row.is_active ? '启用' : '停用')
    },
  },
  {
    title: '操作',
    key: 'actions',
    width: 220,
    render(row: any) {
      return h(
        'n-space',
        { size: 'small' },
        () => [
          h('n-button', { size: 'small', quaternary: true, onClick: () => handleEditRule(row) }, () => '编辑'),
          h('n-button', {
            size: 'small',
            type: row.is_active ? 'warning' : 'success',
            quaternary: true,
            onClick: () => toggleRuleActive(row),
          }, () => row.is_active ? '停用' : '启用'),
          h('n-popconfirm', { onPositiveClick: () => handleDeleteRule(row.id) }, {
            default: () => '确定删除该规则？',
            trigger: () => h('n-button', { size: 'small', type: 'error', quaternary: true }, () => '删除'),
          }),
        ]
      )
    },
  },
]

async function loadConfigs() {
  try {
    const res = await api.get('/dictionary/configs')
    configs.value = res.data
  } catch (e) {
    message.error('加载失败')
  }
}

async function loadRules() {
  try {
    const res = await api.get('/todos/reminder-rules')
    reminderRules.value = res.data
  } catch (e) {
    // ignore
  }
}

async function updateConfig(config: SystemConfig, value: string) {
  try {
    await api.put(`/dictionary/configs/key/${config.config_key}`, null, {
      params: { config_value: value },
    })
    message.success('已更新')
    loadConfigs()
  } catch (e) {
    message.error('更新失败')
  }
}

async function createRule() {
  if (!ruleForm.value.rule_name || !ruleForm.value.rule_type) {
    message.warning('请填写规则名称和类型')
    return
  }
  creatingRule.value = true
  try {
    await api.post('/todos/reminder-rules', ruleForm.value)
    message.success('创建成功')
    showCreateRule.value = false
    loadRules()
  } catch (e) {
    message.error('创建失败')
  } finally {
    creatingRule.value = false
  }
}

function handleEditRule(row: any) {
  editingRuleId.value = row.id
  editRuleForm.value = {
    rule_name: row.rule_name,
    rule_type: row.rule_type,
    trigger_condition: row.trigger_condition || '',
    reminder_frequency_minutes: row.reminder_frequency_minutes,
    max_reminders: row.max_reminders,
    is_active: row.is_active,
    notify_channels: row.notify_channels || '',
    escalation_minutes: row.escalation_minutes,
    description: row.description || '',
  }
  showEditRule.value = true
}

async function updateRule() {
  if (editingRuleId.value === null || !editRuleForm.value.rule_name) {
    message.warning('请填写规则名称')
    return
  }
  editingRule.value = true
  try {
    await api.put(`/todos/reminder-rules/${editingRuleId.value}`, editRuleForm.value)
    message.success('更新成功')
    showEditRule.value = false
    editingRuleId.value = null
    loadRules()
  } catch (e) {
    message.error('更新失败')
  } finally {
    editingRule.value = false
  }
}

async function toggleRuleActive(row: any) {
  try {
    await api.put(`/todos/reminder-rules/${row.id}`, { is_active: !row.is_active })
    message.success(row.is_active ? '已停用' : '已启用')
    loadRules()
  } catch (e) {
    message.error('操作失败')
  }
}

async function handleDeleteRule(id: number) {
  deletingRuleId.value = id
  try {
    await api.delete(`/todos/reminder-rules/${id}`)
    message.success('删除成功')
    loadRules()
  } catch (e) {
    message.error('删除失败')
  } finally {
    deletingRuleId.value = null
  }
}

onMounted(() => {
  loadConfigs()
  loadRules()
})
</script>
