<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const reportTypes = [
  { label: '入住率统计', value: 'occupancy' },
  { label: '转化率统计', value: 'conversion' },
  { label: '收入统计', value: 'revenue' },
  { label: '退款统计', value: 'refund' },
]

const roomTypes = [
  { label: '全部房型', value: '' },
  { label: '大床房', value: 'KING' },
  { label: '双床房', value: 'TWIN' },
  { label: '家庭房', value: 'FAMILY' },
  { label: '套房', value: 'SUITE' },
]

const statusOptions = [
  { label: '全部状态', value: '' },
  { label: '已支付', value: 'PAID' },
  { label: '已入住', value: 'CHECKED_IN' },
  { label: '已退房', value: 'CHECKED_OUT' },
  { label: '已退款', value: 'REFUNDED' },
]

const selectedType = ref('occupancy')
const startDate = ref('')
const endDate = ref('')
const selectedRoomType = ref('')
const selectedStatus = ref('')
const operatorName = ref('管理员')

const previewLoading = ref(false)
const previewData = ref<Record<string, string | number>[]>([])
const previewColumns = ref<string[]>([])

const exportLoading = ref(false)
const exportResult = ref<{
  downloadUrl: string
  filterSnapshot: Record<string, unknown>
  generatedAt: string
  operator: string
} | null>(null)

interface ExportLog {
  type: string
  operator: string
  generatedAt: string
  downloadUrl: string
}
const exportHistory = ref<ExportLog[]>([])

const reportTypeLabel = computed(() =>
  reportTypes.find(t => t.value === selectedType.value)?.label ?? '',
)

function generateSampleData() {
  const rows: Record<string, string | number>[] = []
  const typeMap: Record<string, { cols: string[]; row: () => Record<string, string | number> }> = {
    occupancy: {
      cols: ['日期', '总房间', '已入住', '入住率'],
      row: () => {
        const total = 20
        const occupied = Math.floor(Math.random() * total) + 5
        return { '日期': `2026-06-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}`, '总房间': total, '已入住': occupied, '入住率': `${((occupied / total) * 100).toFixed(1)}%` }
      },
    },
    conversion: {
      cols: ['日期', '浏览量', '下单量', '转化率'],
      row: () => {
        const views = Math.floor(Math.random() * 500) + 100
        const orders = Math.floor(Math.random() * views * 0.3) + 10
        return { '日期': `2026-06-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}`, '浏览量': views, '下单量': orders, '转化率': `${((orders / views) * 100).toFixed(1)}%` }
      },
    },
    revenue: {
      cols: ['日期', '订单数', '总收入', '平均客单价'],
      row: () => {
        const orders = Math.floor(Math.random() * 15) + 3
        const total = orders * (Math.floor(Math.random() * 300) + 200)
        return { '日期': `2026-06-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}`, '订单数': orders, '总收入': `¥${total}`, '平均客单价': `¥${(total / orders).toFixed(0)}` }
      },
    },
    refund: {
      cols: ['日期', '退款单数', '退款金额', '退款率'],
      row: () => {
        const count = Math.floor(Math.random() * 5)
        const amount = count * (Math.floor(Math.random() * 300) + 100)
        return { '日期': `2026-06-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}`, '退款单数': count, '退款金额': `¥${amount}`, '退款率': `${(Math.random() * 8).toFixed(1)}%` }
      },
    },
  }

  const config = typeMap[selectedType.value]
  if (!config) return { cols: [], rows: [] }

  for (let i = 0; i < 8; i++) {
    rows.push(config.row())
  }

  return { cols: config.cols, rows }
}

async function handlePreview() {
  previewLoading.value = true
  previewData.value = []
  try {
    await new Promise(r => setTimeout(r, 500))
    const { cols, rows } = generateSampleData()
    previewColumns.value = cols
    previewData.value = rows
  } finally {
    previewLoading.value = false
  }
}

function buildFilterSnapshot() {
  const snapshot: Record<string, unknown> = {
    reportType: selectedType.value,
    startDate: startDate.value || undefined,
    endDate: endDate.value || undefined,
    roomType: selectedRoomType.value || undefined,
    status: selectedStatus.value || undefined,
    generatedAt: new Date().toISOString(),
    operatorName: operatorName.value,
  }
  Object.keys(snapshot).forEach(k => snapshot[k] === undefined && delete snapshot[k])
  return snapshot
}

async function handleExport() {
  exportLoading.value = true
  try {
    const result = await $fetch<{
      downloadUrl: string
      filterSnapshot: Record<string, unknown>
      generatedAt: string
      operator: string
    }>('/api/reports/export', {
      method: 'POST',
      body: {
        type: selectedType.value,
        filters: buildFilterSnapshot(),
        operatorName: operatorName.value,
      },
    })
    exportResult.value = result
    exportHistory.value.unshift({
      type: reportTypeLabel.value,
      operator: result.operator,
      generatedAt: result.generatedAt,
      downloadUrl: result.downloadUrl,
    })
  } finally {
    exportLoading.value = false
  }
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('zh-CN')
}
</script>

