<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">校准状态</h1>
      <ExportPanel :data="probes" elementId="calibration-list" filename="calibrations" />
    </div>
    <div id="calibration-list">
      <div class="kpi-grid" style="margin-bottom: 20px;">
        <div class="kpi-card">
          <div class="kpi-label">有效探头</div>
          <div class="kpi-value text-green">{{ summary.valid }}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">即将到期</div>
          <div class="kpi-value text-yellow">{{ summary.dueSoon }}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">已过期</div>
          <div class="kpi-value text-red">{{ summary.expired }}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">平均偏差</div>
          <div class="kpi-value text-blue">{{ summary.avgDeviation }}°C</div>
        </div>
      </div>
      <CalibrationStatus :probes="probes" />
      <div class="pagination" v-if="totalPages > 1">
        <button :disabled="page <= 1" @click="page--">上一页</button>
        <button v-for="p in displayPages" :key="p" :class="{ active: p === page }" @click="page = p">{{ p }}</button>
        <button :disabled="page >= totalPages" @click="page++">下一页</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import api from '../utils/api'
import CalibrationStatus from '../components/CalibrationStatus.vue'
import ExportPanel from '../components/ExportPanel.vue'

const probes = ref([])
const page = ref(1)
const perPage = 30
const total = ref(0)

const totalPages = computed(() => Math.ceil(total.value / perPage))
const displayPages = computed(() => {
  const pages = []
  for (let i = Math.max(1, page.value - 2); i <= Math.min(totalPages.value, page.value + 2); i++) pages.push(i)
  return pages
})

const summary = computed(() => {
  const valid = probes.value.filter(p => p.status === 'valid').length
  const dueSoon = probes.value.filter(p => p.status === 'due_soon').length
  const expired = probes.value.filter(p => p.status === 'expired').length
  const devs = probes.value.filter(p => p.deviation != null).map(p => p.deviation)
  const avgDeviation = devs.length ? (devs.reduce((a, b) => a + b, 0) / devs.length).toFixed(2) : '0.00'
  return { valid, dueSoon, expired, avgDeviation }
})

async function fetchCalibrations() {
  try {
    const res = await api.get('/calibrations', { params: { page: page.value, page_size: perPage } })
    probes.value = res.data || []
    total.value = res.meta?.total || res.data?.total || 0
  } catch {
    probes.value = []
  }
}

watch(page, fetchCalibrations)
onMounted(fetchCalibrations)
</script>
