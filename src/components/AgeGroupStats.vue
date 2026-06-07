<template>
  <div class="age-group-stats card-shadow">
    <div class="chart-header">
      <h3>年龄段统计</h3>
      <el-tooltip content="未成年人信息已做聚合处理，保护隐私" placement="top">
        <el-icon class="info-icon"><InfoFilled /></el-icon>
      </el-tooltip>
    </div>

    <div class="stats-content">
      <div class="minor-aggregated">
        <div class="aggregated-title">
          <el-icon><User /></el-icon>
          <span>未成年人（聚合统计）</span>
        </div>
        <div class="aggregated-cards">
          <div class="agg-card">
            <div class="agg-label">总报名</div>
            <div class="agg-value">{{ minorAggregated.registerCount }}</div>
          </div>
          <div class="agg-card">
            <div class="agg-label">确认参加</div>
            <div class="agg-value">{{ minorAggregated.confirmCount }}</div>
          </div>
          <div class="agg-card">
            <div class="agg-label">签到</div>
            <div class="agg-value">{{ minorAggregated.checkinCount }}</div>
          </div>
          <div class="agg-card">
            <div class="agg-label">完成活动</div>
            <div class="agg-value">{{ minorAggregated.completeCount }}</div>
          </div>
          <div class="agg-card warning">
            <div class="agg-label">取消</div>
            <div class="agg-value">{{ minorAggregated.cancelCount }}</div>
          </div>
        </div>
        <div class="agg-note">
          <el-icon><Lock /></el-icon>
          <span>包含 {{ minorAggregated.groupCount }} 个未成年年龄段，仅展示聚合数据</span>
        </div>
      </div>

      <div class="adult-stats">
        <div class="adult-title">
          <el-icon><UserFilled /></el-icon>
          <span>18岁以上</span>
        </div>
        <div class="adult-cards" v-if="adultStats">
          <div class="agg-card">
            <div class="agg-label">总报名</div>
            <div class="agg-value">{{ adultStats.registerCount }}</div>
          </div>
          <div class="agg-card">
            <div class="agg-label">确认参加</div>
            <div class="agg-value">{{ adultStats.confirmCount }}</div>
          </div>
          <div class="agg-card">
            <div class="agg-label">签到</div>
            <div class="agg-value">{{ adultStats.checkinCount }}</div>
          </div>
          <div class="agg-card">
            <div class="agg-label">完成活动</div>
            <div class="agg-value">{{ adultStats.completeCount }}</div>
          </div>
          <div class="agg-card warning">
            <div class="agg-label">取消</div>
            <div class="agg-value">{{ adultStats.cancelCount }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  byAgeGroup: {
    type: Array,
    default: () => []
  },
  minorAggregated: {
    type: Object,
    default: () => ({
      registerCount: 0,
      confirmCount: 0,
      checkinCount: 0,
      completeCount: 0,
      cancelCount: 0,
      groupCount: 0
    })
  }
})

const adultStats = computed(() => {
  return props.byAgeGroup.find(g => g.ageGroupId === '18+')
})
</script>

<style scoped lang="scss">
.age-group-stats {
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

.stats-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 0;
}

.minor-aggregated,
.adult-stats {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.aggregated-title,
.adult-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #303133;

  .el-icon {
    color: #1890ff;
  }
}

.adult-title .el-icon {
  color: #52c41a;
}

.aggregated-cards,
.adult-cards {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
}

.agg-card {
  background: #f0f7ff;
  border-radius: 8px;
  padding: 12px 8px;
  text-align: center;

  &.warning {
    background: #fff7e6;

    .agg-value {
      color: #fa8c16;
    }
  }

  .agg-label {
    font-size: 11px;
    color: #606266;
    margin-bottom: 4px;
  }

  .agg-value {
    font-size: 20px;
    font-weight: 700;
    color: #1890ff;
  }
}

.adult-cards .agg-card {
  background: #f6ffed;

  .agg-value {
    color: #52c41a;
  }

  &.warning .agg-value {
    color: #fa8c16;
  }
}

.agg-note {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #909399;
  background: #fafafa;
  padding: 6px 10px;
  border-radius: 4px;

  .el-icon {
    color: #faad14;
  }
}
</style>
