<template>
  <div class="dashboard-page page-container">
    <div v-loading="loading" class="loading-wrapper">
      <el-row :gutter="16">
        <el-col :xs="12" :sm="6">
          <div class="stat-card">
            <div class="stat-header">
              <div class="stat-icon" style="background: rgba(64,158,255,0.1); color: #409eff">
                <el-icon :size="24"><DataAnalysis /></el-icon>
              </div>
            </div>
            <div class="stat-value">{{ formatNumber(overview?.summary?.totalAnomalies || 0) }}</div>
            <div class="stat-label">累计异常总数</div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6">
          <div class="stat-card">
            <div class="stat-header">
              <div class="stat-icon" style="background: rgba(230,162,60,0.1); color: #e6a23c">
                <el-icon :size="24"><Warning /></el-icon>
              </div>
              <div class="stat-trend up" v-if="overview?.summary?.todayNew">
                <el-icon><Top /></el-icon>{{ overview?.summary?.todayNew }} 今日
              </div>
            </div>
            <div class="stat-value" style="color: #e6a23c">
              {{ formatNumber(overview?.summary?.pendingAnomalies || 0) }}
            </div>
            <div class="stat-label">待处理异常</div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6">
          <div class="stat-card">
            <div class="stat-header">
              <div class="stat-icon" style="background: rgba(103,194,58,0.1); color: #67c23a">
                <el-icon :size="24"><CircleCheck /></el-icon>
              </div>
            </div>
            <div class="stat-value" style="color: #67c23a">
              {{ overview?.summary?.resolvedRate || 0 }}%
            </div>
            <div class="stat-label">问题解决率</div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6">
          <div class="stat-card">
            <div class="stat-header">
              <div class="stat-icon" style="background: rgba(245,108,108,0.1); color: #f56c6c">
                <el-icon :size="24"><Bell /></el-icon>
              </div>
              <el-tag type="success" size="small" effect="plain">
                {{ overview?.summary?.activeAlertRules || 0 }} 条运行中
              </el-tag>
            </div>
            <div class="stat-value" style="color: #f56c6c">
              {{ formatNumber(overview?.summary?.criticalCount || 0) }}
            </div>
            <div class="stat-label">严重告警</div>
          </div>
        </el-col>
      </el-row>

      <el-row :gutter="16" style="margin-top: 16px">
        <el-col :xs="24" :lg="14">
          <div class="card-wrapper">
            <div class="card-header">
              <span class="title">
                <el-icon><TrendCharts /></el-icon> 近7日异常趋势
              </span>
            </div>
            <div ref="trendRef" style="height: 300px;"></div>
          </div>
        </el-col>

        <el-col :xs="24" :lg="10">
          <div class="card-wrapper">
            <div class="card-header">
              <span class="title">
                <el-icon><PieChart /></el-icon> 异常分类分布
              </span>
            </div>
            <div ref="categoryRef" style="height: 300px;"></div>
          </div>
        </el-col>
      </el-row>

      <el-row :gutter="16" style="margin-top: 16px">
        <el-col :xs="24" :lg="8">
          <div class="card-wrapper todo-card">
            <div class="card-header">
              <span class="title">
                <el-icon><List /></el-icon> 我的待处理
                <el-tag type="warning" size="small" effect="plain" style="margin-left:8px">
                  {{ todo?.pendingTasks?.length || 0 }} 条
                </el-tag>
              </span>
              <el-button link type="primary" @click="router.push('/anomalies/list?status=pending')">
                查看全部
              </el-button>
            </div>
            <el-empty v-if="!todo?.pendingTasks?.length" description="暂无待处理" :image-size="80" />
            <div v-else class="todo-list">
              <div
                v-for="item in todo.pendingTasks.slice(0, 5)"
                :key="item._id"
                class="todo-item"
                @click="router.push(`/anomalies/${item._id}`)"
              >
                <div class="todo-left">
                  <el-tag
                    :class="`tag-${item.severity}`"
                    effect="dark"
                    size="small"
                    style="border: none"
                  >
                    {{ getSeverityInfo(item.severity).label }}
                  </el-tag>
                </div>
                <div class="todo-main">
                  <div class="todo-title" :title="item.title">{{ item.title }}</div>
                  <div class="todo-meta">
                    <span>{{ getCategoryInfo(item.category).label }}</span>
                    <span>· {{ fromNow(item.detectedAt) }}</span>
                  </div>
                </div>
                <el-icon class="todo-arrow"><ArrowRight /></el-icon>
              </div>
            </div>
          </div>
        </el-col>

        <el-col :xs="24" :lg="8">
          <div class="card-wrapper">
            <div class="card-header">
              <span class="title">
                <el-icon><Message /></el-icon> 最新通知
                <el-badge
                  :value="todo?.unreadCount || 0"
                  :hidden="!todo?.unreadCount"
                  class="unread-badge"
                  type="danger"
                />
              </span>
              <el-button link type="primary" @click="router.push('/notifications')">
                消息中心
              </el-button>
            </div>
            <el-empty v-if="!todo?.unreadNotifications?.length" description="暂无未读消息" :image-size="80" />
            <div v-else class="notification-list">
              <div
                v-for="item in todo.unreadNotifications.slice(0, 5)"
                :key="item._id"
                class="notification-item"
                @click="router.push('/notifications')"
              >
                <el-icon
                  class="notif-icon"
                  :style="{ color: getNotifIconColor(item.type) }"
                >
                  <component :is="getNotifIcon(item.type)" />
                </el-icon>
                <div class="notif-main">
                  <div class="notif-title" :title="item.title">{{ item.title }}</div>
                  <div class="notif-time">{{ fromNow(item.createdAt) }}</div>
                </div>
                <span class="unread-dot"></span>
              </div>
            </div>
          </div>
        </el-col>

        <el-col :xs="24" :lg="8">
          <div class="card-wrapper">
            <div class="card-header">
              <span class="title">
                <el-icon><Clock /></el-icon> 权限即将过期
              </span>
              <el-button link type="primary" @click="router.push('/users')" v-if="userStore.isManager">
                管理
              </el-button>
            </div>
            <el-empty
              v-if="!overview?.expiringPermissions?.length"
              description="暂无即将过期权限"
              :image-size="80"
            />
            <div v-else class="expire-list">
              <div
                v-for="item in overview.expiringPermissions.slice(0, 5)"
                :key="item._id"
                class="expire-item"
              >
                <el-avatar :size="32" style="background:#fa8c16">{{ item.name?.[0] }}</el-avatar>
                <div class="expire-main">
                  <div class="expire-name">{{ item.name }}</div>
                  <div class="expire-meta">
                    <el-tag :type="getExpireType(item.permissionExpireAt)" size="small">
                      {{ getExpireDays(item.permissionExpireAt) }}天到期
                    </el-tag>
                    <span class="expire-date">
                      {{ formatDateShort(item.permissionExpireAt) }}
                    </span>
                  </div>
                </div>
                <el-button
                  link
                  type="primary"
                  size="small"
                  v-if="userStore.isManager"
                >
                  通知
                </el-button>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>

      <el-row :gutter="16" style="margin-top: 16px">
        <el-col :xs="24" :lg="12">
          <div class="card-wrapper">
            <div class="card-header">
              <span class="title">
                <el-icon><Document /></el-icon> 最新复盘报表
              </span>
              <el-button link type="primary" @click="router.push('/reports/list')">
                全部报表
              </el-button>
            </div>
            <el-table
              :data="overview?.recentReports || []"
              size="small"
              :header-cell-style="{ background: '#fafafa' }"
            >
              <el-table-column prop="title" label="报表标题" min-width="200">
                <template #default="{ row }">
                  <a @click.stop="router.push(`/reports/${row._id}`)" style="color:#409eff">
                    {{ row.title }}
                  </a>
                </template>
              </el-table-column>
              <el-table-column label="类型" width="80" align="center">
                <template #default="{ row }">{{ reportTypeMap[row.reportType] }}</template>
              </el-table-column>
              <el-table-column label="状态" width="90" align="center">
                <template #default="{ row }">
                  <el-tag :type="reportStatusMap[row.status]?.type" size="small" effect="plain">
                    {{ reportStatusMap[row.status]?.label }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="周期" width="200">
                <template #default="{ row }">
                  {{ formatDateShort(row.startDate) }} ~ {{ formatDateShort(row.endDate) }}
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-col>

        <el-col :xs="24" :lg="12">
          <div class="card-wrapper">
            <div class="card-header">
              <span class="title">
                <el-icon><Warning /></el-icon> 最新异常摘要推送
              </span>
              <el-button link type="primary" @click="router.push('/anomalies/list')">
                全部异常
              </el-button>
            </div>
            <el-empty
              v-if="!overview?.toProcess?.toProcess?.length"
              description="暂无异常推送"
              :image-size="80"
            />
            <div v-else class="anomaly-feed">
              <div
                v-for="item in overview.toProcess.toProcess.slice(0, 6)"
                :key="item._id"
                class="feed-item"
                @click="router.push(`/anomalies/${item._id}`)"
              >
                <div class="feed-left">
                  <div
                    class="severity-dot"
                    :style="{ background: getSeverityInfo(item.severity).color }"
                  ></div>
                </div>
                <div class="feed-main">
                  <div class="feed-title-row">
                    <span class="feed-title" :title="item.title">{{ item.title }}</span>
                    <el-tag :type="getStatusInfo(item.status).type" size="small" effect="plain">
                      {{ getStatusInfo(item.status).label }}
                    </el-tag>
                  </div>
                  <div class="feed-summary">
                    <template v-if="item.summary">{{ item.summary }}</template>
                    <template v-else-if="item.possibleCauses?.length">
                      可能原因：{{ item.possibleCauses[0]?.description }}
                    </template>
                    <template v-else>
                      当前值 {{ formatNumber(item.currentValue) }}，偏离 {{ formatPercent(item.deviationPercent) }}
                    </template>
                  </div>
                  <div class="feed-meta">
                    <span>{{ getCategoryInfo(item.category).label }}</span>
                    <span>· {{ item.assigneeName || '未分配处理人' }}</span>
                    <span>· {{ fromNow(item.detectedAt) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, computed } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { useUserStore } from '@/stores/user'
import { getDashboard } from '@/api/dashboard'
import {
  formatNumber, formatPercent, formatDateShort, fromNow,
  getSeverityInfo, getStatusInfo, getCategoryInfo,
  notificationTypeMap, reportTypeMap, reportStatusMap
} from '@/utils'
import {
  DataAnalysis, Warning, CircleCheck, Bell, PieChart, TrendCharts,
  List, Message, Clock, ArrowRight, Top, Document
} from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)
const overview = ref<any>(null)
const todo = ref<any>(null)
const trendRef = ref<HTMLElement>()
const categoryRef = ref<HTMLElement>()
let trendChart: echarts.ECharts | null = null
let categoryChart: echarts.ECharts | null = null

async function loadData() {
  loading.value = true
  try {
    const data = await getDashboard()
    overview.value = data.overview
    todo.value = data.todo
    await nextTick()
    initCharts()
  } finally {
    loading.value = false
  }
}

function initCharts() {
  if (trendRef.value) {
    trendChart = echarts.init(trendRef.value)
    const trendData = overview.value?.anomalyTrend || []
    trendChart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: 40, right: 20, top: 30, bottom: 30 },
      xAxis: {
        type: 'category',
        data: trendData.map((d: any) => d.date),
        axisLine: { lineStyle: { color: '#e4e7ed' } },
        axisLabel: { color: '#909399' }
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#f0f2f5' } },
        axisLabel: { color: '#909399' }
      },
      series: [{
        data: trendData.map((d: any) => d.count),
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        itemStyle: { color: '#409eff' },
        lineStyle: { width: 3, color: '#409eff' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64,158,255,0.3)' },
            { offset: 1, color: 'rgba(64,158,255,0.02)' }
          ])
        }
      }]
    })
  }

  if (categoryRef.value) {
    categoryChart = echarts.init(categoryRef.value)
    const catMap = overview.value?.byCategory || {}
    const labelMap: Record<string, string> = {
      user_growth: '用户增长', retention: '留存分析', conversion: '转化漏斗',
      activation: '用户激活', revenue: '营收数据', other: '其他'
    }
    const pieData = Object.entries(catMap).map(([k, v]) => ({
      name: labelMap[k] || k,
      value: v
    }))
    categoryChart.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: 0, textStyle: { color: '#606266' } },
      color: ['#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#909399', '#722ed1'],
      series: [{
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: { formatter: '{b}\n{d}%' },
        data: pieData.length ? pieData : [{ name: '暂无数据', value: 1, itemStyle: { color: '#dcdfe6' } }]
      }]
    })
  }
}

