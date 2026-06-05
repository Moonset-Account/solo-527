<script setup>
import { ref, onMounted } from 'vue'
import { getReconciliation } from '../../api'

const records = ref([])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    records.value = await getReconciliation({})
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="page-card">
    <h2 class="card-title">对账管理</h2>
    <div v-if="loading" class="empty-state">加载中...</div>
    <div v-else-if="!records.length" class="empty-state">暂无对账数据</div>
    <table v-else class="data-table">
      <thead>
        <tr>
          <th>日期</th>
          <th>配送单数</th>
          <th>签收数</th>
          <th>补贴总额</th>
          <th>自费总额</th>
          <th>差异</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="r in records" :key="r.id">
          <td>{{ r.date }}</td>
          <td>{{ r.total_count }}</td>
          <td>{{ r.signed_count }}</td>
          <td>¥{{ r.subsidy_total }}</td>
          <td>¥{{ r.self_pay_total }}</td>
          <td :class="{ 'text-danger': r.diff !== 0 }">{{ r.diff === 0 ? '无差异' : '¥' + r.diff }}</td>
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
.text-danger { color: #cf1322; font-weight: 600; }
</style>
