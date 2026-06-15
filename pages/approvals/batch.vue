<script setup lang="ts">
import {
  CheckCircle2, XCircle, AlertTriangle, ChevronRight, Eye, Play,
  Users, Tag, Crown, FileText, ArrowRight, RotateCcw, Sparkles,
  AlertCircle, UserPlus, ShieldCheck, Zap, Clock
} from 'lucide-vue-next'

interface CustomerItem {
  id: string
  name: string
  phone: string
  avatarColor: string
  current: { level: string; tags: string[]; advisor: string }
}

const approvalTypes = [
  { key: 'level', label: '等级升级', icon: Crown, color: 'from-amber-400 to-orange-500', bg: 'bg-amber-50', text: 'text-amber-600' },
  { key: 'tags', label: '添加标签', icon: Tag, color: 'from-primary-400 to-primary-600', bg: 'bg-primary-50', text: 'text-primary-600' },
  { key: 'advisor', label: '顾问转移', icon: UserPlus, color: 'from-violet-400 to-purple-600', bg: 'bg-violet-50', text: 'text-violet-600' },
  { key: 'quote', label: '报价审批', icon: FileText, color: 'from-sky-400 to-blue-600', bg: 'bg-sky-50', text: 'text-sky-600' },
]

const selectedType = ref('level')
const currentTypeConfig = computed(() => approvalTypes.find(t => t.key === selectedType.value)!)

const levelOptions = [
  { label: '普通客户', value: 'normal' },
  { label: '银卡会员', value: 'silver' },
  { label: '金卡会员', value: 'gold' },
  { label: 'VIP会员', value: 'vip' },
  { label: '钻石卡', value: 'diamond' },
]
const targetLevel = ref('gold')

const allTags = ['种植牙', '牙齿矫正', 'VIP', '高意向', '儿童齿科', '流失风险', '洁牙', '烤瓷牙', '朋友推荐', '老客户回馈']
const targetTags = ref<string[]>(['VIP'])

const advisorOptions = [
  { label: '林医生', value: '1' },
  { label: '王医生', value: '2' },
  { label: '张顾问', value: '3' },
  { label: '刘顾问', value: '4' },
]
const targetAdvisor = ref('3')

const quoteApprovalNote = ref('同意此报价，请加快推进成交')

const avatarColors = ['#0EA5A9', '#8B5CF6', '#F59E0B', '#EF4444', '#10B981', '#3B82F6', '#EC4899', '#F97316']

const mockCustomers = ref<CustomerItem[]>([
  { id: '1', name: '张伟', phone: '138****1234', avatarColor: '#0EA5A9', current: { level: '银卡会员', tags: ['种植牙', '高意向'], advisor: '林医生' } },
  { id: '2', name: '李娜', phone: '139****5678', avatarColor: '#8B5CF6', current: { level: '银卡会员', tags: ['牙齿矫正'], advisor: '王医生' } },
  { id: '3', name: '王芳', phone: '137****0002', avatarColor: '#F59E0B', current: { level: '普通客户', tags: ['烤瓷牙'], advisor: '张顾问' } },
  { id: '4', name: '陈强', phone: '135****0003', avatarColor: '#EF4444', current: { level: '普通客户', tags: ['洁牙'], advisor: '林医生' } },
  { id: '5', name: '赵敏', phone: '133****0005', avatarColor: '#10B981', current: { level: '金卡会员', tags: ['儿童齿科', 'VIP'], advisor: '刘顾问' } },
  { id: '6', name: '刘洋', phone: '134****0004', avatarColor: '#3B82F6', current: { level: '金卡会员', tags: ['牙齿矫正', '高意向'], advisor: '王医生' } },
  { id: '7', name: '孙丽', phone: '132****0006', avatarColor: '#EC4899', current: { level: 'VIP会员', tags: ['种植牙', 'VIP'], advisor: '林医生' } },
  { id: '8', name: '周杰', phone: '131****0007', avatarColor: '#F97316', current: { level: '普通客户', tags: ['洁牙', '流失风险'], advisor: '张顾问' } },
  { id: '9', name: '吴敏', phone: '130****0008', avatarColor: '#0EA5A9', current: { level: '银卡会员', tags: ['朋友推荐'], advisor: '刘顾问' } },
  { id: '10', name: '郑浩', phone: '129****0009', avatarColor: '#8B5CF6', current: { level: '金卡会员', tags: ['种植牙', '朋友推荐'], advisor: '林医生' } },
])

