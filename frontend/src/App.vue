<template>
  <div id="app" :class="{ 'is-mobile': isMobile }">
    <router-view />
  </div>
</template>

<script setup>
import { inject, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from './stores/user'
import { initOfflineQueue, processOfflineQueue } from './utils/offline'

const isMobile = inject('isMobile')
const route = useRoute()
const userStore = useUserStore()

onMounted(() => {
  const token = localStorage.getItem('token')
  if (token) {
    userStore.fetchUserInfo().catch(() => {
      localStorage.removeItem('token')
    })
  }
  initOfflineQueue()
  window.addEventListener('online', handleOnline)
})

onUnmounted(() => {
  window.removeEventListener('online', handleOnline)
})

const handleOnline = () => {
  processOfflineQueue()
}
</script>

<style lang="scss">
#app {
  min-height: 100vh;
  background-color: #f5f7fa;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.is-mobile {
  background-color: #f7f8fa;
}
</style>
