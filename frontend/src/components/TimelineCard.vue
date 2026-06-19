<template>
  <div class="timeline-card">
    <el-timeline>
      <el-timeline-item
        v-for="(item, index) in items"
        :key="index"
        :timestamp="item.createTime"
        :color="item.color || getDefaultColor(item.type)"
        placement="top"
      >
        <el-card shadow="hover" class="timeline-item-card">
          <div class="timeline-header">
            <span class="timeline-type">{{ getTypeLabel(item.type) }}</span>
            <span class="timeline-operator">{{ item.operatorName }}</span>
            <span v-if="item.processDuration" class="timeline-duration">
              耗时：{{ item.processDuration }}
            </span>
          </div>
          <div class="timeline-title">{{ item.title }}</div>
          <div class="timeline-content">{{ item.content }}</div>
          <div class="timeline-references">
            <el-tag v-if="item.contractReference" size="small" type="info" class="ref-tag">
              合同：{{ item.contractReference }}
            </el-tag>
            <el-tag v-if="item.stageReference" size="small" type="warning" class="ref-tag">
              阶段：{{ item.stageReference }}
            </el-tag>
            <el-tag v-if="item.sourceReference" size="small" type="success" class="ref-tag">
              来源：{{ item.sourceReference }}
            </el-tag>
          </div>
        </el-card>
      </el-timeline-item>
    </el-timeline>
    <el-empty v-if="!items || items.length === 0" description="暂无记录" />
  </div>
</template>

<script setup>
defineProps({
  items: {
    type: Array,
    default: () => []
  }
})

const typeMap = {
  follow: '跟进',
  approval: '审批',
  contract: '合同',
  payment: '回款',
  system: '系统'
}

const getTypeLabel = (type) => {
  return typeMap[type] || type || '其他'
}

const getDefaultColor = (type) => {
  const colorMap = {
    follow: '#409EFF',
    approval: '#E6A23C',
    contract: '#67C23A',
    payment: '#F56C6C',
    system: '#909399'
  }
  return colorMap[type] || '#409EFF'
}
</script>

<style lang="scss" scoped>
.timeline-card {
  padding: 16px;

  .timeline-item-card {
    margin-bottom: 8px;

    .timeline-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
      font-size: 12px;
      color: #909399;

      .timeline-type {
        font-weight: 600;
        color: #303133;
      }
    }

    .timeline-title {
      font-size: 14px;
      font-weight: 600;
      color: #303133;
      margin-bottom: 8px;
    }

    .timeline-content {
      font-size: 13px;
      color: #606266;
      line-height: 1.6;
      margin-bottom: 8px;
    }

    .timeline-references {
      .ref-tag {
        margin-right: 8px;
      }
    }
  }
}
</style>
