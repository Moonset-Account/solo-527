<template>
  <div class="space-y-5">
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h1 class="font-charter text-2xl font-bold text-deep-blue-900">风险样本库</h1>
        <p class="mt-1 text-sm text-slate-500">收集系统识别的高风险邮件样本，用于训练和规则优化</p>
      </div>
      <div class="flex items-center space-x-2">
        <NTag :bordered="false" type="error" round>
          <NIcon :size="12" class="mr-1"><WarningOutlined /></NIcon>
          待处理 {{ pendingCount }}
        </NTag>
        <NButton>
          <NIcon :size="14" class="mr-1.5"><DownloadOutlined /></NIcon>
          导出样本
        </NButton>
      </div>
    </div>

    <NCard class="!rounded-2xl shadow-sm" size="large">
      <div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-5">
        <NSelect v-model:value="filterReason" :options="reasonOptions" placeholder="驳回原因" clearable />
        <NSelect v-model:value="filterLevel" :options="levelOptions" placeholder="风险等级" clearable />
        <NDynamicTags v-model:value="filterTags" placeholder="标签筛选，按回车添加" />
        <NDatePicker
          v-model:value="dateRange"
          type="daterange"
          clearable
          :default-value="defaultDateRange"
          class="!w-full"
        />
        <div class="flex items-center space-x-2">
          <NButton quaternary @click="resetFilters">重置</NButton>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <div
          v-for="sample in filteredSamples"
          :key="sample.id"
          class="group bg-white rounded-xl border border-slate-100 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden cursor-pointer"
          @click="openDetail(sample)"
        >
          <div class="flex">
            <div
              class="w-1.5 flex-shrink-0"
              :class="levelBarClass(sample.riskLevel)"
            ></div>
            <div class="flex-1 p-4 min-w-0">
              <div class="flex items-start justify-between mb-3">
                <div class="flex items-center gap-2 min-w-0 flex-1 mr-2">
                  <NTag
                    size="small"
                    :round="true"
                    :bordered="false"
                    :type="reasonTagType(sample)"
                    class="!truncate"
                  >
                    {{ sample.riskType }}
                  </NTag>
                </div>
                <StatusTag :status="sample.riskLevel" type="risk" size="small" />
              </div>
              <h4 class="font-medium text-slate-800 mb-2 truncate group-hover:text-deep-blue-700 transition-colors">
                {{ sample.emailSubject }}
              </h4>
              <div class="flex flex-wrap gap-1 mb-3">
                <NTag
                  v-for="tag in sampleTags(sample)"
                  :key="tag"
                  size="tiny"
                  :bordered="false"
                  type="info"
                  round
                >
                  {{ tag }}
                </NTag>
              </div>
              <p class="text-xs text-slate-500 mb-4 line-clamp-3 leading-relaxed group-hover:text-slate-600">
                {{ sample.description }}
              </p>
              <div class="flex items-center justify-between pt-3 border-t border-slate-50">
                <span class="text-xs text-slate-400">{{ formatDate(sample.detectedAt) }}</span>
                <div class="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <NButton
                    size="tiny"
                    text
                    type="primary"
                    @click.stop="openDetail(sample)"
                  >
                    查看详情
                  </NButton>
                  <NButton
                    size="tiny"
                    text
                    type="warning"
                    :disabled="sample.handled"
                    @click.stop="markAsTraining(sample)"
                  >
                    标记为负例
                  </NButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="filteredSamples.length === 0" class="py-16 text-center">
        <div class="w-20 h-20 mx-auto mb-4 rounded-2xl bg-slate-50 flex items-center justify-center">
          <NIcon :size="36" color="#CBD5E1"><SearchOutlined /></NIcon>
        </div>
        <p class="text-slate-400">没有符合条件的风险样本</p>
      </div>

      <div class="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
        <span class="text-sm text-slate-500">共 {{ filteredSamples.length }} 条样本</span>
        <NPagination
          v-model:page="pagination.page"
          :page-size="pagination.pageSize"
          :item-count="filteredSamples.length"
          size="small"
        />
      </div>
    </NCard>

    <NDrawer v-model:show="drawerVisible" :width="720" placement="right" title="风险样本详情" :show-icon="false">
      <div v-if="currentSample" class="space-y-5">
        <div class="flex items-start justify-between p-4 bg-slate-50 rounded-xl">
          <div class="min-w-0 pr-4">
            <h3 class="font-charter font-bold text-deep-blue-900 truncate mb-2">{{ currentSample.emailSubject }}</h3>
            <div class="flex items-center gap-2 flex-wrap">
              <StatusTag :status="currentSample.riskLevel" type="risk" size="small" />
              <NTag size="small" :round="true" :bordered="false" type="warning">{{ currentSample.riskType }}</NTag>
              <span class="text-xs text-slate-400">检测于 {{ formatFull(currentSample.detectedAt) }}</span>
            </div>
          </div>
          <NTag
            :bordered="false"
            size="large"
            :round="true"
            :type="currentSample.handled ? 'success' : 'warning'"
          >
            {{ currentSample.handled ? '已处理' : '待处理' }}
          </NTag>
        </div>

        <div>
          <p class="text-xs text-slate-500 font-bold mb-2">风险描述</p>
          <p class="text-sm text-slate-700 leading-relaxed p-4 bg-red-50/60 rounded-xl border border-red-100">
            {{ currentSample.description }}
          </p>
        </div>

        <div>
          <p class="text-xs text-slate-500 font-bold mb-2">原始违规内容</p>
          <NCode
            :code="currentSample.originalContent"
            language="text"
            :trim="false"
            word-wrap
          />
        </div>

        <div v-if="currentSample.suggestedContent">
          <p class="text-xs text-slate-500 font-bold mb-2">AI 建议的合规替换</p>
          <NCode
            :code="currentSample.suggestedContent"
            language="text"
            :trim="false"
            word-wrap
            class="!bg-emerald-50/60 !border !border-emerald-200"
          />
        </div>

        <div v-if="sampleReviewRecord">
          <p class="text-xs text-slate-500 font-bold mb-3">来源邮件信息</p>
          <NCard embedded size="small">
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p class="text-xs text-slate-400">收件人</p>
                <p class="text-slate-700 font-medium mt-0.5">{{ sampleReviewRecord.recipient }}</p>
              </div>
              <div>
                <p class="text-xs text-slate-400">风险条目</p>
                <p class="text-slate-700 font-medium mt-0.5">{{ sampleReviewRecord.riskItems?.length || 0 }} 项</p>
              </div>
              <div>
                <p class="text-xs text-slate-400">生成人</p>
                <p class="text-slate-700 font-medium mt-0.5">{{ getSalesName(sampleReviewRecord.generatedBy) }}</p>
              </div>
              <div>
                <p class="text-xs text-slate-400">最终状态</p>
                <StatusTag :status="sampleReviewRecord.status" type="email" size="small" />
              </div>
            </div>
          </NCard>
        </div>

        <div>
          <p class="text-xs text-slate-500 font-bold mb-3">处理历史</p>
          <NTimeline>
            <NTimelineItem type="warning" title="风险检测">
              <div class="text-xs text-slate-500">{{ formatFull(currentSample.detectedAt) }}</div>
              <div class="text-sm text-slate-700 mt-1">AI 风险检测引擎识别到 {{ currentSample.riskType }}</div>
            </NTimelineItem>
            <NTimelineItem
              v-if="currentSample.handled"
              type="success"
              :title="currentSample.handlerComment ? '已处理' : '处理完成'"
            >
              <div class="text-xs text-slate-500">{{ currentSample.handledAt ? formatFull(currentSample.handledAt) : '' }}</div>
              <div v-if="currentSample.handlerComment" class="text-sm text-slate-700 mt-1">
                {{ currentSample.handlerComment }}
              </div>
            </NTimelineItem>
          </NTimeline>
        </div>
      </div>
      <template #footer>
        <div v-if="currentSample" class="flex justify-between items-center">
          <NButton :disabled="currentSample.handled" type="warning" @click="markAsTraining(currentSample)">
            <NIcon :size="14" class="mr-1.5"><BookOutlined /></NIcon>
            标记为训练负例
          </NButton>
          <div class="flex items-center space-x-2">
            <NButton @click="drawerVisible = false">关闭</NButton>
            <NButton
              v-if="!currentSample.handled"
              type="primary"
              @click="handleSample(currentSample)"
            >
              <NIcon :size="14" class="mr-1.5"><CheckOutlined /></NIcon>
              标记处理完成
            </NButton>
          </div>
        </div>
      </template>
    </NDrawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import {
  NCard, NButton, NIcon, NTag, NSelect, NDynamicTags, NDatePicker,
  NDrawer, NTimeline, NTimelineItem, NCode, NPagination, useMessage,
  type SelectOption
} from 'naive-ui'
import {
  WarningOutlined, DownloadOutlined, SearchOutlined, BookOutlined, CheckOutlined
} from '@vicons/antd'
import StatusTag from '@/components/business/StatusTag.vue'
import { usePageTitle } from '@/composables/usePageTitle'
import { mockRisks, mockEmails } from '@/mock/data'
import type { RiskSample, RiskLevel, EmailDraft } from '@/types'

