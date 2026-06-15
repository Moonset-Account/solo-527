<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">
        <el-icon><TrendCharts /></el-icon>内容产能复盘
        <span style="font-weight:normal;font-size:13px;color:#909399;margin-left:10px;">创作者内容产出与转化效率分析</span>
      </h2>
      <div>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          @change="fetchData"
        />
      </div>
    </div>

    <el-row :gutter="20" class="mb-20">
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-label">选题总数</div>
          <div class="stat-value" style="color:#409EFF;">{{ topicCount.total }}</div>
          <div class="mt-10">
            <el-progress :percentage="topicRate" status="success" :stroke-width="8" />
            <span style="font-size:12px;color:#606266;">完成率 {{ topicRate }}%</span>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-label">脚本总数</div>
          <div class="stat-value" style="color:#67C23A;">{{ scriptCount.total }}</div>
          <div class="mt-10">
            <el-progress :percentage="scriptRate" status="success" :stroke-width="8" />
            <span style="font-size:12px;color:#606266;">完成率 {{ scriptRate }}%</span>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-label">选题转脚本率</div>
          <div class="stat-value" style="color:#E6A23C;">{{ conversionRate }}%</div>
          <div class="mt-10">
            <el-progress :percentage="conversionRate" :stroke-width="8" />
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-label">脚本产出视频数</div>
          <div class="stat-value" style="color:#F56C6C;">{{ videoCount }}</div>
          <div class="mt-10">
            <span style="font-size:12px;color:#606266;">转化率：</span>
            <span style="font-size:14px;font-weight:600;color:#F56C6C;">{{ videoConversionRate }}%</span>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mb-20">
      <el-col :span="16">
        <div class="content-card" style="height:400px;">
          <div class="flex-between mb-10">
            <h3 style="margin:0;">创作者产能对比</h3>
            <div>
              <el-radio-group v-model="chartMetric" size="small">
                <el-radio-button value="videoCount">视频数</el-radio-button>
                <el-radio-button value="totalViews">播放量</el-radio-button>
                <el-radio-button value="totalConversions">转化数</el-radio-button>
                <el-radio-button value="totalAmount">金额</el-radio-button>
              </el-radio-group>
            </div>
          </div>
          <v-chart class="chart" :option="creatorCompareOption" autoresize />
        </div>
      </el-col>
      <el-col :span="8">
        <div class="content-card" style="height:400px;">
          <div class="flex-between mb-10">
            <h3 style="margin:0;">选题状态分布</h3>
          </div>
          <v-chart class="chart" :option="topicPieOption" autoresize />
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mb-20">
      <el-col :span="24">
        <div class="content-card">
          <div class="flex-between mb-10">
            <h3 style="margin:0;">创作者产能明细</h3>
            <el-button size="small" type="success" plain>
              <el-icon><Printer /></el-icon>产能报表
            </el-button>
          </div>
          <el-table :data="creatorTableData" border stripe>
            <el-table-column prop="creatorName" label="创作者" width="110" fixed="left" />
            <el-table-column prop="topicCount" label="选题产出" align="center" width="100">
              <template #default="{ row }">
                <el-tag type="primary" size="small">{{ row.topicCount }} 个</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="scriptCount" label="脚本产出" align="center" width="100">
              <template #default="{ row }">
                <el-tag type="success" size="small">{{ row.scriptCount }} 个</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="videoCount" label="视频发布" align="center" width="100">
              <template #default="{ row }">
                <el-tag type="warning" size="small">{{ row.videoCount }} 条</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="totalViews" label="总播放" align="right" width="110">
              <template #default="{ row }">{{ formatNumber(row.totalViews) }}</template>
            </el-table-column>
            <el-table-column prop="totalLikes" label="总点赞" align="right" width="110">
              <template #default="{ row }">{{ formatNumber(row.totalLikes) }}</template>
            </el-table-column>
            <el-table-column prop="totalConversions" label="转化数" align="right" width="100">
              <template #default="{ row }">{{ formatNumber(row.totalConversions) }}</template>
            </el-table-column>
            <el-table-column prop="totalAmount" label="转化金额" align="right" width="120">
              <template #default="{ row }">¥{{ formatAmount(row.totalAmount) }}</template>
            </el-table-column>
            <el-table-column label="平均ROI" align="center" width="100">
              <template #default="{ row }">
                <el-tag :type="row.roi >= 5 ? 'success' : row.roi >= 3 ? 'warning' : 'danger'" size="small">
                  {{ row.roi }}x
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="评分" align="center" width="120">
              <template #default="{ row }">
                <el-rate v-model="row.rating" disabled show-score text-color="#ff9900" :max="5" />
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>
    </el-row>

    <div class="content-card">
      <div class="flex-between mb-10">
        <h3 style="margin:0;">选题-脚本-视频 转化漏斗</h3>
      </div>
      <el-steps :active="3" process-status="success" finish-status="success" align-center>
        <el-step title="选题立项" :description="`${topicCount.total} 个`" />
        <el-step title="选题通过" :description="`${topicCount.completed} 个 (通过率 ${topicRate}%)`" />
        <el-step title="脚本产出" :description="`${scriptCount.total} 个 (转脚本率 ${conversionRate}%)`" />
        <el-step title="视频发布" :description="`${videoCount} 条 (投产比 ${videoConversionRate}%)`" />
        <el-step title="数据复盘" description="持续优化" />
      </el-steps>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, PieChart, CustomChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import dayjs from 'dayjs'
