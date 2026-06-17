<template>
  <div class="status-badge" :class="statusType">
    {{ statusText }}
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ORDER_STATUS_MAP } from '@/utils/constants'

const props = defineProps<{
  status: string
}>()

const statusText = computed(() => {
  return ORDER_STATUS_MAP[props.status]?.label || props.status
})

const statusType = computed(() => {
  return ORDER_STATUS_MAP[props.status]?.type || 'info'
})
</script>

<style lang="scss" scoped>
.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;

  &.warning {
    background-color: #fdf6ec;
    color: #e6a23c;
  }

  &.primary {
    background-color: #ecf5ff;
    color: #409eff;
  }

  &.success {
    background-color: #f0f9eb;
    color: #67c23a;
  }

  &.info {
    background-color: #f4f4f5;
    color: #909399;
  }

  &.danger {
    background-color: #fef0f0;
    color: #f56c6c;
  }
}
</style>
