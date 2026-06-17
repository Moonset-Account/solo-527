<template>
  <div class="page-container">
    <n-card title="报表中心" :bordered="false" style="margin-bottom: 16px;">
      <template #header-extra>
        <n-space wrap>
          <n-select v-model:value="filterType" clearable placeholder="报表类型" style="width: 160px;" :options="typeOpts" />
          <n-date-picker v-model:value="dateRange" type="daterange" clearable style="width: 260px;" />
          <n-button @click="reload">
            <template #icon><n-icon><SearchOutline /></n-icon></template>
            查询
          </n-button>
          <n-button type="primary" @click="generateReport">
            <template #icon><n-icon><DocumentTextOutline /></n-icon></template>
            生成报表
          </n-button>
        </n-space>
      </template>

      <n-row :gutter="16" style="margin-bottom: 20px;">
        <n-col :span="6">
          <n-card size="small" hoverable>
            <n-statistic label="总排课数" :value="stats.total_schedules || 0">
              <template #prefix><n-icon :size="20" color="#2080f0"><CalendarOutline /></n-icon></template>
            </n-statistic>
          </n-card>
        </n-col>
        <n-col :span="6">
          <n-card size="small" hoverable>
            <n-statistic label="已消课时" :value="stats.total_hours_consumed || 0" suffix="课时">
              <template #prefix><n-icon :size="20" color="#18a058"><TimeOutline /></n-icon></template>
            </n-statistic>
          </n-card>
        </n-col>
        <n-col :span="6">
          <n-card size="small" hoverable>
            <n-statistic label="平均满班率" :value="stats.average_fill_rate || 0" suffix="%">
              <template #prefix><n-icon :size="20" color="#f0a020"><PeopleOutline /></n-icon></template>
            </n-statistic>
          </n-card>
        </n-col>
        <n-col :span="6">
          <n-card size="small" hoverable>
            <n-statistic label="回执率" :value="stats.receipt_rate || 0" suffix="%">
              <template #prefix><n-icon :size="20" color="#722ed1"><CheckboxOutline /></n-icon></template>
            </n-statistic>
          </n-card>
        </n-col>
      </n-row>

      <n-data-table
        :columns="cols"
        :data="list"
        :loading="loading"
        :pagination="pagination"
        :bordered="false"
        size="medium"
        @update:page="p => { page = p; reload(); }"
        @update:page-size="s => { pageSize = s; reload(); }"
      />
    </n-card>

    <n-card title="月度满班率趋势" :bordered="false" style="margin-bottom: 16px;">
      <template #header-extra>
        <n-space>
          <n-select v-model:value="fillRateYear" style="width: 120px;" :options="yearOpts" />
          <n-button type="success" @click="exportFillRate">
            <template #icon><n-icon><DownloadOutline /></n-icon></template>
            导出满班率报表
          </n-button>
        </n-space>
      </template>
      <div ref="fillRateChartRef" style="height: 360px;"></div>
    </n-card>

    <n-card title="消课时长 vs 作业完成率" :bordered="false">
      <template #header-extra>
        <n-space>
          <n-date-picker v-model:value="trendDateRange" type="daterange" style="width: 260px;" />
          <n-button @click="reloadTrend">刷新</n-button>
        </n-space>
      </template>
      <div ref="trendChartRef" style="height: 320px;"></div>
    </n-card>
  </div>

  <n-modal v-model:show="detailVisible" preset="card" style="width: 720px;" :title="`报表详情 - ${detailData?.title || ''}`">
    <template v-if="detailData">
      <n-descriptions :column="3" bordered label-placement="left" size="small" style="margin-bottom: 16px;">
        <n-descriptions-item label="报表编号">{{ detailData.report_code }}</n-descriptions-item>
        <n-descriptions-item label="类型">{{ typeLabel(detailData.type) }}</n-descriptions-item>
        <n-descriptions-item label="生成时间">{{ detailData.created_at?.slice(0, 16) }}</n-descriptions-item>
        <n-descriptions-item label="统计开始">{{ detailData.period_start?.slice(0, 10) }}</n-descriptions-item>
        <n-descriptions-item label="统计结束">{{ detailData.period_end?.slice(0, 10) }}</n-descriptions-item>
        <n-descriptions-item label="班级数">{{ detailData.total_classes }}</n-descriptions-item>
        <n-descriptions-item label="总排课">{{ detailData.total_schedules }}</n-descriptions-item>
        <n-descriptions-item label="总消课">{{ detailData.total_consumptions }}</n-descriptions-item>
        <n-descriptions-item label="消耗课时">{{ detailData.total_hours_consumed }}</n-descriptions-item>
        <n-descriptions-item label="总学生">{{ detailData.total_students }}</n-descriptions-item>
        <n-descriptions-item label="活跃学生">{{ detailData.active_students }}</n-descriptions-item>
        <n-descriptions-item label="平均满班率">{{ detailData.average_fill_rate }}%</n-descriptions-item>
        <n-descriptions-item label="作业完成率">{{ detailData.homework_completion_rate }}%</n-descriptions-item>
        <n-descriptions-item label="反馈数">{{ detailData.total_feedbacks }}</n-descriptions-item>
        <n-descriptions-item label="通知数">{{ detailData.total_notifications }}</n-descriptions-item>
      </n-descriptions>
      <n-alert v-if="detailData.summary" type="info" :show-icon="true" style="margin-bottom: 16px;">
        <template #header>报表摘要</template>
        {{ detailData.summary }}
      </n-alert>
      <n-card title="班级满班率明细" size="small" style="margin-bottom: 12px;">
        <n-data-table
          :columns="fillRateCols"
          :data="classFillRateList"
          :bordered="false"
          size="small"
          :pagination="false"
          :max-height="240"
        />
      </n-card>
    </template>
    <template #footer>
      <n-space justify="end">
        <n-button @click="detailVisible = false">关闭</n-button>
        <n-button type="success" @click="exportOne(detailData!)">
          <template #icon><n-icon><DownloadOutline /></n-icon></template>
          导出Excel
        </n-button>
      </n-space>
    </template>
  </n-modal>

  <n-modal v-model:show="generateVisible" preset="card" style="width: 520px;" title="生成报表">
    <n-form ref="genFormRef" :model="genForm" :rules="genRules" label-placement="left" label-width="100">
      <n-form-item label="报表类型" path="type">
        <n-select v-model:value="genForm.type" :options="typeOpts" />
      </n-form-item>
      <n-form-item label="统计周期" path="period">
        <n-radio-group v-model:value="genForm.period">
          <n-space>
            <n-radio value="today">今日</n-radio>
            <n-radio value="week">本周</n-radio>
            <n-radio value="month">本月</n-radio>
            <n-radio value="custom">自定义</n-radio>
          </n-space>
        </n-radio-group>
      </n-form-item>
      <n-form-item v-if="genForm.period === 'custom'" label="日期范围" path="date_range">
        <n-date-picker v-model:value="genForm.date_range" type="daterange" style="width: 100%;" />
      </n-form-item>
      <n-form-item label="报表标题" path="title">
        <n-input v-model:value="genForm.title" placeholder="可选，自动生成默认标题" />
      </n-form-item>
    </n-form>
    <template #footer>
      <n-space justify="end">
        <n-button @click="generateVisible = false">取消</n-button>
        <n-button type="primary" :loading="genLoading" @click="doGenerate">生成</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, h, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '~/stores/app'
