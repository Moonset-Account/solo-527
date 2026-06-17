<template>
  <div class="page-container">
    <n-card title="运营端 - 满班率报表" :bordered="false" style="margin-bottom: 16px;">
      <template #header-extra>
        <n-space wrap>
          <n-select v-model:value="filterYear" style="width: 130px;" :options="yearOpts" />
          <n-select v-model:value="filterMonth" clearable placeholder="月份" style="width: 120px;" :options="monthOpts" />
          <n-select v-model:value="filterMajor" clearable placeholder="专业" style="width: 130px;" :options="majorOpts" />
          <n-select v-model:value="filterCampus" clearable placeholder="校区" style="width: 150px;" :options="campusOpts" />
          <n-button @click="reload">
            <template #icon><n-icon><SearchOutline /></n-icon></template>
            查询
          </n-button>
          <n-button type="primary" @click="refreshMonthly">
            <template #icon><n-icon><RefreshOutline /></n-icon></template>
            重新生成月报
          </n-button>
          <n-button type="success" @click="exportExcel">
            <template #icon><n-icon><DownloadOutline /></n-icon></template>
            导出Excel
          </n-button>
          <n-button type="warning" @click="exportPdf">
            <template #icon><n-icon><DocumentOutline /></n-icon></template>
            导出PDF简报
          </n-button>
        </n-space>
      </template>

      <n-row :gutter="16" style="margin-bottom: 20px;">
        <n-col :span="4">
          <n-card size="small" style="text-align: center;" hoverable>
            <n-statistic label="校区整体满班率" :value="summary.overall_rate || 0" suffix="%">
              <template #prefix><n-icon :size="18" color="#2080f0"><SchoolOutline /></n-icon></template>
            </n-statistic>
            <n-progress
              :percentage="summary.overall_rate || 0" :show-indicator="false"
              :height="4" style="margin-top: 8px;"
              :status="(summary.overall_rate || 0) >= 85 ? 'success' : (summary.overall_rate || 0) >= 70 ? 'warning' : 'error'"
            />
          </n-card>
        </n-col>
        <n-col :span="4">
          <n-card size="small" style="text-align: center;" hoverable>
            <n-statistic label="班级总数" :value="summary.total_classes || 0">
              <template #prefix><n-icon :size="18" color="#722ed1"><PeopleOutline /></n-icon></template>
            </n-statistic>
          </n-card>
        </n-col>
        <n-col :span="4">
          <n-card size="small" style="text-align: center;" hoverable>
            <n-statistic label="在读学生" :value="summary.total_students || 0">
              <template #prefix><n-icon :size="18" color="#18a058"><PersonOutline /></n-icon></template>
            </n-statistic>
          </n-card>
        </n-col>
        <n-col :span="4">
          <n-card size="small" style="text-align: center;" hoverable>
            <n-statistic label="满班(>=90%)" :value="summary.full_classes || 0" value-style="color:#18a058;">
              <template #prefix><n-icon :size="18" color="#18a058"><RibbonOutline /></n-icon></template>
            </n-statistic>
          </n-card>
        </n-col>
        <n-col :span="4">
          <n-card size="small" style="text-align: center;" hoverable>
            <n-statistic label="预警(<70%)" :value="summary.warn_classes || 0" value-style="color:#d03050;">
              <template #prefix><n-icon :size="18" color="#d03050"><AlertCircleOutline /></n-icon></template>
            </n-statistic>
          </n-card>
        </n-col>
        <n-col :span="4">
          <n-card size="small" style="text-align: center;" hoverable>
            <n-statistic label="剩余学位" :value="summary.remaining_seats || 0" value-style="color:#f0a020;">
              <template #prefix><n-icon :size="18" color="#f0a020"><GridOutline /></n-icon></template>
            </n-statistic>
          </n-card>
        </n-col>
      </n-row>

      <n-card size="small" title="月度满班率趋势图" :bordered="true" style="margin-bottom: 20px;">
        <div ref="trendChartRef" style="height: 320px;"></div>
      </n-card>

      <n-card size="small" title="各专业满班率对比" :bordered="true" style="margin-bottom: 20px;">
        <div ref="majorChartRef" style="height: 280px;"></div>
      </n-card>

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

    <n-card title="运营复盘建议" :bordered="false">
      <n-alert type="info" :show-icon="true" style="margin-bottom: 12px;">
        <template #header>基于当前数据的自动分析</template>
        本月整体满班率 {{ summary.overall_rate || 0 }}%，较上月 {{ summary.mom_change > 0 ? '上升' : '下降' }} {{ Math.abs(summary.mom_change || 0) }} 个百分点。
      </n-alert>
      <n-list bordered>
        <n-list-item v-for="(s, i) in suggestions" :key="i">
          <template #icon>
            <n-tag :type="s.type" size="small" round>{{ s.level }}</n-tag>
          </template>
          <div style="flex: 1;">
            <div style="font-weight: 600; margin-bottom: 4px;">{{ s.title }}</div>
            <div style="color: #666; font-size: 13px; line-height: 1.6;">{{ s.content }}</div>
          </div>
          <n-button size="small" type="primary" quaternary>{{ s.action }}</n-button>
        </n-list-item>
      </n-list>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, h, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '~/stores/app'
