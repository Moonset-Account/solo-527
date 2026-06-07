<template>
  <div class="top-anomalies">
    <div class="section-title">
      <span class="title-icon">⚠️</span>
      <span class="title-text">今天最异常的三件事</span>
      <span class="title-desc">点击卡片可下钻查看详情</span>
    </div>
    
    <div class="anomaly-cards">
      <div 
        v-for="(anomaly, index) in anomalies" 
        :key="index"
        class="anomaly-card"
        :class="`level-${anomaly.level}`"
        @click="handleClick(anomaly)"
      >
        <div class="card-rank">{{ index + 1 }}</div>
        <div class="card-content">
          <div class="card-title">{{ anomaly.title }}</div>
          <div class="card-desc">{{ anomaly.description }}</div>
          <div class="card-metric">
            <span class="metric-value">{{ anomaly.metric }}</span>
            <span class="metric-label">{{ anomaly.metricLabel }}</span>
          </div>
        </div>
        <div class="card-arrow">→</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useDataStore } from '@/stores/dataStore.js'

const store = useDataStore()
const anomalies = computed(() => store.topAnomalies)

function handleClick(anomaly) {
  if (anomaly.type === 'station' && anomaly.station_id) {
    store.drillToStation(anomaly.station_id)
  } else if (anomaly.type === 'fault_code' && anomaly.fault_code) {
    store.drillToFaultCode(anomaly.fault_code)
  }
}
</script>

<style lang="scss" scoped>
.top-anomalies {
  margin-bottom: 24px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.title-icon {
  font-size: 20px;
}

.title-text {
  font-size: 16px;
  font-weight: 600;
  color: $text-primary;
}

.title-desc {
  font-size: 12px;
  color: $text-muted;
  margin-left: 8px;
}

.anomaly-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.anomaly-card {
  background: $bg-card;
  border: 1px solid $border-color;
  border-radius: $radius-lg;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  transition: all $transition-normal;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: $warning;
  }
  
  &.level-critical {
    &::before { background: $danger; }
    
    &:hover {
      border-color: rgba(255, 77, 79, 0.4);
      box-shadow: 0 8px 24px rgba(255, 77, 79, 0.15);
    }
  }
  
  &.level-warning {
    &::before { background: $warning; }
    
    &:hover {
      border-color: rgba(250, 173, 20, 0.4);
      box-shadow: 0 8px 24px rgba(250, 173, 20, 0.15);
    }
  }
  
  &:hover {
    transform: translateY(-2px);
  }
}

.card-rank {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: $font-mono;
  font-size: 18px;
  font-weight: 700;
  color: $text-secondary;
  flex-shrink: 0;
}

.card-content {
  flex: 1;
  min-width: 0;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: 6px;
}

.card-desc {
  font-size: 12px;
  color: $text-secondary;
  margin-bottom: 10px;
  line-height: 1.5;
}

.card-metric {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.metric-value {
  font-family: $font-mono;
  font-size: 20px;
  font-weight: 700;
  color: $text-primary;
}

.metric-label {
  font-size: 12px;
  color: $text-muted;
}

.card-arrow {
  font-size: 20px;
  color: $text-muted;
  opacity: 0;
  transform: translateX(-5px);
  transition: all $transition-normal;
  flex-shrink: 0;
}

.anomaly-card:hover .card-arrow {
  opacity: 1;
  transform: translateX(0);
  color: $primary;
}

@media (max-width: 1024px) {
  .anomaly-cards {
    grid-template-columns: 1fr;
  }
}
</style>
