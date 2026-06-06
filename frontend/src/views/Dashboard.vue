<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h2>数据看板</h2>
      <el-date-picker
        v-model="dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        @change="handleDateChange"
      />
    </div>
    
    <el-row :gutter="20" class="stat-cards">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon primary">
              <el-icon><Document /></el-icon>
            </div>
            <div class="stat-info">
              <p class="stat-label">今日订单</p>
              <p class="stat-value">{{ overview?.today?.orders || 0 }}</p>
              <p class="stat-trend" v-if="overview?.today_order_change !== undefined">
                <span :class="overview.today_order_change >= 0 ? 'up' : 'down'">
                  {{ overview.today_order_change >= 0 ? '+' : '' }}{{ overview.today_order_change }}%
                </span>
                较昨日
              </p>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon success">
              <el-icon><Box /></el-icon>
            </div>
            <div class="stat-info">
              <p class="stat-label">待拣货</p>
              <p class="stat-value">{{ overview?.pending_picking || 0 }}</p>
              <p class="stat-sub">需处理</p>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon warning">
              <el-icon><Money /></el-icon>
            </div>
            <div class="stat-info">
              <p class="stat-label">今日销售额</p>
              <p class="stat-value">¥{{ overview?.today?.amount || 0 }}</p>
              <p class="stat-trend" v-if="overview?.today_amount_change !== undefined">
                <span :class="overview.today_amount_change >= 0 ? 'up' : 'down'">
                  {{ overview.today_amount_change >= 0 ? '+' : '' }}{{ overview.today_amount_change }}%
                </span>
                较昨日
              </p>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon danger">
              <el-icon><Warning /></el-icon>
            </div>
            <div class="stat-info">
              <p class="stat-label">超时预警</p>
              <p class="stat-value">{{ timeoutCount }}</p>
              <p class="stat-sub">需关注</p>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="20">
      <el-col :span="16">
        <el-card class="dashboard-card">
          <template #header>
            <div class="card-header">
              <span>超时预警</span>
              <el-radio-group v-model="timeoutFilter" size="small" @change="fetchTimeoutAlerts">
                <el-radio-button value="24">24小时</el-radio-button>
                <el-radio-button value="48">48小时</el-radio-button>
                <el-radio-button value="72">72小时</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          
          <el-table :data="timeoutAlerts" style="width: 100%" v-loading="loading.timeout">
            <el-table-column prop="type" label="类型" width="100">
              <template #default="{ row }">
                <el-tag :type="getAlertTypeTag(row.type)">{{ getAlertTypeName(row.type) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="no" label="编号" width="150" />
            <el-table-column prop="customer" label="客户" />
            <el-table-column prop="timeout_hours" label="超时(小时)" width="100">
              <template #default="{ row }">
                <span class="timeout-hours">{{ row.timeout_hours }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="assignee" label="负责人" width="100" />
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="goToDetail(row)">
                  查看
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card class="dashboard-card">
          <template #header>
            <span>资源利用率</span>
          </template>
          
          <div v-loading="loading.resource" class="resource-list">
            <div class="resource-item" v-for="picker in pickers" :key="picker.id">
              <div class="resource-header">
                <span class="resource-name">{{ picker.name }}</span>
                <span class="resource-value">{{ picker.utilization }}%</span>
              </div>
              <el-progress :percentage="picker.utilization" :status="picker.status" :show-text="false" />
              <p class="resource-desc">今日完成 {{ picker.completed }} 单</p>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="24">
        <el-card class="dashboard-card">
          <template #header>
            <div class="card-header">
              <span>工作流统计</span>
              <div class="filter-group">
                <el-select v-model="workflowFilter.assignee" placeholder="选择负责人" size="small" clearable @change="fetchWorkflowStats">
                  <el-option label="全部" value="" />
                </el-select>
              </div>
            </div>
          </template>
          
          <div v-loading="loading.workflow" class="workflow-stats">
            <div v-if="workflowStats" class="stats-grid">
              <div class="stats-item" v-for="status in orderStatuses" :key="status.key">
                <div class="stats-number">{{ workflowStats[status.key] || 0 }}</div>
                <div class="stats-label" :style="{ color: status.color }">{{ status.label }}</div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useDashboardStore } from '@/stores/dashboard'

const router = useRouter()
const dashboardStore = useDashboardStore()

const dateRange = ref([])
const timeoutFilter = ref('24')
const workflowFilter = ref({
  assignee: '',
})

const overview = computed(() => dashboardStore.overview)
const timeoutAlerts = computed(() => dashboardStore.timeoutAlerts || [])
const loading = computed(() => dashboardStore.loading)
const timeoutCount = computed(() => timeoutAlerts.value.length)

const pickers = computed(() => {
  const data = dashboardStore.resourceUtilization?.pickers || []
  return data.map(p => ({
    ...p,
    status: p.utilization >= 80 ? 'success' : p.utilization >= 50 ? 'warning' : 'info',
  }))
})

const workflowStats = computed(() => dashboardStore.workflowStats)

const orderStatuses = [
  { key: 'pending', label: '待确认', color: '#909399' },
  { key: 'confirmed', label: '已确认', color: '#409EFF' },
  { key: 'picking', label: '拣货中', color: '#E6A23C' },
  { key: 'shipped', label: '已发货', color: '#67C23A' },
  { key: 'completed', label: '已完成', color: '#67C23A' },
  { key: 'cancelled', label: '已取消', color: '#F56C6C' },
]

onMounted(() => {
  fetchData()
})

function fetchData() {
  dashboardStore.fetchOverview()
  fetchTimeoutAlerts()
  dashboardStore.fetchResourceUtilization()
  fetchWorkflowStats()
}

function fetchTimeoutAlerts() {
  dashboardStore.fetchTimeoutAlerts({
    hours: timeoutFilter.value,
  })
}

function fetchWorkflowStats() {
  dashboardStore.fetchWorkflowStats(workflowFilter.value)
}

function handleDateChange() {
  dashboardStore.fetchOverview()
  dashboardStore.fetchWorkflowStats(workflowFilter.value)
}

function getAlertTypeTag(type) {
  const map = {
    order: 'warning',
    picking: 'danger',
    return: 'info',
    debt: 'danger',
  }
  return map[type] || 'info'
}

function getAlertTypeName(type) {
  const map = {
    order: '订单',
    picking: '拣货',
    return: '退货',
    debt: '欠款',
  }
  return map[type] || type
}

function goToDetail(row) {
  const routes = {
    order: `/orders/${row.id}`,
    picking: `/picking/${row.id}`,
    return: `/returns/${row.id}`,
    debt: `/debts/${row.id}`,
  }
  if (routes[row.type]) {
    router.push(routes[row.type])
  }
}
</script>

<style scoped lang="scss">
.dashboard {
  .dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    
    h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
    }
  }
  
  .stat-cards {
    margin-bottom: 20px;
    
    .stat-card {
      .stat-content {
        display: flex;
        align-items: center;
        gap: 16px;
        
        .stat-icon {
          width: 56px;
          height: 56px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          color: #fff;
          
          &.primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
          &.success { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); }
          &.warning { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
          &.danger { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); }
        }
        
        .stat-info {
          flex: 1;
          
          .stat-label {
            margin: 0 0 4px 0;
            font-size: 14px;
            color: #909399;
          }
          
          .stat-value {
            margin: 0 0 4px 0;
            font-size: 24px;
            font-weight: 600;
            color: #303133;
          }
          
          .stat-trend {
            margin: 0;
            font-size: 12px;
            color: #909399;
            
            .up { color: #67C23A; }
            .down { color: #F56C6C; }
          }
          
          .stat-sub {
            margin: 0;
            font-size: 12px;
            color: #c0c4cc;
          }
        }
      }
    }
  }
  
  .dashboard-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .timeout-hours {
      color: #F56C6C;
      font-weight: 600;
    }
    
    .resource-list {
      .resource-item {
        margin-bottom: 20px;
        
        &:last-child {
          margin-bottom: 0;
        }
        
        .resource-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          
          .resource-name {
            font-weight: 500;
            color: #303133;
          }
          
          .resource-value {
            font-weight: 600;
            color: #409EFF;
          }
        }
        
        .resource-desc {
          margin: 4px 0 0 0;
          font-size: 12px;
          color: #909399;
        }
      }
    }
    
    .workflow-stats {
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 20px;
        
        .stats-item {
          text-align: center;
          padding: 20px;
          background: #f5f7fa;
          border-radius: 8px;
          
          .stats-number {
            font-size: 32px;
            font-weight: 600;
            color: #303133;
            margin-bottom: 8px;
          }
          
          .stats-label {
            font-size: 14px;
          }
        }
      }
    }
  }
}
</style>
