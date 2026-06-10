<template>
  <div class="search-bar">
    <div class="search-fields">
      <slot></slot>
    </div>
    <div class="search-actions">
      <button class="btn btn-primary" @click="handleSearch">
        🔍 查询
      </button>
      <button class="btn btn-default" @click="handleReset">
        重置
      </button>
      <slot name="extra"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  (e: 'search'): void
  (e: 'reset'): void
}>()

const handleSearch = () => {
  emit('search')
}

const handleReset = () => {
  emit('reset')
}
</script>

<style lang="scss" scoped>
.search-bar {
  background: #fff;
  border-radius: $border-radius;
  padding: 16px 20px;
  margin-bottom: 16px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.search-fields {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  flex: 1;

  :deep(.form-item) {
    margin-bottom: 0;
    min-width: 180px;
  }
}

.search-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}
</style>
