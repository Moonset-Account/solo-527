<template>
  <div id="dashboard-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">冷链温控仪表盘</h1>
        <DrillNav />
      </div>
      <ExportPanel :data="exportData" elementId="dashboard-page" filename="dashboard" />
    </div>
    <FilterPanel />

    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">运营车辆</div>
        <div class="kpi-value text-blue">{{ kpi.activeVehicles }}</div>
        <div class="kpi-sub">较昨日 {{ kpi.vehiclesChange >= 0 ? '+' : '' }}{{ kpi.vehiclesChange }}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">运输路线</div>
        <div class="kpi-value text-blue">{{ kpi.routesInTransit }}</div>
        <div class="kpi-sub">在途路线</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">未处理异常</div>
        <div class="kpi-value text-red">{{ kpi.openExceptions }}</div>
        <div class="kpi-sub">严重: {{ kpi.criticalExceptions }}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">温度合规率</div>
        <div class="kpi-value" :class="kpi.complianceRate >= 95 ? 'text-green' : 'text-yellow'">
          {{ kpi.complianceRate }}%
        </div>
        <div class="kpi-sub">目标 ≥ 95%</div>
      </div>
    </div>

    <div style="margin-bottom: 16px;">
      <TrendChart @drilldown="onTrendDrilldown" />
    </div>

    <div class="grid-2" style="margin-bottom: 16px;">
      <ExceptionDuration />
      <div class="info-card">
        <h3 class="section-title">最近异常</h3>
        <table class="data-table compact" v-if="recentExceptions.length">
          <thead>
            <tr><th>时间</th><th>类型</th><th>车辆</th><th>严重程度</th></tr>
          </thead>
          <tbody>
            <tr v-for="ex in recentExceptions" :key="ex.exception_id" class="clickable-row" @click="goException(ex.exception_id)">
              <td>{{ formatDatetime(ex.started_at) }}</td>
              <td>{{ ex.exception_type }}</td>
              <td>{{ ex.vehicle_id }}</td>
              <td><span class="status-badge" :class="sevClass(ex.severity)">{{ sevLabel(ex.severity) }}</span></td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty">暂无异常记录</div>
      </div>
    </div>

    <div class="info-card">
      <h3 class="section-title">校准状态概览</h3>
      <div class="kpi-grid" style="margin-bottom: 12px;">
        <div class="kpi-card">
          <div class="kpi-label">有效探头</div>
          <div class="kpi-value text-green">{{ calibSummary.valid }}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">即将到期</div>
          <div class="kpi-value text-yellow">{{ calibSummary.dueSoon }}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">已过期</div>
          <div class="kpi-value text-red">{{ calibSummary.expired }}</div>
        </div>
      </div>
      <CalibrationStatus :probes="calibProbes" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import api from '../utils/api'
import { formatDatetime, formatPercent } from '../utils/format'
import { useFilterStore } from '../stores/filter'
import { useDrilldown } from '../composables/useDrilldown'
import FilterPanel from '../components/FilterPanel.vue'
import DrillNav from '../components/DrillNav.vue'
import ExportPanel from '../components/ExportPanel.vue'
import TrendChart from '../components/TrendChart.vue'
import ExceptionDuration from '../components/ExceptionDuration.vue'
import CalibrationStatus from '../components/CalibrationStatus.vue'

const router = useRouter()
const filterStore = useFilterStore()
const { drillDown } = useDrilldown()

const kpi = ref({
  activeVehicles: 0, routesInTransit: 0, openExceptions: 0,
  criticalExceptions: 0, complianceRate: 0, vehiclesChange: 0
})
const recentExceptions = ref([])
const calibProbes = ref([])
const calibSummary = ref({ valid: 0, dueSoon: 0, expired: 0 })
const exportData = ref([])

function sevClass(s) {
  return { critical: 'badge-red', major: 'badge-yellow', minor: 'badge-blue' }[s] || 'badge-green'
}

function sevLabel(s) {
  return { critical: '严重', major: '重要', minor: '轻微' }[s] || s
}

function goException(id) { router.push(`/exceptions/${id}`) }

function onTrendDrilldown(d) {
  if (d.vehicle_id) drillDown('vehicle', d.vehicle_id, d.vehicle_plate || d.vehicle_id)
}

async function fetchDashboard() {
  try {
    const params = filterStore.buildQueryParams()
    const [kpiRes, exRes, calibRes] = await Promise.all([
      api.get('/overview', { params }),
      api.get('/exceptions', { params: { ...params, page_size: 10 } }),
      api.get('/calibrations', { params: { page_size: 50 } })
    ])
    const d = kpiRes.data || {}
    kpi.value = {
      activeVehicles: d.total_vehicles || 0,
      routesInTransit: d.active_routes || 0,
      openExceptions: d.pending_exceptions || 0,
      criticalExceptions: exRes.data ? exRes.data.filter(e => e.severity === 'critical').length : 0,
      complianceRate: d.temp_compliance_rate != null ? Number(d.temp_compliance_rate).toFixed(1) : 0,
      vehiclesChange: d.vehicles_change || 0
    }
    recentExceptions.value = exRes.data || []
    exportData.value = recentExceptions.value

    const probes = calibRes.data || []
    calibProbes.value = probes.slice(0, 10)
    calibSummary.value = {
      valid: probes.filter(p => p.status === 'valid').length,
      dueSoon: probes.filter(p => p.status === 'due_soon').length,
      expired: probes.filter(p => p.status === 'expired').length
    }
  } catch {
    // silently fail
  }
}

onMounted(fetchDashboard)
watch(() => filterStore.filterParams, fetchDashboard, { deep: true })
</script>