function getNotifIcon(type: string) {
  const map: Record<string, any> = {
    anomaly_detected: Warning,
    alert_triggered: Bell,
    permission_expiring: Clock,
    permission_expired: Warning,
    anomaly_assigned: List,
    report_reminder: Document,
    mention: Message,
    system: Warning
  }
  return map[type] || Warning
}

function getNotifIconColor(type: string) {
  return notificationTypeMap[type]?.color || '#909399'
}

function getExpireDays(date: any) {
  if (!date) return 0
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000)
}

function getExpireType(date: any) {
  const days = getExpireDays(date)
  if (days <= 1) return 'danger'
  if (days <= 7) return 'warning'
  return 'success'
}

onMounted(() => {
  loadData()
  window.addEventListener('resize', () => {
    trendChart?.resize()
    categoryChart?.resize()
  })
})
</script>

<style lang="scss" scoped>
.loading-wrapper {
  min-height: calc(100vh - #{$header-height} - 40px);
}

.todo-card {
  height: calc(100% - 16px);
}

.unread-badge {
  :deep(.el-badge__content) {
    top: 2px;
  }
}

.todo-list, .notification-list, .expire-list, .anomaly-feed {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.todo-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: #f2f6fc;
  }

  .todo-main {
    flex: 1;
    min-width: 0;

    .todo-title {
      @include text-ellipsis;
      font-weight: 500;
      color: $text-primary;
      font-size: 13px;
    }

    .todo-meta {
      font-size: 12px;
      color: $text-secondary;
      margin-top: 3px;
      display: flex;
      gap: 6px;
    }
  }

  .todo-arrow {
    color: $text-placeholder;
  }
}

