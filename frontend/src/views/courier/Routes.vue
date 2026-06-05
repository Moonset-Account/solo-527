<script setup>
import { ref, onMounted } from 'vue'
import { getTodayRoutes } from '../../api'

const routes = ref([])
const loading = ref(false)

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
    <div v-else class="route-list">
      <div v-for="r in routes" :key="r.id" class="route-card">
        <div class="route-header">
          <span class="route-id">路线 #{{ r.id }}</span>
          <span :class="['status-tag', r.status]">{{ r.status_label }}</span>
        </div>
        <div class="route-body">
          <div class="route-info">
            <span class="info-label">配送数量：</span>{{ r.delivery_count }}
          </div>
          <div class="route-info">
            <span class="info-label">预计出发：</span>{{ r.estimated_departure }}
          </div>
          <div v-if="r.courier_phone" class="route-info">
            <span class="info-label">联系电话：</span>{{ maskPhone(r.courier_phone) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-card {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
}
.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a3a5c;
  margin-bottom: 16px;
}
.empty-state {
  text-align: center;
  padding: 40px 0;
  color: #999;
  font-size: 14px;
}
.route-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.route-card {
  background: #fafafa;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #f0f0f0;
}
.route-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}
.route-id {
  font-weight: 600;
  color: #1a3a5c;
}
.status-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}
.status-tag.pending { background: #fff7e6; color: #d48806; }
.status-tag.in_progress { background: #e6f7ff; color: #0958d9; }
.status-tag.completed { background: #f6ffed; color: #389e0d; }
.route-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.route-info {
  font-size: 13px;
  color: #666;
}
.info-label { color: #999; }
</style>
