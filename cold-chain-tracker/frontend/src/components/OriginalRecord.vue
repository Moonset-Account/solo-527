<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content original-record">
      <div class="modal-header">
        <h3>原始记录详情</h3>
        <button class="modal-close" @click="$emit('close')">×</button>
      </div>
      <div class="modal-body" v-if="record">
        <div class="record-section">
          <h4>温度读数</h4>
          <table class="data-table compact">
            <thead>
              <tr><th>探头</th><th>温度</th><th>时间</th><th>是否异常</th></tr>
            </thead>
            <tbody>
              <tr :class="{ 'anomaly-row': record.isAnomaly || record.is_anomaly }">
                <td>{{ record.probe_id || '--' }}</td>
                <td>{{ formatTemp(record.temperature || record.temp) }}</td>
                <td>{{ formatDatetime(record.timestamp || record.recorded_at) }}</td>
                <td>
                  <span :class="['status-badge', (record.isAnomaly || record.is_anomaly) ? 'badge-red' : 'badge-green']">
                    {{ (record.isAnomaly || record.is_anomaly) ? '异常' : '正常' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="record-section" v-if="record.door_event || record.door_open">
          <h4>门开启事件</h4>
          <div class="record-field">
            <span class="field-label">开门时间:</span>
            <span>{{ formatDatetime(record.door_open_time || record.timestamp) }}</span>
          </div>
          <div class="record-field" v-if="record.door_close_time">
            <span class="field-label">关门时间:</span>
            <span>{{ formatDatetime(record.door_close_time) }}</span>
          </div>
          <div class="record-field" v-if="record.door_duration">
            <span class="field-label">开门时长:</span>
            <span>{{ formatDuration(record.door_duration) }}</span>
          </div>
        </div>

        <div class="record-section" v-if="record.latitude || record.gps">
          <h4>GPS 定位</h4>
          <div class="record-field">
            <span class="field-label">坐标:</span>
            <span>{{ formatGPS(record.latitude || record.lat, record.longitude || record.lng) }}</span>
          </div>
        </div>

        <div class="record-section" v-if="record.notes || record.remarks">
          <h4>备注</h4>
          <p class="record-notes">{{ record.notes || record.remarks }}</p>
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
          <div class="record-field" v-if="record.exception_severity">
            <span class="field-label">严重程度:</span>
            <span class="status-badge" :class="sevClass(record.exception_severity)">
              {{ sevLabel(record.exception_severity) }}
            </span>
          </div>
        </div>

        <div class="record-section">
          <h4>数据溯源</h4>
          <div class="record-field">
            <span class="field-label">记录ID:</span>
            <span>{{ record.id || record.record_id || '--' }}</span>
          </div>
          <div class="record-field">
            <span class="field-label">采集时间:</span>
            <span>{{ formatDatetime(record.created_at || record.timestamp) }}</span>
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
import { formatTemp, formatDuration, formatDatetime, formatGPS } from '../utils/format'

defineProps({ record: { type: Object, default: null } })
defineEmits(['close'])

function sevClass(sev) {
  const map = { critical: 'badge-red', major: 'badge-yellow', minor: 'badge-blue' }
  return map[sev] || 'badge-green'
}

function sevLabel(sev) {
  const map = { critical: '严重', major: '重要', minor: '轻微' }
  return map[sev] || sev
}
</script>
