<script setup lang="ts">
import { ref, computed } from 'vue'
import { useEnergyStore } from '@/stores/energy'
import { useAllocationStore } from '@/stores/allocation'
import { formatNumber, formatDate, exportToCSV, export2DToCSV } from '@/utils'
import { FileText, Download, Calendar, Layers, Eye, FileSpreadsheet, FileJson } from 'lucide-vue-next'
import type { Dimension, ReportConfig, AllocationMethod, AllocationResult, EnergyStats } from '@/types'

const energyStore = useEnergyStore()
const allocationStore = useAllocationStore()

const reportConfig = ref<ReportConfig>({
  title: '楼宇能耗分析报告',
  startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  endTime: new Date().toISOString().split('T')[0],
  dimension: 'building',
  includeAllocation: true,
  allocationRuleId: 'rule-001'
})

const showPreview = ref(false)
const previewStats = ref<EnergyStats | null>(null)
const previewAllocation = ref<Omit<AllocationResult, 'id' | 'ruleId' | 'period'>[]>([])

const dimensions = [
  { value: 'building', label: '楼栋维度' },
  { value: 'floor', label: '楼层维度' },
  { value: 'tenant', label: '租户维度' },
  { value: 'device', label: '设备维度' }
]

const reportTypes = [
  { value: 'summary', label: '能耗汇总报告', icon: FileText },
  { value: 'peak_valley', label: '峰谷分析报告', icon: Layers },
  { value: 'allocation', label: '租户分摊报告', icon: FileSpreadsheet }
]

const selectedType = ref('summary')

const timeWindow = computed(() => {
  return `${reportConfig.value.startTime} 至 ${reportConfig.value.endTime}`
})

const sampleCount = computed(() => {
  if (previewStats.value) {
    return {
      valid: previewStats.value.sampleCount,
      total: previewStats.value.totalSamples,
      rate: ((previewStats.value.sampleCount / Math.max(previewStats.value.totalSamples, 1)) * 100).toFixed(1)
    }
  }
  return {
    valid: energyStore.stats.sampleCount,
    total: energyStore.stats.totalSamples,
    rate: ((energyStore.stats.sampleCount / Math.max(energyStore.stats.totalSamples, 1)) * 100).toFixed(1)
  }
})

const currentAllocationRule = computed(() => {
  return allocationStore.rules.find(r => r.id === reportConfig.value.allocationRuleId) || allocationStore.activeRule
})

const totalAllocated = computed(() => {
  return previewAllocation.value.reduce((sum, r) => sum + r.allocatedEnergy, 0)
})

const totalTenantUsage = computed(() => {
  return previewAllocation.value.reduce((sum, r) => sum + r.tenantUsage, 0)
})

const grandTotal = computed(() => {
  return totalAllocated.value + totalTenantUsage.value
})

function generateReport() {
  previewStats.value = energyStore.getStatsByDateRange(
    reportConfig.value.startTime,
    reportConfig.value.endTime
  )
  
  if (reportConfig.value.includeAllocation && currentAllocationRule.value) {
    previewAllocation.value = energyStore.getCustomAllocationResult(
      reportConfig.value.startTime,
      reportConfig.value.endTime,
      currentAllocationRule.value.method as AllocationMethod,
      allocationStore.commonEnergy
    )
  } else {
    previewAllocation.value = []
  }
  
  showPreview.value = true
}

function downloadCSV() {
  const stats = previewStats.value || energyStore.stats
  const reportData = [
    {
      '报告标题': reportConfig.value.title,
      '时间窗口': timeWindow.value,
      '分析维度': dimensions.find(d => d.value === reportConfig.value.dimension)?.label,
      '有效样本数': sampleCount.value.valid,
      '总样本数': sampleCount.value.total,
      '样本完整率': `${sampleCount.value.rate}%`,
      '总能耗(kWh)': formatNumber(stats.total),
      '尖峰能耗(kWh)': formatNumber(stats.critical),
      '峰时段能耗(kWh)': formatNumber(stats.peak),
      '平时段能耗(kWh)': formatNumber(stats.flat),
      '谷时段能耗(kWh)': formatNumber(stats.valley),
      '是否包含分摊': reportConfig.value.includeAllocation ? '是' : '否',
      '分摊规则': currentAllocationRule.value?.name || '无',
      '生成时间': new Date().toLocaleString('zh-CN')
    }
  ]
  exportToCSV(reportData, '能耗分析报告')
}

