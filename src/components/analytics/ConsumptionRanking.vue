<script setup lang="ts">
import { computed } from 'vue'
import { Trophy, Package } from 'lucide-vue-next'
import { useAnalyticsStore } from '@/stores/analytics'

const analyticsStore = useAnalyticsStore()

const rankColors = ['bg-rosegold text-white', 'bg-rosegold/60 text-white', 'bg-rosegold/30 text-white']

function getRankClass(rank: number) {
  return rank <= 3 ? rankColors[rank - 1] : 'bg-gray-100 text-grayrose'
}
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <div
      v-for="item in analyticsStore.consumptionRanking"
      :key="item.id"
      class="bg-white rounded-xl border border-rosegold/10 p-4 hover:border-rosegold/20 transition-colors"
    >
      <div class="flex items-center gap-3 mb-3">
        <span
          :class="['w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold', getRankClass(item.rank)]"
        >
          {{ item.rank }}
        </span>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-800 truncate">{{ item.productName }}</p>
          <p class="text-xs text-grayrose">{{ item.category }}</p>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div class="bg-warmwhite rounded-lg p-2 text-center">
          <p class="text-xs text-grayrose">消耗量</p>
          <p class="text-sm font-medium text-gray-800">{{ item.totalConsumed }}</p>
        </div>
        <div class="bg-warmwhite rounded-lg p-2 text-center">
          <p class="text-xs text-grayrose">总金额</p>
          <p class="text-sm font-medium text-rosegold">¥{{ item.totalAmount.toLocaleString() }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
