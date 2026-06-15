<script setup lang="ts">
import {
  Users, PhoneCall, Wallet, AlertTriangle, Calendar, Clock,
  CheckCircle2, ChevronRight, TrendingUp, TrendingDown, Activity,
  MessageSquare, CreditCard, Bell, FileText, Star
} from 'lucide-vue-next'

const stats = ref([
  { key: 'newToday', label: '今日新增', value: 12, diff: '+3', trend: 'up', icon: Users, color: 'primary' },
  { key: 'followUp', label: '待回访', value: 28, diff: '+5', trend: 'up', icon: PhoneCall, color: 'amber' },
  { key: 'monthConsume', label: '本月消费', value: '¥286,500', diff: '+12.4%', trend: 'up', icon: Wallet, color: 'emerald' },
  { key: 'churnWarn', label: '流失预警', value: 8, diff: '-2', trend: 'down', icon: AlertTriangle, color: 'rose' },
])

const todayTodos = ref([
  { id: 1, time: '09:30', content: '回访张伟 - 种植牙方案确认', priority: 'high', customer: '张伟', completed: false },
  { id: 2, time: '10:00', content: '李娜复诊提醒 - 牙齿矫正', priority: 'high', customer: '李娜', completed: true },
  { id: 3, time: '11:00', content: '跟进报价V2.0 - 王芳口腔修复', priority: 'medium', customer: '王芳', completed: false },
  { id: 4, time: '14:00', content: '陈强洁牙服务安排', priority: 'low', customer: '陈强', completed: false },
  { id: 5, time: '15:30', content: '刘洋洗牙方案确认回访', priority: 'medium', customer: '刘洋', completed: false },
  { id: 6, time: '16:30', content: '赵敏儿童牙齿检查提醒', priority: 'high', customer: '赵敏', completed: false },
])

const activityTimeline = ref([
  { id: 1, time: '10分钟前', type: '消费', icon: CreditCard, color: 'primary', customer: '孙丽', desc: '完成 ¥5,800 烤瓷牙修复支付' },
  { id: 2, time: '32分钟前', type: '建档', icon: FileText, color: 'emerald', customer: '周杰', desc: '新客户快速建档，来源：抖音推广' },
  { id: 3, time: '1小时前', type: '回访', icon: MessageSquare, color: 'amber', customer: '吴敏', desc: '电话回访，意向度提升至 A 级' },
  { id: 4, time: '2小时前', type: '预约', icon: Calendar, color: 'sky', customer: '郑浩', desc: '预约明日 10:00 种植咨询' },
  { id: 5, time: '3小时前', type: '报价', icon: FileText, color: 'violet', customer: '冯雪', desc: '发送报价 V3.0，金额 ¥28,600' },
  { id: 6, time: '4小时前', type: '消费', icon: Star, color: 'warn', customer: '蒋涛', desc: '升级为 VIP 客户，累计消费超 5 万' },
  { id: 7, time: '5小时前', type: '到店', icon: Users, color: 'primary', customer: '沈悦', desc: '到店完成常规检查' },
])