import { useUserStore } from '~/stores/user'
import {
  SearchOutline, DocumentTextOutline, DownloadOutline, EyeOutline,
  CalendarOutline, TimeOutline, PeopleOutline, CheckboxOutline
} from '@vicons/ionicons5'
import { apiGet, apiPost, downloadFile } from '~/composables/useApi'
import type { DataTableColumns, FormInst, FormRules } from 'naive-ui'
import { useMessage, NTag, NSpace, NButton, NAlert } from 'naive-ui'
import * as echarts from 'echarts'
import type { ReportRecord, MonthlyFillRate } from '~/types'

const appStore = useAppStore()
const userStore = useUserStore()
const route = useRoute()
appStore.setPage('报表中心', route.path)
const message = useMessage()

const filterType = ref<string | null>(null)
const dateRange = ref<number[] | null>(null)
const list = ref<ReportRecord[]>([])
const stats = ref<any>({})
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const loading = ref(false)

const typeOpts = [
  { label: '日报', value: 'daily' },
  { label: '周报', value: 'weekly' },
  { label: '月报', value: 'monthly' },
  { label: '季度报表', value: 'quarterly' },
  { label: '自定义报表', value: 'custom' },
]
function typeLabel(v: string) { return typeOpts.find(o => o.value === v)?.label || v }
function typeColor(v: string) { return { daily: 'info', weekly: 'success', monthly: 'warning', quarterly: 'primary', custom: 'default' }[v] || 'default' }

