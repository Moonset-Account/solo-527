<template>
  <div class="flex items-center justify-center min-h-screen">
    <div class="text-slate-400">跳转中...</div>
  </div>
</template>

<script setup lang="ts">
const authStore = useAuthStore()

onMounted(() => {
  navigateTo(authStore.isAuthenticated ? '/dashboard' : '/login')
})
</script>