const colorMap: Record<string, { bg: string, text: string, ring: string, icon: string }> = {
  primary: { bg: 'bg-primary-50', text: 'text-primary-600', ring: 'ring-primary-200', icon: 'text-primary-500' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', ring: 'ring-amber-200', icon: 'text-amber-500' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', ring: 'ring-emerald-200', icon: 'text-emerald-500' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-600', ring: 'ring-rose-200', icon: 'text-rose-500' },
}

const priorityMap: Record<string, string> = {
  high: 'bg-rose-100 text-rose-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-gray-100 text-gray-600',
}

const priorityLabel: Record<string, string> = {
  high: '高优先级',
  medium: '中优先级',
  low: '低优先级',
}

const timelineColorMap: Record<string, string> = {
  primary: 'bg-primary-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  sky: 'bg-sky-500',
  violet: 'bg-violet-500',
  warn: 'bg-warn-500',
}

function toggleTodo(id: number) {
  const t = todayTodos.value.find(x => x.id === id)
  if (t) t.completed = !t.completed
}
</script>

<template>
  <div class="p-6 space-y-6 bg-gray-50 min-h-screen">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">总览看板</h1>
        <p class="text-gray-500 text-sm mt-1">今日工作概览与关键指标</p>
      </div>
      <div class="flex items-center gap-2 text-sm text-gray-500">
        <Clock class="w-4 h-4" />
        <span>{{ new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }) }}</span>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      <UCard
        v-for="stat in stats"
        :key="stat.key"
        class="border-0 shadow-card hover:shadow-cardHover transition-shadow duration-300 cursor-pointer overflow-hidden group"
      >
        <template #body>
          <div class="flex items-start justify-between">
            <div>
              <div class="flex items-center gap-2 mb-3">
                <div :class="[colorMap[stat.color].bg, 'w-10 h-10 rounded-xl flex items-center justify-center ring-4', colorMap[stat.color].ring]">
                  <component :is="stat.icon" :class="['w-5 h-5', colorMap[stat.color].icon]" />
                </div>
              </div>
              <p class="text-gray-500 text-sm mb-1">{{ stat.label }}</p>
              <div class="flex items-baseline gap-2">
                <span class="text-2xl font-bold text-gray-800">{{ stat.value }}</span>
                <span
                  :class="[
                    'text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-0.5',
                    stat.trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                  ]"
                >
                  <component :is="stat.trend === 'up' ? TrendingUp : TrendingDown" class="w-3 h-3" />
                  {{ stat.diff }}
                </span>
              </div>
            </div>
            <ChevronRight class="w-5 h-5 text-gray-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
          </div>
        </template>
      </UCard>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <UCard class="lg:col-span-2 border-0 shadow-card">
        <template #body>
          <div class="flex items-center justify-between mb-5">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
                <CheckCircle2 class="w-4 h-4 text-primary-500" />
              </div>
              <h2 class="text-lg font-semibold text-gray-800">今日待办事项</h2>
            </div>
            <UBadge size="sm" color="primary" variant="subtle">{{ todayTodos.filter(t => !t.completed).length }} 项待办</UBadge>
          </div>
          <div class="space-y-2">
            <div
              v-for="todo in todayTodos"
              :key="todo.id"
              class="group p-3 rounded-xl border border-gray-100 hover:border-primary-200 hover:bg-primary-50/30 transition-all cursor-pointer flex items-start gap-3"
            >
              <div
                :class="[
                  'w-5 h-5 rounded-full border-2 mt-0.5 flex-shrink-0 flex items-center justify-center transition-colors',
                  todo.completed
                    ? 'bg-primary-500 border-primary-500'
                    : 'border-gray-300 hover:border-primary-400'
                ]"
                @click.stop="toggleTodo(todo.id)"
              >
                <CheckCircle2 v-if="todo.completed" class="w-3 h-3 text-white" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-xs text-gray-400 font-mono">{{ todo.time }}</span>
                  <UBadge size="xs" :class="priorityMap[todo.priority]">{{ priorityLabel[todo.priority] }}</UBadge>
                </div>
                <p :class="['text-sm line-clamp-1', todo.completed ? 'text-gray-400 line-through' : 'text-gray-700']">
                  {{ todo.content }}
                </p>
                <p class="text-xs text-gray-400 mt-1">客户：{{ todo.customer }}</p>
              </div>
            </div>
          </div>
        </template>
      </UCard>

      <UCard class="lg:col-span-3 border-0 shadow-card">
        <template #body>
          <div class="flex items-center justify-between mb-5">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                <Activity class="w-4 h-4 text-amber-500" />
              </div>
              <h2 class="text-lg font-semibold text-gray-800">最近客户动态</h2>
            </div>
            <UButton size="xs" variant="ghost" color="gray" class="text-primary-500 hover:text-primary-600">
              查看全部
              <ChevronRight class="w-4 h-4" />
            </UButton>
          </div>
          <div class="relative">
            <div class="absolute left-[19px] top-2 bottom-2 w-px bg-gray-200"></div>
            <div class="space-y-5">
              <div
                v-for="(item, idx) in activityTimeline"
                :key="item.id"
                class="relative pl-12 group animate-fade-in"
                :style="{ animationDelay: `${idx * 50}ms` }"
              >
                <div
                  :class="[
                    'absolute left-0 top-1 w-10 h-10 rounded-full flex items-center justify-center ring-4 ring-white shadow-sm',
                    timelineColorMap[item.color]
                  ]"
                >
                  <component :is="item.icon" class="w-5 h-5 text-white" />
                </div>
                <div class="bg-gray-50/80 group-hover:bg-primary-50/50 rounded-xl p-3 border border-gray-100 transition-colors">
                  <div class="flex items-center justify-between mb-1">
                    <div class="flex items-center gap-2">
                      <span class="font-medium text-gray-800">{{ item.customer }}</span>
                      <UBadge size="xs" variant="subtle" color="gray">{{ item.type }}</UBadge>
                    </div>
                    <span class="text-xs text-gray-400 flex items-center gap-1">
                      <Clock class="w-3 h-3" />
                      {{ item.time }}
                    </span>
                  </div>
                  <p class="text-sm text-gray-600">{{ item.desc }}</p>
                </div>
              </div>
            </div>
          </div>
        </template>
      </UCard>
    </div>
  </div>
</template>
