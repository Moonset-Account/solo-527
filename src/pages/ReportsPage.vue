<script setup lang="ts">
import { ref } from 'vue'
import { useFilterStore } from '@/stores/filter'
import { fetchReportData, getReportCsvUrl } from '@/services/api'
import { POND_NAMES, METRIC_LABELS, type MetricType, type HumanJudgment } from '@/types'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { Download, FileSpreadsheet, FileText, BarChart3 } from 'lucide-vue-next'

const filterStore = useFilterStore()

const startDate = ref('')
const endDate = ref('')
const selectedPond = ref('pond-1')
const selectedReportMetrics = ref<MetricType[]>(['dissolved_oxygen', 'temperature', 'ph'])
const previewReady = ref(false)
const reportData = ref<any>(null)

async function generateReport() {
  reportData.value = await fetchReportData({
    start: startDate.value || undefined,
    end: endDate.value || undefined,
    pondId: selectedPond.value,
  })
  previewReady.value = true
}

function toggleReportMetric(metric: MetricType) {
  const idx = selectedReportMetrics.value.indexOf(metric)
  if (idx >= 0) {
    selectedReportMetrics.value = selectedReportMetrics.value.filter(m => m !== metric)
  } else {
    selectedReportMetrics.value = [...selectedReportMetrics.value, metric]
  }
}

async function exportPDF() {
  const el = document.getElementById('report-preview')
  if (!el) return
  const canvas = await html2canvas(el, { backgroundColor: '#0A2E36' })
  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF('p', 'mm', 'a4')
  const pdfWidth = pdf.internal.pageSize.getWidth()
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width
  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
  pdf.save('水质监控报表.pdf')
}

function exportExcel() {
  const url = getReportCsvUrl({
    start: startDate.value || undefined,
    end: endDate.value || undefined,
    pondId: selectedPond.value,
  })
  window.open(url)
}
</script>

<template>
  <div class="h-full flex flex-col p-6 overflow-y-auto">
    <h2 class="text-lg font-medium text-gray-200 mb-4">报表导出</h2>

    <div class="bg-[#0A2E36] rounded-xl border border-[#0D3B47] p-4 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label class="block text-xs text-gray-500 mb-1">开始日期</label>
          <input
            v-model="startDate"
            type="date"
            class="w-full bg-[#0D3B47] border border-[#0D3B47] rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-[#00B4D8]/50"
          />
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">结束日期</label>
          <input
            v-model="endDate"
            type="date"
            class="w-full bg-[#0D3B47] border border-[#0D3B47] rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-[#00B4D8]/50"
          />
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">塘口</label>
          <select
            v-model="selectedPond"
            class="w-full bg-[#0D3B47] border border-[#0D3B47] rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-[#00B4D8]/50"
          >
            <option v-for="pondId in filterStore.allPonds" :key="pondId" :value="pondId">
              {{ POND_NAMES[pondId] }}
            </option>
          </select>
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">指标</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="m in filterStore.allMetrics"
              :key="m"
              class="px-2 py-1 rounded text-xs border transition-colors"
              :class="selectedReportMetrics.includes(m)
                ? 'bg-[#00B4D8]/20 text-[#00B4D8] border-[#00B4D8]/30'
                : 'bg-[#0D3B47] text-gray-500 border-[#0D3B47] hover:text-gray-300'"
              @click="toggleReportMetric(m)"
            >
              {{ METRIC_LABELS[m] }}
            </button>
          </div>
        </div>
      </div>

      <div class="mt-4">
        <button
          class="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-[#00B4D8] text-white hover:bg-[#00B4D8]/80 transition-colors"
          @click="generateReport"
        >
          <BarChart3 class="w-4 h-4" />
          生成报表
        </button>
      </div>
    </div>

    <div v-if="previewReady" id="report-preview" class="bg-[#0A2E36] rounded-xl border border-[#0D3B47] p-6 mb-6">
      <h3 class="text-base font-medium text-gray-200 mb-4">报表预览</h3>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-[#0D3B47] rounded-lg p-4">
          <div class="text-xs text-gray-500 mb-1">时间范围</div>
          <div class="text-sm text-gray-200">
            {{ startDate || '全部' }} ~ {{ endDate || '至今' }}
          </div>
        </div>
        <div class="bg-[#0D3B47] rounded-lg p-4">
          <div class="text-xs text-gray-500 mb-1">警报数量</div>
          <div class="text-sm text-gray-200">{{ reportData.total }} 条</div>
        </div>
        <div class="bg-[#0D3B47] rounded-lg p-4">
          <div class="text-xs text-gray-500 mb-1">确认率</div>
          <div class="text-sm text-gray-200">{{ reportData.ack_rate }}%</div>
        </div>
        <div class="bg-[#0D3B47] rounded-lg p-4">
          <div class="text-xs text-gray-500 mb-1">塘口</div>
          <div class="text-sm text-gray-200">{{ POND_NAMES[selectedPond] }}</div>
        </div>
      </div>

      <div>
        <h4 class="text-sm font-medium text-gray-300 mb-3">人工判定分布</h4>
        <div class="flex gap-4">
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-sm bg-[#00B4D8]" />
            <span class="text-xs text-gray-400">误报: {{ reportData.judgment_dist.false_alarm }}</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-sm bg-[#EF4444]" />
            <span class="text-xs text-gray-400">真实异常: {{ reportData.judgment_dist.real_anomaly }}</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-sm bg-[#F59E0B]" />
            <span class="text-xs text-gray-400">需现场排查: {{ reportData.judgment_dist.needs_onsite }}</span>
          </div>
        </div>
        <div class="flex gap-1 mt-3 h-6 rounded overflow-hidden">
          <div
            v-if="reportData.judgment_dist.false_alarm"
            class="bg-[#00B4D8] transition-all"
            :style="{ width: `${(reportData.judgment_dist.false_alarm / Math.max(reportData.total, 1)) * 100}%` }"
          />
          <div
            v-if="reportData.judgment_dist.real_anomaly"
            class="bg-[#EF4444] transition-all"
            :style="{ width: `${(reportData.judgment_dist.real_anomaly / Math.max(reportData.total, 1)) * 100}%` }"
          />
          <div
            v-if="reportData.judgment_dist.needs_onsite"
            class="bg-[#F59E0B] transition-all"
            :style="{ width: `${(reportData.judgment_dist.needs_onsite / Math.max(reportData.total, 1)) * 100}%` }"
          />
        </div>
      </div>
    </div>

    <div v-if="previewReady" class="flex gap-3">
      <button
        class="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-[#00B4D8] text-white hover:bg-[#00B4D8]/80 transition-colors"
        @click="exportPDF"
      >
        <FileText class="w-4 h-4" />
        导出PDF
      </button>
      <button
        class="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-[#10B981] text-white hover:bg-[#10B981]/80 transition-colors"
        @click="exportExcel"
      >
        <FileSpreadsheet class="w-4 h-4" />
        导出Excel
      </button>
    </div>
  </div>
</template>
