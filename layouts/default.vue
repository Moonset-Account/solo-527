<template>
  <div class="flex h-screen bg-slate-50 overflow-hidden">
    <Sidebar v-if="!isLoginPage" />
    <div class="flex-1 flex flex-col overflow-hidden">
      <Header v-if="!isLoginPage" />
      <main class="flex-1 overflow-y-auto scrollbar-thin p-6">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const route = useRoute()
const isLoginPage = computed(() => route.path === '/login')
</script>
