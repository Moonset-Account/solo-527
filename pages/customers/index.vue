<script setup lang="ts">
import {
  Search, Filter, RotateCcw, ChevronRight, User, Users,
  LayoutGrid, List, Tag, Star, Phone, Wallet, Calendar
} from 'lucide-vue-next'
import type { Customer } from '~/stores/customers'

const store = useCustomersStore()
const router = useRouter()
const viewMode = ref<'grid' | 'table'>('grid')

const allTags = ref([
  { id: '1', label: '种植牙', color: 'bg-rose-100 text-rose-700' },
  { id: '2', label: '牙齿矫正', color: 'bg-violet-100 text-violet-700' },
  { id: '3', label: '烤瓷牙', color: 'bg-amber-100 text-amber-700' },
  { id: '4', label: '洁牙', color: 'bg-sky-100 text-sky-700' },
  { id: '5', label: 'VIP', color: 'bg-primary-100 text-primary-700' },
  { id: '6', label: '儿童齿科', color: 'bg-emerald-100 text-emerald-700' },
  { id: '7', label: '流失风险', color: 'bg-red-100 text-red-700' },
  { id: '8', label: '高意向', color: 'bg-blue-100 text-blue-700' },
])

const levelOptions = [
  { label: '全部等级', value: '' },
  { label: '普通客户', value: 'normal' },
  { label: '银卡', value: 'silver' },
  { label: '金卡', value: 'gold' },
  { label: 'VIP', value: 'vip' },
  { label: '钻石卡', value: 'diamond' },
]

const advisorOptions = [
  { label: '全部顾问', value: '' },
  { label: '林医生', value: '1' },
  { label: '王医生', value: '2' },
  { label: '张顾问', value: '3' },
  { label: '刘顾问', value: '4' },
]

const qualityOptions = [
  { label: '全部质量', value: '' },
  { label: 'A 级 - 优质', value: 'A' },
  { label: 'B 级 - 良好', value: 'B' },
  { label: 'C 级 - 一般', value: 'C' },
  { label: 'D 级 - 待培养', value: 'D' },
]

const mockCustomers = ref<Customer[]>([
  {
    id: '1', name: '张伟', phone: '138****1234', gender: 'male',
    tags: ['种植牙', 'VIP', '高意向'], level: 'vip', advisorId: '1', advisorName: '林医生',
    totalConsumption: 58600, visitCount: 12, leadQuality: 'A',
    sourceChannel: '朋友推荐', intention: '种植牙', followUpPreference: '周末上午',
    createdAt: '2025-08-15',
  },
  {
    id: '2', name: '李娜', phone: '139****5678', gender: 'female',
    tags: ['牙齿矫正', '高意向'], level: 'gold', advisorId: '2', advisorName: '王医生',
    totalConsumption: 32800, visitCount: 8, leadQuality: 'A',
    sourceChannel: '抖音推广', intention: '牙齿矫正', followUpPreference: '工作日下午',
    createdAt: '2025-10-20',
  },
  {
    id: '3', name: '王芳', phone: '137****0002', gender: 'female',
    tags: ['烤瓷牙', '流失风险'], level: 'silver', advisorId: '3', advisorName: '张顾问',
    totalConsumption: 12400, visitCount: 4, leadQuality: 'B',
    sourceChannel: '美团点评', intention: '烤瓷牙修复', followUpPreference: '晚间时段',
    createdAt: '2026-01-10',
  },
  {
    id: '4', name: '陈强', phone: '135****0003', gender: 'male',
    tags: ['洁牙'], level: 'normal', advisorId: '1', advisorName: '林医生',
    totalConsumption: 2400, visitCount: 3, leadQuality: 'C',
    sourceChannel: '门店路过', intention: '常规洁牙', followUpPreference: '工作日上午',
    createdAt: '2026-03-05',
  },
  {
    id: '5', name: '赵敏', phone: '133****0005', gender: 'female',
    tags: ['儿童齿科'], level: 'gold', advisorId: '4', advisorName: '刘顾问',
    totalConsumption: 18600, visitCount: 9, leadQuality: 'B',
    sourceChannel: '微信公众号', intention: '儿童涂氟/窝沟封闭', followUpPreference: '周末下午',
    createdAt: '2025-12-01',
  },
  {
    id: '6', name: '刘洋', phone: '134****0004', gender: 'male',
    tags: ['牙齿矫正', 'VIP'], level: 'vip', advisorId: '2', advisorName: '王医生',
    totalConsumption: 62800, visitCount: 15, leadQuality: 'A',
    sourceChannel: '朋友推荐', intention: '隐形矫正', followUpPreference: '周末上午',
    createdAt: '2025-06-18',
  },
  {
    id: '7', name: '孙丽', phone: '132****0006', gender: 'female',
    tags: ['烤瓷牙', 'VIP', '种植牙'], level: 'diamond', advisorId: '1', advisorName: '林医生',
    totalConsumption: 128600, visitCount: 22, leadQuality: 'A',
    sourceChannel: '朋友推荐', intention: '全口修复', followUpPreference: '工作日上午',
    createdAt: '2025-03-20',
  },
  {
    id: '8', name: '周杰', phone: '131****0007', gender: 'male',
    tags: ['洁牙', '流失风险'], level: 'normal', advisorId: '3', advisorName: '张顾问',
    totalConsumption: 1200, visitCount: 2, leadQuality: 'D',
    sourceChannel: '美团点评', intention: '常规洁牙', followUpPreference: '晚间时段',
    createdAt: '2026-04-12',
  },
])