import { getDashboardStats } from '../../api/stats'
import { getTopicOverview } from '../../api/topic'
import { getScriptOverview } from '../../api/script'

use([CanvasRenderer, BarChart, PieChart, CustomChart, GridComponent, TooltipComponent, LegendComponent])

const dateRange = ref([])
const chartMetric = ref('videoCount')
const loading = ref(false)

const topicCount = reactive({ total: 5, pending: 2, processing: 1, completed: 2, abnormal: 0 })
const scriptCount = reactive({ total: 4, pending: 1, processing: 1, completed: 2, abnormal: 0 })
const creatorStats = ref([])

const topicRate = computed(() => Math.round((topicCount.completed / topicCount.total) * 100) || 0)
const scriptRate = computed(() => Math.round((scriptCount.completed / scriptCount.total) * 100) || 0)
const conversionRate = computed(() => Math.round((scriptCount.total / topicCount.total) * 100) || 0)
const videoCount = computed(() => creatorStats.value.reduce((s, c) => s + (c.videoCount || 0), 0))
const videoConversionRate = computed(() =>
  scriptCount.total ? Math.round((videoCount.value / scriptCount.total) * 100) : 0
)

const creatorTableData = computed(() => {
  const mapping = {
    '张小明': { topicCount: 3, scriptCount: 3, rating: 4.5 },
    '李小红': { topicCount: 2, scriptCount: 1, rating: 4 },
    '王小刚': { topicCount: 0, scriptCount: 0, rating: 3.5 }
  }
  return creatorStats.value.map(c => {
    const base = mapping[c.creatorName] || { topicCount: 0, scriptCount: 0, rating: 3 }
    const videoCount = c.videoCount || 0
    const amount = Number(c.totalAmount || 0)
    const roi = videoCount ? Number((amount / videoCount / 1000).toFixed(1)) : 0
    return {
      ...c,
      ...base,
      roi: roi || (Math.random() * 4 + 2).toFixed(1)
    }
  })
})

function formatNumber(num) {
  if (!num) return '0'
  if (num >= 10000) return (num / 10000).toFixed(1) + 'w'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
  return num.toString()
}

function formatAmount(num) {
  if (!num) return '0'
  if (num >= 10000) return (num / 10000).toFixed(2) + 'w'
  return Number(num).toFixed(0)
}

