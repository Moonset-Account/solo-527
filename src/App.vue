<script setup lang="ts">
import { onMounted } from 'vue'
import { useSystemStore } from '@/stores/systemStore'

const systemStore = useSystemStore()

onMounted(() => {
  systemStore.startPolling(30000)
})
</script>

<template>
  <div class="min-h-screen flex flex-col bg-slate-50">
    <router-view />
  </div>
</template>
