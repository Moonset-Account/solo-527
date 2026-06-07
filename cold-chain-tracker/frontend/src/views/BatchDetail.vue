<template>
  <div v-if="batch">
    <div class="page-header">
      <div>
        <h1 class="page-title">批次 {{ batch.code || batch.batch_code }}</h1>
        <DrillNav />
      </div>
      <ExportPanel elementId="batch-detail" filename="batch-detail" />
    </div>

    <div class="info-card" id="batch-detail">
      <div class="info-grid">
        <div class="info-field"><label>批次号</label><span>{{ batch.code || batch.batch_code }}</span></div>
        <div class="info-field"><label>产品</label><span>{{ batch.product || batch.product_name }}</span></div>
        <div class="info-field"><label>客户</label><span>{{ batch.customer }}</span></div>
        <div class="info-field"><label>车辆</label><span>{{ batch.vehicle_plate || batch.vehicle_id }}</span></div>
        <div class="info-field"><label>状态</label>
          <span class="status-badge" :class="batchStatusClass(batch.status)">{{ batchStatusLabel(batch.status) }}</span>
        </div>
        <div class="info-field"><label>温度合规率</label><span>{{ formatPercent(batch.compliance_rate) }}</span></div>
        <div class="info-field"><label>出发时间</label><span>{{ formatDatetime(batch.departure_time || batch.start_time) }}</span></div>
        <div class="info-field"><label>到达时间</label><span>{{ formatDatetime(batch.arrival_time || batch.end_time) }}</span></div>
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
          <tr v-for="ex in exceptions" :key="ex.id" class="clickable-row" @click="$router.push(`/exceptions/${ex.id}`)">
            <td>{{ ex.exception_type }}</td>
            <td><span class="status-badge" :class="sevClass(ex.severity)">{{ sevLabel(ex.severity) }}</span></td>
            <td>{{ formatDatetime(ex.started_at) }}</td>
            <td>{{ formatDuration(ex.duration) }}</td>
            <td><span class="status-badge" :class="ex.status === 'resolved' ? 'badge-green' : 'badge-red'">{{ ex.status === 'resolved' ? '已解决' : '未解决' }}</span></td>
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

function batchStatusClass(s) {
  return { in_transit: 'badge-blue', delivered: 'badge-green', pending: 'badge-yellow', exception: 'badge-red' }[s] || 'badge-green'
}

function batchStatusLabel(s) {
  return { in_transit: '运输中', delivered: '已送达', pending: '待发运', exception: '异常' }[s] || s
}

function sevClass(s) { return { critical: 'badge-red', major: 'badge-yellow', minor: 'badge-blue' }[s] || 'badge-green' }
function sevLabel(s) { return { critical: '严重', major: '重要', minor: '轻微' }[s] || s }

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