.notification-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  transition: background 0.15s;

  &:hover { background: #f2f6fc; }

  .notif-icon {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: #f2f6fc;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .notif-main {
    flex: 1;
    min-width: 0;

    .notif-title {
      @include text-ellipsis;
      font-weight: 500;
      color: $text-primary;
      font-size: 13px;
    }

    .notif-time {
      font-size: 12px;
      color: $text-secondary;
      margin-top: 3px;
    }
  }

  .unread-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #f56c6c;
    flex-shrink: 0;
  }
}

.expire-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 6px;

  .expire-main {
    flex: 1;
    min-width: 0;

    .expire-name {
      font-weight: 500;
      color: $text-primary;
      font-size: 13px;
    }

    .expire-meta {
      margin-top: 3px;
      display: flex;
      align-items: center;
      gap: 8px;

      .expire-date {
        font-size: 12px;
        color: $text-secondary;
      }
    }
  }
}

.feed-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  border-radius: 6px;
  cursor: pointer;
  border-bottom: 1px solid $border-light;
  transition: background 0.15s;

  &:last-child { border-bottom: none; }
  &:hover { background: #f2f6fc; }

  .feed-left {
    padding-top: 4px;
    .severity-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }
  }

  .feed-main {
    flex: 1;
    min-width: 0;

    .feed-title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;

      .feed-title {
        @include text-ellipsis;
        font-weight: 600;
        color: $text-primary;
        font-size: 14px;
      }
    }

    .feed-summary {
      @include text-ellipsis;
      margin: 4px 0;
      color: $text-regular;
      font-size: 13px;
      line-height: 1.5;
    }

    .feed-meta {
      font-size: 12px;
      color: $text-secondary;
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
  }
}
</style>
