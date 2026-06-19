<template>
  <div class="dashboard-container">
    <el-row :gutter="20" class="stat-row">
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-content">
            <div class="stat-title">今日待办</div>
            <div class="stat-value">{{ dashboardData.todayTodoCount || 0 }}</div>
          </div>
          <el-icon class="stat-icon" color="#409EFF"><List /></el-icon>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-content">
            <div class="stat-title">本月线索</div>
            <div class="stat-value">{{ dashboardData.monthLeadCount || 0 }}</div>
          </div>
          <el-icon class="stat-icon" color="#67C23A"><User /></el-icon>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-content">
            <div class="stat-title">本月合同</div>
            <div class="stat-value">{{ dashboardData.monthContractCount || 0 }}</div>
          </div>
          <el-icon class="stat-icon" color="#E6A23C"><Document /></el-icon>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-content">
            <div class="stat-title">预计成交</div>
            <div class="stat-value">¥{{ formatMoney(dashboardData.expectedDealAmount) }}</div>
          </div>
          <el-icon class="stat-icon" color="#F56C6C"><Money /></el-icon>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="content-row">
      <el-col :span="16">
        <el-card class="todo-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">我的待办任务</span>
              <el-button type="primary" link @click="goToTodo">查看全部</el-button>
            </div>
          </template>
          <el-table :data="todoList" stripe>
            <el-table-column prop="taskName" label="任务名称" min-width="200" />
            <el-table-column prop="relatedType" label="关联类型" width="100">
              <template #default="{ row }">
                <el-tag size="small" :type="getRelatedTypeTag(row.relatedType)">{{ getRelatedTypeLabel(row.relatedType) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="priority" label="优先级" width="100">
              <template #default="{ row }">
                <StatusTag :status="row.priority" :status-map="priorityStatusMap" />
              </template>
            </el-table-column>
            <el-table-column prop="dueTime" label="截止时间" width="160" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <StatusTag :status="row.status" :status-map="taskStatusMap" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="handleTodo(row)">处理</el-button>
                <el-button type="success" link size="small" @click="handleComplete(row)">完成</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="!todoList.length" description="暂无待办任务" />
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="quick-card">
          <template #header>
            <span class="card-title">快捷操作</span>
          </template>
          <div class="quick-actions">
            <div class="quick-item" @click="goToCreateLead">
              <div class="quick-icon quick-icon-blue">
                <el-icon :size="28"><Plus /></el-icon>
              </div>
              <span class="quick-label">新建线索</span>
            </div>
            <div class="quick-item" @click="goToApproval">
              <div class="quick-icon quick-icon-orange">
                <el-icon :size="28"><Check /></el-icon>
              </div>
              <span class="quick-label">待审批</span>
            </div>
            <div class="quick-item" @click="goToCustomer">
              <div class="quick-icon quick-icon-green">
                <el-icon :size="28"><User /></el-icon>
              </div>
              <span class="quick-label">我的客户</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { List, User, Document, Money, Plus, Check } from '@element-plus/icons-vue'
import StatusTag from '@/components/StatusTag.vue'
import { getDashboard } from '@/api/report'
import { getMyTodoList, completeTodo } from '@/api/todo'
import { getDictOptions, TASK_PRIORITY, TASK_STATUS } from '@/utils/dict'

const router = useRouter()

const dashboardData = ref({})
const todoList = ref([])

const priorityStatusMap = {
  1: { label: '低', type: 'info' },
  2: { label: '中', type: 'primary' },
  3: { label: '高', type: 'warning' },
  4: { label: '紧急', type: 'danger' }
}

const taskStatusMap = {
  PENDING: { label: '待处理', type: 'warning' },
  PROCESSING: { label: '处理中', type: 'primary' },
  COMPLETED: { label: '已完成', type: 'success' },
  OVERDUE: { label: '已逾期', type: 'danger' },
  CANCELLED: { label: '已取消', type: 'info' }
}

const relatedTypeMap = {
  LEAD: { label: '线索', type: 'primary' },
  CONTRACT: { label: '合同', type: 'success' },
  APPROVAL: { label: '审批', type: 'warning' },
  FOLLOW: { label: '跟进', type: 'info' }
}

const formatMoney = (value) => {
  if (!value) return '0'
  return Number(value).toLocaleString()
}

const getRelatedTypeLabel = (type) => {
  return relatedTypeMap[type]?.label || type
}

const getRelatedTypeTag = (type) => {
  return relatedTypeMap[type]?.type || 'info'
}

const loadDashboard = async () => {
  try {
    const res = await getDashboard()
    dashboardData.value = res || {}
  } catch (e) {
    console.error(e)
  }
}

const loadTodoList = async () => {
  try {
    const res = await getMyTodoList()
    todoList.value = res || []
  } catch (e) {
    console.error(e)
  }
}

const handleTodo = (row) => {
  if (row.relatedType === 'LEAD' && row.relatedId) {
    router.push(`/leads/${row.relatedId}`)
  } else if (row.relatedType === 'CONTRACT' && row.relatedId) {
    router.push(`/contracts/${row.relatedId}`)
  } else {
    ElMessage.info('请前往待办页面处理')
  }
}

const handleComplete = async (row) => {
  try {
    await completeTodo(row.id)
    ElMessage.success('任务已完成')
    loadTodoList()
    loadDashboard()
  } catch (e) {
    console.error(e)
  }
}

const goToTodo = () => {
  router.push('/todos/my')
}

const goToCreateLead = () => {
  router.push('/leads')
}

const goToApproval = () => {
  router.push('/approvals/discount')
}

const goToCustomer = () => {
  router.push('/leads')
}

onMounted(() => {
  loadDashboard()
  loadTodoList()
})
</script>

<style lang="scss" scoped>
.dashboard-container {
  .stat-row {
    margin-bottom: 20px;
  }

  .stat-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24px;
    background-color: #fff;
    border-radius: 6px;

    .stat-content {
      .stat-title {
        font-size: 14px;
        color: var(--text-secondary);
        margin-bottom: 8px;
      }

      .stat-value {
        font-size: 28px;
        font-weight: 600;
        color: var(--text-primary);
      }
    }

    .stat-icon {
      font-size: 48px;
      opacity: 0.3;
    }
  }

  .content-row {
    .todo-card,
    .quick-card {
      height: 100%;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .card-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary);
    }
  }

  .quick-card {
    .quick-actions {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .quick-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      border-radius: 6px;
      cursor: pointer;
      transition: background-color 0.3s;

      &:hover {
        background-color: var(--bg-color);
      }

      .quick-icon {
        width: 56px;
        height: 56px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
      }

      .quick-icon-blue {
        background-color: #409EFF;
      }

      .quick-icon-orange {
        background-color: #E6A23C;
      }

      .quick-icon-green {
        background-color: #67C23A;
      }

      .quick-label {
        font-size: 16px;
        font-weight: 500;
        color: var(--text-primary);
      }
    }
  }
}
</style>
