<script setup lang="ts">
import {
  Phone, User, Wallet, Calendar, Star, ChevronDown, ChevronUp,
  CheckCircle2, Clock, XCircle, Send, AlertTriangle, MessageSquare,
  FileText, Filter, AlertCircle, History, CalendarDays,
} from 'lucide-vue-next'
import type { Customer, ChurnReason, QuoteVersion, FollowUpPlan } from '~/stores/customers'

const route = useRoute()
const customerId = computed(() => route.params.id as string)

const customer = ref<Customer>({
  id: '1', name: '张伟', phone: '138****1234', gender: 'male',
  tags: ['种植牙', 'VIP', '高意向', '朋友推荐'], level: 'vip',
  advisorId: '1', advisorName: '林医生', advisorAvatar: undefined,
  totalConsumption: 58600, visitCount: 12, leadQuality: 'A',
  sourceChannel: '朋友推荐', intention: '全口种植牙',
  followUpPreference: '周末上午', createdAt: '2025-08-15',
})

const churnReasons = ref<ChurnReason[]>([
  {
    id: 'cr1', reason: '价格过高', detail: '客户表示预算有限，对比后选择了其他诊所的低价方案。',
    relatedQuoteId: 'q2', createdAt: '2026-05-20 14:30', createdBy: '林医生',
  },
  {
    id: 'cr2', reason: '竞品选择', detail: '客户朋友介绍了另一家诊所，方案类似价格低约15%。',
    relatedQuoteId: 'q3', createdAt: '2026-06-10 09:15', createdBy: '张顾问',
  },
])

const quotes = ref<QuoteVersion[]>([
  {
    id: 'q1', version: 'V1.0', amount: 52000, expireAt: '2026-04-15', status: 'expired', statusText: '已过期',
    expireReason: '客户因资金原因推迟，最终选择等待优惠活动',
    items: [
      { name: '韩国登腾种植体', quantity: 4, unitPrice: 8000, subtotal: 32000 },
      { name: '基台+全瓷冠', quantity: 4, unitPrice: 5000, subtotal: 20000 },
    ],
    responseNodes: [
      { name: '发送报价', responsible: '林医生', deadline: '2026-03-01', completed: true, completedAt: '2026-03-01', delayDays: 0 },
      { name: '客户确认', responsible: '张伟', deadline: '2026-03-08', completed: true, completedAt: '2026-03-10', delayDays: 2 },
      { name: '方案调整', responsible: '林医生', deadline: '2026-03-15', completed: true, completedAt: '2026-03-18', delayDays: 3 },
      { name: '最终决策', responsible: '张伟', deadline: '2026-04-15', completed: false, delayDays: undefined },
    ],
    createdAt: '2026-03-01 10:00',
  },
  {
    id: 'q2', version: 'V2.0', amount: 48600, expireAt: '2026-05-20', status: 'expired', statusText: '已过期',
    expireReason: '价格过高，客户选择了竞品',
    items: [
      { name: '韩国奥齿泰种植体', quantity: 4, unitPrice: 6800, subtotal: 27200 },
      { name: '基台+全瓷冠', quantity: 4, unitPrice: 5000, subtotal: 20000 },
      { name: '术后护理套餐', quantity: 1, unitPrice: 1400, subtotal: 1400 },
    ],
    responseNodes: [
      { name: '发送报价', responsible: '林医生', deadline: '2026-04-20', completed: true, completedAt: '2026-04-20', delayDays: 0 },
      { name: '客户确认', responsible: '张伟', deadline: '2026-04-27', completed: true, completedAt: '2026-04-28', delayDays: 1 },
      { name: '方案调整', responsible: '王医生', deadline: '2026-05-05', completed: true, completedAt: '2026-05-08', delayDays: 3 },
      { name: '最终决策', responsible: '张伟', deadline: '2026-05-20', completed: false, delayDays: undefined },
    ],
    createdAt: '2026-04-20 15:30',
  },
  {
    id: 'q3', version: 'V3.0', amount: 46800, expireAt: '2026-06-30', status: 'pending', statusText: '待确认',
    items: [
      { name: '韩国奥齿泰种植体', quantity: 4, unitPrice: 6500, subtotal: 26000 },
      { name: '基台+全瓷冠（优惠）', quantity: 4, unitPrice: 4500, subtotal: 18000 },
      { name: '洁牙赠品', quantity: 1, unitPrice: 0, subtotal: 0 },
      { name: '终身质保服务', quantity: 1, unitPrice: 2800, subtotal: 2800 },
    ],
    responseNodes: [
      { name: '发送报价', responsible: '林医生', deadline: '2026-06-10', completed: true, completedAt: '2026-06-10', delayDays: 0 },
      { name: '客户确认', responsible: '张伟', deadline: '2026-06-17', completed: false, delayDays: undefined },
      { name: '方案调整', responsible: '林医生', deadline: '2026-06-22', completed: false, delayDays: undefined },
      { name: '最终决策', responsible: '张伟', deadline: '2026-06-30', completed: false, delayDays: undefined },
    ],
    createdAt: '2026-06-10 11:00',
  },
])

