<template>
  <div class="h-[calc(100vh-180px)] min-h-[640px] flex flex-col space-y-5">
    <div class="flex items-center justify-between flex-wrap gap-3 flex-shrink-0">
      <div>
        <h1 class="font-charter text-2xl font-bold text-deep-blue-900">复核工作台</h1>
        <p class="mt-1 text-sm text-slate-500">审核 AI 生成的邮件草稿，确保合规性与内容质量</p>
      </div>
      <div class="flex items-center space-x-3 text-sm">
        <StatBadge label="待审核" :count="pendingCount" color="amber-gold" />
        <StatBadge label="今日已通过" :count="approvedTodayCount" color="emerald" />
        <StatBadge label="今日已驳回" :count="rejectedTodayCount" color="red" />
      </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-10 gap-5 flex-1 min-h-0">
      <NCard class="!rounded-2xl shadow-sm xl:col-span-3 flex flex-col !p-0" content-style="padding: 0; display: flex; flex-direction: column; height: 100%;">
        <NTabs v-model:value="activeTab" type="line" size="medium" class="!p-4 !pb-0 border-b border-slate-100 flex-shrink-0">
          <NTabPane name="pending" tab="待审核">
            <template #tab>
              <div class="flex items-center px-1 -my-1.5 py-1.5">
                <span>待审核</span>
                <span class="ml-2 bg-amber-gold-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{{ pendingCount }}</span>
              </div>
            </template>
          </NTabPane>
          <NTabPane name="approved" tab="已通过">
            <template #tab>
              <div class="flex items-center px-1 -my-1.5 py-1.5">
                <span>已通过</span>
                <span class="ml-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{{ approvedList.length }}</span>
              </div>
            </template>
          </NTabPane>
          <NTabPane name="rejected" tab="已驳回">
            <template #tab>
              <div class="flex items-center px-1 -my-1.5 py-1.5">
                <span>已驳回</span>
                <span class="ml-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{{ rejectedList.length }}</span>
              </div>
            </template>
          </NTabPane>
        </NTabs>

        <div class="flex-1 overflow-y-auto">
          <div
            v-for="item in currentList"
            :key="item.id"
            class="p-4 border-b border-slate-50 hover:bg-slate-50/60 cursor-pointer transition-colors"
            :class="{ 'bg-deep-blue-50/50': selectedId === item.id }"
            @click="selectEmail(item.id)"
          >
            <div class="flex items-start justify-between mb-2">
              <span class="font-medium text-sm text-slate-800 truncate flex-1 mr-2">
                {{ item.recipientName || item.recipient }}
              </span>
              <StatusTag :status="item.status" type="email" size="small" />
            </div>
            <p class="text-xs text-slate-500 truncate mb-2">{{ item.subject }}</p>
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-2">
                <div class="w-5 h-5 rounded-full bg-deep-blue-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {{ getSalesInitial(item) }}
                </div>
                <span class="text-xs text-slate-400">{{ getSalesName(item) }}</span>
              </div>
              <span class="text-xs text-slate-400">{{ formatTime(item.createdAt) }}</span>
            </div>
            <div v-if="item.riskLevel && item.riskLevel !== 'none'" class="mt-2">
              <StatusTag :status="item.riskLevel" type="risk" size="small" />
            </div>
          </div>
          <div v-if="currentList.length === 0" class="py-16 text-center">
            <p class="text-slate-300 text-sm">暂无数据</p>
          </div>
        </div>
      </NCard>

      <NCard class="!rounded-2xl shadow-sm xl:col-span-7 flex flex-col !p-0" content-style="padding: 0; display: flex; flex-direction: column; height: 100%;">
        <div v-if="!selected" class="flex-1 flex items-center justify-center">
          <div class="text-center">
            <div class="w-24 h-24 mx-auto mb-4 rounded-2xl bg-slate-50 flex items-center justify-center">
              <NIcon :size="44" color="#CBD5E1"><MailOutlined /></NIcon>
            </div>
            <p class="text-slate-400 font-medium">请从左侧列表选择待复核的邮件</p>
          </div>
        </div>
        <template v-else>
          <div class="p-5 border-b border-slate-100 flex items-start justify-between flex-shrink-0">
            <div class="flex-1 min-w-0 pr-4">
              <div class="flex items-center gap-2 mb-2 flex-wrap">
                <h3 class="font-charter font-bold text-lg text-deep-blue-900 truncate">{{ selected.subject || '(无主题)' }}</h3>
                <StatusTag :status="selected.status" type="email" size="small" />
                <StatusTag v-if="selected.riskLevel" :status="selected.riskLevel" type="risk" size="small" />
              </div>
              <div class="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                <span class="flex items-center">
                  <NIcon :size="12" class="mr-1"><UserOutlined /></NIcon>
                  收件人：{{ selected.recipient }}
                </span>
                <span class="flex items-center">
                  <NIcon :size="12" class="mr-1"><ClockCircleOutlined /></NIcon>
                  生成于 {{ formatTime(selected.createdAt) }}
                </span>
                <span>销售：{{ getSalesName(selected) }}</span>
              </div>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto p-5 space-y-5 min-h-0">
            <div>
              <label class="block text-xs text-slate-500 font-bold mb-2 flex items-center">
                <NIcon :size="12" class="mr-1"><FileTextOutlined /></NIcon>
                邮件正文
              </label>
              <div class="bg-slate-50/60 border border-slate-100 rounded-xl p-4 whitespace-pre-wrap text-sm text-slate-700 leading-relaxed">
                {{ selected.content }}
              </div>
            </div>

            <div v-if="selected.aiSuggestion">
              <label class="block text-xs text-slate-500 font-bold mb-2 flex items-center">
                <NIcon :size="12" class="mr-1"><BulbOutlined /></NIcon>
                AI 智能建议
              </label>
              <div class="bg-gradient-to-r from-amber-gold-50 to-white border border-amber-gold-200/60 rounded-xl p-4 text-sm text-slate-700">
                {{ selected.aiSuggestion }}
              </div>
            </div>

            <div>
              <label class="block text-xs text-slate-500 font-bold mb-2 flex items-center">
                <NIcon :size="12" class="mr-1"><EditOutlined /></NIcon>
                复核编辑（支持修改后通过）
              </label>
              <DiffViewer
                :left-text="selected.content"
                v-model:right-text="modifiedContent"
                :editable="true"
                left-label="AI 生成原文"
                right-label="修改后版本"
              />
            </div>
          </div>

          <div class="p-5 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap flex-shrink-0 bg-slate-50/40 rounded-b-2xl">
            <div class="flex items-center space-x-2 text-xs text-slate-500">
              <span>快捷操作：</span>
              <NButton size="tiny" quaternary @click="quickFix">一键套用合规话术</NButton>
              <NButton size="tiny" quaternary @click="undoModifications">撤销修改</NButton>
            </div>
            <div class="flex items-center space-x-3">
              <NDropdown :options="rejectOptions" trigger="click" @select="handleRejectSelect">
                <NButton type="error" size="medium" class="shadow-md">
                  <NIcon :size="14" class="mr-1.5"><CloseCircleOutlined /></NIcon>
                  驳回
                </NButton>
              </NDropdown>
              <NButton type="primary" size="medium" class="!px-6 shadow-md" @click="approveEmail">
                <NIcon :size="14" class="mr-1.5"><CheckCircleOutlined /></NIcon>
                ✅ 一键通过
              </NButton>
            </div>
          </div>
        </template>
      </NCard>
    </div>

    <NModal v-model:show="rejectModalVisible" preset="card" title="驳回邮件" style="width: 520px;">
      <RejectReasonSelector v-model="rejectData" />
      <template #footer>
        <div class="flex justify-end space-x-2">
          <NButton @click="rejectModalVisible = false">取消</NButton>
          <NButton type="error" @click="confirmReject">确认驳回</NButton>
        </div>
      </template>
    </NModal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, h, watch, defineComponent, PropType, onMounted } from 'vue'
