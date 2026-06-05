<template>
  <div>
    <h2 class="text-xl font-bold text-gray-800 mb-6">我的作品</h2>
    <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
      <div v-for="i in 3" :key="i" class="card overflow-hidden">
        <div class="aspect-square bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
          <span class="text-5xl opacity-50">🏺</span>
        </div>
        <div class="p-3">
          <h3 class="font-medium text-gray-800">我的作品 {{ i }}</h3>
          <p class="text-sm text-gray-500">待审核</p>
        </div>
      </div>
    </div>
    <router-link to="/my/artworks/upload" class="btn btn-primary mt-6 inline-block">
      + 上传新作品
    </router-link>
  </div>
</template>
