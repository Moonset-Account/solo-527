<template>
  <div class="statistics-page">
    <div class="page-header">
      <h2>统计分析</h2>
      <p class="subtitle">多维度数据分析，助力业务决策</p>
    </div>

    <el-tabs v-model="activeTab" class="stats-tabs">
      <el-tab-pane label="师傅负载分析" name="workload">
        <div class="tab-content">
          <div class="chart-toolbar">
            <el-radio-group v-model="workloadPeriod" size="default" @change="loadWorkloadChart">
              <el-radio-button label="day">按日</el-radio-button>
              <el-radio-button label="week">按周</el-radio-button>
              <el-radio-button label="month">按月</el-radio-button>
            </el-radio-group>
            <el-date-picker
              v-model="workloadDateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              size="default"
              @change="loadWorkloadChart"
            />
          </div>
          <el-card class="chart-card">
            <div ref="workloadChartRef" class="chart-container"></div>
          </el-card>
          <el-card class="data-card">
            <template #header>
              <span>师傅负载排行</span>
            </template>
            <el-table :data="workloadRank" stripe size="small">
              <el-table-column type="index" label="排名" width="80">
                <template #default="{ $index }">
                  <span :class="`rank rank-${$index + 1}`">{{ $index + 1 }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="name" label="师傅姓名" width="150" />
              <el-table-column prop="orderCount" label="订单数" width="120" />
              <el-table-column label="完成率">
                <template #default="{ row }">
                  <el-progress :percentage="row.completionRate" :stroke-width="12" />
                </template>
              </el-table-column>
              <el-table-column prop="avgRating" label="平均评分" width="120">
                <template #default="{ row }">
                  <el-rate v-model="row.avgRating" disabled size="small" />
                  <span class="rating-text">{{ row.avgRating }}</span>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </div>
      </el-tab-pane>

      <el-tab-pane label="复购统计" name="repurchase">
        <div class="tab-content">
          <div class="chart-toolbar">
            <el-radio-group v-model="repurchaseGroupBy" size="default" @change="loadRepurchaseChart">
              <el-radio-button label="community">按社区</el-radio-button>
              <el-radio-button label="date">按日期</el-radio-button>
              <el-radio-button label="channel">按渠道</el-radio-button>
            </el-radio-group>
          </div>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-card class="chart-card">
                <template #header>
                  <span>复购率趋势</span>
                </template>
                <div ref="repurchaseChartRef" class="chart-container"></div>
              </el-card>
            </el-col>
            <el-col :span="12">
              <el-card class="chart-card">
                <template #header>
                  <span>复购用户分布</span>
                </template>
                <div ref="repurchasePieRef" class="chart-container"></div>
              </el-card>
            </el-col>
          </el-row>
          <el-card class="data-card">
            <template #header>
              <span>复购明细</span>
            </template>
            <el-table :data="repurchaseData" stripe size="small">
              <el-table-column prop="name" label="名称" />
              <el-table-column prop="totalUsers" label="总用户数" />
              <el-table-column prop="repeatUsers" label="复购用户数" />
              <el-table-column label="复购率">
                <template #default="{ row }">
                  <span class="highlight">{{ ((row.repeatUsers / row.totalUsers) * 100).toFixed(1) }}%</span>
                </template>
              </el-table-column>
              <el-table-column prop="avgOrderCount" label="人均订单数" />
            </el-table>
          </el-card>
        </div>
      </el-tab-pane>

      <el-tab-pane label="迟到原因分析" name="late-reasons">
        <div class="tab-content">
          <div class="chart-toolbar">
            <el-date-picker
              v-model="lateDateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              size="default"
              @change="loadLateReasonsChart"
            />
          </div>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-card class="chart-card">
                <template #header>
                  <span>迟到原因分布</span>
                </template>
                <div ref="lateReasonsChartRef" class="chart-container"></div>
              </el-card>
            </el-col>
            <el-col :span="12">
              <el-card class="chart-card">
                <template #header>
                  <span>迟到次数趋势</span>
                </template>
                <div ref="lateTrendChartRef" class="chart-container"></div>
              </el-card>
            </el-col>
          </el-row>
          <el-card class="data-card">
            <template #header>
              <span>原因明细</span>
            </template>
            <el-table :data="lateReasonsData" stripe size="small">
              <el-table-column prop="reason" label="迟到原因" />
              <el-table-column prop="count" label="次数" width="120" />
              <el-table-column prop="percentage" label="占比" width="120">
                <template #default="{ row }">
                  {{ row.percentage }}%
                </template>
              </el-table-column>
              <el-table-column label="占比分布">
                <template #default="{ row }">
                  <el-progress :percentage="row.percentage" :stroke-width="12" />
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue'
import * as echarts from 'echarts'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()

const activeTab = ref('workload')

const workloadPeriod = ref('day')
const workloadDateRange = ref([])
const workloadChartRef = ref<HTMLElement>()
let workloadChartInstance: echarts.ECharts | null = null
const workloadRank = ref<any[]>([])

const repurchaseGroupBy = ref('community')
const repurchaseChartRef = ref<HTMLElement>()
const repurchasePieRef = ref<HTMLElement>()
let repurchaseChartInstance: echarts.ECharts | null = null
let repurchasePieInstance: echarts.ECharts | null = null
const repurchaseData = ref<any[]>([])

const lateDateRange = ref([])
const lateReasonsChartRef = ref<HTMLElement>()
const lateTrendChartRef = ref<HTMLElement>()
let lateReasonsChartInstance: echarts.ECharts | null = null
let lateTrendChartInstance: echarts.ECharts | null = null
const lateReasonsData = ref<any[]>([])

function loadWorkloadChart() {
  nextTick(() => {
    if (!workloadChartRef.value) return
    
    if (!workloadChartInstance) {
      workloadChartInstance = echarts.init(workloadChartRef.value)
    }

    let xData: string[] = []
    let legendData: string[] = []
    let seriesData: any[] = []

    if (workloadPeriod.value === 'day') {
      xData = ['1/10', '1/11', '1/12', '1/13', '1/14', '1/15', '1/16']
      legendData = ['李师傅', '王师傅', '张师傅', '刘师傅']
      seriesData = [
        { name: '李师傅', type: 'line', smooth: true, data: [3, 5, 2, 4, 6, 3, 5] },
        { name: '王师傅', type: 'line', smooth: true, data: [4, 3, 5, 2, 4, 6, 3] },
        { name: '张师傅', type: 'line', smooth: true, data: [2, 4, 3, 5, 3, 4, 6] },
        { name: '刘师傅', type: 'line', smooth: true, data: [5, 2, 4, 3, 5, 2, 4] }
      ]
    } else if (workloadPeriod.value === 'week') {
      xData = ['第1周', '第2周', '第3周', '第4周']
      legendData = ['李师傅', '王师傅', '张师傅', '刘师傅']
      seriesData = [
        { name: '李师傅', type: 'line', smooth: true, data: [25, 28, 22, 30] },
        { name: '王师傅', type: 'line', smooth: true, data: [22, 26, 30, 25] },
        { name: '张师傅', type: 'line', smooth: true, data: [28, 24, 26, 28] },
        { name: '刘师傅', type: 'line', smooth: true, data: [20, 22, 24, 26] }
      ]
    } else {
      xData = ['1月', '2月', '3月', '4月', '5月', '6月']
      legendData = ['李师傅', '王师傅', '张师傅', '刘师傅']
      seriesData = [
        { name: '李师傅', type: 'line', smooth: true, data: [100, 110, 105, 120, 115, 125] },
        { name: '王师傅', type: 'line', smooth: true, data: [90, 100, 110, 105, 115, 110] },
        { name: '张师傅', type: 'line', smooth: true, data: [110, 105, 100, 115, 110, 120] },
        { name: '刘师傅', type: 'line', smooth: true, data: [85, 90, 95, 100, 105, 110] }
      ]
    }

    const option = {
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        data: legendData
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: xData
      },
      yAxis: {
        type: 'value',
        name: '订单数'
      },
      series: seriesData
    }

    workloadChartInstance.setOption(option)

    workloadRank.value = [
      { name: '李师傅', orderCount: 128, completionRate: 95, avgRating: 4.9 },
      { name: '王师傅', orderCount: 115, completionRate: 92, avgRating: 4.8 },
      { name: '张师傅', orderCount: 102, completionRate: 90, avgRating: 4.7 },
      { name: '刘师傅', orderCount: 95, completionRate: 88, avgRating: 4.6 },
      { name: '陈师傅', orderCount: 88, completionRate: 85, avgRating: 4.5 }
    ]
  })
}

