<template>
  <div class="dashboard">
    <el-row :gutter="20" class="mb-20">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon blue">
              <el-icon size="32"><Document /></el-icon>
            </div>
            <div class="stat-info">
              <p class="stat-value">{{ stats.totalOrders || 0 }}</p>
              <p class="stat-label">总工单数</p>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon orange">
              <el-icon size="32"><Clock /></el-icon>
            </div>
            <div class="stat-info">
              <p class="stat-value">{{ stats.pendingOrders || 0 }}</p>
              <p class="stat-label">待处理工单</p>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon green">
              <el-icon size="32"><Tools /></el-icon>
            </div>
            <div class="stat-info">
              <p class="stat-value">{{ stats.processingOrders || 0 }}</p>
              <p class="stat-label">处理中工单</p>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon red">
              <el-icon size="32"><Warning /></el-icon>
            </div>
            <div class="stat-info">
              <p class="stat-value">{{ stats.urgentOrders || 0 }}</p>
              <p class="stat-label">紧急工单</p>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="16">
        <el-card shadow="never">
          <template #header>
            <div class="flex-between">
              <span>最近工单</span>
              <el-button type="primary" link @click="$router.push('/orders')">查看全部</el-button>
            </div>
          </template>
          <el-table :data="recentOrders" v-loading="loading">
            <el-table-column prop="orderNo" label="工单编号" width="160" />
            <el-table-column prop="title" label="标题" />
            <el-table-column label="优先级" width="100">
              <template #default="{ row }">
                <span :class="getPriorityClass(row.priority)">{{ getPriorityText(row.priority) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="创建时间" width="160" />
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button type="primary" link @click="viewDetail(row.id)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never">
          <template #header>
            <div class="flex-between">
              <span>快捷操作</span>
            </div>
          </template>
          <div class="quick-actions">
            <el-button v-if="canCreateOrder" type="primary" size="large" @click="$router.push('/orders/create')" style="width: 100%; margin-bottom: 12px;">
              <el-icon><Edit /></el-icon>
              提交报修
            </el-button>
            <el-button v-if="canViewOrder" type="success" size="large" @click="$router.push('/orders')" style="width: 100%; margin-bottom: 12px;">
              <el-icon><List /></el-icon>
              查看工单
            </el-button>
            <el-button v-if="canInspection" type="warning" size="large" @click="$router.push('/inspection')" style="width: 100%; margin-bottom: 12px;">
              <el-icon><Location /></el-icon>
              巡检打卡
            </el-button>
            <el-button type="info" size="large" @click="$router.push('/messages')" style="width: 100%;">
              <el-icon><Bell /></el-icon>
              消息中心
            </el-button>
          </div>
        </el-card>

        <el-card shadow="never" style="margin-top: 20px;">
          <template #header>
            <span>工作流程说明</span>
          </template>
          <el-steps direction="vertical" :active="5">
            <el-step title="申请" description="业主在线提交报修申请" />
            <el-step title="审核" description="物业主管/人员审核工单" />
            <el-step title="派单" description="指派维修人员处理" />
            <el-step title="执行" description="维修人员上门处理" />
            <el-step title="验收" description="业主验收并上传照片" />
            <el-step title="复盘" description="满意度评价与数据分析" />
          </el-steps>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { getDashboardStats, getOrderPage } from '@/api/order'

const router = useRouter()
const userStore = useUserStore()

const stats = ref({})
const recentOrders = ref([])
const loading = ref(false)

const userRole = computed(() => userStore.userInfo?.role)
const canCreateOrder = computed(() => ['OWNER', 'PROPERTY', 'ADMIN'].includes(userRole.value))
const canViewOrder = computed(() => true)
const canInspection = computed(() => ['INSPECTOR', 'ADMIN', 'PROPERTY'].includes(userRole.value))

function getPriorityClass(priority) {
  const map = {
    URGENT: 'urgent-tag',
    HIGH: 'high-tag',
    NORMAL: 'normal-tag',
    LOW: 'low-tag'
  }
  return map[priority] || 'normal-tag'
}

function getPriorityText(priority) {
  const map = {
    URGENT: '紧急',
    HIGH: '高',
    NORMAL: '普通',
    LOW: '低'
  }
  return map[priority] || priority
}

function getStatusType(status) {
  const map = {
    PENDING: 'warning',
    APPROVED: 'primary',
    PROCESSING: 'info',
    COMPLETED: 'success',
    CLOSED: '',
    REJECTED: 'danger'
  }
  return map[status] || ''
}

function getStatusText(status) {
  const map = {
    PENDING: '待审核',
    APPROVED: '已派单',
    PROCESSING: '处理中',
    COMPLETED: '待验收',
    CLOSED: '已关闭',
    REJECTED: '已驳回'
  }
  return map[status] || status
}

function viewDetail(id) {
  router.push(`/orders/${id}`)
}

async function loadData() {
  loading.value = true
  try {
    const statsRes = await getDashboardStats()
    stats.value = statsRes.data

    const orderRes = await getOrderPage({ page: 1, size: 5 })
    recentOrders.value = orderRes.data.records
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.stat-card {
  border-radius: 8px;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.stat-icon.blue {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.orange {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.green {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.red {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  margin: 0;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

.quick-actions {
  display: flex;
  flex-direction: column;
}
</style>
