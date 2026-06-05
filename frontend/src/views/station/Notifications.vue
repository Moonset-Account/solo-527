<script setup>
import { ref, onMounted } from 'vue'
import { getNotifications, retryPendingNotifications } from '../../api'

const notifications = ref([])
const loading = ref(false)

async function loadData() {
  loading.value = true
  try {
    notifications.value = await getNotifications({})
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(loadData)

async function handleRetry(item) {
  try {
    await retryPendingNotifications()
    await loadData()
  } catch (e) {
    alert('重试失败: ' + e.message)
  }
}
</script>

<template>
  <div class="page-card">
    <h2 class="card-title">通知管理</h2>
    <div v-if="loading" class="empty-state">加载中...</div>
    <div v-else-if="!notifications.length" class="empty-state">暂无通知</div>
    <table v-else class="data-table">
      <thead>
        <tr>
          <th>通知类型</th>
          <th>接收人</th>
          <th>发送时间</th>
          <th>状态</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="n in notifications" :key="n.id">
          <td>{{ n.type }}</td>
          <td>{{ n.recipient }}</td>
          <td>{{ n.sent_at }}</td>
          <td><span :class="['status-tag', n.status]">{{ n.status_label }}</span></td>
          <td>
            <button v-if="n.status === 'failed'" class="action-btn" @click="handleRetry(n)">重试</button>
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
.status-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}
.status-tag.sent { background: #f6ffed; color: #389e0d; }
.status-tag.pending { background: #fff7e6; color: #d48806; }
.status-tag.failed { background: #fff2f0; color: #cf1322; }
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
