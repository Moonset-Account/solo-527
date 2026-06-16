<script setup lang="ts">
import { useRouter } from 'vue-router'
import { onMounted } from 'vue'

const router = useRouter()

onMounted(() => {
  router.replace('/dashboard')
})
</script>

<template>
  <div class="flex items-center justify-center min-h-screen">
    <p>正在跳转...</p>
  </div>
</template>
