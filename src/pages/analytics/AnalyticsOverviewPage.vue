<script setup lang="ts">
import { BarChart3 } from 'lucide-vue-next'
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-lg bg-rosegold/10 flex items-center justify-center">
        <BarChart3 class="w-5 h-5 text-rosegold" />
      </div>
      <div>
        <h1 class="text-xl font-semibold text-gray-800">消耗分析</h1>
        <p class="text-sm text-grayrose">多维度分析耗材消耗情况</p>
      </div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <router-link
        v-for="item in [
          { path: '/analytics/commission', label: '顾问提成', desc: '查看顾问服务提成统计', color: 'bg-rosegold/10' },
          { path: '/analytics/pricing', label: '项目价格', desc: '分析服务定价与成本', color: 'bg-mint/10' },
          { path: '/analytics/consumption', label: '耗材排行', desc: '查看耗材消耗排名', color: 'bg-amber-50' },
          { path: '/analytics/anomaly', label: '异常追溯', desc: '追溯异常消耗记录', color: 'bg-coral/10' },
        ]"
        :key="item.path"
        :to="item.path"
        class="bg-white rounded-xl border border-rosegold/10 p-5 hover:border-rosegold/20 transition-all hover:shadow-sm"
      >
        <div :class="['w-10 h-10 rounded-lg flex items-center justify-center mb-3', item.color]">
          <BarChart3 class="w-5 h-5 text-rosegold" />
        </div>
        <h3 class="text-base font-medium text-gray-800">{{ item.label }}</h3>
        <p class="text-sm text-grayrose mt-1">{{ item.desc }}</p>
      </router-link>
    </div>
  </div>
</template>
