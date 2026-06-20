<template>
  <div>
    <div class="filter-bar">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="消息类型">
          <el-select v-model="searchForm.type" placeholder="全部" clearable style="width: 140px">
            <el-option label="司机延误" value="driver_delay" />
            <el-option label="订单提醒" value="order_reminder" />
            <el-option label="清洁提醒" value="cleaning_reminder" />
            <el-option label="库存告警" value="inventory_alert" />
            <el-option label="系统消息" value="system" />
          </el-select>
        </el-form-item>
        <el-form-item label="级别">
          <el-select v-model="searchForm.level" placeholder="全部" clearable style="width: 120px">
            <el-option label="普通消息" value="normal" />
            <el-option label="临期提醒" value="imminent" />
            <el-option label="紧急告警" value="urgent" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="未读" value="unread" />
            <el-option label="已读" value="read" />
            <el-option label="已归档" value="archived" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button type="success" @click="handleMarkAllRead">
            全部已读
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="table-container">
      <div class="section-title mb-16">消息列表</div>

      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column label="级别" width="100">
          <template #default="{ row }">
            <el-tag :type="getLevelType(row.level)" size="small">
              {{ formatLevel(row.level) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="120">
          <template #default="{ row }">
            {{ formatType(row.type) }}
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="200">
          <template #default="{ row }">
            <span :class="{ 'unread': row.status === 'unread' }">
              {{ row.title }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="content" label="内容" min-width="280" show-overflow-tooltip>
          <template #default="{ row }">
            <span :class="{ 'unread': row.status === 'unread' }">
              {{ row.content }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.status === 'unread'" type="danger" size="small">未读</el-tag>
            <el-tag v-else size="small">已读</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="triggeredAt" label="触发时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.triggeredAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'unread'"
              text
              type="primary"
              @click="handleMarkRead(row.id)"
            >
              标为已读
            </el-button>
            <el-button text type="primary" @click="handleView(row)">
              查看
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getReminders, markAsRead, markAllAsRead } from '@/api/reminders'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const tableData = ref([])
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const searchForm = reactive({
  type: '',
  level: '',
  status: ''
})

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getReminders({
      page: pagination.page,
      pageSize: pagination.pageSize,
      type: searchForm.type || undefined,
      level: searchForm.level || undefined,
      status: searchForm.status || undefined
    })
    tableData.value = res.list
    pagination.total = res.total
  } catch (e) {
    // handled
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const handleReset = () => {
  searchForm.type = ''
  searchForm.level = ''
  searchForm.status = ''
  pagination.page = 1
  fetchData()
}

const handlePageChange = (page) => {
  pagination.page = page
  fetchData()
}

const handleSizeChange = (size) => {
  pagination.pageSize = size
  pagination.page = 1
  fetchData()
}

const handleMarkRead = async (id) => {
  try {
    await markAsRead(id)
    ElMessage.success('标记成功')
    fetchData()
  } catch (e) {
    // handled
  }
}

const handleMarkAllRead = async () => {
  try {
    await markAllAsRead()
    ElMessage.success('全部已读')
    fetchData()
  } catch (e) {
    // handled
  }
}

const handleView = (row) => {
  if (row.status === 'unread') {
    handleMarkRead(row.id)
  }
}

const formatType = (type) => {
  const map = {
    driver_delay: '司机延误',
    order_reminder: '订单提醒',
    cleaning_reminder: '清洁提醒',
    inventory_alert: '库存告警',
    system: '系统消息'
  }
  return map[type] || type
}

const formatLevel = (level) => {
  const map = { normal: '普通', imminent: '临期', urgent: '紧急' }
  return map[level] || level
}

const getLevelType = (level) => {
  const map = { normal: 'info', imminent: 'warning', urgent: 'danger' }
  return map[level] || 'info'
}

const formatDateTime = (time) => {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.unread {
  font-weight: 600;
  color: #303133;
}
</style>
