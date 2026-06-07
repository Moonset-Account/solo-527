<template>
  <div class="app">
    <header class="app-header">
      <div class="header-left">
        <div class="logo">
          <span class="logo-icon">⚡</span>
          <span class="logo-text">充电桩故障可视化工作台</span>
        </div>
        <div class="header-breadcrumb" v-if="store.drillDown.level !== 'overview'">
          <span class="breadcrumb-item" @click="store.goBack()">← 返回总览</span>
        </div>
      </div>
      <div class="header-right">
        <div class="status-info" v-if="!store.isLoading">
          <span class="status-dot online"></span>
          <span class="status-text">数据已连接</span>
          <span class="status-time">{{ lastUpdateStr }}</span>
        </div>
        <div class="status-info loading" v-else>
          <span class="status-dot loading"></span>
          <span class="status-text">数据加载中...</span>
        </div>
        <ExportPanel />
      </div>
    </header>
    
    <main class="app-main" id="dashboard-content">
      <div v-if="store.isLoading" class="loading-container">
        <div class="loading-spinner"></div>
        <div class="loading-text">正在加载数据...</div>
      </div>
      
      <template v-else>
        <FilterBar />
        
        <section class="kpi-section">
          <KpiCard
            label="充电桩可用率"
            :value="availabilityStats.rate"
            unit="%"
            :sample-size="availabilityStats.online_total"
            :severity="getAvailSeverity(availabilityStats.rate)"
            :update-time="store.lastUpdateTime"
            :decimals="1"
          />
          <KpiCard
            label="故障总数"
            :value="mergedFaults.length"
            unit="次"
            :sample-size="store.filteredFaults.length"
            :trend="5.2"
            severity="danger"
            :update-time="store.lastUpdateTime"
          />
          <KpiCard
            label="平均修复时长"
            :value="avgRepairStats.avg"
            unit="小时"
            :sample-size="avgRepairStats.count"
            :severity="avgRepairStats.avg > 3 ? 'warning' : 'success'"
            :update-time="store.lastUpdateTime"
          />
          <KpiCard
            label="重复报修率"
            :value="duplicateStats.rate"
            unit="%"
            :sample-size="duplicateStats.original_count"
            :severity="duplicateStats.rate > 0.15 ? 'warning' : 'success'"
            :update-time="store.lastUpdateTime"
            :decimals="1"
          />
        </section>
        
        <TopAnomalies />
        
        <section class="charts-section">
          <div class="charts-row">
            <div class="chart-card large">
              <div class="chart-title">故障分布地图</div>
              <FaultMap />
            </div>
          </div>
          
          <div class="charts-row two-col">
            <div class="chart-card">
              <div class="chart-title">功率曲线分析</div>
              <PowerCurve />
            </div>
            <div class="chart-card">
              <div class="chart-title">维修耗时分布</div>
              <RepairTime />
            </div>
          </div>
          
          <div class="charts-row two-col">
            <div class="chart-card">
              <div class="chart-title">故障时段分布</div>
              <HourlyFaults />
            </div>
            <div class="chart-card">
              <div class="chart-title">站点故障排行</div>
              <StationRank />
            </div>
          </div>
        </section>
      </template>
    </main>
    
    <footer class="app-footer">
      <span>© 2024 充电桩运营监控平台 · 基于 Vue 3 + D3.js + ClickHouse 架构</span>
      <span class="footer-hint">离线桩不计入可用率分母 · 72小时内同桩同故障码自动合并</span>
    </footer>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useDataStore } from '@/stores/dataStore.js'
import FilterBar from '@/components/common/FilterBar.vue'
import KpiCard from '@/components/common/KpiCard.vue'
import ExportPanel from '@/components/common/ExportPanel.vue'
import TopAnomalies from '@/components/dashboard/TopAnomalies.vue'
import FaultMap from '@/components/charts/FaultMap.vue'
import PowerCurve from '@/components/charts/PowerCurve.vue'
import RepairTime from '@/components/charts/RepairTime.vue'
import StationRank from '@/components/charts/StationRank.vue'
import HourlyFaults from '@/components/charts/HourlyFaults.vue'

const store = useDataStore()

const availabilityStats = computed(() => store.availabilityStats)
const avgRepairStats = computed(() => store.avgRepairStats)
const duplicateStats = computed(() => store.duplicateStats)
const mergedFaults = computed(() => store.mergedFaults)

const lastUpdateStr = computed(() => {
  if (!store.lastUpdateTime) return ''
  const d = new Date(store.lastUpdateTime)
  return d.toLocaleString('zh-CN')
})

function getAvailSeverity(rate) {
  if (rate >= 0.9) return 'success'
  if (rate >= 0.75) return 'warning'
  return 'danger'
}

onMounted(() => {
  store.loadData()
})
</script>

<style lang="scss" scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: $bg-dark;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 32px;
  background: $bg-card;
  border-bottom: 1px solid $border-color;
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(10px);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 24px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-icon {
  font-size: 24px;
  filter: drop-shadow(0 0 8px rgba(22, 93, 255, 0.5));
}

.logo-text {
  font-size: 18px;
  font-weight: 600;
  color: $text-primary;
  background: linear-gradient(135deg, $primary 0%, #9D65FF 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header-breadcrumb {
  display: flex;
  align-items: center;
}

.breadcrumb-item {
  font-size: 13px;
  color: $primary;
  cursor: pointer;
  padding: 6px 12px;
  background: rgba(22, 93, 255, 0.1);
  border-radius: 6px;
  transition: all $transition-fast;
  
  &:hover {
    background: rgba(22, 93, 255, 0.2);
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.status-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: $text-secondary;
  
  &.loading {
    color: $warning;
    
    .status-dot {
      background: $warning;
      animation: pulse 1s infinite;
    }
  }
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: $success;
  box-shadow: 0 0 8px $success;
  
  &.online {
    animation: pulse 2s infinite;
  }
}

.status-time {
  color: $text-muted;
  font-family: $font-mono;
}

.app-main {
  flex: 1;
  padding: 24px 32px;
  max-width: 1600px;
  margin: 0 auto;
  width: 100%;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 0;
  gap: 16px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid $border-color;
  border-top-color: $primary;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  color: $text-secondary;
  font-size: 14px;
}

.kpi-section {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.charts-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.charts-row {
  display: flex;
  gap: 20px;
  
  &.two-col {
    .chart-card {
      flex: 1;
    }
  }
  
  .chart-card.large {
    flex: 1;
  }
}

.chart-card {
  background: $bg-card;
  border: 1px solid $border-color;
  border-radius: $radius-lg;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 360px;
}

.chart-title {
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 600;
  color: $text-primary;
  border-bottom: 1px solid $border-color;
  background: rgba(255, 255, 255, 0.02);
}

.app-footer {
  padding: 16px 32px;
  background: $bg-card;
  border-top: 1px solid $border-color;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: $text-muted;
}

.footer-hint {
  font-family: $font-mono;
  color: $text-secondary;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@media (max-width: 1200px) {
  .kpi-section {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .charts-row.two-col {
    flex-direction: column;
  }
}

@media (max-width: 768px) {
  .app-header {
    padding: 12px 16px;
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .app-main {
    padding: 16px;
  }
  
  .kpi-section {
    grid-template-columns: 1fr;
  }
  
  .charts-row {
    flex-direction: column;
  }
  
  .app-footer {
    padding: 12px 16px;
    flex-direction: column;
    gap: 8px;
    text-align: center;
  }
}
</style>