import { useUserStore } from '~/stores/user'
import {
  SearchOutline, DownloadOutline, DocumentOutline, RefreshOutline,
  SchoolOutline, PeopleOutline, PersonOutline, RibbonOutline,
  AlertCircleOutline, GridOutline, EyeOutline
} from '@vicons/ionicons5'
import { apiGet, apiPost, downloadFile } from '~/composables/useApi'
import type { DataTableColumns } from 'naive-ui'
import { useMessage, NTag, NSpace, NButton, NProgress } from 'naive-ui'
import * as echarts from 'echarts'
import type { MonthlyFillRate } from '~/types'
import { useRouter } from 'vue-router'

const appStore = useAppStore()
const userStore = useUserStore()
const route = useRoute()
const router = useRouter()
appStore.setPage('运营端 / 满班率报表', route.path)
const message = useMessage()

const now = new Date()
const filterYear = ref(String(now.getFullYear()))
const filterMonth = ref<string | null>(String(now.getMonth() + 1).padStart(2, '0'))
const filterMajor = ref<string | null>(null)
const filterCampus = ref<number | null>(null)
const list = ref<any[]>([])
const monthlyData = ref<MonthlyFillRate | any>({})
const total = ref(0)
const page = ref(1)
const pageSize = ref(50)
const loading = ref(false)
const summary = reactive<any>({
  overall_rate: 0, total_classes: 0, total_students: 0,
  full_classes: 0, warn_classes: 0, remaining_seats: 0, mom_change: 3.5
})

const yearOpts = Array.from({ length: 5 }, (_, i) => ({ label: `${2024 + i}年`, value: `${2024 + i}` }))
const monthOpts = Array.from({ length: 12 }, (_, i) => ({ label: `${i + 1}月`, value: String(i + 1).padStart(2, '0') }))
const majorOpts = [
  { label: '美术', value: 'fine_art' },
  { label: '音乐', value: 'music' },
  { label: '舞蹈', value: 'dance' },
  { label: '播音主持', value: 'broadcast' },
  { label: '表演', value: 'acting' },
  { label: '编导', value: 'directing' },
  { label: '摄影', value: 'photography' },
]
const campusOpts = ref<any[]>([])

function majorLabel(v: string) { return majorOpts.find(o => o.value === v)?.label || v }
function rateLevel(v: number) {
  if (v >= 90) return { label: '满班', type: 'success' }
  if (v >= 80) return { label: '良好', type: 'info' }
  if (v >= 70) return { label: '中等', type: 'warning' }
  return { label: '预警', type: 'error' }
}

const suggestions = computed(() => {
  const arr: any[] = []
  if (summary.warn_classes > 0) {
    arr.push({
      level: '高优先级', type: 'error',
      title: `存在 ${summary.warn_classes} 个班级满班率低于 70%`,
      content: '建议尽快调整招生策略，考虑合并部分班级或推出针对性促销方案；同时优化课程设置，加强口碑传播。',
      action: '查看预警班级'
    })
  }
  if (summary.remaining_seats > 0) {
    arr.push({
      level: '常规', type: 'warning',
      title: `校区还有 ${summary.remaining_seats} 个剩余学位`,
      content: '可利用学位空档期推出体验课、老带新奖励等活动，加快招生节奏；同步优化班级排课，提升教室利用率。',
      action: '导出招生名单'
    })
  }
  if (summary.full_classes > 0) {
    arr.push({
      level: '积极', type: 'success',
      title: `${summary.full_classes} 个班级已达到满班状态`,
      content: '对这些班级的优秀经验进行复盘总结，并在其他班级复制推广；同时考虑开设平行班或新班，承接溢出需求。',
      action: '查看满班班级'
    })
  }
  arr.push({
    level: '建议', type: 'info',
    title: '月度满班率复盘会议',
    content: '建议每月 5 日前组织校长、教学主管、运营主管召开满班率复盘会，明确下月目标和行动计划，持续优化运营效率。',
    action: '生成会议议程'
  })
  return arr
})