import {
  NCard, NTabs, NTabPane, NButton, NIcon, NModal, NDropdown, useMessage, useDialog,
  type DropdownOption, type DropdownGroupOption, type DropdownDividerOption
} from 'naive-ui'
import {
  MailOutlined, UserOutlined, ClockCircleOutlined, FileTextOutlined,
  CheckCircleOutlined, CloseCircleOutlined, EditOutlined, BulbOutlined
} from '@vicons/antd'
import StatusTag from '@/components/business/StatusTag.vue'
import DiffViewer from '@/components/business/DiffViewer.vue'
import RejectReasonSelector from '@/components/business/RejectReasonSelector.vue'
import { usePageTitle } from '@/composables/usePageTitle'
import { getPendingReviewListApi, approveReviewApi, rejectReviewApi } from '@/api/modules/reviews'
import type { EmailDraft } from '@/types'

usePageTitle('复核工作台')

const message = useMessage()
const dialog = useDialog()

const pendingEmails = ref<EmailDraft[]>([])
const approvedEmails = ref<EmailDraft[]>([])
const rejectedEmails = ref<EmailDraft[]>([])
const activeTab = ref<'pending' | 'approved' | 'rejected'>('pending')
const selectedId = ref<string | null>(null)
const modifiedContent = ref('')
const rejectModalVisible = ref(false)
const rejectReason = ref<string | null>(null)
const rejectData = reactive({ reasons: [] as string[], remark: '' })

watch(selectedId, (id) => {
  const allList = [...pendingEmails.value, ...approvedEmails.value, ...rejectedEmails.value]
  const s = allList.find(e => e.id === id)
  if (s) modifiedContent.value = s.content
})

const pendingList = computed(() => pendingEmails.value)
const approvedList = computed(() => approvedEmails.value)
const rejectedList = computed(() => rejectedEmails.value)