onMounted(() => {
  store.customers = mockCustomers.value
})

function toggleTag(tag: string) {
  const idx = store.filters.selectedTags.indexOf(tag)
  if (idx === -1) {
    store.filters.selectedTags.push(tag)
  } else {
    store.filters.selectedTags.splice(idx, 1)
  }
}

const levelColorMap: Record<string, string> = {
  normal: 'bg-gray-100 text-gray-600 border-gray-200',
  silver: 'bg-slate-100 text-slate-700 border-slate-200',
  gold: 'bg-amber-50 text-amber-700 border-amber-200',
  vip: 'bg-primary-50 text-primary-700 border-primary-200',
  diamond: 'bg-violet-50 text-violet-700 border-violet-200',
}

const levelLabelMap: Record<string, string> = {
  normal: '普通', silver: '银卡', gold: '金卡', vip: 'VIP', diamond: '钻石',
}

const qualityColorMap: Record<string, string> = {
  A: 'bg-emerald-100 text-emerald-700',
  B: 'bg-sky-100 text-sky-700',
  C: 'bg-amber-100 text-amber-700',
  D: 'bg-gray-100 text-gray-600',
}

function getTagColor(label: string) {
  return allTags.value.find(t => t.label === label)?.color || 'bg-gray-100 text-gray-600'
}

function goDetail(id: string) {
  router.push(`/customers/${id}`)
}
</script>

