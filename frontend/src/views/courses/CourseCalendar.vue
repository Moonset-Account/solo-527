<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-sm">
      <div class="container py-4">
        <router-link to="/courses" class="text-gray-500 hover:text-purple-600 flex items-center">
          <span class="mr-1">←</span> 返回课程
        </router-link>
      </div>
    </header>
    <main class="container py-8">
      <h1 class="text-2xl font-bold text-gray-800 mb-6">课程日历</h1>
      <div class="card p-6 text-center text-gray-500">
        <div class="text-5xl mb-4">📅</div>
        <p>课程日历页面 - 按月查看课程安排</p>
      </div>
    </main>
  </div>
</template>
