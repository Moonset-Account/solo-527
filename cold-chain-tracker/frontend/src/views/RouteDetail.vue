<template>
  <div v-if="routeData">
    <div class="page-header">
      <div>
        <h1 class="page-title">路线 {{ routeData.route_id }}</h1>
        <DrillNav />
      </div>
      <ExportPanel elementId="route-detail" filename="route-detail" />
    </div>

    <div class="info-card" id="route-detail">
      <div class="info-grid">
        <div class="info-field"><label>路线编号</label><span>{{ routeData.route_id }}</span></div>
        <div class="info-field"><label>起点</label><span>{{ routeData.origin }}</span></div>
        <div class="info-field"><label>终点</label><span>{{ routeData.destination }}</span></div>
        <div class="info-field"><label>状态</label>
          <span class="status-badge" :class="routeData.status === 'completed' ? 'badge-green' : 'badge-blue'">{{ routeData.status }}</span>
        </div>
        <div class="info-field"><label>距离</label><span>{{ formatDistance(routeData.distance_km || routeData.distance) }}</span></div>
        <div class="info-field"><label>温度合规率</label><span>{{ formatPercent(routeData.compliance_rate) }}</span></div>
        <div class="info-field"><label>计划出发</label><span>{{ formatDatetime(routeData.planned_departure || routeData.start_time) }}</span></div>
        <div class="info-field"><label>计划到达</label><span>{{ formatDatetime(routeData.planned_arrival || routeData.end_time) }}</span></div>
        <div class="info-field"><label>实际出发</label><span>{{ formatDatetime(routeData.actual_departure) }}</span></div>
        <div class="info-field"><label>实际到达</label><span>{{ formatDatetime(routeData.actual_arrival) }}</span></div>
      </div>
    </div>

    <div style="margin-bottom: 16px;">
      <RoutePlayback :routeId="routeId" />
    </div>

    <div style="margin-bottom: 16px;">
      <TemperatureCurve scopeType="route" :scopeId="routeId" />
    </div>

    <div style="margin-bottom: 16px;">
      <ResponsibilitySegment :routeId="routeId" />
    </div>

    <div class="info-card">
      <h3 class="section-title">门开启事件</h3>
      <table class="data-table compact" v-if="doorEvents.length">
        <thead><tr><th>时间</th><th>位置</th><th>开门时长</th><th>温度变化</th></tr></thead>
        <tbody>
          <tr v-for="d in doorEvents" :key="d.event_id || d.timestamp">
            <td>{{ formatDatetime(d.occurred_at || d.timestamp) }}</td>
            <td>{{ formatGPS(d.location_lat || d.latitude, d.location_lng || d.longitude) }}</td>
            <td>{{ formatDuration(d.duration_seconds || d.door_duration) }}</td>
            <td>{{ d.temp_change ? d.temp_change.toFixed(1) + '°C' : '--' }}</td>
          </tr>
        </tbody>
      </table>
      <div v-else class="empty">暂无门开启事件</div>
    </div>
  </div>
  <div v-else class="loading">加载中...</div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '../utils/api'
import { formatDistance, formatPercent, formatDatetime, formatGPS, formatDuration } from '../utils/format'
import DrillNav from '../components/DrillNav.vue'
import ExportPanel from '../components/ExportPanel.vue'
import RoutePlayback from '../components/RoutePlayback.vue'
import TemperatureCurve from '../components/TemperatureCurve.vue'
import ResponsibilitySegment from '../components/ResponsibilitySegment.vue'

const route = useRoute()
const routeId = route.params.id
const routeData = ref(null)
const doorEvents = ref([])

async function fetchData() {
  try {
    const [rRes, dRes] = await Promise.all([
      api.get(`/routes/${routeId}`),
      api.get(`/routes/${routeId}/door-events`)
    ])
    routeData.value = rRes.data || {}
    doorEvents.value = dRes.data || []
  } catch {
    // silently
  }
}

onMounted(fetchData)
</script>
