<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">异常管理</h1>
      <ExportPanel :data="exceptions" elementId="exception-list" filename="exceptions" />
    </div>
    <FilterPanel />
    <div id="exception-list">
      <table class="data-table" v-if="exceptions.length">
        <thead>
          <tr>
            <th class="sortable" @click="toggleSort('started_at')">时间 {{ sortIcon('started_at') }}</th>
            <th>异常类型</th>
            <th class="sortable" @click="toggleSort('severity')">严重程度 {{ sortIcon('severity') }}</th>
            <th>车辆</th>
            <th>路线</th>
            <th>批次</th>
            <th>持续时长</th>
            <th>状态</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="ex in exceptions" :key="ex.exception_id" class="clickable-row" @click="$router.push(`/exceptions/${ex.exception_id}`)">
            <td>{{ formatDatetime(ex.started_at) }}</td>
            <td>{{ ex.exception_type }}</td>
            <td><span class="status-badge" :class="sevClass(ex.severity)">{{ sevLabel(ex.severity) }}</span></td>
            <td>{{ ex.vehicle_id }}</td>
            <td>{{ ex.route_name || ex.route_id }}</td>
            <td>{{ ex.batch_code || ex.batch_id }}</td>
            <td>{{ formatDuration(ex.duration_minutes || ex.duration) }}</td>
            <td><span class="status-badge" :class="ex.resolution ? 'badge-green' : 'badge-red'">{{ ex.resolution ? '已解决' : '未解决' }}</span></td>
          </tr>
        </tbody>
      </table>
      <div v-else class="empty">暂无异常数据</div>
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
import { formatDatetime, formatDuration } from '../utils/format'
import FilterPanel from '../components/FilterPanel.vue'
import ExportPanel from '../components/ExportPanel.vue'

const filterStore = useFilterStore()
const exceptions = ref([])
const page = ref(1)
const perPage = 20
const total = ref(0)
const sortField = ref('started_at')
const sortOrder = ref('desc')

const totalPages = computed(() => Math.ceil(total.value / perPage))
const displayPages = computed(() => {
  const pages = []
  for (let i = Math.max(1, page.value - 2); i <= Math.min(totalPages.value, page.value + 2); i++) pages.push(i)
  return pages
})

function sevClass(s) { return { critical: 'badge-red', major: 'badge-yellow', minor: 'badge-blue' }[s] || 'badge-green' }
function sevLabel(s) { return { critical: '严重', major: '重要', minor: '轻微' }[s] || s }

function toggleSort(field) {
  if (sortField.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortOrder.value = 'desc'
  }
  fetchExceptions()
}

function sortIcon(field) {
  if (sortField.value !== field) return ''
  return sortOrder.value === 'asc' ? '↑' : '↓'
}

async function fetchExceptions() {
  try {
    const params = {
      page: page.value,
      page_size: perPage,
      sort_by: sortField.value,
      sort_order: sortOrder.value,
      ...filterStore.buildQueryParams()
    }
    const res = await api.get('/exceptions', { params })
    exceptions.value = res.data || []
    total.value = res.meta?.total || res.data?.total || 0
  } catch {
    exceptions.value = []
  }
}

watch(page, fetchExceptions)
watch(() => filterStore.filterParams, () => { page.value = 1; fetchExceptions() }, { deep: true })
onMounted(fetchExceptions)
</script>
