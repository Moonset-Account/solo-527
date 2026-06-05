<script setup>
import { ref, onMounted } from 'vue'
import { getRouteOverview } from '../../api'

const buildings = ref([])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    buildings.value = await getRouteOverview('today')
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="page-card">
    <h2 class="card-title">楼栋概览</h2>
    <div v-if="loading" class="empty-state">加载中...</div>
    <div v-else-if="!buildings.length" class="empty-state">暂无楼栋数据</div>
    <div v-else class="building-grid">
      <div v-for="b in buildings" :key="b.id" class="building-card">
        <div class="building-name">{{ b.name }}</div>
        <div class="building-stats">
          <div class="stat-item">
            <span class="stat-label">配送数</span>
            <span class="stat-value">{{ b.delivery_count }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">已签收</span>
            <span class="stat-value success">{{ b.signed_count }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">未签收</span>
            <span class="stat-value warning">{{ b.unsigned_count }}</span>
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
.building-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}
.building-card {
  background: #fafafa;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #f0f0f0;
}
.building-name {
  font-size: 15px;
  font-weight: 600;
  color: #1a3a5c;
  margin-bottom: 12px;
}
.building-stats {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.stat-item {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}
.stat-label { color: #999; }
.stat-value { font-weight: 500; color: #333; }
.stat-value.success { color: #389e0d; }
.stat-value.warning { color: #d48806; }
</style>
