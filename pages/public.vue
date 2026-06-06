<template>
  <div class="min-h-screen bg-gradient-to-br from-green-50 to-teal-100">
    <header class="bg-white shadow-sm">
      <div class="max-w-6xl mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <h1 class="text-2xl font-bold text-green-600">🌱 垃圾分类公开数据看板</h1>
          <NuxtLink to="/login" class="text-sm text-gray-500 hover:text-green-600">
            工作人员登录 →
          </NuxtLink>
        </div>
      </div>
    </header>
    
    <main class="max-w-6xl mx-auto px-4 py-8">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div class="bg-white rounded-xl shadow-sm p-6 text-center">
          <div class="text-4xl mb-2">📊</div>
          <p class="text-3xl font-bold text-blue-600">{{ data?.summary?.totalTasks || 0 }}</p>
          <p class="text-sm text-gray-500 mt-1">累计督办任务</p>
        </div>
        <div class="bg-white rounded-xl shadow-sm p-6 text-center">
          <div class="text-4xl mb-2">✅</div>
          <p class="text-3xl font-bold text-green-600">{{ data?.summary?.closedTasks || 0 }}</p>
          <p class="text-sm text-gray-500 mt-1">已完成整改</p>
        </div>
        <div class="bg-white rounded-xl shadow-sm p-6 text-center">
          <div class="text-4xl mb-2">📈</div>
          <p class="text-3xl font-bold text-orange-600">{{ data?.summary?.completionRate || 0 }}%</p>
          <p class="text-sm text-gray-500 mt-1">整改完成率</p>
        </div>
        <div class="bg-white rounded-xl shadow-sm p-6 text-center">
          <div class="text-4xl mb-2">📍</div>
          <p class="text-3xl font-bold text-teal-600">{{ data?.summary?.totalPoints || 0 }}</p>
          <p class="text-sm text-gray-500 mt-1">分类点位</p>
        </div>
      </div>
      
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white rounded-xl shadow-sm p-6">
          <h2 class="text-lg font-semibold text-gray-800 mb-4">各社区工作进度</h2>
          <div class="space-y-4">
            <div v-for="item in data?.communityStats" :key="item._id" class="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
              <div class="flex justify-between items-center mb-2">
                <span class="font-medium text-gray-800">{{ item._id }}</span>
                <span class="text-sm text-gray-500">
                  {{ item.closed }} / {{ item.total }} 件
                </span>
              </div>
              <div class="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  class="h-full bg-green-500 rounded-full transition-all duration-500"
                  :style="{ width: item.completionRate + '%' }"
                ></div>
              </div>
              <div class="flex justify-between mt-2 text-xs text-gray-500">
                <span>完成率: {{ item.completionRate }}%</span>
                <span>误投 {{ item.typeBreakdown?.missedSort || 0 }} · 桶满 {{ item.typeBreakdown?.binFull || 0 }} · 破损 {{ item.typeBreakdown?.pointDamaged || 0 }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-xl shadow-sm p-6">
          <h2 class="text-lg font-semibold text-gray-800 mb-4">近30日趋势</h2>
          <div class="h-64 flex items-end justify-around">
            <div v-for="item in data?.dailyTrend?.slice(-14)" :key="item._id" class="flex flex-col items-center">
              <div class="flex flex-col items-end space-y-1 h-40 justify-end">
                <div class="w-6 bg-green-400 rounded-t" :style="{ height: (item.closed / maxTrend) * 120 + 'px' }"></div>
                <div class="w-6 bg-blue-400" :style="{ height: Math.max(0, (item.submitted - item.closed) / maxTrend) * 120 + 'px' }"></div>
              </div>
              <span class="text-xs text-gray-500 mt-2" v-if="item._id">{{ item._id.slice(8) }}</span>
            </div>
          </div>
          <div class="flex justify-center space-x-6 mt-4">
            <div class="flex items-center space-x-2">
              <div class="w-4 h-4 bg-blue-400"></div>
              <span class="text-sm text-gray-600">新增上报</span>
            </div>
            <div class="flex items-center space-x-2">
              <div class="w-4 h-4 bg-green-400"></div>
              <span class="text-sm text-gray-600">完成整改</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="mt-8 text-center text-sm text-gray-400">
        <p>数据每小时自动更新 · 仅展示社区级聚合统计数据，不包含个人信息和居民照片</p>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
const data = ref<any>(null)

const fetchData = async () => {
  try {
    data.value = await $fetch('/api/stats/public')
  } catch (e) {
    console.error('Failed to fetch public stats:', e)
  }
}

const maxTrend = computed(() => {
  if (!data.value?.dailyTrend?.length) return 1
  return Math.max(...data.value.dailyTrend.map((item: any) => item.submitted || 1), 1)
})

onMounted(() => {
  fetchData()
})
</script>
