<template>
  <el-card shadow="hover" class="requirement-card" @click="$emit('click', requirement)">
    <div class="card-title">{{ requirement.title }}</div>
    <div class="card-tags">
      <el-tag :type="priorityTagType" size="small">{{ priorityLabel }}</el-tag>
      <el-tag :type="statusTagType" size="small">{{ statusLabel }}</el-tag>
    </div>
    <div class="card-info">
      <span v-if="requirement.assigneeId">负责人: {{ requirement.assigneeId }}</span>
      <span v-if="requirement.deadline">截止: {{ formatDate(requirement.deadline) }}</span>
    </div>
  </el-card>
</template>

<script setup>
import { computed } from 'vue'
import { formatDate, getPriorityTag, getStatusTag } from '@/utils'

const props = defineProps({
  requirement: {
    type: Object,
    required: true
  }
})

defineEmits(['click'])

const priorityMap = { URGENT: '紧急', HIGH: '高', MEDIUM: '中', LOW: '低' }
const statusMap = { DRAFT: '草稿', SUBMITTED: '已提交', IN_PROGRESS: '进行中', COMPLETED: '已完成', DELAYED: '延期', CLOSED: '已关闭' }

const priorityLabel = computed(() => priorityMap[props.requirement.priority] || props.requirement.priority)
const statusLabel = computed(() => statusMap[props.requirement.status] || props.requirement.status)
const priorityTagType = computed(() => getPriorityTag(props.requirement.priority))
const statusTagType = computed(() => getStatusTag(props.requirement.status))
</script>

<style scoped>
.requirement-card {
  cursor: pointer;
  transition: box-shadow 0.2s;
}

.requirement-card:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-tags {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.card-info {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #909399;
}
</style>
