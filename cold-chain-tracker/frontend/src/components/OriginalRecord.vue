<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content original-record">
      <div class="modal-header">
        <h3>原始记录详情</h3>
        <button class="modal-close" @click="$emit('close')">×</button>
      </div>
      <div class="modal-body" v-if="record">
        <div class="record-section" v-if="linkedReadings.length">
          <h4>关联温度读数 ({{ linkedReadings.length }})</h4>
          <table class="data-table compact">
            <thead>
              <tr><th>读数ID</th><th>探头</th><th>保温箱</th><th>温度</th><th>记录时间</th></tr>
            </thead>
            <tbody>
              <tr v-for="r in linkedReadings" :key="r.reading_id" :class="{ 'anomaly-row': r.is_anomaly }">
                <td>{{ r.reading_id }}</td>
                <td>{{ r.probe_id }}</td>
                <td>{{ r.box_id }}</td>
                <td>{{ formatTemp(r.temperature) }}</td>
                <td>{{ formatDatetime(r.recorded_at) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="record-section" v-if="linkedDoorEvents.length">
          <h4>关联门开启事件 ({{ linkedDoorEvents.length }})</h4>
          <table class="data-table compact">
            <thead>
              <tr><th>事件ID</th><th>类型</th><th>保温箱</th><th>发生时间</th><th>时长(秒)</th><th>位置</th></tr>
            </thead>
            <tbody>
              <tr v-for="d in linkedDoorEvents" :key="d.event_id">
                <td>{{ d.event_id }}</td>
                <td><span class="status-badge" :class="d.event_type === 'open' ? 'badge-red' : 'badge-green'">{{ d.event_type === 'open' ? '开门' : '关门' }}</span></td>
                <td>{{ d.box_id }}</td>
                <td>{{ formatDatetime(d.occurred_at) }}</td>
                <td>{{ d.duration_seconds || '--' }}</td>
                <td>{{ formatGPS(d.location_lat, d.location_lng) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="record-section" v-if="!linkedReadings.length && !linkedDoorEvents.length">
          <h4>温度读数</h4>
          <table class="data-table compact">
            <thead>
              <tr><th>探头</th><th>温度</th><th>时间</th><th>是否异常</th></tr>
            </thead>
            <tbody>
              <tr :class="{ 'anomaly-row': record.isAnomaly || record.is_anomaly }">
                <td>{{ record.probe_id || '--' }}</td>
                <td>{{ formatTemp(record.temperature) }}</td>
                <td>{{ formatDatetime(record.recorded_at || record.timestamp) }}</td>
                <td>
                  <span :class="['status-badge', (record.isAnomaly || record.is_anomaly) ? 'badge-red' : 'badge-green']">
                    {{ (record.isAnomaly || record.is_anomaly) ? '异常' : '正常' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="record-section" v-if="record.door_event || record.door_open || record.event_type">
          <h4>门开启事件</h4>
          <div class="record-field">
            <span class="field-label">事件类型:</span>
            <span>{{ record.event_type === 'open' ? '开门' : '关门' }}</span>
          </div>
          <div class="record-field">
            <span class="field-label">开门时间:</span>
            <span>{{ formatDatetime(record.occurred_at || record.door_open_time || record.timestamp) }}</span>
          </div>
          <div class="record-field" v-if="record.duration_seconds || record.door_duration">
            <span class="field-label">开门时长:</span>
            <span>{{ formatDuration(record.duration_seconds || record.door_duration) }}</span>
          </div>
          <div class="record-field" v-if="record.location_lat || record.latitude">
            <span class="field-label">位置:</span>
            <span>{{ formatGPS(record.location_lat || record.latitude, record.location_lng || record.longitude) }}</span>
          </div>
        </div>

        <div class="record-section" v-if="record.location_lat || record.latitude || record.gps">
          <h4>GPS 定位</h4>
          <div class="record-field">
            <span class="field-label">坐标:</span>
            <span>{{ formatGPS(record.location_lat || record.latitude, record.location_lng || record.longitude) }}</span>
          </div>
        </div>

        <div class="record-section" v-if="record.description || record.notes || record.remarks">
          <h4>备注</h4>
          <p class="record-notes">{{ record.description || record.notes || record.remarks }}</p>
        </div>

        <div class="record-section" v-if="record.exception_id || record.linked_exception">
          <h4>关联异常记录</h4>
          <div class="record-field">
            <span class="field-label">异常ID:</span>
            <router-link
              :to="`/exceptions/${record.exception_id || record.linked_exception}`"
              class="link"
            >{{ record.exception_id || record.linked_exception }}</router-link>
          </div>
          <div class="record-field" v-if="record.exception_type">
            <span class="field-label">异常类型:</span>
            <span>{{ record.exception_type }}</span>
          </div>
          <div class="record-field" v-if="record.severity">
            <span class="field-label">严重程度:</span>
            <span class="status-badge" :class="sevClass(record.severity)">{{ sevLabel(record.severity) }}</span>
          </div>
        </div>

        <div class="record-section">
          <h4>数据溯源</h4>
          <div class="record-field">
            <span class="field-label">记录ID:</span>
            <span>{{ record.reading_id || record.event_id || record.exception_id || record.id || '--' }}</span>
          </div>
          <div class="record-field">
            <span class="field-label">采集时间:</span>
            <span>{{ formatDatetime(record.recorded_at || record.occurred_at || record.created_at || record.timestamp) }}</span>
          </div>
          <div class="record-field" v-if="record.source">
            <span class="field-label">数据来源:</span>
            <span>{{ record.source }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { formatTemp, formatDuration, formatDatetime, formatGPS } from '../utils/format'

const props = defineProps({ record: { type: Object, default: null } })
defineEmits(['close'])

const linkedReadings = computed(() => {
  if (!props.record) return []
  return props.record.linked_temperature_readings || []
})

const linkedDoorEvents = computed(() => {
  if (!props.record) return []
  return props.record.linked_door_events || []
})

function sevClass(sev) {
  const map = { critical: 'badge-red', high: 'badge-red', major: 'badge-yellow', medium: 'badge-yellow', minor: 'badge-blue', low: 'badge-green' }
  return map[sev] || 'badge-green'
}

function sevLabel(sev) {
  const map = { critical: '严重', high: '高', major: '重要', medium: '中等', minor: '轻微', low: '低' }
  return map[sev] || sev
}
</script>