const selectedCustomerIds = ref<string[]>(['1', '2', '6', '8', '10'])

function toggleCustomer(id: string) {
  const i = selectedCustomerIds.value.indexOf(id)
  if (i === -1) selectedCustomerIds.value.push(id)
  else selectedCustomerIds.value.splice(i, 1)
}
function toggleSelectAll() {
  if (selectedCustomerIds.value.length === mockCustomers.value.length) selectedCustomerIds.value = []
  else selectedCustomerIds.value = mockCustomers.value.map(c => c.id)
}
function getSelectedCustomers() {
  return mockCustomers.value.filter(c => selectedCustomerIds.value.includes(c.id))
}

const previewOpen = ref(false)
const executionResult = ref<null | {
  success: (CustomerItem & { reason?: string })[]
  failed: (CustomerItem & { reason: string; shake: boolean })[]
}>(null)
const executing = ref(false)

function getNewValue(c: CustomerItem, field: string) {
  if (selectedType.value === 'level') return levelOptions.find(o => o.value === targetLevel.value)?.label || ''
  if (selectedType.value === 'tags') return [...new Set([...c.current.tags, ...targetTags.value])].join('、')
  if (selectedType.value === 'advisor') return advisorOptions.find(o => o.value === targetAdvisor.value)?.label || ''
  if (selectedType.value === 'quote') return '报价已审批'
  return ''
}
function getCurrentValue(c: CustomerItem, field: string) {
  if (selectedType.value === 'level') return c.current.level
  if (selectedType.value === 'tags') return c.current.tags.join('、') || '（无）'
  if (selectedType.value === 'advisor') return c.current.advisor
  if (selectedType.value === 'quote') return '待审批'
  return ''
}

const warnCount = computed(() => {
  if (selectedType.value !== 'level') return 0
  return getSelectedCustomers().filter(c => c.current.level === '钻石卡').length
})

const failureReasons = [
  '客户当前处于纠纷处理中，暂不支持批量操作',
  '系统检测到该客户有未完成的待支付订单',
  '客户等级已为最高，无法再次升级',
  '该客户标签数量已达上限（最多10个）',
  '顾问转移失败：目标顾问客户数超过上限',
]

async function executeApproval() {
  executing.value = true
  executionResult.value = null
  await new Promise(r => setTimeout(r, 1200))
  const sc = getSelectedCustomers()
  const success: any[] = []
  const failed: any[] = []
  sc.forEach((c, idx) => {
    const willFail = [1, 4, 7].includes(idx)
    if (willFail) {
      failed.push({ ...c, reason: failureReasons[idx % failureReasons.length], shake: true })
    } else {
      success.push({ ...c })
    }
  })
  executionResult.value = { success, failed }
  executing.value = false
  previewOpen.value = false
  setTimeout(() => {
    if (executionResult.value) {
      executionResult.value.failed.forEach(f => f.shake = false)
    }
  }, 1000)
}

function resetAll() {
  executionResult.value = null
  selectedCustomerIds.value = []
}
</script>

