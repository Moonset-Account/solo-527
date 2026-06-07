<template>
  <div class="app-container">
    <el-header class="app-header">
      <div class="header-left">
        <el-icon class="logo-icon"><Monitor /></el-icon>
        <h1>工厂设备停机原因看板</h1>
      </div>
      <div class="header-right">
        <div class="update-time" v-if="updateTime">
          <el-icon><Clock /></el-icon>
          <span>数据更新: {{ formatTime(updateTime) }}</span>
        </div>
        <el-button type="primary" @click="refreshData" :loading="refreshing">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
        <el-dropdown @command="handleExport">
          <el-button type="success">
            <el-icon><Download /></el-icon>
            导出
            <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="csv-workorders">导出工单数据 (CSV)</el-dropdown-item>
              <el-dropdown-item command="csv-summary">导出汇总数据 (CSV)</el-dropdown-item>
              <el-dropdown-item command="screenshot">导出截图</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-header>
    
    <el-main class="app-main">
      <router-view />
    </el-main>
  </div>
</template>

<script setup>
import { ref, onMounted, provide } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

const router = useRouter()
const updateTime = ref(null)
const refreshing = ref(false)

const filters = ref({
  startDate: dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
  endDate: dayjs().format('YYYY-MM-DD'),
  lineId: null,
  shift: null,
  type: null
})

provide('filters', filters)

const formatTime = (time) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}

const refreshData = async () => {
  refreshing.value = true
  try {
    const res = await fetch('/api/refresh', { method: 'POST' })
    const data = await res.json()
    updateTime.value = data.updateTime
    ElMessage.success('数据刷新成功')
    router.go(0)
  } catch (e) {
    ElMessage.error('刷新失败')
  } finally {
    refreshing.value = false
  }
}

const handleExport = (cmd) => {
  const query = new URLSearchParams()
  if (filters.value.startDate) query.append('startDate', filters.value.startDate)
  if (filters.value.endDate) query.append('endDate', filters.value.endDate)
  if (filters.value.lineId) query.append('lineId', filters.value.lineId)
  if (filters.value.type) query.append('type', filters.value.type)
  
  if (cmd === 'csv-workorders') {
    window.open(`/api/export/csv/workorders?${query.toString()}`, '_blank')
  } else if (cmd === 'csv-summary') {
    window.open(`/api/export/csv/downtime-summary?${query.toString()}`, '_blank')
  } else if (cmd === 'screenshot') {
    ElMessage.info('截图功能请使用浏览器快捷键 Ctrl+Shift+S 或 Cmd+Shift+4')
  }
}

const loadUpdateTime = async () => {
  try {
    const res = await fetch('/api/kpi')
    const data = await res.json()
    updateTime.value = data.updateTime
  } catch (e) {}
}

onMounted(() => {
  loadUpdateTime()
})
</script>

<style scoped>
.app-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f0f2f5;
}

.app-header {
  background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  font-size: 28px;
}

.header-left h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.update-time {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  opacity: 0.9;
  margin-right: 12px;
}

.app-main {
  flex: 1;
  padding: 16px;
  overflow: auto;
}
</style>
