<template>
  <div class="my-borrowing">
    <h2>我的借阅</h2>
    
    <el-tabs v-model="activeTab" class="borrowing-tabs">
      <el-tab-pane label="当前借阅" name="current">
        <el-table :data="currentBorrows" v-loading="loading" stripe>
          <el-table-column label="绘本名称">
            <template #default="{ row }">
              <div class="book-name-cell" @click="goToBook(row.book_id)">
                <el-image :src="row.book_cover" fit="cover" class="book-thumb" />
                <span>{{ row.book_title }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="book_copy_barcode" label="副本条码" width="120" />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)" size="small">
                {{ row.status_display }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="borrowed_at" label="借阅时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.borrowed_at || row.reserved_at) }}
            </template>
          </el-table-column>
          <el-table-column prop="due_date" label="应还时间" width="180">
            <template #default="{ row }">
              <span :class="isOverdue(row.due_date) ? 'overdue' : ''">
                {{ formatDate(row.due_date) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200">
            <template #default="{ row }">
              <el-button 
                type="primary" 
                size="small" 
                @click="renewBook(row)"
                v-if="row.status === 'borrowed' && row.renew_count < (row.max_renew_count || 1)"
              >
                续借 ({{ row.renew_count }}/{{ row.max_renew_count || 1 }})
              </el-button>
              <el-button 
                type="info" 
                size="small" 
                @click="viewLogs(row)"
              >
                状态日志
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <el-empty v-if="!loading && currentBorrows.length === 0" description="暂无当前借阅" />
      </el-tab-pane>
      
      <el-tab-pane label="历史借阅" name="history">
        <el-table :data="historyBorrows" v-loading="loadingHistory" stripe>
          <el-table-column label="绘本名称">
            <template #default="{ row }">
              <div class="book-name-cell" @click="goToBook(row.book_id)">
                <el-image :src="row.book_cover" fit="cover" class="book-thumb" />
                <span>{{ row.book_title }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)" size="small">
                {{ row.status_display }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="borrowed_at" label="借阅时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.borrowed_at) }}
            </template>
          </el-table-column>
          <el-table-column prop="returned_at" label="归还时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.returned_at) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button 
                type="text" 
                @click="goToBook(row.book_id)"
              >
                再次借阅
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>
    
    <el-dialog v-model="logsDialogVisible" title="状态流转日志" width="600px">
      <el-timeline>
        <el-timeline-item
          v-for="log in statusLogs"
          :key="log.id"
          :timestamp="formatDate(log.created_at)"
          :type="getTimelineType(log.to_status)"
        >
          <div class="log-item">
            <div class="log-status">
              <el-tag size="small">{{ log.to_status_display || log.to_status }}</el-tag>
            </div>
            <div class="log-operator">
              操作人：{{ log.operator_name || log.operator?.username || '系统' }}
            </div>
            <div v-if="log.notes" class="log-notes">
              备注：{{ log.notes }}
            </div>
          </div>
        </el-timeline-item>
      </el-timeline>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '@/api'

const router = useRouter()

const activeTab = ref('current')
const loading = ref(false)
const loadingHistory = ref(false)
const currentBorrows = ref([])
const historyBorrows = ref([])
const statusLogs = ref([])
const logsDialogVisible = ref(false)

const getStatusType = (status) => {
  const typeMap = {
    'reserved': 'info',
    'picked_up': 'warning',
    'borrowed': 'primary',
    'overdue': 'danger',
    'returned': 'success',
    'cancelled': 'info',
    'renewed': 'warning'
  }
  return typeMap[status] || 'info'
}

const getTimelineType = (status) => {
  const typeMap = {
    'reserved': 'primary',
    'borrowed': 'primary',
    'overdue': 'danger',
    'returned': 'success',
    'cancelled': 'info'
  }
  return typeMap[status] || 'primary'
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleString('zh-CN', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const isOverdue = (dueDate) => {
  if (!dueDate) return false
  return new Date(dueDate) < new Date()
}

const loadCurrentBorrows = async () => {
  loading.value = true
  try {
    const res = await api.borrowing.myRecords()
    const all = res.results || res
    currentBorrows.value = all.filter(b => 
      ['reserved', 'picked_up', 'borrowed', 'overdue'].includes(b.status)
    )
    historyBorrows.value = all.filter(b => 
      ['returned', 'cancelled'].includes(b.status)
    )
  } catch (error) {
    ElMessage.error('加载借阅记录失败')
  } finally {
    loading.value = false
  }
}

const renewBook = async (record) => {
  try {
    await ElMessageBox.confirm(
      `确定要续借《${record.book_title}》吗？`,
      '续借确认',
      { type: 'info' }
    )
  } catch {
    return
  }
  
  try {
    await api.borrowing.transition(record.id, {
      new_status: 'renewed'
    })
    ElMessage.success('续借成功')
    loadCurrentBorrows()
  } catch (error) {
    ElMessage.error(error.response?.data?.error || '续借失败')
  }
}

const viewLogs = async (record) => {
  try {
    const res = await api.borrowing.getStatusLogs(record.id)
    statusLogs.value = res.results || res
    logsDialogVisible.value = true
  } catch (error) {
    ElMessage.error('加载状态日志失败')
  }
}

const goToBook = (bookId) => {
  router.push(`/books/${bookId}`)
}

onMounted(() => {
  loadCurrentBorrows()
})
</script>

<style scoped>
.my-borrowing {
  padding: 20px;
}

.my-borrowing h2 {
  margin-bottom: 20px;
}

.borrowing-tabs {
  margin-top: 20px;
}

.book-name-cell {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.book-thumb {
  width: 50px;
  height: 65px;
  border-radius: 4px;
  flex-shrink: 0;
}

.overdue {
  color: #f56c6c;
  font-weight: 500;
}

.log-item {
  padding: 5px 0;
}

.log-status {
  margin-bottom: 5px;
}

.log-operator {
  color: #909399;
  font-size: 13px;
}

.log-notes {
  color: #606266;
  font-size: 13px;
  margin-top: 5px;
}
</style>
