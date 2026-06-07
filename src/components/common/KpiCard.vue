<template>
  <div class="kpi-card" :class="[`severity-${severity}`, { clickable: onClick }]" @click="handleClick">
    <div class="kpi-header">
      <span class="kpi-label">{{ label }}</span>
      <span class="sample-size">N={{ sampleSize }}</span>
    </div>
    <div class="kpi-main">
      <span class="kpi-value">{{ displayValue }}</span>
      <span class="kpi-unit" v-if="unit">{{ unit }}</span>
    </div>
    <div v-if="trend != null" class="kpi-trend" :class="trend >= 0 ? 'up' : 'down'">
      <span class="trend-icon">{{ trend >= 0 ? '↑' : '↓' }}</span>
      <span class="trend-value">{{ Math.abs(trend).toFixed(1) }}%</span>
      <span class="trend-label">较昨日</span>
    </div>
    <div class="kpi-footer">
      <span class="update-time">更新于 {{ updateTimeStr }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: String,
  value: [Number, String],
  unit: String,
  sampleSize: {
    type: Number,
    default: 0
  },
  trend: Number,
  severity: {
    type: String,
    default: 'normal'
  },
  decimals: {
    type: Number,
    default: 1
  },
  updateTime: String,
  onClick: Function
})

const displayValue = computed(() => {
  if (typeof props.value === 'string') return props.value
  if (props.value >= 1) {
    return props.value.toFixed(props.decimals)
  }
  return (props.value * 100).toFixed(props.decimals)
})

const updateTimeStr = computed(() => {
  if (!props.updateTime) return '--:--'
  const d = new Date(props.updateTime)
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
})

function handleClick() {
  if (props.onClick) {
    props.onClick()
  }
}
</script>

<style lang="scss" scoped>
.kpi-card {
  background: $bg-card;
  border: 1px solid $border-color;
  border-radius: $radius-lg;
  padding: 16px 20px;
  transition: all $transition-normal;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: $primary;
    opacity: 0;
    transition: opacity $transition-normal;
  }
  
  &:hover {
    border-color: rgba(22, 93, 255, 0.4);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    
    &::before {
      opacity: 1;
    }
  }
  
  &.clickable {
    cursor: pointer;
  }
  
  &.severity-danger::before {
    background: $danger;
  }
  
  &.severity-warning::before {
    background: $warning;
  }
  
  &.severity-success::before {
    background: $success;
  }
}

.kpi-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.kpi-label {
  font-size: 13px;
  color: $text-secondary;
}

.sample-size {
  font-family: $font-mono;
  font-size: 10px;
  color: $text-muted;
  background: rgba(255, 255, 255, 0.05);
  padding: 2px 6px;
  border-radius: 3px;
}

.kpi-main {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 8px;
}

.kpi-value {
  font-family: $font-mono;
  font-size: 32px;
  font-weight: 600;
  color: $text-primary;
  line-height: 1.1;
}

.kpi-unit {
  font-size: 14px;
  color: $text-secondary;
}

.kpi-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 8px;
  
  &.up {
    color: $danger;
    
    .trend-icon {
      color: $danger;
    }
  }
  
  &.down {
    color: $success;
    
    .trend-icon {
      color: $success;
    }
  }
}

.trend-icon {
  font-size: 12px;
  font-weight: bold;
}

.trend-value {
  font-family: $font-mono;
  font-size: 12px;
  font-weight: 500;
}

.trend-label {
  font-size: 11px;
  color: $text-muted;
}

.kpi-footer {
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.update-time {
  font-size: 11px;
  color: $text-muted;
}
</style>