const expandedQuoteId = ref<string>('q3')

function toggleQuote(id: string) {
  expandedQuoteId.value = expandedQuoteId.value === id ? '' : id
}

const followUpPlans = ref<FollowUpPlan[]>([
  { id: 'fp1', date: '2026-06-18', type: '电话回访', content: '确认V3.0报价意向，询问是否需要预约面诊', responsible: '林医生', completed: false, createdAt: '2026-06-15 10:00' },
  { id: 'fp2', date: '2026-06-22', type: '到店面诊', content: '安排种植方案最终确认，携带CT片', responsible: '林医生', completed: false, createdAt: '2026-06-15 10:05' },
  { id: 'fp3', date: '2026-06-10', type: '微信跟进', content: '发送V3.0报价详情及案例图', responsible: '张顾问', completed: true, createdAt: '2026-06-08 14:00' },
  { id: 'fp4', date: '2026-06-01', type: '电话回访', content: 'V2.0报价过期后回访，了解原因', responsible: '张顾问', completed: true, createdAt: '2026-05-30 09:00' },
  { id: 'fp5', date: '2026-05-15', type: '到店检查', content: '口腔CT复查，评估种植条件', responsible: '林医生', completed: true, createdAt: '2026-05-12 16:00' },
])

const churnReasonButtons = [
  { key: 'price', label: '价格过高', icon: Wallet },
  { key: 'competitor', label: '竞品选择', icon: AlertTriangle },
  { key: 'need_change', label: '需求变更', icon: Filter },
  { key: 'lost_contact', label: '客户失联', icon: Phone },
  { key: 'service', label: '服务不满', icon: MessageSquare },
  { key: 'other', label: '其他原因', icon: FileText },
]

const selectedChurnReasons = ref<string[]>([])
const churnDetail = ref('')
const relatedQuote = ref('')
const submittingChurn = ref(false)

function toggleChurnReason(k: string) {
  const i = selectedChurnReasons.value.indexOf(k)
  if (i === -1) selectedChurnReasons.value.push(k)
  else selectedChurnReasons.value.splice(i, 1)
}

async function submitChurn() {
  if (selectedChurnReasons.value.length === 0) return
  submittingChurn.value = true
  await new Promise(r => setTimeout(r, 600))
  const newItem: ChurnReason = {
    id: 'cr' + Date.now(),
    reason: churnReasonButtons.find(b => selectedChurnReasons.value[0] === b.key)?.label || '其他',
    detail: churnDetail.value,
    relatedQuoteId: relatedQuote.value || undefined,
    createdAt: new Date().toLocaleString('zh-CN'),
    createdBy: customer.value.advisorName,
  }
  churnReasons.value.unshift(newItem)
  selectedChurnReasons.value = []
  churnDetail.value = ''
  relatedQuote.value = ''
  submittingChurn.value = false
}

const followUpDate = ref(new Date().toISOString().slice(0, 10))
const followUpType = ref('电话回访')
const followUpContent = ref('')
const followUpResponsible = ref(customer.value.advisorId)
const submittingFollow = ref(false)

const followUpTypeOptions = [
  { label: '电话回访', value: '电话回访' },
  { label: '微信跟进', value: '微信跟进' },
  { label: '到店面诊', value: '到店面诊' },
  { label: '短信提醒', value: '短信提醒' },
  { label: '上门服务', value: '上门服务' },
]

const responsibleOptions = [
  { label: '林医生', value: '1' },
  { label: '王医生', value: '2' },
  { label: '张顾问', value: '3' },
  { label: '刘顾问', value: '4' },
]

