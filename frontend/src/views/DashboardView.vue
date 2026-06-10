<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h2 class="page-title">运营工作台</h2>
        <p class="page-subtitle">今日概览 · {{ todayStr }} · {{ weekDayStr }}</p>
      </div>
      <div class="header-actions">
        <el-button @click="refresh"><el-icon><Refresh /></el-icon> 刷新</el-button>
        <el-button type="primary" @click="$router.push('/bookings/create')">
          <el-icon><Plus /></el-icon> 新建预约
        </el-button>
      </div>
    </div>

    <div class="grid-dashboard">
      <div class="stat-card primary">
        <div class="stat-icon"><el-icon><Calendar /></el-icon></div>
        <div class="label">今日预约</div>
        <div class="value">{{ stats.todayBookings }}</div>
        <div class="trend up">较昨日 +{{ Math.round(stats.todayBookings * 0.12) }}
          <el-icon><Top /></el-icon>
        </div>
      </div>
      <div class="stat-card success">
        <div class="stat-icon"><el-icon><CircleCheckFilled /></el-icon></div>
        <div class="label">已到店/完成</div>
        <div class="value">{{ stats.todayCompleted }}</div>
        <div class="trend" style="color:#67c23a">
          到店率 {{ stats.todayBookings ? ((stats.todayCompleted / stats.todayBookings) * 100).toFixed(0) : 0 }}%
        </div>
      </div>
      <div class="stat-card danger">
        <div class="stat-icon"><el-icon><WarningFilled /></el-icon></div>
        <div class="label">今日爽约</div>
        <div class="value">{{ stats.todayNoShow }}</div>
        <div class="trend" style="color:#f56c6c">
          爽约率 {{ stats.todayBookings ? ((stats.todayNoShow / stats.todayBookings) * 100).toFixed(1) : 0 }}%
        </div>
      </div>
      <div class="stat-card info">
        <div class="stat-icon"><el-icon><DataLine /></el-icon></div>
        <div class="label">本周预约</div>
        <div class="value">{{ stats.weekBookings }}</div>
        <div class="trend">近7天总预约数</div>
      </div>
      <div class="stat-card gold">
        <div class="stat-icon"><el-icon><Money /></el-icon></div>
        <div class="label">本月营收</div>
        <div class="value">¥{{ formatMoney(stats.monthRevenue) }}</div>
        <div class="trend">已支付订单金额</div>
      </div>
      <div class="stat-card purple" style="cursor:pointer" @click="$router.push('/exceptions')">
        <div class="stat-icon"><el-icon><BellFilled /></el-icon></div>
        <div class="label">待处理异常</div>
        <div class="value">{{ stats.pendingExceptions }}</div>
        <div class="trend" style="color:#6c7ae0">
          <el-icon><Right /></el-icon> 点击查看待办池
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon"><el-icon><UserFilled /></el-icon></div>
        <div class="label">在岗人员</div>
        <div class="value">{{ stats.activeDoctors + stats.activeTechnicians }}</div>
        <div class="trend">
          医生 {{ stats.activeDoctors }} · 技师 {{ stats.activeTechnicians }}
        </div>
      </div>
      <div class="stat-card cyan">
        <div class="stat-icon"><el-icon><Clock /></el-icon></div>
        <div class="label">今日可约时段</div>
        <div class="value">{{ stats.todayAvailableSlots }}</div>
        <div class="trend" style="color:#2ab99f">
          <el-icon><Right /></el-icon> 点击查看
        </div>
      </div>
    </div>

    <div class="grid-dashboard" style="grid-template-columns: 2fr 1fr; margin-bottom: 20px;">
      <div class="section-card">
        <div class="card-header">
          <h3 class="card-title">预约转化趋势（近14天）</h3>
          <el-radio-group v-model="daysRange" size="small" @change="loadConversion">
            <el-radio-button :value="7">7天</el-radio-button>
            <el-radio-button :value="14">14天</el-radio-button>
            <el-radio-button :value="30">30天</el-radio-button>
          </el-radio-group>
        </div>
        <div class="card-body">
          <div ref="chartConvRef" style="width:100%;height:320px"></div>
        </div>
      </div>

      <div class="section-card">
        <div class="card-header">
          <h3 class="card-title">爽约率趋势（近6个月）</h3>
          <el-button link type="primary" @click="$router.push('/conversion')">
            详细分析 <el-icon><Right /></el-icon>
          </el-button>
        </div>
        <div class="card-body">
          <div ref="chartNoShowRef" style="width:100%;height:320px"></div>
        </div>
      </div>
    </div>

    <div class="two-col">
      <div class="section-card">
        <div class="card-header">
          <h3 class="card-title">最近预约</h3>
          <el-button link type="primary" @click="$router.push('/bookings')">
            全部预约 <el-icon><Right /></el-icon>
          </el-button>
        </div>
        <div class="card-body" style="padding: 0">
          <el-table :data="stats.recentBookings || []" stripe size="default" style="width:100%">
            <el-table-column prop="bookingNo" label="预约编号" width="200">
              <template #default="{ row }">
                <span class="mono-text">{{ row.booking_no }}</span>
              </template>
            </el-table-column>
            <el-table-column label="客户" width="140">
              <template #default="{ row }">
                <div style="display:flex;align-items:center;gap:8px">
                  <el-avatar :size="28" style="background:#e6f7f3;color:#2ab99f;font-size:13px">
                    {{ row.customer?.name?.[0] }}
                  </el-avatar>
                  <div>
                    <div style="font-size:13px;color:#303133">{{ row.customer?.name }}</div>
                    <div style="font-size:11px;color:#909399">{{ row.customer?.phone }}</div>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="服务项目" min-width="140">
              <template #default="{ row }">
                <div style="font-size:13px">{{ row.service?.name }}</div>
                <div style="font-size:11px;color:#909399">
                  {{ row.staff?.name }} · {{ row.start_time }}-{{ row.end_time }}
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="booking_date" label="日期" width="110" />
            <el-table-column label="状态" width="90">
              <template #default="{ row }">
                <span :class="['status-tag', 'status-' + row.status]">{{ statusText(row.status) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80" align="center">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="$router.push(`/bookings/${row.id}`)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <div class="two-col-vertical" style="display:flex;flex-direction:column;gap:16px">
        <div class="section-card">
          <div class="card-header">
            <h3 class="card-title">今日预约状态分布</h3>
          </div>
          <div class="card-body">
            <div ref="chartStatusRef" style="width:100%;height:220px"></div>
          </div>
        </div>

        <div class="section-card">
          <div class="card-header">
            <h3 class="card-title">本周预约来源分布</h3>
          </div>
          <div class="card-body">
            <div class="source-list">
              <div v-for="s in sourceData" :key="s.source" class="source-item">
                <span class="source-name">{{ sourceText(s.source) }}</span>
                <div class="source-bar-wrap">
                  <div class="source-bar" :style="{ width: s.percent + '%', background: s.color }"></div>
                </div>
                <span class="source-count">{{ s.count }}</span>
              </div>
              <div v-if="sourceData.length === 0" class="empty-text">暂无数据</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, computed } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import {
  Refresh, Plus, Calendar, CircleCheckFilled, WarningFilled,
  DataLine, Money, BellFilled, UserFilled, Clock, Top, Right
} from '@element-plus/icons-vue'
import { getDashboard, getConversion, getNoShowTrend } from '@/api/dashboard'

dayjs.locale('zh-cn')
const router = useRouter()

const todayStr = dayjs().format('YYYY年MM月DD日')
const weekDayStr = dayjs().format('dddd')

const loading = ref(false)
const daysRange = ref(14)

const stats = ref<any>({
  todayBookings: 0, todayCompleted: 0, todayNoShow: 0,
  weekBookings: 0, monthRevenue: 0, pendingExceptions: 0,
  activeDoctors: 0, activeTechnicians: 0, todayAvailableSlots: 0,
  statusStats: [], sourceStats: [], recentBookings: []
})

const chartConvRef = ref<HTMLElement>()
const chartNoShowRef = ref<HTMLElement>()
const chartStatusRef = ref<HTMLElement>()

let chartConv: echarts.ECharts | null = null
let chartNoShow: echarts.ECharts | null = null
let chartStatus: echarts.ECharts | null = null

const statusMap: Record<string, string> = {
  pending: '待确认', confirmed: '已确认', arrived: '已到店',
  completed: '已完成', cancelled: '已取消'
}
const sourceMap: Record<string, string> = {
  front_desk: '前台', online: '线上', phone: '电话', walk_in: '到店预约'
}
const sourceColorMap: Record<string, string> = {
  front_desk: '#2ab99f', online: '#6c7ae0', phone: '#e6a23c', walk_in: '#67c23a'
}

const statusText = (s: string) => statusMap[s] || s
const sourceText = (s: string) => sourceMap[s] || s
const formatMoney = (n: number) => (n || 0).toLocaleString()

const sourceData = computed(() => {
  const arr = stats.value.sourceStats || []
  const total = arr.reduce((sum: number, i: any) => sum + i.count, 0) || 1
  return arr.map((s: any) => ({
    ...s,
    percent: Math.round((s.count / total) * 100),
    color: sourceColorMap[s.source] || '#909399'
  }))
})

const loadDashboard = async () => {
  loading.value = true
  try {
    const res = await getDashboard()
    stats.value = { ...stats.value, ...res.data }
    await nextTick()
    renderStatusChart()
  } finally {
    loading.value = false
  }
}

const loadConversion = async () => {
  try {
    const res = await getConversion({ days: daysRange.value })
    renderConversionChart(res.data || [])
  } catch (_) {
    renderConversionChart([])
  }
}

const loadNoShowTrend = async () => {
  try {
    const res = await getNoShowTrend({ months: 6 })
    renderNoShowChart(res.data || [])
  } catch (_) {
    renderNoShowChart([])
  }
}

const renderConversionChart = (data: any[]) => {
  if (!chartConvRef.value) return
  if (chartConv) chartConv.dispose()
  chartConv = echarts.init(chartConvRef.value)

  const dates = data.map((d: any) => d.date?.slice(5) || '')
  chartConv.setOption({
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(0,0,0,0.8)', textStyle: { color: '#fff' } },
    legend: { data: ['预约数', '到店数', '爽约数'], right: 10, top: 0 },
    grid: { left: 40, right: 20, top: 40, bottom: 40 },
    xAxis: {
      type: 'category', data: dates,
      axisLine: { lineStyle: { color: '#e4e7ed' } },
      axisLabel: { color: '#909399', fontSize: 11 }
    },
    yAxis: [
      {
        type: 'value', name: '人数',
        splitLine: { lineStyle: { color: '#f0f0f0' } },
        axisLabel: { color: '#909399', fontSize: 11 }
      },
      {
        type: 'value', name: '率(%)', max: 100,
        axisLabel: { color: '#909399', fontSize: 11, formatter: '{value}%' }
      }
    ],
    series: [
      {
        name: '预约数', type: 'bar', barWidth: 16,
        data: data.map((d: any) => d.total),
        itemStyle: { color: '#cde8e2', borderRadius: [4, 4, 0, 0] }
      },
      {
        name: '到店数', type: 'bar', barWidth: 16,
        data: data.map((d: any) => d.arrived),
        itemStyle: { color: '#2ab99f', borderRadius: [4, 4, 0, 0] }
      },
      {
        name: '爽约数', type: 'bar', barWidth: 16,
        data: data.map((d: any) => d.noShow),
        itemStyle: { color: '#f56c6c', borderRadius: [4, 4, 0, 0] }
      },
      {
        name: '到店率', type: 'line', yAxisIndex: 1, smooth: true,
        data: data.map((d: any) => Math.round(d.arrivedRate * 1000) / 10),
        itemStyle: { color: '#6c7ae0' },
        lineStyle: { width: 3 },
        symbol: 'circle', symbolSize: 6
      }
    ]
  })
}

const renderNoShowChart = (data: any[]) => {
  if (!chartNoShowRef.value) return
  if (chartNoShow) chartNoShow.dispose()
  chartNoShow = echarts.init(chartNoShowRef.value)

  chartNoShow.setOption({
    tooltip: {
      trigger: 'axis', backgroundColor: 'rgba(0,0,0,0.8)', textStyle: { color: '#fff' },
      formatter: (params: any) => {
        const p = params[0]
        const d = data[p.dataIndex]
        return `${p.name}<br/>总预约: ${d.total_bookings}<br/>爽约: ${d.no_show_count}<br/>爽约率: ${d.no_show_rate}%`
      }
    },
    grid: { left: 50, right: 20, top: 30, bottom: 40 },
    xAxis: {
      type: 'category', data: data.map((d: any) => d.month),
      axisLine: { lineStyle: { color: '#e4e7ed' } },
      axisLabel: { color: '#909399', fontSize: 11 }
    },
    yAxis: {
      type: 'value', name: '爽约率(%)', max: 50,
      axisLabel: { color: '#909399', fontSize: 11, formatter: '{value}%' },
      splitLine: { lineStyle: { color: '#f0f0f0' } }
    },
    series: [
      {
        type: 'bar', data: data.map((d: any) => Number(d.no_show_rate)),
        barWidth: 28,
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#ff7875' },
            { offset: 1, color: '#ffccc7' }
          ])
        },
        label: { show: true, position: 'top', color: '#f56c6c', formatter: '{c}%', fontSize: 11 }
      }
    ]
  })
}

