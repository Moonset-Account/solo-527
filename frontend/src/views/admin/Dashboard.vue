<template>
  <div>
    <h2 class="text-xl font-bold text-gray-800 mb-6">数据概览</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="card p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm">今日报名</p>
            <p class="text-2xl font-bold text-gray-800 mt-1">12</p>
          </div>
          <div class="text-3xl">📋</div>
        </div>
        <p class="text-green-500 text-xs mt-2">↑ 20% 较昨日</p>
      </div>
      <div class="card p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm">今日营收</p>
            <p class="text-2xl font-bold text-gray-800 mt-1">¥5,680</p>
          </div>
          <div class="text-3xl">💰</div>
        </div>
        <p class="text-green-500 text-xs mt-2">↑ 15% 较昨日</p>
      </div>
      <div class="card p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm">在学学员</p>
            <p class="text-2xl font-bold text-gray-800 mt-1">156</p>
          </div>
          <div class="text-3xl">👥</div>
        </div>
        <p class="text-blue-500 text-xs mt-2">本月新增 18 人</p>
      </div>
      <div class="card p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm">待办事项</p>
            <p class="text-2xl font-bold text-orange-500 mt-1">8</p>
          </div>
          <div class="text-3xl">📝</div>
        </div>
        <p class="text-orange-500 text-xs mt-2">3 个待审批</p>
      </div>
    </div>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="card">
        <div class="card-header">待处理报名</div>
        <div class="card-body">
          <p class="text-gray-500">最近待审批的报名列表</p>
        </div>
      </div>
      <div class="card">
        <div class="card-header">库存预警</div>
        <div class="card-body">
          <p class="text-gray-500">库存不足的材料包列表</p>
        </div>
      </div>
    </div>
  </div>
</template>
