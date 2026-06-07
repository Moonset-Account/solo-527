<template>
  <div class="equipment-heatmap card-shadow">
    <div class="chart-header">
      <h3>装备损耗热力图</h3>
      <div class="legend">
        <span class="legend-item">
          <span class="legend-color low"></span>
          <span>低损耗</span>
        </span>
        <span class="legend-item">
          <span class="legend-color medium"></span>
          <span>中损耗</span>
        </span>
        <span class="legend-item">
          <span class="legend-color high"></span>
          <span>高损耗</span>
        </span>
      </div>
    </div>

    <div ref="heatmapRef" class="heatmap-container">
      <div v-if="matrix.length === 0" class="empty-state">
        <el-icon size="48"><Box /></el-icon>
        <p>暂无装备损耗数据</p>
      </div>
      
      <div v-else class="heatmap-table">
        <table>
          <thead>
            <tr>
              <th class="corner-cell">项目 \ 装备</th>
              <th
                v-for="equipment in equipments"
                :key="equipment.id"
                class="col-header"
              >
                {{ equipment.name }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="project in projects" :key="project.id">
              <th class="row-header">{{ project.name }}</th>
              <td
                v-for="equipment in equipments"
                :key="`${project.id}-${equipment.id}`"
                class="heatmap-cell"
                :class="getCellWearLevel(project.id, equipment.id)"
                @click="handleCellClick(project.id, equipment.id)"
              >
                <div class="cell-content">
                  <div class="cell-value">{{ getCellWearValue(project.id, equipment.id) }}</div>
                  <div class="cell-sub">损坏 {{ getCellDamage(project.id, equipment.id) }}</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <el-dialog
      v-model="detailVisible"
      title="装备损耗详情"
      width="500px"
    >
      <div v-if="selectedCell" class="equipment-detail">
        <div class="detail-row">
          <label>项目：</label>
          <span>{{ selectedCell.projectName }}</span>
        </div>
        <div class="detail-row">
          <label>装备：</label>
          <span>{{ selectedCell.equipmentName }}</span>
        </div>
        <div class="detail-row">
          <label>使用次数：</label>
          <span>{{ selectedCell.useCount }} 次</span>
        </div>
        <div class="detail-row">
          <label>损坏次数：</label>
          <span class="warning">{{ selectedCell.damageCount }} 次</span>
        </div>
        <div class="detail-row">
          <label>丢失次数：</label>
          <span class="danger">{{ selectedCell.lossCount }} 次</span>
        </div>
        <div class="detail-row">
          <label>损坏率：</label>
          <span>{{ selectedCell.damageRate }}%</span>
        </div>
        <div class="detail-row">
          <label>丢失率：</label>
          <span>{{ selectedCell.lossRate }}%</span>
        </div>
        <div class="detail-row">
          <label>损耗等级：</label>
          <el-tag :type="getWearTagType(selectedCell.wearLevel)">
            {{ getWearLevelLabel(selectedCell.wearLevel) }}
          </el-tag>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { EQUIPMENT_TYPES, SPORTS_PROJECTS } from '@/data/constants'

const props = defineProps({
  matrix: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['cell-click'])

const heatmapRef = ref(null)
const detailVisible = ref(false)
const selectedCell = ref(null)

const projects = computed(() => SPORTS_PROJECTS)
const equipments = computed(() => EQUIPMENT_TYPES)

const dataMap = computed(() => {
  const map = {}
  props.matrix.forEach(item => {
    map[`${item.projectId}-${item.equipmentId}`] = item
  })
  return map
})

const getCellData = (projectId, equipmentId) => {
  return dataMap.value[`${projectId}-${equipmentId}`] || {
    projectId,
    equipmentId,
    useCount: 0,
    damageCount: 0,
    lossCount: 0,
    totalWear: 0,
    wearLevel: 'low'
  }
}

const getCellWearLevel = (projectId, equipmentId) => {
  return getCellData(projectId, equipmentId).wearLevel
}

const getCellWearValue = (projectId, equipmentId) => {
  const data = getCellData(projectId, equipmentId)
  return data.useCount || '-'
}

const getCellDamage = (projectId, equipmentId) => {
  const data = getCellData(projectId, equipmentId)
  return data.damageCount || 0
}

const handleCellClick = (projectId, equipmentId) => {
  const data = getCellData(projectId, equipmentId)
  if (data.useCount > 0) {
    selectedCell.value = data
    detailVisible.value = true
    emit('cell-click', data)
  }
}

const getWearLevelLabel = (level) => {
  const map = {
    low: '低损耗',
    medium: '中损耗',
    high: '高损耗'
  }
  return map[level] || level
}

const getWearTagType = (level) => {
  const map = {
    low: 'success',
    medium: 'warning',
    high: 'danger'
  }
  return map[level] || 'info'
}
</script>

<style scoped lang="scss">
.equipment-heatmap {
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

.legend {
  display: flex;
  gap: 16px;

  .legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #606266;
  }

  .legend-color {
    width: 16px;
    height: 16px;
    border-radius: 3px;

    &.low {
      background: #52c41a;
    }

    &.medium {
      background: #faad14;
    }

    &.high {
      background: #f5222d;
    }
  }
}

.heatmap-container {
  flex: 1;
  overflow: auto;
  min-height: 0;

  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
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

.heatmap-table {
  width: 100%;

  table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 2px;
  }

  th, td {
    padding: 8px;
    text-align: center;
  }

  .corner-cell {
    background: #fafafa;
    font-weight: 600;
    font-size: 12px;
    color: #606266;
    position: sticky;
    left: 0;
    z-index: 2;
  }

  .col-header {
    background: #fafafa;
    font-weight: 600;
    font-size: 12px;
    color: #606266;
    position: sticky;
    top: 0;
    z-index: 1;
    white-space: nowrap;
  }

  .row-header {
    background: #fafafa;
    font-weight: 600;
    font-size: 12px;
    color: #606266;
    text-align: right;
    position: sticky;
    left: 0;
    z-index: 1;
    white-space: nowrap;
  }

  .heatmap-cell {
    width: 80px;
    height: 60px;
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.2s;

    &:hover {
      transform: scale(1.05);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }

    &.low {
      background: rgba(82, 196, 26, 0.6);
    }

    &.medium {
      background: rgba(250, 173, 20, 0.7);
    }

    &.high {
      background: rgba(245, 34, 45, 0.7);
    }
  }

  .cell-content {
    .cell-value {
      font-size: 14px;
      font-weight: 600;
      color: #fff;
    }

    .cell-sub {
      font-size: 10px;
      color: rgba(255, 255, 255, 0.85);
      margin-top: 2px;
    }
  }
}

.equipment-detail {
  .detail-row {
    display: flex;
    align-items: center;
    margin-bottom: 16px;

    label {
      width: 100px;
      color: #606266;
      flex-shrink: 0;
    }

    span {
      flex: 1;
      color: #303133;

      &.warning {
        color: #faad14;
        font-weight: 600;
      }

      &.danger {
        color: #f5222d;
        font-weight: 600;
      }
    }
  }
}
</style>
