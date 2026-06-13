<template>
  <el-timeline>
    <el-timeline-item
      v-for="(item, index) in list"
      :key="index"
      :type="getItemType(item)"
      :timestamp="formatDate(item.operatedAt || item.createdAt || item.reviewedAt)"
      placement="top"
    >
      <div class="timeline-content">
        <div class="timeline-header">
          <strong>{{ item.operator || item.reviewer || '系统' }}</strong>
          <el-tag size="small" :type="getItemType(item)">{{ getActionText(item) }}</el-tag>
        </div>
        <div class="timeline-detail" v-if="item.remark || item.comment">
          {{ item.remark || item.comment }}
        </div>
        <div class="timeline-detail" v-if="item.field && item.field !== 'review'">
          <span class="timeline-label">{{ getFieldLabel(item.field) }}：</span>
          <span class="timeline-old" v-if="item.oldValue">{{ formatValue(item.oldValue) }}</span>
          <span class="timeline-arrow" v-if="item.oldValue && item.newValue"> → </span>
          <span class="timeline-new">{{ formatValue(item.newValue) }}</span>
        </div>
      </div>
    </el-timeline-item>
  </el-timeline>
</template>

<script setup>
import { CONTENT_STATUS, formatDate, getStatusLabel } from '@/utils/constants'

const props = defineProps({
  list: {
    type: Array,
    default: () => []
  }
})

function getItemType(item) {
  if (item.action === 'approve' || (item.field === 'status' && ['approved', 'published'].includes(item.newValue))) return 'success'
  if (item.action === 'reject' || (item.field === 'status' && ['rejected', 'publish_failed'].includes(item.newValue))) return 'danger'
  if (item.action === 'transfer' || (item.field === 'status' && ['submitted', 'reviewing'].includes(item.newValue))) return 'warning'
  return 'primary'
}

function getActionText(item) {
  if (item.action === 'approve') return '通过'
  if (item.action === 'reject') return '驳回'
  if (item.action === 'transfer') return '转交'
  if (item.field === 'status') return getStatusLabel(item.newValue) || '状态变更'
  if (item.field === 'deletedAt') return '删除'
  if (item.field === 'exceptionConclusion') return '异常处理'
  return '修改'
}

function getFieldLabel(field) {
  const map = {
    status: '状态',
    title: '标题',
    topic: '选题',
    script: '脚本',
    assignee: '负责人',
    remark: '备注'
  }
  return map[field] || field
}

function formatValue(val) {
  if (val === null || val === undefined || val === '') return '-'
  if (CONTENT_STATUS[val]) return getStatusLabel(val)
  if (typeof val === 'object') return JSON.stringify(val)
  return String(val)
}
</script>

<style scoped lang="scss">
.timeline-content {
  .timeline-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
  }
  .timeline-detail {
    font-size: 13px;
    color: #606266;
    .timeline-label {
      color: #909399;
    }
    .timeline-old {
      color: #f56c6c;
      text-decoration: line-through;
    }
    .timeline-arrow {
      margin: 0 4px;
    }
    .timeline-new {
      color: #67c23a;
    }
  }
}
</style>