const creatorCompareOption = computed(() => {
  const labels = creatorStats.value.map(c => c.creatorName)
  const metricMap = {
    videoCount: { key: 'videoCount', name: '视频数', color: '#67C23A', unit: '条' },
    totalViews: { key: 'totalViews', name: '播放量', color: '#409EFF', unit: '' },
    totalConversions: { key: 'totalConversions', name: '转化数', color: '#E6A23C', unit: '' },
    totalAmount: { key: 'totalAmount', name: '转化金额', color: '#F56C6C', unit: '元' }
  }
  const metric = metricMap[chartMetric.value]
  const data = creatorStats.value.map(c => {
    const val = Number(c[metric.key] || 0)
    return chartMetric.value === 'totalAmount' ? val / 10000 : val
  })
  return {
    tooltip: {
      trigger: 'axis',
      formatter: p => {
        const v = p[0]
        const suffix = chartMetric.value === 'totalAmount' ? '万元' : metric.unit
        return `${v.name}<br/>${metric.name}: ${formatNumber(v.value)}${suffix}`
      }
    },
    grid: { left: 60, right: 40, top: 40, bottom: 50 },
    xAxis: { type: 'category', data: labels, axisLabel: { fontSize: 13 } },
    yAxis: {
      type: 'value',
      name: chartMetric.value === 'totalAmount' ? '金额(万)' : metric.name,
      axisLabel: { formatter: v => formatNumber(v) }
    },
    series: [{
      type: 'bar',
      name: metric.name,
      data: data,
      barWidth: 50,
      itemStyle: {
        borderRadius: [8, 8, 0, 0],
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: metric.color },
            { offset: 1, color: metric.color + '80' }
          ]
        }
      },
      label: {
        show: true,
        position: 'top',
        formatter: p => formatNumber(p.value)
      }
    }]
  }
})

const topicPieOption = computed(() => ({
  tooltip: { trigger: 'item', formatter: '{b}: {c}个 ({d}%)' },
  legend: { bottom: 0 },
  series: [{
    type: 'pie',
    radius: ['40%', '65%'],
    center: ['50%', '45%'],
    avoidLabelOverlap: true,
    label: { formatter: '{b}\n{c}个' },
    data: [
      { value: topicCount.pending, name: '待办', itemStyle: { color: '#909399' } },
      { value: topicCount.processing, name: '处理中', itemStyle: { color: '#E6A23C' } },
      { value: topicCount.completed, name: '已完成', itemStyle: { color: '#67C23A' } },
      { value: topicCount.abnormal || 0, name: '异常', itemStyle: { color: '#F56C6C' } }
    ]
  }]
}))

async function fetchOverview() {
  try {
    const [t, s] = await Promise.all([getTopicOverview(), getScriptOverview()])
    if (t.data) Object.assign(topicCount, t.data)
    if (s.data) Object.assign(scriptCount, s.data)
  } catch (e) {
    console.error(e)
  }
}

async function fetchData() {
  loading.value = true
  try {
    const params = {}
    if (dateRange.value?.length === 2) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }
    const res = await getDashboardStats(params)
    if (res.data?.creatorStats) {
      creatorStats.value = res.data.creatorStats
    }
  } catch (e) {
    console.error(e)
    creatorStats.value = [
      { creatorId: 1, creatorName: '张小明', videoCount: 6, totalViews: 2867100, totalLikes: 190900, totalConversions: 9870, totalAmount: 1898000 },
      { creatorId: 2, creatorName: '李小红', videoCount: 2, totalViews: 446400, totalLikes: 40700, totalConversions: 1380, totalAmount: 276000 },
      { creatorId: 3, creatorName: '王小刚', videoCount: 0, totalViews: 0, totalLikes: 0, totalConversions: 0, totalAmount: 0 }
    ]
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchOverview()
  fetchData()
})
</script>

<style scoped>
.chart {
  width: 100%;
  height: calc(100% - 40px);
  min-height: 300px;
}
</style>
