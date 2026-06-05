<template>
  <div class="mobile-layout">
    <van-nav-bar
      :title="pageTitle"
      left-arrow
      :fixed="true"
      :placeholder="true"
      safe-area-inset-top
      @click-left="handleBack"
    >
      <template #right>
        <van-icon name="search" size="20" @click="handleSearch" />
      </template>
    </van-nav-bar>

    <div class="mobile-content">
      <router-view v-slot="{ Component }">
        <keep-alive>
          <component :is="Component" />
        </keep-alive>
      </router-view>
    </div>

    <van-tabbar v-model="activeTab" route fixed safe-area-inset-bottom>
      <van-tabbar-item to="/m/home" icon="home-o">首页</van-tabbar-item>
      <van-tabbar-item to="/m/books" icon="records">图书</van-tabbar-item>
      <van-tabbar-item to="/m/scan" icon="scan">扫码</van-tabbar-item>
      <van-tabbar-item to="/m/reservations" icon="bookmark-o">预留</van-tabbar-item>
      <van-tabbar-item to="/m/profile" icon="user-o">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const activeTab = ref('/m/home')

const pageTitle = computed(() => route.meta.title || '独立书店')

const handleBack = () => {
  if (route.path === '/m/home' || route.path === '/m/books' || 
      route.path === '/m/scan' || route.path === '/m/reservations' || 
      route.path === '/m/profile') {
    return
  }
  router.back()
}

const handleSearch = () => {
  router.push('/m/books')
}

watch(() => route.path, (path) => {
  if (path.startsWith('/m/home')) activeTab.value = '/m/home'
  else if (path.startsWith('/m/books')) activeTab.value = '/m/books'
  else if (path.startsWith('/m/scan')) activeTab.value = '/m/scan'
  else if (path.startsWith('/m/reservations')) activeTab.value = '/m/reservations'
  else if (path.startsWith('/m/profile')) activeTab.value = '/m/profile'
})
</script>

<style lang="scss" scoped>
.mobile-layout {
  min-height: 100vh;
  background-color: #f7f8fa;
  padding-bottom: 56px;
}

.mobile-content {
  padding: 12px;
  min-height: calc(100vh - 106px);
}
</style>
