<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">车辆监控</h1>
      <ExportPanel :data="vehicles" elementId="vehicle-list" filename="vehicles" />
    </div>
    <FilterPanel />
    <div id="vehicle-list">
      <table class="data-table" v-if="vehicles.length">
        <thead>
          <tr>
            <th>车牌号</th>
            <th>状态</th>
            <th>当前温度</th>
            <th>异常数</th>
            <th>合规率</th>
            <th>当前位置</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="v in vehicles" :key="v.id" class="clickable-row" @click="goDetail(v.id)">
            <td><strong>{{ v.plate_number }}</strong></td>
            <td>
              <span class="status-badge" :class="statusClass(v.status)">{{ statusLabel(v.status) }}</span>
            </td>
            <td>{{ formatTemp(v.current_temperature) }}</td>
            <td :style="{ color: v.exception_count > 0 ? 'var(--danger)' : '' }">{{ v.exception_count || 0 }}</td>
            <td>{{ formatPercent(v.compliance_rate) }}</td>
            <td>{{ formatGPS(v.latitude, v.longitude) }}</td>
          </tr>
        </tbody>
      </table>
      <div v-else class="empty">暂无车辆数据</div>
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
import { useRouter } from 'vue-router'
import api from '../utils/api'
import { useFilterStore } from '../stores/filter'
import { formatTemp, formatPercent, formatGPS } from '../utils/format'
import FilterPanel from '../components/FilterPanel.vue'
import ExportPanel from '../components/ExportPanel.vue'

const router = useRouter()
const filterStore = useFilterStore()
const vehicles = ref([])
const page = ref(1)
const perPage = 20
const total = ref(0)

const totalPages = computed(() => Math.ceil(total.value / perPage))
const displayPages = computed(() => {
  const pages = []
  const tp = totalPages.value
  for (let i = Math.max(1, page.value - 2); i <= Math.min(tp, page.value + 2); i++) pages.push(i)
  return pages
})

function statusClass(s) {
  return { in_transit: 'badge-green', idle: 'badge-blue', maintenance: 'badge-yellow', offline: 'badge-red' }[s] || 'badge-green'
}

function statusLabel(s) {
  return { in_transit: '运输中', idle: '空闲', maintenance: '维修中', offline: '离线' }[s] || s
}

function goDetail(id) { router.push(`/vehicles/${id}`) }

async function fetchVehicles() {
  try {
    const params = { page: page.value, page_size: perPage, ...filterStore.buildQueryParams() }
    const res = await api.get('/vehicles', { params })
    vehicles.value = res.data || []
    total.value = res.meta?.total || res.data?.total || 0
  } catch {
    vehicles.value = []
  }
}

watch(page, fetchVehicles)
watch(() => filterStore.filterParams, () => { page.value = 1; fetchVehicles() }, { deep: true })
onMounted(fetchVehicles)
</script>