function downloadAllocationCSV() {
  const rows: (string | number)[][] = []
  const results = previewAllocation.value.length > 0 ? previewAllocation.value : allocationStore.results
  const rule = currentAllocationRule.value
  
  rows.push(['楼宇能耗对账单'])
  rows.push([''])
  
  rows.push(['【账单基本信息】'])
  rows.push(['时间窗口', timeWindow.value])
  rows.push(['分析维度', dimensions.find(d => d.value === reportConfig.value.dimension)?.label || '楼栋维度'])
  rows.push(['有效样本量', sampleCount.value.valid])
  rows.push(['总样本量', sampleCount.value.total])
  rows.push(['样本完整率', `${sampleCount.value.rate}%`])
  rows.push(['分摊口径', rule?.name || '按面积分摊'])
  rows.push(['分摊规则说明', 
    rule?.method === 'by_area' ? '按各租户租赁面积占比分摊' :
    rule?.method === 'by_people' ? '按各租户员工人数占比分摊' :
    rule?.method === 'by_usage_ratio' ? '按各租户能耗用量占比分摊' : '平均分摊至所有租户'
  ])
  rows.push(['公共区域总能耗(kWh)', formatNumber(allocationStore.commonEnergy)])
  
  if (energyStore.holidayMode) {
    rows.push([''])
    rows.push(['【节假日模式配置（已纳入分摊口径）】'])
    rows.push(['工作日开始时间', energyStore.holidayMode.workdayStart])
    rows.push(['工作日结束时间', energyStore.holidayMode.workdayEnd])
    rows.push(['周末能耗降低比例', `${energyStore.holidayMode.weekendReduction}%`])
    rows.push(['节假日能耗降低比例', `${energyStore.holidayMode.holidayReduction}%`])
    rows.push(['说明', '公共区域能耗已按节假日模式进行折算后参与分摊'])
  }
  
  rows.push([''])
  rows.push(['【租户能耗明细】'])
  rows.push([
    '序号', '租户名称', '所在楼层', '租赁面积(㎡)', '员工人数',
    '租户自耗(kWh)', '公共分摊(kWh)', '总能耗(kWh)', '分摊公式'
  ])
  
  results.forEach((r, idx) => {
    const tenant = energyStore.tenants.find(t => t.id === r.tenantId)
    rows.push([
      idx + 1,
      r.tenantName,
      tenant?.floorId.replace('flr-00', '') + 'F' || '-',
      tenant?.area || 0,
      tenant?.peopleCount || 0,
      formatNumber(r.tenantUsage),
      formatNumber(r.allocatedEnergy),
      formatNumber(r.totalEnergy),
      r.formula
    ])
  })
  
  rows.push([''])
  rows.push([
    '合计', '', '',
    energyStore.tenants.reduce((sum, t) => sum + t.area, 0),
    energyStore.tenants.reduce((sum, t) => sum + t.peopleCount, 0),
    formatNumber(totalTenantUsage.value > 0 ? totalTenantUsage.value : allocationStore.totalTenantUsage),
    formatNumber(totalAllocated.value > 0 ? totalAllocated.value : allocationStore.totalAllocated),
    formatNumber(grandTotal.value > 0 ? grandTotal.value : allocationStore.grandTotal),
    ''
  ])
  
  rows.push([''])
  rows.push(['【数据质量说明】'])
  rows.push(['* 离线设备数据已排除，不参与统计计算'])
  rows.push(['* 公共能耗已按节假日模式折算后参与分摊'])
  rows.push(['* 本报告生成时间：', new Date().toLocaleString('zh-CN')])
  
  export2DToCSV(rows, '租户能耗对账单')
}
</script>

