<script setup lang="ts">
import { computed } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

interface Props {
  currentPage: number
  totalPages: number
  totalItems?: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:currentPage': [page: number]
  'change': [page: number]
}>()

const canGoPrev = computed(() => props.currentPage > 1)
const canGoNext = computed(() => props.currentPage < props.totalPages)

function goToPrev() {
  if (canGoPrev.value) {
    const newPage = props.currentPage - 1
    emit('update:currentPage', newPage)
    emit('change', newPage)
  }
}

function goToNext() {
  if (canGoNext.value) {
    const newPage = props.currentPage + 1
    emit('update:currentPage', newPage)
    emit('change', newPage)
  }
}
</script>

<template>
  <div class="flex items-center justify-between">
    <div v-if="totalItems !== undefined" class="text-sm text-gray-500">
      共 {{ totalItems }} 条记录
    </div>
    <div v-else class="flex-1" />
    
    <div class="flex items-center gap-4">
      <span class="text-sm text-gray-600">
        第 {{ currentPage }} / {{ totalPages }} 页
      </span>
      
      <div class="flex items-center gap-1">
        <button
          @click="goToPrev"
          :disabled="!canGoPrev"
          class="inline-flex items-center justify-center w-9 h-9 rounded-lg border transition-all duration-200"
          :class="[
            canGoPrev
              ? 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
              : 'border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50'
          ]"
        >
          <ChevronLeft class="w-4 h-4" />
        </button>
        
        <button
          @click="goToNext"
          :disabled="!canGoNext"
          class="inline-flex items-center justify-center w-9 h-9 rounded-lg border transition-all duration-200"
          :class="[
            canGoNext
              ? 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
              : 'border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50'
          ]"
        >
          <ChevronRight class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>
