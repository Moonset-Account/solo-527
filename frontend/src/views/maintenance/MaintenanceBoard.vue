<template>
  <div class="maintenance-board">
    <div class="page-header">
      <h2 class="page-title">
        <el-icon style="vertical-align: middle; margin-right: 8px"><Monitor /></el-icon>
        维保及时看板
      </h2>
      <div>
        <el-tag type="warning" effect="dark" style="margin-right: 8px">
          待处理: {{ pending.length }}
        </el-tag>
        <el-tag type="success" effect="dark">
          已确认: {{ confirmed.length }}
        </el-tag>
        <el-button style="margin-left: 16px" :icon="Refresh" circle @click="loadData" />
      </div>
    </div>

    <el-row :gutter="20">
      <el-col :xs="24" :md="12">
        <div class="board-card pending">
          <div class="board-header">
            <h3>
              <el-icon><WarningFilled /></el-icon>
              待确认提醒
              <el-badge :value="pending.length" class="badge" />
            </h3>
            <span class="hint">需要试剂管理员/负责人确认处理，确认后自动同步</span>
          </div>
          <el-empty v-if="pending.length === 0" description="暂无待处理" :image-size="80" />
          <div v-else class="alert-list">
            <div
              v-for="item in pending"
              :key="item.id"
              class="alert-item"
              :class="'priority-' + (item.priority || 'medium')"
            >
              <div class="alert-head">
                <el-tag :type="priorityType(item.priority)" size="small">
                  {{ typeLabel(item.type) }}
                </el-tag>
                <span class="alert-time">{{ formatTime(item.createdAt) }}</span>
              </div>
              <div class="alert-title">{{ item.title }}</div>
              <div class="alert-content">{{ item.content }}</div>
              <div class="alert-actions">
                <el-button type="primary" size="small" :icon="Check" @click="handleConfirm(item)">
                  确认处理
                </el-button>
                <el-button size="small" :icon="View" @click="viewDetail(item)">查看</el-button>
              </div>
            </div>
          </div>
        </div>
      </el-col>

      <el-col :xs="24" :md="12">
        <div class="board-card confirmed">
          <div class="board-header">
            <h3>
              <el-icon><CircleCheckFilled /></el-icon>
              已确认同步
              <el-tag type="success" size="small" style="margin-left: 8px">{{ confirmed.length }}</el-tag>
            </h3>
            <span class="hint">负责人已确认，已同步至维保系统</span>
          </div>
          <el-empty v-if="confirmed.length === 0" description="暂无已确认记录" :image-size="80" />
          <div v-else class="alert-list">
            <div v-for="item in confirmed" :key="item.id" class="alert-item confirmed-item">
              <div class="alert-head">
                <el-tag type="success" size="small">{{ typeLabel(item.type) }}</el-tag>
                <span class="alert-time">{{ formatTime(item.confirmedAt) }}</span>
              </div>
              <div class="alert-title">{{ item.title }}</div>
              <div class="alert-content">{{ item.content }}</div>
              <div class="confirmed-footer">
                <el-icon><User /></el-icon>
                <span>已由 {{ item.confirmedBy?.length || 0 }} 人确认</span>
              </div>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { notificationApi } from '@/api'
import { useNotificationStore } from '@/stores/notification'
import dayjs from 'dayjs'
import {
  Monitor, Refresh, WarningFilled, CircleCheckFilled, Check, View, User,
} from '@element-plus/icons-vue'

const notificationStore = useNotificationStore()
const pending = ref<any[]>([])
const confirmed = ref<any[]>([])

let timer: any

function formatTime(t: string) {
  return t ? dayjs(t).format('MM-DD HH:mm') : '-'
}

function typeLabel(t: string) {
  const map: Record<string, string> = {
    application_submitted: '申请提交',
    application_approved: '申请通过',
    application_rejected: '申请驳回',
    safety_compliance: '安全合规',
    sample_unknown: '样本去向不明',
    maintenance_alert: '维保提醒',
    system_notice: '系统通知',
  }
  return map[t] || t
}

function priorityType(p: string) {
  return { low: 'info', medium: '', high: 'warning', urgent: 'danger' }[p] || ''
}

async function loadData() {
  try {
    const res = await notificationApi.maintenanceBoard()
    pending.value = res.pending
    confirmed.value = res.confirmed
  } catch {}
}

async function handleConfirm(item: any) {
  try {
    await ElMessageBox.confirm(
      `确认已处理该提醒：${item.title}？确认后将同步至维保系统。`,
      '确认处理',
      { type: 'warning', confirmButtonText: '确认已处理' }
    )
    await notificationStore.confirm(item.id)
    ElMessage.success('已确认，已同步至维保看板')
    await notificationStore.fetchUnreadCount()
    loadData()
  } catch {}
}

function viewDetail(item: any) {
  ElMessage.info(`查看 ${item.title} 详情`)
}

onMounted(() => {
  loadData()
  timer = setInterval(loadData, 30000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style lang="scss" scoped>
.maintenance-board {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    .page-title {
      font-size: 22px;
      font-weight: 600;
      margin: 0;
      display: flex;
      align-items: center;
    }
  }
}

.board-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  overflow: hidden;

  &.pending {
    border-top: 4px solid #e6a23c;
  }

  &.confirmed {
    border-top: 4px solid #67c23a;
  }
}

.board-header {
  padding: 16px 20px;
  border-bottom: 1px solid #ebeef5;

  h3 {
    margin: 0 0 6px;
    font-size: 16px;
    display: flex;
    align-items: center;
    gap: 6px;

    .badge {
      margin-left: 8px;
    }
  }

  .hint {
    font-size: 12px;
    color: #909399;
  }
}

.alert-list {
  padding: 12px 20px;
  max-height: 60vh;
  overflow-y: auto;
}

.alert-item {
  padding: 14px 16px;
  margin-bottom: 12px;
  border-radius: 6px;
  background: #fafbfc;
  border-left: 3px solid #dcdfe6;

  &.priority-urgent {
    border-left-color: #f56c6c;
    background: #fef0f0;
  }

  &.priority-high {
    border-left-color: #e6a23c;
    background: #fdf6ec;
  }

  &.priority-medium {
    border-left-color: #409eff;
  }

  &.confirmed-item {
    border-left-color: #67c23a;
    background: #f0f9eb;
  }
}

.alert-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;

  .alert-time {
    font-size: 12px;
    color: #909399;
  }
}

.alert-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.alert-content {
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
  margin-bottom: 10px;
}

.alert-actions {
  display: flex;
  gap: 8px;
}

.confirmed-footer {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #67c23a;
}
</style>
