<template>
  <div class="dashboard">
    <header class="dashboard-header">
      <div class="header-left">
        <el-icon class="logo-icon"><Umbrella /></el-icon>
        <h1>水上运动营报名与救援记录看板</h1>
      </div>
      <div class="header-right">
        <div class="user-info">
          <el-avatar :size="32" class="user-avatar">
            <el-icon><User /></el-icon>
          </el-avatar>
          <span class="user-name">{{ currentUser.name }}</span>
          <el-tag size="small" type="info" class="user-role">{{ currentUser.roleName }}</el-tag>
        </div>
        <el-button
          type="primary"
          size="small"
          :icon="Download"
          :disabled="!canExportData"
          @click="handleExport"
          :loading="exporting"
        >
          导出数据
        </el-button>
      </div>
    </header>

    <main class="dashboard-main">
      <FilterBar @filter-change="handleFilterChange" />

      <div class="stats-overview">
        <div class="stat-card primary">
          <div class="stat-icon">
            <el-icon><User /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ overviewStats.totalRegister }}</div>
            <div class="stat-label">总报名人数</div>
          </div>
        </div>
        <div class="stat-card success">
          <div class="stat-icon">
            <el-icon><CircleCheck /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ overviewStats.totalCheckin }}</div>
            <div class="stat-label">签到人数</div>
          </div>
        </div>
        <div class="stat-card warning">
          <div class="stat-icon">
            <el-icon><Close /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ overviewStats.totalCancel }}</div>
            <div class="stat-label">取消人数</div>
          </div>
        </div>
        <div class="stat-card danger">
          <div class="stat-icon">
            <el-icon><Warning /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ overviewStats.totalIncidents }}</div>
            <div class="stat-label">救援事件</div>
          </div>
        </div>
      </div>

      <div class="dashboard-grid">
        <div class="grid-item large">
          <FunnelChart
            :funnel-data="funnelData.funnelData"
            :cancel-by-reason="funnelData.cancelByReason"
            :total-cancelled="funnelData.totalCancelled"
            :cancel-rate="funnelData.cancelRate"
          />
        </div>
        
        <div class="grid-item">
          <AgeGroupStats
            :by-age-group="ageStats.byAgeGroup"
            :minor-aggregated="ageStats.minorAggregated"
          />
        </div>

        <div class="grid-item">
          <IncidentTimeline
            :timeline="incidentData.timeline"
            :stats="incidentData.stats"
          />
        </div>

        <div class="grid-item large">
          <EquipmentHeatmap
            :matrix="equipmentData.matrix"
          />
        </div>
      </div>
    </main>

    <el-loading
      :fullscreen="true"
      :text="'数据加载中...'"
      v-if="loading"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { Download, Umbrella, User, CircleCheck, Close, Warning } from '@element-plus/icons-vue'
import FilterBar from '@/components/FilterBar.vue'
import FunnelChart from '@/components/FunnelChart.vue'
import IncidentTimeline from '@/components/IncidentTimeline.vue'
import EquipmentHeatmap from '@/components/EquipmentHeatmap.vue'
import AgeGroupStats from '@/components/AgeGroupStats.vue'
import { useDashboardStore } from '@/store/useDashboardStore'
import { getFunnelData, getIncidentTimeline, getEquipmentHeatmap, getAgeGroupStats, getExportData } from '@/data/queryService'
import { exportToExcel } from '@/utils/exportUtils'
import { USER_ROLES } from '@/data/constants'

const { filters, canExportData, setLoading } = useDashboardStore()

const loading = ref(false)
const exporting = ref(false)

const currentUser = computed(() => {
  const store = useDashboardStore()
  return {
    name: store.state.currentUser.name,
    roleName: USER_ROLES[store.state.currentUser.role]?.name || store.state.currentUser.role
  }
})

const funnelData = reactive({
  funnelData: [],
  cancelByReason: [],
  totalCancelled: 0,
  cancelRate: '0'
})

const incidentData = reactive({
  timeline: [],
  stats: {
    total: 0,
    minor: 0,
    medical: 0,
    suspend: 0,
    withPhotos: 0,
    minorInvolved: 0,
    adultInvolved: 0
  }
})

const equipmentData = reactive({
  matrix: []
})

const ageStats = reactive({
  byAgeGroup: [],
  minorAggregated: {
    registerCount: 0,
    confirmCount: 0,
    checkinCount: 0,
    completeCount: 0,
    cancelCount: 0,
    groupCount: 0
  }
})

const overviewStats = computed(() => {
  const totalRegister = funnelData.funnelData[0]?.count || 0
  const totalCheckin = funnelData.funnelData[2]?.count || 0
  const totalCancel = funnelData.totalCancelled
  const totalIncidents = incidentData.stats.total
  return {
    totalRegister,
    totalCheckin,
    totalCancel,
    totalIncidents
  }
})

const loadAllData = async () => {
  loading.value = true
  setLoading(true)
  
  try {
    const [funnel, incidents, equipment, ages] = await Promise.all([
      getFunnelData(filters),
      getIncidentTimeline(filters),
      getEquipmentHeatmap(filters),
      getAgeGroupStats(filters)
    ])
    
    Object.assign(funnelData, funnel)
    Object.assign(incidentData, incidents)
    Object.assign(equipmentData, equipment)
    Object.assign(ageStats, ages)
  } catch (error) {
    console.error('Failed to load data:', error)
  } finally {
    loading.value = false
    setLoading(false)
  }
}

const handleFilterChange = () => {
  loadAllData()
}

const handleExport = async () => {
  if (!canExportData()) {
    return
  }
  
  exporting.value = true
  try {
    const exportData = await getExportData(filters)
    await exportToExcel(exportData)
  } catch (error) {
    console.error('Export failed:', error)
  } finally {
    exporting.value = false
  }
}

onMounted(() => {
  loadAllData()
})

watch(
  () => ({ ...filters }),
  () => {
    loadAllData()
  },
  { deep: true }
)
</script>

<style scoped lang="scss">
.dashboard {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f0f2f5;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  position: sticky;
  top: 0;
  z-index: 100;

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;

    .logo-icon {
      font-size: 28px;
      color: #1890ff;
    }

    h1 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: #303133;
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 10px;

    .user-avatar {
      background: #e6f7ff;
      color: #1890ff;
    }

    .user-name {
      font-size: 14px;
      color: #303133;
    }

    .user-role {
      margin-left: 4px;
    }
  }
}

.dashboard-main {
  flex: 1;
  padding: 20px 24px;
}

.stats-overview {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    color: #fff;
  }

  &.primary .stat-icon {
    background: linear-gradient(135deg, #1890ff, #69c0ff);
  }

  &.success .stat-icon {
    background: linear-gradient(135deg, #52c41a, #95de64);
  }

  &.warning .stat-icon {
    background: linear-gradient(135deg, #faad14, #ffd666);
  }

  &.danger .stat-icon {
    background: linear-gradient(135deg, #f5222d, #ff7875);
  }

  .stat-info {
    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: #303133;
      line-height: 1.2;
    }

    .stat-label {
      font-size: 13px;
      color: #909399;
      margin-top: 4px;
    }
  }
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;

  .grid-item {
    min-height: 400px;

    &.large {
      grid-column: span 1;
    }
  }
}

@media (max-width: 1400px) {
  .dashboard-grid {
    grid-template-columns: 1fr;

    .grid-item {
      &.large {
        grid-column: span 1;
      }
    }
  }
}

@media (max-width: 900px) {
  .stats-overview {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
