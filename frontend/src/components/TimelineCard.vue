<template>
  <div class="timeline-card">
    <el-timeline>
      <el-timeline-item
        v-for="(item, index) in items"
        :key="index"
        :timestamp="formatDateTime(item.createTime)"
        :color="item.color || getDefaultColor(item.type)"
        placement="top"
      >
        <el-card shadow="hover" class="timeline-item-card">
          <div class="timeline-header">
            <span class="timeline-type">{{ item.typeName || getTypeLabel(item.type) }}</span>
            <span class="timeline-operator">{{ item.operatorName }}</span>
            <span v-if="item.processDuration" class="timeline-duration">
              耗时：{{ formatDuration(item.processDuration) }}
            </span>
          </div>
          <div v-if="item.title" class="timeline-title">{{ item.title }}</div>
          <div class="timeline-content">{{ item.content }}</div>
          <div v-if="item.attachments && item.attachments.length > 0" class="timeline-attachments">
            <div class="attachments-label">附件：</div>
            <div class="attachments-list">
              <div
                v-for="file in item.attachments"
                :key="file.id"
                class="attachment-item"
                @click="previewAttachment(file)"
              >
                <el-icon><Paperclip /></el-icon>
                <span class="attachment-name">{{ file.fileName }}</span>
                <span class="attachment-size">({{ formatFileSize(file.fileSize) }})</span>
              </div>
            </div>
          </div>
          <div class="timeline-references">
            <el-tag v-if="item.contractReference" size="small" type="info" class="ref-tag" effect="light">
              合同：{{ item.contractReference }}
            </el-tag>
            <el-tag v-if="item.stageReference" size="small" type="warning" class="ref-tag" effect="light">
              阶段：{{ getStageLabel(item.stageReference) }}
            </el-tag>
            <el-tag v-if="item.sourceReference" size="small" type="success" class="ref-tag" effect="light">
              来源：{{ getSourceLabel(item.sourceReference) }}
            </el-tag>
          </div>
        </el-card>
      </el-timeline-item>
    </el-timeline>
    <el-empty v-if="!items || items.length === 0" description="暂无记录" />
  </div>
</template>

<script setup>
import { Paperclip } from '@element-plus/icons-vue'
import { formatDateTime, formatDuration, formatFileSize } from '@/utils/format'
import { getFollowStageName, getLeadSourceName } from '@/utils/dict'

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
  system: '系统',
  PHONE: '电话跟进',
  VISIT: '上门拜访',
  MEASURE: '量房',
  QUOTE: '报价',
  SIGN: '签约'
}

const getTypeLabel = (type) => {
  return typeMap[type] || type || '其他'
}

const getStageLabel = (stage) => {
  return getFollowStageName(stage) || stage
}

const getSourceLabel = (source) => {
  return getLeadSourceName(source) || source
}

const getDefaultColor = (type) => {
  const colorMap = {
    follow: '#409EFF',
    approval: '#E6A23C',
    contract: '#67C23A',
    payment: '#F56C6C',
    system: '#909399',
    PHONE: '#52c41a',
    VISIT: '#faad14',
    MEASURE: '#722ed1',
    QUOTE: '#eb2f96',
    SIGN: '#13c2c2'
  }
  return colorMap[type] || '#409EFF'
}

const previewAttachment = (file) => {
  const url = `/uploads/${file.filePath}`
  window.open(url, '_blank')
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
        font-size: 13px;
      }

      .timeline-duration {
        margin-left: auto;
        color: #909399;
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
      margin-bottom: 10px;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .timeline-attachments {
      margin-bottom: 10px;
      padding: 8px 12px;
      background: #f5f7fa;
      border-radius: 4px;

      .attachments-label {
        font-size: 12px;
        color: #909399;
        margin-bottom: 6px;
      }

      .attachments-list {
        .attachment-item {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 0;
          font-size: 12px;
          color: #409EFF;
          cursor: pointer;

          &:hover {
            text-decoration: underline;
          }

          .attachment-name {
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .attachment-size {
            color: #909399;
            flex-shrink: 0;
          }
        }
      }
    }

    .timeline-references {
      .ref-tag {
        margin-right: 8px;
      }
    }
  }
}
</style>
