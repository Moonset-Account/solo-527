<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getRouteOverview } from '../../api'

const route = useRoute()
const overview = ref(null)
const loading = ref(false)

onMounted(async () => {
  const routeId = route.query.routeId
  if (!routeId) return
  loading.value = true
  try {
    overview.value = await getRouteOverview(routeId)
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="page-card">
    <h2 class="card-title">路线楼栋概览</h2>
    <div v-if="!route.query.routeId" class="empty-state">请从路线总览选择路线</div>
    <div v-else-if="loading" class="empty-state">加载中...</div>
    <div v-else-if="!overview" class="empty-state">暂无数据</div>
    <template v-else>
      <div class="route-meta">
        <span>{{ overview.route_name }}</span>
        <span>总餐品: {{ overview.total_meals }}</span>
        <span>忌口冲突: <span class="warn">{{ overview.total_conflicts }}</span></span>
      </div>

      <div v-if="overview.cold_box" class="coldbox-banner" :class="{ abnormal: overview.cold_box.is_abnormal }">
        🧊 保温箱 {{ overview.cold_box.serial_number }}：{{ overview.cold_box.current_temp }}°C
        <span v-if="overview.cold_box.is_abnormal" class="abnormal-tag">异常</span>
        <span v-else class="normal-tag">正常</span>
      </div>

      <h3 class="sub-title">楼栋详情</h3>
      <div class="building-grid">
        <div v-for="b in overview.buildings" :key="b.building" class="building-card">
          <div class="building-name">{{ b.building }}</div>
          <div class="building-stats">
            <div class="stat-item">
              <span class="stat-label">老人数</span>
              <span class="stat-value">{{ b.elder_count }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">餐品数</span>
              <span class="stat-value">{{ b.meal_count }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">忌口冲突</span>
              <span class="stat-value warn">{{ b.dietary_conflicts }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">未签收</span>
              <span class="stat-value warn">{{ b.unsigned_count }}</span>
            </div>
          </div>
        </div>
      </div>

      <h3 class="sub-title">未签收名单</h3>
      <div v-if="!overview.unsigned_list.length" class="empty-state small">全部已签收</div>
      <table v-else class="data-table">
        <thead>
          <tr><th>姓名</th><th>楼栋</th><th>房间</th></tr>
        </thead>
        <tbody>
          <tr v-for="u in overview.unsigned_list" :key="u.delivery_id">
            <td>{{ u.elder_name }}</td>
            <td>{{ u.building }}</td>
            <td>{{ u.room }}</td>
          </tr>
        </tbody>
      </table>
    </template>
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
.route-meta {
  display: flex;
  gap: 20px;
  font-size: 14px;
  color: #666;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}
.warn { color: #d48806; font-weight: 600; }
.coldbox-banner {
  padding: 10px 16px;
  background: #f0f5ff;
  border-radius: 6px;
  margin-bottom: 16px;
  font-size: 13px;
}
.coldbox-banner.abnormal { background: #fff2f0; }
.abnormal-tag { color: #cf1322; font-weight: 600; margin-left: 4px; }
.normal-tag { color: #389e0d; margin-left: 4px; }
.sub-title {
  font-size: 14px;
  font-weight: 600;
  color: #1a3a5c;
  margin: 16px 0 10px;
}
.building-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
}
.building-card {
  background: #fafafa;
  border-radius: 8px;
  padding: 14px;
  border: 1px solid #f0f0f0;
}
.building-name {
  font-size: 15px;
  font-weight: 600;
  color: #1a3a5c;
  margin-bottom: 10px;
}
.building-stats {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.stat-item {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}
.stat-label { color: #999; }
.stat-value { font-weight: 500; color: #333; }
.stat-value.warn { color: #d48806; }
.empty-state {
  text-align: center;
  padding: 40px 0;
  color: #999;
  font-size: 14px;
}
.empty-state.small { padding: 16px 0; }
.data-table {
  width: 100%;
  border-collapse: collapse;
}
.data-table th, .data-table td {
  padding: 8px 12px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
  font-size: 13px;
}
.data-table th {
  background: #fafafa;
  color: #666;
  font-weight: 500;
}
</style>
