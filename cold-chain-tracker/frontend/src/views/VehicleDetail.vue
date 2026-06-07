<template>
  <div v-if="vehicle">
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ vehicle.plate_number }}</h1>
        <DrillNav />
      </div>
      <ExportPanel elementId="vehicle-detail" filename="vehicle-detail" />
    </div>

    <div class="info-card" id="vehicle-detail">
      <div class="info-grid">
        <div class="info-field"><label>车牌号</label><span>{{ vehicle.plate_number }}</span></div>
        <div class="info-field"><label>状态</label>
          <span class="status-badge" :class="statusClass(vehicle.status)">{{ statusLabel(vehicle.status) }}</span>
        </div>
        <div class="info-field"><label>当前温度</label><span>{{ formatTemp(vehicle.current_temperature) }}</span></div>
        <div class="info-field"><label>温度范围</label><span>{{ formatTemp(vehicle.temp_min) }} ~ {{ formatTemp(vehicle.temp_max) }}</span></div>
        <div class="info-field"><label>合规率</label><span>{{ formatPercent(vehicle.compliance_rate) }}</span></div>
        <div class="info-field"><label>异常数</label><span :style="{ color: vehicle.exception_count > 0 ? 'var(--danger)' : '' }">{{ vehicle.exception_count || 0 }}</span></div>
      </div>
    </div>

    <div style="margin-bottom: 16px;">
      <TemperatureCurve scopeType="vehicle" :scopeId="vehicleId" />
    </div>

    <div class="grid-2">
      <div class="info-card">
        <h3 class="section-title">最近路线</h3>
        <table class="data-table compact" v-if="routes.length">
          <thead><tr><th>路线</th><th>起点</th><th>终点</th><th>状态</th></tr></thead>
          <tbody>
            <tr v-for="r in routes" :key="r.id" class="clickable-row" @click="$router.push(`/routes/${r.id}`)">
              <td>{{ r.name || r.id }}</td>
              <td>{{ r.origin }}</td>
              <td>{{ r.destination }}</td>
              <td><span class="status-badge" :class="r.status === 'completed' ? 'badge-green' : 'badge-blue'">{{ r.status }}</span></td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty">暂无路线记录</div>
      </div>

      <div class="info-card">
        <h3 class="section-title">活跃异常</h3>
        <table class="data-table compact" v-if="exceptions.length">
          <thead><tr><th>类型</th><th>严重程度</th><th>时间</th></tr></thead>
          <tbody>
            <tr v-for="ex in exceptions" :key="ex.id" class="clickable-row" @click="$router.push(`/exceptions/${ex.id}`)">
              <td>{{ ex.exception_type }}</td>
              <td><span class="status-badge" :class="sevClass(ex.severity)">{{ sevLabel(ex.severity) }}</span></td>
              <td>{{ formatDatetime(ex.started_at) }}</td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty">暂无活跃异常</div>
      </div>
    </div>
  </div>
  <div v-else class="loading">加载中...</div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '../utils/api'
import { formatTemp, formatPercent, formatDatetime } from '../utils/format'
import DrillNav from '../components/DrillNav.vue'
import ExportPanel from '../components/ExportPanel.vue'
import TemperatureCurve from '../components/TemperatureCurve.vue'

const route = useRoute()
const vehicleId = route.params.id
const vehicle = ref(null)
const routes = ref([])
const exceptions = ref([])

function statusClass(s) {
  return { in_transit: 'badge-green', idle: 'badge-blue', maintenance: 'badge-yellow', offline: 'badge-red' }[s] || 'badge-green'
}

function statusLabel(s) {
  return { in_transit: '运输中', idle: '空闲', maintenance: '维修中', offline: '离线' }[s] || s
}

function sevClass(s) { return { critical: 'badge-red', major: 'badge-yellow', minor: 'badge-blue' }[s] || 'badge-green' }
function sevLabel(s) { return { critical: '严重', major: '重要', minor: '轻微' }[s] || s }

async function fetchData() {
  try {
    const vRes = await api.get(`/vehicles/${vehicleId}`)
    vehicle.value = vRes.data || {}
    routes.value = vRes.data?.routes || []
    exceptions.value = vRes.data?.recent_exceptions || []
  } catch {
    // silently
  }
}

onMounted(fetchData)
</script>
