<template>
  <div class="empty-state">
    <el-empty :description="description">
      <template #image>
        <img :src="imageUrl" alt="empty" />
      </template>
      <template #default>
        <p class="empty-desc">{{ description }}</p>
        <slot name="action"></slot>
      </template>
    </el-empty>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  description?: string
  type?: 'order' | 'data' | 'search' | 'default'
}>()

const imageUrl = computed(() => {
  return 'https://images.unsplash.com/photo-1586769852044-692d6e3703f0?w=200&h=200&fit=crop'
})

const description = computed(() => {
  if (props.description) return props.description
  switch (props.type) {
    case 'order':
      return '暂无订单'
    case 'data':
      return '暂无数据'
    case 'search':
      return '未找到相关结果'
    default:
      return '暂无数据'
  }
})
</script>

<style lang="scss" scoped>
.empty-state {
  padding: 60px 0;
  text-align: center;

  .empty-desc {
    color: #909399;
    margin-top: 8px;
  }
}
</style>