<template>
  <div class="p-6 space-y-5 bg-gray-50 min-h-screen">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">客户画像库</h1>
        <p class="text-gray-500 text-sm mt-1">
          共 <span class="text-primary-600 font-medium">{{ store.filteredCustomers.length }}</span> 位客户
        </p>
      </div>
      <div class="flex items-center gap-2">
        <div class="flex rounded-xl bg-white border border-gray-200 overflow-hidden p-1 shadow-card">
          <button
            :class="[
              'p-2 rounded-lg transition-all',
              viewMode === 'grid' ? 'bg-primary-500 text-white' : 'text-gray-400 hover:text-gray-600'
            ]"
            @click="viewMode = 'grid'"
          >
            <LayoutGrid class="w-4 h-4" />
          </button>
          <button
            :class="[
              'p-2 rounded-lg transition-all',
              viewMode === 'table' ? 'bg-primary-500 text-white' : 'text-gray-400 hover:text-gray-600'
            ]"
            @click="viewMode = 'table'"
          >
            <List class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <UCard class="border-0 shadow-card">
      <template #body>
        <div class="flex items-center gap-2 mb-4">
          <Filter class="w-4 h-4 text-gray-400" />
          <span class="text-sm font-medium text-gray-700">筛选条件</span>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <UFormGroup label="关键词搜索" class="md:col-span-2">
            <UInput v-model="store.filters.keyword" placeholder="姓名 / 手机号" size="md">
              <template #leading><Search class="w-4 h-4 text-gray-400" /></template>
            </UInput>
          </UFormGroup>
          <UFormGroup label="客户等级">
            <USelect v-model="store.filters.level" :options="levelOptions" size="md" />
          </UFormGroup>
          <UFormGroup label="归属顾问">
            <USelect v-model="store.filters.advisorId" :options="advisorOptions" size="md" />
          </UFormGroup>
          <UFormGroup label="线索质量">
            <USelect v-model="store.filters.leadQuality" :options="qualityOptions" size="md" />
          </UFormGroup>
        </div>
        <div class="mt-5">
          <label class="text-xs font-medium text-gray-500 mb-2 block">标签筛选（多选）</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="tag in allTags"
              :key="tag.id"
              :class="[
                'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                store.filters.selectedTags.includes(tag.label)
                  ? tag.color + ' border-transparent shadow-sm scale-105'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
              ]"
              @click="toggleTag(tag.label)"
            >
              {{ tag.label }}
            </button>
          </div>
        </div>
        <div class="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-100">
          <UButton variant="ghost" color="gray" size="sm" @click="store.resetFilters()">
            <template #leading><RotateCcw class="w-4 h-4" /></template>
            重置筛选
          </UButton>
        </div>
      </template>
    </UCard>

    <div v-if="viewMode === 'grid'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      <UCard
        v-for="c in store.filteredCustomers"
        :key="c.id"
        class="border-0 shadow-card hover:shadow-cardHover transition-all cursor-pointer group overflow-hidden"
        @click="goDetail(c.id)"
      >
        <template #body>
          <div class="flex items-start gap-4 mb-4">
            <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-md shadow-primary-500/20">
              {{ c.name.charAt(0) }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between mb-1">
                <p class="font-bold text-gray-800 text-lg">{{ c.name }}</p>
                <UBadge size="xs" variant="outline" :class="levelColorMap[c.level]">
                  {{ levelLabelMap[c.level] }}
                </UBadge>
              </div>
              <div class="flex items-center gap-1 text-xs text-gray-500">
                <Phone class="w-3 h-3" />
                <span>{{ c.phone }}</span>
              </div>
              <div class="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                <Users class="w-3 h-3" />
                <span>{{ c.advisorName }}</span>
              </div>
            </div>
          </div>
          <div class="flex flex-wrap gap-1.5 mb-4">
            <UBadge
              v-for="tag in c.tags.slice(0, 4)"
              :key="tag"
              size="xs"
              variant="subtle"
              :class="getTagColor(tag)"
            >
              {{ tag }}
            </UBadge>
            <UBadge v-if="c.tags.length > 4" size="xs" variant="outline" color="gray">+{{ c.tags.length - 4 }}</UBadge>
          </div>
          <div class="grid grid-cols-3 gap-2 py-3 border-t border-gray-100">
            <div class="text-center">
              <p class="text-xs text-gray-400 mb-0.5">累计消费</p>
              <p class="font-bold text-primary-600 text-sm">¥{{ c.totalConsumption.toLocaleString() }}</p>
            </div>
            <div class="text-center border-x border-gray-100">
              <p class="text-xs text-gray-400 mb-0.5">到店次数</p>
              <p class="font-bold text-gray-700 text-sm">{{ c.visitCount }}</p>
            </div>
            <div class="text-center">
              <p class="text-xs text-gray-400 mb-0.5">线索质量</p>
              <span :class="['inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold', qualityColorMap[c.leadQuality]]">
                {{ c.leadQuality }}
              </span>
            </div>
          </div>
          <div class="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <span class="text-xs text-gray-400 flex items-center gap-1">
              <Calendar class="w-3 h-3" />
              {{ c.createdAt }}
            </span>
            <span class="text-xs text-primary-500 font-medium flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
              查看详情 <ChevronRight class="w-3 h-3" />
            </span>
          </div>
        </template>
      </UCard>
    </div>

    <UTable
      v-else
      :rows="store.filteredCustomers"
      class="shadow-card rounded-xl overflow-hidden border-0"
    >
      <template #head>
        <UTh>客户信息</UTh>
        <UTh>标签</UTh>
        <UTh>等级</UTh>
        <UTh>归属顾问</UTh>
        <UTh class="text-right">累计消费</UTh>
        <UTh class="text-center">到店次数</UTh>
        <UTh class="text-center">线索质量</UTh>
        <UTh>创建时间</UTh>
        <UTh></UTh>
      </template>
      <template #body="{ rows }">
        <UTR v-for="c in rows" :key="c.id" class="hover:bg-primary-50/30 cursor-pointer transition-colors" @click="goDetail(c.id)">
          <UTD>
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700 font-bold flex-shrink-0">
                {{ c.name.charAt(0) }}
              </div>
              <div>
                <p class="font-medium text-gray-800">{{ c.name }}</p>
                <p class="text-xs text-gray-500">{{ c.phone }}</p>
              </div>
            </div>
          </UTD>
          <UTD>
            <div class="flex flex-wrap gap-1 max-w-[200px]">
              <UBadge
                v-for="tag in c.tags.slice(0, 3)"
                :key="tag"
                size="xs"
                variant="subtle"
                :class="getTagColor(tag)"
              >
                {{ tag }}
              </UBadge>
            </div>
          </UTD>
          <UTD>
            <UBadge size="xs" variant="outline" :class="levelColorMap[c.level]">{{ levelLabelMap[c.level] }}</UBadge>
          </UTD>
          <UTD class="text-gray-700">{{ c.advisorName }}</UTD>
          <UTD class="text-right font-semibold text-primary-600">¥{{ c.totalConsumption.toLocaleString() }}</UTD>
          <UTD class="text-center text-gray-700">{{ c.visitCount }}</UTD>
          <UTD class="text-center">
            <span :class="['inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold', qualityColorMap[c.leadQuality]]">
              {{ c.leadQuality }}
            </span>
          </UTD>
          <UTD class="text-gray-500 text-sm">{{ c.createdAt }}</UTD>
          <UTD class="text-right">
            <ChevronRight class="w-4 h-4 text-gray-400" />
          </UTD>
        </UTR>
      </template>
    </UTable>
  </div>
</template>
