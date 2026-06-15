<script setup lang="ts">
import {
  TrendingUp, Eye, MessageSquare, MapPin, CheckCircle, XCircle,
  ChevronRight, Clock, AlertTriangle, User, BarChart3,
  FileText, ArrowRight, AlertCircle, X, Info, Calendar
} from 'lucide-vue-next'

const funnelStages = [
  { key: 'exposure', label: '曝光', value: 12850, rate: 100, icon: Eye, color: 'from-sky-400 to-sky-500', bg: 'bg-sky-50' },
  { key: 'consult', label: '咨询', value: 3260, rate: 25.4, icon: MessageSquare, color: 'from-blue-400 to-blue-500', bg: 'bg-blue-50' },
  { key: 'visit', label: '到店', value: 1085, rate: 33.3, icon: MapPin, color: 'from-primary-400 to-primary-500', bg: 'bg-primary-50' },
  { key: 'deal', label: '成交', value: 624, rate: 57.5, icon: CheckCircle, color: 'from-emerald-400 to-emerald-500', bg: 'bg-emerald-50' },
]

const channelData = [
  { channel: '抖音推广', exposure: 5200, consult: 1580, visit: 520, deal: 312, color: '#6366F1' },
  { channel: '美团/点评', exposure: 3600, consult: 890, visit: 298, deal: 172, color: '#F59E0B' },
  { channel: '微信公众号', exposure: 2100, consult: 480, visit: 168, deal: 88, color: '#10B981' },
  { channel: '朋友推荐', exposure: 1200, consult: 210, visit: 72, deal: 42, color: '#0EA5A9' },
  { channel: '门店路过', exposure: 750, consult: 100, visit: 27, deal: 10, color: '#EF4444' },
]

const expireReasons = ref([
  {
    key: 'price', label: '价格过高', count: 46, percent: 32, icon: TrendingUp, color: 'from-rose-400 to-red-500',
    bg: 'bg-rose-50', text: 'text-rose-600',
    details: [
      { id: 'r1', customer: '张伟', quote: 'V2.0 - ¥48,600', advisor: '林医生', expireAt: '2026-05-20', reason: '客户预算仅3万，报价超出承受范围，推荐其他诊所低价方案' },
      { id: 'r2', customer: '李明', quote: 'V1.0 - ¥32,000', advisor: '王医生', expireAt: '2026-05-15', reason: '对比3家诊所后选择均价约2.5万的竞品' },
      { id: 'r3', customer: '周琴', quote: 'V3.0 - ¥65,000', advisor: '张顾问', expireAt: '2026-05-28', reason: '全口种植报价超预算，选择先做半口' },
    ],
  },
  {
    key: 'competitor', label: '竞品选择', count: 38, percent: 27, icon: XCircle, color: 'from-amber-400 to-orange-500',
    bg: 'bg-amber-50', text: 'text-amber-600',
    details: [
      { id: 'r4', customer: '王芳', quote: 'V2.0 - ¥28,000', advisor: '张顾问', expireAt: '2026-05-18', reason: '朋友推荐某连锁诊所，方案类似便宜15%且赠送美白' },
      { id: 'r5', customer: '刘洋', quote: 'V1.0 - ¥52,000', advisor: '王医生', expireAt: '2026-05-10', reason: '选择了某三甲医院口腔科，更信任公立' },
    ],
  },
  {
    key: 'need_change', label: '需求变更', count: 24, percent: 17, icon: AlertTriangle, color: 'from-violet-400 to-purple-500',
    bg: 'bg-violet-50', text: 'text-violet-600',
    details: [
      { id: 'r6', customer: '陈静', quote: 'V1.0 - ¥18,000', advisor: '刘顾问', expireAt: '2026-05-22', reason: '原定矫正方案改为先补牙/治疗牙周，延后1-2年' },
    ],
  },
  {
    key: 'lost_contact', label: '失联', count: 20, percent: 14, icon: XCircle, color: 'from-gray-400 to-slate-500',
    bg: 'bg-gray-50', text: 'text-gray-600',
    details: [],
  },
  {
    key: 'other', label: '其他原因', count: 15, percent: 10, icon: FileText, color: 'from-sky-400 to-blue-500',
    bg: 'bg-sky-50', text: 'text-sky-600',
    details: [],
  },
])

const drawerOpen = ref(false)
const activeReason = ref<any>(null)

function openReasonDrawer(reason: any) {
  activeReason.value = reason
  drawerOpen.value = true
}
function closeDrawer() {
  drawerOpen.value = false
  activeReason.value = null
}

const advisorExpireData = [
  { name: '林医生', expired: 32, total: 128, color: '#0EA5A9' },
  { name: '王医生', expired: 28, total: 96, color: '#8B5CF6' },
  { name: '张顾问', expired: 45, total: 142, color: '#F59E0B' },
  { name: '刘顾问', expired: 38, total: 118, color: '#EF4444' },
]

