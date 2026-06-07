<template>
  <div v-if="exception">
    <div class="page-header">
      <div>
        <h1 class="page-title">异常详情 #{{ exception.exception_id }}</h1>
        <DrillNav />
      </div>
      <ExportPanel elementId="exception-detail" filename="exception-detail" />
    </div>

    <div class="info-card" id="exception-detail">
      <div class="info-grid">
        <div class="info-field"><label>异常ID</label><span>{{ exception.exception_id }}</span></div>
        <div class="info-field"><label>异常类型</label><span>{{ typeLabel(exception.exception_type) }}</span></div>
        <div class="info-field"><label>严重程度</label>
          <span class="status-badge" :class="sevClass(exception.severity)">{{ sevLabel(exception.severity) }}</span>
        </div>
        <div class="info-field"><label>状态</label>
          <span class="status-badge" :class="exception.resolution ? 'badge-green' : 'badge-red'">
            {{ exception.resolution ? '已解决' : '未解决' }}
          </span>
        </div>
        <div class="info-field"><label>开始时间</label><span>{{ formatDatetime(exception.started_at) }}</span></div>
        <div class="info-field"><label>结束时间</label><span>{{ formatDatetime(exception.ended_at) }}</span></div>
        <div class="info-field"><label>持续时长</label><span>{{ formatDuration(exception.duration_minutes) }}</span></div>
        <div class="info-field"><label>车辆</label>
          <router-link v-if="exception.vehicle_id" :to="`/vehicles/${exception.vehicle_id}`" class="link">
            {{ exception.vehicle_id }}
          </router-link>
          <span v-else>--</span>
        </div>
        <div class="info-field"><label>路线</label>
          <router-link v-if="exception.route_id" :to="`/routes/${exception.route_id}`" class="link">
            {{ exception.route_id }}
          </router-link>
          <span v-else>--</span>
        </div>
        <div class="info-field"><label>批次</label>
          <router-link v-if="exception.batch_id" :to="`/batches/${exception.batch_id}`" class="link">
            {{ exception.batch_id }}
          </router-link>
          <span v-else>--</span>
        </div>
        <div class="info-field"><label>保温箱</label><span>{{ exception.box_id || '--' }}</span></div>
      </div>
      <div v-if="exception.description" style="margin-top: 12px;">
        <label style="font-size: 12px; color: var(--text-secondary);">异常描述</label>
        <p style="margin-top: 4px; font-size: 13px; color: var(--text-primary); line-height: 1.6;">
          {{ exception.description }}
        </p>
      </div>
    </div>

    <div style="margin-bottom: 16px;">
      <OriginalRecord v-if="showOriginal" :record="exception" @close="showOriginal = false" />
    </div>

    <div style="margin-bottom: 16px;">
      <TemperatureCurve
        :scopeType="exception.vehicle_id ? 'vehicle' : 'overall'"
        :scopeId="exception.vehicle_id || ''"
        :highlightPeriod="exception.started_at ? { start: exception.started_at, end: exception.ended_at } : null"
      />
    </div>

    <div class="info-card" v-if="exception.route_id">
      <h3 class="section-title">异常发生路段</h3>
      <div class="info-grid">
        <div class="info-field"><label>路线</label>
          <router-link :to="`/routes/${exception.route_id}`" class="link">{{ exception.route_id }}</router-link>
        </div>
        <div class="info-field"><label>保温箱</label><span>{{ exception.box_id || '--' }}</span></div>
      </div>
    </div>

    <div class="info-card">
      <h3 class="section-title">处理状态</h3>
      <div class="info-grid">
        <div class="info-field"><label>处理人</label><span>{{ exception.resolved_by || '--' }}</span></div>
        <div class="info-field"><label>处理结果</label><span>{{ exception.resolution || '--' }}</span></div>
      </div>
      <div style="margin-top: 12px;">
        <button class="btn btn-primary" @click="showOriginal = !showOriginal">
          {{ showOriginal ? '关闭原始记录' : '查看原始记录' }}
        </button>
      </div>
    </div>
  </div>
  <div v-else class="loading">加载中...</div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '../utils/api'
import { formatDatetime, formatDuration } from '../utils/format'
import DrillNav from '../components/DrillNav.vue'
import ExportPanel from '../components/ExportPanel.vue'
import TemperatureCurve from '../components/TemperatureCurve.vue'
import OriginalRecord from '../components/OriginalRecord.vue'

const route = useRoute()
const exceptionId = route.params.id
const exception = ref(null)
const showOriginal = ref(false)

function sevClass(s) {
  const map = { critical: 'badge-red', high: 'badge-red', medium: 'badge-yellow', low: 'badge-green' }
  return map[s] || 'badge-green'
}
function sevLabel(s) {
  const map = { critical: '严重', high: '高', medium: '中等', low: '低' }
  return map[s] || s
}
function typeLabel(t) {
  const map = { temp_exceeded: '温度超标', unauthorized_door: '非授权开门', delayed_arrival: '到货延迟', calibration_drift: '校准漂移' }
  return map[t] || t
}

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
