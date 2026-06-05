<script setup>
import { ref, onMounted } from 'vue'
import { getTodayRoutes } from '../../api'

const routes = ref([])
const loading = ref(false)
const selectedRoute = ref(null)

const statusMap = {
  planned: '已规划',
  assigned: '已分配',
  in_progress: '配送中',
  completed: '已完成',
}

onMounted(async () => {
  loading.value = true
  try {
    routes.value = await getTodayRoutes()
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})

function selectRoute(r) {
  selectedRoute.value = r
}

function maskPhone(phone) {
  if (!phone) return ''
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}
</script>

<template>
  <div class="page-card">
    <h2 class="card-title">配送路线</h2>
    <div v-if="loading" class="empty-state">加载中...</div>
    <div v-else-if="!routes.length" class="empty-state">暂无路线</div>
    <template v-else>
      <div v-if="!selectedRoute" class="route-list">
        <div v-for="r in routes" :key="r.id" class="route-card" @click="selectRoute(r)">
          <div class="route-header">
            <span class="route-name">{{ r.name }}</span>
            <span :class="['status-tag', r.status]">{{ statusMap[r.status] || r.status }}</span>
          </div>
          <div class="route-body">
            <div class="route-info"><span class="info-label">配送员：</span>{{ r.courier_name || '未分配' }}</div>
            <div class="route-info"><span class="info-label">停靠点：</span>{{ r.total_stops }}</div>
          </div>
        </div>
      </div>
      <div v-else>
        <button class="btn-back" @click="selectedRoute = null">← 返回路线列表</button>
        <h3 class="sub-title">{{ selectedRoute.name }} - 停靠详情</h3>
        <div class="stop-list">
          <div v-for="stop in selectedRoute.stops" :key="stop.id" class="stop-card">
            <div class="stop-order">{{ stop.stop_order }}</div>
            <div class="stop-info">
              <div class="stop-name">{{ stop.elder_name || '未知' }}</div>
              <div class="stop-building">{{ stop.building }}</div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.page-card { background: #fff; border-radius: 8px; padding: 24px; }
.card-title { font-size: 16px; font-weight: 600; color: #1a3a5c; margin-bottom: 16px; }
.empty-state { text-align: center; padding: 40px 0; color: #999; font-size: 14px; }
.route-list { display: flex; flex-direction: column; gap: 12px; }
.route-card { background: #fafafa; border-radius: 8px; padding: 16px; border: 1px solid #f0f0f0; cursor: pointer; transition: border-color 0.2s; }
.route-card:hover { border-color: #e8912d; }
.route-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
.route-name { font-weight: 600; color: #1a3a5c; }
.status-tag { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
.status-tag.planned { background: #f0f0f0; color: #666; }
.status-tag.assigned { background: #e6f7ff; color: #0958d9; }
.status-tag.in_progress { background: #fff7e6; color: #d48806; }
.status-tag.completed { background: #f6ffed; color: #389e0d; }
.route-body { display: flex; flex-direction: column; gap: 4px; }
.route-info { font-size: 13px; color: #666; }
.info-label { color: #999; }
.btn-back { padding: 4px 12px; border: 1px solid #d9d9d9; border-radius: 4px; background: #fff; cursor: pointer; font-size: 13px; color: #666; margin-bottom: 12px; }
.btn-back:hover { color: #e8912d; border-color: #e8912d; }
.sub-title { font-size: 14px; font-weight: 600; color: #1a3a5c; margin-bottom: 12px; }
.stop-list { display: flex; flex-direction: column; gap: 8px; }
.stop-card { display: flex; align-items: center; gap: 12px; padding: 10px 14px; background: #fafafa; border-radius: 6px; border: 1px solid #f0f0f0; }
.stop-order { width: 28px; height: 28px; border-radius: 50%; background: #e8912d; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; }
.stop-info { flex: 1; }
.stop-name { font-size: 14px; font-weight: 500; color: #1a3a5c; }
.stop-building { font-size: 12px; color: #999; }
</style>
