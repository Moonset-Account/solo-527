<script setup lang="ts">
const router = useRouter()
onMounted(() => {
  router.replace('/dashboard')
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="text-center">
      <div class="animate-spin w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full mx-auto mb-4"></div>
      <div class="text-gray-500">加载中...</div>
    </div>
  </div>
</template>
