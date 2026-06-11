<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const reportTypes = [
  { label: '入住率统计', value: 'occupancy' },
  { label: '入住转化统计', value: 'conversion' },
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
const exportSuccess = ref(false)
const lastExportInfo = ref<{
  reportName: string
  generatedAt: string
  operator: string
  filterSnapshot: Record<string, any>
} | null>(null)

interface ExportLog {
  type: string
  operator: string
  generatedAt: string
  fileName: string
}
const exportHistory = ref<ExportLog[]>([])

const reportTypeLabel = computed(() =>
  reportTypes.find(t => t.value === selectedType.value)?.label ?? '',
)

function generateSampleData() {
  const rows: Record<string, string | number>[] = []
  const typeMap: Record<string, { cols: string[]; row: () => Record<string, string | number> }> = {
    occupancy: {
      cols: ['日期', '总房间数', '已入住', '可用房间', '入住率(%)', '空置率(%)'],
      row: () => {
        const total = 6
        const occupied = Math.floor(Math.random() * (total - 1)) + 1
        return {
          '日期': `2026-06-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}`,
          '总房间数': total,
          '已入住': occupied,
          '可用房间': total - occupied,
          '入住率(%)': ((occupied / total) * 100).toFixed(1),
          '空置率(%)': (((total - occupied) / total) * 100).toFixed(1),
        }
      },
    },
    conversion: {
      cols: ['日期', '浏览量', '下单量', '支付订单数', '下单转化率(%)', '支付转化率(%)', '整体转化率(%)'],
      row: () => {
        const views = Math.floor(Math.random() * 500) + 100
        const bookings = Math.floor(Math.random() * views * 0.25) + 5
        const paid = Math.floor(bookings * 0.8)
        return {
          '日期': `2026-06-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}`,
          '浏览量': views,
          '下单量': bookings,
          '支付订单数': paid,
          '下单转化率(%)': ((bookings / views) * 100).toFixed(2),
          '支付转化率(%)': ((paid / bookings) * 100).toFixed(2),
          '整体转化率(%)': ((paid / views) * 100).toFixed(2),
        }
      },
    },
    revenue: {
      cols: ['日期', '订单数', '平均房价(元)', '房费收入(元)', '其他收入(元)', '总收入(元)'],
      row: () => {
        const orders = Math.floor(Math.random() * 10) + 2
        const avg = Math.floor(Math.random() * 300) + 300
        const roomTotal = orders * avg
        return {
          '日期': `2026-06-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}`,
          '订单数': orders,
          '平均房价(元)': avg,
          '房费收入(元)': roomTotal,
          '其他收入(元)': Math.floor(roomTotal * 0.1),
          '总收入(元)': Math.floor(roomTotal * 1.1),
        }
      },
    },
    refund: {
      cols: ['日期', '总订单数', '退款单数', '退款金额(元)', '退款率(%)'],
      row: () => {
        const total = Math.floor(Math.random() * 10) + 2
        const count = Math.floor(Math.random() * 3)
        const amount = count * (Math.floor(Math.random() * 300) + 200)
        return {
          '日期': `2026-06-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}`,
          '总订单数': total,
          '退款单数': count,
          '退款金额(元)': amount,
          '退款率(%)': total > 0 ? ((count / total) * 100).toFixed(2) : '0',
        }
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
    operatorName: operatorName.value,
  }
  Object.keys(snapshot).forEach(k => snapshot[k] === undefined && delete snapshot[k])
  return snapshot
}

async function handleExport() {
  exportLoading.value = true
  exportSuccess.value = false
  try {
    const filters = buildFilterSnapshot()
    const response = await $fetch<ArrayBuffer>('/api/reports/export', {
      method: 'POST',
      body: {
        type: selectedType.value,
        filters,
        operatorName: operatorName.value,
      },
      responseType: 'arrayBuffer',
    })

    const blob = new Blob([response], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const today = new Date().toISOString().split('T')[0]
    link.download = `${reportTypeLabel.value}报表_${today}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    const generatedAt = new Date().toLocaleString('zh-CN')
    lastExportInfo.value = {
      reportName: reportTypeLabel.value + '报表',
      generatedAt,
      operator: operatorName.value,
      filterSnapshot: filters,
    }

    exportHistory.value.unshift({
      type: reportTypeLabel.value,
      operator: operatorName.value,
      generatedAt,
      fileName: `${reportTypeLabel.value}报表_${today}.xlsx`,
    })

    exportSuccess.value = true
  } finally {
    exportLoading.value = false
  }
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('zh-CN')
}

const filterDisplayItems = computed(() => {
  if (!lastExportInfo.value) return []
  const fs = lastExportInfo.value.filterSnapshot
  const items: { label: string; value: string }[] = []
  const typeLabels: Record<string, string> = {
    occupancy: '入住率统计',
    conversion: '入住转化统计',
    revenue: '收入统计',
    refund: '退款统计',
  }
  const roomTypeLabels: Record<string, string> = {
    KING: '大床房',
    TWIN: '双床房',
    FAMILY: '家庭房',
    SUITE: '套房',
  }
  const statusLabels: Record<string, string> = {
    PAID: '已支付',
    CHECKED_IN: '已入住',
    CHECKED_OUT: '已退房',
    REFUNDED: '已退款',
  }

  if (fs.reportType) items.push({ label: '报表类型', value: typeLabels[fs.reportType as string] || fs.reportType as string })
  if (fs.startDate) items.push({ label: '开始日期', value: fs.startDate as string })
  if (fs.endDate) items.push({ label: '结束日期', value: fs.endDate as string })
  if (fs.roomType) items.push({ label: '房型', value: roomTypeLabels[fs.roomType as string] || fs.roomType as string })
  if (fs.status) items.push({ label: '订单状态', value: statusLabels[fs.status as string] || fs.status as string })
  return items
})

onMounted(() => {
  const today = new Date()
  const oneMonthAgo = new Date(today.getTime() - 30 * 86400000)
  startDate.value = oneMonthAgo.toISOString().split('T')[0]
  endDate.value = today.toISOString().split('T')[0]
})
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
          <label class="block text-sm font-medium text-pine mb-1.5">订单状态</label>
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
          class="px-5 py-2 rounded-lg text-sm font-medium bg-pine text-cream hover:bg-pine-light transition-colors flex items-center gap-2"
          :class="{ 'opacity-50 cursor-not-allowed': exportLoading }"
          :disabled="exportLoading"
          @click="handleExport"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {{ exportLoading ? '导出中...' : '导出 Excel' }}
        </button>
      </div>
    </section>

    <Transition name="fade">
      <section v-if="exportSuccess && lastExportInfo" class="bg-pine/5 border border-pine/20 rounded-2xl p-6 mb-6">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-full bg-pine/10 flex items-center justify-center">
            <svg class="w-5 h-5 text-pine" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h3 class="font-serif text-lg font-semibold text-pine">导出成功</h3>
            <p class="text-sm text-pine/70">{{ lastExportInfo.reportName }} 已生成并下载</p>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div class="bg-white/80 rounded-lg p-3">
            <p class="text-xs text-slate mb-1">报表名称</p>
            <p class="text-sm font-medium text-pine">{{ lastExportInfo.reportName }}</p>
          </div>
          <div class="bg-white/80 rounded-lg p-3">
            <p class="text-xs text-slate mb-1">生成时间</p>
            <p class="text-sm font-medium text-pine">{{ lastExportInfo.generatedAt }}</p>
          </div>
          <div class="bg-white/80 rounded-lg p-3">
            <p class="text-xs text-slate mb-1">操作人</p>
            <p class="text-sm font-medium text-pine">{{ lastExportInfo.operator }}</p>
          </div>
        </div>
        <div v-if="filterDisplayItems.length > 0" class="mt-3 bg-white/80 rounded-lg p-4">
          <p class="text-xs text-slate mb-2">筛选口径</p>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="item in filterDisplayItems"
              :key="item.label"
              class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-cream text-pine/80"
            >
              <span class="text-slate/60">{{ item.label }}:</span>
              <span class="font-medium">{{ item.value }}</span>
            </span>
          </div>
        </div>
      </section>
    </Transition>

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

    <section class="bg-white rounded-2xl shadow-sm border border-cream-dark/50 p-6">
      <h2 class="font-serif text-lg font-semibold text-pine mb-4">导出历史</h2>
      <div v-if="exportHistory.length === 0" class="text-center py-12 text-slate">
        <div class="w-16 h-16 rounded-full bg-cream-dark mx-auto flex items-center justify-center mb-3">
          <svg class="w-8 h-8 text-slate/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p class="text-lg mb-1">暂无导出记录</p>
        <p class="text-sm">点击"导出 Excel"生成报表</p>
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-cream-dark">
              <th class="text-left py-3 px-4 text-pine font-semibold">报表类型</th>
              <th class="text-left py-3 px-4 text-pine font-semibold">操作人</th>
              <th class="text-left py-3 px-4 text-pine font-semibold">生成时间</th>
              <th class="text-left py-3 px-4 text-pine font-semibold">文件名</th>
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
              <td class="py-2.5 px-4 text-pine/80">{{ log.generatedAt }}</td>
              <td class="py-2.5 px-4 text-slate/60 font-mono text-xs">{{ log.fileName }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}
</style>
