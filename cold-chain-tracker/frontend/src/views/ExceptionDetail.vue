<template>
  <div v-if="exception">
    <div class="page-header">
      <div>
        <h1 class="page-title">异常详情 #{{ exception.id }}</h1>
        <DrillNav />
      </div>
      <ExportPanel elementId="exception-detail" filename="exception-detail" />
    </div>

    <div class="info-card" id="exception-detail">
      <div class="info-grid">
        <div class="info-field"><label>异常ID</label><span>{{ exception.id }}</span></div>
        <div class="info-field"><label>异常类型</label><span>{{ exception.exception_type }}</span></div>
        <div class="info-field"><label>严重程度</label>
          <span class="status-badge" :class="sevClass(exception.severity)">{{ sevLabel(exception.severity) }}</span>
        </div>
        <div class="info-field"><label>状态</label>
          <span class="status-badge" :class="exception.status === 'resolved' ? 'badge-green' : 'badge-red'">
            {{ exception.status === 'resolved' ? '已解决' : '未解决' }}
          </span>
        </div>
        <div class="info-field"><label>开始时间</label><span>{{ formatDatetime(exception.started_at) }}</span></div>
        <div class="info-field"><label>结束时间</label><span>{{ formatDatetime(exception.end_time) }}</span></div>
        <div class="info-field"><label>持续时长</label><span>{{ formatDuration(exception.duration) }}</span></div>
        <div class="info-field"><label>车辆</label>
          <router-link v-if="exception.vehicle_id" :to="`/vehicles/${exception.vehicle_id}`" class="link">
            {{ exception.vehicle_id }}
          </router-link>
          <span v-else>--</span>
        </div>
        <div class="info-field"><label>路线</label>
          <router-link v-if="exception.route_id" :to="`/routes/${exception.route_id}`" class="link">
            {{ exception.route_name || exception.route_id }}
          </router-link>
          <span v-else>--</span>
        </div>
        <div class="info-field"><label>批次</label>
          <router-link v-if="exception.batch_id" :to="`/batches/${exception.batch_id}`" class="link">
            {{ exception.batch_code || exception.batch_id }}
          </router-link>
          <span v-else>--</span>
        </div>
      </div>
    </div>

    <div style="margin-bottom: 16px;">
      <OriginalRecord v-if="showOriginal" :record="exception" @close="showOriginal = false" />
    </div>

    <div style="margin-bottom: 16px;">
      <TemperatureCurve
        :scopeType="exception.vehicle_id ? 'vehicle' : 'overall'"
        :scopeId="exception.vehicle_id || ''"
        :highlightPeriod="exception.started_at ? { start: exception.started_at, end: exception.end_time } : null"
      />
    </div>

    <div class="info-card" v-if="exception.route_id">
      <h3 class="section-title">异常发生路段</h3>
      <div class="info-grid">
        <div class="info-field"><label>路线</label><span>{{ exception.route_name || exception.route_id }}</span></div>
        <div class="info-field"><label>位置</label><span>{{ formatGPS(exception.latitude, exception.longitude) }}</span></div>
        <div class="info-field"><label>责任方</label><span>{{ exception.responsibility || '--' }}</span></div>
      </div>
    </div>

    <div class="info-card">
      <h3 class="section-title">处理状态</h3>
      <div class="info-grid">
        <div class="info-field"><label>处理人</label><span>{{ exception.resolved_by || '--' }}</span></div>
        <div class="info-field"><label>处理时间</label><span>{{ formatDatetime(exception.resolved_at) }}</span></div>
      </div>
      <div v-if="exception.notes || exception.resolution_notes" style="margin-top: 12px;">
        <label style="font-size: 12px; color: var(--text-secondary);">处理备注</label>
        <p style="margin-top: 4px; font-size: 13px; color: var(--text-secondary); line-height: 1.6;">
          {{ exception.notes || exception.resolution_notes }}
        </p>
      </div>
      <div style="margin-top: 12px;" v-if="exception.status !== 'resolved'">
        <button class="btn btn-primary" @click="showOriginal = true">查看原始记录</button>
      </div>
    </div>
  </div>
  <div v-else class="loading">加载中...</div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '../utils/api'
import { formatDatetime, formatDuration, formatGPS } from '../utils/format'
import DrillNav from '../components/DrillNav.vue'
import ExportPanel from '../components/ExportPanel.vue'
import TemperatureCurve from '../components/TemperatureCurve.vue'
import OriginalRecord from '../components/OriginalRecord.vue'

const route = useRoute()
const exceptionId = route.params.id
const exception = ref(null)
const showOriginal = ref(false)

function sevClass(s) { return { critical: 'badge-red', major: 'badge-yellow', minor: 'badge-blue' }[s] || 'badge-green' }
function sevLabel(s) { return { critical: '严重', major: '重要', minor: '轻微' }[s] || s }

async function fetchData() {
  try {
    const res = await api.get(`/exceptions/${exceptionId}`)
    exception.value = res.data || {}
  } catch {
    // silently
  }
}

onMounted(fetchData)
</script>
