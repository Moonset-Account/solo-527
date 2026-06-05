<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getTodayDashboard } from '../../api'

const router = useRouter()
const dashboard = ref(null)
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    dashboard.value = await getTodayDashboard()
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})

function goToElderDetail(elderId) {
  router.push(`/station/elders/${elderId}`)
}

function goToRouteOverview(routeId) {
  router.push(`/station/building?routeId=${routeId}`)
}

const statusMap = {
  planned: '已规划',
  assigned: '已分配',
  in_progress: '配送中',
  completed: '已完成',
}
</script>

<template>
  <div class="dashboard" v-if="!loading && dashboard">
    <div class="summary-cards">
      <div class="summary-card">
        <div class="summary-icon meals">🍱</div>
        <div class="summary-info">
          <div class="summary-value">{{ dashboard.total_meals }}</div>
          <div class="summary-label">今日餐品数量</div>
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-icon conflicts">⚠️</div>
        <div class="summary-info">
          <div class="summary-value warn">{{ dashboard.total_conflicts }}</div>
          <div class="summary-label">忌口冲突</div>
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-icon coldbox">🧊</div>
        <div class="summary-info">
          <div class="summary-value" :class="{ danger: dashboard.cold_box_abnormal_count > 0 }">{{ dashboard.cold_box_abnormal_count }}</div>
          <div class="summary-label">低温箱异常</div>
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-icon unsigned">📋</div>
        <div class="summary-info">
          <div class="summary-value warn">{{ dashboard.unsigned_list.length }}</div>
          <div class="summary-label">未签收</div>
        </div>
      </div>
    </div>

    <div class="section">
      <h3 class="section-title">今日路线</h3>
      <div v-if="!dashboard.routes.length" class="empty-hint">暂无路线</div>
      <table v-else class="data-table">
        <thead>
          <tr>
            <th>路线名称</th>
            <th>配送员</th>
            <th>停靠点</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in dashboard.routes" :key="r.id">
            <td>{{ r.name }}</td>
            <td>{{ r.courier_name || '未分配' }}</td>
            <td>{{ r.total_stops }}</td>
            <td><span :class="['status-tag', r.status]">{{ statusMap[r.status] || r.status }}</span></td>
            <td><button class="action-btn" @click="goToRouteOverview(r.id)">查看详情</button></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="two-col">
      <div class="section">
        <h3 class="section-title">楼栋概览</h3>
        <div v-if="!dashboard.buildings.length" class="empty-hint">暂无楼栋数据</div>
        <div v-else class="building-grid">
          <div v-for="b in dashboard.buildings" :key="b.building" class="building-card">
            <div class="building-name">{{ b.building }}</div>
            <div class="building-stats">
              <div class="stat-row"><span>老人数</span><span>{{ b.elder_count }}</span></div>
              <div class="stat-row"><span>餐品数</span><span>{{ b.meal_count }}</span></div>
              <div class="stat-row"><span class="warn-text">忌口冲突</span><span class="warn-text">{{ b.dietary_conflicts }}</span></div>
              <div class="stat-row"><span class="warn-text">未签收</span><span class="warn-text">{{ b.unsigned_count }}</span></div>
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <h3 class="section-title">低温箱异常</h3>
        <div v-if="!dashboard.cold_box_abnormal_list.length" class="empty-hint ok">✓ 全部正常</div>
        <div v-else class="coldbox-list">
          <div v-for="cb in dashboard.cold_box_abnormal_list" :key="cb.id" class="coldbox-alert">
            <span class="alert-icon">🔴</span>
            <span>{{ cb.serial_number }}</span>
            <span class="temp-value">{{ cb.current_temp }}°C</span>
          </div>
        </div>

        <h3 class="section-title" style="margin-top:20px">未签收名单</h3>
        <div v-if="!dashboard.unsigned_list.length" class="empty-hint ok">✓ 全部已签收</div>
        <table v-else class="data-table compact">
          <thead>
            <tr><th>姓名</th><th>楼栋</th><th>房间</th><th>操作</th></tr>
          </thead>
          <tbody>
            <tr v-for="u in dashboard.unsigned_list" :key="u.delivery_id">
              <td>{{ u.elder_name }}</td>
              <td>{{ u.building }}</td>
              <td>{{ u.room }}</td>
              <td><button class="action-btn sm" @click="goToElderDetail(u.elder_id)">详情</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <div v-else class="loading-state">加载中...</div>
</template>

<style scoped>
.dashboard { padding: 0; }
.summary-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}
.summary-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.summary-icon { font-size: 28px; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; border-radius: 8px; }
.summary-icon.meals { background: #e6f7ff; }
.summary-icon.conflicts { background: #fff7e6; }
.summary-icon.coldbox { background: #f0f5ff; }
.summary-icon.unsigned { background: #fff1f0; }
.summary-value { font-size: 28px; font-weight: 700; color: #1a3a5c; }
.summary-value.warn { color: #d48806; }
.summary-value.danger { color: #cf1322; }
.summary-label { font-size: 13px; color: #999; margin-top: 2px; }

.section {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #1a3a5c;
  margin-bottom: 14px;
  padding-bottom: 8px;
  border-bottom: 2px solid #e8912d;
}
.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #f0f0f0; font-size: 13px; }
.data-table th { background: #fafafa; color: #666; font-weight: 500; }
.data-table.compact th, .data-table.compact td { padding: 6px 8px; font-size: 12px; }

.status-tag { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
.status-tag.planned { background: #f0f0f0; color: #666; }
.status-tag.assigned { background: #e6f7ff; color: #0958d9; }
.status-tag.in_progress { background: #fff7e6; color: #d48806; }
.status-tag.completed { background: #f6ffed; color: #389e0d; }

.building-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 10px; }
.building-card { background: #fafafa; border-radius: 6px; padding: 12px; border: 1px solid #f0f0f0; }
.building-name { font-size: 14px; font-weight: 600; color: #1a3a5c; margin-bottom: 8px; }
.building-stats { display: flex; flex-direction: column; gap: 3px; }
.stat-row { display: flex; justify-content: space-between; font-size: 12px; color: #666; }
.warn-text { color: #d48806; font-weight: 500; }

.coldbox-list { display: flex; flex-direction: column; gap: 8px; }
.coldbox-alert { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #fff2f0; border-radius: 6px; font-size: 13px; }
.alert-icon { font-size: 14px; }
.temp-value { color: #cf1322; font-weight: 600; }

.empty-hint { text-align: center; padding: 20px 0; color: #999; font-size: 13px; }
.empty-hint.ok { color: #389e0d; }
.loading-state { text-align: center; padding: 60px 0; color: #999; font-size: 14px; }

.action-btn {
  padding: 4px 12px;
  border: 1px solid #e8912d;
  border-radius: 4px;
  background: #fff;
  color: #e8912d;
  font-size: 12px;
  cursor: pointer;
}
.action-btn:hover { background: #e8912d; color: #fff; }
.action-btn.sm { padding: 2px 8px; font-size: 11px; }
</style>
