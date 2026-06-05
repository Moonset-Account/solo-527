<script setup>
import { ref, onMounted } from 'vue'
import { getTodayRoutes } from '../../api'

const meals = ref([])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    meals.value = await getTodayRoutes()
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="page-card">
    <h2 class="card-title">餐量统计</h2>
    <div v-if="loading" class="empty-state">加载中...</div>
    <div v-else-if="!meals.length" class="empty-state">暂无数据</div>
    <table v-else class="data-table">
      <thead>
        <tr>
          <th>餐类</th>
          <th>标准餐</th>
          <th>糖尿病餐</th>
          <th>低盐餐</th>
          <th>软食餐</th>
          <th>合计</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="m in meals" :key="m.id">
          <td>{{ m.meal_type }}</td>
          <td>{{ m.standard }}</td>
          <td>{{ m.diabetic }}</td>
          <td>{{ m.low_salt }}</td>
          <td>{{ m.soft }}</td>
          <td><strong>{{ m.total }}</strong></td>
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
  text-align: center;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
}
.data-table th {
  background: #fafafa;
  color: #666;
  font-weight: 500;
}
</style>
