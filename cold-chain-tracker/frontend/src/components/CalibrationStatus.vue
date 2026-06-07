<template>
  <div class="calibration-status">
    <div class="calib-warning" v-if="hasExpired">
      ⚠ 存在校准过期的探头，请及时校准！
    </div>
    <table class="data-table">
      <thead>
        <tr>
          <th>探头ID</th>
          <th>所属车辆</th>
          <th>校准状态</th>
          <th>偏差值</th>
          <th>上次校准</th>
          <th>下次校准</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="probe in probes" :key="probe.id" class="calib-row">
          <td>{{ probe.probe_id || probe.id }}</td>
          <td>{{ probe.vehicle_plate || probe.vehicle_id || '--' }}</td>
          <td>
            <span class="status-badge" :class="calibClass(probe.status)">
              {{ calibLabel(probe.status) }}
            </span>
          </td>
          <td>{{ probe.deviation != null ? probe.deviation.toFixed(2) + '°C' : '--' }}</td>
          <td>{{ formatDate(probe.last_calibrated) }}</td>
          <td>{{ formatDate(probe.next_calibration) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { formatDate } from '../utils/format'

const props = defineProps({
  probes: { type: Array, default: () => [] }
})

const hasExpired = computed(() => props.probes.some(p => p.status === 'expired'))

function calibClass(status) {
  const map = { valid: 'badge-green', due_soon: 'badge-yellow', expired: 'badge-red' }
  return map[status] || 'badge-green'
}

function calibLabel(status) {
  const map = { valid: '有效', due_soon: '即将到期', expired: '已过期' }
  return map[status] || '未知'
}
</script>
