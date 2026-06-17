<template>
  <div class="dashboard">
    <div class="page-card">
      <div class="page-title">
        <el-icon :size="20" color="#409EFF"><DataAnalysis /></el-icon>
        采纳率统计看板
      </div>
      <el-form :inline="true" class="search-form">
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="主管">
          <el-select v-model="query.supervisorId" placeholder="全部" clearable style="width: 150px">
            <el-option
              v-for="s in supervisorList"
              :key="s.id"
              :label="s.realName"
              :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="销售">
          <el-select v-model="query.agentId" placeholder="全部" clearable style="width: 150px">
            <el-option
              v-for="a in agentList"
              :key="a.id"
              :label="a.realName"
              :value="a.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="风险原因">
          <el-input v-model="query.riskHitReason" placeholder="请输入" clearable style="width: 180px" />
        </el-form-item>
        <el-form-item label="维度">
          <el-radio-group v-model="groupBy">
            <el-radio-button value="date">按日期</el-radio-button>
            <el-radio-button value="supervisor">按主管</el-radio-button>
            <el-radio-button value="agent">按销售</el-radio-button>
            <el-radio-button value="risk">按风险原因</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <el-row :gutter="16" style="margin-bottom: 24px">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-value" style="color: #409EFF">{{ summary.totalGenerated || 0 }}</div>
            <div class="stat-label">AI生成总数</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-value" style="color: #67C23A">{{ summary.adoptedCount || 0 }}</div>
            <div class="stat-label">采纳数量</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-value" style="color: #E6A23C">{{ formatPercent(summary.partialAdoptionRate) }}</div>
            <div class="stat-label">部分采纳率</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-value" style="color: #F56C6C">{{ formatPercent(summary.adoptionRate) }}</div>
            <div class="stat-label">总采纳率</div>
          </div>
        </el-col>
      </el-row>

      <el-tabs v-model="activeTab">
        <el-tab-pane label="趋势图" name="chart">
          <div ref="chartRef" style="height: 360px; width: 100%"></div>
        </el-tab-pane>
        <el-tab-pane label="明细数据" name="table">
          <el-table :data="tableData" border stripe style="width: 100%">
            <el-table-column prop="statDate" label="日期" width="120" />
            <el-table-column prop="supervisorName" label="主管" width="100" />
            <el-table-column prop="agentName" label="销售" width="100" />
            <el-table-column prop="riskHitReason" label="风险命中原因" min-width="160" />
            <el-table-column prop="totalGenerated" label="生成数" width="90" align="center" />
            <el-table-column prop="adoptedCount" label="采纳数" width="90" align="center" />
            <el-table-column prop="partialAdoptedCount" label="部分采纳" width="90" align="center" />
            <el-table-column prop="rejectedCount" label="拒绝数" width="90" align="center" />
            <el-table-column label="采纳率" width="110" align="center">
              <template #default="{ row }">
                <el-tag :type="getRateTagType(row.adoptionRate)">
                  {{ formatPercent(row.adoptionRate) }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, watch } from 'vue'
import * as echarts from 'echarts'
import { adoptionApi, userApi } from '@/api'
import dayjs from 'dayjs'

const dateRange = ref([
  dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
  dayjs().format('YYYY-MM-DD')
])
const query = reactive({
  supervisorId: null,
  agentId: null,
  riskHitReason: ''
})
const groupBy = ref('date')
const activeTab = ref('chart')
const summary = ref({})
const tableData = ref([])
const supervisorList = ref([])
const agentList = ref([])
const chartRef = ref(null)
let chartInstance = null

onMounted(async () => {
  await loadUsers()
  loadData()
})

async function loadUsers() {
  try {
    const [sRes, aRes] = await Promise.all([
      userApi.getUsersByRole('SUPERVISOR'),
      userApi.getUsersByRole('AGENT')
    ])
    if (sRes.success) supervisorList.value = sRes.data
    if (aRes.success) agentList.value = aRes.data
  } catch (e) {}
}

async function loadData() {
  const params = {
    startDate: dateRange.value?.[0],
    endDate: dateRange.value?.[1],
    supervisorId: query.supervisorId,
    agentId: query.agentId,
    riskHitReason: query.riskHitReason,
    groupBy: groupBy.value
  }
  try {
    const [sumRes, dataRes] = await Promise.all([
      adoptionApi.getSummary(params),
      adoptionApi.queryStatistics(params)
    ])
    if (sumRes.success) summary.value = sumRes.data
    if (dataRes.success) {
      tableData.value = dataRes.data
      await nextTick()
      renderChart()
    }
  } catch (e) {}
}

function renderChart() {
  if (!chartRef.value) return
  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value)
  }
  const data = tableData.value || []
  let xData = []
  let seriesData = []
  let title = ''

  if (groupBy.value === 'date') {
    xData = data.map(d => d.statDate).sort()
    const dateMap = {}
    data.forEach(d => { dateMap[d.statDate] = d })
    seriesData = xData.map(x => parseFloat((dateMap[x]?.adoptionRate || 0) * 100).toFixed(2))
    title = '采纳率趋势（按日期）'
  } else if (groupBy.value === 'supervisor') {
    xData = data.map(d => d.supervisorName || '未分配')
    seriesData = data.map(d => parseFloat((d.adoptionRate || 0) * 100).toFixed(2))
    title = '各主管采纳率'
  } else if (groupBy.value === 'agent') {
    xData = data.map(d => d.agentName || '未分配')
    seriesData = data.map(d => parseFloat((d.adoptionRate || 0) * 100).toFixed(2))
    title = '各销售采纳率'
  } else {
    xData = data.map(d => d.riskHitReason || '无')
    seriesData = data.map(d => parseFloat((d.adoptionRate || 0) * 100).toFixed(2))
    title = '风险原因采纳率分布'
  }

  chartInstance.setOption({
    title: { text: title, left: 'center', textStyle: { fontSize: 14 } },
    tooltip: {
      trigger: 'axis',
      formatter: '{b}<br/>采纳率: {c}%'
    },
    grid: { left: 50, right: 30, top: 50, bottom: 60 },
    xAxis: {
      type: 'category',
      data: xData,
      axisLabel: { rotate: groupBy.value === 'risk' ? 30 : 0, interval: 0 }
    },
    yAxis: {
      type: 'value',
      axisLabel: { formatter: '{value}%' },
      max: 100
    },
    series: [{
      type: 'bar',
      data: seriesData,
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#409EFF' },
          { offset: 1, color: '#79bbff' }
        ])
      },
      label: {
        show: true,
        position: 'top',
        formatter: '{c}%'
      }
    }]
  })
}

function resetQuery() {
  query.supervisorId = null
  query.agentId = null
  query.riskHitReason = ''
  dateRange.value = [
    dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
    dayjs().format('YYYY-MM-DD')
  ]
  loadData()
}

function formatPercent(val) {
  if (val == null) return '0.00%'
  return (parseFloat(val) * 100).toFixed(2) + '%'
}

function getRateTagType(rate) {
  const r = parseFloat(rate || 0)
  if (r >= 0.8) return 'success'
  if (r >= 0.5) return 'warning'
  return 'danger'
}

watch(activeTab, async (val) => {
  if (val === 'chart') {
    await nextTick()
    renderChart()
  }
})
</script>

<style lang="scss" scoped>
.dashboard {
  .stat-card {
    .stat-value {
      font-size: 32px;
    }
  }
}
</style>
