<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { listElders } from '../../api'

const router = useRouter()
const elders = ref([])
const loading = ref(false)

async function loadData() {
  loading.value = true
  try {
    elders.value = await listElders({})
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(loadData)

function goToDetail(elderId) {
  router.push(`/station/elders/${elderId}`)
}
</script>

<template>
  <div class="page-card">
    <h2 class="card-title">长者管理</h2>
    <div v-if="loading" class="empty-state">加载中...</div>
    <div v-else-if="!elders.length" class="empty-state">暂无数据</div>
    <table v-else class="data-table">
      <thead>
        <tr>
          <th>姓名</th>
          <th>楼栋</th>
          <th>房号</th>
          <th>补贴余额</th>
          <th>状态</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="e in elders" :key="e.id">
          <td>{{ e.name }}</td>
          <td>{{ e.building }}</td>
          <td>{{ e.room }}</td>
          <td>¥{{ (e.subsidy_quota - e.subsidy_used).toFixed(2) }}</td>
          <td>
            <span v-if="e.is_temp_suspended" class="status-tag suspended">已停餐</span>
            <span v-else class="status-tag normal">正常</span>
          </td>
          <td><button class="action-btn" @click="goToDetail(e.id)">详情</button></td>
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
.status-tag.normal { background: #f6ffed; color: #389e0d; }
.status-tag.suspended { background: #fff2f0; color: #cf1322; }
.action-btn {
  padding: 4px 12px;
  border: 1px solid #e8912d;
  border-radius: 4px;
  background: #fff;
  color: #e8912d;
  font-size: 13px;
  cursor: pointer;
}
.action-btn:hover { background: #e8912d; color: #fff; }
</style>