<template>
  <div class="space-y-6">
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-1 space-y-6">
        <div class="card p-5">
          <div class="flex items-center gap-2 mb-4">
            <FileText class="w-5 h-5 text-brand-400" />
            <h3 class="font-medium text-white">报告配置</h3>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-sm text-slate-400 mb-1">报告类型</label>
              <div class="grid grid-cols-1 gap-2">
                <button
                  v-for="type in reportTypes"
                  :key="type.value"
                  @click="selectedType = type.value"
                  class="flex items-center gap-3 p-3 rounded-lg transition-all text-left"
                  :class="selectedType === type.value
                    ? 'bg-brand-600/20 border border-brand-500/30'
                    : 'bg-bg-tertiary/30 hover:bg-bg-tertiary/50 border border-transparent'"
                >
                  <component :is="type.icon" class="w-5 h-5" :class="selectedType === type.value ? 'text-brand-400' : 'text-slate-400'" />
                  <span :class="selectedType === type.value ? 'text-brand-300' : 'text-slate-200'">{{ type.label }}</span>
                </button>
              </div>
            </div>

            <div>
              <label class="block text-sm text-slate-400 mb-1">报告标题</label>
              <input
                v-model="reportConfig.title"
                type="text"
                class="w-full bg-bg-tertiary border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-brand-500"
                placeholder="请输入报告标题"
              />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm text-slate-400 mb-1">开始日期</label>
                <input
                  v-model="reportConfig.startTime"
                  type="date"
                  class="w-full bg-bg-tertiary border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label class="block text-sm text-slate-400 mb-1">结束日期</label>
                <input
                  v-model="reportConfig.endTime"
                  type="date"
                  class="w-full bg-bg-tertiary border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm text-slate-400 mb-1">分析维度</label>
              <select
                v-model="reportConfig.dimension"
                class="w-full bg-bg-tertiary border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-brand-500"
              >
                <option v-for="dim in dimensions" :key="dim.value" :value="dim.value">
                  {{ dim.label }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-sm text-slate-400 mb-1">分摊规则</label>
              <select
                v-model="reportConfig.allocationRuleId"
                class="w-full bg-bg-tertiary border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-brand-500"
              >
                <option v-for="rule in allocationStore.rules" :key="rule.id" :value="rule.id">
                  {{ rule.name }}
                </option>
              </select>
            </div>

            <div class="flex items-center gap-2">
              <input
                v-model="reportConfig.includeAllocation"
                type="checkbox"
                id="includeAllocation"
                class="w-4 h-4 rounded border-slate-600 bg-bg-tertiary text-brand-600 focus:ring-brand-500"
              />
              <label for="includeAllocation" class="text-sm text-slate-300">包含租户分摊数据</label>
            </div>

            <button
              @click="generateReport"
              class="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg transition-colors"
            >
              <Eye class="w-4 h-4" />
              预览报告
            </button>
          </div>
        </div>

        <div class="card p-5">
          <h4 class="text-sm font-medium text-white mb-3">数据质量说明</h4>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-slate-400">有效样本数</span>
              <span class="font-mono text-slate-200">{{ sampleCount.valid }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">总样本数</span>
              <span class="font-mono text-slate-200">{{ sampleCount.total }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">数据完整率</span>
              <span class="font-mono" :class="parseFloat(sampleCount.rate) > 90 ? 'text-status-success' : 'text-status-warning'">
                {{ sampleCount.rate }}%
              </span>
            </div>
          </div>
          <p class="text-xs text-slate-500 mt-3">
            * 离线设备数据已排除，不参与统计计算
          </p>
        </div>
      </div>

      <div class="lg:col-span-2">
        <div v-if="showPreview" class="card p-6">
          <div class="flex items-center justify-between mb-6">
            <h3 class="font-display font-semibold text-xl text-white">{{ reportConfig.title }}</h3>
            <div class="flex items-center gap-2">
              <button
                @click="downloadCSV"
                class="flex items-center gap-2 px-3 py-1.5 text-sm bg-bg-tertiary hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
              >
                <Download class="w-4 h-4" />
                导出 CSV
              </button>
              <button
                v-if="reportConfig.includeAllocation"
                @click="downloadAllocationCSV"
                class="flex items-center gap-2 px-3 py-1.5 text-sm bg-brand-600 hover:bg-brand-500 text-white rounded-lg transition-colors"
              >
                <FileSpreadsheet class="w-4 h-4" />
                导出租户分摊
              </button>
            </div>
          </div>

          <div class="space-y-6">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-bg-tertiary/30 rounded-lg">
              <div>
                <p class="text-xs text-slate-400">时间窗口</p>
                <p class="text-sm text-slate-200 font-medium mt-1">{{ timeWindow }}</p>
              </div>
              <div>
                <p class="text-xs text-slate-400">分析维度</p>
                <p class="text-sm text-slate-200 font-medium mt-1">{{ dimensions.find(d => d.value === reportConfig.dimension)?.label }}</p>
              </div>
              <div>
                <p class="text-xs text-slate-400">样本量</p>
                <p class="text-sm text-slate-200 font-medium mt-1 font-mono">
                  {{ sampleCount.valid }} / {{ sampleCount.total }}
                </p>
              </div>
              <div>
                <p class="text-xs text-slate-400">分摊规则</p>
                <p class="text-sm text-slate-200 font-medium mt-1">{{ currentAllocationRule?.name }}</p>
              </div>
            </div>

            <div>
              <h4 class="text-sm font-medium text-white mb-3">一、能耗汇总</h4>
              <table class="data-table">
                <thead>
                  <tr>
                    <th>能耗类型</th>
                    <th>用电量 (kWh)</th>
                    <th>占比</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>尖峰时段</td>
                    <td class="font-mono">{{ formatNumber(previewStats?.critical ?? energyStore.stats.critical) }}</td>
                    <td class="font-mono">{{ formatNumber((previewStats?.critical ?? energyStore.stats.critical) / (previewStats?.total ?? energyStore.stats.total) * 100, 1) }}%</td>
                  </tr>
                  <tr>
                    <td>峰时段</td>
                    <td class="font-mono">{{ formatNumber(previewStats?.peak ?? energyStore.stats.peak) }}</td>
                    <td class="font-mono">{{ formatNumber((previewStats?.peak ?? energyStore.stats.peak) / (previewStats?.total ?? energyStore.stats.total) * 100, 1) }}%</td>
                  </tr>
                  <tr>
                    <td>平时段</td>
                    <td class="font-mono">{{ formatNumber(previewStats?.flat ?? energyStore.stats.flat) }}</td>
                    <td class="font-mono">{{ formatNumber((previewStats?.flat ?? energyStore.stats.flat) / (previewStats?.total ?? energyStore.stats.total) * 100, 1) }}%</td>
                  </tr>
                  <tr>
                    <td>谷时段</td>
                    <td class="font-mono">{{ formatNumber(previewStats?.valley ?? energyStore.stats.valley) }}</td>
                    <td class="font-mono">{{ formatNumber((previewStats?.valley ?? energyStore.stats.valley) / (previewStats?.total ?? energyStore.stats.total) * 100, 1) }}%</td>
                  </tr>
                  <tr class="bg-bg-tertiary/30">
                    <td class="font-medium">合计</td>
                    <td class="font-mono font-medium text-white">{{ formatNumber(previewStats?.total ?? energyStore.stats.total) }}</td>
                    <td class="font-mono">100%</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div v-if="reportConfig.includeAllocation && previewAllocation.length > 0">
              <h4 class="text-sm font-medium text-white mb-3">二、租户分摊说明</h4>
              <div class="p-4 bg-bg-tertiary/30 rounded-lg">
                <p class="text-sm text-slate-300 mb-2">
                  <strong>分摊口径：</strong>{{ currentAllocationRule?.name }}
                </p>
                <p class="text-sm text-slate-300 mb-2">
                  <strong>公共区域总能耗：</strong>{{ formatNumber(allocationStore.commonEnergy) }} kWh
                </p>
                <p class="text-sm text-slate-300 mb-2">
                  <strong>节假日模式：</strong>
                  工作日 {{ energyStore.holidayMode.workdayStart }}-{{ energyStore.holidayMode.workdayEnd }}，
                  周末降低 {{ energyStore.holidayMode.weekendReduction }}%，
                  节假日降低 {{ energyStore.holidayMode.holidayReduction }}%
                  <span class="text-status-info">（已纳入分摊口径）</span>
                </p>
                <p class="text-sm text-slate-300">
                  <strong>分摊规则：</strong>
                  <template v-if="currentAllocationRule?.method === 'by_area'">
                    按各租户租赁面积占比分摊，总面积 {{ formatNumber(energyStore.tenants.reduce((sum, t) => sum + t.area, 0)) }} ㎡
                  </template>
                  <template v-else-if="currentAllocationRule?.method === 'by_people'">
                    按各租户员工人数占比分摊，总人数 {{ energyStore.tenants.reduce((sum, t) => sum + t.peopleCount, 0) }} 人
                  </template>
                  <template v-else-if="currentAllocationRule?.method === 'by_usage_ratio'">
                    按各租户自耗用量比例分摊，总自耗 {{ formatNumber(totalTenantUsage) }} kWh
                  </template>
                  <template v-else-if="currentAllocationRule?.method === 'even'">
                    平均分摊至所有租户，共 {{ energyStore.tenants.length }} 户
                  </template>
                </p>
              </div>

              <div class="mt-4">
                <h5 class="text-sm font-medium text-white mb-2">租户分摊明细</h5>
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>租户名称</th>
                      <th>楼层</th>
                      <th>自耗(kWh)</th>
                      <th>分摊(kWh)</th>
                      <th>总计(kWh)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="r in previewAllocation" :key="r.tenantId">
                      <td>{{ r.tenantName }}</td>
                      <td>{{ energyStore.tenants.find(t => t.id === r.tenantId)?.floorId.replace('flr-00', '') }}F</td>
                      <td class="font-mono">{{ formatNumber(r.tenantUsage) }}</td>
                      <td class="font-mono">{{ formatNumber(r.allocatedEnergy) }}</td>
                      <td class="font-mono font-medium">{{ formatNumber(r.totalEnergy) }}</td>
                    </tr>
                    <tr class="bg-bg-tertiary/30">
                      <td class="font-medium" colspan="2">合计</td>
                      <td class="font-mono">{{ formatNumber(totalTenantUsage) }}</td>
                      <td class="font-mono">{{ formatNumber(totalAllocated) }}</td>
                      <td class="font-mono font-medium text-white">{{ formatNumber(grandTotal) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h4 class="text-sm font-medium text-white mb-3">三、数据质量说明</h4>
              <div class="p-4 bg-status-warning/10 border border-status-warning/20 rounded-lg">
                <p class="text-sm text-status-warning">
                  <strong>注意：</strong>本报告统计周期内共有 {{ sampleCount.total - sampleCount.valid }} 条数据因设备离线被排除，
                  建议运维人员尽快检查设备连接状态，确保后续数据完整性。
                </p>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="card p-12 flex flex-col items-center justify-center text-center">
          <FileText class="w-16 h-16 text-slate-600 mb-4" />
          <h3 class="text-lg font-medium text-slate-300 mb-2">暂无报告预览</h3>
          <p class="text-sm text-slate-500 max-w-md">
            请在左侧配置报告参数，点击"预览报告"按钮生成报告预览。
            报告将包含详细的能耗数据、分摊口径说明和数据质量信息。
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
