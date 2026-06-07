<template>
  <div class="incident-timeline card-shadow">
    <div class="chart-header">
      <h3>救援事件时间线</h3>
      <div class="stats-summary">
        <div class="stat-item minor">
          <span class="stat-dot"></span>
          <span class="stat-label">轻微</span>
          <span class="stat-value">{{ stats.minor }}</span>
        </div>
        <div class="stat-item medical">
          <span class="stat-dot"></span>
          <span class="stat-label">医疗介入</span>
          <span class="stat-value">{{ stats.medical }}</span>
        </div>
        <div class="stat-item suspend">
          <span class="stat-dot"></span>
          <span class="stat-label">停课</span>
          <span class="stat-value">{{ stats.suspend }}</span>
        </div>
      </div>
    </div>

    <div ref="timelineRef" class="timeline-container">
      <div class="timeline-scroll">
        <div v-if="timeline.length === 0" class="empty-state">
          <el-icon size="48"><Document /></el-icon>
          <p>暂无救援事件记录</p>
        </div>
        
        <div v-else class="timeline-items">
          <div
            v-for="(day, dayIndex) in timeline"
            :key="day.date"
            class="timeline-day"
          >
            <div class="timeline-date">
              <span class="date-text">{{ day.date }}</span>
              <span class="event-count">{{ day.events.length }} 起事件</span>
            </div>
            
            <div class="day-events">
              <div
                v-for="(event, eventIndex) in day.events"
                :key="event.id"
                class="event-card"
                :class="`level-${event.level}`"
                @click="handleEventClick(event)"
              >
                <div class="event-level-badge" :class="event.level">
                  {{ INCIDENT_LEVELS[event.level].label }}
                </div>
                <div class="event-content">
                  <div class="event-time">{{ event.time }}</div>
                  <div class="event-title">{{ event.title }}</div>
                  <div class="event-desc">{{ event.description }}</div>
                  <div class="event-meta">
                    <span v-if="event.minorCount > 0" class="meta-item minor-badge">
                      <el-icon><User /></el-icon>
                      未成年人 {{ event.minorCount }} 人
                    </span>
                    <span v-if="event.adultCount > 0" class="meta-item">
                      <el-icon><UserFilled /></el-icon>
                      成年人 {{ event.adultCount }} 人
                    </span>
                    <span v-if="event.hasPhoto" class="meta-item photo-badge">
                      <el-icon><Picture /></el-icon>
                      有照片
                      <span v-if="!canViewPhotos" class="lock-note">（仅内部）</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <el-dialog
      v-model="detailVisible"
      title="事件详情"
      width="500px"
    >
      <div v-if="currentEvent" class="event-detail">
        <div class="detail-row">
          <label>事件级别：</label>
          <el-tag :type="getLevelTagType(currentEvent.level)">
            {{ INCIDENT_LEVELS[currentEvent.level].label }}
          </el-tag>
        </div>
        <div class="detail-row">
          <label>发生时间：</label>
          <span>{{ currentEvent.date }} {{ currentEvent.time }}</span>
        </div>
        <div class="detail-row">
          <label>事件描述：</label>
          <span>{{ currentEvent.description }}</span>
        </div>
        <div class="detail-row">
          <label>涉及人员：</label>
          <span>未成年人 {{ currentEvent.minorCount }} 人，成年人 {{ currentEvent.adultCount }} 人</span>
        </div>
        <div v-if="canViewPhotos && currentEvent.hasPhoto" class="detail-row photo-row">
          <label>现场照片：</label>
          <div class="photo-placeholder">
            <el-icon size="64"><Picture /></el-icon>
            <p>内部复盘照片（模拟）</p>
          </div>
        </div>
        <div v-if="!canViewPhotos && currentEvent.hasPhoto" class="detail-row">
          <label>现场照片：</label>
          <span class="restricted-note">
            <el-icon><Lock /></el-icon>
            仅授权人员可查看
          </span>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { INCIDENT_LEVELS } from '@/data/constants'
import { useDashboardStore } from '@/store/useDashboardStore'

const props = defineProps({
  timeline: {
    type: Array,
    default: () => []
  },
  stats: {
    type: Object,
    default: () => ({
      total: 0,
      minor: 0,
      medical: 0,
      suspend: 0,
      withPhotos: 0,
      minorInvolved: 0,
      adultInvolved: 0
    })
  }
})

const { canViewIncidentPhotos } = useDashboardStore()

const timelineRef = ref(null)
const detailVisible = ref(false)
const currentEvent = ref(null)

const canViewPhotos = computed(() => canViewIncidentPhotos())

const handleEventClick = (event) => {
  currentEvent.value = event
  detailVisible.value = true
}

const getLevelTagType = (level) => {
  const map = {
    minor: 'success',
    medical: 'warning',
    suspend: 'danger'
  }
  return map[level] || 'info'
}
</script>

<style scoped lang="scss">
.incident-timeline {
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
}

.stats-summary {
  display: flex;
  gap: 20px;

  .stat-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;

    .stat-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    &.minor .stat-dot {
      background: var(--minor-color);
    }

    &.medical .stat-dot {
      background: var(--medical-color);
    }

    &.suspend .stat-dot {
      background: var(--suspend-color);
    }

    .stat-label {
      color: #606266;
    }

    .stat-value {
      font-weight: 600;
      color: #303133;
    }
  }
}

.timeline-container {
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

.timeline-scroll {
  height: 100%;
  overflow-y: auto;
  padding-right: 8px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f0f0f0;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 3px;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #909399;
  gap: 12px;

  p {
    margin: 0;
  }
}

.timeline-day {
  margin-bottom: 24px;

  &:last-child {
    margin-bottom: 0;
  }
}

.timeline-date {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;

  .date-text {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
  }

  .event-count {
    font-size: 12px;
    color: #909399;
    background: #f0f0f0;
    padding: 2px 8px;
    border-radius: 10px;
  }
}

.day-events {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.event-card {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #fafafa;
  border-radius: 8px;
  border-left: 3px solid #ddd;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #f0f0f0;
    transform: translateX(2px);
  }

  &.level-minor {
    border-left-color: var(--minor-color);
  }

  &.level-medical {
    border-left-color: var(--medical-color);
  }

  &.level-suspend {
    border-left-color: var(--suspend-color);
  }
}

.event-level-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  height: fit-content;
  flex-shrink: 0;

  &.minor {
    background: var(--minor-color);
  }

  &.medical {
    background: var(--medical-color);
  }

  &.suspend {
    background: var(--suspend-color);
  }
}

.event-content {
  flex: 1;
  min-width: 0;
}

.event-time {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.event-title {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.event-desc {
  font-size: 12px;
  color: #606266;
  margin-bottom: 8px;
}

.event-meta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;

  .meta-item {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: #909399;

    .el-icon {
      font-size: 12px;
    }

    &.minor-badge {
      color: #e6a23c;
    }

    &.photo-badge {
      color: #1890ff;

      .lock-note {
        color: #f5222d;
      }
    }
  }
}

.event-detail {
  .detail-row {
    display: flex;
    align-items: flex-start;
    margin-bottom: 16px;

    label {
      width: 100px;
      color: #606266;
      flex-shrink: 0;
    }

    span {
      flex: 1;
      color: #303133;
    }

    &.photo-row {
      flex-direction: column;

      label {
        margin-bottom: 8px;
      }
    }
  }

  .photo-placeholder {
    width: 100%;
    height: 200px;
    background: #f5f5f5;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    color: #909399;

    p {
      margin: 0;
      font-size: 14px;
    }
  }

  .restricted-note {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #f5222d;
  }
}
</style>
