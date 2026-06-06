<template>
  <div class="dashboard-page">
    <div class="page-header">
      <h1 class="page-title">数据看板</h1>
    </div>

    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card plot-card">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon :size="32"><Grid /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ overviewStats.plots?.total || 0 }}</div>
              <div class="stat-label">地块总数</div>
              <div class="stat-sub">
                <span class="available">可认领 {{ overviewStats.plots?.available || 0 }}</span>
                <span class="claimed">已认领 {{ overviewStats.plots?.claimed || 0 }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card claim-card">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon :size="32"><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ overviewStats.claims?.total || 0 }}</div>
              <div class="stat-label">申请总数</div>
              <div class="stat-sub">
                <span class="pending">待处理 {{ overviewStats.claims?.pending || 0 }}</span>
                <span class="approved">已通过 {{ overviewStats.claims?.approved || 0 }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card rotation-card">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon :size="32"><Calendar /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ overviewStats.rotations?.total || 0 }}</div>
              <div class="stat-label">轮值任务</div>
              <div class="stat-sub">
                <span class="pending">待执行 {{ overviewStats.rotations?.pending || 0 }}</span>
                <span class="absent">缺席 {{ overviewStats.rotations?.absent || 0 }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card harvest-card">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon :size="32"><ShoppingBasket /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ overviewStats.harvests?.totalQuantity || 0 }}</div>
              <div class="stat-label">收获总量(公斤)</div>
              <div class="stat-sub">
                <span>记录 {{ overviewStats.harvests?.totalHarvests || 0 }} 次</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="18">
        <el-card class="card-wrapper">
          <template #header>
            <div class="card-header">
              <span>综合分析看板</span>
            </div>
          </template>
          
          <div class="filter-section">
            <span class="filter-label">筛选条件：</span>
            <el-select v-model="filters.timeRange" placeholder="时间范围" style="width: 140px">
              <el-option label="近一周" value="week" />
              <el-option label="近一月" value="month" />
              <el-option label="近三月" value="quarter" />
              <el-option label="全部" value="all" />
            </el-select>
            <el-select v-model="filters.status" placeholder="状态筛选" clearable style="width: 140px">
              <el-option label="待处理" value="pending" />
              <el-option label="进行中" value="in_progress" />
              <el-option label="已完成" value="completed" />
              <el-option label="已缺席" value="absent" />
            </el-select>
            <el-select v-model="filters.assigneeId" placeholder="负责人" clearable style="width: 140px">
              <el-option v-for="user in residents" :key="user.id" :label="user.name" :value="user.id" />
            </el-select>
            <el-button type="primary" @click="loadFilteredData">应用筛选</el-button>
            <el-button @click="resetFilters">重置</el-button>
          </div>

          <el-tabs v-model="activeTab">
            <el-tab-pane label="轮值任务分析" name="rotations">
              <div v-if="filteredData.rotations.length === 0" class="empty-data">
                <el-empty description="暂无数据" :image-size="80" />
              </div>
              <div v-else class="analysis-content">
                <div class="summary-bar">
                  <div class="summary-item">
                    <span class="label">任务总数</span>
                    <span class="value">{{ filteredData.rotations.length }}</span>
                  </div>
                  <div class="summary-item">
                    <span class="label">完成率</span>
                    <span class="value success">
                      {{ calculateCompletionRate(filteredData.rotations) }}%
                    </span>
                  </div>
                  <div class="summary-item">
                    <span class="label">缺席率</span>
                    <span class="value danger">
                      {{ calculateAbsentRate(filteredData.rotations) }}%
                    </span>
                  </div>
                </div>
                <el-table :data="filteredData.rotations" size="small" stripe>
                  <el-table-column label="日期" width="100">
                    <template #default="{ row }">
                      {{ formatShortDate(row.date) }}
                    </template>
                  </el-table-column>
                  <el-table-column prop="type" label="类型" width="80">
                    <template #default="{ row }">{{ getTypeText(row.type) }}</template>
                  </el-table-column>
                  <el-table-column prop="description" label="任务" show-overflow-tooltip />
                  <el-table-column prop="assigneeName" label="负责人" width="100" />
                  <el-table-column label="状态" width="80">
                    <template #default="{ row }">
                      <el-tag :type="getStatusType(row.status)" size="small">
                        {{ getStatusText(row.status) }}
                      </el-tag>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </el-tab-pane>
            
            <el-tab-pane label="认领申请分析" name="claims">
              <div v-if="filteredData.claims.length === 0" class="empty-data">
                <el-empty description="暂无数据" :image-size="80" />
              </div>
              <div v-else class="analysis-content">
                <div class="summary-bar">
                  <div class="summary-item">
                    <span class="label">申请总数</span>
                    <span class="value">{{ filteredData.claims.length }}</span>
                  </div>
                  <div class="summary-item">
                    <span class="label">通过率</span>
                    <span class="value success">
                      {{ calculateApprovalRate(filteredData.claims) }}%
                    </span>
                  </div>
                  <div class="summary-item">
                    <span class="label">待处理</span>
                    <span class="value warning">
                      {{ filteredData.claims.filter(c => c.status === 'pending').length }}
                    </span>
                  </div>
                </div>
                <el-table :data="filteredData.claims" size="small" stripe>
                  <el-table-column prop="plotNumber" label="地块" width="80" />
                  <el-table-column prop="applicantName" label="申请人" width="100" />
                  <el-table-column prop="reason" label="申请原因" show-overflow-tooltip />
                  <el-table-column label="状态" width="80">
                    <template #default="{ row }">
                      <el-tag :type="getClaimStatusType(row.status)" size="small">
                        {{ getClaimStatusText(row.status) }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column label="申请时间" width="130">
                    <template #default="{ row }">
                      {{ formatShortDate(row.createdAt) }}
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="card-wrapper">
          <template #header>
            <span>资源利用率</span>
          </template>
          <div class="utilization-list">
            <div v-for="item in resourceUtilization" :key="item.name" class="utilization-item">
              <div class="utilization-header">
                <span class="name">{{ item.name }}</span>
                <span class="value" :class="item.status">{{ item.value }}{{ item.unit }}</span>
              </div>
              <el-progress 
                :percentage="item.value" 
                :color="getUtilizationColor(item.status)"
                :stroke-width="10"
              />
              <div class="utilization-desc">{{ item.description }}</div>
            </div>
          </div>
        </el-card>

        <el-card class="card-wrapper" style="margin-top: 20px">
          <template #header>
            <span>瓶颈分析</span>
          </template>
          <div v-if="bottlenecks.length === 0" class="empty-bottleneck">
            <el-result icon="success" title="运行良好" sub-title="当前没有发现明显瓶颈" :icon-size="40" />
          </div>
          <div v-else class="bottleneck-list">
            <div 
              v-for="item in bottlenecks" 
              :key="item.type" 
              class="bottleneck-item"
              :class="item.severity"
            >
              <div class="bottleneck-header">
                <el-icon :size="18">
                  <WarningFilled v-if="item.severity === 'high'" />
                  <InfoFilled v-else />
                </el-icon>
                <span class="title">{{ item.title }}</span>
                <el-badge :value="item.count" class="item" />
              </div>
              <div class="bottleneck-desc">{{ item.description }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { dashboardService, userService } from '@/services'
import { Grid, Document, Calendar, ShoppingBasket, WarningFilled, InfoFilled } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

const authStore = useAuthStore()

const overviewStats = ref({})
const resourceUtilization = ref([])
const bottlenecks = ref([])
const residents = ref([])
const activeTab = ref('rotations')

const filters = ref({
  timeRange: 'month',
  status: '',
  assigneeId: ''
})

const filteredData = ref({
  rotations: [],
  claims: []
})

onMounted(async () => {
  await loadOverview()
  await loadResourceUtilization()
  await loadBottlenecks()
  await loadResidents()
  await loadFilteredData()
})

async function loadOverview() {
  overviewStats.value = await dashboardService.getOverviewStats()
}

async function loadResourceUtilization() {
  resourceUtilization.value = await dashboardService.getResourceUtilization()
}

async function loadBottlenecks() {
  bottlenecks.value = await dashboardService.getBottleneckAnalysis()
}

async function loadResidents() {
  residents.value = await userService.getResidents()
}

async function loadFilteredData() {
  const result = await dashboardService.getFilteredDashboardData(filters.value)
  filteredData.value = result
}

function resetFilters() {
  filters.value = {
    timeRange: 'month',
    status: '',
    assigneeId: ''
  }
  loadFilteredData()
}

function calculateCompletionRate(rotations) {
  if (rotations.length === 0) return 0
  const completed = rotations.filter(r => r.status === 'completed').length
  return Math.round((completed / rotations.length) * 100)
}

function calculateAbsentRate(rotations) {
  if (rotations.length === 0) return 0
  const absent = rotations.filter(r => r.status === 'absent').length
  return Math.round((absent / rotations.length) * 100)
}

function calculateApprovalRate(claims) {
  if (claims.length === 0) return 0
  const reviewed = claims.filter(c => c.status !== 'pending' && c.status !== 'cancelled')
  if (reviewed.length === 0) return 0
  const approved = reviewed.filter(c => c.status === 'approved').length
  return Math.round((approved / reviewed.length) * 100)
}

function formatShortDate(date) {
  if (!date) return ''
  return dayjs(date.seconds ? date.seconds * 1000 : date).format('MM-DD')
}

function getTypeText(type) {
  const map = {
    water: '浇水',
    fertilize: '施肥',
    weed: '除草',
    pest: '防虫',
    clean: '清理',
    other: '其他'
  }
  return map[type] || type
}

function getStatusType(status) {
  const map = {
    pending: 'warning',
    in_progress: 'primary',
    completed: 'success',
    absent: 'danger'
  }
  return map[status] || 'info'
}

function getStatusText(status) {
  const map = {
    pending: '待执行',
    in_progress: '进行中',
    completed: '已完成',
    absent: '已缺席'
  }
  return map[status] || status
}

function getClaimStatusType(status) {
  const map = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
    cancelled: 'info'
  }
  return map[status] || 'info'
}

function getClaimStatusText(status) {
  const map = {
    pending: '待审批',
    approved: '已通过',
    rejected: '已拒绝',
    cancelled: '已取消'
  }
  return map[status] || status
}

function getUtilizationColor(status) {
  const map = {
    low: '#f56c6c',
    medium: '#e6a23c',
    high: '#67c23a'
  }
  return map[status] || '#409eff'
}
</script>

<style scoped>
.dashboard-page {
  padding: 0;
}
.stats-row {
  margin-bottom: 20px;
}
.stat-card {
  border: none;
  border-radius: 8px;
}
.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}
.stat-icon {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}
.plot-card .stat-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.claim-card .stat-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}
.rotation-card .stat-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}
.harvest-card .stat-icon {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}
.stat-info {
  flex: 1;
}
.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  line-height: 1.2;
}
.stat-label {
  font-size: 14px;
  color: #909399;
  margin: 4px 0;
}
.stat-sub {
  font-size: 12px;
  display: flex;
  gap: 12px;
  color: #909399;
}
.stat-sub .available { color: #67c23a; }
.stat-sub .claimed { color: #409eff; }
.stat-sub .pending { color: #e6a23c; }
.stat-sub .approved { color: #67c23a; }
.stat-sub .absent { color: #f56c6c; }

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.filter-section {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 20px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
}
.filter-label {
  font-weight: 600;
  color: #606266;
}
.summary-bar {
  display: flex;
  gap: 40px;
  margin-bottom: 20px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}
.summary-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.summary-item .label {
  font-size: 13px;
  color: #909399;
}
.summary-item .value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}
.summary-item .value.success { color: #67c23a; }
.summary-item .value.danger { color: #f56c6c; }
.summary-item .value.warning { color: #e6a23c; }

.empty-data {
  padding: 40px 0;
}
.utilization-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.utilization-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}
.utilization-header .name {
  font-weight: 600;
}
.utilization-header .value.low { color: #f56c6c; }
.utilization-header .value.medium { color: #e6a23c; }
.utilization-header .value.high { color: #67c23a; }
.utilization-desc {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
.empty-bottleneck {
  padding: 20px 0;
}
.bottleneck-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.bottleneck-item {
  padding: 12px;
  border-radius: 8px;
  border-left: 4px solid #e4e7ed;
}
.bottleneck-item.high {
  background: #fef0f0;
  border-left-color: #f56c6c;
}
.bottleneck-item.medium {
  background: #fdf6ec;
  border-left-color: #e6a23c;
}
.bottleneck-item.low {
  background: #f0f9ff;
  border-left-color: #409eff;
}
.bottleneck-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}
.bottleneck-header .title {
  font-weight: 600;
  flex: 1;
}
.bottleneck-desc {
  font-size: 13px;
  color: #606266;
}
</style>
