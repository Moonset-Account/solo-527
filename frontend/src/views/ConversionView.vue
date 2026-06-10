<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h2 class="page-title">预约转化分析</h2>
        <p style="margin:4px 0 0;font-size:13px;color:#909399">多维度分析预约转化、爽约率、营收变化</p>
      </div>
      <div style="display:flex;gap:10px">
        <el-radio-group v-model="daysRange" size="default" @change="loadConversion">
          <el-radio-button :value="7">近7天</el-radio-button>
          <el-radio-button :value="14">近14天</el-radio-button>
          <el-radio-button :value="30">近30天</el-radio-button>
          <el-radio-button :value="90">近90天</el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <div class="grid-dashboard">
      <div class="stat-card primary">
        <div class="stat-icon"><el-icon><Calendar /></el-icon></div>
        <div class="label">总预约数</div>
        <div class="value">{{ summary.total }}</div>
        <div class="trend">{{ daysRange }} 天累计</div>
      </div>
      <div class="stat-card success">
        <div class="stat-icon"><el-icon><CircleCheckFilled /></el-icon></div>
        <div class="label">到店/完成</div>
        <div class="value">{{ summary.arrived }}</div>
        <div class="trend" style="color:#67c23a">
          平均到店率 {{ summary.total ? ((summary.arrived / summary.total) * 100).toFixed(1) : 0 }}%
        </div>
      </div>
      <div class="stat-card danger">
        <div class="stat-icon"><el-icon><WarningFilled /></el-icon></div>
        <div class="label">爽约数</div>
        <div class="value">{{ summary.noShow }}</div>
        <div class="trend" style="color:#f56c6c">
          平均爽约率 {{ summary.total ? ((summary.noShow / summary.total) * 100).toFixed(1) : 0 }}%
        </div>
      </div>
      <div class="stat-card gold">
        <div class="stat-icon"><el-icon><Money /></el-icon></div>
        <div class="label">累计营收</div>
        <div class="value">¥{{ formatMoney(summary.revenue) }}</div>
        <div class="trend">支付成功订单</div>
      </div>
      <div class="stat-card info">
        <div class="stat-icon"><el-icon><Close /></el-icon></div>
        <div class="label">取消数</div>
        <div class="value">{{ summary.cancelled }}</div>
        <div class="trend">
          取消率 {{ summary.total ? ((summary.cancelled / summary.total) * 100).toFixed(1) : 0 }}%
        </div>
      </div>
      <div class="stat-card purple">
        <div class="stat-icon"><el-icon><Wallet /></el-icon></div>
        <div class="label">支付成功</div>
        <div class="value">{{ summary.paid }}</div>
        <div class="trend" style="color:#6c7ae0">
          支付率 {{ summary.total ? ((summary.paid / summary.total) * 100).toFixed(1) : 0 }}%
        </div>
      </div>
    </div>

    <div class="grid-dashboard" style="grid-template-columns: 1.2fr 1fr">
      <div class="section-card">
        <div class="card-header"><h3 class="card-title">每日转化趋势</h3></div>
        <div class="card-body">
          <div ref="chartTrendRef" style="width:100%;height:380px"></div>
        </div>
      </div>
      <div class="section-card">
        <div class="card-header"><h3 class="card-title">爽约率 vs 到店率</h3></div>
        <div class="card-body">
          <div ref="chartRateRef" style="width:100%;height:380px"></div>
        </div>
      </div>
    </div>

    <div class="grid-dashboard" style="grid-template-columns: 1fr 1fr 1fr; margin-top: 0">
      <div class="section-card">
        <div class="card-header"><h3 class="card-title">营收变化（元）</h3></div>
        <div class="card-body">
          <div ref="chartRevenueRef" style="width:100%;height:280px"></div>
        </div>
      </div>
      <div class="section-card">
        <div class="card-header"><h3 class="card-title">预约状态分布</h3></div>
        <div class="card-body">
          <div ref="chartStatusRef" style="width:100%;height:280px"></div>
        </div>
      </div>
      <div class="section-card">
        <div class="card-header"><h3 class="card-title">月度爽约率走势</h3></div>
        <div class="card-body">
          <div ref="chartMonthlyRef" style="width:100%;height:280px"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import * as echarts from 'echarts'
import { Calendar, CircleCheckFilled, WarningFilled, Money, Close, Wallet } from '@element-plus/icons-vue'
import { getConversion, getNoShowTrend } from '@/api/dashboard'

const daysRange = ref(14)
const conversionData = ref<any[]>([])
const monthlyData = ref<any[]>([])