const pendingCount = computed(() => pendingEmails.value.length)
const approvedTodayCount = computed(() =>
  approvedEmails.value.filter(e => isToday(e.reviewedAt || e.createdAt)).length
)
const rejectedTodayCount = computed(() =>
  rejectedEmails.value.filter(e => isToday(e.reviewedAt || e.createdAt)).length
)

const currentList = computed(() => {
  if (activeTab.value === 'pending') return pendingEmails.value
  if (activeTab.value === 'approved') return approvedEmails.value
  return rejectedEmails.value
})

const selected = computed(() => {
  const allList = [...pendingEmails.value, ...approvedEmails.value, ...rejectedEmails.value]
  return allList.find(e => e.id === selectedId.value) || null
})

async function fetchLists() {
  try {
    const [p, a, r] = await Promise.all([
      getPendingReviewListApi({ page: 1, perPage: 200, status: 'submitted' }),
      getPendingReviewListApi({ page: 1, perPage: 200, status: 'approved' }),
      getPendingReviewListApi({ page: 1, perPage: 200, status: 'rejected' }),
    ])
    pendingEmails.value = p.list
    approvedEmails.value = a.list
    rejectedEmails.value = r.list
  } catch (e) {
  }
}

onMounted(fetchLists)

function isToday(iso: string) {
  const d = new Date(iso)
  const t = new Date()
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate()
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function getSalesInitial(email: EmailDraft) {
  return (getSalesName(email) || 'S').charAt(0)
}
function getSalesName(email: EmailDraft) {
  if (!email.generatedBy) return '系统'
  if (email.generatedBy === 'system') return '系统'
  if (typeof email.generatedBy === 'number') return `销售-${email.generatedBy}`
  const map: Record<string, string> = { user_001: '系统管理员', user_002: '张复核', user_003: '李运营' }
  return map[email.generatedBy] || String(email.generatedBy)
}

function selectEmail(id: string) {
  selectedId.value = id
}

async function approveEmail() {
  if (!selected.value) return
  dialog.success({
    title: '确认通过',
    content: modifiedContent.value !== selected.value.content
      ? '检测到内容已修改，将保存修改并通过复核。确认通过吗？'
      : '确认通过此邮件复核？通过后邮件状态将更新为"已通过"。',
    positiveText: '确认通过',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await approveReviewApi(
          selected.value!.id,
          modifiedContent.value !== selected.value!.content ? modifiedContent.value : undefined
        )
        message.success('复核通过')
        selectedId.value = null
        await fetchLists()
      } catch {}
    }
  })
}

const rejectOptions: Array<DropdownOption | DropdownGroupOption | DropdownDividerOption> = [
  { label: '绝对化用语', key: 'abs_language' },
  { label: '违规承诺收益', key: 'promise_profit' },
  { label: '缺少风险提示', key: 'missing_risk' },
  { type: 'divider' as const },
  { label: '自定义原因...', key: 'custom' }
]

function handleRejectSelect(key: string | number) {
  if (!selected.value) return
  rejectData.reasons = key === 'custom' ? [] : [String(key)]
  rejectData.remark = ''
  rejectModalVisible.value = true
}

async function confirmReject() {
  if (!selected.value) return
  if (rejectData.reasons.length === 0 && !rejectData.remark.trim()) {
    message.warning('请至少选择一个驳回原因或填写备注')
    return
  }
  try {
    const code = rejectData.reasons[0] || 'OTHER'
    await rejectReviewApi(selected.value.id, code, rejectData.remark)
    rejectModalVisible.value = false
    message.success('已驳回，销售将收到通知')
    selectedId.value = null
    await fetchLists()
  } catch {}
}

function quickFix() {
  if (!selected.value) return
  modifiedContent.value = selected.value.content
    .replace(/最[佳好高优]/g, '极具竞争力的')
    .replace(/绝对/g, '相对')
    .replace(/稳赚不赔/g, '历史表现稳健（不代表未来）')
    .replace(/保本保收益/g, '力求本金稳健增值')
  + '\n\n【风险提示】理财非存款，产品有风险，投资须谨慎。过往业绩不代表未来表现。'
  message.success('已套用合规话术，建议再次检查')
}

function undoModifications() {
  if (!selected.value) return
  modifiedContent.value = selected.value.content
  message.info('已撤销所有修改')
}

const StatBadge = defineComponent({
  props: { label: String, count: Number, color: { type: String as PropType<string>, default: 'deep-blue' } },
  setup(props) {
    const map: Record<string, string> = {
      'amber-gold': 'bg-amber-gold-50 text-amber-gold-700 border-amber-gold-200',
      'emerald': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'red': 'bg-red-50 text-red-700 border-red-200',
      'deep-blue': 'bg-deep-blue-50 text-deep-blue-700 border-deep-blue-200'
    }
    return () => h('div', { class: `px-4 py-2 rounded-xl border ${map[props.color] || map['deep-blue']}` }, [
      h('span', { class: 'text-xs opacity-80 mr-2' }, props.label),
      h('span', { class: 'font-charter font-bold text-lg' }, String(props.count))
    ])
  }
})
</script>
