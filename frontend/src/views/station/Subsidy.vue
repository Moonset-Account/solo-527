<script setup>
import { ref, onMounted } from 'vue'
import { checkSubsidy, getSubsidyRecords, listElders } from '../../api'

const records = ref([])
const elders = ref([])
const loading = ref(false)
const searchId = ref('')

async function loadRecords() {
  loading.value = true
  try {
    elders.value = await listElders({})
    if (searchId.value) {
      records.value = await getSubsidyRecords(searchId.value)
    } else {
      records.value = []
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(loadRecords)

async function handleCheck() {
  if (!searchId.value) return
  loading.value = true
  try {
    await checkSubsidy(searchId.value, 0)
    records.value = await getSubsidyRecords(searchId.value)
  } catch (e) {
    alert('核查失败: ' + e.message)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="page-card">
    <h2 class="card-title">补贴核查</h2>
    <div class="search-bar">
      <input v-model="searchId" placeholder="输入长者ID进行核查" class="search-input" />
      <button class="btn-primary" @click="handleCheck">核查</button>
    </div>
    <div v-if="loading" class="empty-state">加载中...</div>
    <div v-else-if="!records.length" class="empty-state">暂无补贴记录</div>
    <table v-else class="data-table">
      <thead>
        <tr>
          <th>长者姓名</th>
          <th>补贴类型</th>
          <th>补贴金额</th>
          <th>发放月份</th>
          <th>状态</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="r in records" :key="r.id">
          <td>{{ r.elder_name }}</td>
          <td>{{ r.subsidy_type }}</td>
          <td>¥{{ r.amount }}</td>
          <td>{{ r.month }}</td>
          <td><span :class="['status-tag', r.status]">{{ r.status_label }}</span></td>
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
.search-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}
.search-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
}
.search-input:focus { border-color: #e8912d; }
.btn-primary {
  padding: 8px 20px;
  background: #e8912d;
  border: none;
  border-radius: 6px;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
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
.status-tag.approved { background: #f6ffed; color: #389e0d; }
.status-tag.pending { background: #fff7e6; color: #d48806; }
.status-tag.rejected { background: #fff2f0; color: #cf1322; }
</style>