const chartTrendRef = ref<HTMLElement>()
const chartRateRef = ref<HTMLElement>()
const chartRevenueRef = ref<HTMLElement>()
const chartStatusRef = ref<HTMLElement>()
const chartMonthlyRef = ref<HTMLElement>()

let chartTrend: echarts.ECharts | null = null
let chartRate: echarts.ECharts | null = null
let chartRevenue: echarts.ECharts | null = null
let chartStatus: echarts.ECharts | null = null
let chartMonthly: echarts.ECharts | null = null

const formatMoney = (n: number) => (n || 0).toLocaleString()

const summary = computed(() => {
  const d = conversionData.value || []
  return {
    total: d.reduce((s, x) => s + x.total, 0),
    arrived: d.reduce((s, x) => s + x.arrived, 0),
    noShow: d.reduce((s, x) => s + x.noShow, 0),
    cancelled: d.reduce((s, x) => s + x.cancelled, 0),
    paid: d.reduce((s, x) => s + x.paid, 0),
    revenue: d.reduce((s, x) => s + x.revenue, 0),
  }
})

const loadConversion = async () => {
  try {
    const res = await getConversion({ days: daysRange.value })
    conversionData.value = res.data || []
    await nextTick()
    renderCharts()
  } catch (_) {
    conversionData.value = []
  }
}

const loadNoShow = async () => {
  try {
    const res = await getNoShowTrend({ months: 12 })
    monthlyData.value = res.data || []
    await nextTick()
    renderMonthlyChart()
  } catch (_) {
    monthlyData.value = []
  }
}

const renderCharts = () => {
  const data = conversionData.value || []
  const dates = data.map(d => d.date?.slice(5) || '')

  // 趋势图
  if (chartTrendRef.value) {
    if (chartTrend) chartTrend.dispose()
    chartTrend = echarts.init(chartTrendRef.value)
    chartTrend.setOption({
      tooltip: { trigger: 'axis', backgroundColor: 'rgba(0,0,0,0.8)', textStyle: { color: '#fff' } },
      legend: { data: ['预约总数', '到店', '爽约', '取消'], right: 10, top: 0 },
      grid: { left: 40, right: 20, top: 40, bottom: 40 },
      xAxis: { type: 'category', data: dates, axisLabel: { color: '#909399' } },
      yAxis: { type: 'value', axisLabel: { color: '#909399' }, splitLine: { lineStyle: { color: '#f0f0f0' } } },
      series: [
        { name: '预约总数', type: 'bar', stack: 'total', data: data.map(d => d.total), itemStyle: { color: '#cde8e2' } },
        { name: '到店', type: 'bar', data: data.map(d => d.arrived), itemStyle: { color: '#2ab99f', borderRadius: [4, 4, 0, 0] }, barWidth: 20 },
        { name: '爽约', type: 'bar', data: data.map(d => d.noShow), itemStyle: { color: '#f56c6c' }, barWidth: 20 },
        { name: '取消', type: 'bar', data: data.map(d => d.cancelled), itemStyle: { color: '#e6a23c' }, barWidth: 20 },
      ]
    })
  }

  // 率对比
  if (chartRateRef.value) {
    if (chartRate) chartRate.dispose()
    chartRate = echarts.init(chartRateRef.value)
    chartRate.setOption({
      tooltip: { trigger: 'axis', backgroundColor: 'rgba(0,0,0,0.8)', textStyle: { color: '#fff' }, formatter: (p: any) => {
        const r = p[0]
        return `${r.name}<br/>到店率: ${data[r.dataIndex]?.arrivedRate ? (data[r.dataIndex].arrivedRate * 100).toFixed(1) : 0}%<br/>爽约率: ${data[r.dataIndex]?.noShowRate ? (data[r.dataIndex].noShowRate * 100).toFixed(1) : 0}%`
      } },
      legend: { data: ['到店率', '爽约率'], right: 10, top: 0 },
      grid: { left: 50, right: 20, top: 40, bottom: 40 },
      xAxis: { type: 'category', data: dates, axisLabel: { color: '#909399', fontSize: 10, rotate: 30 } },
      yAxis: { type: 'value', max: 100, axisLabel: { color: '#909399', formatter: '{value}%' } },
      series: [
        { name: '到店率', type: 'line', smooth: true, symbolSize: 6,
          data: data.map(d => Math.round(d.arrivedRate * 1000) / 10),
          itemStyle: { color: '#2ab99f' }, lineStyle: { width: 3 },
          areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(42,185,159,0.35)' }, { offset: 1, color: 'rgba(42,185,159,0.02)' }
          ])}
        },
        { name: '爽约率', type: 'line', smooth: true, symbolSize: 6,
          data: data.map(d => Math.round(d.noShowRate * 1000) / 10),
          itemStyle: { color: '#f56c6c' }, lineStyle: { width: 3 },
          areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(245,108,108,0.25)' }, { offset: 1, color: 'rgba(245,108,108,0.02)' }
          ])}
        }
      ]
    })
  }

  // 营收图
  if (chartRevenueRef.value) {
    if (chartRevenue) chartRevenue.dispose()
    chartRevenue = echarts.init(chartRevenueRef.value)
    chartRevenue.setOption({
      tooltip: { trigger: 'axis', backgroundColor: 'rgba(0,0,0,0.8)', textStyle: { color: '#fff' }, formatter: (p: any) => `${p[0].name}<br/>营收: ¥${p[0].value?.toLocaleString() || 0}` },
      grid: { left: 60, right: 20, top: 30, bottom: 40 },
      xAxis: { type: 'category', data: dates, axisLabel: { color: '#909399', fontSize: 10, rotate: 30 } },
      yAxis: { type: 'value', axisLabel: { color: '#909399', formatter: val => val >= 1000 ? (val / 1000) + 'k' : val } },
      series: [{
        type: 'line', smooth: true, symbolSize: 5,
        data: data.map(d => Number(d.revenue || 0)),
        itemStyle: { color: '#6c7ae0' },
        lineStyle: { width: 3 },
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(108,122,224,0.35)' }, { offset: 1, color: 'rgba(108,122,224,0.02)' }
        ])}
      }]
    })
  }

  // 状态分布
  if (chartStatusRef.value) {
    if (chartStatus) chartStatus.dispose()
    chartStatus = echarts.init(chartStatusRef.value)
    const s = summary.value
    const pieData = [
      { value: s.arrived, name: '到店/完成', itemStyle: { color: '#67c23a' } },
      { value: s.noShow, name: '爽约', itemStyle: { color: '#f56c6c' } },
      { value: s.cancelled, name: '已取消', itemStyle: { color: '#e6a23c' } },
      { value: Math.max(0, s.total - s.arrived - s.noShow - s.cancelled), name: '待处理', itemStyle: { color: '#409eff' } },
    ].filter(x => x.value > 0)
    chartStatus.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: 0, textStyle: { color: '#606266', fontSize: 12 } },
      series: [{
        type: 'pie', radius: ['45%', '72%'], center: ['50%', '45%'],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
        label: { show: true, formatter: '{b}\n{d}%', fontSize: 11 },
        data: pieData.length ? pieData : [{ value: 1, name: '暂无', itemStyle: { color: '#e4e7ed' } }]
      }]
    })
  }
}

