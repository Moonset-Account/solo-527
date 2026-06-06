<template>
  <div class="borrowing-detail">
    <el-page-header @back="goBack" content="借阅详情">
      <template #extra>
        <el-button @click="goBack">返回列表</el-button>
      </template>
    </el-page-header>
    
    <el-card v-if="record" class="detail-card">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="借阅ID">{{ record.id }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(record.status)">
            {{ record.status_display }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="绘本名称">
          <span @click="goToBookDetail(record.book_id)" class="link-text">
            {{ record.book_title }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="副本条码">{{ record.book_copy_barcode }}</el-descriptions-item>
        <el-descriptions-item label="借阅家庭">{{ record.family_name }}</el-descriptions-item>
        <el-descriptions-item label="借阅人">{{ record.borrower_name }}</el-descriptions-item>
        <el-descriptions-item label="预约时间">{{ formatDate(record.reserved_at) }}</el-descriptions-item>
        <el-descriptions-item label="取书时间">{{ formatDate(record.picked_up_at) }}</el-descriptions-item>
        <el-descriptions-item label="借阅时间">{{ formatDate(record.borrowed_at) }}</el-descriptions-item>
        <el-descriptions-item label="应还时间">
          <span :class="isOverdue(record.due_date) ? 'overdue' : ''">
            {{ formatDate(record.due_date) }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="归还时间">{{ formatDate(record.returned_at) }}</el-descriptions-item>
        <el-descriptions-item label="续借次数">{{ record.renew_count }} / {{ record.max_renew_count }}</el-descriptions-item>
      </el-descriptions>
      
      <el-divider />
      
      <div class="action-section">
        <h3>状态操作</h3>
        <el-space wrap>
          <el-button 
            type="primary" 
            @click="handleTransition('picked_up')"
            v-if="record.status === 'reserved'"
          >
            确认取书
          </el-button>
          <el-button 
            type="primary" 
            @click="handleTransition('borrowed')"
            v-if="record.status === 'picked_up'"
          >
            确认借阅
          </el-button>
          <el-button 
            type="warning" 
            @click="handleRenew"
            v-if="record.status === 'borrowed' && record.renew_count < record.max_renew_count"
          >
            续借
          </el-button>
          <el-button 
            type="success" 
            @click="handleTransition('returned')"
            v-if="['borrowed', 'overdue', 'renewed'].includes(record.status)"
          >
            归还
          </el-button>
          <el-button 
            type="danger" 
            @click="handleTransition('cancelled')"
            v-if="record.status === 'reserved'"
          >
            取消预约
          </el-button>
        </el-space>
      </div>
      
      <el-divider />
      
      <div class="logs-section">
        <h3>状态流转日志</h3>
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
      </div>
    </el-card>
    
    <el-empty v-else description="加载中..." />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '@/api'

const route = useRoute()
const router = useRouter()

const record = ref(null)
const statusLogs = ref([])

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
  return new Date(dueDate) < new Date() && record.value?.status !== 'returned'
}

const loadDetail = async () => {
  try {
    const res = await api.borrowing.list()
    const records = res.results || res
    record.value = records.find(r => r.id === parseInt(route.params.id))
    
    if (!record.value) {
      ElMessage.error('借阅记录不存在')
      goBack()
      return
    }
    
    await loadStatusLogs()
  } catch (error) {
    ElMessage.error('加载详情失败')
  }
}

const loadStatusLogs = async () => {
  try {
    const res = await api.borrowing.getStatusLogs(route.params.id)
    statusLogs.value = res.results || res
  } catch (error) {
    console.error('加载状态日志失败', error)
  }
}

const handleTransition = async (newStatus) => {
  const statusNames = {
    'picked_up': '确认取书',
    'borrowed': '确认借阅',
    'returned': '归还',
    'cancelled': '取消预约'
  }
  
  try {
    await ElMessageBox.confirm(
      `确定执行"${statusNames[newStatus]}"操作吗？`,
      '确认操作',
      { type: 'warning' }
    )
  } catch {
    return
  }
  
  try {
    await api.borrowing.transition(route.params.id, { new_status: newStatus })
    ElMessage.success('操作成功')
    loadDetail()
  } catch (error) {
    ElMessage.error(error.response?.data?.error || '操作失败')
  }
}

const handleRenew = async () => {
  try {
    await ElMessageBox.confirm('确定续借吗？', '确认续借', { type: 'info' })
  } catch {
    return
  }
  
  try {
    await api.borrowing.renew(route.params.id)
    ElMessage.success('续借成功')
    loadDetail()
  } catch (error) {
    ElMessage.error(error.response?.data?.error || '续借失败')
  }
}

const goBack = () => {
  router.push({ path: '/admin/borrowing', query: route.query })
}

const goToBookDetail = (bookId) => {
  router.push(`/admin/books/${bookId}`)
}

onMounted(() => {
  loadDetail()
})
</script>

<style scoped>
.borrowing-detail {
  padding: 20px;
}

.detail-card {
  margin-top: 20px;
}

.link-text {
  color: #409eff;
  cursor: pointer;
}

.link-text:hover {
  text-decoration: underline;
}

.overdue {
  color: #f56c6c;
  font-weight: 500;
}

.action-section,
.logs-section {
  margin-top: 20px;
}

.action-section h3,
.logs-section h3 {
  margin-bottom: 15px;
  font-size: 16px;
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
