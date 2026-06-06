<template>
  <div class="book-detail">
    <div class="back-bar">
      <el-button @click="goBack" :icon="ArrowLeft">返回列表</el-button>
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/books' }">绘本浏览</el-breadcrumb-item>
        <el-breadcrumb-item>{{ book?.title || '详情' }}</el-breadcrumb-item>
      </el-breadcrumb>
    </div>
    
    <div v-if="book" class="detail-content">
      <div class="book-header">
        <div class="cover-section">
          <el-image
            :src="book.cover || placeholderCover"
            :preview-src-list="[book.cover || placeholderCover]"
            fit="cover"
            class="book-cover"
          />
          <div class="status-section">
            <el-tag :type="statusType" size="large">{{ book.status_display }}</el-tag>
            <el-tag v-if="book.can_borrow" type="success" size="large">可外借</el-tag>
            <el-tag v-else type="info" size="large">不可外借</el-tag>
          </div>
          
          <div v-if="isLibrarian" class="action-buttons">
            <el-button v-if="book.status !== 'off_shelf'" type="warning" @click="handleOffShelf">
              <el-icon><FolderRemove /></el-icon>
              下架绘本
            </el-button>
            <el-button v-else type="success" @click="handleOnShelf">
              <el-icon><FolderAdd /></el-icon>
              上架绘本
            </el-button>
          </div>
        </div>
        
        <div class="info-section">
          <h1 class="book-title">{{ book.title }}</h1>
          <div class="book-basic">
            <span class="meta-item"><el-icon><User /></el-icon> {{ book.author }}</span>
            <span class="meta-item"><el-icon><OfficeBuilding /></el-icon> {{ book.publisher }}</span>
            <span class="meta-item"><el-icon><Barcode /></el-icon> {{ book.isbn }}</span>
            <span class="meta-item"><el-icon><Aim /></el-icon> {{ book.age_min }}-{{ book.age_max }}岁</span>
            <span class="meta-item"><el-icon><Location /></el-icon> {{ book.location || '未设置' }}</span>
          </div>
          
          <div class="themes">
            <span class="label">主题标签：</span>
            <el-tag
              v-for="theme in book.themes"
              :key="theme.id"
              :style="{ backgroundColor: theme.color + '20', color: theme.color, borderColor: theme.color }"
            >
              {{ theme.name }}
            </el-tag>
          </div>
          
          <div class="description">
            <h4>内容简介</h4>
            <p>{{ book.description || '暂无简介' }}</p>
          </div>
          
          <div class="copy-stats">
            <div class="stat-item">
              <span class="stat-value">{{ book.total_copies }}</span>
              <span class="stat-label">馆藏总数</span>
            </div>
            <div class="stat-item">
              <span class="stat-value" style="color: #67c23a">{{ book.available_copies }}</span>
              <span class="stat-label">可借数量</span>
            </div>
            <div class="stat-item">
              <span class="stat-value" style="color: #e6a23c">{{ book.total_copies - book.available_copies }}</span>
              <span class="stat-label">借出/其他</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="detail-tabs">
        <el-tabs v-model="activeTab">
          <el-tab-pane label="当前借阅" name="borrowing">
            <div v-if="currentBorrowing.length > 0" class="borrowing-list">
              <el-card v-for="record in currentBorrowing" :key="record.id" class="borrow-card">
                <div class="borrow-info">
                  <div class="borrow-family">
                    <el-icon><HomeFilled /></el-icon>
                    <span class="family-name">{{ record.family_name }}</span>
                    <el-tag size="small" :type="record.status === 'overdue' ? 'danger' : 'primary'">
                      {{ record.status_display }}
                    </el-tag>
                  </div>
                  <div class="borrow-detail">
                    <span>借阅人：{{ record.borrower }}</span>
                    <span>取书时间：{{ formatDate(record.picked_up_at) }}</span>
                    <span :class="{ 'overdue': isOverdue(record.due_date) }">
                      应还日期：{{ formatDate(record.due_date) }}
                    </span>
                  </div>
                </div>
              </el-card>
            </div>
            <el-empty v-else description="当前没有借阅记录" />
          </el-tab-pane>
          
          <el-tab-pane label="历史破损与修复" name="repairs">
            <div v-if="repairHistory.length > 0" class="repair-list">
              <el-timeline>
                <el-timeline-item
                  v-for="record in repairHistory"
                  :key="record.id"
                  :timestamp="formatDateTime(record.created_at)"
                  :type="getRepairTimelineType(record.status)"
                >
                  <div class="repair-item">
                    <div class="repair-header">
                      <el-tag :type="getRepairTagType(record.status)" size="small">
                        {{ record.status_display }}
                      </el-tag>
                      <span class="damage-type">{{ record.damage_type_display }}</span>
                      <span class="priority" :class="record.priority">
                        {{ getPriorityLabel(record.priority) }}
                      </span>
                    </div>
                    <p class="repair-desc">{{ record.description }}</p>
                    <div class="repair-meta">
                      <span>上报人：{{ record.reported_by }}</span>
                      <span v-if="record.completed_at">完成时间：{{ formatDateTime(record.completed_at) }}</span>
                    </div>
                  </div>
                </el-timeline-item>
              </el-timeline>
            </div>
            <el-empty v-else description="暂无破损记录" />
          </el-tab-pane>
          
          <el-tab-pane label="主题活动关联" name="activities">
            <div v-if="relatedActivities.length > 0" class="activity-list">
              <el-card
                v-for="activity in relatedActivities"
                :key="activity.id"
                class="activity-card"
                shadow="hover"
                @click="goToActivity(activity.id)"
              >
                <div class="activity-info">
                  <h4>{{ activity.title }}</h4>
                  <div class="activity-meta">
                    <el-tag size="small">{{ activity.activity_type_display }}</el-tag>
                    <span><el-icon><Calendar /></el-icon> {{ formatDateTime(activity.start_time) }}</span>
                    <el-tag :type="activity.status === 'published' ? 'success' : 'info'" size="small">
                      {{ activity.status_display }}
                    </el-tag>
                  </div>
                </div>
              </el-card>
            </div>
            <el-empty v-else description="暂无关联活动" />
          </el-tab-pane>
          
          <el-tab-pane label="副本管理" name="copies">
            <el-table :data="book.copies" stripe>
              <el-table-column prop="barcode" label="条码号" width="150" />
              <el-table-column prop="status_display" label="状态" width="100">
                <template #default="{ row }">
                  <el-tag size="small">{{ row.status_display }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="purchase_date" label="采购日期" width="120">
                <template #default="{ row }">{{ formatDate(row.purchase_date) }}</template>
              </el-table-column>
              <el-table-column prop="price" label="价格" width="100">
                <template #default="{ row }">¥{{ row.price }}</template>
              </el-table-column>
              <el-table-column prop="condition_notes" label="品相备注" />
              <el-table-column label="操作" width="120" v-if="isLibrarian">
                <template #default="{ row }">
                  <el-button type="primary" size="small" link @click="reportRepair(row)">
                    上报破损
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
    
    <el-dialog v-model="showRepairDialog" title="上报破损" width="500px">
      <el-form :model="repairForm" label-width="80px">
        <el-form-item label="破损类型">
          <el-select v-model="repairForm.damage_type" placeholder="请选择">
            <el-option label="撕裂" value="tear" />
            <el-option label="污渍" value="stain" />
            <el-option label="缺页" value="page_missing" />
            <el-option label="装订问题" value="binding" />
            <el-option label="水渍" value="water_damage" />
            <el-option label="霉变" value="mold" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="repairForm.priority">
            <el-option label="低" value="low" />
            <el-option label="中" value="medium" />
            <el-option label="高" value="high" />
            <el-option label="紧急" value="urgent" />
          </el-select>
        </el-form-item>
        <el-form-item label="破损描述">
          <el-input v-model="repairForm.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRepairDialog = false">取消</el-button>
        <el-button type="primary" @click="submitRepair">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowLeft, User, OfficeBuilding, Barcode, Aim, Location,
  FolderRemove, FolderAdd, HomeFilled, Calendar
} from '@element-plus/icons-vue'
import { api } from '@/api'
import { useUserStore } from '@/stores/user'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const isLibrarian = computed(() => userStore.isLibrarian)
const placeholderCover = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="400" fill="%23e4e7ed"%3E%3Crect width="300" height="400"/%3E%3Ctext x="150" y="200" text-anchor="middle" fill="%23909399"%3E暂无封面%3C/text%3E%3C/svg%3E'

