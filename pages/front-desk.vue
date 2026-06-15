<script setup lang="ts">
import {
  Search, UserPlus, Phone, CalendarCheck, CreditCard, User,
  ChevronRight, Sparkles, Tag, Heart, Clock, AlertCircle, Plus, Zap
} from 'lucide-vue-next'

const searchKeyword = ref('')
const showNewCustomerForm = ref(false)

const newCustomer = reactive({
  name: '',
  phone: '',
  gender: 'female',
  sourceChannel: '',
  intention: '',
  followUpPreference: '',
})

const sourceOptions = [
  { label: '微信公众号', value: 'wechat' },
  { label: '抖音推广', value: 'douyin' },
  { label: '美团/点评', value: 'meituan' },
  { label: '朋友推荐', value: 'referral' },
  { label: '门店路过', value: 'walkin' },
  { label: '其他渠道', value: 'other' },
]

const intentionOptions = [
  { label: '种植牙', value: 'implant' },
  { label: '牙齿矫正', value: 'orthodontics' },
  { label: '烤瓷牙/牙冠', value: 'crown' },
  { label: '洗牙/洁牙', value: 'cleaning' },
  { label: '儿童齿科', value: 'pediatric' },
  { label: '根管治疗', value: 'rootcanal' },
  { label: '牙齿美白', value: 'whitening' },
  { label: '综合检查', value: 'checkup' },
]

const preferenceOptions = [
  { label: '工作日上午', value: 'weekday_morning' },
  { label: '工作日下午', value: 'weekday_afternoon' },
  { label: '周末上午', value: 'weekend_morning' },
  { label: '周末下午', value: 'weekend_afternoon' },
  { label: '晚间时段', value: 'evening' },
]

const searchResults = ref([
  { id: '1', name: '张伟', phone: '138****1234', lastVisit: '2026-06-10', level: 'VIP' },
  { id: '2', name: '张美丽', phone: '139****5678', lastVisit: '2026-06-12', level: '金卡' },
])

const followUpReminders = ref([
  { id: 1, customer: '李娜', phone: '136****0001', reason: '牙齿矫正复诊', due: '今日 10:00', urgent: true },
  { id: 2, customer: '王芳', phone: '137****0002', reason: '种植牙方案回访', due: '今日 14:30', urgent: true },
  { id: 3, customer: '陈强', phone: '135****0003', reason: '洗牙后关怀', due: '今日 16:00', urgent: false },
  { id: 4, customer: '刘洋', phone: '134****0004', reason: '美白效果回访', due: '今日 17:00', urgent: false },
])

const revisitReminders = ref([
  { id: 1, customer: '赵敏', phone: '133****0005', service: '儿童涂氟', nextDate: '2026-06-18', daysLeft: 2 },
  { id: 2, customer: '孙丽', phone: '132****0006', service: '种植牙复查', nextDate: '2026-06-19', daysLeft: 3 },
  { id: 3, customer: '周杰', phone: '131****0007', service: '牙周治疗', nextDate: '2026-06-20', daysLeft: 4 },
])

const recentConsumptions = ref([
  { id: 1, service: '超声波洁牙', price: 280, icon: Sparkles, color: 'sky' },
  { id: 2, service: '树脂补牙', price: 480, icon: Heart, color: 'rose' },
  { id: 3, service: '儿童涂氟', price: 360, icon: Tag, color: 'violet' },
  { id: 4, service: '根管治疗', price: 2800, icon: Zap, color: 'amber' },
  { id: 5, service: '牙齿美白', price: 1680, icon: Sparkles, color: 'emerald' },
])

const submitting = ref(false)

async function submitNewCustomer() {
  if (!newCustomer.name || !newCustomer.phone) return
  submitting.value = true
  try {
    await $fetch('/api/customers', {
      method: 'POST',
      body: { ...newCustomer },
    })
    Object.assign(newCustomer, {
      name: '', phone: '', gender: 'female',
      sourceChannel: '', intention: '', followUpPreference: '',
    })
    showNewCustomerForm.value = false
  } finally {
    submitting.value = false
  }
}

const colorBg: Record<string, string> = {
  sky: 'bg-sky-100 text-sky-600',
  rose: 'bg-rose-100 text-rose-600',
  violet: 'bg-violet-100 text-violet-600',
  amber: 'bg-amber-100 text-amber-600',
  emerald: 'bg-emerald-100 text-emerald-600',
}
</script>