function loadRepurchaseChart() {
  nextTick(() => {
    if (!repurchaseChartRef.value) return
    
    if (!repurchaseChartInstance) {
      repurchaseChartInstance = echarts.init(repurchaseChartRef.value)
    }

    let xData: string[] = []
    let yData: number[] = []

    if (repurchaseGroupBy.value === 'community') {
      xData = ['阳光花园', '幸福小区', '东方明珠', '金桂苑', '银桂苑']
      yData = [35.2, 28.6, 42.1, 31.8, 26.4]
    } else if (repurchaseGroupBy.value === 'date') {
      xData = ['1月', '2月', '3月', '4月', '5月', '6月']
      yData = [25.0, 28.5, 30.2, 32.8, 35.1, 38.5]
    } else {
      xData = ['微信', '支付宝', '小程序', 'APP', '电话']
      yData = [38.2, 32.5, 42.8, 28.6, 15.2]
    }

    const option = {
      tooltip: {
        trigger: 'axis',
        formatter: '{b}: {c}%'
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: xData
      },
      yAxis: {
        type: 'value',
        name: '复购率(%)',
        max: 50
      },
      series: [
        {
          name: '复购率',
          type: 'bar',
          data: yData,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#409eff' },
              { offset: 1, color: '#66b1ff' }
            ])
          },
          label: {
            show: true,
            position: 'top',
            formatter: '{c}%'
          }
        }
      ]
    }

    repurchaseChartInstance.setOption(option)

    if (repurchasePieRef.value) {
      if (!repurchasePieInstance) {
        repurchasePieInstance = echarts.init(repurchasePieRef.value)
      }

      const pieData = [
        { value: 35, name: '1次复购' },
        { value: 25, name: '2次复购' },
        { value: 20, name: '3次复购' },
        { value: 12, name: '4次复购' },
        { value: 8, name: '5次以上' }
      ]

      const pieOption = {
        tooltip: {
          trigger: 'item'
        },
        legend: {
          orient: 'vertical',
          right: 10,
          top: 'center'
        },
        series: [
          {
            name: '复购次数',
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['35%', '50%'],
            avoidLabelOverlap: false,
            label: {
              show: false
            },
            emphasis: {
              label: {
                show: true,
                fontSize: 14,
                fontWeight: 'bold'
              }
            },
            data: pieData
          }
        ]
      }

      repurchasePieInstance.setOption(pieOption)
    }

    repurchaseData.value = xData.map((name, i) => ({
      name,
      totalUsers: 1000 + i * 200,
      repeatUsers: Math.floor((1000 + i * 200) * yData[i] / 100),
      avgOrderCount: (2 + i * 0.3).toFixed(1)
    }))
  })
}

