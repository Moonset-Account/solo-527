<template>
  <div class="notifications">
    <el-card>
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span>通知中心</span>
          <div>
            <el-badge :value="unreadCount" class="item" style="margin-right: 16px">
              <span>未读：{{ unreadCount }}</span>
            </el-badge>
            <el-button size="small" @click="markAllAsRead">全部标为已读</el-button>
          </div>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" style="margin-bottom: 20px">
        <el-form-item label="类型">
          <el-select v-model="searchForm.notification_type" placeholder="全部" clearable style="width: 120px">
            <el-option label="审批通知" value="approval" />
            <el-option label="违规通知" value="violation" />
            <el-option label="过期提醒" value="expiry" />
            <el-option label="系统通知" value="system" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.read" placeholder="全部" clearable style="width: 120px">
            <el-option label="未读" :value="false" />
            <el-option label="已读" :value="true" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="small" @click="fetchList">搜索</el-button>
          <el-button size="small" @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="list" v-loading="loading" stripe @row-click="handleRowClick">
        <el-table-column width="50">
          <template #default="{ row }">
            <el-badge :is-dot="!row.read" />
          </template>
        </el-table-column>
        <el-table-column prop="notification_type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getTypeColor(row.notification_type)" size="small">
              {{ getTypeName(row.notification_type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" />
        <el-table-column prop="content" label="内容" show-overflow-tooltip />
        <el-table-column prop="created_at" label="时间" width="160">
          <template #default="{ row }">
            {{ formatTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button v-if="!row.read" size="small" @click.stop="markAsRead(row)">标为已读</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="page"
        v-model:page-size="perPage"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        style="margin-top: 20px; justify-content: flex-end"
        @size-change="fetchList"
        @current-change="fetchList"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import { notificationsApi } from '@/api'

const loading = ref(false)
const list = ref([])
const page = ref(1)
const perPage = ref(20)
const total = ref(0)
const unreadCount = ref(0)

const searchForm = reactive({
  notification_type: '',
  read: ''
})

const fetchList = async () => {
  loading.value = true
  try {
    const params = {
      page: page.value,
      per_page: perPage.value,
      ...searchForm
    }
    const res = await notificationsApi.list(params)
    list.value = res.data
    total.value = res.meta.total_count
  } catch (e) {
  } finally {
    loading.value = false
  }
}

const fetchUnreadCount = async () => {
  try {
    const res = await notificationsApi.unreadCount()
    unreadCount.value = res.count
  } catch (e) {}
}

const resetSearch = () => {
  searchForm.notification_type = ''
  searchForm.read = ''
  page.value = 1
  fetchList()
}

const getTypeName = (type) => {
  const map = { approval: '审批通知', violation: '违规通知', expiry: '过期提醒', system: '系统通知' }
  return map[type] || type
}

const getTypeColor = (type) => {
  const map = { approval: 'primary', violation: 'danger', expiry: 'warning', system: 'info' }
  return map[type] || 'info'
}

const formatTime = (time) => dayjs(time).format('YYYY-MM-DD HH:mm')

const handleRowClick = (row) => {
  if (!row.read) {
    markAsRead(row)
  }
}

const markAsRead = async (row) => {
  try {
    await notificationsApi.markAsRead(row.id)
    row.read = true
    fetchUnreadCount()
  } catch (e) {}
}

const markAllAsRead = async () => {
  try {
    await notificationsApi.markAllAsRead()
    ElMessage.success('已全部标为已读')
    fetchList()
    fetchUnreadCount()
  } catch (e) {}
}

onMounted(() => {
  fetchList()
  fetchUnreadCount()
})
</script>
