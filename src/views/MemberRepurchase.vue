<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useDataStore } from '@/stores/data'
import CohortHeatmap from '@/components/charts/CohortHeatmap.vue'
import SampleSizeBadge from '@/components/common/SampleSizeBadge.vue'
import LowSampleTip from '@/components/common/LowSampleTip.vue'
import PrivacyMasked from '@/components/common/PrivacyMasked.vue'
import { Filter, Users, Tag, Info, RefreshCw, AlertTriangle } from 'lucide-vue-next'
import { ElCheckboxGroup, ElCheckbox, ElMessage, ElLoading } from 'element-plus'
import { CHRONIC_LABELS, MEMBER_TIERS } from '@/utils/constants'
import type { UserRole } from '@/types'

const dataStore = useDataStore()
const selectedTags = ref<string[]>([])
const selectedTiers = ref<string[]>([])
const isApplying = ref(false)

const totalSampleSize = computed(() => {
  const firstCohort = dataStore.cohortData[0]
  if (!firstCohort) return 0
  const firstCell = firstCohort.cells[0]
  return firstCell?.sampleSize || 0
})

const hasLowSample = computed(() => {
  return dataStore.cohortData.some(cohort => 
    cohort.cells.some(cell => cell.lowSample)
  )
})

async function applyFilters() {
  isApplying.value = true
  const loading = ElLoading.service({
    lock: true,
    text: '正在查询 ClickHouse...',
    background: 'rgba(255, 255, 255, 0.7)'
  })
  
  try {
    dataStore.setChronicLabels(selectedTags.value)
    dataStore.updateFilter({ memberTier: selectedTiers.value })
    
    await dataStore.loadCohortData()
    await dataStore.loadPrescriptionRanges()
    
    ElMessage.success({
      message: `数据已更新 · 查询耗时 ${dataStore.lastExecutionTime}ms · 查询ID: ${dataStore.lastQueryId}`,
      duration: 3000
    })
  } catch (e) {
    ElMessage.error('数据加载失败，请重试')
  } finally {
    loading.close()
    isApplying.value = false
  }
}

function resetFilters() {
  selectedTags.value = []
  selectedTiers.value = []
  dataStore.clearFilter()
  applyFilters()
}

const memberTiers = computed(() => {
  return MEMBER_TIERS.map(tier => ({
    ...tier,
    count: Math.floor(Math.random() * 5000 + 1000)
  }))
})

const totalMembers = computed(() => {
  return memberTiers.value.reduce((sum, t) => sum + t.count, 0)
})

const sampleMembers = [
  { name: '张三', phone: '13812345678', tier: '钻石会员', chronic: '高血压', visits: 12 },
  { name: '李四', phone: '13987654321', tier: '黄金会员', chronic: '糖尿病', visits: 8 },
  { name: '王五', phone: '13678901234', tier: '白银会员', chronic: '高血脂', visits: 5 }
]

const currentRole = computed<UserRole | ''>(() => {
  return useDataStore().$state?.user?.role || ''
})

