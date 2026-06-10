<template>
  <div class="app-pagination">
    <span class="pagination-info">
      共 {{ total }} 条，第 {{ page }}/{{ totalPages }} 页
    </span>
    <button :disabled="page <= 1" @click="goTo(page - 1)">上一页</button>
    <button
      v-for="p in visiblePages"
      :key="p"
      :class="{ active: p === page }"
      @click="goTo(p)"
    >
      {{ p }}
    </button>
    <button :disabled="page >= totalPages" @click="goTo(page + 1)">下一页</button>
    <select v-model="selectedSize" @change="changeSize">
      <option :value="10">10条/页</option>
      <option :value="20">20条/页</option>
      <option :value="50">50条/页</option>
    </select>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = withDefaults(defineProps<{
  page: number
  pageSize: number
  total: number
}>(), {
  page: 1,
  pageSize: 10,
  total: 0,
})

const emit = defineEmits<{
  (e: 'update:page', page: number): void
  (e: 'update:pageSize', size: number): void
  (e: 'change', page: number, pageSize: number): void
}>()

const selectedSize = ref(props.pageSize)

const totalPages = computed(() => {
  return Math.ceil(props.total / props.pageSize) || 1
})

const visiblePages = computed(() => {
  const pages: number[] = []
  const total = totalPages.value
  const current = props.page

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else if (current <= 4) {
    for (let i = 1; i <= 5; i++) pages.push(i)
    pages.push(total)
  } else if (current >= total - 3) {
    pages.push(1)
    for (let i = total - 4; i <= total; i++) pages.push(i)
  } else {
    pages.push(1)
    for (let i = current - 1; i <= current + 1; i++) pages.push(i)
    pages.push(total)
  }

  return pages
})

const goTo = (p: number) => {
  if (p < 1 || p > totalPages.value || p === props.page) return
  emit('update:page', p)
  emit('change', p, props.pageSize)
}

const changeSize = () => {
  emit('update:pageSize', selectedSize.value)
  emit('change', 1, selectedSize.value)
}

watch(() => props.pageSize, (val) => {
  selectedSize.value = val
})
</script>

<style lang="scss" scoped>
.app-pagination {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 16px;
  gap: 8px;

  .pagination-info {
    color: $text-secondary;
    font-size: 13px;
    margin-right: 8px;
  }

  button {
    min-width: 32px;
    height: 32px;
    padding: 0 8px;
    border: 1px solid $border-color;
    border-radius: 4px;
    background: #fff;
    color: $text-primary;
    cursor: pointer;
    font-size: 13px;

    &:hover:not(:disabled) {
      color: $primary;
      border-color: $primary;
    }

    &.active {
      background: $primary;
      color: #fff;
      border-color: $primary;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  select {
    height: 32px;
    padding: 0 8px;
    border: 1px solid $border-color;
    border-radius: 4px;
    background: #fff;
    color: $text-primary;
    font-size: 13px;
    cursor: pointer;
  }
}
</style>
