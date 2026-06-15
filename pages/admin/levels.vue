<script setup lang="ts">
import { Plus, Edit2, Save, X, Trash2, Crown, TrendingUp, Gift, Star, Zap } from 'lucide-vue-next'

interface LevelItem {
  id: string
  name: string
  threshold: number
  benefits: string
  color: string
  icon: string
  customerCount: number
}

const levels = ref<LevelItem[]>([
  { id: '1', name: '普通客户', threshold: 0, benefits: '基础咨询服务、常规预约通道', color: '#6B7280', icon: 'Star', customerCount: 326 },
  { id: '2', name: '银卡会员', threshold: 5000, benefits: '9.5折优惠、优先预约、生日礼品', color: '#64748B', icon: 'Star', customerCount: 148 },
  { id: '3', name: '金卡会员', threshold: 20000, benefits: '9折优惠、VIP通道、免费洁牙1次/年、专属顾问', color: '#D97706', icon: 'Crown', customerCount: 87 },
  { id: '4', name: 'VIP会员', threshold: 50000, benefits: '8.5折优惠、VIP专属诊室、免费口腔检查、家庭套餐', color: '#0EA5A9', icon: 'Crown', customerCount: 35 },
  { id: '5', name: '钻石卡', threshold: 100000, benefits: '8折优惠、院长亲诊、终身质保、海外转诊服务', color: '#7C3AED', icon: 'Zap', customerCount: 12 },
])

const editingId = ref<string | null>(null)
const editingData = reactive({ name: '', threshold: 0, benefits: '' })
const showAdd = ref(false)
const newData = reactive({ name: '', threshold: 0, benefits: '' })

const iconMap: Record<string, any> = { Crown, Star, Zap }

function startEdit(l: LevelItem) {
  editingId.value = l.id
  editingData.name = l.name
  editingData.threshold = l.threshold
  editingData.benefits = l.benefits
}
function cancelEdit() { editingId.value = null }
function saveEdit(l: LevelItem) {
  if (!editingData.name.trim()) return
  l.name = editingData.name.trim()
  l.threshold = editingData.threshold
  l.benefits = editingData.benefits
  editingId.value = null
}
function deleteLevel(id: string) {
  const i = levels.value.findIndex(l => l.id === id)
  if (i > 0) levels.value.splice(i, 1)
}
function addLevel() {
  if (!newData.name.trim()) return
  levels.value.push({
    id: 'lv' + Date.now(),
    name: newData.name.trim(),
    threshold: newData.threshold,
    benefits: newData.benefits,
    color: '#0EA5A9',
    icon: 'Star',
    customerCount: 0,
  })
  newData.name = ''
  newData.threshold = 0
  newData.benefits = ''
  showAdd.value = false
}
</script>

