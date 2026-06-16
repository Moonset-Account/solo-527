<template>
  <div>
    <n-page-header title="报价比价分析" subtitle="对比历史价格与供应商报价">
      <template #extra>
        <n-select v-model:value="selectedMaterial" :options="materialOptions" placeholder="选择耗材进行比价" filterable style="width: 320px;" @update:value="handleCompare" />
      </template>
    </n-page-header>

    <n-card v-if="comparisonResult" style="margin-top: 16px;">
      <n-descriptions title="比价概览" :column="3" bordered label-placement="left">
        <n-descriptions-item label="耗材编码">{{ comparisonResult.material_code }}</n-descriptions-item>
        <n-descriptions-item label="耗材名称">{{ comparisonResult.material_name }}</n-descriptions-item>
        <n-descriptions-item label="最低报价供应商">{{ comparisonResult.lowest_supplier }}</n-descriptions-item>
        <n-descriptions-item label="历史均价">
          <n-text strong>¥{{ comparisonResult.historical_avg_price.toFixed(2) }}</n-text>
        </n-descriptions-item>
        <n-descriptions-item label="历史最低价">
          <n-tag type="success">¥{{ comparisonResult.historical_min_price.toFixed(2) }}</n-tag>
        </n-descriptions-item>
        <n-descriptions-item label="历史最高价">¥{{ comparisonResult.historical_max_price.toFixed(2) }}</n-descriptions-item>
        <n-descriptions-item label="当前最低价">
          <n-tag type="success" round>¥{{ comparisonResult.lowest_price.toFixed(2) }}</n-tag>
        </n-descriptions-item>
        <n-descriptions-item label="框架协议价">
          <n-tag v-if="comparisonResult.agreement_price" type="info">¥{{ comparisonResult.agreement_price.toFixed(2) }}</n-tag>
          <n-text v-else depth="3">无协议</n-text>
        </n-descriptions-item>
      </n-descriptions>

      <n-divider title="各供应商报价对比" />

      <n-data-table
        :columns="columns"
        :data="comparisonResult.quotes"
        :bordered="false"
        :single-line="false"
      />

      <n-divider title="价格趋势分析" />
      <div ref="chartRef" style="height: 320px; padding: 16px 0;"></div>
    </n-card>

    <n-card v-else style="margin-top: 16px;">
      <n-empty description="请选择耗材进行比价分析" />
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, h, watch } from 'vue'
import { useMessage, type DataTableColumns } from 'naive-ui'
import * as echarts from 'echarts'
import { listMaterials, compareQuotes } from '~/api'
import dayjs from 'dayjs'

const message = useMessage()
const selectedMaterial = ref<number | null>(null)
const materialOptions = ref<any[]>([])
const comparisonResult = ref<any>(null)
const chartRef = ref<HTMLElement>()
let chart: any = null

const columns: DataTableColumns = [
  { title: '排名', key: 'rank_by_price', width: 70, render: (row: any) =>
    h('n-tag', { type: row.is_lowest ? 'success' : 'default', round: true }, { default: () => `#${row.rank_by_price}` })
  },
  { title: '供应商', key: 'supplier', width: 160 },
  { title: '报价单价', key: 'price', width: 120, render: () => '-' },
  { title: '偏离均价', key: 'variance', width: 120, render: (row: any) => {
      const val = row.price_variance_percent || 0
      return h('n-text', { type: val > 0 ? 'error' : val < 0 ? 'success' : 'default' }, {
        default: () => `${val > 0 ? '+' : ''}${val.toFixed(2)}%`
      })
  }},
  { title: '历史均价', key: 'historical_avg_price', width: 110, render: (row: any) => `¥${(row.historical_avg_price || 0).toFixed(2)}` },
  { title: '是否最低', key: 'is_lowest', width: 90, render: (row: any) =>
    row.is_lowest ? h('n-tag', { type: 'success' }, { default: () => '最低价' }) : '-'
  },
  { title: '协议内', key: 'is_within_agreement', width: 90, render: (row: any) =>
    row.is_within_agreement ? h('n-tag', { type: 'info' }, { default: () => '符合协议' }) : '-'
  },
  { title: '协议价', key: 'agreement_price', width: 100, render: (row: any) => row.agreement_price ? `¥${row.agreement_price.toFixed(2)}` : '-' },
  { title: '价格差异', key: 'price_variance', width: 110, render: (row: any) => {
      const val = row.price_variance || 0
      return h('n-text', { type: val > 0 ? 'error' : val < 0 ? 'success' : 'default' }, {
        default: () => `${val > 0 ? '+' : ''}¥${val.toFixed(2)}`
      })
  }},
  { title: '分析时间', key: 'created_at', width: 160, render: (row: any) => dayjs(row.created_at).format('YYYY-MM-DD HH:mm') }
]

async function loadMaterials() {
  try {
    const res = await listMaterials({ page_size: 500, is_active: true })
    if (res.code === 200) {
      materialOptions.value = res.data.items.map((m: any) => ({
        label: `${m.code} - ${m.name}`,
        value: m.id
      }))
    }
  } catch (e) {}
}

async function handleCompare(id: number) {
  if (!id) return
  try {
    const res = await compareQuotes(id)
    if (res.code === 200) {
      comparisonResult.value = res.data
      renderChart()
    }
  } catch (e: any) {
    message.error(e.message || '比价失败')
  }
}

function renderChart() {
  if (!chartRef.value || !comparisonResult.value) return
  if (!chart) chart = echarts.init(chartRef.value)
  const quotes = comparisonResult.value.quotes
  chart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: ['供应商报价', '历史均价', '历史最低价', '历史最高价'] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: quotes.map((q: any, i: number) => `供应商${i + 1}`) },
    yAxis: { type: 'value', name: '价格(¥)', axisLabel: { formatter: '¥{value}' } },
    series: [
      {
        name: '供应商报价',
        type: 'bar',
        data: quotes.map((q: any) => (q.quote ? q.quote.unit_price : 0)),
        itemStyle: { color: '#2080f0' },
        label: { show: true, position: 'top', formatter: '¥{c}' }
      },
      {
        name: '历史均价',
        type: 'line',
        data: quotes.map(() => comparisonResult.value.historical_avg_price),
        itemStyle: { color: '#f0a020' },
        lineStyle: { type: 'dashed' }
      },
      {
        name: '历史最低价',
        type: 'line',
        data: quotes.map(() => comparisonResult.value.historical_min_price),
        itemStyle: { color: '#18a058' },
        lineStyle: { type: 'dotted' }
      },
      {
        name: '历史最高价',
        type: 'line',
        data: quotes.map(() => comparisonResult.value.historical_max_price),
        itemStyle: { color: '#d03050' },
        lineStyle: { type: 'dotted' }
      }
    ]
  })
}

window.addEventListener('resize', () => chart?.resize())

onMounted(loadMaterials)
</script>