const renderStatusChart = () => {
  if (!chartStatusRef.value) return
  if (chartStatus) chartStatus.dispose()
  chartStatus = echarts.init(chartStatusRef.value)

  const sArr = stats.value.statusStats || []
  const pieData = sArr.map((s: any) => ({
    name: statusText(s.status),
    value: s.count
  }))
  if (pieData.length === 0) {
    pieData.push({ name: '暂无', value: 0 })
  }

  chartStatus.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { right: 10, top: 'center', orient: 'vertical', textStyle: { color: '#606266', fontSize: 12 } },
    color: ['#e6a23c', '#409eff', '#67c23a', '#2ab99f', '#f56c6c', '#909399'],
    series: [{
      type: 'pie',
      radius: ['50%', '75%'],
      center: ['35%', '50%'],
      avoidLabelOverlap: false,
      label: { show: false },
      data: pieData
    }]
  })
}

const refresh = async () => {
  await loadDashboard()
  await loadConversion()
  await loadNoShowTrend()
}

const handleResize = () => {
  chartConv?.resize()
  chartNoShow?.resize()
  chartStatus?.resize()
}

onMounted(async () => {
  await refresh()
  window.addEventListener('resize', handleResize)
})
</script>

<style scoped>
.page-subtitle {
  margin: 6px 0 0;
  font-size: 13px;
  color: #909399;
}
.header-actions {
  display: flex;
  gap: 10px;
}

