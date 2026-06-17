<template>
  <div class="order-timeline">
    <el-timeline>
      <el-timeline-item
        v-for="(item, index) in progress"
        :key="index"
        :timestamp="item.time"
        placement="top"
        :type="index === 0 ? 'primary' : ''"
      >
        <div class="timeline-content">
          <span class="status-text">{{ item.statusText }}</span>
          <p v-if="item.description" class="desc">{{ item.description }}</p>
        </div>
      </el-timeline-item>
    </el-timeline>
  </div>
</template>

<script setup lang="ts">
import type { OrderProgress } from '@/api/order'

defineProps<{
  progress: OrderProgress[]
}>()
</script>

<style lang="scss" scoped>
.order-timeline {
  padding: 20px 0;

  .timeline-content {
    .status-text {
      font-weight: 600;
      color: #303133;
    }

    .desc {
      margin: 4px 0 0 0;
      color: #909399;
      font-size: 13px;
    }
  }
}
</style>
