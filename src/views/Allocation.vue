<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAllocationStore } from '@/stores/allocation'
import { useEnergyStore } from '@/stores/energy'
import { mockTenants } from '@/mock'
import { formatNumber } from '@/utils'
import { Settings, Calculator, FileDown, ChevronDown, ChevronUp } from 'lucide-vue-next'
import type { AllocationMethod } from '@/types'

const allocationStore = useAllocationStore()
const energyStore = useEnergyStore()

const selectedMethod = ref<AllocationMethod>('by_area')
const expandedRow = ref<string | null>(null)

const methods = [
  { value: 'by_area', label: '按面积分摊', desc: '根据各租户租赁面积占比分摊公共能耗' },
  { value: 'by_people', label: '按人数分摊', desc: '根据各租户员工人数占比分摊公共能耗' },
  { value: 'by_usage_ratio', label: '按用量比例分摊', desc: '根据各租户能耗占比分摊公共能耗' },
  { value: 'even', label: '平均分摊', desc: '将公共能耗平均分摊给所有租户' }
]

const totalArea = computed(() => mockTenants.reduce((sum, t) => sum + t.area, 0))
const totalPeople = computed(() => mockTenants.reduce((sum, t) => sum + t.peopleCount, 0))

function toggleRow(id: string) {
  expandedRow.value = expandedRow.value === id ? null : id
}

function changeMethod(method: AllocationMethod) {
  selectedMethod.value = method
  const rule = allocationStore.rules.find(r => r.method === method)
  if (rule) {
    allocationStore.setActiveRule(rule.id)
  }
}

