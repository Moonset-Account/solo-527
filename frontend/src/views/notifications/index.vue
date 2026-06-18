<template>
  <div class="notif-page page-container">
    <div class="card-wrapper">
      <div class="card-header">
        <span class="title">
          <el-icon><Bell /></el-icon> 消息中心
          <el-tag
            v-if="unreadCount > 0"
            type="danger"
            effect="dark"
            size="small"
            style="margin-left: 8px; border: none;"
          >
            {{ unreadCount }} 条未读
          </el-tag>
        </span>
        <div>
          <el-button
            :disabled="!unreadCount"
            type="primary"
            :icon="Check"
            @click="markAll"
            plain
          >
            全部已读
          </el-button>
        </div>
      </div>

      <el-tabs v-model="activeTab" class="notif-tabs" @tab-change="loadData(1)">
        <el-tab-pane label="全部" name="all" />
        <el-tab-pane label="未读" name="unread" />
        <el-tab-pane label="异常告警" name="alert" />
        <el-tab-pane label="权限提醒" name="perm" />
      </el-tabs>

      <el-table
        v-loading="loading"
        :data="list"
        style="width: 100%;"
        :row-class-name="row => !row.isRead ? 'unread-row' : ''"
        @row-click="onRowClick"
        stripe
      >
        <el-table-column width="60" align="center">
          <template #default="{ row }">
            <el-icon
              :size="22"
              :style="{ color: getIconColor(row.type) }"
              class="notif-icon"
            >
              <component :is="getIcon(row.type)" />
            </el-icon>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="110">
          <template #default="{ row }">
            <el-tag size="small" effect="plain" :style="{ borderColor: getIconColor(row.type), color: getIconColor(row.type) }">
              {{ getLabel(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="优先级" width="90" align="center">
          <template #default="{ row }">
            <el-tag
              v-if="row.priority === 'critical'"
              size="small"
              type="danger"
              effect="dark"
              style="border: none;"
            >
              紧急
            </el-tag>
            <el-tag v-else-if="row.priority === 'high'" size="small" type="warning">高</el-tag>
            <el-tag v-else size="small" type="info">普通</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="内容" min-width="360">
          <template #default="{ row }">
            <div class="col-content">
              <div class="title">{{ row.title }}</div>
              <div class="desc" v-if="row.content">{{ row.content }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="时间" width="180">
          <template #default="{ row }">
            <div>{{ formatDate(row.createdAt) }}</div>
            <div class="time-ago">{{ fromNow(row.createdAt) }}</div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="!row.isRead"
              link
              type="primary"
              @click.stop="markOne(row._id)"
            >
              标记已读
            </el-button>
            <el-button link type="danger" @click.stop="removeOne(row._id)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty
        v-if="!list.length && !loading"
        description="暂无消息"
        :image-size="100"
        style="padding: 40px 0;"
      />

      <div v-if="list.length" class="pagination-wrap">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          background
          @size-change="loadData(1)"
          @current-change="loadData()"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getNotifications, getUnreadCount, markAsRead, markAllAsRead, deleteNotification
} from '@/api/notifications'
import { useAppStore } from '@/stores/app'
import { formatDate, fromNow, notificationTypeMap } from '@/utils'
import {
  Bell, Warning, Clock, CircleClose, UserFilled, Document, ChatDotRound, InfoFilled, Check
} from '@element-plus/icons-vue'

const appStore = useAppStore()
const loading = ref(false)
const list = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const activeTab = ref('all')
const unreadCount = ref(0)

const iconMap: Record<string, any> = {
  anomaly_detected: Warning,
  alert_triggered: Bell,
  permission_expiring: Clock,
  permission_expired: CircleClose,
  anomaly_assigned: UserFilled,
  report_reminder: Document,
  mention: ChatDotRound,
  system: InfoFilled
}

function getIcon(type: string) {
  return iconMap[type] || Bell
}
function getIconColor(type: string) {
  return notificationTypeMap[type]?.color || '#909399'
}
function getLabel(type: string) {
  return notificationTypeMap[type]?.label || type
}

async function loadUnread() {
  try {
    unreadCount.value = await getUnreadCount()
    appStore.setNotificationCount(unreadCount.value)
  } catch (e) {}
}

async function loadData(p?: number) {
  if (p) page.value = p
  loading.value = true
  try {
    const params: any = { page: page.value, pageSize: pageSize.value }
    if (activeTab.value === 'unread') params.isRead = false
    else if (activeTab.value === 'alert') params.type = 'alert_triggered'
    else if (activeTab.value === 'perm') {
      // 通过前端过滤
    }
    const res = await getNotifications(params)
    let items = res.list
    if (activeTab.value === 'perm') {
      items = items.filter(
        (i: any) => i.type === 'permission_expiring' || i.type === 'permission_expired'
      )
    }
    list.value = items
    total.value = activeTab.value === 'all' || activeTab.value === 'unread'
      ? res.total : items.length
  } finally {
    loading.value = false
  }
  loadUnread()
}

async function onRowClick(row: any) {
  if (!row.isRead) {
    await markAsRead(row._id)
    row.isRead = true
    loadUnread()
  }
}

async function markOne(id: string) {
  await markAsRead(id)
  ElMessage.success('已标记为已读')
  loadData()
}

async function markAll() {
  try {
    await ElMessageBox.confirm('确认将所有消息标记为已读？', '提示', { type: 'info' })
    await markAllAsRead()
    ElMessage.success('已全部标记为已读')
    loadData()
  } catch (e) {}
}

async function removeOne(id: string) {
  try {
    await ElMessageBox.confirm('确认删除该消息？', '提示', { type: 'warning' })
    await deleteNotification(id)
    ElMessage.success('已删除')
    loadData()
  } catch (e) {}
}

watch(activeTab, () => loadData(1))
onMounted(loadData)
</script>

<style lang="scss" scoped>
.notif-tabs {
  margin-bottom: 16px;
  :deep(.el-tabs__item) { padding: 0 20px; }
}

:deep(.unread-row) {
  background: #fff8f5;
  .col-content .title {
    font-weight: 600;
    color: $text-primary;
  }
}

.col-content {
  .title {
    font-size: 14px;
    color: $text-regular;
    line-height: 1.5;
  }
  .desc {
    margin-top: 4px;
    font-size: 12px;
    color: $text-secondary;
    line-height: 1.5;
    @include text-ellipsis;
  }
}

.time-ago {
  font-size: 12px;
  color: $text-secondary;
  margin-top: 2px;
}

.notif-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #f5f7fa;
  padding: 7px;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