<template>
  <div class="p-6 space-y-6 bg-gray-50 min-h-screen">
    <div>
      <h1 class="text-2xl font-bold text-gray-800">批量审批中心</h1>
      <p class="text-gray-500 text-sm mt-1">等级升级 · 标签添加 · 顾问转移 · 报价审批，一站式批量处理</p>
    </div>

    <UCard class="border-0 shadow-card">
      <template #body>
        <div class="flex items-center gap-2 mb-5">
          <div class="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center">
            <ShieldCheck class="w-5 h-5 text-primary-500" />
          </div>
          <h2 class="text-lg font-semibold text-gray-800">第一步 · 选择审批类型</h2>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            v-for="t in approvalTypes"
            :key="t.key"
            :class="[
              'p-5 rounded-2xl border-2 transition-all text-left relative overflow-hidden group',
              selectedType === t.key
                ? 'border-transparent shadow-cardHover scale-[1.02]'
                : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
            ]"
            :style="selectedType === t.key ? { background: `linear-gradient(135deg, var(--tw-gradient-stops))` } : {}"
            @click="selectedType = t.key; executionResult = null"
          >
            <div :class="['absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity', t.bg, selectedType === t.key && '!opacity-100']"></div>
            <div class="relative">
              <div
                :class="[
                  'w-12 h-12 rounded-xl flex items-center justify-center mb-3 shadow-sm bg-gradient-to-br transition-transform',
                  t.color,
                  selectedType === t.key && 'scale-110'
                ]"
              >
                <component :is="t.icon" class="w-6 h-6 text-white" />
              </div>
              <p :class="['font-bold text-base', selectedType === t.key ? 'text-gray-800' : 'text-gray-700']">{{ t.label }}</p>
              <p class="text-xs text-gray-400 mt-1">
                {{ t.key === 'level' && '批量升级客户会员等级' }}
                {{ t.key === 'tags' && '批量添加客户标签' }}
                {{ t.key === 'advisor' && '批量转移归属顾问' }}
                {{ t.key === 'quote' && '批量审批报价方案' }}
              </p>
              <div
                v-if="selectedType === t.key"
                class="absolute top-0 right-0 w-6 h-6 rounded-bl-xl flex items-center justify-center bg-emerald-500 text-white"
              >
                <CheckCircle2 class="w-4 h-4" />
              </div>
            </div>
          </button>
        </div>

        <div class="mt-6 pt-6 border-t border-gray-100">
          <div class="flex items-center gap-2 mb-4">
            <div class="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
              <Sparkles class="w-5 h-5 text-amber-500" />
            </div>
            <h2 class="text-lg font-semibold text-gray-800">第二步 · 设置 Payload</h2>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
            <template v-if="selectedType === 'level'">
              <div class="md:col-span-4">
                <UFormGroup label="目标等级" required>
                  <USelect v-model="targetLevel" :options="levelOptions" size="md" />
                </UFormGroup>
              </div>
              <div class="md:col-span-8 p-4 rounded-xl bg-amber-50/50 border border-amber-100 flex items-start gap-3">
                <AlertCircle class="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <p class="text-sm text-amber-800 leading-relaxed">
                  等级升级会自动触发权益发放通知。升级到 VIP 及以上将自动分配专属顾问跟进，请确认操作范围。
                </p>
              </div>
            </template>
            <template v-else-if="selectedType === 'tags'">
              <div class="md:col-span-12">
                <p class="text-sm font-medium text-gray-600 mb-3">选择要批量添加的标签（可多选）</p>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="tag in allTags"
                    :key="tag"
                    :class="[
                      'px-4 py-2 rounded-xl border text-sm font-medium transition-all',
                      targetTags.includes(tag)
                        ? 'bg-primary-500 text-white border-primary-500 shadow-sm scale-105'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300 hover:text-primary-600'
                    ]"
                    @click="() => {
                      const i = targetTags.indexOf(tag);
                      if (i === -1) targetTags.push(tag); else targetTags.splice(i, 1);
                    }"
                  >
                    {{ tag }}
                  </button>
                </div>
              </div>
            </template>
            <template v-else-if="selectedType === 'advisor'">
              <div class="md:col-span-4">
                <UFormGroup label="目标顾问" required>
                  <USelect v-model="targetAdvisor" :options="advisorOptions" size="md" />
                </UFormGroup>
              </div>
              <div class="md:col-span-8 p-4 rounded-xl bg-violet-50/50 border border-violet-100 flex items-start gap-3">
                <AlertCircle class="w-5 h-5 text-violet-500 flex-shrink-0 mt-0.5" />
                <p class="text-sm text-violet-800 leading-relaxed">
                  顾问转移后，新顾问将获得该客户的所有历史跟进记录访问权限。系统会自动通知原顾问和新顾问，请谨慎操作。
                </p>
              </div>
            </template>
            <template v-else-if="selectedType === 'quote'">
              <div class="md:col-span-12">
                <UFormGroup label="审批备注">
                  <textarea
                    v-model="quoteApprovalNote"
                    rows="3"
                    class="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 resize-none"
                    placeholder="请输入审批备注（将同步给相关顾问）..."
                  />
                </UFormGroup>
              </div>
            </template>
          </div>
        </div>
      </template>
    </UCard>

    <UCard class="border-0 shadow-card">
      <template #body>
        <div class="flex items-center justify-between mb-5">
          <div class="flex items-center gap-2">
            <div class="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Users class="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h2 class="text-lg font-semibold text-gray-800">第三步 · 选择影响对象</h2>
              <p class="text-xs text-gray-400 mt-0.5">点击客户卡片选择参与批量审批的客户</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <button
              class="text-sm text-gray-500 hover:text-primary-600 transition-colors"
              @click="toggleSelectAll"
            >
              {{ selectedCustomerIds.length === mockCustomers.length ? '取消全选' : '全选全部' }}
            </button>
          </div>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <div
            v-for="c in mockCustomers"
            :key="c.id"
            :class="[
              'p-4 rounded-2xl border-2 cursor-pointer transition-all group relative overflow-hidden',
              selectedCustomerIds.includes(c.id)
                ? 'border-primary-500 bg-primary-50/40 shadow-cardHover scale-[1.02]'
                : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
            ]"
            @click="toggleCustomer(c.id)"
          >
            <div
              v-if="selectedCustomerIds.includes(c.id)"
              class="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center shadow-sm z-10"
            >
              <CheckCircle2 class="w-4 h-4" />
            </div>
            <div class="flex items-center gap-3 mb-3">
              <div
                class="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-sm"
                :style="{ background: c.avatarColor }"
              >
                {{ c.name.charAt(0) }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-gray-800 text-sm truncate">{{ c.name }}</p>
                <p class="text-xs text-gray-400 truncate">{{ c.phone }}</p>
              </div>
            </div>
            <div class="space-y-1">
              <div class="flex items-center justify-between text-xs">
                <span class="text-gray-400">等级</span>
                <span class="text-gray-700 font-medium truncate ml-2">{{ c.current.level }}</span>
              </div>
              <div class="flex items-center justify-between text-xs">
                <span class="text-gray-400">顾问</span>
                <span class="text-gray-700 font-medium truncate ml-2">{{ c.current.advisor }}</span>
              </div>
              <div class="pt-1 flex flex-wrap gap-1">
                <UBadge
                  v-for="tg in c.current.tags.slice(0, 2)"
                  :key="tg"
                  size="xs"
                  variant="subtle"
                  color="gray"
                  class="truncate"
                >
                  {{ tg }}
                </UBadge>
                <UBadge v-if="c.current.tags.length > 2" size="xs" variant="outline" color="gray">+{{ c.current.tags.length - 2 }}</UBadge>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-6 pt-5 border-t border-gray-100 flex items-center justify-between gap-4 flex-wrap">
          <div class="flex items-center gap-3">
            <div
              :class="[
                'px-5 py-2.5 rounded-2xl font-bold text-lg flex items-center gap-2',
                selectedCustomerIds.length > 0
                  ? 'bg-primary-500 text-white shadow-md shadow-primary-500/30'
                  : 'bg-gray-100 text-gray-400'
              ]"
            >
              <Users class="w-5 h-5" />
              已选 {{ selectedCustomerIds.length }} 个影响对象
            </div>
            <div v-if="warnCount > 0" class="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200">
              <AlertTriangle class="w-4 h-4 text-amber-500" />
              <span class="text-xs font-medium text-amber-700">包含 {{ warnCount }} 个高风险客户，建议单独处理</span>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <UButton
              variant="outline"
              color="gray"
              size="md"
              :disabled="selectedCustomerIds.length === 0"
              @click="previewOpen = true; executionResult = null"
            >
              <template #leading><Eye class="w-4 h-4" /></template>
              预览变更
            </UButton>
            <UButton
              color="primary"
              size="md"
              :disabled="selectedCustomerIds.length === 0"
              :loading="executing"
              @click="executeApproval"
            >
              <template #leading><Play class="w-4 h-4" /></template>
              执行审批
            </UButton>
          </div>
        </div>
      </template>
    </UCard>

    <Transition name="fade">
      <UCard v-if="executionResult" class="border-0 shadow-card animate-fade-in">
        <template #body>
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-md shadow-primary-500/20">
                <Zap class="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 class="text-xl font-bold text-gray-800">执行结果面板</h2>
                <p class="text-sm text-gray-500 mt-0.5">
                  批量处理完成，共 {{ executionResult.success.length + executionResult.failed.length }} 个对象
                </p>
              </div>
            </div>
            <UButton variant="ghost" color="gray" size="sm" @click="resetAll">
              <template #leading><RotateCcw class="w-4 h-4" /></template>
              重置并继续
            </UButton>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="p-5 rounded-2xl bg-gradient-to-br from-emerald-50/80 to-white border-2 border-emerald-200 relative overflow-hidden">
              <div class="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <div class="relative">
                <div class="flex items-center gap-3 mb-4">
                  <div class="w-11 h-11 rounded-xl bg-emerald-500 flex items-center justify-center shadow-sm">
                    <CheckCircle2 class="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p class="font-bold text-lg text-emerald-800">成功 {{ executionResult.success.length }} 项</p>
                    <p class="text-xs text-emerald-600">
                      成功率 {{ ((executionResult.success.length / (executionResult.success.length + executionResult.failed.length)) * 100).toFixed(0) }}%
                    </p>
                  </div>
                </div>

                <div v-if="executionResult.success.length === 0" class="text-center py-10 text-emerald-400">
                  <CheckCircle2 class="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p class="text-sm">暂无成功项</p>
                </div>
                <div v-else class="space-y-2 max-h-80 overflow-y-auto pr-1">
                  <div
                    v-for="s in executionResult.success"
                    :key="s.id"
                    class="p-3 rounded-xl bg-white/90 border border-emerald-100 flex items-center justify-between gap-3 animate-fade-in"
                  >
                    <div class="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        class="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                        :style="{ background: s.avatarColor }"
                      >
                        {{ s.name.charAt(0) }}
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="font-medium text-gray-800 text-sm">{{ s.name }}</p>
                        <p class="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <ArrowRight class="w-3 h-3" />
                          {{ getCurrentValue(s, '') }}
                          <span class="text-emerald-600 font-medium">→ {{ getNewValue(s, '') }}</span>
                        </p>
                      </div>
                    </div>
                    <CheckCircle2 class="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  </div>
                </div>
              </div>
            </div>

            <div class="p-5 rounded-2xl bg-gradient-to-br from-rose-50/80 to-white border-2 border-rose-200 relative overflow-hidden">
              <div class="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <div class="relative">
                <div class="flex items-center gap-3 mb-4">
                  <div class="w-11 h-11 rounded-xl bg-rose-500 flex items-center justify-center shadow-sm">
                    <XCircle class="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p class="font-bold text-lg text-rose-800">失败 {{ executionResult.failed.length }} 项</p>
                    <p class="text-xs text-rose-600">保留原状态，请处理后重试</p>
                  </div>
                </div>

                <div v-if="executionResult.failed.length === 0" class="text-center py-10 text-rose-300">
                  <XCircle class="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p class="text-sm">全部处理成功！</p>
                </div>
                <div v-else class="space-y-2 max-h-80 overflow-y-auto pr-1">
                  <div
                    v-for="f in executionResult.failed"
                    :key="f.id"
                    :class="[
                      'p-3 rounded-xl bg-white/90 border border-rose-200 flex items-start gap-3',
                      f.shake && 'animate-shake'
                    ]"
                  >
                    <div
                      class="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                      :style="{ background: f.avatarColor }"
                    >
                      {{ f.name.charAt(0) }}
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center justify-between mb-1">
                        <p class="font-medium text-gray-800 text-sm">{{ f.name }}</p>
                        <XCircle class="w-4 h-4 text-rose-500 flex-shrink-0" />
                      </div>
                      <p class="text-xs text-gray-500 mb-1">
                        <span class="line-through text-gray-400">{{ getCurrentValue(f, '') }}</span>
                        <span class="mx-1 text-gray-300">→</span>
                        <span class="text-gray-600 font-medium">未变更（保留原状态）</span>
                      </p>
                      <details class="group">
                        <summary class="text-xs text-rose-600 font-medium cursor-pointer list-none hover:text-rose-700 inline-flex items-center gap-1">
                          <AlertTriangle class="w-3 h-3" />
                          查看失败原因
                          <ChevronRight class="w-3 h-3 transition-transform group-open:rotate-90" />
                        </summary>
                        <p class="text-xs text-rose-700 mt-1.5 p-2 rounded-lg bg-rose-50 border border-rose-100 leading-relaxed">
                          {{ f.reason }}
                        </p>
                      </details>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-6 pt-5 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="text-center p-4 rounded-xl bg-gray-50">
              <p class="text-xs text-gray-400 mb-1">处理总数</p>
              <p class="text-2xl font-bold text-gray-800">{{ executionResult.success.length + executionResult.failed.length }}</p>
            </div>
            <div class="text-center p-4 rounded-xl bg-emerald-50">
              <p class="text-xs text-emerald-600 mb-1">成功数</p>
              <p class="text-2xl font-bold text-emerald-700">{{ executionResult.success.length }}</p>
            </div>
            <div class="text-center p-4 rounded-xl bg-rose-50">
              <p class="text-xs text-rose-600 mb-1">失败数</p>
              <p class="text-2xl font-bold text-rose-700">{{ executionResult.failed.length }}</p>
            </div>
            <div class="text-center p-4 rounded-xl bg-primary-50">
              <p class="text-xs text-primary-600 mb-1">成功率</p>
              <p class="text-2xl font-bold text-primary-700">
                {{ ((executionResult.success.length / (executionResult.success.length + executionResult.failed.length)) * 100).toFixed(0) }}%
              </p>
            </div>
          </div>
        </template>
      </UCard>
    </Transition>

    <UModal v-model="previewOpen" :ui="{ width: 'max-w-3xl' }">
      <UCard class="border-0">
        <template #body>
          <div class="flex items-center gap-3 mb-5 pb-5 border-b border-gray-100">
            <div class="w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br" :class="currentTypeConfig.color">
              <component :is="currentTypeConfig.icon" class="w-6 h-6 text-white" />
            </div>
            <div class="flex-1">
              <h3 class="text-lg font-bold text-gray-800">变更预览</h3>
              <p class="text-xs text-gray-500 mt-0.5">
                审批类型：<span class="font-medium" :class="currentTypeConfig.text">{{ currentTypeConfig.label }}</span>
                · 共 {{ selectedCustomerIds.length }} 个对象
              </p>
            </div>
            <UBadge v-if="warnCount > 0" size="sm" color="amber" variant="subtle" class="flex items-center gap-1">
              <AlertTriangle class="w-3 h-3" />
              {{ warnCount }} 个警告
            </UBadge>
          </div>

          <div class="space-y-2 max-h-96 overflow-y-auto pr-1 mb-5">
            <div class="grid grid-cols-12 gap-3 px-4 py-2 rounded-xl bg-gray-50 text-xs font-semibold text-gray-500 sticky top-0 z-10">
              <div class="col-span-3">客户</div>
              <div class="col-span-4">当前值</div>
              <div class="col-span-1 flex items-center justify-center">
                <ArrowRight class="w-4 h-4" />
              </div>
              <div class="col-span-4">新值</div>
            </div>
            <div
              v-for="c in getSelectedCustomers()"
              :key="c.id"
              class="grid grid-cols-12 gap-3 items-center px-4 py-3 rounded-xl border border-gray-100 hover:bg-gray-50/60 transition-colors"
            >
              <div class="col-span-3 flex items-center gap-2 min-w-0">
                <div
                  class="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                  :style="{ background: c.avatarColor }"
                >
                  {{ c.name.charAt(0) }}
                </div>
                <span class="text-sm font-medium text-gray-800 truncate">{{ c.name }}</span>
              </div>
              <div class="col-span-4 text-sm text-gray-600 truncate">
                {{ getCurrentValue(c, '') }}
              </div>
              <div class="col-span-1 flex items-center justify-center">
                <ArrowRight class="w-4 h-4 text-primary-500" />
              </div>
              <div class="col-span-4 text-sm font-semibold text-primary-700 truncate">
                {{ getNewValue(c, '') }}
              </div>
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <UButton variant="ghost" color="gray" size="md" @click="previewOpen = false">取消</UButton>
            <UButton color="primary" size="md" :loading="executing" @click="executeApproval">
              <template #leading><Play class="w-4 h-4" /></template>
              确认执行
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: all 0.4s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
