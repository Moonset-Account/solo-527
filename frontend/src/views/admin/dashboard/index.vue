<template>
  <div class="dashboard-page">
    <div class="stats-cards">
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon appointment">
              <el-icon :size="28"><Calendar /></el-icon>
            </div>
            <div class="stat-info">
              <p class="stat-label">今日预约</p>
              <p class="stat-value">{{ todayAppointments }}</p>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon checkin">
              <el-icon :size="28"><Finished /></el-icon>
            </div>
            <div class="stat-info">
              <p class="stat-label">今日到店</p>
              <p class="stat-value">{{ todayStats.checkedIn || 0 }}</p>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon money">
              <el-icon :size="28"><Money /></el-icon>
            </div>
            <div class="stat-info">
              <p class="stat-label">今日营收</p>
              <p class="stat-value">¥{{ todayStats.totalAmount || 0 }}</p>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon member">
              <el-icon :size="28"><Avatar /></el-icon>
            </div>
            <div class="stat-info">
              <p class="stat-label">会员数量</p>
              <p class="stat-value">{{ memberCount }}</p>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <el-row :gutter="20" class="content-row">
      <el-col :span="16">
        <el-card class="card">
          <template #header>
            <div class="card-header">
              <span>今日预约</span>
              <el-button type="primary" text @click="goToAppointments">查看全部</el-button>
            </div>
          </template>
          <el-table :data="todayAppointmentList" size="small">
            <el-table-column prop="startTime" label="时间" width="100" />
            <el-table-column prop="customerName" label="顾客" width="100" />
            <el-table-column prop="technicianName" label="技师" width="100" />
            <el-table-column label="服务项目">
              <template #default="{ row }">
                {{ row.services?.map(s => s.serviceName).join('、') }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="statusType(row.status)" size="small">
                  {{ statusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="todayAppointmentList.length === 0" description="暂无预约" :image-size="80" />
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="card">
          <template #header>
            <span>最近操作</span>
          </template>
          <el-timeline>
            <el-timeline-item
              v-for="log in recentLogs"
              :key="log._id"
              :timestamp="formatTime(log.createdAt)"
              placement="top"
            >
              <p class="log-item">
                <span class="log-operator">{{ log.operatorName }}</span>
                {{ log.description }}
              </p>
            </el-timeline-item>
          </el-timeline>
          <el-empty v-if="recentLogs.length === 0" description="暂无记录" :image-size="60" />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="content-row">
      <el-col :span="12">
        <el-card class="card">
          <template #header>
            <span>待处理提醒</span>
          </template>
          <div class="reminder-list">
            <div v-for="reminder in reminders" :key="reminder._id" class="reminder-item">
              <el-icon :size="20" :class="reminder.level">
                <Bell />
              </el-icon>
              <div class="reminder-content">
                <p class="reminder-title">{{ reminder.name }}</p>
                <p class="reminder-desc">{{ reminder.description }}</p>
              </div>
              <el-tag :type="reminder.category === 'alert' ? 'danger' : 'info'" size="small">
                {{ reminder.category === 'alert' ? '告警' : '日常' }}
              </el-tag>
            </div>
          </div>
          <el-empty v-if="reminders.length === 0" description="暂无提醒" :image-size="60" />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="card">
          <template #header>
            <span>快捷操作</span>
          </template>
          <div class="quick-actions">
            <div class="action-item" @click="goToAppointments">
              <el-icon :size="32"><Calendar /></el-icon>
              <span>预约管理</span>
            </div>
            <div class="action-item" @click="goToCheckin">
              <el-icon :size="32"><Finished /></el-icon>
              <span>到店核销</span>
            </div>
            <div class="action-item" @click="goToCashier">
              <el-icon :size="32"><Money /></el-icon>
              <span>收银记录</span>
            </div>
            <div class="action-item" @click="goToMemberships">
              <el-icon :size="32"><CreditCard /></el-icon>
              <span>会员卡</span>
            </div>
            <div class="action-item" @click="goToServices">
              <el-icon :size="32"><Goods /></el-icon>
              <span>服务项目</span>
            </div>
            <div class="action-item" @click="goToTechnicians">
              <el-icon :size="32"><UserFilled /></el-icon>
              <span>技师管理</span>
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
import {
  Calendar,
  Finished,
  Money,
  Avatar,
  Bell,
  Goods,
  UserFilled,
  CreditCard,
} from '@element-plus/icons-vue'
import { getAppointments, getTodayAppointmentCount } from '@/api/appointments'
import { getTodayCheckinStats } from '@/api/checkin'
import { getRecentLogs } from '@/api/operation-logs'
import { getAllReminders } from '@/api/reminders'
import dayjs from 'dayjs'

const router = useRouter()

const todayAppointments = ref(0)
const todayStats = ref({})
const memberCount = ref(0)
const todayAppointmentList = ref([])
const recentLogs = ref([])
const reminders = ref([])

async function loadStats() {
  try {
    todayAppointments.value = await getTodayAppointmentCount()
  } catch (e) {}

  try {
    todayStats.value = await getTodayCheckinStats()
  } catch (e) {}

  try {
    const data = await getAppointments({ date: dayjs().format('YYYY-MM-DD') })
    todayAppointmentList.value = data.slice(0, 6)
  } catch (e) {}

  try {
    const logs = await getRecentLogs(10)
    recentLogs.value = logs
  } catch (e) {}

  try {
    const data = await getAllReminders()
    reminders.value = [...(data.alert || []), ...(data.daily || [])].slice(0, 5)
  } catch (e) {}
}

function statusText(status) {
  const map = {
    pending: '待确认',
    confirmed: '已确认',
    checked_in: '服务中',
    completed: '已完成',
    cancelled: '已取消',
  }
  return map[status] || status
}

function statusType(status) {
  const map = {
    pending: 'warning',
    confirmed: 'primary',
    checked_in: 'success',
    completed: 'success',
    cancelled: 'info',
  }
  return map[status] || 'info'
}

function formatTime(time) {
  return dayjs(time).format('HH:mm')
}

function goToAppointments() {
  router.push('/admin/appointments')
}

function goToCheckin() {
  router.push('/admin/checkin')
}

function goToCashier() {
  router.push('/admin/cashier')
}

function goToMemberships() {
  router.push('/admin/memberships')
}

function goToServices() {
  router.push('/admin/services')
}

function goToTechnicians() {
  router.push('/admin/technicians')
}

onMounted(() => {
  loadStats()
})
</script>

<style scoped lang="scss">
.dashboard-page {
  .stats-cards {
    margin-bottom: 20px;
  }

  .stat-card {
    background: #fff;
    border-radius: 8px;
    padding: 24px;
    display: flex;
    align-items: center;
    gap: 20px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);

    .stat-icon {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;

      &.appointment {
        background: linear-gradient(135deg, #667eea, #764ba2);
      }

      &.checkin {
        background: linear-gradient(135deg, #f093fb, #f5576c);
      }

      &.money {
        background: linear-gradient(135deg, #4facfe, #00f2fe);
      }

      &.member {
        background: linear-gradient(135deg, #43e97b, #38f9d7);
      }
    }

    .stat-info {
      .stat-label {
        font-size: 14px;
        color: #999;
        margin: 0 0 4px 0;
      }

      .stat-value {
        font-size: 28px;
        font-weight: bold;
        color: #333;
        margin: 0;
      }
    }
  }

  .content-row {
    margin-bottom: 20px;
  }

  .card {
    height: 100%;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }

  .log-item {
    margin: 0;
    font-size: 13px;
    color: #666;

    .log-operator {
      color: #333;
      font-weight: 500;
    }
  }

  .reminder-list {
    .reminder-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 0;
      border-bottom: 1px solid #f0f0f0;

      &:last-child {
        border-bottom: none;
      }

      .error {
        color: #f56c6c;
      }

      .warning {
        color: #e6a23c;
      }

      .info {
        color: #409eff;
      }

      .reminder-content {
        flex: 1;

        .reminder-title {
          margin: 0 0 4px 0;
          font-size: 14px;
          font-weight: 500;
        }

        .reminder-desc {
          margin: 0;
          font-size: 12px;
          color: #999;
        }
      }
    }
  }

  .quick-actions {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;

    .action-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 20px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s;
      color: #666;

      &:hover {
        background: #f5f7fa;
        color: #e91e63;
      }

      span {
        font-size: 13px;
      }
    }
  }
}
</style>
