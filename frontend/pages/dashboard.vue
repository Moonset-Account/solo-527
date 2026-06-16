<template>
  <div>
    <n-page-header title="数据看板" subtitle="采购数据总览" />
    <n-grid :cols="4" :x-gap="16" :y-gap="16" style="margin-top: 16px;">
      <n-grid-item>
        <n-card hoverable>
          <n-statistic label="本月采购金额" :value="summary.monthly_purchase_amount" prefix="¥">
            <template #footer>
              <n-text depth="3">累计总额 ¥{{ summary.total_purchase_amount.toLocaleString() }}</n-text>
            </template>
          </n-statistic>
        </n-card>
      </n-grid-item>
      <n-grid-item>
        <n-card hoverable>
          <n-statistic label="本月订单数" :value="summary.monthly_orders_count" suffix="单">
            <template #footer>
              <n-text depth="3">累计订单 {{ summary.total_orders_count }} 单</n-text>
            </template>
          </n-statistic>
        </n-card>
      </n-grid-item>
      <n-grid-item>
        <n-card hoverable>
          <n-statistic label="待审批需求" :value="summary.pending_approval_count" suffix="单">
            <template #footer>
              <n-tag type="warning" size="small">待交货: {{ summary.pending_delivery_count }}</n-tag>
            </template>
          </n-statistic>
        </n-card>
      </n-grid-item>
      <n-grid-item>
        <n-card hoverable>
          <n-statistic label="高风险供应商" :value="summary.high_risk_supplier_count" suffix="家">
            <template #footer>
              <n-tag type="error" size="small">逾期订单: {{ summary.overdue_orders_count }}</n-tag>
            </template>
          </n-statistic>
        </n-card>
      </n-grid-item>
      <n-grid-item>
        <n-card hoverable>
          <n-statistic label="平均价格偏离" :value="summary.avg_price_variance.toFixed(1)" suffix="%" />
        </n-card>
      </n-grid-item>
      <n-grid-item>
        <n-card hoverable>
          <n-statistic label="成本节约金额" :value="summary.cost_saving_amount" prefix="¥" />
        </n-card>
      </n-grid-item>
      <n-grid-item>
        <n-card hoverable>
          <n-statistic label="在执行协议" :value="summary.active_agreements_count" suffix="份" />
        </n-card>
      </n-grid-item>
    </n-grid>

    <n-grid :cols="2" :x-gap="16" style="margin-top: 24px;">
      <n-grid-item>
        <n-card title="月度采购趋势" hoverable>
          <div ref="trendChartRef" style="height: 320px;"></div>
        </n-card>
      </n-grid-item>
      <n-grid-item>
        <n-card title="品类采购占比" hoverable>
          <div ref="categoryChartRef" style="height: 320px;"></div>
        </n-card>
      </n-grid-item>
    </n-grid>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useMessage } from 'naive-ui'
import * as echarts from 'echarts'
import { getDashboardSummary, getMonthlyTrend, getCategoryStats } from '~/api'

const message = useMessage()
const trendChartRef = ref<HTMLElement>()
const categoryChartRef = ref<HTMLElement>()
let trendChart: any = null
let categoryChart: any = null

const summary = ref({
  total_purchase_amount: 0,
  monthly_purchase_amount: 0,
  total_orders_count: 0,
  monthly_orders_count: 0,
  pending_approval_count: 0,
  pending_delivery_count: 0,
  overdue_orders_count: 0,
  avg_price_variance: 0,
  cost_saving_amount: 0,
  high_risk_supplier_count: 0,
  active_agreements_count: 0
})

const monthlyTrend = ref<any[]>([])
const categoryStats = ref<any[]>([])

async function loadData() {
  try {
    const [sumRes, trendRes, catRes] = await Promise.all([
      getDashboardSummary(),
      getMonthlyTrend(6),
      getCategoryStats()
    ])
    if (sumRes.code === 200) summary.value = sumRes.data
    if (trendRes.code === 200) monthlyTrend.value = trendRes.data
    if (catRes.code === 200) categoryStats.value = catRes.data
    renderCharts()
  } catch (e: any) {
    message.error(e.message || '加载数据失败')
  }
}

function renderCharts() {
  if (trendChartRef.value && monthlyTrend.value.length) {
    if (!trendChart) trendChart = echarts.init(trendChartRef.value)
    trendChart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['采购金额', '订单数'] },
      xAxis: { type: 'category', data: monthlyTrend.value.map(d => d.month) },
      yAxis: [
        { type: 'value', name: '金额(¥)' },
        { type: 'value', name: '订单数' }
      ],
      series: [
        {
          name: '采购金额',
          type: 'bar',
          data: monthlyTrend.value.map(d => d.amount),
          itemStyle: { color: '#18a058' }
        },
        {
          name: '订单数',
          type: 'line',
          yAxisIndex: 1,
          data: monthlyTrend.value.map(d => d.order_count),
          itemStyle: { color: '#2080f0' }
        }
      ]
    })
  }
  if (categoryChartRef.value && categoryStats.value.length) {
    if (!categoryChart) categoryChart = echarts.init(categoryChartRef.value)
    categoryChart.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
      legend: { type: 'scroll', bottom: 0 },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        label: { show: false },
        data: categoryStats.value.map(d => ({ name: d.category_name, value: d.amount }))
      }]
    })
  }
}

onMounted(() => {
  loadData()
  window.addEventListener('resize', () => {
    trendChart?.resize()
    categoryChart?.resize()
  })
})
</script>
