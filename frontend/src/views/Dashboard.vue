<template>
  <div class="page-container">
    <el-row :gutter="20" class="stat-cards">
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon primary">
            <el-icon><Document /></el-icon>
          </div>
          <div class="stat-content">
            <div class="label">总工单数</div>
            <div class="value">{{ stats.totalOrders }}</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon warning">
            <el-icon><Loading /></el-icon>
          </div>
          <div class="stat-content">
            <div class="label">进行中</div>
            <div class="value">{{ stats.inProduction }}</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon success">
            <el-icon><CircleCheck /></el-icon>
          </div>
          <div class="stat-content">
            <div class="label">已完成</div>
            <div class="value">{{ stats.completed }}</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon danger">
            <el-icon><Warning /></el-icon>
          </div>
          <div class="stat-content">
            <div class="label">延期风险</div>
            <div class="value">{{ stats.delayed }}</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="16">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>产量趋势（近7天）</span>
            </div>
          </template>
          <div ref="productionChart" class="chart"></div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>工单状态分布</span>
            </div>
          </template>
          <div ref="statusChart" class="chart"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card class="list-card">
          <template #header>
            <div class="card-header">
              <span>高风险工单</span>
              <el-button type="primary" text @click="$router.push('/risks')">查看全部</el-button>
            </div>
          </template>
          <el-table :data="highRiskOrders" size="small">
            <el-table-column prop="orderNo" label="工单号" width="120" />
            <el-table-column prop="productName" label="产品名称" min-width="120" />
            <el-table-column label="风险等级" width="100">
              <template #default="{ row }">
                <span :class="`risk-${row.riskLogs?.[0]?.riskLevel || 'medium'}`">
                  {{ riskLevelText(row.riskLogs?.[0]?.riskLevel) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="交期" width="120">
              <template #default="{ row }">
                <span :class="{ 'text-danger': isDelayed(row) }">
                  {{ formatDate(row.deliveryDate) }}
                </span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="list-card">
          <template #header>
            <div class="card-header">
              <span>返工原因统计</span>
              <el-button type="primary" text @click="$router.push('/reworks')">查看全部</el-button>
            </div>
          </template>
          <el-table :data="reworkStats" size="small">
            <el-table-column prop="reason" label="原因" width="120">
              <template #default="{ row }">{{ reasonText(row.reason) }}</template>
            </el-table-column>
            <el-table-column prop="quantity" label="返工数量" />
            <el-table-column label="占比">
              <template #default="{ row }">
                {{ totalReworkQty > 0 ? ((row.quantity / totalReworkQty) * 100).toFixed(1) + '%' : '0%' }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import { workOrderApi, productionApi, reworkApi, riskApi } from '@/api/modules'
import dayjs from 'dayjs'
import * as echarts from 'echarts'

const productionChart = ref(null)
const statusChart = ref(null)

const stats = ref({
  totalOrders: 0,
  inProduction: 0,
  completed: 0,
  delayed: 0,
})

const highRiskOrders = ref([])
const reworkStats = ref([])

const totalReworkQty = computed(() => {
  return reworkStats.value.reduce((sum, item) => sum + item.quantity, 0)
})

function formatDate(date) {
  return date ? dayjs(date).format('YYYY-MM-DD') : '-'
}

function isDelayed(row) {
  if (!row.deliveryDate) return false
  return dayjs(row.deliveryDate).isBefore(dayjs(), 'day') && row.status !== 'completed'
}

function riskLevelText(level) {
  const map = { low: '低', medium: '中', high: '高', critical: '紧急' }
  return map[level] || '中'
}

function reasonText(reason) {
  const map = {
    quality_issue: '质量问题',
    material_defect: '物料缺陷',
    process_error: '工艺错误',
    design_change: '设计变更',
    customer_request: '客户要求',
    other: '其他',
  }
  return map[reason] || reason
}

function initProductionChart(data) {
  if (!productionChart.value) return
  const chart = echarts.init(productionChart.value)

  const option = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['产量', '不良数'] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.dailyData.map((d) => dayjs(d.period).format('MM-DD')),
    },
    yAxis: [
      { type: 'value', name: '数量' },
      { type: 'value', name: '不良率(%)', min: 0, max: 10 },
    ],
    series: [
      {
        name: '产量',
        type: 'line',
        smooth: true,
        data: data.dailyData.map((d) => d.totalOutput),
        areaStyle: { opacity: 0.3 },
      },
      {
        name: '不良数',
        type: 'line',
        smooth: true,
        data: data.dailyData.map((d) => d.totalDefect),
      },
    ],
  }

  chart.setOption(option)
}

function initStatusChart() {
  if (!statusChart.value) return
  const chart = echarts.init(statusChart.value)

  const statusData = [
    { value: stats.value.inProduction, name: '进行中' },
    { value: stats.value.completed, name: '已完成' },
    { value: stats.value.delayed, name: '延期' },
    { value: stats.value.totalOrders - stats.value.inProduction - stats.value.completed - stats.value.delayed, name: '待排产' },
  ].filter((item) => item.value > 0)

  const option = {
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', left: 'left' },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 14, fontWeight: 'bold' },
        },
        labelLine: { show: false },
        data: statusData,
      },
    ],
  }

  chart.setOption(option)
}

async function loadData() {
  try {
    const [ordersRes, prodRes, riskRes, reworkRes] = await Promise.all([
      workOrderApi.list({ perPage: 100 }),
      productionApi.summary(),
      riskApi.highRiskOrders(),
      reworkApi.stats(),
    ])

    const orders = ordersRes.data.data
    stats.value = {
      totalOrders: ordersRes.data.total || orders.length,
      inProduction: orders.filter((o) => o.status === 'in_production' || o.status === 'scheduled').length,
      completed: orders.filter((o) => o.status === 'completed').length,
      delayed: orders.filter((o) => o.status === 'delayed').length,
    }

    highRiskOrders.value = riskRes.data?.slice(0, 5) || []

    if (reworkRes.data?.reasonStats) {
      reworkStats.value = Object.entries(reworkRes.data.reasonStats).map(([reason, quantity]) => ({
        reason,
        quantity,
      }))
    }

    await nextTick()
    if (prodRes.data?.dailyData) {
      initProductionChart(prodRes.data)
    }
    initStatusChart()
  } catch (e) {
    console.error('加载数据失败', e)
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.stat-cards {
  margin-bottom: 10px;
}

.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: #fff;
}

.stat-icon.primary { background: linear-gradient(135deg, #667eea, #764ba2); }
.stat-icon.warning { background: linear-gradient(135deg, #f6d365, #fda085); }
.stat-icon.success { background: linear-gradient(135deg, #a8edea, #fed6e3); color: #67c23a; }
.stat-icon.danger { background: linear-gradient(135deg, #ff9a9e, #fecfef); color: #f56c6c; }

.stat-content .label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 4px;
}

.stat-content .value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
}

.chart-card {
  height: 350px;
}

.chart {
  width: 100%;
  height: 280px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.list-card {
  height: 320px;
}

.text-danger {
  color: #f56c6c;
}

.risk-critical { color: #ff0000; font-weight: bold; }
.risk-high { color: #f56c6c; }
.risk-medium { color: #e6a23c; }
.risk-low { color: #67c23a; }
</style>