<template>
  <div class="p-6 space-y-6 bg-gray-50 min-h-screen">
    <div>
      <h1 class="text-2xl font-bold text-gray-800">前台工作台</h1>
      <p class="text-gray-500 text-sm mt-1">快速录入客户、处理待办、快捷消费</p>
    </div>

    <UCard class="border-0 shadow-card bg-gradient-to-br from-primary-500 to-primary-600 text-white">
      <template #body>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2">
            <label class="text-sm font-medium text-primary-50 mb-3 block">搜索客户（手机号 / 姓名）</label>
            <div class="relative">
              <Search class="w-5 h-5 text-primary-200 absolute left-4 top-1/2 -translate-y-1/2" />
              <UInput
                v-model="searchKeyword"
                placeholder="输入客户姓名或手机号快速检索..."
                size="lg"
                class="!bg-white/95 !border-0 !pl-12"
              />
            </div>
            <div v-if="searchKeyword" class="mt-3 space-y-2 animate-fade-in">
              <div
                v-for="r in searchResults"
                :key="r.id"
                class="bg-white/15 backdrop-blur px-4 py-3 rounded-xl flex items-center justify-between hover:bg-white/25 cursor-pointer transition-colors"
              >
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                    <User class="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p class="font-medium">{{ r.name }}</p>
                    <p class="text-xs text-primary-100">{{ r.phone }} · 上次到店 {{ r.lastVisit }}</p>
                  </div>
                </div>
                <UBadge variant="outline" class="!border-white/40 !text-white">{{ r.level }}</UBadge>
              </div>
            </div>
          </div>
          <div>
            <UButton
              block
              size="lg"
              variant="outline"
              class="!border-white/40 !text-white hover:!bg-white/15 !bg-white/10"
              :ui="{ rounded: 'rounded-xl' }"
              @click="showNewCustomerForm = !showNewCustomerForm"
            >
              <template #leading>
                <UserPlus class="w-5 h-5" />
              </template>
              新客户快速建档
            </UButton>
            <p class="text-xs text-primary-100 mt-3 text-center">1分钟完成新客户信息录入</p>
          </div>
        </div>

        <Transition name="fade">
          <div v-if="showNewCustomerForm" class="mt-6 p-5 bg-white/95 backdrop-blur rounded-2xl text-gray-700 shadow-lg">
            <div class="flex items-center gap-2 mb-5">
              <div class="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
                <Sparkles class="w-4 h-4 text-primary-600" />
              </div>
              <h3 class="font-semibold text-gray-800">新客户快速建档</h3>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <UFormGroup label="姓名" required>
                <UInput v-model="newCustomer.name" placeholder="请输入客户姓名" size="md" />
              </UFormGroup>
              <UFormGroup label="手机号" required>
                <UInput v-model="newCustomer.phone" placeholder="请输入手机号" size="md">
                  <template #leading><Phone class="w-4 h-4 text-gray-400" /></template>
                </UInput>
              </UFormGroup>
              <UFormGroup label="性别">
                <USelect
                  v-model="newCustomer.gender"
                  :options="[
                    { label: '女', value: 'female' },
                    { label: '男', value: 'male' },
                  ]"
                  size="md"
                />
              </UFormGroup>
              <UFormGroup label="来源渠道">
                <USelect v-model="newCustomer.sourceChannel" :options="sourceOptions" placeholder="请选择来源" size="md" />
              </UFormGroup>
              <UFormGroup label="咨询意向">
                <USelect v-model="newCustomer.intention" :options="intentionOptions" placeholder="请选择意向" size="md" />
              </UFormGroup>
              <UFormGroup label="复诊偏好">
                <USelect v-model="newCustomer.followUpPreference" :options="preferenceOptions" placeholder="请选择时段" size="md" />
              </UFormGroup>
            </div>
            <div class="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
              <UButton variant="ghost" color="gray" size="md" @click="showNewCustomerForm = false">取消</UButton>
              <UButton color="primary" size="md" :loading="submitting" @click="submitNewCustomer">
                <template #leading><Plus class="w-4 h-4" /></template>
                确认建档
              </UButton>
            </div>
          </div>
        </Transition>
      </template>
    </UCard>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <UCard class="lg:col-span-2 border-0 shadow-card">
        <template #body>
          <div class="flex items-center gap-2 mb-5">
            <div class="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
              <AlertCircle class="w-4 h-4 text-rose-500" />
            </div>
            <h2 class="text-lg font-semibold text-gray-800">今日回访提醒</h2>
            <UBadge size="sm" color="rose" variant="subtle">{{ followUpReminders.length }} 条</UBadge>
          </div>
          <div class="space-y-3">
            <div
              v-for="item in followUpReminders"
              :key="item.id"
              class="p-4 rounded-xl border border-gray-100 hover:border-primary-200 hover:bg-primary-50/30 transition-all cursor-pointer group flex items-center justify-between"
            >
              <div class="flex items-center gap-4">
                <div :class="[
                  'w-12 h-12 rounded-xl flex items-center justify-center',
                  item.urgent ? 'bg-rose-50' : 'bg-amber-50'
                ]">
                  <Phone :class="['w-6 h-6', item.urgent ? 'text-rose-500' : 'text-amber-500']" />
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <p class="font-medium text-gray-800">{{ item.customer }}</p>
                    <UBadge v-if="item.urgent" size="xs" color="rose" variant="subtle">紧急</UBadge>
                  </div>
                  <p class="text-sm text-gray-500 mt-0.5">{{ item.phone }} · {{ item.reason }}</p>
                </div>
              </div>
              <div class="flex items-center gap-4">
                <span class="text-sm font-medium text-primary-600 bg-primary-50 px-3 py-1 rounded-full">
                  {{ item.due }}
                </span>
                <ChevronRight class="w-5 h-5 text-gray-300 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          </div>

          <div class="border-t border-gray-100 mt-6 pt-6">
            <div class="flex items-center gap-2 mb-5">
              <div class="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                <CalendarCheck class="w-4 h-4 text-emerald-500" />
              </div>
              <h2 class="text-lg font-semibold text-gray-800">复诊提醒</h2>
              <UBadge size="sm" color="emerald" variant="subtle">{{ revisitReminders.length }} 条</UBadge>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                v-for="r in revisitReminders"
                :key="r.id"
                class="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 hover:shadow-cardHover transition-shadow cursor-pointer"
              >
                <div class="flex items-center justify-between mb-3">
                  <span class="font-medium text-gray-800">{{ r.customer }}</span>
                  <UBadge size="xs" variant="outline" color="primary">{{ r.daysLeft }}天后</UBadge>
                </div>
                <p class="text-sm text-gray-500 mb-2">{{ r.service }}</p>
                <div class="flex items-center gap-1 text-xs text-gray-400">
                  <Clock class="w-3 h-3" />
                  <span>{{ r.nextDate }}</span>
                </div>
              </div>
            </div>
          </div>
        </template>
      </UCard>

      <UCard class="border-0 shadow-card">
        <template #body>
          <div class="flex items-center gap-2 mb-5">
            <div class="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
              <CreditCard class="w-4 h-4 text-primary-500" />
            </div>
            <h2 class="text-lg font-semibold text-gray-800">消费快捷录入</h2>
          </div>
          <p class="text-xs text-gray-400 mb-4">最近 5 条常用服务，一键快速录入消费</p>
          <div class="space-y-3">
            <button
              v-for="item in recentConsumptions"
              :key="item.id"
              class="w-full p-4 rounded-xl border border-gray-100 hover:border-primary-300 hover:bg-primary-50/40 hover:shadow-sm transition-all group text-left flex items-center justify-between"
            >
              <div class="flex items-center gap-3">
                <div :class="['w-10 h-10 rounded-xl flex items-center justify-center', colorBg[item.color]]">
                  <component :is="item.icon" class="w-5 h-5" />
                </div>
                <div>
                  <p class="font-medium text-gray-800 text-sm">{{ item.service }}</p>
                  <p class="text-xs text-gray-400">常用服务</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-lg font-bold text-primary-600">¥{{ item.price }}</span>
                <ChevronRight class="w-4 h-4 text-gray-300 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all" />
              </div>
            </button>
          </div>
          <UButton
            block
            variant="outline"
            color="primary"
            class="mt-5 !rounded-xl"
          >
            <template #leading><Plus class="w-4 h-4" /></template>
            更多服务
          </UButton>
        </template>
      </UCard>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: all 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