usePageTitle('风险样本库')

const message = useMessage()

const allSamples = ref<RiskSample[]>([...mockRisks])
const filterReason = ref<string | null>(null)
const filterLevel = ref<string | null>(null)
const filterTags = ref<string[]>([])
const dateRange = ref<[number, number] | null>(null)
const drawerVisible = ref(false)
const currentSample = ref<RiskSample | null>(null)

const today = new Date()
const defaultStart = new Date(today); defaultStart.setMonth(defaultStart.getMonth() - 1)
const defaultDateRange = ([defaultStart.getTime(), today.getTime()] as [number, number])

const pagination = reactive({ page: 1, pageSize: 9 })

const reasonOptions: SelectOption[] = [
  { label: '绝对化用语', value: '绝对化用语' },
  { label: '违规承诺收益', value: '违规承诺收益' },
  { label: '多项严重违规', value: '多项严重违规' },
  { label: '风险提示缺失', value: '风险提示缺失' },
  { label: '表述优化建议', value: '表述优化建议' },
  { label: '安全事件', value: '安全事件' },
  { label: '客户体验风险', value: '客户体验风险' }
]

const levelOptions: SelectOption[] = [
  { label: '无风险', value: 'none' },
  { label: '低风险', value: 'low' },
  { label: '中风险', value: 'medium' },
  { label: '高风险', value: 'high' },
  { label: '严重风险', value: 'critical' }
]

