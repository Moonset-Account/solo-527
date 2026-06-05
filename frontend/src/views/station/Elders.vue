<script setup>
import { ref, onMounted } from 'vue'
import { getElderDetail, updateElder, tempSuspendElder, getFamilyContacts, familyConfirm } from '../../api'

const elders = ref([])
const loading = ref(false)
const selectedElder = ref(null)
const detailVisible = ref(false)

async function loadData() {
  loading.value = true
  try {
    elders.value = await getElderDetail('list')
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(loadData)

async function showDetail(elderId) {
  try {
    selectedElder.value = await getElderDetail(elderId)
    detailVisible.value = true
  } catch (e) {
    console.error(e)
  }
}

async function handleSuspend(elder) {
  try {
    await tempSuspendElder(elder.id, { reason: '临时暂停' })
    await loadData()
    detailVisible.value = false
  } catch (e) {
    alert('操作失败: ' + e.message)
  }
}

async function handleFamilyConfirm(elder) {
  try {
    await familyConfirm(elder.id, {})
    await loadData()
  } catch (e) {
    alert('确认失败: ' + e.message)
  }
}

function closeDetail() {
  detailVisible.value = false
  selectedElder.value = null
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
          <th>餐类</th>
          <th>状态</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="e in elders" :key="e.id">
          <td>{{ e.name }}</td>
          <td>{{ e.building }}</td>
          <td>{{ e.room }}</td>
          <td>{{ e.meal_type }}</td>
          <td><span :class="['status-dot', e.active ? 'active' : 'inactive']"></span>{{ e.active ? '正常' : '暂停' }}</td>
          <td><button class="action-btn" @click="showDetail(e.id)">详情</button></td>
        </tr>
      </tbody>
    </table>

    <div v-if="detailVisible && selectedElder" class="modal-overlay" @click.self="closeDetail">
      <div class="modal-card">
        <div class="modal-header">
          <h3>{{ selectedElder.name }} - 长者详情</h3>
          <button class="close-btn" @click="closeDetail">&times;</button>
        </div>
        <div class="modal-body">
          <div class="info-row"><span class="info-label">楼栋：</span>{{ selectedElder.building }}</div>
          <div class="info-row"><span class="info-label">房号：</span>{{ selectedElder.room }}</div>
          <div class="info-row"><span class="info-label">餐类：</span>{{ selectedElder.meal_type }}</div>
          <div class="info-row"><span class="info-label">饮食禁忌：</span>{{ selectedElder.dietary_restriction }}</div>
          <div class="info-row"><span class="info-label">紧急联系人：</span>{{ selectedElder.emergency_contact }}</div>
          <div class="info-row"><span class="info-label">联系电话：</span>{{ selectedElder.emergency_phone }}</div>
        </div>
        <div class="modal-footer">
          <button class="btn-warn" @click="handleSuspend(selectedElder)">临时暂停</button>
          <button class="btn-primary" @click="handleFamilyConfirm(selectedElder)">家属确认</button>
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
.status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 6px;
}
.status-dot.active { background: #389e0d; }
.status-dot.inactive { background: #999; }
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
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-card {
  background: #fff;
  border-radius: 12px;
  width: 480px;
  max-height: 80vh;
  overflow-y: auto;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
}
.modal-header h3 {
  font-size: 16px;
  color: #1a3a5c;
}
.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #999;
}
.modal-body { padding: 20px 24px; }
.info-row {
  margin-bottom: 12px;
  font-size: 14px;
  color: #333;
}
.info-label { color: #999; }
.modal-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
}
.btn-primary {
  padding: 8px 20px;
  background: #e8912d;
  border: none;
  border-radius: 6px;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
}
.btn-warn {
  padding: 8px 20px;
  background: #fff;
  border: 1px solid #cf1322;
  border-radius: 6px;
  color: #cf1322;
  font-size: 14px;
  cursor: pointer;
}
</style>
