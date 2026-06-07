<template>
  <div class="chart-container">
    <div class="chart-header">
      <div class="header-left">
        <span class="sample-size">N={{ sampleSize }}</span>
        <span v-if="filters" class="filter-tag">{{ filters }}</span>
      </div>
      <div class="header-right">
        <slot name="actions"></slot>
        <span class="update-time" v-if="updateTime">更新于 {{ formatTime(updateTime) }}</span>
      </div>
    </div>
    <div class="chart-body">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
defineProps({
  sampleSize: {
    type: Number,
    default: 0
  },
  updateTime: {
    type: String,
    default: ''
  },
  filters: {
    type: String,
    default: ''
  }
})

function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}
</script>

<style lang="scss" scoped>
.chart-container {
  background: $bg-card;
  border: 1px solid $border-color;
  border-radius: $radius-lg;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
  transition: all $transition-normal;
  
  &:hover {
    border-color: rgba(22, 93, 255, 0.3);
    box-shadow: 0 0 20px rgba(22, 93, 255, 0.08);
  }
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid $border-color;
  background: rgba(255, 255, 255, 0.02);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sample-size {
  font-family: $font-mono;
  font-size: 11px;
  color: $text-muted;
  background: rgba(255, 255, 255, 0.05);
  padding: 3px 8px;
  border-radius: 4px;
}

.filter-tag {
  font-size: 11px;
  color: $primary;
  background: rgba(22, 93, 255, 0.1);
  padding: 3px 8px;
  border-radius: 4px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.update-time {
  font-size: 11px;
  color: $text-muted;
}

.chart-body {
  flex: 1;
  position: relative;
  min-height: 0;
  overflow: hidden;
}
</style>