const nodeTimelineData = [
  {
    stage: '发送报价',
    avgDelay: 0.3,
    maxDelay: 1,
    persons: [
      { name: '林医生', delay: 0 },
      { name: '王医生', delay: 0.5 },
      { name: '张顾问', delay: 0.3 },
      { name: '刘顾问', delay: 0.2 },
    ],
  },
  {
    stage: '客户确认',
    avgDelay: 2.1,
    maxDelay: 5,
    persons: [
      { name: '客户(林)', delay: 2 },
      { name: '客户(王)', delay: 2.5 },
      { name: '客户(张)', delay: 1.8 },
      { name: '客户(刘)', delay: 2.1 },
    ],
  },
  {
    stage: '方案调整',
    avgDelay: 3.6,
    maxDelay: 8,
    persons: [
      { name: '林医生', delay: 2.5 },
      { name: '王医生', delay: 4.2 },
      { name: '张顾问', delay: 3.8 },
      { name: '刘顾问', delay: 3.9 },
    ],
  },
  {
    stage: '最终决策',
    avgDelay: 5.8,
    maxDelay: 14,
    persons: [
      { name: '客户(林)', delay: 5.5 },
      { name: '客户(王)', delay: 6.2 },
      { name: '客户(张)', delay: 4.8 },
      { name: '客户(刘)', delay: 6.7 },
    ],
  },
]

const barMaxHeight = 200
function barHeight(value: number, max: number) {
  return `${(value / max) * barMaxHeight}px`
}

const totalExpire = expireReasons.value.reduce((s, r) => s + r.count, 0)
</script>