async function submitFollowUp() {
  if (!followUpContent.value) return
  submittingFollow.value = true
  await new Promise(r => setTimeout(r, 500))
  const respName = responsibleOptions.find(o => o.value === followUpResponsible.value)?.label || ''
  const newPlan: FollowUpPlan = {
    id: 'fp' + Date.now(),
    date: followUpDate.value,
    type: followUpType.value,
    content: followUpContent.value,
    responsible: respName,
    completed: false,
    createdAt: new Date().toLocaleString('zh-CN'),
  }
  followUpPlans.value.unshift(newPlan)
  followUpContent.value = ''
  submittingFollow.value = false
}

const levelColorMap: Record<string, string> = {
  normal: 'bg-gray-100 text-gray-700', silver: 'bg-slate-100 text-slate-700',
  gold: 'bg-amber-50 text-amber-700', vip: 'bg-primary-100 text-primary-700',
  diamond: 'bg-violet-100 text-violet-700',
}
const levelLabelMap: Record<string, string> = {
  normal: '普通', silver: '银卡', gold: '金卡', vip: 'VIP', diamond: '钻石',
}
const qualityColorMap: Record<string, string> = {
  A: 'bg-emerald-100 text-emerald-700', B: 'bg-sky-100 text-sky-700',
  C: 'bg-amber-100 text-amber-700', D: 'bg-gray-100 text-gray-600',
}
const tagColors = [
  'bg-rose-100 text-rose-700', 'bg-violet-100 text-violet-700',
  'bg-amber-100 text-amber-700', 'bg-sky-100 text-sky-700',
  'bg-emerald-100 text-emerald-700', 'bg-primary-100 text-primary-700',
]
function getTagColor(i: number) { return tagColors[i % tagColors.length] }

const quoteStatusColor: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  accepted: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  expired: 'bg-red-100 text-red-700 border-red-200',
  rejected: 'bg-gray-100 text-gray-600 border-gray-200',
}
</script>