function loadLateReasonsChart() {
  nextTick(() => {
    if (!lateReasonsChartRef.value) return
    
    if (!lateReasonsChartInstance) {
      lateReasonsChartInstance = echarts.init(lateReasonsChartRef.value)
    }

    const reasons = ['交通拥堵', '地址难找', '天气原因', '上一单超时', '临时有事', '其他']
    const counts = [45, 32, 28, 35, 18, 12]
    const total = counts.reduce((a, b) => a + b, 0)

    const option = {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}次 ({d}%)'
      },
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'center'
      },
      series: [
        {
          name: '迟到原因',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['35%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: false
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 16,
              fontWeight: 'bold'
            }
          },
          data: reasons.map((reason, i) => ({
            value: counts[i],
            name: reason
          }))
        }
      ]
    }

    lateReasonsChartInstance.setOption(option)

    if (lateTrendChartRef.value) {
      if (!lateTrendChartInstance) {
        lateTrendChartInstance = echarts.init(lateTrendChartRef.value)
      }

      const trendOption = {
        tooltip: {
          trigger: 'axis'
        },
        legend: {
          data: ['迟到次数']
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: ['1/10', '1/11', '1/12', '1/13', '1/14', '1/15', '1/16']
        },
        yAxis: {
          type: 'value',
          name: '次数'
        },
        series: [
          {
            name: '迟到次数',
            type: 'line',
            smooth: true,
            data: [8, 12, 6, 15, 10, 7, 9],
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(245, 108, 108, 0.3)' },
                { offset: 1, color: 'rgba(245, 108, 108, 0.05)' }
              ])
            },
            itemStyle: {
              color: '#f56c6c'
            }
          }
        ]
      }

      lateTrendChartInstance.setOption(trendOption)
    }

    lateReasonsData.value = reasons.map((reason, i) => ({
      reason,
      count: counts[i],
      percentage: ((counts[i] / total) * 100).toFixed(1)
    }))
  })
}

onMounted(() => {
  loadWorkloadChart()
})
</script>

<style lang="scss" scoped>
.statistics-page {
  .page-header {
    margin-bottom: 16px;

    h2 {
      margin: 0 0 4px 0;
      font-size: 20px;
      color: #303133;
    }

    .subtitle {
      margin: 0;
      color: #909399;
      font-size: 14px;
    }
  }

  .stats-tabs {
    :deep(.el-tabs__header) {
      margin-bottom: 20px;
    }

    :deep(.el-tabs__item) {
      font-size: 15px;
    }
  }

  .tab-content {
    .chart-toolbar {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
    }

    .chart-card {
      margin-bottom: 20px;

      .chart-container {
        height: 350px;
      }
    }

    .data-card {
      .rank {
        display: inline-block;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        text-align: center;
        line-height: 22px;
        font-size: 12px;
        font-weight: 600;
        background: #f5f7fa;
        color: #909399;

        &.rank-1 {
          background: #fef0f0;
          color: #f56c6c;
        }

        &.rank-2 {
          background: #fdf6ec;
          color: #e6a23c;
        }

        &.rank-3 {
          background: #ecf5ff;
          color: #409eff;
        }
      }

      .rating-text {
        margin-left: 8px;
        color: #f56c6c;
        font-weight: 600;
        font-size: 12px;
      }

      .highlight {
        color: #f56c6c;
        font-weight: 600;
      }
    }
  }
}
</style>