<template>
  <div class="p-6 space-y-6 bg-gray-50 min-h-screen">
    <div>
      <h1 class="text-2xl font-bold text-gray-800">来源转化报表</h1>
      <p class="text-gray-500 text-sm mt-1">渠道漏斗分析 · 报价过期深度分析 · 响应节点诊断</p>
    </div>

    <UCard class="border-0 shadow-card">
      <template #body>
        <div class="flex items-center gap-2 mb-6">
          <div class="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center">
            <TrendingUp class="w-5 h-5 text-sky-500" />
          </div>
          <h2 class="text-lg font-semibold text-gray-800">渠道转化漏斗</h2>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div class="lg:col-span-2 flex flex-col justify-center items-center py-4 px-6 rounded-2xl bg-gradient-to-br from-primary-50 via-sky-50 to-blue-50">
            <div class="w-full max-w-xs space-y-3">
              <div
                v-for="(stage, idx) in funnelStages"
                :key="stage.key"
                class="relative animate-fade-in"
                :style="{ animationDelay: `${idx * 80}ms` }"
              >
                <div
                  class="relative h-14 rounded-xl flex items-center justify-between px-5 text-white font-semibold shadow-sm overflow-hidden"
                  :class="`bg-gradient-to-r ${stage.color}`"
                  :style="{ width: `${stage.rate + 15}%`, marginLeft: `${(100 - stage.rate - 15) / 2}%`, minWidth: '60%' }"
                >
                  <div class="flex items-center gap-2">
                    <component :is="stage.icon" class="w-4 h-4" />
                    <span>{{ stage.label }}</span>
                  </div>
                  <span class="text-lg font-bold">{{ stage.value.toLocaleString() }}</span>
                </div>
                <div v-if="idx < funnelStages.length - 1" class="flex justify-center my-2">
                  <ArrowRight class="w-4 h-4 text-primary-300" />
                </div>
              </div>
            </div>
            <div class="mt-4 text-center text-sm text-gray-500">
              整体转化率
              <span class="text-2xl font-bold text-primary-600 ml-2">
                {{ ((funnelStages[3].value / funnelStages[0].value) * 100).toFixed(1) }}%
              </span>
            </div>
          </div>

          <div class="lg:col-span-3">
            <p class="text-sm font-semibold text-gray-500 mb-4">各渠道转化明细</p>
            <div class="space-y-3">
              <div v-for="ch in channelData" :key="ch.channel" class="p-3 rounded-xl bg-white border border-gray-100 hover:shadow-sm transition-shadow">
                <div class="flex items-center justify-between mb-2">
                  <span class="font-medium text-gray-800 text-sm flex items-center gap-2">
                    <span class="w-3 h-3 rounded-full" :style="{ background: ch.color }"></span>
                    {{ ch.channel }}
                  </span>
                  <span class="text-xs text-gray-400">曝光 {{ ch.exposure.toLocaleString() }}</span>
                </div>
                <div class="flex gap-2 items-center h-8">
                  <div
                    v-for="(val, i) in [ch.exposure, ch.consult, ch.visit, ch.deal]"
                    :key="i"
                    class="h-full rounded-lg transition-all hover:opacity-80"
                    :style="{
                      width: `${(val / ch.exposure) * 100}%`,
                      minWidth: val > 0 ? '8px' : '0',
                      background: i === 0 ? ch.color + '30' : i === 1 ? ch.color + '55' : i === 2 ? ch.color + '80' : ch.color,
                    }"
                    :title="['曝光','咨询','到店','成交'][i] + `: ${val}`"
                  ></div>
                  <div class="flex-1"></div>
                  <UBadge size="xs" variant="solid" class="!bg-emerald-500">
                    成交率 {{ ((ch.deal / ch.visit) * 100).toFixed(0) }}%
                  </UBadge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </UCard>

    <UCard class="border-0 shadow-card">
      <template #body>
        <div class="flex items-center gap-2 mb-6">
          <div class="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
            <AlertCircle class="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h2 class="text-lg font-semibold text-gray-800">报价过期分析</h2>
            <p class="text-xs text-gray-400">本月共 {{ totalExpire }} 份报价过期，点击卡片查看详情</p>
          </div>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <div
            v-for="reason in expireReasons"
            :key="reason.key"
            class="group relative p-5 rounded-2xl border border-gray-100 cursor-pointer transition-all hover:shadow-cardHover hover:-translate-y-1 overflow-hidden"
            :class="reason.bg"
            @click="openReasonDrawer(reason)"
          >
            <div class="absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-5 bg-gradient-to-br" :class="reason.color"></div>
            <div class="relative">
              <div :class="['w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-3 shadow-sm', reason.color]">
                <component :is="reason.icon" class="w-6 h-6 text-white" />
              </div>
              <p class="text-sm font-medium text-gray-700 mb-1">{{ reason.label }}</p>
              <div class="flex items-baseline gap-2">
                <span class="text-3xl font-bold text-gray-800">{{ reason.count }}</span>
                <span class="text-xs" :class="reason.text">{{ reason.percent }}%</span>
              </div>
              <div class="mt-3 h-1.5 rounded-full bg-white/60 overflow-hidden">
                <div
                  class="h-full rounded-full bg-gradient-to-r transition-all"
                  :class="reason.color"
                  :style="{ width: `${reason.percent}%` }"
                ></div>
              </div>
              <div class="mt-3 flex items-center gap-1 text-xs text-gray-500 group-hover:text-primary-600 transition-colors">
                查看详情
                <ChevronRight class="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div class="flex items-center gap-2 mb-4">
              <BarChart3 class="w-4 h-4 text-primary-500" />
              <p class="text-sm font-semibold text-gray-700">责任人过期数量</p>
            </div>
            <div class="p-5 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100">
              <div class="flex items-end justify-around gap-4 h-56 pb-10">
                <div v-for="a in advisorExpireData" :key="a.name" class="flex-1 flex flex-col items-center justify-end h-full">
                  <span class="text-xs text-gray-500 mb-1">{{ a.expired }}/{{ a.total }}</span>
                  <div class="w-full relative h-full flex items-end gap-1">
                    <div
                      class="flex-1 rounded-t-lg bg-gray-200 transition-all"
                      :style="{ height: barHeight(a.total, Math.max(...advisorExpireData.map(x => x.total))) }"
                    ></div>
                    <div
                      class="flex-1 rounded-t-lg relative transition-all hover:opacity-80"
                      :style="{
                        height: barHeight(a.expired, Math.max(...advisorExpireData.map(x => x.total))),
                        background: a.color,
                      }"
                    >
                      <span class="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold" :style="{ color: a.color }">
                        {{ ((a.expired / a.total) * 100).toFixed(0) }}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div class="flex justify-around gap-4 mt-2 border-t border-gray-100 pt-3">
                <div v-for="a in advisorExpireData" :key="a.name + '_lbl'" class="flex-1 text-center">
                  <p class="text-sm font-medium text-gray-700">{{ a.name }}</p>
                  <p class="text-xs text-gray-400">过期率 {{ ((a.expired / a.total) * 100).toFixed(1) }}%</p>
                </div>
              </div>
              <div class="flex justify-center gap-6 mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
                <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-gray-200"></span>总数</span>
                <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-primary-500"></span>过期</span>
              </div>
            </div>
          </div>

          <div>
            <div class="flex items-center gap-2 mb-4">
              <Clock class="w-4 h-4 text-amber-500" />
              <p class="text-sm font-semibold text-gray-700">响应节点延误分析（甘特式）</p>
            </div>
            <div class="p-5 rounded-2xl bg-gradient-to-br from-amber-50/50 to-white border border-amber-100 space-y-4">
              <div v-for="(stage, si) in nodeTimelineData" :key="stage.stage" class="space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <span class="w-1.5 h-4 rounded-full bg-gradient-to-b from-primary-400 to-primary-600"></span>
                    {{ stage.stage }}
                  </span>
                  <span class="text-xs text-gray-500 flex items-center gap-3">
                    <span>平均延误: <b class="text-amber-600">{{ stage.avgDelay }}</b> 天</span>
                    <span>最长: <b class="text-red-500">{{ stage.maxDelay }}</b> 天</span>
                  </span>
                </div>
                <div class="flex gap-1.5 items-center h-8">
                  <div
                    v-for="(p, pi) in stage.persons"
                    :key="p.name + pi"
                    class="h-full rounded-md bg-gradient-to-r from-primary-400 to-primary-500 relative group hover:opacity-80 transition-opacity cursor-pointer"
                    :style="{
                      width: `${Math.max(4, (p.delay / stage.maxDelay) * 85)}%`,
                      opacity: Math.min(1, 0.6 + (p.delay / stage.maxDelay) * 0.4),
                    }"
                  >
                    <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                      {{ p.name }} · 延误 {{ p.delay }} 天
                    </div>
                  </div>
                  <div class="flex-1 flex items-center gap-1 ml-3 text-xs text-gray-400 whitespace-nowrap overflow-hidden">
                    <User class="w-3 h-3 flex-shrink-0" />
                    <span class="truncate">{{ stage.persons.map(p => p.name).join(', ') }}</span>
                  </div>
                </div>
              </div>
              <div class="flex justify-between pt-3 mt-3 border-t border-amber-100 text-xs text-gray-400">
                <span>← 延误 0 天</span>
                <span>延误时长 越长越严重 →</span>
              </div>
            </div>
          </div>
        </div>
      </template>
    </UCard>

    <UDrawer v-model="drawerOpen" side="right" class="!max-w-xl">
      <div v-if="activeReason" class="h-full flex flex-col">
        <div class="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r" :class="activeReason.bg">
          <div class="flex items-center gap-3">
            <div :class="['w-11 h-11 rounded-xl flex items-center justify-center shadow-md bg-gradient-to-br', activeReason.color]">
              <component :is="activeReason.icon" class="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 class="font-bold text-gray-800 text-lg">{{ activeReason.label }} - 详情</h3>
              <p class="text-xs text-gray-500">共 {{ activeReason.count }} 例 · 占 {{ activeReason.percent }}%</p>
            </div>
          </div>
          <UButton variant="ghost" color="gray" size="sm" icon @click="closeDrawer">
            <X class="w-5 h-5" />
          </UButton>
        </div>

        <div class="flex-1 overflow-y-auto p-5 space-y-5">
          <div class="p-4 rounded-xl bg-amber-50 border border-amber-100 flex items-start gap-3">
            <Info class="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div class="text-sm text-amber-800 leading-relaxed">
              <p class="font-semibold mb-1">原因分析与改进建议</p>
              <p>针对"{{ activeReason.label }}"类过期，建议：① 提前预判报价后 3/7/14 天回访节点；② 方案调整阶段主动增加沟通频次；③ 设置价格分层套餐，降低决策门槛。</p>
            </div>
          </div>

          <div v-if="activeReason.details && activeReason.details.length > 0">
            <p class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <FileText class="w-4 h-4 text-gray-400" />
              过期案例明细（{{ activeReason.details.length }}）
            </p>
            <div class="space-y-3">
              <div v-for="d in activeReason.details" :key="d.id" class="p-4 rounded-xl border border-gray-100 bg-white hover:shadow-sm transition-shadow">
                <div class="flex items-center justify-between mb-3">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 font-bold">
                      {{ d.customer.charAt(0) }}
                    </div>
                    <div>
                      <p class="font-medium text-gray-800">{{ d.customer }}</p>
                      <p class="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
                        <FileText class="w-3 h-3" /> {{ d.quote }}
                        <span class="mx-1">·</span>
                        <User class="w-3 h-3" /> {{ d.advisor }}
                      </p>
                    </div>
                  </div>
                  <UBadge size="xs" variant="subtle" color="red" class="flex items-center gap-1">
                    <Calendar class="w-3 h-3" /> {{ d.expireAt }}
                  </UBadge>
                </div>
                <div class="p-3 rounded-lg bg-gray-50 text-sm text-gray-600 leading-relaxed">
                  <span class="text-xs font-semibold text-gray-400 block mb-1">过期原因说明：</span>
                  {{ d.reason }}
                </div>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-12 text-gray-400">
            <FileText class="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>暂无详细案例记录</p>
          </div>
        </div>

        <div class="p-5 border-t border-gray-100 bg-gray-50 flex gap-3">
          <UButton block variant="outline" color="gray" size="md" @click="closeDrawer">关闭</UButton>
          <UButton block color="primary" size="md">生成改进方案</UButton>
        </div>
      </div>
    </UDrawer>
  </div>
</template>
