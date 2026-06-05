<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-sm">
      <div class="container py-4 flex items-center justify-between">
        <h1 class="font-bold text-lg text-gray-800">老师工作台</h1>
        <router-link to="/courses" class="text-gray-500 hover:text-purple-600">返回首页</router-link>
      </div>
    </header>
    <div class="container py-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div class="card p-4">
          <div class="text-gray-500 text-sm">今日课程</div>
          <div class="text-2xl font-bold text-gray-800">2</div>
        </div>
        <div class="card p-4">
          <div class="text-gray-500 text-sm">本月学员</div>
          <div class="text-2xl font-bold text-gray-800">15</div>
        </div>
        <div class="card p-4">
          <div class="text-gray-500 text-sm">本月课时</div>
          <div class="text-2xl font-bold text-gray-800">24</div>
        </div>
        <div class="card p-4">
          <div class="text-gray-500 text-sm">待结算</div>
          <div class="text-2xl font-bold text-purple-600">¥3,200</div>
        </div>
      </div>
      <div class="card">
        <div class="card-header">我的课程</div>
        <div class="card-body">
          <p class="text-gray-500">课程列表 - 查看课程安排、学员签到</p>
        </div>
      </div>
    </div>
  </div>
</template>