const categoryTagsMap: Record<string, string[]> = {
  compliance_violation: ['合规违规', '广告法'],
  missing_disclaimer: ['风险提示', '合规'],
  critical_violation: ['典型案例', '高风险'],
  minor_optimization: ['优化建议', '低优先级'],
  security_incident: ['安全', '账户安全', '应急'],
  customer_experience: ['客户体验', '投诉风险']
}

function sampleTags(s: RiskSample) {
  return categoryTagsMap[s.sampleCategory] || ['未分类']
}

const pendingCount = computed(() => allSamples.value.filter(s => !s.handled).length)

const filteredSamples = computed(() => {
  return allSamples.value.filter(s => {
    if (filterReason.value && s.riskType !== filterReason.value) return false
    if (filterLevel.value && s.riskLevel !== filterLevel.value) return false
    if (filterTags.value.length > 0) {
      const tags = sampleTags(s)
      const ok = filterTags.value.some(t => tags.includes(t))
      if (!ok) return false
    }
    if (dateRange.value) {
      const t = new Date(s.detectedAt).getTime()
      if (t < dateRange.value[0] || t > dateRange.value[1]) return false
    }
    return true
  })
})

function levelBarClass(level: RiskLevel) {
  switch (level) {
    case 'critical': return 'bg-red-600'
    case 'high': return 'bg-red-400'
    case 'medium': return 'bg-amber-gold-500'
    case 'low': return 'bg-emerald-400'
    default: return 'bg-slate-300'
  }
}

function reasonTagType(s: RiskSample): 'error' | 'warning' | 'info' {
  if (s.riskLevel === 'critical' || s.riskLevel === 'high') return 'error'
  if (s.riskLevel === 'medium') return 'warning'
  return 'info'
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}
function formatFull(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const salesMap: Record<string, string> = {
  user_001: '系统管理员', user_002: '张复核', user_003: '李运营', system: '系统'
}
function getSalesName(id?: string) {
  if (!id) return '未知'
  return salesMap[id] || id
}

const sampleReviewRecord = computed<EmailDraft | null>(() => {
  if (!currentSample.value) return null
  return mockEmails.find(e => e.id === currentSample.value!.emailId) || null
})

function openDetail(s: RiskSample) {
  currentSample.value = s
  drawerVisible.value = true
}

function markAsTraining(s: RiskSample) {
  s.handled = true
  s.handledAt = new Date().toISOString()
  s.handledBy = 'user_001'
  s.handlerComment = (s.handlerComment || '') + ' 已纳入AI训练负例样本集。'
  message.success('已标记为训练负例，将用于下一版本模型优化')
}

function handleSample(s: RiskSample) {
  s.handled = true
  s.handledAt = new Date().toISOString()
  s.handledBy = 'user_001'
  s.handlerComment = s.handlerComment || '人工复核，确认风险并处理完毕。'
  message.success('样本已标记处理完成')
}

function resetFilters() {
  filterReason.value = null
  filterLevel.value = null
  filterTags.value = []
  dateRange.value = null
  pagination.page = 1
}
</script>
