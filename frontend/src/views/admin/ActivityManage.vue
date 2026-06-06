<template>
  <div class="activity-manage">
    <div class="page-header">
      <h2>活动管理</h2>
      <div class="header-actions">
        <el-button type="primary" @click="showCreate = true">
          <el-icon><Plus /></el-icon>
          新建活动
        </el-button>
      </div>
    </div>
    
    <div class="filter-bar">
      <el-form :inline="true" :model="filters">
        <el-form-item label="活动类型">
          <el-select v-model="filters.activity_type" placeholder="全部" clearable @change="loadActivities">
            <el-option label="故事会" value="story_telling" />
            <el-option label="手工活动" value="handcraft" />
            <el-option label="读书会" value="reading" />
            <el-option label="育儿讲座" value="parenting" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="活动状态">
          <el-select v-model="filters.status" placeholder="全部" clearable @change="loadActivities">
            <el-option label="草稿" value="draft" />
            <el-option label="已发布" value="published" />
            <el-option label="报名中" value="registration_open" />
            <el-option label="报名截止" value="registration_closed" />
            <el-option label="进行中" value="in_progress" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="即将开始">
          <el-switch v-model="filters.upcoming" @change="loadActivities" />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="loadActivities">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
    
    <el-table :data="activities" stripe v-loading="loading">
      <el-table-column prop="title" label="活动标题" min-width="200" />
      <el-table-column prop="activity_type_display" label="类型" width="100" />
      <el-table-column prop="status_display" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)" size="small">
            {{ row.status_display }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="报名情况" width="160">
        <template #default="{ row }">
          <div class="registration-stats">
            <span class="registered">{{ row.registered_count }}/{{ row.max_participants }}</span>
            <el-progress
              :percentage="Math.round(row.registered_count / row.max_participants * 100)"
              :stroke-width="8"
              :show-text="false"
              style="width: 80px; display: inline-block; margin-left: 8px"
            />
            <span v-if="row.waitlist_count > 0" class="waitlist-badge">
              候补 {{ row.waitlist_count }}
            </span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="时间" width="200">
        <template #default="{ row }">
          <div>{{ formatDateTime(row.start_time) }}</div>
          <div class="text-sm text-gray">{{ formatDateTime(row.end_time) }}</div>
        </template>
      </el-table-column>
      <el-table-column prop="location" label="地点" width="120" />
      <el-table-column label="操作" width="280" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" size="small" link @click="viewRegistrations(row)">
            报名名单
          </el-button>
          <template v-if="row.status === 'draft'">
            <el-button type="success" size="small" link @click="publishActivity(row)">发布</el-button>
          </template>
          <template v-else-if="row.status === 'published'">
            <el-button type="success" size="small" link @click="openRegistration(row)">开放报名</el-button>
          </template>
          <template v-else-if="row.status === 'registration_open'">
            <el-button type="warning" size="small" link @click="closeRegistration(row)">截止报名</el-button>
            <el-button v-if="row.waitlist_count > 0" type="primary" size="small" link @click="promoteWaitlist(row)">
              候补转正
            </el-button>
          </template>
          <template v-else-if="row.status !== 'completed' && row.status !== 'cancelled'">
            <el-button type="danger" size="small" link @click="cancelActivity(row)">取消活动</el-button>
          </template>
        </template>
      </el-table-column>
    </el-table>
    
    <el-pagination
      v-model:current-page="pagination.page"
      v-model:page-size="pagination.pageSize"
      :total="pagination.total"
      layout="total, prev, pager, next"
      @current-change="loadActivities"
      class="pagination"
    />
    
    <el-dialog
      v-model="showRegistrationsDialog"
      :title="`报名名单 - ${selectedActivity?.title}`"
      width="900px"
    >
      <el-tabs v-model="regTab">
        <el-tab-pane label="已报名" name="registered">
          <el-table :data="registeredList" size="small">
            <el-table-column prop="child_name" label="儿童姓名" width="100" />
            <el-table-column prop="child_age" label="年龄" width="80" />
            <el-table-column prop="family_name" label="家庭" width="120" />
            <el-table-column prop="registered_by_name" label="报名人" width="100" />
            <el-table-column prop="waitlist_position" label="候补位置" width="100">
              <template #default="{ row }">
                <span v-if="row.status === 'waitlisted'">第 {{ row.waitlist_position }} 位</span>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column prop="status_display" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 'no_show' ? 'danger' : 'success'" size="small">
                  {{ row.status_display }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="registered_at" label="报名时间" width="160">
              <template #default="{ row }">{{ formatDateTime(row.registered_at) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="180">
              <template #default="{ row }">
                <el-button
                  v-if="row.status === 'registered' || row.status === 'promoted' || row.status === 'confirmed'"
                  type="success"
                  size="small"
                  link
                  @click="markAttended(row)"
                >
                  签到
                </el-button>
                <el-button
                  v-if="row.status === 'registered' || row.status === 'promoted' || row.status === 'confirmed'"
                  type="danger"
                  size="small"
                  link
                  @click="markNoShow(row)"
                >
                  标记爽约
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="候补列表" name="waitlist">
          <el-table :data="waitlistList" size="small">
            <el-table-column prop="waitlist_position" label="候补位置" width="100" />
            <el-table-column prop="child_name" label="儿童姓名" width="100" />
            <el-table-column prop="child_age" label="年龄" width="80" />
            <el-table-column prop="family_name" label="家庭" width="120" />
            <el-table-column prop="registered_at" label="候补时间" width="160">
              <template #default="{ row }">{{ formatDateTime(row.registered_at) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <el-button type="primary" size="small" link @click="promoteSingle(row)">
                  手动转正
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { api } from '@/api'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()

const activities = ref([])
const loading = ref(false)
const showCreate = ref(false)
const showRegistrationsDialog = ref(false)
const selectedActivity = ref(null)
const regTab = ref('registered')
const registeredList = ref([])
const waitlistList = ref([])

const filters = reactive({
  activity_type: '',
  status: '',
  upcoming: false
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

function initFiltersFromQuery() {
  const query = route.query
  if (query.activity_type) filters.activity_type = query.activity_type
  if (query.status) filters.status = query.status
  if (query.upcoming) filters.upcoming = query.upcoming === 'true'
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
    if (!query[key] || query[key] === false) delete query[key]
  })
  router.replace({ query })
}

async function loadActivities() {
  loading.value = true
  try {
    updateQueryParams()
    const params = {
      page: pagination.page,
      page_size: pagination.pageSize,
      ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v && v !== false))
    }
    if (filters.upcoming) {
      params.upcoming = 'true'
    }
    const data = await api.activities.list(params)
    activities.value = data.results || data
    pagination.total = data.count || data.length
  } catch (error) {
    ElMessage.error('加载活动列表失败')
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filters.activity_type = ''
  filters.status = ''
  filters.upcoming = false
  pagination.page = 1
  loadActivities()
}

function formatDateTime(date) {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-'
}

function getStatusType(status) {
  const map = {
    draft: 'info',
    published: 'primary',
    registration_open: 'success',
    registration_closed: 'warning',
    in_progress: 'primary',
    completed: 'success',
    cancelled: 'danger'
  }
  return map[status] || 'info'
}

async function publishActivity(row) {
  try {
    await api.activities.publish(row.id)
    ElMessage.success('发布成功')
    loadActivities()
  } catch (error) {}
}

async function openRegistration(row) {
  try {
    await api.activities.openRegistration(row.id)
    ElMessage.success('已开放报名')
    loadActivities()
  } catch (error) {}
}

async function closeRegistration(row) {
  try {
    await api.activities.closeRegistration(row.id)
    ElMessage.success('已截止报名')
    loadActivities()
  } catch (error) {}
}

async function cancelActivity(row) {
  try {
    await ElMessageBox.confirm(
      '取消活动将自动退还所有报名者的押金，确定要取消吗？',
      '确认取消',
      { type: 'warning' }
    )
    await api.activities.cancel(row.id)
    ElMessage.success('活动已取消，押金将自动退还')
    loadActivities()
  } catch (error) {}
}

async function promoteWaitlist(row) {
  try {
    await api.activities.promoteWaitlist(row.id)
    ElMessage.success('候补转正处理中，已通知相关用户')
    loadActivities()
  } catch (error) {}
}

async function viewRegistrations(row) {
  selectedActivity.value = row
  try {
    const [regData, waitData] = await Promise.all([
      api.activities.registrations.list({ activity_id: row.id, status: 'registered' }),
      api.activities.registrations.list({ activity_id: row.id, waitlist: 'true' })
    ])
    registeredList.value = (regData.results || regData).filter(r => r.status !== 'waitlisted')
    waitlistList.value = waitData.results || waitData
    showRegistrationsDialog.value = true
  } catch (error) {}
}

async function markAttended(row) {
  try {
    await api.activities.registrations.markAttended(row.id)
    ElMessage.success('已签到')
    viewRegistrations(selectedActivity.value)
  } catch (error) {}
}

async function markNoShow(row) {
  try {
    await ElMessageBox.confirm(
      '标记爽约将扣除该家庭的活动押金，确定吗？',
      '确认标记',
      { type: 'warning' }
    )
    await api.activities.registrations.markNoShow(row.id)
    ElMessage.success('已标记爽约，押金已扣除')
    viewRegistrations(selectedActivity.value)
  } catch (error) {}
}

async function promoteSingle(row) {
  try {
    await ElMessageBox.confirm(`确定将 ${row.child_name} 从候补助转正吗？`, '确认转正', { type: 'info' })
    ElMessage.success('已转正')
    viewRegistrations(selectedActivity.value)
  } catch (error) {}
}

onMounted(() => {
  initFiltersFromQuery()
  loadActivities()
})
</script>

<style scoped>
.filter-bar {
  background: white;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.registration-stats {
  display: flex;
  align-items: center;
}

.registered {
  font-weight: 500;
  color: #67c23a;
}

.waitlist-badge {
  margin-left: 8px;
  font-size: 12px;
  background: #fdf6ec;
  color: #e6a23c;
  padding: 2px 6px;
  border-radius: 4px;
}

.text-sm {
  font-size: 12px;
}

.text-gray {
  color: #909399;
}

.pagination {
  margin-top: 16px;
  justify-content: flex-end;
}
</style>
