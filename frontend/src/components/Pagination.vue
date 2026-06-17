<template>
  <div class="pagination-wrapper">
    <el-pagination
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :page-sizes="pageSizes"
      :total="total"
      layout="total, sizes, prev, pager, next, jumper"
      :background="true"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  total: number
  page?: number
  pageSize?: number
  pageSizes?: number[]
}>()

const emit = defineEmits<{
  (e: 'update:page', value: number): void
  (e: 'update:pageSize', value: number): void
  (e: 'change', params: { page: number; pageSize: number }): void
}>()

const currentPage = ref(props.page || 1)
const pageSize = ref(props.pageSize || 10)
const pageSizes = ref(props.pageSizes || [10, 20, 50, 100])

watch(() => props.page, (val) => {
  currentPage.value = val || 1
})

watch(() => props.pageSize, (val) => {
  pageSize.value = val || 10
})

function handleSizeChange(size: number) {
  pageSize.value = size
  emit('update:pageSize', size)
  emit('change', { page: currentPage.value, pageSize: size })
}

function handleCurrentChange(page: number) {
  currentPage.value = page
  emit('update:page', page)
  emit('change', { page, pageSize: pageSize.value })
}
</script>

<style lang="scss" scoped>
.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
