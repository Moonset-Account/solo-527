<script setup lang="ts">
import { SparklesOutline } from '@vicons/ionicons5'
navigateTo('/workstation', { replace: true })
</script>

<template>
  <div style="display: flex; align-items: center; justify-content: center; height: 100vh; background: #f5f7fa;">
    <n-spin size="large" description="正在进入工作台...">
      <template #icon>
        <n-icon :depth="3" size="48"><SparklesOutline /></n-icon>
      </template>
    </n-spin>
  </div>
</template>