const book = ref(null)
const activeTab = ref('borrowing')
const showRepairDialog = ref(false)

const repairForm = reactive({
  book_copy_id: null,
  damage_type: '',
  description: '',
  priority: 'medium'
})

const currentBorrowing = computed(() => book.value?.current_borrowing || [])
const repairHistory = computed(() => book.value?.repair_history || [])
const relatedActivities = computed(() => book.value?.related_activities || [])

const statusType = computed(() => {
  const map = {
    available: 'success',
    borrowed: 'warning',
    repairing: 'info',
    reserved: 'primary',
    off_shelf: 'danger',
    lost: 'danger'
  }
  return map[book.value?.status] || 'info'
})

async function loadBook() {
  try {
    const data = await api.books.detail(route.params.id)
    book.value = data
  } catch (error) {
    ElMessage.error('加载绘本详情失败')
  }
}

function goBack() {
  const query = { ...route.query }
  delete query.id
  router.push({
    path: '/books',
    query
  })
}

function formatDate(date) {
  return date ? dayjs(date).format('YYYY-MM-DD') : '-'
}

function formatDateTime(date) {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-'
}

function isOverdue(dueDate) {
  if (!dueDate) return false
  return dayjs(dueDate).isBefore(dayjs(), 'day')
}

function getRepairTimelineType(status) {
  const map = {
    reported: 'primary',
    assessing: 'warning',
    in_progress: 'warning',
    completed: 'success',
    scrapped: 'danger',
    cancelled: 'info'
  }
  return map[status] || 'primary'
}