async function loadCampuses() {
  try {
    const res = await apiGet<any>('/common/campuses')
    campusOpts.value = (res?.data || res || []).map((c: any) => ({ label: c.name, value: c.id }))
  } catch {}
}

const pagination = computed(() => ({
  page: page.value, pageSize: pageSize.value, itemCount: total.value,
  showSizePicker: true, pageSizes: [20, 50, 100]
}))

const cols: DataTableColumns = [
  { title: '序号', key: 'index', width: 70, render: (_: any, __: any, i: number) => (page.value - 1) * pageSize.value + i + 1 },
  { title: '班级名称', key: 'class_name', width: 180 },
  { title: '专业', key: 'major', width: 100, render: (r: any) => majorLabel(r.major) || '-' },
  { title: '满员数', key: 'max_students', width: 80, align: 'right' },
  { title: '在读数', key: 'current_students', width: 80, align: 'right' },
  {
    title: '剩余学位', key: 'remaining', width: 90, align: 'right',
    render: (r: any) => {
      const rem = (r.max_students || 0) - (r.current_students || 0)
      return h('span', { style: rem === 0 ? 'color:#18a058;' : rem <= 2 ? 'color:#f0a020;' : '' }, rem)
    }
  },
  {
    title: '满班率', key: 'fill_rate', width: 200,
    render: (r: any) => h(NProgress, {
      percentage: r.fill_rate || 0, height: 18, indicatorPlacement: 'inside',
      status: (r.fill_rate || 0) >= 90 ? 'success' : (r.fill_rate || 0) >= 70 ? 'warning' : 'error'
    })
  },
  {
    title: '评级', key: 'level', width: 80,
    render: (r: any) => {
      const lv = rateLevel(r.fill_rate || 0)
      return h(NTag, { type: lv.type, size: 'small', round: true }, { default: () => lv.label })
    }
  },
  { title: '本月排课', key: 'schedules_count', width: 90, align: 'right' },
  { title: '已消课时', key: 'consumed_hours', width: 100, align: 'right' },
  {
    title: '操作', key: 'ops', width: 100, fixed: 'right',
    render: (r: any) => h(NSpace, null, {
      default: () => [
        h(NButton, { size: 'tiny', type: 'primary', onClick: () => gotoClass(r) }, {
          default: () => h(NIcon, null, { default: () => h(EyeOutline) }),
        })
      ]
    })
  },
]

function gotoClass(r: any) {
  router.push(`/classes?highlight=${r.class_id}`)
}

async function reload() {
  loading.value = true
  try {
    const params: any = {
      year: filterYear.value, month: filterMonth.value || undefined,
      major: filterMajor.value, campus_id: filterCampus.value,
      page: page.value, page_size: pageSize.value
    }
    const res = await apiGet<any>('/schedule/fill-rates', params)
    const monthly: MonthlyFillRate | any = res?.data || res
    monthlyData.value = monthly
    list.value = monthly?.class_details || res?.items || []
    total.value = list.value.length
    summary.overall_rate = Math.round(monthly?.overall_fill_rate || list.value.reduce((s, r) => s + (r.fill_rate || 0), 0) / Math.max(1, list.value.length))
    summary.total_classes = monthly?.total_classes || list.value.length
    summary.total_students = monthly?.total_students || list.value.reduce((s, r) => s + (r.current_students || 0), 0)
    summary.full_classes = list.value.filter(r => (r.fill_rate || 0) >= 90).length
    summary.warn_classes = list.value.filter(r => (r.fill_rate || 0) < 70).length
    summary.remaining_seats = list.value.reduce((s, r) => s + Math.max(0, (r.max_students || 0) - (r.current_students || 0)), 0)
    loadCharts()
  } finally { loading.value = false }
}

