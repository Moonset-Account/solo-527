<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">路线分析</h1>
      <ExportPanel :data="routes" elementId="route-list" filename="routes" />
    </div>
    <FilterPanel />
    <div id="route-list">
      <table class="data-table" v-if="routes.length">
        <thead>
          <tr>
            <th>路线编号</th>
            <th>起点</th>
            <th>终点</th>
            <th>状态</th>
            <th>温度合规率</th>
            <th>异常数</th>
            <th>距离</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in routes" :key="r.id" class="clickable-row" @click="$router.push(`/routes/${r.id}`)">
            <td><strong>{{ r.name || r.id }}</strong></td>
            <td>{{ r.origin }}</td>
            <td>{{ r.destination }}</td>
            <td><span class="status-badge" :class="r.status === 'completed' ? 'badge-green' : 'badge-blue'">{{ routeStatusLabel(r.status) }}</span></td>
            <td>{{ formatPercent(r.compliance_rate) }}</td>
            <td :style="{ color: r.exception_count > 0 ? 'var(--danger)' : '' }">{{ r.exception_count || 0 }}</td>
            <td>{{ formatDistance(r.distance) }}</td>
          </tr>
        </tbody>
      </table>
      <div v-else class="empty">暂无路线数据</div>
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
import { formatPercent, formatDistance } from '../utils/format'
import FilterPanel from '../components/FilterPanel.vue'
import ExportPanel from '../components/ExportPanel.vue'

const filterStore = useFilterStore()
const routes = ref([])
const page = ref(1)
const perPage = 20
const total = ref(0)

const totalPages = computed(() => Math.ceil(total.value / perPage))
const displayPages = computed(() => {
  const pages = []
  for (let i = Math.max(1, page.value - 2); i <= Math.min(totalPages.value, page.value + 2); i++) pages.push(i)
  return pages
})

function routeStatusLabel(s) {
  return { in_transit: '运输中', completed: '已完成', planned: '计划中', cancelled: '已取消' }[s] || s
}

async function fetchRoutes() {
  try {
    const params = { page: page.value, page_size: perPage, ...filterStore.buildQueryParams() }
    const res = await api.get('/routes', { params })
    routes.value = res.data || []
    total.value = res.meta?.total || res.data?.total || 0
  } catch {
    routes.value = []
  }
}

watch(page, fetchRoutes)
watch(() => filterStore.filterParams, () => { page.value = 1; fetchRoutes() }, { deep: true })
onMounted(fetchRoutes)
</script>
