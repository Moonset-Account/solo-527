<template>
  <div>
    <h2 class="text-xl font-bold text-gray-800 mb-6">消息通知</h2>
    <div class="space-y-3">
      <div v-for="i in 3" :key="i" class="card p-4">
        <div class="flex items-start justify-between">
          <div>
            <h3 class="font-medium text-gray-800">系统通知 {{ i }}</h3>
            <p class="text-sm text-gray-500 mt-1">您的报名已通过审核，请及时完成支付</p>
          </div>
          <span class="text-xs text-gray-400">1小时前</span>
        </div>
      </div>
    </div>
  </div>
</template>
