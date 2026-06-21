<template>
  <NTag
    :bordered="false"
    :type="tagType"
    :color="customColor"
    :round="true"
    :size="size"
    class="font-medium"
  >
    <template #icon>
      <NIcon v-if="icon" :size="size === 'small' ? 12 : 14">
        <component :is="icon" />
      </NIcon>
    </template>
    {{ displayText }}
  </NTag>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue'
import { NTag, NIcon, type TagColor } from 'naive-ui'
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

type TagType = 'default' | 'primary' | 'info' | 'success' | 'warning' | 'error'

interface Props {
  status: string
  type?: 'email' | 'risk' | 'knowledge' | 'template' | 'prompt'
  size?: 'small' | 'medium' | 'large'
}

const props = withDefaults(defineProps<Props>(), {
  type: 'email',
  size: 'medium'
})

interface ConfigItem { text: string; icon: Component; tagType?: TagType; color?: TagColor | string }

const emailConfig: Record<EmailStatus, ConfigItem> = {
  draft: { text: '草稿', icon: FileTextOutlined, tagType: 'default' },
  ai_generated: { text: 'AI生成', icon: ThunderboltOutlined, tagType: 'info' },
  pending_review: { text: '待复核', icon: ClockCircleOutlined, tagType: 'warning' },
  approved: { text: '已通过', icon: CheckCircleOutlined, tagType: 'success' },
  sent: { text: '已发送', icon: SendOutlined, tagType: 'info' },
  rejected: { text: '已驳回', icon: CloseCircleOutlined, tagType: 'error' }
}

const riskConfig: Record<RiskLevel, ConfigItem> = {
  none: { text: '无风险', icon: CheckCircleOutlined, tagType: 'success' },
  low: { text: '低风险', icon: WarningOutlined, tagType: 'info' },
  medium: { text: '中风险', icon: WarningOutlined, tagType: 'warning' },
  high: { text: '高风险', icon: WarningOutlined, tagType: 'error' },
  critical: {
    text: '严重风险',
    icon: WarningOutlined,
    color: '#DC2626'
  }
}

const knowledgeConfig: Record<string, ConfigItem> = {
  active: { text: '启用中', icon: CheckCircleOutlined, tagType: 'success' },
  draft: { text: '草稿', icon: FileTextOutlined, tagType: 'default' },
  archived: { text: '已归档', icon: SyncOutlined, tagType: 'info' },
  testing: { text: '测试中', icon: SyncOutlined, tagType: 'warning' },
  deprecated: { text: '已废弃', icon: CloseCircleOutlined, tagType: 'error' }
}

function resolveConfig(): ConfigItem | undefined {
  const s = props.status
  switch (props.type) {
    case 'email': return emailConfig[s as EmailStatus]
    case 'risk': return riskConfig[s as RiskLevel]
    case 'knowledge':
    case 'template':
    case 'prompt':
      return knowledgeConfig[s]
    default: return undefined
  }
}

const tagType = computed<TagType | undefined>(() => {
  return resolveConfig()?.tagType
})

const customColor = computed<TagColor | string | undefined>(() => {
  return resolveConfig()?.color
})

const icon = computed<Component | undefined>(() => {
  return resolveConfig()?.icon
})

const displayText = computed<string>(() => {
  return resolveConfig()?.text || props.status
})
</script>
