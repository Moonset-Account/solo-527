<template>
  <div class="seat-detail">
    <div class="page-header">
      <el-button :icon="ArrowLeft" @click="goBack">返回</el-button>
      <h2 class="page-title">席位详情</h2>
    </div>

    <el-row :gutter="20" v-loading="loading">
      <el-col :span="8">
        <el-card class="info-card">
          <template #header>
            <span>基本信息</span>
          </template>
          <div class="info-item">
            <span class="label">席位编码</span>
            <span class="value">{{ seatInfo.seatCode || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="label">客户名称</span>
            <span class="value">{{ seatInfo.customerName || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="label">套餐</span>
            <span class="value">{{ seatInfo.planName || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="label">状态</span>
            <el-tag :type="getStatusType(seatInfo.status)">{{ getStatusText(seatInfo.status) }}</el-tag>
          </div>
          <div class="info-item">
            <span class="label">是否闲置</span>
            <el-tag :type="seatInfo.isIdle ? 'warning' : 'success'">
              {{ seatInfo.isIdle ? '是' : '否' }}
            </el-tag>
          </div>
          <div class="info-item">
            <span class="label">创建时间</span>
            <span class="value">{{ formatDate(seatInfo.createdAt) }}</span>
          </div>
          <div class="info-item">
            <span class="label">过期时间</span>
            <span class="value">{{ formatDate(seatInfo.expireAt) }}</span>
          </div>
        </el-card>

        <el-card class="usage-card" style="margin-top: 20px">
          <template #header>
            <span>用量概览</span>
          </template>
          <div class="usage-item">
            <span class="label">总调用量</span>
            <span class="value">{{ formatNumber(seatInfo.totalCalls) }}</span>
          </div>
          <div class="usage-item">
            <span class="label">本月调用量</span>
            <span class="value">{{ formatNumber(seatInfo.monthCalls) }}</span>
          </div>
          <div class="usage-item">
            <span class="label">今日调用量</span>
            <span class="value">{{ formatNumber(seatInfo.todayCalls) }}</span>
          </div>
          <div class="usage-item">
            <span class="label">调用限额</span>
            <span class="value">{{ formatNumber(seatInfo.callLimit) }}</span>
          </div>
        </el-card>
      </el-col>

      <el-col :span="16">
        <el-card class="chart-card">
          <template #header>
            <span>调用趋势</span>
          </template>
          <div ref="chartRef" class="chart-container"></div>
        </el-card>

        <el-card class="notes-card" style="margin-top: 20px">
          <template #header>
            <div class="card-header">
              <span>备注/处理记录</span>
            </div>
          </template>
          <el-timeline>
            <el-timeline-item
              v-for="(note, index) in notes"
              :key="note.id || index"
              :timestamp="formatDate(note.createdAt)"
              placement="top"
            >
              <div class="note-item">
                <div class="note-user">{{ note.userName || '系统' }}</div>
                <div class="note-content">{{ note.content }}</div>
              </div>
            </el-timeline-item>
          </el-timeline>
          <div v-if="notes.length === 0" class="empty-text">暂无记录</div>

          <el-form :model="noteForm" class="add-note-form">
            <el-form-item>
              <el-input
                v-model="noteForm.content"
                type="textarea"
                :rows="3"
                placeholder="添加备注..."
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="noteLoading" @click="handleAddNote">
                添加备注
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card class="logs-card" style="margin-top: 20px">
          <template #header>
            <span>操作记录</span>
          </template>
          <el-table :data="operationLogs" style="width: 100%">
            <el-table-column prop="action" label="操作" width="120" />
            <el-table-column prop="operatorName" label="操作人" width="120" />
            <el-table-column prop="detail" label="详情" min-width="200" />
            <el-table-column prop="createdAt" label="时间" width="180">
              <template #default="{ row }">
                {{ formatDate(row.createdAt) }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { getSeatDetail, getSeatNotes, addSeatNote } from '../api/seats'
import { getSeatUsage } from '../api/usage'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const noteLoading = ref(false)
const chartRef = ref(null)
let chartInstance = null

const seatInfo = reactive({})
const notes = ref([])
const operationLogs = ref([])

const noteForm = reactive({
  content: ''
})

const seatId = route.params.id

const loadSeatDetail = async () => {
  try {
    const res = await getSeatDetail(seatId)
    const data = res.data || res
    Object.assign(seatInfo, data)
  } catch (e) {
    console.error(e)
  }
}

const loadNotes = async () => {
  try {
    const res = await getSeatNotes(seatId)
    notes.value = res.data?.list || res.list || res.data || []
  } catch (e) {
    console.error(e)
  }
}

const loadUsage = async () => {
  try {
    const res = await getSeatUsage(seatId)
    const data = res.data || res
    operationLogs.value = data.logs || data.operationLogs || []
    initChart(data.trends || [])
  } catch (e) {
    console.error(e)
    initChart([])
  }
}

const initChart = (trends) => {
  if (!chartRef.value) return
  chartInstance = echarts.init(chartRef.value)
  
  const xData = []
  const yData = []
  
  if (trends && trends.length > 0) {
    trends.forEach(item => {
      xData.push(item.date || item.day)
      yData.push(item.count || item.value || 0)
    })
  } else {
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      xData.push(`${date.getMonth() + 1}/${date.getDate()}`)
      yData.push(Math.floor(Math.random() * 1000) + 100)
    }
  }

  const option = {
    tooltip: {
      trigger: 'axis'
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
      data: xData
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '调用量',
        type: 'line',
        smooth: true,
        data: yData,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(103, 194, 58, 0.3)' },
            { offset: 1, color: 'rgba(103, 194, 58, 0.05)' }
          ])
        },
        lineStyle: {
          color: '#67c23a',
          width: 2
        },
        itemStyle: {
          color: '#67c23a'
        }
      }
    ]
  }
  chartInstance.setOption(option)
}

const handleAddNote = async () => {
  if (!noteForm.content.trim()) {
    ElMessage.warning('请输入备注内容')
    return
  }
  noteLoading.value = true
  try {
    await addSeatNote(seatId, noteForm)
    ElMessage.success('添加成功')
    noteForm.content = ''
    loadNotes()
  } catch (e) {
    console.error(e)
  } finally {
    noteLoading.value = false
  }
}

const goBack = () => {
  router.back()
}

const getStatusType = (status) => {
  const map = {
    active: 'success',
    inactive: 'info',
    expired: 'danger'
  }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = {
    active: '启用',
    inactive: '停用',
    expired: '已过期'
  }
  return map[status] || status || '-'
}

const formatNumber = (num) => {
  if (num === undefined || num === null) return '-'
  return Number(num).toLocaleString()
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

const handleResize = () => {
  chartInstance?.resize()
}

const loadData = async () => {
  loading.value = true
  try {
    await Promise.all([loadSeatDetail(), loadNotes(), nextTick()])
    await loadUsage()
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
})
</script>

<style scoped>
.seat-detail {
  padding: 20px;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}

.page-title {
  margin: 0;
}

.info-item, .usage-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-item:last-child, .usage-item:last-child {
  border-bottom: none;
}

.label {
  color: #909399;
}

.value {
  color: #303133;
  font-weight: 500;
}

.chart-container {
  height: 250px;
}

.note-item {
  padding: 5px 0;
}

.note-user {
  font-weight: 500;
  color: #303133;
}

.note-content {
  font-size: 13px;
  color: #606266;
  margin-top: 5px;
}

.empty-text {
  text-align: center;
  color: #909399;
  padding: 20px 0;
}

.add-note-form {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
