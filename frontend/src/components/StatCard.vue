<template>
  <div class="stat-card" :class="`stat-card-${type}`">
    <div class="stat-icon">
      <el-icon :size="32">
        <component :is="iconComponent" />
      </el-icon>
    </div>
    <div class="stat-content">
      <div class="stat-value">
        <span class="value">{{ displayValue }}</span>
        <span v-if="suffix" class="suffix">{{ suffix }}</span>
      </div>
      <div class="stat-label">{{ label }}</div>
      <div v-if="trend !== undefined" class="stat-trend" :class="trendClass">
        <el-icon>
          <TrendCharts v-if="trend > 0" />
          <Bottom v-else />
        </el-icon>
        {{ Math.abs(trend) }}%
        <span class="trend-label">{{ trendLabel }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { formatNumber } from '@/utils/format'

const props = defineProps({
  label: {
    type: String,
    required: true
  },
  value: {
    type: [Number, String],
    default: 0
  },
  suffix: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: 'DataLine'
  },
  type: {
    type: String,
    default: 'primary',
    validator: (val) => ['primary', 'success', 'warning', 'danger', 'info'].includes(val)
  },
  trend: {
    type: Number,
    default: undefined
  },
  trendLabel: {
    type: String,
    default: '较昨日'
  },
  format: {
    type: Boolean,
    default: true
  }
})

const iconMap = {
  DataAnalysis: 'DataAnalysis',
  DataLine: 'DataLine',
  User: 'User',
  Document: 'Document',
  Message: 'Message',
  Money: 'Money',
  ShoppingCart: 'ShoppingCart',
  View: 'View',
  Check: 'Check',
  Clock: 'Clock'
}

const iconComponent = computed(() => iconMap[props.icon] || props.icon)

const displayValue = computed(() => {
  if (!props.format) return props.value
  if (typeof props.value === 'string') return props.value
  return formatNumber(props.value)
})

const trendClass = computed(() => ({
  'trend-up': props.trend > 0,
  'trend-down': props.trend < 0
}))
</script>

<style lang="scss" scoped>
.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }

  .stat-icon {
    width: 64px;
    height: 64px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .stat-content {
    flex: 1;
    min-width: 0;

    .stat-value {
      display: flex;
      align-items: baseline;
      gap: 4px;

      .value {
        font-size: 28px;
        font-weight: 700;
        color: #303133;
        line-height: 1.2;
      }

      .suffix {
        font-size: 14px;
        color: #909399;
      }
    }

    .stat-label {
      font-size: 14px;
      color: #606266;
      margin-top: 4px;
    }

    .stat-trend {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      margin-top: 8px;

      .trend-label {
        color: #909399;
      }

      &.trend-up {
        color: #67c23a;
      }

      &.trend-down {
        color: #f56c6c;
      }
    }
  }

  &.stat-card-primary {
    .stat-icon {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #fff;
    }
  }

  &.stat-card-success {
    .stat-icon {
      background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
      color: #fff;
    }
  }

  &.stat-card-warning {
    .stat-icon {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: #fff;
    }
  }

  &.stat-card-danger {
    .stat-icon {
      background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%);
      color: #fff;
    }
  }

  &.stat-card-info {
    .stat-icon {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      color: #fff;
    }
  }
}
</style>