<template>
  <div class="p-6 space-y-5 bg-gray-50 min-h-screen">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">客户等级配置</h1>
        <p class="text-gray-500 text-sm mt-1">配置客户等级体系、升级条件及权益内容</p>
      </div>
      <UButton color="primary" @click="showAdd = !showAdd">
        <template #leading><Plus class="w-4 h-4" /></template>
        新增等级
      </UButton>
    </div>

    <Transition name="slide-down">
      <UCard v-if="showAdd" class="border-0 shadow-card">
        <template #body>
          <div class="flex items-center gap-2 mb-5">
            <div class="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center">
              <Crown class="w-5 h-5 text-primary-500" />
            </div>
            <h3 class="font-semibold text-gray-800">新增客户等级</h3>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div class="md:col-span-3">
              <UFormGroup label="等级名称" required>
                <UInput v-model="newData.name" placeholder="如：白金会员" size="md" />
              </UFormGroup>
            </div>
            <div class="md:col-span-3">
              <UFormGroup label="升级阈值金额（¥）" required>
                <UInput v-model.number="newData.threshold" type="number" placeholder="0" size="md">
                  <template #leading><TrendingUp class="w-4 h-4 text-gray-400" /></template>
                </UInput>
              </UFormGroup>
            </div>
            <div class="md:col-span-5">
              <UFormGroup label="权益说明" required>
                <UInput v-model="newData.benefits" placeholder="如：9折优惠、专属顾问" size="md" />
              </UFormGroup>
            </div>
            <div class="md:col-span-1 flex items-end gap-2">
              <UButton block color="primary" size="md" @click="addLevel">添加</UButton>
            </div>
          </div>
        </template>
      </UCard>
    </Transition>

    <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
      <UCard
        v-for="(lv, idx) in levels"
        :key="lv.id"
        class="border-0 shadow-card overflow-hidden group hover:shadow-cardHover transition-all"
      >
        <div class="h-2 w-full" :style="{ background: lv.color }"></div>
        <template #body>
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center gap-3">
              <template v-if="editingId === lv.id">
                <UInput v-model="editingData.name" size="sm" class="!max-w-[180px]" />
              </template>
              <template v-else>
                <div
                  class="w-12 h-12 rounded-xl flex items-center justify-center shadow-md"
                  :style="{ background: lv.color + '20', color: lv.color }"
                >
                  <component :is="iconMap[lv.icon]" class="w-6 h-6" />
                </div>
                <div>
                  <h3 class="font-bold text-lg text-gray-800">{{ lv.name }}</h3>
                  <p class="text-xs text-gray-400">LV.{{ idx + 1 }}</p>
                </div>
              </template>
            </div>
            <div v-if="editingId === lv.id" class="flex gap-1">
              <UButton size="xs" color="primary" @click="saveEdit(lv)"><Save class="w-3 h-3" /></UButton>
              <UButton size="xs" variant="ghost" color="gray" @click="cancelEdit"><X class="w-3 h-3" /></UButton>
            </div>
            <div v-else class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <UButton size="xs" variant="ghost" color="gray" @click="startEdit(lv)"><Edit2 class="w-4 h-4" /></UButton>
              <UButton v-if="idx > 0" size="xs" variant="ghost" color="red" @click="deleteLevel(lv.id)"><Trash2 class="w-4 h-4" /></UButton>
            </div>
          </div>

          <div class="space-y-3">
            <div>
              <p class="text-xs text-gray-400 mb-1">升级阈值</p>
              <template v-if="editingId === lv.id">
                <UInput v-model.number="editingData.threshold" type="number" size="sm" />
              </template>
              <template v-else>
                <p class="text-xl font-bold" :style="{ color: lv.color }">
                  ¥{{ lv.threshold.toLocaleString() }}
                  <span class="text-xs text-gray-400 font-normal">累计消费</span>
                </p>
              </template>
            </div>
            <div>
              <p class="text-xs text-gray-400 mb-1.5 flex items-center gap-1">
                <Gift class="w-3 h-3" /> 专属权益
              </p>
              <template v-if="editingId === lv.id">
                <UInput v-model="editingData.benefits" size="sm" />
              </template>
              <template v-else>
                <div class="flex flex-wrap gap-1.5">
                  <UBadge
                    v-for="(b, bi) in lv.benefits.split('、')"
                    :key="bi"
                    size="xs"
                    variant="subtle"
                    class="px-2 py-1"
                    :style="{ background: lv.color + '15', color: lv.color }"
                  >
                    {{ b }}
                  </UBadge>
                </div>
              </template>
            </div>
          </div>

          <div class="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                <span class="text-xs font-bold" :style="{ color: lv.color }">{{ lv.customerCount }}</span>
              </div>
              <span class="text-xs text-gray-500">位客户</span>
            </div>
            <div class="h-2 flex-1 mx-4 rounded-full bg-gray-100 overflow-hidden">
              <div
                class="h-full rounded-full transition-all"
                :style="{
                  width: Math.min(100, (lv.customerCount / 400) * 100) + '%',
                  background: lv.color,
                }"
              ></div>
            </div>
          </div>
        </template>
      </UCard>
    </div>
  </div>
</template>

<style scoped>
.slide-down-enter-active, .slide-down-leave-active { transition: all 0.3s ease; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; transform: translateY(-10px); }
</style>
