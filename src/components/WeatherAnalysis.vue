<template>
  <div class="weather-analysis card-shadow">
    <div class="chart-header">
      <h3>天气与安全分析</h3>
      <el-tooltip content="天气对取消和安全事件的影响分析" placement="top">
        <el-icon class="info-icon"><InfoFilled /></el-icon>
      </el-tooltip>
    </div>

    <div class="analysis-content">
      <div class="analysis-section">
        <h4>天气导致取消分布</h4>
        <div class="weather-cancel-list">
          <div
            v-for="item in displayCancelByWeather"
            :key="item.weatherId"
            class="weather-stat-item"
          >
            <span class="weather-icon">{{ getWeatherIcon(item.weatherId) }}</span>
            <span class="weather-name">{{ getWeatherName(item.weatherId) }}</span>
            <div class="weather-bar">
              <div
                class="weather-bar-fill"
                :style="{ width: getBarWidth(item.count, maxCancelCount) + '%' }"
              ></div>
            </div>
            <span class="weather-count">{{ item.count }}</span>
          </div>
          <div v-if="displayCancelByWeather.length === 0" class="empty-note">
            暂无天气相关取消记录
          </div>
        </div>
      </div>

      <div class="analysis-section">
        <h4>天气与安全事件关联</h4>
        <div class="incident-weather-list">
          <div
            v-for="item in displayIncidentByWeather"
            :key="item.weatherId"
            class="incident-weather-item"
          >
            <div class="iw-header">
              <span class="weather-icon">{{ getWeatherIcon(item.weatherId) }}</span>
              <span class="weather-name">{{ getWeatherName(item.weatherId) }}</span>
              <span class="total-count">共 {{ item.total }} 起</span>
            </div>
            <div class="iw-levels">
              <div class="level-item minor">
                <span class="level-dot"></span>
                <span>轻微</span>
                <span class="level-value">{{ item.minor }}</span>
              </div>
              <div class="level-item medical">
                <span class="level-dot"></span>
                <span>医疗</span>
                <span class="level-value">{{ item.medical }}</span>
              </div>
              <div class="level-item suspend">
                <span class="level-dot"></span>
                <span>停课</span>
                <span class="level-value">{{ item.suspend }}</span>
              </div>
            </div>
          </div>
          <div v-if="displayIncidentByWeather.length === 0" class="empty-note">
            暂无天气关联事件记录
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { WEATHER_TYPES } from '@/data/constants'

const props = defineProps({
  incidentByWeather: {
    type: Object,
    default: () => ({})
  },
  cancelByWeather: {
    type: Array,
    default: () => []
  }
})

const displayCancelByWeather = computed(() => {
  return (props.cancelByWeather || []).sort((a, b) => b.count - a.count)
})

const displayIncidentByWeather = computed(() => {
  return Object.entries(props.incidentByWeather || {})
    .map(([weatherId, data]) => ({
      weatherId,
      ...data
    }))
    .sort((a, b) => b.total - a.total)
})

const maxCancelCount = computed(() => {
  if (displayCancelByWeather.value.length === 0) return 1
  return Math.max(...displayCancelByWeather.value.map(i => i.count))
})

const getBarWidth = (count, max) => {
  return max > 0 ? (count / max) * 100 : 0
}

const getWeatherIcon = (weatherId) => {
  const weather = WEATHER_TYPES.find(w => w.id === weatherId)
  return weather?.icon || '🌤️'
}

const getWeatherName = (weatherId) => {
  const weather = WEATHER_TYPES.find(w => w.id === weatherId)
  return weather?.name || weatherId
}
</script>

<style scoped lang="scss">
.weather-analysis {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-shrink: 0;

  h3 {
    margin: 0;
    font-size: 16px;
    color: #303133;
  }

  .info-icon {
    color: #1890ff;
    font-size: 18px;
    cursor: help;
  }
}

.analysis-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 0;
}

.analysis-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;

  h4 {
    margin: 0 0 12px 0;
    font-size: 14px;
    color: #606266;
    flex-shrink: 0;
  }
}

.weather-cancel-list,
.incident-weather-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: #f0f0f0;
    border-radius: 2px;
  }

  &::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 2px;
  }
}

.weather-stat-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: #fafafa;
  border-radius: 6px;

  .weather-icon {
    font-size: 18px;
    flex-shrink: 0;
  }

  .weather-name {
    width: 60px;
    font-size: 12px;
    color: #606266;
    flex-shrink: 0;
  }

  .weather-bar {
    flex: 1;
    height: 8px;
    background: #f0f0f0;
    border-radius: 4px;
    overflow: hidden;
  }

  .weather-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, #1890ff, #722ed1);
    border-radius: 4px;
    transition: width 0.3s ease;
  }

  .weather-count {
    width: 30px;
    text-align: right;
    font-size: 13px;
    font-weight: 600;
    color: #1890ff;
    flex-shrink: 0;
  }
}

.incident-weather-item {
  padding: 10px 12px;
  background: #fafafa;
  border-radius: 6px;

  .iw-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;

    .weather-icon {
      font-size: 18px;
    }

    .weather-name {
      flex: 1;
      font-size: 13px;
      font-weight: 500;
      color: #303133;
    }

    .total-count {
      font-size: 12px;
      color: #909399;
    }
  }

  .iw-levels {
    display: flex;
    gap: 16px;

    .level-item {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      color: #606266;

      .level-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
      }

      &.minor .level-dot {
        background: var(--minor-color);
      }

      &.medical .level-dot {
        background: var(--medical-color);
      }

      &.suspend .level-dot {
        background: var(--suspend-color);
      }

      .level-value {
        font-weight: 600;
        color: #303133;
      }
    }
  }
}

.empty-note {
  text-align: center;
  padding: 20px;
  color: #909399;
  font-size: 12px;
}
</style>