function exportResults() {
  const csvContent = [
    ['租户名称', '租户面积(㎡)', '员工人数', '租户自耗(kWh)', '公共分摊(kWh)', '总能耗(kWh)', '分摊口径'],
    ...allocationStore.results.map(r => [
      r.tenantName,
      mockTenants.find(t => t.id === r.tenantId)?.area || 0,
      mockTenants.find(t => t.id === r.tenantId)?.peopleCount || 0,
      r.tenantUsage.toFixed(2),
      r.allocatedEnergy.toFixed(2),
      r.totalEnergy.toFixed(2),
      r.formula
    ])
  ].map(row => row.join(',')).join('\n')

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `租户能耗分摊_${allocationStore.period}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}
</script>

<template>
  <div class="space-y-6">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="card p-5">
        <p class="text-sm text-slate-400 mb-2">公共区域总能耗</p>
        <p class="text-2xl font-mono font-bold text-white">
          <input
            v-model.number="allocationStore.commonEnergy"
            type="number"
            class="bg-transparent border-b border-slate-600 focus:border-brand-500 outline-none w-32 text-right"
          />
        </p>
        <p class="text-xs text-slate-500 mt-1">kWh · {{ allocationStore.period }}</p>
      </div>
      <div class="card p-5">
        <p class="text-sm text-slate-400 mb-2">已分摊能耗</p>
        <p class="text-2xl font-mono font-bold text-brand-400">{{ formatNumber(allocationStore.totalAllocated) }} kWh</p>
        <p class="text-xs text-slate-500 mt-1">共 {{ mockTenants.length }} 户租户</p>
      </div>
      <div class="card p-5">
        <p class="text-sm text-slate-400 mb-2">租户自耗总计</p>
        <p class="text-2xl font-mono font-bold text-status-success">{{ formatNumber(allocationStore.totalTenantUsage) }} kWh</p>
        <p class="text-xs text-slate-500 mt-1">不含公共分摊</p>
      </div>
      <div class="card p-5">
        <p class="text-sm text-slate-400 mb-2">总能耗</p>
        <p class="text-2xl font-mono font-bold text-white">{{ formatNumber(allocationStore.grandTotal) }} kWh</p>
        <p class="text-xs text-slate-500 mt-1">自耗 + 公共分摊</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div class="card p-5">
        <div class="flex items-center gap-2 mb-4">
          <Settings class="w-5 h-5 text-brand-400" />
          <h3 class="font-medium text-white">分摊规则配置</h3>
        </div>

        <div class="space-y-2">
          <button
            v-for="method in methods"
            :key="method.value"
            @click="changeMethod(method.value as AllocationMethod)"
            class="w-full text-left p-3 rounded-lg transition-all"
            :class="selectedMethod === method.value
              ? 'bg-brand-600/20 border border-brand-500/30'
              : 'bg-bg-tertiary/30 hover:bg-bg-tertiary/50 border border-transparent'"
          >
            <p class="text-sm font-medium" :class="selectedMethod === method.value ? 'text-brand-400' : 'text-slate-200'">
              {{ method.label }}
            </p>
            <p class="text-xs text-slate-500 mt-1">{{ method.desc }}</p>
          </button>
        </div>

        <div class="mt-4 p-3 bg-bg-tertiary/30 rounded-lg">
          <p class="text-xs text-slate-400 mb-2">当前分摊口径</p>
          <p class="text-sm text-slate-200">
            <template v-if="selectedMethod === 'by_area'">
              公共能耗 × (租户面积 / 总面积 {{ totalArea }}㎡)
            </template>
            <template v-else-if="selectedMethod === 'by_people'">
              公共能耗 × (租户人数 / 总人数 {{ totalPeople }}人)
            </template>
            <template v-else-if="selectedMethod === 'by_usage_ratio'">
              公共能耗 × (租户自耗 / 总自耗)
            </template>
            <template v-else>
              公共能耗 / 租户数量 ({{ mockTenants.length }}户)
            </template>
          </p>
        </div>
      </div>

      <div class="lg:col-span-3 card p-5">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <Calculator class="w-5 h-5 text-brand-400" />
            <h3 class="font-medium text-white">分摊明细</h3>
          </div>
          <button
            @click="exportResults"
            class="flex items-center gap-2 px-3 py-1.5 text-sm bg-brand-600 hover:bg-brand-500 text-white rounded-lg transition-colors"
          >
            <FileDown class="w-4 h-4" />
            导出对账单
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="data-table">
            <thead>
              <tr>
                <th>租户名称</th>
                <th>所在楼层</th>
                <th>面积(㎡)</th>
                <th>员工人数</th>
                <th>租户自耗(kWh)</th>
                <th>公共分摊(kWh)</th>
                <th>总能耗(kWh)</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <template v-for="result in allocationStore.results" :key="result.id">
                <tr class="cursor-pointer" @click="toggleRow(result.id)">
                  <td class="font-medium">{{ result.tenantName }}</td>
                  <td>{{ mockTenants.find(t => t.id === result.tenantId)?.floorId.replace('flr-00', '') }}F</td>
                  <td class="font-mono">{{ mockTenants.find(t => t.id === result.tenantId)?.area }}</td>
                  <td class="font-mono">{{ mockTenants.find(t => t.id === result.tenantId)?.peopleCount }}</td>
                  <td class="font-mono text-slate-300">{{ formatNumber(result.tenantUsage) }}</td>
                  <td class="font-mono text-brand-400">{{ formatNumber(result.allocatedEnergy) }}</td>
                  <td class="font-mono font-medium text-white">{{ formatNumber(result.totalEnergy) }}</td>
                  <td>
                    <component
                      :is="expandedRow === result.id ? ChevronUp : ChevronDown"
                      class="w-4 h-4 text-slate-400"
                    />
                  </td>
                </tr>
                <tr v-if="expandedRow === result.id" class="bg-bg-tertiary/20">
                  <td colspan="8" class="py-4">
                    <div class="pl-4 space-y-2">
                      <p class="text-sm text-slate-300">
                        <span class="text-slate-500">分摊计算公式：</span>
                        <code class="bg-bg-tertiary px-2 py-0.5 rounded text-brand-300">{{ result.formula }}</code>
                      </p>
                      <p class="text-sm text-slate-300">
                        <span class="text-slate-500">计算过程：</span>
                        {{ allocationStore.commonEnergy.toFixed(2) }} kWh × ({{ formatNumber(result.allocatedEnergy / allocationStore.commonEnergy * 100, 1) }}%)
                        = {{ formatNumber(result.allocatedEnergy) }} kWh
                      </p>
                      <p class="text-sm text-slate-300">
                        <span class="text-slate-500">联系人：</span>
                        {{ mockTenants.find(t => t.id === result.tenantId)?.contact }}
                      </p>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>

        <div class="mt-4 p-4 bg-status-info/10 border border-status-info/20 rounded-lg">
          <p class="text-sm text-status-info">
            <strong>对账说明：</strong>本对账单仅包含统计周期内的有效数据样本（{{ energyStore?.stats?.sampleCount || 0 }}/{{ energyStore?.stats?.totalSamples || 0 }}），
            离线设备时段数据已排除，不参与分摊计算。如需详细数据请导出完整报告。
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