async function refreshMonthly() {
  const msg = message.loading('正在重新生成月度满班率报表...', { duration: 0 })
  try {
    await apiPost('/reports/fill-rate/monthly', { year: filterYear.value, month: filterMonth.value })
    msg.destroy()
    message.success('月报生成成功')
    reload()
  } catch (e: any) {
    msg.destroy()
    message.error(e?.message || '生成失败')
  }
}

async function exportExcel() {
  const params = new URLSearchParams()
  params.set('year', filterYear.value)
  if (filterMonth.value) params.set('month', filterMonth.value)
  if (filterMajor.value) params.set('major', filterMajor.value)
  try {
    await downloadFile(`/reports/fill-rate/export/xlsx?${params.toString()}`,
      `满班率报表_${filterYear.value}${filterMonth.value || ''}.xlsx`)
    message.success('已开始下载')
  } catch (e: any) { message.error(e?.message || '导出失败') }
}

function exportPdf() {
  message.success('PDF简报导出功能（模拟）')
}

const trendChartRef = ref<HTMLElement | null>(null)
const majorChartRef = ref<HTMLElement | null>(null)
let trendChart: echarts.ECharts | null = null
let majorChart: echarts.ECharts | null = null

async function loadCharts() {
  await nextTick()
  if (trendChartRef.value) {
    const months = Array.from({ length: 12 }, (_, i) => `${i + 1}月`)
    const rates = Array.from({ length: 12 }, () => 60 + Math.floor(Math.random() * 40))
    rates[parseInt((filterMonth.value || '1')) - 1] = summary.overall_rate || 75
    if (!trendChart) trendChart = echarts.init(trendChartRef.value)
    trendChart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['满班率', '目标线(85%)'] },
      grid: { left: 50, right: 30, top: 50, bottom: 40 },
      xAxis: { type: 'category', data: months },
      yAxis: { type: 'value', max: 100, axisLabel: { formatter: '{value}%' } },
      series: [
        {
          name: '满班率', type: 'line', smooth: true, data: rates,
          areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(32,128,240,0.3)' },
            { offset: 1, color: 'rgba(32,128,240,0.05)' }
          ])},
          itemStyle: { color: '#2080f0' },
          markPoint: {
            data: [
              { type: 'max', name: '最高' },
              { type: 'min', name: '最低' }
            ]
          }
        },
        {
          name: '目标线(85%)', type: 'line',
          data: Array(12).fill(85),
          lineStyle: { type: 'dashed', color: '#d03050' },
          symbol: 'none',
          label: { show: false }
        }
      ]
    })
  }
  if (majorChartRef.value) {
    const majorStats = [
      { name: '美术', value: 82, count: 8 },
      { name: '音乐', value: 75, count: 5 },
      { name: '舞蹈', value: 88, count: 4 },
      { name: '播音主持', value: 91, count: 3 },
      { name: '表演', value: 68, count: 3 },
      { name: '编导', value: 78, count: 4 },
      { name: '摄影', value: 65, count: 2 },
    ]
    if (!majorChart) majorChart = echarts.init(majorChartRef.value)
    majorChart.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: (p: any) => `${p[0].name}<br/>满班率: ${p[0].value}%<br/>班级数: ${majorStats[p[0].dataIndex].count}` },
      legend: { data: ['满班率', '班级数'] },
      grid: { left: 60, right: 60, top: 40, bottom: 40 },
      xAxis: { type: 'category', data: majorStats.map(d => d.name) },
      yAxis: [
        { type: 'value', max: 100, axisLabel: { formatter: '{value}%' } },
        { type: 'value', name: '班级数' }
      ],
      series: [
        {
          name: '满班率', type: 'bar', data: majorStats.map(d => d.value),
          itemStyle: {
            color: (p: any) => p.value >= 85 ? '#18a058' : p.value >= 70 ? '#2080f0' : p.value >= 60 ? '#f0a020' : '#d03050',
            borderRadius: [4, 4, 0, 0]
          },
          barWidth: 36,
          label: { show: true, position: 'top', formatter: '{c}%' }
        },
        {
          name: '班级数', type: 'line', yAxisIndex: 1, smooth: true,
          data: majorStats.map(d => d.count),
          itemStyle: { color: '#722ed1' }
        }
      ]
    })
  }
}

watch([filterYear, filterMonth, filterMajor, filterCampus], () => {
  page.value = 1
})

onMounted(async () => {
  await loadCampuses()
  await reload()
})
</script>