<template>
  <div>
    <h1 class="font-serif text-2xl font-bold text-pine mb-6">报表导出</h1>

    <section class="bg-white rounded-2xl shadow-sm border border-cream-dark/50 p-6 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div>
          <label class="block text-sm font-medium text-pine mb-1.5">报表类型</label>
          <select
            v-model="selectedType"
            class="w-full border border-cream-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pine/30 bg-white"
          >
            <option v-for="t in reportTypes" :key="t.value" :value="t.value">{{ t.label }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-pine mb-1.5">开始日期</label>
          <input
            v-model="startDate"
            type="date"
            class="w-full border border-cream-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pine/30"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-pine mb-1.5">结束日期</label>
          <input
            v-model="endDate"
            type="date"
            class="w-full border border-cream-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pine/30"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-pine mb-1.5">操作人</label>
          <input
            v-model="operatorName"
            type="text"
            class="w-full border border-cream-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pine/30"
          />
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label class="block text-sm font-medium text-pine mb-1.5">房型</label>
          <select
            v-model="selectedRoomType"
            class="w-full border border-cream-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pine/30 bg-white"
          >
            <option v-for="r in roomTypes" :key="r.value" :value="r.value">{{ r.label }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-pine mb-1.5">状态</label>
          <select
            v-model="selectedStatus"
            class="w-full border border-cream-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pine/30 bg-white"
          >
            <option v-for="s in statusOptions" :key="s.value" :value="s.value">{{ s.label }}</option>
          </select>
        </div>
      </div>

      <div class="flex gap-3">
        <button
          class="px-5 py-2 rounded-lg text-sm font-medium bg-amber text-pine hover:bg-amber-light transition-colors"
          :class="{ 'opacity-50 cursor-not-allowed': previewLoading }"
          :disabled="previewLoading"
          @click="handlePreview"
        >
          {{ previewLoading ? '加载中...' : '预览' }}
        </button>
        <button
          class="px-5 py-2 rounded-lg text-sm font-medium bg-pine text-cream hover:bg-pine-light transition-colors"
          :class="{ 'opacity-50 cursor-not-allowed': exportLoading }"
          :disabled="exportLoading"
          @click="handleExport"
        >
          {{ exportLoading ? '导出中...' : '导出' }}
        </button>
      </div>
    </section>

    <section v-if="previewData.length > 0" class="bg-white rounded-2xl shadow-sm border border-cream-dark/50 p-6 mb-6">
      <h2 class="font-serif text-lg font-semibold text-pine mb-4">数据预览 - {{ reportTypeLabel }}</h2>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-cream-dark">
              <th
                v-for="col in previewColumns"
                :key="col"
                class="text-left py-3 px-4 text-pine font-semibold whitespace-nowrap"
              >
                {{ col }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, idx) in previewData"
              :key="idx"
              class="border-b border-cream-dark/40 hover:bg-cream/50 transition-colors"
            >
              <td
                v-for="col in previewColumns"
                :key="col"
                class="py-2.5 px-4 text-pine/80 whitespace-nowrap"
              >
                {{ row[col] }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section v-if="exportResult" class="bg-white rounded-2xl shadow-sm border border-cream-dark/50 p-6 mb-6">
      <h2 class="font-serif text-lg font-semibold text-pine mb-4">导出文件信息</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="bg-cream/50 rounded-lg p-4">
          <p class="text-xs text-slate mb-1">下载链接</p>
          <a
            :href="exportResult.downloadUrl"
            class="text-pine font-medium underline hover:text-pine-light transition-colors"
          >
            {{ exportResult.downloadUrl }}
          </a>
        </div>
        <div class="bg-cream/50 rounded-lg p-4">
          <p class="text-xs text-slate mb-1">生成时间</p>
          <p class="text-pine font-medium">{{ formatDateTime(exportResult.generatedAt) }}</p>
        </div>
        <div class="bg-cream/50 rounded-lg p-4">
          <p class="text-xs text-slate mb-1">操作人</p>
          <p class="text-pine font-medium">{{ exportResult.operator }}</p>
        </div>
        <div class="bg-cream/50 rounded-lg p-4">
          <p class="text-xs text-slate mb-1">筛选快照</p>
          <pre class="text-xs text-pine/80 bg-white rounded p-2 overflow-x-auto mt-1">{{ JSON.stringify(exportResult.filterSnapshot, null, 2) }}</pre>
        </div>
      </div>
    </section>

    <section class="bg-white rounded-2xl shadow-sm border border-cream-dark/50 p-6">
      <h2 class="font-serif text-lg font-semibold text-pine mb-4">导出历史</h2>
      <div v-if="exportHistory.length === 0" class="text-center py-12 text-slate">
        <p class="text-lg mb-1">暂无导出记录</p>
        <p class="text-sm">导出报表后将在此显示历史记录</p>
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-cream-dark">
              <th class="text-left py-3 px-4 text-pine font-semibold">报表类型</th>
              <th class="text-left py-3 px-4 text-pine font-semibold">操作人</th>
              <th class="text-left py-3 px-4 text-pine font-semibold">生成时间</th>
              <th class="text-left py-3 px-4 text-pine font-semibold">下载</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(log, idx) in exportHistory"
              :key="idx"
              class="border-b border-cream-dark/40 hover:bg-cream/50 transition-colors"
            >
              <td class="py-2.5 px-4 text-pine/80">
                <span class="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-pine/10 text-pine">
                  {{ log.type }}
                </span>
              </td>
              <td class="py-2.5 px-4 text-pine/80">{{ log.operator }}</td>
              <td class="py-2.5 px-4 text-pine/80">{{ formatDateTime(log.generatedAt) }}</td>
              <td class="py-2.5 px-4">
                <a
                  :href="log.downloadUrl"
                  class="inline-flex items-center gap-1 text-amber hover:text-amber-light font-medium transition-colors"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  下载
                </a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
