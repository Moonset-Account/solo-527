<template>
  <div class="repair-manage">
    <div class="page-header">
      <h2>修复管理</h2>
      <div class="header-actions">
        <el-button type="primary" @click="handleExport">
          <el-icon><Download /></el-icon>
          导出Excel
        </el-button>
      </div>
    </div>
    
    <div class="filter-bar">
      <el-form :inline="true" :model="filters" @submit.prevent>
        <el-form-item label="破损类型">
          <el-select v-model="filters.damage_type" placeholder="全部" clearable @change="loadRepairs">
            <el-option label="撕裂" value="tear" />
            <el-option label="污渍" value="stain" />
            <el-option label="缺页" value="page_missing" />
            <el-option label="装订问题" value="binding" />
            <el-option label="水渍" value="water_damage" />
            <el-option label="霉变" value="mold" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="修复状态">
          <el-select v-model="filters.status" placeholder="全部" clearable @change="loadRepairs">
            <el-option label="已上报" value="reported" />
            <el-option label="评估中" value="assessing" />
            <el-option label="修复中" value="in_progress" />
            <el-option label="已完成" value="completed" />
            <el-option label="已报废" value="scrapped" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="优先级">
          <el-select v-model="filters.priority" placeholder="全部" clearable @change="loadRepairs">
            <el-option label="低" value="low" />
            <el-option label="中" value="medium" />
            <el-option label="高" value="high" />
            <el-option label="紧急" value="urgent" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="负责人">
          <el-select v-model="filters.assigned_to" placeholder="全部" clearable @change="loadRepairs">
            <el-option
              v-for="user in librarians"
              :key="user.id"
              :label="user.username"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="loadRepairs">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
          <el-button @click="resetFilters">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </div>
    
    <el-table
      :data="repairs"
      stripe
      v-loading="loading"
      @row-click="goToDetail"
      row-key="id"
    >
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="book_title" label="绘本名称" min-width="150">
        <template #default="{ row }">
          <div class="book-name-cell">
            <img v-if="row.book_cover" :src="row.book_cover" class="mini-cover" />
            <span>{{ row.book_title }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="book_copy_barcode" label="条码号" width="120" />
      <el-table-column prop="damage_type_display" label="破损类型" width="100" />
      <el-table-column prop="status_display" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)" size="small">
            {{ row.status_display }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="priority" label="优先级" width="80">
        <template #default="{ row }">
          <span class="priority-tag" :class="row.priority">
            {{ getPriorityLabel(row.priority) }}
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="reported_by_name" label="上报人" width="100" />
      <el-table-column prop="assigned_to_name" label="负责人" width="100">
        <template #default="{ row }">
          {{ row.assigned_to_name || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="estimated_cost" label="预估费用" width="100">
        <template #default="{ row }">¥{{ row.estimated_cost }}</template>
      </el-table-column>
      <el-table-column prop="reported_at" label="上报时间" width="160">
        <template #default="{ row }">{{ formatDateTime(row.reported_at) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" size="small" link @click.stop="handleTransition(row)">
            状态流转
          </el-button>
          <el-button type="success" size="small" link @click.stop="handleAssign(row)">
            分配
          </el-button>
          <el-button size="small" link @click.stop="viewPhotos(row)">
            照片
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <el-pagination
      v-model:current-page="pagination.page"
      v-model:page-size="pagination.pageSize"
      :total="pagination.total"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="loadRepairs"
      @current-change="loadRepairs"
      class="pagination"
    />
    
    <el-dialog v-model="showTransitionDialog" title="修复状态流转" width="500px">
      <div class="current-status">
        <span>当前状态：</span>
        <el-tag :type="getStatusType(selectedRepair?.status)">
          {{ selectedRepair?.status_display }}
        </el-tag>
      </div>
      <el-form :model="transitionForm" label-width="80px">
        <el-form-item label="流转到">
          <el-select v-model="transitionForm.new_status">
            <el-option
              v-for="status in availableTransitions"
              :key="status.value"
              :label="status.label"
              :value="status.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="transitionForm.notes" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="上传照片">
          <el-upload
            v-model:file-list="transitionForm.photos"
            action="#"
            :auto-upload="false"
            list-type="picture-card"
            :limit="3"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
        </el-form-item>
        <el-form-item label="照片说明">
          <el-input v-model="transitionForm.photo_description" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showTransitionDialog = false">取消</el-button>
        <el-button type="primary" @click="submitTransition">确定</el-button>
      </template>
    </el-dialog>
    
    <el-dialog v-model="showPhotosDialog" title="修复照片" width="700px">
      <div v-if="selectedRepair?.photos?.length > 0" class="photos-grid">
        <div v-for="photo in selectedRepair.photos" :key="photo.id" class="photo-item">
          <el-image :src="photo.photo" :preview-src-list="selectedRepair.photos.map(p => p.photo)" fit="cover" />
          <div class="photo-info">
            <div class="photo-stage">
              <el-tag size="small">{{ photo.stage_display }}</el-tag>
            </div>
            <div class="photo-desc">{{ photo.description || '无说明' }}</div>
            <div class="photo-time">{{ formatDateTime(photo.uploaded_at) }}</div>
          </div>
        </div>
      </div>
      <el-empty v-else description="暂无照片" />
    </el-dialog>
    
    <el-dialog v-model="showAssignDialog" title="分配负责人" width="400px">
      <el-form label-width="80px">
        <el-form-item label="负责人">
          <el-select v-model="assignForm.assigned_to" placeholder="请选择">
            <el-option
              v-for="user in librarians"
              :key="user.id"
              :label="user.username"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAssignDialog = false">取消</el-button>
        <el-button type="primary" @click="submitAssign">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Download, Search, Refresh, Plus } from '@element-plus/icons-vue'
import { api } from '@/api'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()

const repairs = ref([])
const librarians = ref([])
const loading = ref(false)

const filters = reactive({
  damage_type: '',
  status: '',
  priority: '',
  assigned_to: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const showTransitionDialog = ref(false)
const showPhotosDialog = ref(false)
const showAssignDialog = ref(false)
const selectedRepair = ref(null)

const transitionForm = reactive({
  new_status: '',
  notes: '',
  photos: [],
  photo_description: ''
})

const assignForm = reactive({
  assigned_to: null
})

const statusTransitions = {
  reported: [
    { value: 'assessing', label: '评估中' },
    { value: 'cancelled', label: '取消' }
  ],
  assessing: [
    { value: 'in_progress', label: '修复中' },
    { value: 'scrapped', label: '报废' },
    { value: 'cancelled', label: '取消' }
  ],
  in_progress: [
    { value: 'completed', label: '完成' },
    { value: 'scrapped', label: '报废' }
  ],
  completed: [],
  cancelled: [],
  scrapped: []
}

const availableTransitions = computed(() => {
  return statusTransitions[selectedRepair.value?.status] || []
})

function initFiltersFromQuery() {
  const query = route.query
  if (query.damage_type) filters.damage_type = query.damage_type
  if (query.status) filters.status = query.status
  if (query.priority) filters.priority = query.priority
  if (query.assigned_to) filters.assigned_to = query.assigned_to
  if (query.page) pagination.page = parseInt(query.page)
  if (query.pageSize) pagination.pageSize = parseInt(query.pageSize)
}

function updateQueryParams() {
  const query = {
    ...filters,
    page: pagination.page,
    pageSize: pagination.pageSize
  }
  Object.keys(query).forEach(key => {
    if (!query[key]) delete query[key]
  })
  router.replace({ query })
}

async function loadRepairs() {
  loading.value = true
  try {
    updateQueryParams()
    const params = {
      page: pagination.page,
      page_size: pagination.pageSize,
      ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
    }
    const data = await api.repairs.list(params)
    repairs.value = data.results || data
    pagination.total = data.count || data.length
  } catch (error) {
    ElMessage.error('加载修复记录失败')
  } finally {
    loading.value = false
  }
}

async function loadLibrarians() {
  try {
    const data = await api.accounts.users({ role: 'librarian' })
    librarians.value = data.results || data
  } catch (error) {}
}

function resetFilters() {
  filters.damage_type = ''
  filters.status = ''
  filters.priority = ''
  filters.assigned_to = ''
  pagination.page = 1
  loadRepairs()
}

function goToDetail(row) {
  router.push({
    path: `/admin/repairs/${row.id}`,
    query: { ...route.query }
  })
}

function getStatusType(status) {
  const map = {
    reported: 'primary',
    assessing: 'warning',
    in_progress: 'warning',
    completed: 'success',
    scrapped: 'danger',
    cancelled: 'info'
  }
  return map[status] || 'info'
}

function getPriorityLabel(priority) {
  const map = { low: '低', medium: '中', high: '高', urgent: '紧急' }
  return map[priority] || priority
}

function formatDateTime(date) {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-'
}

function handleTransition(row) {
  selectedRepair.value = row
  transitionForm.new_status = ''
  transitionForm.notes = ''
  transitionForm.photos = []
  transitionForm.photo_description = ''
  showTransitionDialog.value = true
}

function viewPhotos(row) {
  selectedRepair.value = row
  showPhotosDialog.value = true
}

function handleAssign(row) {
  selectedRepair.value = row
  assignForm.assigned_to = row.assigned_to
  showAssignDialog.value = true
}

async function submitTransition() {
  if (!transitionForm.new_status) {
    ElMessage.warning('请选择要流转的状态')
    return
  }
  
  try {
    const formData = new FormData()
    formData.append('new_status', transitionForm.new_status)
    if (transitionForm.notes) formData.append('notes', transitionForm.notes)
    if (transitionForm.photo_description) formData.append('photo_description', transitionForm.photo_description)
    
    transitionForm.photos.forEach(file => {
      if (file.raw) formData.append('photo', file.raw)
    })
    
    await api.repairs.transition(selectedRepair.value.id, formData)
    ElMessage.success('状态更新成功')
    showTransitionDialog.value = false
    loadRepairs()
  } catch (error) {}
}

async function submitAssign() {
  if (!assignForm.assigned_to) {
    ElMessage.warning('请选择负责人')
    return
  }
  
  try {
    await api.repairs.assign(selectedRepair.value.id, {
      assigned_to: assignForm.assigned_to
    })
    ElMessage.success('分配成功')
    showAssignDialog.value = false
    loadRepairs()
  } catch (error) {}
}

function handleExport() {
  const params = Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
  api.repairs.export(params).then(blob => {
    const url = window.URL.createObjectURL(new Blob([blob]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `修复记录_${dayjs().format('YYYYMMDD')}.xlsx`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    ElMessage.success('导出成功')
  }).catch(() => {
    ElMessage.error('导出失败')
  })
}

watch(() => route.query, () => {
  initFiltersFromQuery()
  loadRepairs()
}, { immediate: false })

onMounted(() => {
  initFiltersFromQuery()
  loadLibrarians()
  loadRepairs()
})
</script>

<style scoped>
.filter-bar {
  background: white;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.pagination {
  margin-top: 16px;
  justify-content: flex-end;
}

.book-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mini-cover {
  width: 32px;
  height: 40px;
  object-fit: cover;
  border-radius: 2px;
}

.priority-tag {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
}

.priority-tag.low { background: #f0f9eb; color: #67c23a; }
.priority-tag.medium { background: #fdf6ec; color: #e6a23c; }
.priority-tag.high { background: #fef0f0; color: #f56c6c; }
.priority-tag.urgent { background: #fef0f0; color: #f56c6c; font-weight: 600; }

.current-status {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.photos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
}

.photo-item {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  overflow: hidden;
}

.photo-item .el-image {
  width: 100%;
  height: 180px;
}

.photo-info {
  padding: 8px 12px;
  background: #fafafa;
}

.photo-stage {
  margin-bottom: 4px;
}

.photo-desc {
  font-size: 12px;
  color: #606266;
  margin-bottom: 4px;
}

.photo-time {
  font-size: 11px;
  color: #909399;
}
</style>