<template>
  <div class="p-6 space-y-5 bg-gray-50 min-h-screen">
    <UCard class="border-0 shadow-card overflow-hidden bg-gradient-to-br from-white to-primary-50/30">
      <template #body>
        <div class="flex flex-col lg:flex-row lg:items-center gap-6">
          <div class="flex items-center gap-5 flex-1">
            <div class="relative">
              <div class="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-3xl shadow-lg shadow-primary-500/30">
                {{ customer.name.charAt(0) }}
              </div>
              <div :class="['absolute -bottom-1 -right-1 w-7 h-7 rounded-full border-4 border-white flex items-center justify-center font-bold text-sm', qualityColorMap[customer.leadQuality]]">
                {{ customer.leadQuality }}
              </div>
            </div>
            <div>
              <div class="flex items-center gap-3 mb-2">
                <h1 class="text-2xl font-bold text-gray-800">{{ customer.name }}</h1>
                <UBadge size="sm" variant="solid" class="!bg-primary-500 !border-primary-500">
                  {{ levelLabelMap[customer.level] }}
                </UBadge>
                <span :class="['text-xs font-medium px-2.5 py-1 rounded-full border', levelColorMap[customer.level]]">
                  {{ customer.level.toUpperCase() }}
                </span>
              </div>
              <div class="flex flex-wrap gap-2 mb-3">
                <UBadge
                  v-for="(tag, idx) in customer.tags"
                  :key="tag"
                  size="sm"
                  variant="subtle"
                  :class="getTagColor(idx)"
                >
                  {{ tag }}
                </UBadge>
              </div>
              <div class="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500">
                <span class="flex items-center gap-1.5"><Phone class="w-4 h-4" />{{ customer.phone }}</span>
                <span class="flex items-center gap-1.5"><Star class="w-4 h-4" />来源：{{ customer.sourceChannel }}</span>
                <span class="flex items-center gap-1.5"><FileText class="w-4 h-4" />意向：{{ customer.intention }}</span>
                <span class="flex items-center gap-1.5"><CalendarDays class="w-4 h-4" />偏好：{{ customer.followUpPreference }}</span>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-4 lg:gap-8">
            <div class="text-center lg:px-6 lg:py-2 lg:border-x border-gray-100">
              <div class="w-12 h-12 mx-auto rounded-xl bg-primary-50 flex items-center justify-center mb-2">
                <User class="w-6 h-6 text-primary-500" />
              </div>
              <p class="text-xs text-gray-400 mb-1">归属顾问</p>
              <p class="font-semibold text-gray-800">{{ customer.advisorName }}</p>
            </div>
            <div class="text-center lg:px-6 lg:py-2">
              <div class="w-12 h-12 mx-auto rounded-xl bg-amber-50 flex items-center justify-center mb-2">
                <Wallet class="w-6 h-6 text-amber-500" />
              </div>
              <p class="text-xs text-gray-400 mb-1">累计消费</p>
              <p class="font-bold text-lg text-primary-600">¥{{ customer.totalConsumption.toLocaleString() }}</p>
            </div>
            <div class="text-center lg:px-6 lg:py-2 lg:border-x border-gray-100">
              <div class="w-12 h-12 mx-auto rounded-xl bg-emerald-50 flex items-center justify-center mb-2">
                <Calendar class="w-6 h-6 text-emerald-500" />
              </div>
              <p class="text-xs text-gray-400 mb-1">到店次数</p>
              <p class="font-bold text-lg text-gray-800">{{ customer.visitCount }} 次</p>
            </div>
          </div>
        </div>
      </template>
    </UCard>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
      <UCard class="lg:col-span-3 border-0 shadow-card">
        <template #body>
          <div class="flex items-center gap-2 mb-4">
            <div class="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
              <AlertCircle class="w-4 h-4 text-red-500" />
            </div>
            <h2 class="font-semibold text-gray-800">流失原因记录</h2>
          </div>

          <div class="space-y-2 mb-4">
            <p class="text-xs text-gray-500 font-medium">快选原因（可多选）</p>
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="b in churnReasonButtons"
                :key="b.key"
                :class="[
                  'p-2.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all',
                  selectedChurnReasons.includes(b.key)
                    ? 'bg-red-50 border-red-200 text-red-700 shadow-sm'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                ]"
                @click="toggleChurnReason(b.key)"
              >
                <component :is="b.icon" class="w-3.5 h-3.5" />
                {{ b.label }}
              </button>
            </div>
          </div>

          <UFormGroup label="关联报价" class="mb-3">
            <USelect
              v-model="relatedQuote"
              placeholder="选择关联的报价版本"
              :options="[
                { label: '不关联', value: '' },
                ...quotes.map(q => ({ label: `${q.version} - ¥${q.amount}`, value: q.id }))
              ]"
              size="sm"
            />
          </UFormGroup>

          <UFormGroup label="详细说明" class="mb-4">
            <textarea
              v-model="churnDetail"
              rows="3"
              placeholder="记录流失的具体情况、客户反馈等..."
              class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 resize-none"
            />
          </UFormGroup>

          <UButton block color="red" variant="outline" size="sm" :loading="submittingChurn" @click="submitChurn">
            <template #leading><Send class="w-4 h-4" /></template>
            提交流失记录
          </UButton>

          <div class="mt-5 pt-5 border-t border-gray-100">
            <div class="flex items-center gap-2 mb-3">
              <History class="w-4 h-4 text-gray-400" />
              <p class="text-xs font-medium text-gray-500">历史记录 ({{ churnReasons.length }})</p>
            </div>
            <div class="space-y-3 max-h-80 overflow-y-auto pr-1">
              <div v-for="cr in churnReasons" :key="cr.id" class="p-3 rounded-xl bg-gray-50 border border-gray-100">
                <div class="flex items-center justify-between mb-1.5">
                  <UBadge size="xs" color="red" variant="subtle">{{ cr.reason }}</UBadge>
                  <span class="text-xs text-gray-400">{{ cr.createdAt }}</span>
                </div>
                <p class="text-xs text-gray-600 leading-relaxed">{{ cr.detail }}</p>
                <p class="text-xs text-gray-400 mt-2">记录人：{{ cr.createdBy }}</p>
              </div>
            </div>
          </div>
        </template>
      </UCard>

      <UCard class="lg:col-span-6 border-0 shadow-card">
        <template #body>
          <div class="flex items-center gap-2 mb-4">
            <div class="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
              <FileText class="w-4 h-4 text-violet-500" />
            </div>
            <h2 class="font-semibold text-gray-800">报价版本时间轴</h2>
            <UBadge size="sm" variant="subtle" color="violet">{{ quotes.length }} 个版本</UBadge>
          </div>

          <div class="relative">
            <div class="absolute left-5 top-2 bottom-2 w-0.5 bg-gradient-to-b from-violet-200 via-gray-200 to-gray-100"></div>
            <div class="space-y-4">
              <div v-for="q in quotes" :key="q.id" class="relative pl-14">
                <div
                  :class="[
                    'absolute left-3 top-4 w-5 h-5 rounded-full border-4 border-white shadow-md z-10',
                    q.status === 'accepted' ? 'bg-emerald-500' :
                    q.status === 'expired' ? 'bg-red-500' :
                    q.status === 'rejected' ? 'bg-gray-400' : 'bg-amber-500'
                  ]"
                ></div>
                <div
                  class="rounded-2xl border border-gray-100 bg-white overflow-hidden hover:shadow-cardHover transition-shadow"
                  :class="{ 'ring-2 ring-primary-200': expandedQuoteId === q.id }"
                >
                  <div
                    class="p-4 cursor-pointer flex items-center justify-between"
                    @click="toggleQuote(q.id)"
                  >
                    <div class="flex items-center gap-4">
                      <div>
                        <div class="flex items-center gap-2 mb-1">
                          <span class="font-bold text-gray-800">{{ q.version }}</span>
                          <UBadge size="xs" variant="outline" :class="quoteStatusColor[q.status]">{{ q.statusText }}</UBadge>
                        </div>
                        <p class="text-xs text-gray-400">创建于 {{ q.createdAt }} · 截止 {{ q.expireAt }}</p>
                      </div>
                    </div>
                    <div class="flex items-center gap-5">
                      <div class="text-right">
                        <p class="text-xs text-gray-400">报价金额</p>
                        <p class="text-xl font-bold text-primary-600">¥{{ q.amount.toLocaleString() }}</p>
                      </div>
                      <div :class="['w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center transition-transform', expandedQuoteId === q.id ? 'rotate-180' : '']">
                        <ChevronDown class="w-4 h-4 text-gray-500" />
                      </div>
                    </div>
                  </div>

                  <Transition name="expand">
                    <div v-if="expandedQuoteId === q.id" class="px-4 pb-4 border-t border-gray-50">
                      <div v-if="q.status === 'expired' && q.expireReason" class="my-4 p-3 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3">
                        <AlertTriangle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p class="text-xs font-semibold text-red-700 mb-1">过期原因说明</p>
                          <p class="text-sm text-red-600">{{ q.expireReason }}</p>
                        </div>
                      </div>

                      <div class="grid grid-cols-2 gap-5 mt-4">
                        <div>
                          <p class="text-xs font-semibold text-gray-500 mb-2">报价明细</p>
                          <div class="rounded-xl border border-gray-100 overflow-hidden">
                            <table class="w-full text-sm">
                              <thead class="bg-gray-50 text-xs text-gray-500">
                                <tr>
                                  <th class="text-left px-3 py-2 font-medium">项目</th>
                                  <th class="text-right px-3 py-2 font-medium w-12">数</th>
                                  <th class="text-right px-3 py-2 font-medium w-16">小计</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr v-for="(it, i) in q.items" :key="i" class="border-t border-gray-50">
                                  <td class="px-3 py-2 text-gray-700">{{ it.name }}</td>
                                  <td class="px-3 py-2 text-right text-gray-500">x{{ it.quantity }}</td>
                                  <td class="px-3 py-2 text-right font-medium text-gray-800">¥{{ it.subtotal.toLocaleString() }}</td>
                                </tr>
                              </tbody>
                              <tfoot class="bg-primary-50/50">
                                <tr>
                                  <td colspan="2" class="px-3 py-2 text-xs font-semibold text-primary-700">合计</td>
                                  <td class="px-3 py-2 text-right font-bold text-primary-700">¥{{ q.amount.toLocaleString() }}</td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </div>

                        <div>
                          <p class="text-xs font-semibold text-gray-500 mb-2">响应节点</p>
                          <div class="space-y-2">
                            <div
                              v-for="(node, idx) in q.responseNodes"
                              :key="idx"
                              :class="[
                                'p-2.5 rounded-xl border flex items-center justify-between gap-3',
                                node.completed ? 'bg-emerald-50/60 border-emerald-100' :
                                node.delayDays ? 'bg-red-50/60 border-red-100' :
                                'bg-amber-50/60 border-amber-100'
                              ]"
                            >
                              <div class="flex items-center gap-2 flex-1 min-w-0">
                                <div :class="[
                                  'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0',
                                  node.completed ? 'bg-emerald-500' :
                                  node.delayDays ? 'bg-red-500' : 'bg-amber-500'
                                ]">
                                  <CheckCircle2 v-if="node.completed" class="w-3.5 h-3.5 text-white" />
                                  <Clock v-else class="w-3.5 h-3.5 text-white" />
                                </div>
                                <div class="min-w-0">
                                  <p class="text-sm font-medium text-gray-800">{{ node.name }}</p>
                                  <p class="text-xs text-gray-500 truncate">责任人：{{ node.responsible }}</p>
                                </div>
                              </div>
                              <div class="text-right flex-shrink-0">
                                <p class="text-xs text-gray-400">截止 {{ node.deadline }}</p>
                                <p v-if="node.delayDays" class="text-xs text-red-500 font-medium">延误 {{ node.delayDays }} 天</p>
                                <p v-else-if="node.completed" class="text-xs text-emerald-600 font-medium">按时完成</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Transition>
                </div>
              </div>
            </div>
          </div>
        </template>
      </UCard>

      <UCard class="lg:col-span-3 border-0 shadow-card">
        <template #body>
          <div class="flex items-center gap-2 mb-4">
            <div class="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center">
              <CalendarDays class="w-4 h-4 text-sky-500" />
            </div>
            <h2 class="font-semibold text-gray-800">回访计划</h2>
          </div>

          <div class="space-y-3 mb-4 p-3 rounded-xl bg-gradient-to-br from-sky-50 to-primary-50/30 border border-sky-100">
            <UFormGroup label="回访日期" size="sm">
              <UInput v-model="followUpDate" type="date" size="sm" />
            </UFormGroup>
            <UFormGroup label="回访类型" size="sm">
              <USelect v-model="followUpType" :options="followUpTypeOptions" size="sm" />
            </UFormGroup>
            <UFormGroup label="责任人" size="sm">
              <USelect v-model="followUpResponsible" :options="responsibleOptions" size="sm" />
            </UFormGroup>
            <UFormGroup label="回访内容" size="sm">
              <textarea
                v-model="followUpContent"
                rows="2"
                placeholder="输入回访的具体内容和重点..."
                class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 resize-none bg-white"
              />
            </UFormGroup>
            <UButton block color="primary" size="sm" :loading="submittingFollow" @click="submitFollowUp">
              <template #leading><Send class="w-4 h-4" /></template>
              创建回访计划
            </UButton>
          </div>

          <div class="pt-3 border-t border-gray-100">
            <div class="flex items-center gap-2 mb-3">
              <History class="w-4 h-4 text-gray-400" />
              <p class="text-xs font-medium text-gray-500">回访计划历史 ({{ followUpPlans.length }})</p>
            </div>
            <div class="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
              <div
                v-for="fp in followUpPlans"
                :key="fp.id"
                :class="[
                  'p-3 rounded-xl border transition-all',
                  fp.completed
                    ? 'bg-gray-50 border-gray-100 opacity-75'
                    : 'bg-white border-gray-200 hover:border-primary-200 hover:shadow-sm'
                ]"
              >
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-1.5">
                    <CheckCircle2 v-if="fp.completed" class="w-4 h-4 text-emerald-500" />
                    <Clock v-else class="w-4 h-4 text-amber-500" />
                    <UBadge size="xs" variant="subtle" color="primary">{{ fp.type }}</UBadge>
                  </div>
                  <span class="text-xs text-gray-400">{{ fp.date }}</span>
                </div>
                <p :class="['text-sm text-gray-700 leading-relaxed mb-2', fp.completed && 'line-through text-gray-400']">
                  {{ fp.content }}
                </p>
                <div class="flex items-center justify-between text-xs text-gray-400">
                  <span class="flex items-center gap-1"><User class="w-3 h-3" />{{ fp.responsible }}</span>
                  <span v-if="fp.completed" class="text-emerald-500 font-medium">已完成</span>
                  <span v-else class="text-amber-500 font-medium">待执行</span>
                </div>
              </div>
            </div>
          </div>
        </template>
      </UCard>
    </div>
  </div>
</template>

<style scoped>
.expand-enter-active, .expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}
.expand-enter-from, .expand-leave-to {
  opacity: 0;
  max-height: 0;
  margin-top: 0;
  padding-top: 0;
  padding-bottom: 0;
}
.expand-enter-to, .expand-leave-from {
  max-height: 1000px;
}
</style>
