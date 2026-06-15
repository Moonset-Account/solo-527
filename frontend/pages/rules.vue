<template>
  <div>
    <NGrid :cols="1" :y-gap="16">
      <NGridItem v-for="rule in ruleStore.rules" :key="rule.id">
        <NCard hoverable>
          <div style="display: flex; justify-content: space-between; align-items: flex-start">
            <div style="flex: 1">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px">
                <span style="font-size: 16px; font-weight: 600; color: #1a365d">{{ rule.name }}</span>
                <NTag :type="rule.is_active ? 'success' : 'default'" size="small" round>
                  {{ rule.is_active ? '启用' : '禁用' }}
                </NTag>
                <NTag size="small" round>{{ categoryLabel(rule.category || rule.rule_type) }}</NTag>
              </div>
              <div v-if="rule.description" style="font-size: 13px; color: #718096; margin-bottom: 12px">
                {{ rule.description }}
              </div>
              <NDescriptions :column="3" label-placement="left" size="small">
                <NDescriptionsItem
                  v-for="(val, key) in (rule.config || {})"
                  :key="String(key)"
                  :label="configLabel(String(key))"
                >
                  <template v-if="typeof val === 'boolean'">
                    <NSwitch
                      :value="val"
                      @update:value="(v: boolean) => updateConfig(rule, String(key), v)"
                    />
                  </template>
                  <template v-else-if="typeof val === 'number'">
                    <NInputNumber
                      :value="val"
                      :min="0"
                      size="small"
                      style="width: 120px"
                      @update:value="(v: number | null) => updateConfig(rule, String(key), v ?? 0)"
                    />
                  </template>
                  <template v-else-if="Array.isArray(val)">
                    {{ val.join(', ') }}
                  </template>
                  <template v-else>
                    {{ val }}
                  </template>
                </NDescriptionsItem>
              </NDescriptions>
            </div>
            <div style="margin-left: 16px; display: flex; flex-direction: column; gap: 8px">
              <NSwitch
                :value="rule.is_active"
                @update:value="(v: boolean) => toggleRule(rule, v)"
              >
                {{ rule.is_active ? '启用' : '禁用' }}
              </NSwitch>
            </div>
          </div>
        </NCard>
      </NGridItem>
    </NGrid>

    <div v-if="!ruleStore.rules.length" style="text-align: center; padding: 60px; color: #a0aec0">
      暂无规则配置
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { NCard, NGrid, NGridItem, NTag, NDescriptions, NDescriptionsItem, NSwitch, NInputNumber, useMessage } from 'naive-ui'

const ruleStore = useRuleStore()
const message = useMessage()

const categoryMap: Record<string, string> = {
  timeout: '超时提醒',
  dedup: '重复检测',
  notification: '通知规则',
  escalation: '自动升级',
  timeout_alert: '超时提醒',
  duplicate_detect: '重复检测',
}

const configLabelMap: Record<string, string> = {
  hours: '超时时长(小时)',
  notify_roles: '通知角色',
  distance_meters: '距离阈值(米)',
  same_type: '同类型匹配',
  time_window_hours: '时间窗口(小时)',
  pending_hours: '待处理时限(小时)',
  rectifying_hours: '整改时限(小时)',
  notify_assigned: '通知整改人',
  include_reason: '包含原因',
  radius_meters: '半径(米)',
  event_type_match: '类型匹配',
}

const categoryLabel = (key: string) => categoryMap[key] || key
const configLabel = (key: string) => configLabelMap[key] || key

onMounted(async () => {
  await ruleStore.fetchRules()
})

const toggleRule = async (rule: any, active: boolean) => {
  await ruleStore.updateRule(rule.id, { is_active: active })
  message.success(active ? '规则已启用' : '规则已禁用')
}

const updateConfig = async (rule: any, key: string, value: any) => {
  const newConfig = { ...(rule.config || {}), [key]: value }
  await ruleStore.updateRule(rule.id, { config: newConfig })
  message.success('配置已更新，立即生效')
}
</script>
