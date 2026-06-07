<template>
  <div class="filter-panel" :class="{ collapsed: isCollapsed }">
    <div class="filter-header" @click="isCollapsed = !isCollapsed">
      <span class="filter-title">
        筛选条件
        <span v-if="store.activeFilterCount" class="filter-badge">{{ store.activeFilterCount }}</span>
      </span>
      <span class="toggle-icon">{{ isCollapsed ? '▼' : '▲' }}</span>
    </div>
    <div v-show="!isCollapsed" class="filter-body">
      <div class="filter-row">
        <div class="filter-group">
          <label>日期范围</label>
          <div class="date-range">
            <input type="date" v-model="startDate" class="filter-input" />
            <span>至</span>
            <input type="date" v-model="endDate" class="filter-input" />
          </div>
        </div>
        <div class="filter-group">
          <label>车辆</label>
          <select multiple v-model="store.selectedVehicle" class="filter-select">
            <option v-for="v in vehicleOptions" :key="v.vehicle_id" :value="v.vehicle_id">{{ v.plate_number }}</option>
          </select>
        </div>
        <div class="filter-group">
          <label>路线</label>
          <select multiple v-model="store.selectedRoute" class="filter-select">
            <option v-for="r in routeOptions" :key="r.route_id" :value="r.route_id">{{ r.route_id }} {{ r.origin }}→{{ r.destination }}</option>
          </select>
        </div>
        <div class="filter-group">
          <label>批次</label>
          <select multiple v-model="store.selectedBatch" class="filter-select">
            <option v-for="b in batchOptions" :key="b.batch_id" :value="b.batch_id">{{ b.batch_id }} {{ b.product_name }}</option>
          </select>
        </div>
      </div>
      <div class="filter-row">
        <div class="filter-group">
          <label>异常类型</label>
          <select v-model="store.exceptionType" class="filter-input">
            <option value="">全部</option>
            <option v-for="t in filterOptions.exceptionTypes" :key="t.value" :value="t.value">{{ t.label }}</option>
          </select>
        </div>
        <div class="filter-group">
          <label>严重程度</label>
          <select v-model="store.severity" class="filter-input">
            <option value="">全部</option>
            <option v-for="s in filterOptions.severities" :key="s.value" :value="s.value">{{ s.label }}</option>
          </select>
        </div>
        <div class="filter-group">
          <label>客户</label>
          <select multiple v-model="store.selectedCustomer" class="filter-select">
            <option v-for="c in customerOptions" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>
        <div class="filter-actions">
          <button class="btn btn-primary" @click="applyFilters">应用</button>
          <button class="btn btn-secondary" @click="clearAll">清除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useFilterStore } from '../stores/filter'
import { useFilter } from '../composables/useFilter'
import api from '../utils/api'

const store = useFilterStore()
const { filterOptions, applyFilters: doApply, clearAll } = useFilter()
const isCollapsed = ref(false)

const startDate = ref('')
const endDate = ref('')
const vehicleOptions = ref([])
const routeOptions = ref([])
const batchOptions = ref([])
const customerOptions = ref([])

function applyFilters() {
  if (startDate.value && endDate.value) {
    store.setFilter('dateRange', [startDate.value, endDate.value])
  } else {
    store.setFilter('dateRange', null)
  }
  doApply()
}

onMounted(async () => {
  try {
    const [vehicles, routes, batches] = await Promise.all([
      api.get('/vehicles', { params: { page_size: 100 } }),
      api.get('/routes', { params: { page_size: 100 } }),
      api.get('/batches', { params: { page_size: 100 } })
    ])
    vehicleOptions.value = vehicles.data || []
    routeOptions.value = routes.data || []
    batchOptions.value = batches.data || []
    const customers = new Set()
    batchOptions.value.forEach(b => { if (b.customer) customers.add(b.customer) })
    customerOptions.value = [...customers]
  } catch {
    // silences
  }
})
</script>
