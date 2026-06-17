<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">我的消息</h2>
      <div>
        <el-button @click="handleMarkAllRead">全部标为已读</el-button>
      </div>
    </div>

    <div class="card-shadow">
      <div class="filter-bar">
        <el-radio-group v-model="filter.type" @change="loadData">
          <el-radio-button value="">全部</el-radio-button>
          <el-radio-button value="unread">未读</el-radio-button>
          <el-radio-button value="unconfirmed">待确认</el-radio-button>
        </el-radio-group>
        <el-tag type="danger" effect="light">未读: {{ unreadCount }}</el-tag>
      </div>

      <el-table :data="list" v-loading="loading" stripe @row-click="handleRowClick" highlight-current-row>
        <el-table-column width="60">
          <template #default="{ row }">
            <el-badge :is-dot="!isRead(row)" />
          </template>
        </el-table-column>
        <el-table-column label="类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getPriorityType(row.priority)" size="small">
              {{ NotificationTypeLabel[row.type as keyof typeof NotificationTypeLabel] || row.type }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" />
        <el-table-column prop="content" label="内容" show-overflow-tooltip />
        <el-table-column label="是否需确认" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.needConfirmation" :type="isConfirmed(row) ? 'success' : 'warning'" size="small">
              {{ isConfirmed(row) ? '已确认' : '待确认' }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="时间" width="180">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button
              v-if="row.needConfirmation && !isConfirmed(row)"
              link
              type="primary"
              @click.stop="handleConfirm(row)"
            >确认</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        layout="total, prev, pager, next"
        style="margin-top: 16px"
        background
        @current-change="loadData"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { notificationApi } from '@/api'
import { useNotificationStore } from '@/stores/notification'
import { useUserStore } from '@/stores/user'
import { NotificationTypeLabel, NotificationPriority, type Notification } from '@/types'
import dayjs from 'dayjs'

const notificationStore = useNotificationStore()
const userStore = useUserStore()

const loading = ref(false)
const list = ref<Notification[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)

const filter = reactive({
  type: '',
})

const unreadCount = computed(() => notificationStore.unreadCount)

function formatDate(d: string) {
  return d ? dayjs(d).format('YYYY-MM-DD HH:mm') : '-'
}

function isRead(row: Notification) {
  return row.readBy.includes(userStore.userId)
}

function isConfirmed(row: Notification) {
  return row.confirmedBy.includes(userStore.userId)
}

function getPriorityType(priority: string) {
  const map: Record<string, string> = {
    low: 'info',
    medium: '',
    high: 'warning',
    urgent: 'danger',
  }
  return map[priority] || ''
}

async function loadData() {
  loading.value = true
  try {
    const params: any = {
      page: page.value,
      pageSize: pageSize.value,
    }
    if (filter.type === 'unread') params.unreadOnly = true
    if (filter.type === 'unconfirmed') params.unconfirmedOnly = true
    const res = await notificationApi.list(params)
    list.value = res.list
    total.value = res.total
  } finally {
    loading.value = false
  }
}

async function handleRowClick(row: Notification) {
  if (!isRead(row)) {
    await notificationStore.markRead(row._id)
  }
}

async function handleMarkAllRead() {
  try {
    await ElMessageBox.confirm('确定全部标记为已读？', '提示', { type: 'warning' })
    await notificationStore.markAllRead()
    ElMessage.success('已标记')
    loadData()
  } catch {}
}

async function handleConfirm(row: Notification) {
  try {
    await ElMessageBox.confirm(`确认已处理该通知：${row.title}？`, '提示', { type: 'warning' })
    await notificationStore.confirm(row._id)
    ElMessage.success('已确认，已同步至维保看板')
    loadData()
  } catch {}
}

onMounted(loadData)
</script>
