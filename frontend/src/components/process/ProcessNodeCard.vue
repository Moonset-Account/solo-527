<template>
  <el-card shadow="hover" class="process-node-card">
    <div class="node-header">
      <span class="node-name">{{ node.name }}</span>
      <el-tag size="small" type="info">顺序: {{ node.order }}</el-tag>
    </div>
    <div class="node-body">
      <div class="node-tags">
        <el-tag v-if="node.roleName" size="small" type="primary">{{ node.roleName }}</el-tag>
        <el-tag size="small" :type="node.assignType === 'ROLE' ? '' : 'success'">
          {{ node.assignType === 'ROLE' ? '按角色' : '指定人' }}
        </el-tag>
      </div>
      <el-tooltip v-if="node.autoReminder" :content="`自动提醒: ${node.reminderHours}小时`" placement="top">
        <el-icon class="reminder-icon"><Bell /></el-icon>
      </el-tooltip>
    </div>
    <div class="node-actions">
      <el-button type="primary" link size="small" @click="$emit('edit', node)">编辑</el-button>
      <el-button type="danger" link size="small" @click="$emit('delete', node)">删除</el-button>
    </div>
  </el-card>
</template>

<script setup>
import { Bell } from '@element-plus/icons-vue'

defineProps({
  node: { type: Object, required: true }
})

defineEmits(['edit', 'delete'])
</script>

<style scoped>
.process-node-card {
  margin-bottom: 12px;
  cursor: grab;
}

.process-node-card:active {
  cursor: grabbing;
}

.node-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.node-name {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.node-body {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.node-tags {
  display: flex;
  gap: 8px;
}

.reminder-icon {
  font-size: 18px;
  color: #e6a23c;
}

.node-actions {
  display: flex;
  gap: 8px;
}
</style>
