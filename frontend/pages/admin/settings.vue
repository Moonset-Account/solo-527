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
        <n-data-table
          :columns="ruleColumns"
          :data="reminderRules"
          :row-key="(row: any) => row.id"
        />
      </n-tab-pane>
    </n-tabs>
  </n-card>
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
  { title: '规则类型', key: 'rule_type' },
  { title: '提醒频率(分钟)', key: 'reminder_frequency_minutes', width: 140 },
  { title: '最大提醒次数', key: 'max_reminders', width: 120 },
  {
    title: '状态',
    key: 'is_active',
    render(row: any) {
      return h('n-tag', { type: row.is_active ? 'success' : 'default' }, () => row.is_active ? '启用' : '停用')
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

onMounted(() => {
  loadConfigs()
  loadRules()
})
</script>