onMounted(() => {
  if (dataStore.cohortData.length === 0) {
    applyFilters()
  }
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-bold text-gray-900">会员复购分析</h2>
        <p class="mt-1 text-sm text-gray-500 flex items-center gap-2">
          <span>基于会员群体行为的聚合分析</span>
          <SampleSizeBadge :sample-size="totalSampleSize" />
          <span v-if="dataStore.lastQueryId" class="text-gray-400">
            查询ID: {{ dataStore.lastQueryId.slice(0, 12) }}...
          </span>
        </p>
      </div>
      <button
        class="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
        @click="applyFilters"
        :disabled="isApplying"
      >
        <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': isApplying }" />
        刷新数据
      </button>
    </div>

    <div v-if="hasLowSample">
      <LowSampleTip message="当前筛选条件下部分数据样本量不足，结果仅供参考" />
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div class="flex items-center gap-2 mb-4">
        <Filter class="w-4 h-4 text-gray-500" />
        <span class="text-sm font-medium text-gray-700">慢病标签筛选（仅支持聚合统计）</span>
        <span class="ml-2 px-2 py-0.5 bg-amber-50 text-amber-600 text-xs rounded-full">
          仅聚合筛选，不导出个人信息
        </span>
        <span v-if="selectedTags.length > 0" class="ml-2 px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full">
          已选 {{ selectedTags.length }} 个标签
        </span>
      </div>
      <div class="space-y-4">
        <div>
          <p class="text-xs text-gray-500 mb-2">慢病标签</p>
          <div class="flex flex-wrap gap-3">
            <ElCheckboxGroup v-model="selectedTags">
              <ElCheckbox
                v-for="tag in CHRONIC_LABELS"
                :key="tag.id"
                :value="tag.id"
                class="!mr-0"
              >
                <span class="text-sm">{{ tag.name }}</span>
              </ElCheckbox>
            </ElCheckboxGroup>
          </div>
        </div>
        <div>
          <p class="text-xs text-gray-500 mb-2">会员等级</p>
          <div class="flex flex-wrap gap-3">
            <ElCheckboxGroup v-model="selectedTiers">
              <ElCheckbox
                v-for="tier in MEMBER_TIERS"
                :key="tier.id"
                :value="tier.id"
                class="!mr-0"
              >
                <span class="text-sm">{{ tier.name }}</span>
              </ElCheckbox>
            </ElCheckboxGroup>
          </div>
        </div>
      </div>
      <div class="mt-4 flex items-center gap-3">
        <button
          class="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
          @click="applyFilters"
          :disabled="isApplying"
        >
          {{ isApplying ? '查询中...' : '应用筛选' }}
        </button>
        <button
          class="px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors"
          @click="resetFilters"
          :disabled="isApplying"
        >
          重置
        </button>
        <div v-if="dataStore.hasActiveFilter" class="flex items-center gap-1 text-xs text-blue-600">
          <AlertTriangle class="w-3.5 h-3.5" />
          <span>筛选条件已生效，数据范围受限</span>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="text-base font-semibold text-gray-800 flex items-center gap-2">
            <Users class="w-4 h-4 text-blue-500" />
            会员留存 Cohort 分析
          </h3>
          <p class="text-xs text-gray-500 mt-0.5">按月入群的会员留存复购情况</p>
        </div>
        <div class="flex items-center gap-2 text-xs text-gray-500">
          <Info class="w-3.5 h-3.5" />
          <span>单元格内标注留存率和样本量</span>
        </div>
      </div>
      <div class="h-80">
        <CohortHeatmap :data="dataStore.cohortData" :height="320" />
      </div>
      <div class="mt-4 flex items-center gap-4 text-xs text-gray-500">
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 rounded" style="background-color: #eff6ff"></div>
          <span>低留存</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 rounded" style="background-color: #2563eb"></div>
          <span>高留存</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 rounded" style="background-color: #fef3c7"></div>
          <span>低样本</span>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div class="flex items-center gap-2 mb-4">
          <Tag class="w-4 h-4 text-purple-500" />
          <h3 class="text-base font-semibold text-gray-800">会员分层分布</h3>
        </div>
        <div class="space-y-3">
          <div
            v-for="tier in memberTiers"
            :key="tier.id"
            class="flex items-center justify-between"
          >
            <div class="flex items-center gap-2">
              <div
                class="w-3 h-3 rounded-full"
                :style="{ backgroundColor: tier.color }"
              />
              <span class="text-sm text-gray-700">{{ tier.name }}</span>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-sm font-medium text-gray-900">{{ tier.count.toLocaleString() }}</span>
              <div class="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all"
                  :style="{
                    width: (tier.count / totalMembers * 100) + '%',
                    backgroundColor: tier.color
                  }"
                />
              </div>
              <span class="text-xs text-gray-500 w-10 text-right">
                {{ (tier.count / totalMembers * 100).toFixed(1) }}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div class="flex items-center gap-2 mb-4">
          <AlertTriangle class="w-4 h-4 text-orange-500" />
          <h3 class="text-base font-semibold text-gray-800">处方次数区间统计</h3>
          <span class="ml-2 px-2 py-0.5 bg-orange-50 text-orange-600 text-xs rounded-full">
            仅区间聚合
          </span>
        </div>
        <div class="space-y-3">
          <div
            v-for="range in dataStore.prescriptionRanges"
            :key="range.range"
            class="flex items-center justify-between"
          >
            <span class="text-sm text-gray-700">{{ range.range }}</span>
            <div class="flex items-center gap-3">
              <span class="text-sm font-medium" :class="range.lowSample ? 'text-orange-500' : 'text-gray-900'">
                {{ range.lowSample ? 'n<10' : range.memberCount.toLocaleString() + '人' }}
              </span>
              <div class="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  class="h-full bg-orange-400 rounded-full"
                  :style="{ width: (range.lowSample ? 10 : range.memberCount / 3000 * 100) + '%' }"
                />
              </div>
              <SampleSizeBadge
                v-if="!range.lowSample"
                :sample-size="range.memberCount"
                class="w-10"
              />
            </div>
          </div>
        </div>
        <p class="mt-4 text-xs text-gray-400 flex items-center gap-1">
          <Info class="w-3 h-3" />
          处方相关字段仅允许形成区间统计，禁止导出单条记录
        </p>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div class="flex items-center gap-2 mb-4">
        <Info class="w-4 h-4 text-gray-500" />
        <h3 class="text-base font-semibold text-gray-800">隐私字段遮蔽演示</h3>
        <span class="ml-2 px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full">
          根据权限自动脱敏
        </span>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-100">
              <th class="text-left py-2 px-3 text-gray-500 font-medium">姓名</th>
              <th class="text-left py-2 px-3 text-gray-500 font-medium">手机号</th>
              <th class="text-left py-2 px-3 text-gray-500 font-medium">会员等级</th>
              <th class="text-left py-2 px-3 text-gray-500 font-medium">慢病标签</th>
              <th class="text-left py-2 px-3 text-gray-500 font-medium">到店次数</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(member, idx) in sampleMembers" :key="idx" class="border-b border-gray-50">
              <td class="py-2 px-3">
                <PrivacyMasked :value="member.name" type="partial" />
              </td>
              <td class="py-2 px-3">
                <PrivacyMasked :value="member.phone" type="partial" pattern="phone" />
              </td>
              <td class="py-2 px-3 text-gray-700">{{ member.tier }}</td>
              <td class="py-2 px-3 text-gray-600">{{ member.chronic }}</td>
              <td class="py-2 px-3 text-gray-700">{{ member.visits }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="mt-4 text-xs text-gray-400">
        注意：以上为演示数据，展示隐私字段遮蔽效果。实际系统中运营仅能查看聚合统计，无法查看个人明细。
      </p>
    </div>
  </div>
</template>
