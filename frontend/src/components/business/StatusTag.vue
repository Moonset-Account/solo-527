<template>
  <NTag
    :bordered="false"
    :type="tagType"
    :color="customColor"
    round
    :size="size"
    class="font-medium"
  >
    <template v-if="icon" #icon>
      <NIcon :size="size === 'small' ? 12 : 14">
        <component :is="icon" />
      </NIcon>
    </template>
    {{ displayText }}
  </NTag>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue'
import { NTag, NIcon } from 'naive-ui'
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  SendOutlined,
  WarningOutlined,
  FileTextOutlined,
  ThunderboltOutlined
} from '@vicons/antd'
import type { EmailStatus, RiskLevel } from '@/types'

interface Props {
  status: string
  type?: 'email' | 'risk' | 'knowledge' | 'template' | 'prompt'
  size?: 'small' | 'medium' | 'large'
}

const props = withDefaults(defineProps<Props>(), {
  type: 'email',
  size: 'medium'
})

const emailConfig: Record<EmailStatus, { text: string; icon: Component; type: any; color?: any }> = {
  draft: { text: '草稿', icon: FileTextOutlined, type: 'default' },
  ai_generated: { text: 'AI生成', icon: ThunderboltOutlined, type: 'info' },
  pending_review: { text: '待复核', icon: ClockCircleOutlined, type: 'warning' },
  approved: { text: '已通过', icon: CheckCircleOutlined, type: 'success' },
  sent: { text: '已发送', icon: SendOutlined, type: 'success', color: { type: 'info' as const } },
  rejected: { text: '已驳回', icon: CloseCircleOutlined, type: 'error' }
}

const riskConfig: Record<RiskLevel, { text: string; icon: Component; color: any }> = {
  none: { text: '无风险', icon: CheckCircleOutlined, color: { type: 'success' as const } },
  low: { text: '低风险', icon: WarningOutlined, color: { type: 'info' as const } },
  medium: { text: '中风险', icon: WarningOutlined, color: { type: 'warning' as const } },
  high: { text: '高风险', icon: WarningOutlined, color: { type: 'error' as const } },
  critical: { text: '严重风险', icon: WarningOutlined, color: { color: { text: '#fff', border: '#DC2626', close: '#fff' }, value: 'rgba(220,38,38,0.9)' } }
}

const knowledgeConfig: Record<string, { text: string; icon: Component; type: any }> = {
  active: { text: '启用中', icon: CheckCircleOutlined, type: 'success' },
  draft: { text: '草稿', icon: FileTextOutlined, type: 'default' },
  archived: { text: '已归档', icon: SyncOutlined, type: 'info' },
  testing: { text: '测试中', icon: SyncOutlined, type: 'warning' },
  deprecated: { text: '已废弃', icon: CloseCircleOutlined, type: 'error' }
}

const tagType = computed(() => {
  if (props.type === 'email') return emailConfig[props.status as EmailStatus]?.type || 'default'
  return undefined
})

const customColor = computed(() => {
  if (props.type === 'risk') return riskConfig[props.status as RiskLevel]?.color
  if (props.type === 'email' && emailConfig[props.status as EmailStatus]?.color) {
    return emailConfig[props.status as EmailStatus].color
  }
  if (props.type === 'knowledge') return knowledgeConfig[props.status]?.type
  if (props.type === 'template' || props.type === 'prompt') return knowledgeConfig[props.status]?.type
  return undefined
})

const icon = computed(() => {
  if (props.type === 'email') return emailConfig[props.status as EmailStatus]?.icon
  if (props.type === 'risk') return riskConfig[props.status as RiskLevel]?.icon
  if (props.type === 'knowledge') return knowledgeConfig[props.status]?.icon
  if (props.type === 'template' || props.type === 'prompt') return knowledgeConfig[props.status]?.icon
  return undefined
})

const displayText = computed(() => {
  if (props.type === 'email') return emailConfig[props.status as EmailStatus]?.text || props.status
  if (props.type === 'risk') return riskConfig[props.status as RiskLevel]?.text || props.status
  if (props.type === 'knowledge') return knowledgeConfig[props.status]?.text || props.status
  if (props.type === 'template' || props.type === 'prompt') return knowledgeConfig[props.status]?.text || props.status
  return props.status
})
</script>