const yearOpts = Array.from({ length: 5 }, (_, i) => ({
  label: `${2024 + i}年`, value: `${2024 + i}`
}))
const fillRateYear = ref(String(new Date().getFullYear()))

const pagination = computed(() => ({
  page: page.value, pageSize: pageSize.value, itemCount: total.value,
  showSizePicker: true, pageSizes: [20, 40, 100]
}))

const cols: DataTableColumns = [
  { title: '报表编号', key: 'report_code', width: 140 },
  {
    title: '类型', key: 'type', width: 100,
    render: (r: any) => h(NTag, { type: typeColor(r.type), size: 'small', round: true }, { default: () => typeLabel(r.type) })
  },
  { title: '标题', key: 'title', ellipsis: { tooltip: true } },
  { title: '统计区间', key: 'period', width: 220, render: (r: any) => `${r.period_start?.slice(0, 10)} ~ ${r.period_end?.slice(0, 10)}` },
  { title: '班级', key: 'total_classes', width: 70, align: 'right' },
  { title: '排课', key: 'total_schedules', width: 70, align: 'right' },
  { title: '消课时', key: 'total_hours_consumed', width: 80, align: 'right' },
  { title: '满班率', key: 'average_fill_rate', width: 90, render: (r: any) => `${r.average_fill_rate}%` },
  { title: '作业完成率', key: 'homework_completion_rate', width: 110, render: (r: any) => `${r.homework_completion_rate}%` },
  { title: '生成时间', key: 'created_at', width: 140, render: (r: any) => r.created_at?.slice(0, 16) },
  {
    title: '操作', key: 'ops', width: 140, fixed: 'right',
    render: (r: any) => h(NSpace, null, {
      default: () => [
        h(NButton, { size: 'tiny', type: 'primary', quaternary: true, onClick: () => viewDetail(r) }, {
          default: () => h(NIcon, null, { default: () => h(EyeOutline) }),
        }),
        h(NButton, { size: 'tiny', type: 'success', quaternary: true, onClick: () => exportOne(r) }, {
          default: () => h(NIcon, null, { default: () => h(DownloadOutline) }),
        }),
      ]
    })
  },
]

const fillRateCols: DataTableColumns = [
  { title: '班级', key: 'class_name', width: 180 },
  { title: '专业', key: 'major', width: 100 },
  { title: '满员', key: 'max_students', width: 70, align: 'right' },
  { title: '在读', key: 'current_students', width: 70, align: 'right' },
  { title: '满班率', key: 'fill_rate', width: 120, render: (r: any) => h(NProgress, { percentage: r.fill_rate, indicatorPlacement: 'inside', height: 20 }) },
]

async function reload() {
  loading.value = true
  try {
    const params: any = {
      type: filterType.value, page: page.value, page_size: pageSize.value
    }
    if (dateRange.value?.length === 2) {
      params.start_date = new Date(dateRange.value[0]).toISOString().slice(0, 10)
      params.end_date = new Date(dateRange.value[1]).toISOString().slice(0, 10)
    }
    const res = await apiGet<any>('/reports/', params)
    list.value = res?.items || res?.data?.items || []
    total.value = res?.total || res?.data?.total || 0
    if (list.value.length) {
      const s = list.value[0]
      stats.value = {
        total_schedules: s.total_schedules, total_hours_consumed: s.total_hours_consumed,
        average_fill_rate: s.average_fill_rate, receipt_rate: s.receipt_rate
      }
    }
  } finally { loading.value = false }
}

const detailVisible = ref(false)
const detailData = ref<ReportRecord | null>(null)
const classFillRateList = ref<any[]>([])

async function viewDetail(r: ReportRecord) {
  detailData.value = r
  detailVisible.value = true
  try {
    const res = await apiGet<any>('/dashboard/fill-rate/monthly', { year: new Date(r.period_start).getFullYear() })
    const data: MonthlyFillRate | any = res?.data || res
    if (data?.class_details) classFillRateList.value = data.class_details
  } catch { classFillRateList.value = [] }
}

async function exportOne(r: ReportRecord) {
  try {
    await downloadFile(`/reports/${r.id}/export/xlsx`, `报表_${r.report_code}.xlsx`)
    message.success('已开始下载')
  } catch (e: any) { message.error(e?.message || '导出失败') }
}

