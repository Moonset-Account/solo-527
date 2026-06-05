<template>
  <div class="mobile-offline">
    <div class="status-bar" :class="{ online: isOnline }">
      <van-icon :name="isOnline ? 'wifi' : 'wifi-off'" />
      <span>{{ isOnline ? '网络已连接' : '当前离线' }}</span>
    </div>
    
    <div class="stats">
      <div class="stat-item">
        <div class="stat-value">{{ pendingCount }}</div>
        <div class="stat-label">待提交</div>
      </div>
      <div class="stat-item success">
        <div class="stat-value">{{ successCount }}</div>
        <div class="stat-label">已成功</div>
      </div>
      <div class="stat-item danger">
        <div class="stat-value">{{ failedCount }}</div>
        <div class="stat-label">失败</div>
      </div>
    </div>
    
    <div class="actions">
      <van-button
        type="primary"
        icon="arrow-up"
        :disabled="pendingCount === 0 || !isOnline"
        @click="submitAll"
      >
        全部提交
      </van-button>
      <van-button icon="refresh" @click="loadQueue">刷新</van-button>
    </div>
    
    <van-divider>待提交队列</van-divider>
    
    <van-empty v-if="queue.length === 0" description="暂无离线数据" />
    
    <div v-for="(item, idx) in queue" :key="idx" class="queue-item">
      <div class="item-header">
        <span class="item-type">{{ getItemTypeLabel(item.type) }}</span>
        <van-tag :type="getStatusType(item.status)" size="small">
          {{ item.status === 'pending' ? '待提交' : item.status === 'success' ? '成功' : '失败' }}
        </van-tag>
      </div>
      <div class="item-time">{{ formatTime(item.createdAt) }}</div>
      <div class="item-data">{{ JSON.stringify(item.data).slice(0, 80) }}...</div>
      <div class="item-actions">
        <van-button
          v-if="item.status === 'pending'"
          size="small"
          type="primary"
          @click="submitItem(idx)"
        >
          提交
        </van-button>
        <van-button
          v-if="item.status === 'failed'"
          size="small"
          type="warning"
          @click="retryItem(idx)"
        >
          重试
        </van-button>
        <van-button size="small" type="danger" @click="removeItem(idx)">删除</van-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { showToast, showConfirmDialog } from 'vant'
import { getOfflineQueue, clearCompletedQueue, processOfflineQueue, removeFromOfflineQueue } from '@/utils/offline'

const isOnline = ref(navigator.onLine)
const queue = ref([])

const pendingCount = computed(() => queue.value.filter(i => i.status === 'pending').length)
const successCount = computed(() => queue.value.filter(i => i.status === 'success').length)
const failedCount = computed(() => queue.value.filter(i => i.status === 'failed').length)

const getItemTypeLabel = (type) => {
  const labels = {
    create_reservation: '创建预留',
    create_member: '创建会员',
    check_in: '活动签到',
    stock_in: '入库',
    stock_out: '出库'
  }
  return labels[type] || type
}

const getStatusType = (status) => {
  return { pending: 'warning', success: 'success', failed: 'danger' }[status] || 'default'
}

const formatTime = (ts) => {
  return new Date(ts).toLocaleString()
}

const loadQueue = async () => {
  queue.value = await getOfflineQueue()
}

const submitAll = async () => {
  try {
    await showConfirmDialog({ title: '提示', message: '确定提交所有离线数据吗？' })
    await processOfflineQueue()
    showToast('提交完成')
    loadQueue()
  } catch (e) {}
}

const submitItem = async (idx) => {
  showToast('提交中...')
  loadQueue()
}

const retryItem = async (idx) => {
  queue.value[idx].status = 'pending'
  showToast('已标记为重试')
}

const removeItem = async (idx) => {
  try {
    await showConfirmDialog({ title: '提示', message: '确定删除这条记录吗？' })
    await removeFromOfflineQueue(idx)
    loadQueue()
    showToast('已删除')
  } catch (e) {}
}

onMounted(() => {
  loadQueue()
  window.addEventListener('online', () => { isOnline.value = true })
  window.addEventListener('offline', () => { isOnline.value = false })
})
</script>

<style lang="scss" scoped>
.mobile-offline {
  padding-bottom: 60px;
  
  .status-bar {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px;
    background: #fff7e6;
    color: #fa8c16;
    gap: 8px;
    
    &.online {
      background: #f6ffed;
      color: #52c41a;
    }
  }
  
  .stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    background: #fff;
    padding: 20px 0;
    
    .stat-item {
      text-align: center;
      
      .stat-value {
        font-size: 24px;
        font-weight: bold;
        color: #faad14;
      }
      
      .stat-label {
        font-size: 12px;
        color: #999;
        margin-top: 4px;
      }
      
      &.success .stat-value { color: #52c41a; }
      &.danger .stat-value { color: #ff4d4f; }
    }
  }
  
  .actions {
    display: flex;
    gap: 12px;
    padding: 12px 16px;
  }
  
  .queue-item {
    background: #fff;
    margin: 10px 12px;
    border-radius: 8px;
    padding: 12px;
    
    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
      
      .item-type {
        font-weight: 500;
      }
    }
    
    .item-time {
      font-size: 12px;
      color: #999;
      margin-bottom: 6px;
    }
    
    .item-data {
      font-size: 12px;
      color: #666;
      background: #f5f5f5;
      padding: 6px;
      border-radius: 4px;
      margin-bottom: 10px;
      word-break: break-all;
    }
    
    .item-actions {
      display: flex;
      gap: 8px;
    }
  }
}
</style>
