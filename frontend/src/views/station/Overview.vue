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
</script>

<template>
  <div class="page-card">
    <h2 class="card-title">今日路线总览</h2>
    <div v-if="loading" class="empty-state">加载中...</div>
    <div v-else-if="!routes.length" class="empty-state">暂无路线数据</div>
    <table v-else class="data-table">
      <thead>
        <tr>
          <th>路线编号</th>
          <th>配送员</th>
          <th>配送数量</th>
          <th>状态</th>
          <th>预计出发</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="r in routes" :key="r.id">
          <td>{{ r.id }}</td>
          <td>{{ r.courier_name }}</td>
          <td>{{ r.delivery_count }}</td>
          <td><span :class="['status-tag', r.status]">{{ r.status_label }}</span></td>
          <td>{{ r.estimated_departure }}</td>
        </tr>
      </tbody>
    </table>
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
.data-table {
  width: 100%;
  border-collapse: collapse;
}
.data-table th,
.data-table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
}
.data-table th {
  background: #fafafa;
  color: #666;
  font-weight: 500;
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
.status-tag.failed { background: #fff2f0; color: #cf1322; }
</style>
