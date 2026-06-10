<template>
  <div class="dashboard-page">
    <div class="stats-grid">
      <div class="stat-card primary">
        <div class="stat-icon">📋</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.totalOrders || 0 }}</div>
          <div class="stat-label">总订单数</div>
        </div>
      </div>

      <div class="stat-card warning">
        <div class="stat-icon">⏳</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.pendingOrders || 0 }}</div>
          <div class="stat-label">待接单</div>
        </div>
      </div>

      <div class="stat-card info">
        <div class="stat-icon">🚚</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.inTransitOrders || 0 }}</div>
          <div class="stat-label">配送中</div>
        </div>
      </div>

      <div class="stat-card success">
        <div class="stat-icon">✅</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.deliveredOrders || 0 }}</div>
          <div class="stat-label">已完成</div>
        </div>
      </div>

      <div class="stat-card danger">
        <div class="stat-icon">⚠️</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.exceptionOrders || 0 }}</div>
          <div class="stat-label">异常订单</div>
        </div>
      </div>

      <div class="stat-card danger">
        <div class="stat-icon">🔔</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.openAlerts || 0 }}</div>
          <div class="stat-label">待处理告警</div>
        </div>
      </div>

      <div class="stat-card warning">
        <div class="stat-icon">💰</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.pendingClaims || 0 }}</div>
          <div class="stat-label">待审核赔付</div>
        </div>
      </div>

      <div class="stat-card info">
        <div class="stat-icon">🏍️</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.onlineRiders || 0 }}</div>
          <div class="stat-label">在线骑手</div>
        </div>
      </div>
    </div>

    <div class="dashboard-panels">
      <div class="panel-card">
        <div class="panel-header">
          <h3>今日数据</h3>
        </div>
        <div class="panel-body">
          <div class="today-stats">
            <div class="today-item">
              <span class="label">今日新增</span>
              <span class="value">{{ stats.todayNewOrders || 0 }}</span>
            </div>
            <div class="today-item">
              <span class="label">今日完成</span>
              <span class="value text-success">{{ stats.todayDelivered || 0 }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="panel-card">
        <div class="panel-header">
          <h3>快捷操作</h3>
        </div>
        <div class="panel-body">
          <div class="quick-actions">
            <button class="btn btn-primary" @click="goTo('/orders/pending')">
              ⏳ 处理待接单
            </button>
            <button class="btn btn-success" @click="goTo('/dispatch')">
              🎯 调度中心
            </button>
            <button class="btn btn-warning" @click="goTo('/alerts')">
              🔔 告警中心
            </button>
            <button class="btn btn-info" @click="goTo('/claims')">
              💰 赔付工单
            </button>
          </div>
        </div>
      </div>

      <div class="panel-card full">
        <div class="panel-header">
          <h3>待处理异常</h3>
          <button class="btn btn-text" @click="goTo('/exceptions')">查看全部 →</button>
        </div>
        <div class="panel-body">
          <div class="exception-summary">
            <div class="exception-item">
            新异常
              <span class="count text-danger">{{ stats.newExceptions || 0 }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const request = useRequest()

const stats = ref<any>({})

const loadStats = async () => {
  try {
    const res: any = await request('/dashboard/stats')
    if (res.code === 0) {
      stats.value = res.data
    }
  } catch (e) {
    console.error('加载统计数据失败', e)
  }
}

const goTo = (path: string) => {
  navigateTo(path)
}

onMounted(() => {
  loadStats()
})
</script>

<style lang="scss" scoped>
.dashboard-page {
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 20px;
  }

  .stat-card {
    background: #fff;
    border-radius: $border-radius;
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    box-shadow: $shadow-sm;
    transition: all $transition-fast;

    &:hover {
      box-shadow: $shadow-md;
      transform: translateY(-2px);
    }

    &.primary {
      border-left: 4px solid $primary;
    }

    &.success {
      border-left: 4px solid $success;
    }

    &.warning {
      border-left: 4px solid $warning;
    }

    &.danger {
      border-left: 4px solid $error;
    }

    &.info {
      border-left: 4px solid $info;
    }

    .stat-icon {
      font-size: 36px;
      width: 60px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba($primary, 0.1);
      border-radius: 8px;
    }

    .stat-info {
      flex: 1;

      .stat-value {
        font-size: 28px;
        font-weight: 700;
        color: $text-primary;
        line-height: 1.2;
      }

      .stat-label {
        font-size: 14px;
        color: $text-secondary;
        margin-top: 4px;
      }
    }
  }
}

.dashboard-panels {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.panel-card {
  background: #fff;
  border-radius: $border-radius;
  box-shadow: $shadow-sm;
  overflow: hidden;

  &.full {
    grid-column: span 1;
  }

  .panel-header {
    padding: 16px 20px;
    border-bottom: 1px solid $border-light;
    display: flex;
    align-items: center;
    justify-content: space-between;

    h3 {
      font-size: 16px;
      font-weight: 600;
      color: $text-primary;
      margin: 0;
    }
  }

  .panel-body {
    padding: 20px;
  }
}

.today-stats {
  display: flex;
  gap: 24px;

  .today-item {
    text-align: center;
    flex: 1;

    .label {
      display: block;
      font-size: 14px;
      color: $text-secondary;
      margin-bottom: 8px;
    }

    .value {
      font-size: 32px;
      font-weight: 700;
      color: $text-primary;
    }
  }
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;

  button {
    padding: 16px;
    font-size: 14px;
    border-radius: 8px;
  }
}

.exception-summary {
  .exception-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 0;
    border-bottom: 1px solid $border-light;

    &:last-child {
      border-bottom: none;
    }

    .count {
      font-size: 20px;
      font-weight: 600;
    }
  }
}

@media (max-width: 1200px) {
  .dashboard-page .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .dashboard-panels {
    grid-template-columns: 1fr;
  }
}
</style>
