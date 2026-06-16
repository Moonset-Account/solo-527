<template>
  <div class="inventory-report">
    <el-card>
      <div class="search-form">
        <el-form :inline="true" :model="searchForm">
          <el-form-item label="开始日期">
            <el-date-picker
              v-model="searchForm.startDate"
              type="date"
              placeholder="选择开始日期"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>
          <el-form-item label="结束日期">
            <el-date-picker
              v-model="searchForm.endDate"
              type="date"
              placeholder="选择结束日期"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>
          <el-form-item label="报表类型">
            <el-select v-model="searchForm.reportType" placeholder="请选择类型" clearable>
              <el-option label="场地占用" value="court" />
              <el-option label="课程占用" value="course" />
              <el-option label="设备库存" value="equipment" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button @click="handleReset">重置</el-button>
            <el-button type="success" @click="handleGenerate">生成报表</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-table :data="tableData" border stripe>
        <el-table-column prop="reportDate" label="报表日期" width="120" />
        <el-table-column prop="reportType" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.reportType)">{{ getTypeText(row.reportType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="bizName" label="名称" width="150" />
        <el-table-column prop="totalCapacity" label="总容量" width="100" />
        <el-table-column prop="usedCapacity" label="已使用" width="100" />
        <el-table-column prop="occupancyRate" label="占用率" width="120">
          <template #default="{ row }">
            <el-progress :percentage="row.occupancyRate" :status="getProgressStatus(row.occupancyRate)" />
          </template>
        </el-table-column>
        <el-table-column prop="details" label="详情" show-overflow-tooltip />
      </el-table>

      <el-pagination
        class="pagination"
        v-model:current-page="pagination.pageNum"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="fetchData"
        @current-change="fetchData"
      />
    </el-card>

    <el-card class="chart-card">
      <template #header>
        <span>库存占用趋势</span>
      </template>
      <div ref="chartRef" class="chart-container"></div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import { getInventoryReport, generateInventoryReport } from '@/api/report'

const chartRef = ref(null)
let chartInstance = null

const searchForm = reactive({
  startDate: getDefaultStartDate(),
  endDate: getDefaultEndDate(),
  reportType: ''
})

const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0
})

const tableData = ref([])

function getDefaultStartDate() {
  const date = new Date()
  date.setDate(date.getDate() - 30)
  return formatDate(date)
}

function getDefaultEndDate() {
  const date = new Date()
  return formatDate(date)
}

function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getTypeText = (type) => {
  const map = { court: '场地占用', course: '课程占用', equipment: '设备库存' }
  return map[type] || type
}

const getTypeTagType = (type) => {
  const map = { court: 'primary', course: 'success', equipment: 'warning' }
  return map[type] || 'info'
}

const getProgressStatus = (rate) => {
  if (rate >= 90) return 'exception'
  if (rate >= 70) return 'warning'
  return 'success'
}

const initChart = () => {
  if (!chartRef.value) return
  chartInstance = echarts.init(chartRef.value)
  updateChart()
}

const updateChart = () => {
  if (!chartInstance || tableData.value.length === 0) return

  const dateMap = {}
  tableData.value.forEach(item => {
    if (!dateMap[item.reportDate]) {
      dateMap[item.reportDate] = []
    }
    dateMap[item.reportDate].push(item)
  })

  const dates = Object.keys(dateMap).sort()
  const avgRates = dates.map(date => {
    const items = dateMap[date]
    const total = items.reduce((sum, item) => sum + (item.occupancyRate || 0), 0)
    return items.length > 0 ? (total / items.length).toFixed(1) : 0
  })

  const option = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['平均占用率']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates
    },
    yAxis: {
      type: 'value',
      name: '占用率(%)',
      axisLabel: {
        formatter: '{value}%'
      },
      max: 100
    },
    series: [
      {
        name: '平均占用率',
        type: 'line',
        smooth: true,
        data: avgRates,
        itemStyle: {
          color: '#e6a23c'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(230, 162, 60, 0.3)' },
            { offset: 1, color: 'rgba(230, 162, 60, 0.05)' }
          ])
        },
        markLine: {
          data: [
            { type: 'average', name: '平均值' }
          ]
        }
      }
    ]
  }

  chartInstance.setOption(option)
}

const fetchData = async () => {
  try {
    const params = {
      startDate: searchForm.startDate,
      endDate: searchForm.endDate
    }
    if (searchForm.reportType) params.reportType = searchForm.reportType
    const res = await getInventoryReport(params)
    tableData.value = res
    pagination.total = res.length
    nextTick(() => {
      updateChart()
    })
  } catch (error) {
    console.error('获取库存报表失败:', error)
  }
}

const handleSearch = () => {
  if (!searchForm.startDate || !searchForm.endDate) {
    ElMessage.warning('请选择开始和结束日期')
    return
  }
  pagination.pageNum = 1
  fetchData()
}

const handleReset = () => {
  searchForm.startDate = getDefaultStartDate()
  searchForm.endDate = getDefaultEndDate()
  searchForm.reportType = ''
  handleSearch()
}

const handleGenerate = async () => {
  if (!searchForm.endDate) {
    ElMessage.warning('请选择报表日期')
    return
  }
  try {
    await generateInventoryReport(searchForm.endDate)
    ElMessage.success('报表生成成功')
    fetchData()
  } catch (error) {
    console.error('生成报表失败:', error)
  }
}

const handleResize = () => {
  chartInstance && chartInstance.resize()
}

onMounted(() => {
  nextTick(() => {
    initChart()
    fetchData()
  })
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance && chartInstance.dispose()
})
</script>

<style scoped>
.inventory-report {
  padding: 20px;
}

.search-form {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.chart-card {
  margin-top: 20px;
}

.chart-container {
  height: 350px;
  width: 100%;
}
</style>
