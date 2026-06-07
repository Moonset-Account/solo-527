<template>
  <div v-if="batch">
    <div class="page-header">
      <div>
        <h1 class="page-title">批次 {{ batch.batch_id }}</h1>
        <DrillNav />
      </div>
      <ExportPanel elementId="batch-detail" filename="batch-detail" />
    </div>

    <div class="info-card" id="batch-detail">
      <div class="info-grid">
        <div class="info-field"><label>批次号</label><span>{{ batch.batch_id }}</span></div>
        <div class="info-field"><label>产品</label><span>{{ batch.product_name }}</span></div>
        <div class="info-field"><label>数量</label><span>{{ batch.quantity }}</span></div>
        <div class="info-field"><label>温度要求</label><span>{{ batch.required_temp_min }}°C ~ {{ batch.required_temp_max }}°C</span></div>
        <div class="info-field"><label>路线</label>
          <router-link v-if="batch.route_id" :to="`/routes/${batch.route_id}`" class="link">{{ batch.route_id }}</router-link>
          <span v-else>--</span>
        </div>
      </div>
    </div>

    <div style="margin-bottom: 16px;">
      <TemperatureCurve scopeType="batch" :scopeId="batchId" />
    </div>

    <div class="info-card">
      <h3 class="section-title">异常记录</h3>
      <table class="data-table compact" v-if="exceptions.length">
        <thead><tr><th>类型</th><th>严重程度</th><th>开始时间</th><th>持续时长</th><th>状态</th></tr></thead>
        <tbody>
          <tr v-for="ex in exceptions" :key="ex.exception_id" class="clickable-row" @click="$router.push(`/exceptions/${ex.exception_id}`)">
            <td>{{ typeLabel(ex.exception_type) }}</td>
            <td><span class="status-badge" :class="sevClass(ex.severity)">{{ sevLabel(ex.severity) }}</span></td>
            <td>{{ formatDatetime(ex.started_at) }}</td>
            <td>{{ formatDuration(ex.duration_minutes) }}</td>
            <td><span class="status-badge" :class="ex.resolution ? 'badge-green' : 'badge-red'">{{ ex.resolution ? '已解决' : '未解决' }}</span></td>
          </tr>
        </tbody>
      </table>
      <div v-else class="empty">暂无异常记录</div>
    </div>
  </div>
  <div v-else class="loading">加载中...</div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '../utils/api'
import { formatPercent, formatDatetime, formatDuration } from '../utils/format'
import DrillNav from '../components/DrillNav.vue'
import ExportPanel from '../components/ExportPanel.vue'
import TemperatureCurve from '../components/TemperatureCurve.vue'

const route = useRoute()
const batchId = route.params.id
const batch = ref(null)
const exceptions = ref([])

function sevClass(s) { return { critical: 'badge-red', high: 'badge-red', medium: 'badge-yellow', low: 'badge-green' }[s] || 'badge-green' }
function sevLabel(s) { return { critical: '严重', high: '高', medium: '中等', low: '低' }[s] || s }
function typeLabel(t) { return { temp_exceeded: '温度超标', unauthorized_door: '非授权开门', delayed_arrival: '到货延迟', calibration_drift: '校准漂移' }[t] || t }

async function fetchData() {
  try {
    const [bRes, eRes] = await Promise.all([
      api.get(`/batches/${batchId}`),
      api.get('/exceptions', { params: { batch_id: batchId, page_size: 20 } })
    ])
    batch.value = bRes.data || {}
    exceptions.value = eRes.data || []
  } catch {
    // silently
  }
}

onMounted(fetchData)
</script>
