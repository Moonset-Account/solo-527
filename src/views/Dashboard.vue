<script setup lang="ts">
import { computed } from 'vue'
import { useDataStore } from '@/stores/data'
import MetricCard from '@/components/common/MetricCard.vue'
import LineChart from '@/components/charts/LineChart.vue'
import SampleSizeBadge from '@/components/common/SampleSizeBadge.vue'
import PermissionGuard from '@/components/common/PermissionGuard.vue'
import { RefreshCw, MapPin } from 'lucide-vue-next'
import { ElButton, ElSelect, ElOption } from 'element-plus'

const dataStore = useDataStore()

const totalSampleSize = computed(() => {
  return dataStore.coreMetrics.reduce((sum, m) => sum + m.sampleSize, 0)
})

function handleRefresh() {
  dataStore.loadAllData(true)
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-bold text-gray-900">数据概览</h2>
        <p class="mt-1 text-sm text-gray-500 flex items-center gap-2">
          <span>基于聚合统计数据</span>
          <SampleSizeBadge :sample-size="Math.round(totalSampleSize / 4)" />
        </p>
      </div>
      <div class="flex items-center gap-3">
        <PermissionGuard permission="canViewAllStores">
          <div class="flex items-center gap-2">
            <MapPin class="w-4 h-4 text-gray-400" />
            <ElSelect
              v-model="dataStore.selectedRegion"
              size="small"
              placeholder="选择区域"
              style="width: 140px"
              @change="dataStore.loadAllData()"
            >
              <ElOption label="全部区域" value="all" />
              <ElOption
                v-for="region in dataStore.allRegions"
                :key="region"
                :label="region"
                :value="region"
              />
            </ElSelect>
          </div>
        </PermissionGuard>
        <ElButton size="small" @click="handleRefresh">
          <RefreshCw class="w-4 h-4 mr-1" />
          刷新数据
        </ElButton>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        v-for="metric in dataStore.coreMetrics"
        :key="metric.name"
        :name="metric.name"
        :value="metric.value"
        :unit="metric.unit"
        :trend="metric.trend"
        :sample-size="metric.sampleSize"
        :low-sample="metric.lowSample"
      />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-base font-semibold text-gray-800">客单价趋势</h3>
            <p class="text-xs text-gray-500 mt-0.5">近12个月客单价变化情况</p>
          </div>
        </div>
        <div class="h-72">
          <LineChart :data="dataStore.priceTrend" :height="280" />
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-base font-semibold text-gray-800">门店复购率排名</h3>
            <p class="text-xs text-gray-500 mt-0.5">Top 5 门店</p>
          </div>
        </div>
        <div class="space-y-3">
          <div
            v-for="(store, index) in dataStore.filteredStoreData.slice(0, 5)"
            :key="store.id"
            class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div
              class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
              :class="index === 0 ? 'bg-yellow-100 text-yellow-700' : index === 1 ? 'bg-gray-100 text-gray-600' : index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-50 text-gray-500'"
            >
              {{ index + 1 }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-800 truncate">{{ store.name }}</p>
              <p class="text-xs text-gray-500">{{ store.region }}</p>
            </div>
            <div class="text-right">
              <p class="text-sm font-semibold text-blue-600">{{ store.repurchaseRate }}%</p>
              <p class="text-xs text-gray-400">n={{ store.sampleSize }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="text-base font-semibold text-gray-800">门店数据总览</h3>
          <p class="text-xs text-gray-500 mt-0.5">各门店核心指标对比</p>
        </div>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-100">
              <th class="text-left py-3 px-4 font-medium text-gray-600">门店名称</th>
              <th class="text-left py-3 px-4 font-medium text-gray-600">所属区域</th>
              <th class="text-right py-3 px-4 font-medium text-gray-600">复购率</th>
              <th class="text-right py-3 px-4 font-medium text-gray-600">客单价</th>
              <th class="text-right py-3 px-4 font-medium text-gray-600">销售额</th>
              <th class="text-right py-3 px-4 font-medium text-gray-600">样本量</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="store in dataStore.filteredStoreData"
              :key="store.id"
              class="border-b border-gray-50 hover:bg-gray-50"
            >
              <td class="py-3 px-4 text-gray-800">{{ store.name }}</td>
              <td class="py-3 px-4">
                <span class="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                  {{ store.region }}
                </span>
              </td>
              <td class="py-3 px-4 text-right font-medium text-blue-600">{{ store.repurchaseRate }}%</td>
              <td class="py-3 px-4 text-right text-gray-700">¥{{ store.avgOrderValue.toFixed(0) }}</td>
              <td class="py-3 px-4 text-right text-gray-700">¥{{ (store.totalSales / 10000).toFixed(1) }}万</td>
              <td class="py-3 px-4 text-right">
                <SampleSizeBadge :sample-size="store.sampleSize" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