const renderMonthlyChart = () => {
  if (!chartMonthlyRef.value) return
  if (chartMonthly) chartMonthly.dispose()
  chartMonthly = echarts.init(chartMonthlyRef.value)
  const d = monthlyData.value || []
  chartMonthly.setOption({
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(0,0,0,0.8)', textStyle: { color: '#fff' },
      formatter: (p: any) => {
        const r = p[0]
        const item = d[r.dataIndex]
        return `${r.name}<br/>总预约: ${item?.total_bookings || 0}<br/>爽约: ${item?.no_show_count || 0}<br/>爽约率: ${item?.no_show_rate || 0}%`
      }
    },
    grid: { left: 50, right: 20, top: 30, bottom: 40 },
    xAxis: { type: 'category', data: d.map(x => x.month), axisLabel: { color: '#909399', rotate: 30, fontSize: 10 } },
    yAxis: { type: 'value', max: 50, axisLabel: { color: '#909399', formatter: '{value}%' }, splitLine: { lineStyle: { color: '#f0f0f0' } } },
    series: [{
      type: 'bar', barWidth: 26,
      data: d.map(x => Number(x.no_show_rate || 0)),
      itemStyle: {
        borderRadius: [4, 4, 0, 0],
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#ff7875' }, { offset: 1, color: '#ffccc7' }
        ])
      },
      label: { show: true, position: 'top', color: '#f56c6c', formatter: '{c}%', fontSize: 11 }
    }]
  })
}

const handleResize = () => {
  [chartTrend, chartRate, chartRevenue, chartStatus, chartMonthly].forEach(c => c?.resize())
}

onMounted(async () => {
  await loadConversion()
  await loadNoShow()
  window.addEventListener('resize', handleResize)
})

watch(daysRange, loadConversion)
</script>