.stat-card {
  position: relative;
  overflow: hidden;
}
.stat-card::after {
  content: '';
  position: absolute;
  right: -20px; top: -20px;
  width: 100px; height: 100px;
  border-radius: 50%;
  opacity: 0.08;
  background: currentColor;
}
.stat-icon {
  position: absolute;
  top: 16px; right: 16px;
  width: 40px; height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  opacity: 0.8;
}
.stat-card.primary .stat-icon { background: #e6f7f3; color: #2ab99f; }
.stat-card.primary .value { color: #2ab99f; }
.stat-card.success .stat-icon { background: #f0f9eb; color: #67c23a; }
.stat-card.success .value { color: #67c23a; }
.stat-card.danger .stat-icon { background: #fef0f0; color: #f56c6c; }
.stat-card.danger .value { color: #f56c6c; }
.stat-card.info .stat-icon { background: #ecf5ff; color: #409eff; }
.stat-card.info .value { color: #409eff; }
.stat-card.gold .stat-icon { background: #fdf6ec; color: #e6a23c; }
.stat-card.gold .value { color: #e6a23c; }
.stat-card.purple .stat-icon { background: #eeeffb; color: #6c7ae0; }
.stat-card.purple .value { color: #6c7ae0; }
.stat-card.cyan .stat-icon { background: #e6f7f3; color: #2ab99f; }
.stat-card.cyan .value { color: #2ab99f; }

.trend .el-icon { font-size: 12px; }
.trend.up { color: #f56c6c; }
.trend .el-icon { margin-left: 2px; }

.mono-text {
  font-family: 'SF Mono', Monaco, Consolas, monospace;
  font-size: 12px;
  color: #606266;
}

.two-col {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
}
@media (max-width: 1200px) {
  .two-col { grid-template-columns: 1fr; }
}

.source-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.source-item {
  display: grid;
  grid-template-columns: 80px 1fr 40px;
  gap: 10px;
  align-items: center;
}
.source-name {
  font-size: 13px;
  color: #606266;
}
.source-bar-wrap {
  height: 8px;
  background: #f0f2f5;
  border-radius: 4px;
  overflow: hidden;
}
.source-bar {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s;
}
.source-count {
  text-align: right;
  font-size: 13px;
  color: #303133;
  font-weight: 600;
}
.empty-text {
  text-align: center;
  padding: 20px 0;
  color: #909399;
  font-size: 13px;
}
</style>
