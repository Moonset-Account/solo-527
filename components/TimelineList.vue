<template>
  <div class="timeline-list">
    <div
      v-for="(item, index) in items"
      :key="index"
      :class="['timeline-item', item.type || 'default']"
    >
      <div class="timeline-dot"></div>
      <div class="timeline-content">
        <div class="timeline-header">
          <span class="timeline-title">{{ item.title }}</span>
          <span class="timeline-time">{{ item.time }}</span>
        </div>
        <div v-if="item.description" class="timeline-description">
          {{ item.description }}
        </div>
        <div v-if="item.operator" class="timeline-operator">
          操作人：{{ item.operator }}
          <span v-if="item.operatorType" class="operator-type">({{ operatorTypeLabels[item.operatorType] || item.operatorType }})</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface TimelineItem {
  title: string
  time: string
  description?: string
  operator?: string
  operatorType?: string
  type?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
}

defineProps<{
  items: TimelineItem[]
}>()

const operatorTypeLabels: Record<string, string> = {
  SYSTEM: '系统',
  USER: '后台用户',
  RIDER: '骑手',
  CUSTOMER: '客户',
}
</script>

<style lang="scss" scoped>
.timeline-list {
  position: relative;
  padding-left: 24px;

  &::before {
    content: '';
    position: absolute;
    left: 7px;
    top: 4px;
    bottom: 4px;
    width: 2px;
    background: $border-light;
  }
}

.timeline-item {
  position: relative;
  padding-bottom: 20px;

  &:last-child {
    padding-bottom: 0;
  }
}

.timeline-dot {
  position: absolute;
  left: -20px;
  top: 4px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: $primary;
  border: 2px solid #fff;
  box-shadow: 0 0 0 2px $primary;
}

.timeline-item.success .timeline-dot {
  background: $success;
  box-shadow: 0 0 0 2px $success;
}

.timeline-item.warning .timeline-dot {
  background: $warning;
  box-shadow: 0 0 0 2px $warning;
}

.timeline-item.danger .timeline-dot {
  background: $error;
  box-shadow: 0 0 0 2px $error;
}

.timeline-item.default .timeline-dot {
  background: $text-tertiary;
  box-shadow: 0 0 0 2px $text-tertiary;
}

.timeline-content {
  .timeline-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 4px;
  }

  .timeline-title {
    font-size: 14px;
    font-weight: 500;
    color: $text-primary;
  }

  .timeline-time {
    font-size: 12px;
    color: $text-tertiary;
  }

  .timeline-description {
    font-size: 13px;
    color: $text-secondary;
    margin-bottom: 4px;
    line-height: 1.6;
  }

  .timeline-operator {
    font-size: 12px;
    color: $text-tertiary;

    .operator-type {
      margin-left: 2px;
    }
  }
}
</style>
