<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getTodayDashboard, failDelivery, getRouteDeliveries } from '../../api'

const router = useRouter()
const unsignedList = ref([])
const loading = ref(false)
const failVisible = ref(null)
const failNote = ref('')

async function loadData() {
  loading.value = true
  try {
    const dash = await getTodayDashboard()
    unsignedList.value = dash.unsigned_list || []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(loadData)

async function handleSign(item) {
  router.push(`/station/elders/${item.elder_id}`)
}

function openFail(item) {
  failVisible.value = item.delivery_id
  failNote.value = ''
}

async function confirmFail(item) {
  try {
    await failDelivery(item.delivery_id, { exception_note: failNote.value || '配送失败' })
    failVisible.value = null
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
          <th>房间</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in unsignedList" :key="item.delivery_id">
          <td>{{ item.elder_name }}</td>
          <td>{{ item.building }}</td>
          <td>{{ item.room }}</td>
          <td class="action-cell">
            <button class="btn-sign" @click="handleSign(item)">查看详情</button>
            <button class="btn-fail" @click="openFail(item)">配送失败</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="failVisible" class="modal-overlay" @click.self="failVisible = null">
      <div class="modal-content">
        <h3>标记配送失败</h3>
        <div class="form-group">
          <label>失败原因</label>
          <textarea v-model="failNote" class="form-input" placeholder="请输入配送失败原因"></textarea>
        </div>
        <div class="modal-actions">
          <button class="btn-danger" @click="confirmFail({ delivery_id: failVisible })">确认失败</button>
          <button class="btn-cancel" @click="failVisible = null">取消</button>
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
.action-cell {
  display: flex;
  gap: 8px;
}
.btn-sign {
  padding: 4px 12px;
  border: 1px solid #e8912d;
  border-radius: 4px;
  background: #fff;
  color: #e8912d;
  font-size: 13px;
  cursor: pointer;
}
.btn-sign:hover { background: #e8912d; color: #fff; }
.btn-fail {
  padding: 4px 12px;
  border: 1px solid #cf1322;
  border-radius: 4px;
  background: #fff2f0;
  color: #cf1322;
  font-size: 13px;
  cursor: pointer;
}
.btn-fail:hover { background: #cf1322; color: #fff; }
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
.modal-content {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  min-width: 380px;
}
.modal-content h3 { font-size: 16px; color: #1a3a5c; margin-bottom: 16px; }
.form-group { margin-bottom: 12px; }
.form-group label { display: block; font-size: 13px; color: #666; margin-bottom: 4px; }
.form-input {
  width: 100%;
  padding: 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 13px;
  resize: vertical;
  min-height: 60px;
  outline: none;
}
.form-input:focus { border-color: #e8912d; }
.modal-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px; }
.btn-danger {
  padding: 6px 16px;
  background: #cf1322;
  border: none;
  border-radius: 4px;
  color: #fff;
  font-size: 13px;
  cursor: pointer;
}
.btn-cancel {
  padding: 6px 16px;
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
}
</style>
