<script setup>
import { ref, onMounted } from 'vue'
import { signDelivery, failDelivery } from '../../api'

const unsignedList = ref([])
const loading = ref(false)

async function loadData() {
  loading.value = true
  try {
    const res = await signDelivery('unsigned-list')
    unsignedList.value = res
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(loadData)

async function handleSign(item) {
  try {
    await signDelivery(item.id, { action: 'sign' })
    await loadData()
  } catch (e) {
    alert('签收失败: ' + e.message)
  }
}

async function handleFail(item) {
  try {
    await failDelivery(item.id, { action: 'fail' })
    await loadData()
  } catch (e) {
    alert('操作失败: ' + e.message)
  }
}
</script>

<template>
  <div class="page-card">
    <h2 class="card-title">未签收列表</h2>
    <div v-if="loading" class="empty-state">加载中...</div>
    <div v-else-if="!unsignedList.length" class="empty-state">全部已签收</div>
    <table v-else class="data-table">
      <thead>
        <tr>
          <th>长者姓名</th>
          <th>楼栋</th>
          <th>房号</th>
          <th>配送时间</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in unsignedList" :key="item.id">
          <td>{{ item.elder_name }}</td>
          <td>{{ item.building }}</td>
          <td>{{ item.room }}</td>
          <td>{{ item.delivery_time }}</td>
          <td class="action-cell">
            <button class="btn-sign" @click="handleSign(item)">确认签收</button>
            <button class="btn-fail" @click="handleFail(item)">配送失败</button>
          </td>
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
.action-cell {
  display: flex;
  gap: 8px;
}
.btn-sign {
  padding: 4px 12px;
  border: 1px solid #389e0d;
  border-radius: 4px;
  background: #f6ffed;
  color: #389e0d;
  font-size: 13px;
  cursor: pointer;
}
.btn-sign:hover {
  background: #389e0d;
  color: #fff;
}
.btn-fail {
  padding: 4px 12px;
  border: 1px solid #cf1322;
  border-radius: 4px;
  background: #fff2f0;
  color: #cf1322;
  font-size: 13px;
  cursor: pointer;
}
.btn-fail:hover {
  background: #cf1322;
  color: #fff;
}
</style>