function getRepairTagType(status) {
  const map = {
    reported: '',
    assessing: 'warning',
    in_progress: 'warning',
    completed: 'success',
    scrapped: 'danger',
    cancelled: 'info'
  }
  return map[status] || ''
}

function getPriorityLabel(priority) {
  const map = { low: '低', medium: '中', high: '高', urgent: '紧急' }
  return map[priority] || priority
}

function goToActivity(id) {
  router.push(`/activities/${id}`)
}

function reportRepair(copy) {
  repairForm.book_copy_id = copy.id
  repairForm.damage_type = ''
  repairForm.description = ''
  repairForm.priority = 'medium'
  showRepairDialog.value = true
}

async function submitRepair() {
  if (!repairForm.damage_type || !repairForm.description) {
    ElMessage.warning('请填写完整信息')
    return
  }
  
  try {
    await api.repairs.report(repairForm)
    ElMessage.success('破损已上报')
    showRepairDialog.value = false
    loadBook()
  } catch (error) {}
}

async function handleOffShelf() {
  try {
    await ElMessageBox.confirm(
      '下架后将自动取消所有预约，确定要下架这本绘本吗？',
      '确认下架',
      { type: 'warning' }
    )
    await api.books.offShelf(book.value.id)
    ElMessage.success('绘本已下架，相关预约将被取消')
    loadBook()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('下架失败')
    }
  }
}

async function handleOnShelf() {
  try {
    await api.books.onShelf(book.value.id)
    ElMessage.success('绘本已上架')
    loadBook()
  } catch (error) {}
}

onMounted(() => {
  loadBook()
})
</script>

<style scoped>
.book-detail {
  padding: 0;
}

.back-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.detail-content {
  background: white;
  border-radius: 8px;
  padding: 24px;
}

.book-header {
  display: flex;
  gap: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid #ebeef5;
}

.cover-section {
  flex-shrink: 0;
  width: 240px;
}

.book-cover {
  width: 240px;
  height: 340px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.status-section {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  flex-wrap: wrap;
}

.action-buttons {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-section {
  flex: 1;
}

.book-title {
  font-size: 24px;
  margin: 0 0 16px 0;
  color: #303133;
}

.book-basic {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 16px;
  color: #606266;
  font-size: 14px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.themes {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.label {
  color: #909399;
  font-size: 14px;
}

.description h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #303133;
}

.description p {
  margin: 0;
  color: #606266;
  line-height: 1.6;
}

.copy-stats {
  display: flex;
  gap: 32px;
  margin-top: 24px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 28px;
  font-weight: 600;
  color: #409eff;
  line-height: 1.2;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

.detail-tabs {
  margin-top: 24px;
}

.borrow-card {
  margin-bottom: 12px;
}

.borrow-family {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.family-name {
  font-weight: 500;
  font-size: 15px;
}

.borrow-detail {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 13px;
  color: #606266;
}

.overdue {
  color: #f56c6c !important;
  font-weight: 500;
}

.repair-item {
  padding: 8px 0;
}

.repair-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.damage-type {
  font-weight: 500;
}

.priority {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
}

.priority.low { background: #f0f9eb; color: #67c23a; }
.priority.medium { background: #fdf6ec; color: #e6a23c; }
.priority.high { background: #fef0f0; color: #f56c6c; }
.priority.urgent { background: #fef0f0; color: #f56c6c; font-weight: 600; }

.repair-desc {
  margin: 0 0 8px 0;
  color: #606266;
  font-size: 13px;
}

.repair-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #909399;
}

.activity-card {
  cursor: pointer;
  margin-bottom: 12px;
}

.activity-card h4 {
  margin: 0 0 8px 0;
  color: #303133;
}

.activity-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: #606266;
}
</style>
