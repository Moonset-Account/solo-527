<script setup lang="ts">
import { ref } from 'vue'
import { useDataStore } from '@/stores/data'
import FunnelChart from '@/components/charts/FunnelChart.vue'
import BarChart from '@/components/charts/BarChart.vue'
import SampleSizeBadge from '@/components/common/SampleSizeBadge.vue'
import { Calendar, TrendingUp, Info } from 'lucide-vue-next'
import { ElDatePicker } from 'element-plus'

const dataStore = useDataStore()
const dateRange = ref<[Date, Date] | null>(null)
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-bold text-gray-900">活动效果分析</h2>
        <p class="mt-1 text-sm text-gray-500 flex items-center gap-2">
          <span>优惠券活动效果与同类药品带动分析</span>
          <SampleSizeBadge :sample-size="15680" />
        </p>
      </div>
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-2">
          <Calendar class="w-4 h-4 text-gray-400" />
          <ElDatePicker
            v-model="dateRange"
            type="daterange"
            size="small"
            placeholder="选择活动周期"
          />
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-base font-semibold text-gray-800 flex items-center gap-2">
              <TrendingUp class="w-4 h-4 text-blue-500" />
              优惠券转化漏斗
            </h3>
            <p class="text-xs text-gray-500 mt-0.5">领取→使用→复购全链路转化</p>
          </div>
          <div class="flex items-center gap-2 text-xs text-gray-500">
            <Info class="w-3.5 h-3.5" />
            <span>各环节标注样本量</span>
          </div>
        </div>
        <div class="h-80">
          <FunnelChart :data="dataStore.funnelData" :height="320" />
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-base font-semibold text-gray-800">活动效果指标</h3>
            <p class="text-xs text-gray-500 mt-0.5">核心转化数据概览</p>
          </div>
        </div>
        <div class="space-y-4">
          <div
            v-for="step in dataStore.funnelData"
            :key="step.name"
            class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <span class="text-blue-600 font-bold text-sm">
                  {{ dataStore.funnelData.indexOf(step) + 1 }}
                </span>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-800">{{ step.name }}</p>
                <p class="text-xs text-gray-500">样本量 n={{ step.sampleSize }}</p>
              </div>
            </div>
            <div class="text-right">
              <p class="text-lg font-bold text-gray-900">{{ step.value.toLocaleString() }}</p>
              <p
                class="text-xs font-medium"
                :class="step.conversionRate >= 50 ? 'text-green-600' : step.conversionRate >= 30 ? 'text-blue-600' : 'text-orange-600'"
              >
                转化率 {{ step.conversionRate }}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="text-base font-semibold text-gray-800">同类药品活动前后对比</h3>
          <p class="text-xs text-gray-500 mt-0.5">
            活动结束后评估优惠券对同类药品的带动效应
          </p>
        </div>
        <div class="flex items-center gap-4 text-xs">
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded bg-gray-400"></div>
            <span class="text-gray-600">活动前</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded bg-blue-500"></div>
            <span class="text-gray-600">活动后</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded bg-orange-400"></div>
            <span class="text-gray-600">低样本</span>
          </div>
        </div>
      </div>
      <div class="h-80">
        <BarChart :data="dataStore.medicineComparison" :height="320" />
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="text-base font-semibold text-gray-800">活动详情配置</h3>
          <p class="text-xs text-gray-500 mt-0.5">活动口径配置与效果追踪</p>
        </div>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-100">
              <th class="text-left py-3 px-4 font-medium text-gray-600">活动名称</th>
              <th class="text-left py-3 px-4 font-medium text-gray-600">活动周期</th>
              <th class="text-left py-3 px-4 font-medium text-gray-600">优惠券类型</th>
              <th class="text-right py-3 px-4 font-medium text-gray-600">领取数</th>
              <th class="text-right py-3 px-4 font-medium text-gray-600">使用率</th>
              <th class="text-right py-3 px-4 font-medium text-gray-600">带动效果</th>
              <th class="text-right py-3 px-4 font-medium text-gray-600">样本量</th>
            </tr>
          </thead>
          <tbody>
            <tr class="border-b border-gray-50 hover:bg-gray-50">
              <td class="py-3 px-4 text-gray-800 font-medium">慢病会员专享优惠</td>
              <td class="py-3 px-4 text-gray-600">2025-06-01 ~ 2025-06-30</td>
              <td class="py-3 px-4">
                <span class="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded">满减券</span>
              </td>
              <td class="py-3 px-4 text-right text-gray-700">15,680</td>
              <td class="py-3 px-4 text-right text-green-600 font-medium">56.9%</td>
              <td class="py-3 px-4 text-right text-green-600 font-medium">+12.5%</td>
              <td class="py-3 px-4 text-right">
                <SampleSizeBadge :sample-size="15680" />
              </td>
            </tr>
            <tr class="border-b border-gray-50 hover:bg-gray-50">
              <td class="py-3 px-4 text-gray-800 font-medium">夏季清热药品促销</td>
              <td class="py-3 px-4 text-gray-600">2025-07-01 ~ 2025-07-15</td>
              <td class="py-3 px-4">
                <span class="px-2 py-0.5 bg-green-50 text-green-600 text-xs rounded">折扣券</span>
              </td>
              <td class="py-3 px-4 text-right text-gray-700">8,920</td>
              <td class="py-3 px-4 text-right text-blue-600 font-medium">48.2%</td>
              <td class="py-3 px-4 text-right text-green-600 font-medium">+8.3%</td>
              <td class="py-3 px-4 text-right">
                <SampleSizeBadge :sample-size="8920" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
