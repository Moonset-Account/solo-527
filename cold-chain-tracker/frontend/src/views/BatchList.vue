<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">批次追踪</h1>
      <ExportPanel :data="batches" elementId="batch-list" filename="batches" />
    </div>
    <FilterPanel />
    <div id="batch-list">
      <table class="data-table" v-if="batches.length">
        <thead>
          <tr>
            <th>批次号</th>
            <th>产品</th>
            <th>客户</th>
            <th>车辆</th>
            <th>状态</th>
            <th>温度合规</th>
            <th>异常数</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="b in batches" :key="b.batch_id" class="clickable-row" @click="$router.push(`/batches/${b.batch_id}`)">
            <td><strong>{{ b.batch_id }}</strong></td>
            <td>{{ b.product_name || b.product }}</td>
            <td>{{ b.customer }}</td>
            <td>{{ b.vehicle_plate || b.vehicle_id }}</td>
            <td><span class="status-badge" :class="batchStatusClass(b.status)">{{ batchStatusLabel(b.status) }}</span></td>
            <td>{{ formatPercent(b.compliance_rate) }}</td>
            <td :style="{ color: b.exception_count > 0 ? 'var(--danger)' : '' }">{{ b.exception_count || 0 }}</td>
          </tr>
        </tbody>
      </table>
      <div v-else class="empty">暂无批次数据</div>
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
import { useFilterStore } from '../stores/filter'
import { formatPercent } from '../utils/format'
import FilterPanel from '../components/FilterPanel.vue'
import ExportPanel from '../components/ExportPanel.vue'

const filterStore = useFilterStore()
const batches = ref([])
const page = ref(1)
const perPage = 20
const total = ref(0)

const totalPages = computed(() => Math.ceil(total.value / perPage))
const displayPages = computed(() => {
  const pages = []
  for (let i = Math.max(1, page.value - 2); i <= Math.min(totalPages.value, page.value + 2); i++) pages.push(i)
  return pages
})

function batchStatusClass(s) {
  return { in_transit: 'badge-blue', delivered: 'badge-green', pending: 'badge-yellow', exception: 'badge-red' }[s] || 'badge-green'
}

function batchStatusLabel(s) {
  return { in_transit: '运输中', delivered: '已送达', pending: '待发运', exception: '异常' }[s] || s
}

async function fetchBatches() {
  try {
    const params = { page: page.value, page_size: perPage, ...filterStore.buildQueryParams() }
    const res = await api.get('/batches', { params })
    batches.value = res.data || []
    total.value = res.meta?.total || res.data?.total || 0
  } catch {
    batches.value = []
  }
}

watch(page, fetchBatches)
watch(() => filterStore.filterParams, () => { page.value = 1; fetchBatches() }, { deep: true })
onMounted(fetchBatches)
</script>
