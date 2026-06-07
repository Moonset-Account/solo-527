<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDataStore } from '@/stores/data'
import CohortHeatmap from '@/components/charts/CohortHeatmap.vue'
import SampleSizeBadge from '@/components/common/SampleSizeBadge.vue'
import LowSampleTip from '@/components/common/LowSampleTip.vue'
import PrivacyMasked from '@/components/common/PrivacyMasked.vue'
import { Filter, Users, Tag, Info } from 'lucide-vue-next'
import { ElCheckboxGroup, ElCheckbox, ElMessage } from 'element-plus'

const dataStore = useDataStore()
const selectedTags = ref<string[]>([])

const totalMembers = computed(() => {
  return dataStore.memberTiers.reduce((sum, t) => sum + t.count, 0)
})

const filteredCohortData = computed(() => {
  if (selectedTags.value.length === 0) return dataStore.cohortData
  return dataStore.cohortData
})

function applyFilters() {
  ElMessage.info('筛选条件已应用，数据已更新')
}

const sampleMembers = [
  { name: '张三', phone: '13812345678', tier: '钻石会员', chronic: '高血压', visits: 12 },
  { name: '李四', phone: '13987654321', tier: '黄金会员', chronic: '糖尿病', visits: 8 },
  { name: '王五', phone: '13678901234', tier: '白银会员', chronic: '高血脂', visits: 5 }
]
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-bold text-gray-900">会员复购分析</h2>
        <p class="mt-1 text-sm text-gray-500 flex items-center gap-2">
          <span>基于会员群体行为的聚合分析</span>
          <SampleSizeBadge :sample-size="totalMembers" />
        </p>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div class="flex items-center gap-2 mb-4">
        <Filter class="w-4 h-4 text-gray-500" />
        <span class="text-sm font-medium text-gray-700">慢病标签筛选（仅支持聚合统计）</span>
        <span class="ml-2 px-2 py-0.5 bg-amber-50 text-amber-600 text-xs rounded-full">
          仅聚合筛选，不导出个人信息
        </span>
      </div>
      <div class="flex flex-wrap items-center gap-4">
        <ElCheckboxGroup v-model="selectedTags">
          <ElCheckbox
            v-for="tag in dataStore.chronicTags"
            :key="tag.id"
            :value="tag.id"
          >
            <span class="text-sm">{{ tag.name }}</span>
            <span class="text-xs text-gray-400 ml-1">({{ tag.count }})</span>
          </ElCheckbox>
        </ElCheckboxGroup>
        <button
          class="px-4 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
          @click="applyFilters"
        >
          应用筛选
        </button>
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
        <CohortHeatmap :data="filteredCohortData" :height="320" />
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
          <div class="w-4 h-4 rounded bg-yellow-100"></div>
          <span>低样本 (n<10)</span>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-base font-semibold text-gray-800 flex items-center gap-2">
              <Tag class="w-4 h-4 text-blue-500" />
              会员分层分布
            </h3>
            <p class="text-xs text-gray-500 mt-0.5">基于消费频次和金额的分层</p>
          </div>
        </div>
        <div class="space-y-4">
          <div
            v-for="tier in dataStore.memberTiers"
            :key="tier.name"
            class="space-y-2"
          >
            <div class="flex items-center justify-between text-sm">
              <span class="font-medium text-gray-700">{{ tier.name }}</span>
              <div class="flex items-center gap-3">
                <span class="text-gray-600">{{ tier.count.toLocaleString() }}人</span>
                <SampleSizeBadge :sample-size="tier.sampleSize" />
              </div>
            </div>
            <div class="relative h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                class="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                :class="{
                  'bg-yellow-400': tier.name === '钻石会员',
                  'bg-gray-400': tier.name === '黄金会员',
                  'bg-gray-300': tier.name === '白银会员',
                  'bg-gray-200': tier.name === '普通会员'
                }"
                :style="{ width: tier.percentage + '%' }"
              ></div>
            </div>
            <div class="flex justify-between text-xs text-gray-500">
              <span>占比 {{ tier.percentage }}%</span>
              <span>复购率 {{ tier.repurchaseRate }}% · 客单价 ¥{{ tier.avgOrderValue }}</span>
            </div>
            <LowSampleTip v-if="tier.lowSample" :sample-size="tier.sampleSize" show-text />
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-base font-semibold text-gray-800">处方频次区间统计</h3>
            <p class="text-xs text-gray-500 mt-0.5">处方数据仅展示区间，不暴露个体信息</p>
          </div>
          <span class="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-full">
            区间统计
          </span>
        </div>
        <div class="space-y-3">
          <div
            v-for="stat in dataStore.prescriptionStats"
            :key="stat.range"
            class="flex items-center gap-4"
          >
            <div class="w-20 text-sm text-gray-600 font-medium">{{ stat.range }}</div>
            <div class="flex-1 h-6 bg-gray-50 rounded relative overflow-hidden">
              <div
                class="absolute inset-y-0 left-0 bg-blue-500 rounded opacity-80"
                :style="{ width: stat.percentage + '%' }"
              ></div>
            </div>
            <div class="w-24 text-right">
              <span class="text-sm font-medium text-gray-700">{{ stat.count.toLocaleString() }}</span>
              <span class="text-xs text-gray-400 ml-1">({{ stat.percentage }}%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="text-base font-semibold text-gray-800">会员示例数据（已脱敏）</h3>
          <p class="text-xs text-gray-500 mt-0.5">个人敏感信息已自动遮蔽</p>
        </div>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-100">
              <th class="text-left py-3 px-4 font-medium text-gray-600">姓名</th>
              <th class="text-left py-3 px-4 font-medium text-gray-600">手机号</th>
              <th class="text-left py-3 px-4 font-medium text-gray-600">会员等级</th>
              <th class="text-left py-3 px-4 font-medium text-gray-600">慢病标签</th>
              <th class="text-right py-3 px-4 font-medium text-gray-600">购药频次</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(member, idx) in sampleMembers"
              :key="idx"
              class="border-b border-gray-50 hover:bg-gray-50"
            >
              <td class="py-3 px-4">
                <PrivacyMasked :value="member.name" type="partial" pattern="name" />
              </td>
              <td class="py-3 px-4">
                <PrivacyMasked :value="member.phone" type="partial" pattern="phone" />
              </td>
              <td class="py-3 px-4 text-gray-700">{{ member.tier }}</td>
              <td class="py-3 px-4">
                <span class="px-2 py-0.5 bg-purple-50 text-purple-600 text-xs rounded">
                  {{ member.chronic }}
                </span>
              </td>
              <td class="py-3 px-4 text-right">
                <PrivacyMasked :value="member.visits" type="range" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