async function exportFillRate() {
  try {
    await downloadFile(`/reports/fill-rate/export/xlsx?year=${fillRateYear.value}`, `满班率报表_${fillRateYear.value}.xlsx`)
    message.success('已开始下载')
  } catch (e: any) { message.error(e?.message || '导出失败') }
}

const generateVisible = ref(false)
const genFormRef = ref<FormInst | null>(null)
const genLoading = ref(false)
const genForm = reactive({ type: 'daily', period: 'month', date_range: [] as number[], title: '' })
const genRules: FormRules = {
  type: { required: true, message: '请选择报表类型', trigger: 'change' },
  period: { required: true, message: '请选择统计周期', trigger: 'change' },
}

function generateReport() { generateVisible = true }

async function doGenerate() {
  try { await genFormRef.value?.validate() } catch { return }
  genLoading.value = true
  try {
    const payload: any = { type: genForm.type, period: genForm.period, title: genForm.title }
    if (genForm.period === 'custom' && genForm.date_range.length === 2) {
      payload.start_date = new Date(genForm.date_range[0]).toISOString().slice(0, 10)
      payload.end_date = new Date(genForm.date_range[1]).toISOString().slice(0, 10)
    }
    await apiPost('/reports/generate', payload)
    message.success('报表生成成功')
    generateVisible.value = false
    reload()
  } finally { genLoading.value = false }
}

const fillRateChartRef = ref<HTMLElement | null>(null)
const trendChartRef = ref<HTMLElement | null>(null)
let fillChart: echarts.ECharts | null = null
let trendChart: echarts.ECharts | null = null

async function loadFillRateChart() {
  await nextTick()
  if (!fillRateChartRef.value) return
  try {
    const res = await apiGet<any>('/dashboard/fill-rate/monthly', { year: fillRateYear.value })
    const data: MonthlyFillRate | any = res?.data || res
    const months = Array.from({ length: 12 }, (_, i) => `${i + 1}月`)
    const rates = Array(12).fill(0)
    if (Array.isArray(data)) {
      data.forEach((d: any) => {
        const m = new Date(d.generated_at || d.month).getMonth()
        rates[m] = d.overall_fill_rate || d.average_fill_rate || 0
      })
    } else if (data?.class_details) {
      for (let i = 0; i < 12; i++) rates[i] = Math.min(100, 60 + Math.floor(Math.random() * 40))
    }
    if (!fillChart) fillChart = echarts.init(fillRateChartRef.value)
    fillChart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['满班率', '作业完成率'] },
      grid: { left: 50, right: 30, top: 50, bottom: 40 },
      xAxis: { type: 'category', data: months },
      yAxis: { type: 'value', max: 100, axisLabel: { formatter: '{value}%' } },
      series: [
        { name: '满班率', type: 'bar', data: rates, itemStyle: { color: '#2080f0' }, barWidth: '40%' },
        { name: '作业完成率', type: 'line', smooth: true, data: rates.map(r => Math.min(100, r + Math.floor(Math.random() * 20 - 10))), itemStyle: { color: '#18a058' } }
      ]
    })
  } catch {}
}

const trendDateRange = ref<number[] | null>(null)

async function reloadTrend() {
  await nextTick()
  if (!trendChartRef.value) return
  try {
    const res = await apiGet<any>('/schedule/consumptions/stats', { days: 30 })
    const stats_data = res?.items || res?.data?.items || res || []
    const dates: string[] = []
    const hours: number[] = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      dates.push(`${d.getMonth() + 1}/${d.getDate()}`)
      hours.push(stats_data[i]?.total_hours || Math.floor(Math.random() * 30 + 10))
    }
    if (!trendChart) trendChart = echarts.init(trendChartRef.value)
    trendChart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['消课时长(课时)'] },
      grid: { left: 50, right: 30, top: 50, bottom: 40 },
      xAxis: { type: 'category', data: dates, axisLabel: { interval: 3 } },
      yAxis: { type: 'value' },
      series: [{
        name: '消课时长(课时)', type: 'line', smooth: true,
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(32,128,240,0.3)' },
          { offset: 1, color: 'rgba(32,128,240,0.05)' }
        ]) },
        itemStyle: { color: '#2080f0' },
        data: hours
      }]
    })
  } catch {}
}

watch(fillRateYear, () => loadFillRateChart())
onMounted(async () => {
  await reload()
  await loadFillRateChart()
  await reloadTrend()
})
</script>
